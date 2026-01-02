import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { Event } from '@/types';

export async function requestCalendarPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('Calendar sync not available on web');
    return false;
  }

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function getDefaultCalendar(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    const defaultCalendar = calendars.find(
      cal => cal.allowsModifications && cal.source.name === 'Default'
    );
    
    if (defaultCalendar) {
      return defaultCalendar.id;
    }

    const writableCalendar = calendars.find(cal => cal.allowsModifications);
    if (writableCalendar) {
      return writableCalendar.id;
    }

    return null;
  } catch (error) {
    console.error('Failed to get default calendar:', error);
    return null;
  }
}

export async function syncEventToCalendar(event: Event): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('Calendar sync not available on web');
    return null;
  }

  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      console.log('Calendar permission denied');
      return null;
    }

    const calendarId = await getDefaultCalendar();
    if (!calendarId) {
      console.log('No writable calendar found');
      return null;
    }

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: event.title,
      startDate: new Date(event.startISO),
      endDate: new Date(event.endISO),
      location: `${event.venue}, ${event.address}`,
      notes: event.notes || `Category: ${event.category}${event.tags.length > 0 ? `\nTags: ${event.tags.join(', ')}` : ''}`,
      timeZone: 'America/New_York',
    });

    console.log('Event synced to calendar:', eventId);
    return eventId;
  } catch (error) {
    console.error('Failed to sync event to calendar:', error);
    return null;
  }
}

export async function deleteEventFromCalendar(calendarEventId: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    await Calendar.deleteEventAsync(calendarEventId);
    console.log('Event deleted from calendar:', calendarEventId);
    return true;
  } catch (error) {
    console.error('Failed to delete event from calendar:', error);
    return false;
  }
}

export async function updateCalendarEvent(calendarEventId: string, event: Event): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    await Calendar.updateEventAsync(calendarEventId, {
      title: event.title,
      startDate: new Date(event.startISO),
      endDate: new Date(event.endISO),
      location: `${event.venue}, ${event.address}`,
      notes: event.notes || `Category: ${event.category}${event.tags.length > 0 ? `\nTags: ${event.tags.join(', ')}` : ''}`,
      timeZone: 'America/New_York',
    });

    console.log('Calendar event updated:', calendarEventId);
    return true;
  } catch (error) {
    console.error('Failed to update calendar event:', error);
    return false;
  }
}

export interface ImportedCalendarEvent {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  location?: string;
  notes?: string;
  calendarId: string;
  calendarName: string;
}

export async function getAvailableCalendars(): Promise<Calendar.Calendar[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    return calendars;
  } catch (error) {
    console.error('Failed to get calendars:', error);
    return [];
  }
}

export async function importEventsFromCalendar(
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<ImportedCalendarEvent[]> {
  if (Platform.OS === 'web') {
    console.log('Calendar import not available on web');
    return [];
  }

  try {
    const events = await Calendar.getEventsAsync(
      [calendarId],
      startDate,
      endDate
    );

    const calendar = (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).find(
      cal => cal.id === calendarId
    );

    const importedEvents: ImportedCalendarEvent[] = events.map(event => ({
      id: event.id,
      title: event.title,
      startISO: event.startDate ? new Date(event.startDate).toISOString() : new Date().toISOString(),
      endISO: event.endDate ? new Date(event.endDate).toISOString() : new Date().toISOString(),
      location: event.location || undefined,
      notes: event.notes || undefined,
      calendarId,
      calendarName: calendar?.title || 'Unknown Calendar',
    }));

    console.log(`Imported ${importedEvents.length} events from calendar`);
    return importedEvents;
  } catch (error) {
    console.error('Failed to import events from calendar:', error);
    return [];
  }
}

export async function syncRideToCalendar(
  eventTitle: string,
  rideType: 'arrival' | 'return',
  pickupTime: string,
  pickupAddress: string,
  dropoffAddress: string,
  driverName: string,
  driverPhone?: string,
  vehicleInfo?: string,
  licensePlate?: string
): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('Calendar sync not available on web');
    return null;
  }

  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      console.log('Calendar permission denied');
      return null;
    }

    const calendarId = await getDefaultCalendar();
    if (!calendarId) {
      console.log('No writable calendar found');
      return null;
    }

    const pickupDate = new Date(pickupTime);
    const endDate = new Date(pickupDate.getTime() + 60 * 60 * 1000);

    const notes = [
      `Ride Type: ${rideType === 'arrival' ? 'Arrival' : 'Return'}`,
      `Driver: ${driverName}`,
      driverPhone ? `Driver Phone: ${driverPhone}` : '',
      vehicleInfo ? `Vehicle: ${vehicleInfo}` : '',
      licensePlate ? `License Plate: ${licensePlate}` : '',
      '',
      `Pickup: ${pickupAddress}`,
      `Dropoff: ${dropoffAddress}`,
    ].filter(Boolean).join('\n');

    const rideEventId = await Calendar.createEventAsync(calendarId, {
      title: `${rideType === 'arrival' ? '🚗 Ride to' : '🚗 Ride from'} ${eventTitle}`,
      startDate: pickupDate,
      endDate,
      location: pickupAddress,
      notes,
      timeZone: 'America/New_York',
      alarms: [{ relativeOffset: -15 }],
    });

    console.log('Ride synced to calendar:', rideEventId);
    return rideEventId;
  } catch (error) {
    console.error('Failed to sync ride to calendar:', error);
    return null;
  }
}
