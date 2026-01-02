import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useMemo, useCallback } from 'react';
import * as Location from 'expo-location';
import { Event, EventCategory, UserPrefs, CatalogEventWithDistance, NearbyFilters, UserLocation, CatalogEvent, InterestedEvent } from '@/types';
import { GUARDIANS_2025_HOME_GAMES } from '@/constants/guardians-schedule';
import { CATALOG_EVENTS } from '@/constants/catalog-events';
import { VENUE_SURGE_MULTIPLIERS } from '@/constants/venues';
import * as Calendar from 'expo-calendar';
import { syncEventToCalendar, deleteEventFromCalendar, updateCalendarEvent, getAvailableCalendars, importEventsFromCalendar } from '@/utils/calendar-sync';
import { discoverEvents, EventDiscoveryFilters } from '@/utils/event-discovery';
import { registerForPushNotifications, scheduleEventNotification, cancelNotification } from '@/utils/notifications';
import { safeGetItem, safeSetItem } from '@/utils/storage-helpers';

const STORAGE_KEY_EVENTS = '@calendar_events';
const STORAGE_KEY_PREFS = '@user_prefs';
const STORAGE_KEY_LOCATION = '@user_location';
const STORAGE_KEY_INTERESTED = '@interested_events';
const STORAGE_KEY_NOT_INTERESTED = '@not_interested_events';

const DEFAULT_PREFS: UserPrefs = {
  favoriteGenres: [],
  favoriteTeams: ['Cleveland Guardians'],
  defaultArrivalBufferMin: 90,
  defaultReturnBufferMin: 30,
};

