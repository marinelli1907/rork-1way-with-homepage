import { EventCategory, CatalogEvent } from '@/types';
import { CLEVELAND_NOVEMBER_EVENTS } from '@/constants/cleveland-november-events';

const TICKETMASTER_API_KEY = process.env.EXPO_PUBLIC_TICKETMASTER_API_KEY || '';
const EVENTBRITE_API_KEY = process.env.EXPO_PUBLIC_EVENTBRITE_API_KEY || '';

export interface EventDiscoveryFilters {
  latitude: number;
  longitude: number;
  radius: number;
  category?: EventCategory | 'all';
  keyword?: string;
  startDateTime?: string;
  endDateTime?: string;
  size?: number;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      address?: {
        line1?: string;
      };
      city?: {
        name?: string;
      };
      state?: {
        stateCode?: string;
      };
      postalCode?: string;
      location?: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
  classifications?: Array<{
    segment?: {
      name?: string;
    };
    genre?: {
      name?: string;
    };
  }>;
  images?: Array<{
    url: string;
    ratio?: string;
    width?: number;
  }>;
  priceRanges?: Array<{
    min: number;
    max: number;
  }>;
  info?: string;
  url?: string;
}

interface EventbriteEvent {
  id: string;
  name: {
    text: string;
  };
  start: {
    local: string;
    timezone: string;
  };
  end: {
    local: string;
  };
  venue?: {
    name?: string;
    address?: {
      address_1?: string;
      city?: string;
      region?: string;
      postal_code?: string;
      latitude?: string;
      longitude?: string;
    };
  };
  category?: {
    name?: string;
  };
  subcategory?: {
    name?: string;
  };
  description?: {
    text?: string;
  };
  logo?: {
    url?: string;
  };
  url?: string;
}

interface EventbriteResponse {
  events?: EventbriteEvent[];
  pagination?: {
    object_count: number;
  };
}

interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    totalElements: number;
  };
}

function mapTicketmasterCategory(classification?: TicketmasterEvent['classifications']): EventCategory {
  if (!classification || classification.length === 0) {
    return 'general';
  }

  const segment = classification[0]?.segment?.name?.toLowerCase() || '';
  const genre = classification[0]?.genre?.name?.toLowerCase() || '';

  if (segment.includes('sports')) {
    return 'sports';
  }
  if (segment.includes('music') || genre.includes('concert')) {
    return 'concert';
  }
  if (genre.includes('comedy')) {
    return 'comedy';
  }
  if (segment.includes('arts') || segment.includes('theatre') || genre.includes('theater')) {
    return 'theater';
  }
  if (genre.includes('bar') || genre.includes('nightlife') || genre.includes('club')) {
    return 'nightlife';
  }
  if (segment.includes('film') || genre.includes('art') || genre.includes('museum')) {
    return 'art';
  }
  if (genre.includes('family') || genre.includes('children')) {
    return 'family';
  }
  if (genre.includes('festival') || genre.includes('fair')) {
    return 'festival';
  }
  if (segment.includes('miscellaneous') || genre.includes('community')) {
    return 'community';
  }

  return 'general';
}

function calculatePopularity(event: TicketmasterEvent): number {
  let score = 0.5;

  if (event._embedded?.venues?.[0]) {
    score += 0.2;
  }

  if (event.images && event.images.length > 0) {
    score += 0.1;
  }

  if (event.priceRanges && event.priceRanges.length > 0) {
    score += 0.1;
  }

  if (event.url) {
    score += 0.1;
  }

  return Math.min(score, 1);
}

export async function discoverEventsFromTicketmaster(
  filters: EventDiscoveryFilters
): Promise<CatalogEvent[]> {
  try {
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      latlong: `${filters.latitude},${filters.longitude}`,
      radius: Math.round(filters.radius).toString(),
      unit: 'miles',
      size: (filters.size || 100).toString(),
      sort: 'date,asc',
    });

    if (filters.keyword) {
      params.append('keyword', filters.keyword);
    }

    if (filters.startDateTime) {
      params.append('startDateTime', filters.startDateTime);
    }

    if (filters.endDateTime) {
      params.append('endDateTime', filters.endDateTime);
    }

    if (filters.category && filters.category !== 'all') {
      const classificationName = filters.category === 'sports' ? 'Sports' 
        : filters.category === 'concert' ? 'Music'
        : filters.category === 'comedy' ? 'Comedy'
        : filters.category === 'theater' ? 'Arts & Theatre'
        : filters.category === 'nightlife' || filters.category === 'bar' ? 'Nightlife'
        : filters.category === 'art' ? 'Arts & Theatre'
        : filters.category === 'family' ? 'Family'
        : filters.category === 'festival' ? 'Festivals'
        : filters.category === 'community' ? 'Community'
        : undefined;
      
      if (classificationName) {
        params.append('classificationName', classificationName);
      }
    }

    console.log('Fetching from Ticketmaster:', `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`);

    if (!TICKETMASTER_API_KEY) {
      console.warn('Ticketmaster API key not configured. Please add EXPO_PUBLIC_TICKETMASTER_API_KEY to your .env file.');
      return [];
    }

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Ticketmaster API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return [];
    }

    const data: TicketmasterResponse = await response.json();
    console.log('Ticketmaster response:', JSON.stringify(data, null, 2).substring(0, 500));

    if (!data._embedded?.events) {
      console.log('No events found in Ticketmaster response');
      return [];
    }

    const events: CatalogEvent[] = data._embedded.events.map((event) => {
      const venue = event._embedded?.venues?.[0];
      const venueName = venue?.name || 'TBA';
      const venueAddress = [
        venue?.address?.line1,
        venue?.city?.name,
        venue?.state?.stateCode,
        venue?.postalCode,
      ]
        .filter(Boolean)
        .join(', ') || 'Address TBA';

      const lat = venue?.location?.latitude
        ? parseFloat(venue.location.latitude)
        : filters.latitude;
      const lng = venue?.location?.longitude
        ? parseFloat(venue.location.longitude)
        : filters.longitude;

      const startDate = event.dates.start.localDate;
      const startTime = event.dates.start.localTime || '20:00:00';
      const startISO = new Date(`${startDate}T${startTime}`).toISOString();

      const endDate = new Date(startISO);
      endDate.setHours(endDate.getHours() + 3);
      const endISO = endDate.toISOString();

      const category = mapTicketmasterCategory(event.classifications);
      const popularity = calculatePopularity(event);

      return {
        id: `tm_${event.id}`,
        title: event.name,
        category,
        startISO,
        endISO,
        venue: venueName,
        address: venueAddress,
        geo: { lat, lng },
        popularity,
        source: 'catalog' as const,
        description: event.info || event.classifications?.[0]?.genre?.name || undefined,
      };
    });

    console.log(`Discovered ${events.length} events from Ticketmaster`);
    return events;
  } catch (error) {
    console.error('Failed to fetch events from Ticketmaster:', error);
    return [];
  }
}

function mapEventbriteCategory(category?: string, subcategory?: string): EventCategory {
  const cat = (category || '').toLowerCase();
  const sub = (subcategory || '').toLowerCase();

  if (cat.includes('music') || sub.includes('concert') || sub.includes('music')) {
    return 'concert';
  }
  if (cat.includes('sports') || sub.includes('sports')) {
    return 'sports';
  }
  if (cat.includes('comedy') || sub.includes('comedy')) {
    return 'comedy';
  }
  if (cat.includes('performing') || cat.includes('visual arts') || sub.includes('theater') || sub.includes('theatre')) {
    return 'theater';
  }
  if (cat.includes('film') || cat.includes('media') || sub.includes('art') || sub.includes('museum')) {
    return 'art';
  }
  if (cat.includes('food') || sub.includes('food') || sub.includes('drink')) {
    return 'food';
  }
  if (cat.includes('nightlife') || sub.includes('bar') || sub.includes('nightlife') || sub.includes('club')) {
    return 'nightlife';
  }
  if (cat.includes('family') || sub.includes('family') || sub.includes('kids')) {
    return 'family';
  }
  if (cat.includes('festival') || sub.includes('festival') || sub.includes('fair')) {
    return 'festival';
  }
  if (cat.includes('business') || cat.includes('professional') || sub.includes('conference') || sub.includes('seminar')) {
    return 'conference';
  }
  if (cat.includes('community') || cat.includes('culture') || sub.includes('community')) {
    return 'community';
  }
  if (cat.includes('holiday') || sub.includes('holiday')) {
    return 'holiday';
  }

  return 'general';
}