export const [EventsProvider, useEvents] = createContextHook(() => {
  const [events, setEvents] = useState<Event[]>([]);
  const [userPrefs, setUserPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [discoveredEvents, setDiscoveredEvents] = useState<CatalogEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [interestedEvents, setInterestedEvents] = useState<InterestedEvent[]>([]);
  const [notInterestedIds, setNotInterestedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
    loadLocation();
    loadInterestData();
    registerForPushNotifications();
  }, []);

  const loadData = async () => {
    try {
      const [eventsData, prefsData] = await Promise.all([
        safeGetItem<Event[]>(STORAGE_KEY_EVENTS),
        safeGetItem<UserPrefs>(STORAGE_KEY_PREFS),
      ]);

      if (eventsData && Array.isArray(eventsData)) {
        setEvents(eventsData);
      }

      if (prefsData) {
        setUserPrefs(prefsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const loadLocation = async () => {
    try {
      const storedLocation = await safeGetItem<UserLocation>(STORAGE_KEY_LOCATION);
      if (storedLocation) {
        setUserLocation(storedLocation);
      }
    } catch (error) {
      console.error('Failed to load location:', error);
    }
  };

  const loadInterestData = async () => {
    try {
      const [interestedData, notInterestedData] = await Promise.all([
        safeGetItem<InterestedEvent[]>(STORAGE_KEY_INTERESTED),
        safeGetItem<string[]>(STORAGE_KEY_NOT_INTERESTED),
      ]);

      if (interestedData && Array.isArray(interestedData)) {
        setInterestedEvents(interestedData);
      }

      if (notInterestedData && Array.isArray(notInterestedData)) {
        setNotInterestedIds(new Set(notInterestedData));
      }
    } catch (error) {
      console.error('Failed to load interest data:', error);
    }
  };

  const requestLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Location permission denied');
        const fallbackLocation: UserLocation = {
          lat: 41.4993,
          lng: -81.6944,
          granted: false,
        };
        setUserLocation(fallbackLocation);
        await safeSetItem(STORAGE_KEY_LOCATION, fallbackLocation);
        return fallbackLocation;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newLocation: UserLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        granted: true,
      };
      
      setUserLocation(newLocation);
      await safeSetItem(STORAGE_KEY_LOCATION, newLocation);
      return newLocation;
    } catch (error) {
      console.error('Failed to get location:', error);
      const fallbackLocation: UserLocation = {
        lat: 41.4993,
        lng: -81.6944,
        granted: false,
      };
      setUserLocation(fallbackLocation);
      return fallbackLocation;
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const saveEvents = async (newEvents: Event[]) => {
    try {
      await safeSetItem(STORAGE_KEY_EVENTS, newEvents);
      setEvents(newEvents);
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  };

  const savePrefs = async (newPrefs: UserPrefs) => {
    try {
      await safeSetItem(STORAGE_KEY_PREFS, newPrefs);
      setUserPrefs(newPrefs);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const addEvent = useCallback(async (event: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const calendarEventId = await syncEventToCalendar(newEvent);
    if (calendarEventId) {
      newEvent.calendarEventId = calendarEventId;
    }
    
    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    return newEvent;
  }, [events]);

  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    
    const updatedEvent = { ...event, ...updates };
    
    if (event.calendarEventId) {
      await updateCalendarEvent(event.calendarEventId, updatedEvent);
    }
    
    const updatedEvents = events.map(e =>
      e.id === id ? updatedEvent : e
    );
    saveEvents(updatedEvents);
  }, [events]);

  const updatePersonalSchedule = useCallback(async (eventId: string, schedule: { attendStartISO?: string; attendEndISO?: string; notes?: string }) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const updatedEvent = {
      ...event,
      personalSchedule: schedule,
    };

    const updatedEvents = events.map(e =>
      e.id === eventId ? updatedEvent : e
    );
    saveEvents(updatedEvents);
  }, [events]);

  const bookRide = useCallback(async (eventId: string, rideData: Omit<import('@/types').RideBooking, 'id' | 'bookedAt' | 'status'>) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return null;

    const newRide: import('@/types').RideBooking = {
      ...rideData,
      id: `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bookedAt: new Date().toISOString(),
      status: 'confirmed',
    };

    const updatedEvent = {
      ...event,
      rides: [...(event.rides || []), newRide],
    };

    const updatedEvents = events.map(e =>
      e.id === eventId ? updatedEvent : e
    );
    await saveEvents(updatedEvents);
    return newRide;
  }, [events]);

  const cancelRide = useCallback(async (eventId: string, rideId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event || !event.rides) return;

    const updatedEvent = {
      ...event,
      rides: event.rides.map(r =>
        r.id === rideId ? { ...r, status: 'cancelled' as const } : r
      ),
    };

    const updatedEvents = events.map(e =>
      e.id === eventId ? updatedEvent : e
    );
    saveEvents(updatedEvents);
  }, [events]);

  const updateRideStatus = useCallback(async (rideId: string, status: import('@/types').RideBooking['status']) => {
    const event = events.find(e => e.rides?.some(r => r.id === rideId));
    if (!event || !event.rides) return;

    const updatedEvent = {
      ...event,
      rides: event.rides.map(r =>
        r.id === rideId ? { ...r, status } : r
      ),
    };

    const updatedEvents = events.map(e =>
      e.id === event.id ? updatedEvent : e
    );
    await saveEvents(updatedEvents);
  }, [events]);

  const deleteEvent = useCallback(async (id: string) => {
    const event = events.find(e => e.id === id);
    if (event?.calendarEventId) {
      await deleteEventFromCalendar(event.calendarEventId);
    }
    
    const updatedEvents = events.filter(event => event.id !== id);
    saveEvents(updatedEvents);
  }, [events]);

  const deleteEvents = useCallback(async (ids: string[]) => {
    const idsSet = new Set(ids);
    
    const eventsToDelete = events.filter(event => idsSet.has(event.id));
    for (const event of eventsToDelete) {
      if (event.calendarEventId) {
        await deleteEventFromCalendar(event.calendarEventId);
      }
    }
    
    const updatedEvents = events.filter(event => !idsSet.has(event.id));
    saveEvents(updatedEvents);
  }, [events]);

  const duplicateEvent = useCallback(async (id: string) => {
    const eventToDuplicate = events.find(e => e.id === id);
    if (!eventToDuplicate) return null;

    const newEvent: Event = {
      ...eventToDuplicate,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'manual',
      calendarEventId: undefined,
    };
    
    const calendarEventId = await syncEventToCalendar(newEvent);
    if (calendarEventId) {
      newEvent.calendarEventId = calendarEventId;
    }
    
    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    return newEvent;
  }, [events]);

  const importGuardiansSchedule = useCallback(async () => {
    const userId = 'user_1';
    const guardiansEvents: Event[] = GUARDIANS_2025_HOME_GAMES.map((game, index) => ({
      id: `guardians_${Date.now()}_${index}`,
      userId,
      title: game.title,
      category: 'sports' as EventCategory,
      startISO: game.startISO,
      endISO: game.endISO,
      venue: 'Progressive Field',
      address: '2401 Ontario St, Cleveland, OH 44115',
      color: '#1E3A8A',
      tags: ['MLB', 'Guardians', 'home'],
      source: 'import' as const,
      notes: `Home game vs ${game.opponent}`,
    }));

    const existingIds = new Set(events.map(e => e.title + e.startISO));
    const newEvents = guardiansEvents.filter(
      e => !existingIds.has(e.title + e.startISO)
    );

    if (newEvents.length > 0) {
      for (const event of newEvents) {
        const calendarEventId = await syncEventToCalendar(event);
        if (calendarEventId) {
          event.calendarEventId = calendarEventId;
        }
      }
      
      const updatedEvents = [...events, ...newEvents];
      saveEvents(updatedEvents);
      return newEvents.length;
    }

    return 0;
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date().toISOString();
    return events
      .filter(event => event.startISO >= now)
      .sort((a, b) => a.startISO.localeCompare(b.startISO));
  }, [events]);

  const pastEvents = useMemo(() => {
    const now = new Date().toISOString();
    return events
      .filter(event => event.startISO < now)
      .sort((a, b) => b.startISO.localeCompare(a.startISO));
  }, [events]);

  const updatePrefs = useCallback((newPrefs: UserPrefs) => {
    savePrefs(newPrefs);
  }, []);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const getExpectedSurge = useCallback((venue: string, eventDate: string): number => {
    const venueSurge = VENUE_SURGE_MULTIPLIERS[venue] || 1;
    const hour = new Date(eventDate).getHours();
    const timeOfDaySurge = (hour >= 17 && hour <= 20) ? 0.3 : 0;
    const eventDaySurge = 0.5;
    return 1 + (venueSurge - 1) + timeOfDaySurge + eventDaySurge;
  }, []);

  const discoverNearbyEvents = useCallback(async (filters: NearbyFilters): Promise<void> => {
    if (!userLocation || eventsLoading) {
      return;
    }

    setEventsLoading(true);
    try {
      console.log('Discovering events with filters:', filters);
      
      const discoveryFilters: EventDiscoveryFilters = {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radius: filters.distance,
        category: filters.category,
        keyword: filters.searchQuery || undefined,
        startDateTime: filters.startDate,
        endDateTime: filters.endDate,
        size: 100,
      };

      const events = await discoverEvents(discoveryFilters);
      console.log(`Discovered ${events.length} events`);
      setDiscoveredEvents(events);
    } catch (error) {
      console.error('Failed to discover events:', error);
    } finally {
      setEventsLoading(false);
    }
  }, [userLocation, eventsLoading]);

  const getNearbyEvents = useCallback((filters: NearbyFilters): CatalogEventWithDistance[] => {
    if (!userLocation) {
      return [];
    }

    const allEvents = [...CATALOG_EVENTS, ...discoveredEvents];

    let filtered = allEvents.filter(event => {
      if (filters.category !== 'all' && event.category !== filters.category) {
        return false;
      }

      if (event.startISO < filters.startDate || event.startISO > filters.endDate) {
        return false;
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matches =
          event.title.toLowerCase().includes(query) ||
          event.venue.toLowerCase().includes(query) ||
          (event.description && event.description.toLowerCase().includes(query));
        if (!matches) return false;
      }

      return true;
    });

    const withDistance = filtered.map(event => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        event.geo.lat,
        event.geo.lng
      );
      const expectedSurge = getExpectedSurge(event.venue, event.startISO);

      return {
        ...event,
        distance,
        expectedSurge,
      };
    });

    const withinDistance = withDistance.filter(e => e.distance <= filters.distance);

    const sorted = [...withinDistance].sort((a, b) => {
      switch (filters.sort) {
        case 'soonest':
          return a.startISO.localeCompare(b.startISO);
        case 'nearest':
          return a.distance - b.distance;
        case 'popular':
          return b.popularity - a.popularity;
        default:
          return 0;
      }
    });

    return sorted;
  }, [userLocation, discoveredEvents, calculateDistance, getExpectedSurge]);

  const saveFromCatalog = useCallback(async (catalogId: string) => {
    const allEvents = [...CATALOG_EVENTS, ...discoveredEvents];
    const catalogEvent = allEvents.find(e => e.id === catalogId);
    if (!catalogEvent) return null;

    const categoryColors: Partial<Record<EventCategory, string>> = {
      sports: '#1E3A8A',
      concert: '#9333EA',
      bar: '#DC2626',
      holiday: '#059669',
      general: '#6B7280',
      comedy: '#F59E0B',
      theater: '#8B5CF6',
      art: '#EC4899',
      food: '#EF4444',
      family: '#10B981',
      festival: '#F97316',
      conference: '#3B82F6',
      community: '#14B8A6',
      nightlife: '#A855F7',
    };

    const newEvent: Event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user_1',
      title: catalogEvent.title,
      category: catalogEvent.category,
      startISO: catalogEvent.startISO,
      endISO: catalogEvent.endISO,
      venue: catalogEvent.venue,
      address: catalogEvent.address,
      color: categoryColors[catalogEvent.category] || '#6B7280',
      tags: [],
      source: 'nearby',
      notes: catalogEvent.description,
    };

    const calendarEventId = await syncEventToCalendar(newEvent);
    if (calendarEventId) {
      newEvent.calendarEventId = calendarEventId;
    }

    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    return newEvent;
  }, [events, discoveredEvents]);

  const markEventInterested = useCallback(async (catalogEvent: CatalogEvent) => {
    try {
      const existing = interestedEvents.find(e => e.catalogEventId === catalogEvent.id);
      if (existing) {
        console.log('Event already marked as interested');
        return;
      }

      const notificationId = await scheduleEventNotification(catalogEvent);
      
      const interestedEvent: InterestedEvent = {
        catalogEventId: catalogEvent.id,
        interestedAt: new Date().toISOString(),
        notificationScheduled: notificationId !== null,
        notificationId: notificationId || undefined,
      };

      const updated = [...interestedEvents, interestedEvent];
      setInterestedEvents(updated);
      await safeSetItem(STORAGE_KEY_INTERESTED, updated);

      const updatedNotInterested = new Set(notInterestedIds);
      updatedNotInterested.delete(catalogEvent.id);
      setNotInterestedIds(updatedNotInterested);
      await safeSetItem(STORAGE_KEY_NOT_INTERESTED, Array.from(updatedNotInterested));

      console.log('Event marked as interested:', catalogEvent.title);
    } catch (error) {
      console.error('Failed to mark event as interested:', error);
    }
  }, [interestedEvents, notInterestedIds]);

  const markEventNotInterested = useCallback(async (catalogEventId: string) => {
    try {
      const interested = interestedEvents.find(e => e.catalogEventId === catalogEventId);
      if (interested?.notificationId) {
        await cancelNotification(interested.notificationId);
      }

      const updatedInterested = interestedEvents.filter(e => e.catalogEventId !== catalogEventId);
      setInterestedEvents(updatedInterested);
      await safeSetItem(STORAGE_KEY_INTERESTED, updatedInterested);

      const updatedNotInterested = new Set(notInterestedIds);
      updatedNotInterested.add(catalogEventId);
      setNotInterestedIds(updatedNotInterested);
      await safeSetItem(STORAGE_KEY_NOT_INTERESTED, Array.from(updatedNotInterested));

      console.log('Event marked as not interested:', catalogEventId);
    } catch (error) {
      console.error('Failed to mark event as not interested:', error);
    }
  }, [interestedEvents, notInterestedIds]);

  const removeEventInterest = useCallback(async (catalogEventId: string) => {
    try {
      const interested = interestedEvents.find(e => e.catalogEventId === catalogEventId);
      if (interested?.notificationId) {
        await cancelNotification(interested.notificationId);
      }

      const updatedInterested = interestedEvents.filter(e => e.catalogEventId !== catalogEventId);
      setInterestedEvents(updatedInterested);
      await safeSetItem(STORAGE_KEY_INTERESTED, updatedInterested);

      const updatedNotInterested = new Set(notInterestedIds);
      updatedNotInterested.delete(catalogEventId);
      setNotInterestedIds(updatedNotInterested);
      await safeSetItem(STORAGE_KEY_NOT_INTERESTED, Array.from(updatedNotInterested));

      console.log('Event interest removed:', catalogEventId);
    } catch (error) {
      console.error('Failed to remove event interest:', error);
    }
  }, [interestedEvents, notInterestedIds]);

  const getEventInterestStatus = useCallback((catalogEventId: string): 'interested' | 'not_interested' | null => {
    if (interestedEvents.some(e => e.catalogEventId === catalogEventId)) {
      return 'interested';
    }
    if (notInterestedIds.has(catalogEventId)) {
      return 'not_interested';
    }
    return null;
  }, [interestedEvents, notInterestedIds]);

  const importFromIOSCalendar = useCallback(async (): Promise<number> => {
    try {
      const hasPermission = await Calendar.requestCalendarPermissionsAsync();
      if (hasPermission.status !== 'granted') {
        console.log('Calendar permission denied');
        return 0;
      }

      const calendars = await getAvailableCalendars();
      if (calendars.length === 0) {
        console.log('No calendars found');
        return 0;
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      const categoryColors: Partial<Record<EventCategory, string>> = {
        sports: '#1E3A8A',
        concert: '#9333EA',
        bar: '#DC2626',
        holiday: '#059669',
        general: '#6B7280',
        comedy: '#F59E0B',
        theater: '#8B5CF6',
        art: '#EC4899',
        food: '#EF4444',
        family: '#10B981',
        festival: '#F97316',
        conference: '#3B82F6',
        community: '#14B8A6',
        nightlife: '#A855F7',
      };

      let totalImported = 0;

      for (const calendar of calendars) {
        const importedEvents = await importEventsFromCalendar(
          calendar.id,
          startDate,
          endDate
        );

        for (const importedEvent of importedEvents) {
          const existingEvent = events.find(
            e => e.title === importedEvent.title && e.startISO === importedEvent.startISO
          );

          if (!existingEvent) {
            const locationParts = importedEvent.location?.split(',') || [];
            const venue = locationParts[0]?.trim() || 'Unknown Location';
            const address = importedEvent.location || '';

            const newEvent: Event = {
              id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: 'user_1',
              title: importedEvent.title,
              category: 'general',
              startISO: importedEvent.startISO,
              endISO: importedEvent.endISO,
              venue,
              address,
              color: categoryColors.general || '#6B7280',
              tags: [importedEvent.calendarName],
              source: 'import',
              notes: importedEvent.notes,
              calendarEventId: importedEvent.id,
            };

            events.push(newEvent);
            totalImported++;
          }
        }
      }

      if (totalImported > 0) {
        await saveEvents([...events]);
      }

      return totalImported;
    } catch (error) {
      console.error('Failed to import from iOS calendar:', error);
      return 0;
    }
  }, [events]);

  return useMemo(() => ({
    events,
    upcomingEvents,
    pastEvents,
    userPrefs,
    isLoading,
    userLocation,
    locationLoading,
    eventsLoading,
    interestedEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    deleteEvents,
    duplicateEvent,
    importGuardiansSchedule,
    importFromIOSCalendar,
    updatePrefs,
    requestLocation,
    getNearbyEvents,
    discoverNearbyEvents,
    saveFromCatalog,
    markEventInterested,
    markEventNotInterested,
    removeEventInterest,
    getEventInterestStatus,
    updatePersonalSchedule,
    bookRide,
    cancelRide,
    updateRideStatus,
  }), [events, upcomingEvents, pastEvents, userPrefs, isLoading, userLocation, locationLoading, eventsLoading, interestedEvents, addEvent, updateEvent, deleteEvent, deleteEvents, duplicateEvent, importGuardiansSchedule, importFromIOSCalendar, updatePrefs, requestLocation, getNearbyEvents, discoverNearbyEvents, saveFromCatalog, markEventInterested, markEventNotInterested, removeEventInterest, getEventInterestStatus, updatePersonalSchedule, bookRide, cancelRide, updateRideStatus]);
});