export async function discoverEventsFromEventbrite(
  filters: EventDiscoveryFilters
): Promise<CatalogEvent[]> {
  try {
    if (!EVENTBRITE_API_KEY) {
      console.warn('Eventbrite API key not configured');
      return [];
    }

    const radiusKm = Math.round(filters.radius * 1.60934);
    const params = new URLSearchParams({
      'location.latitude': filters.latitude.toString(),
      'location.longitude': filters.longitude.toString(),
      'location.within': `${radiusKm}km`,
      'expand': 'venue,category',
      'page_size': (filters.size || 50).toString(),
    });

    if (filters.keyword) {
      params.append('q', filters.keyword);
    }

    if (filters.startDateTime) {
      params.append('start_date.range_start', filters.startDateTime);
    }

    if (filters.endDateTime) {
      params.append('start_date.range_end', filters.endDateTime);
    }

    if (filters.category && filters.category !== 'all') {
      const categoryMap: Record<string, string> = {
        'music': 'Music',
        'concert': 'Music',
        'sports': 'Sports & Fitness',
        'bar': 'Food & Drink',
        'food': 'Food & Drink',
        'comedy': 'Performing & Visual Arts',
        'theater': 'Performing & Visual Arts',
        'art': 'Film, Media & Entertainment',
        'family': 'Family & Education',
        'festival': 'Music',
        'nightlife': 'Food & Drink',
        'conference': 'Business & Professional',
        'community': 'Community & Culture',
      };
      const categoryName = categoryMap[filters.category];
      if (categoryName) {
        params.append('categories', categoryName);
      }
    }

    console.log('Fetching from Eventbrite:', `https://www.eventbriteapi.com/v3/events/search/?${params.toString()}`);

    const response = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${EVENTBRITE_API_KEY}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Eventbrite API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return [];
    }

    const data: EventbriteResponse = await response.json();
    console.log('Eventbrite response:', JSON.stringify(data, null, 2).substring(0, 500));

    if (!data.events || data.events.length === 0) {
      console.log('No events found in Eventbrite response');
      return [];
    }

    const events: CatalogEvent[] = data.events.map((event) => {
      const venueName = event.venue?.name || 'TBA';
      const venueAddress = [
        event.venue?.address?.address_1,
        event.venue?.address?.city,
        event.venue?.address?.region,
        event.venue?.address?.postal_code,
      ]
        .filter(Boolean)
        .join(', ') || 'Address TBA';

      const lat = event.venue?.address?.latitude
        ? parseFloat(event.venue.address.latitude)
        : filters.latitude;
      const lng = event.venue?.address?.longitude
        ? parseFloat(event.venue.address.longitude)
        : filters.longitude;

      const startISO = new Date(event.start.local).toISOString();
      const endISO = new Date(event.end.local).toISOString();

      const category = mapEventbriteCategory(
        event.category?.name,
        event.subcategory?.name
      );

      return {
        id: `eb_${event.id}`,
        title: event.name.text,
        category,
        startISO,
        endISO,
        venue: venueName,
        address: venueAddress,
        geo: { lat, lng },
        popularity: 0.7,
        source: 'catalog' as const,
        description: event.description?.text?.substring(0, 200) || undefined,
      };
    });

    console.log(`Discovered ${events.length} events from Eventbrite`);
    return events;
  } catch (error) {
    console.error('Failed to fetch events from Eventbrite:', error);
    return [];
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getClevelandEvents(filters: EventDiscoveryFilters): CatalogEvent[] {
  const clevelandLat = 41.4993;
  const clevelandLng = -81.6944;
  const distanceFromCleveland = calculateDistance(
    filters.latitude,
    filters.longitude,
    clevelandLat,
    clevelandLng
  );

  if (distanceFromCleveland > filters.radius) {
    return [];
  }

  let events = CLEVELAND_NOVEMBER_EVENTS;

  if (filters.category && filters.category !== 'all') {
    events = events.filter(e => e.category === filters.category);
  }

  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    events = events.filter(e => 
      e.title.toLowerCase().includes(keyword) ||
      e.venue.toLowerCase().includes(keyword) ||
      e.description?.toLowerCase().includes(keyword)
    );
  }

  if (filters.startDateTime) {
    const startDate = new Date(filters.startDateTime);
    events = events.filter(e => new Date(e.startISO) >= startDate);
  }

  if (filters.endDateTime) {
    const endDate = new Date(filters.endDateTime);
    events = events.filter(e => new Date(e.startISO) <= endDate);
  }

  return events;
}

export async function discoverEvents(
  filters: EventDiscoveryFilters
): Promise<CatalogEvent[]> {
  const results = await Promise.all([
    discoverEventsFromTicketmaster(filters),
    discoverEventsFromEventbrite(filters),
  ]);

  const clevelandEvents = getClevelandEvents(filters);
  const allEvents = [...results.flat(), ...clevelandEvents];
  
  const uniqueEvents = allEvents.reduce((acc, event) => {
    const key = `${event.title}_${event.startISO}_${event.venue}`;
    if (!acc.has(key)) {
      acc.set(key, event);
    }
    return acc;
  }, new Map<string, CatalogEvent>());

  return Array.from(uniqueEvents.values());
}
