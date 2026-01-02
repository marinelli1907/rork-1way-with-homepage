import { EventCategory } from '@/types';
import { POPULAR_VENUES } from '@/constants/venues';

export type PlaceCategory = 'bar' | 'restaurant' | 'stadium' | 'music' | 'theater' | 'park';

export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: PlaceCategory;
  distanceMiles?: number;
}

export interface SmartAddResult {
  ok: boolean;
  query: string;
  primary?: Place;
  candidates: Place[];
  notes?: string;
  rideEstimateUSD?: number;
  surgeMultiplier: number;
  radiusMiles: number;
}

export interface VenueMatch {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  category?: EventCategory;
  distance?: number;
}

export interface DropOffPoint {
  label: string;
  lat: number;
  lng: number;
}

const TEAM_VENUE_MAP: Record<string, string> = {
  guardians: 'Progressive Field',
  browns: 'FirstEnergy Stadium',
  cavs: 'Rocket Mortgage FieldHouse',
  cavaliers: 'Rocket Mortgage FieldHouse',
};

const VENUE_ALIASES: Record<string, string> = {
  'the jake': 'Progressive Field',
  'the q': 'Rocket Mortgage FieldHouse',
  'browns stadium': 'FirstEnergy Stadium',
};

const STADIUM_DROP_OFF_PRESETS: Record<string, DropOffPoint[]> = {
  'FirstEnergy Stadium': [
    { label: 'East 3rd Gate', lat: 41.5061, lng: -81.6985 },
    { label: 'W 3rd Ped Bridge', lat: 41.5065, lng: -81.7005 },
    { label: 'Lakeside Rideshare', lat: 41.5070, lng: -81.6995 },
  ],
  'Progressive Field': [
    { label: 'Right Field Gate (E 9th)', lat: 41.4968, lng: -81.6845 },
    { label: 'Gateway East Garage', lat: 41.4960, lng: -81.6860 },
    { label: 'Ontario Lot Rideshare', lat: 41.4955, lng: -81.6850 },
  ],
  'Rocket Mortgage FieldHouse': [
    { label: 'Huron Rd Rideshare', lat: 41.4970, lng: -81.6890 },
    { label: 'Eagle Ave Garage', lat: 41.4963, lng: -81.6875 },
    { label: 'Prospect Ave Curb', lat: 41.4958, lng: -81.6885 },
  ],
};

const NEARBY_VENUES_DB: VenueMatch[] = [
  {
    name: '1899 Pub',
    address: '38228 Glenn Ave, Willoughby, OH 44094',
    lat: 41.63994,
    lng: -81.40783,
    placeId: 'plc_1899_pub',
    category: 'bar',
  },
  {
    name: 'Ballantine',
    address: '4113 Erie St, Willoughby, OH 44094',
    lat: 41.63942,
    lng: -81.40631,
    placeId: 'plc_ballantine',
    category: 'bar',
  },
  {
    name: 'Willoughby Brewing Co.',
    address: '4057 Erie St, Willoughby, OH 44094',
    lat: 41.6389,
    lng: -81.4057,
    placeId: 'plc_willoughby_brewing',
    category: 'bar',
  },
  {
    name: 'The Morehouse',
    address: '4054 Erie St, Willoughby, OH 44094',
    lat: 41.63878,
    lng: -81.4054,
    placeId: 'plc_morehouse',
    category: 'bar',
  },
  {
    name: 'Nickleby\'s',
    address: '4051 Erie St, Willoughby, OH 44094',
    lat: 41.63865,
    lng: -81.4052,
    placeId: 'plc_nicklebys',
    category: 'bar',
  },
  ...POPULAR_VENUES.map((v, idx) => ({
    name: v.name,
    address: v.address,
    lat: 41.5 + idx * 0.01,
    lng: -81.7 + idx * 0.01,
    placeId: `plc_${v.name.toLowerCase().replace(/\s+/g, '_')}`,
    category: v.category,
  })),
];

function detectTeamMention(text: string): string | null {
  const lowerText = text.toLowerCase();
  for (const [team, venue] of Object.entries(TEAM_VENUE_MAP)) {
    if (lowerText.includes(team)) {
      return venue;
    }
  }
  return null;
}

function normalizeVenueName(query: string): string {
  const lowerQuery = query.toLowerCase();
  return VENUE_ALIASES[lowerQuery] || query;
}

function findVenueMatches(query: string, userLat?: number, userLng?: number): VenueMatch[] {
  const normalizedQuery = normalizeVenueName(query);
  const lowerQuery = normalizedQuery.toLowerCase();

  let matches = NEARBY_VENUES_DB.filter(venue =>
    venue.name.toLowerCase().includes(lowerQuery)
  );

  if (userLat && userLng) {
    matches = matches.map(venue => ({
      ...venue,
      distance: calculateDistance(userLat, userLng, venue.lat, venue.lng),
    }));
    matches.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  return matches.slice(0, 5);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function inferCategory(text: string, venueName?: string): EventCategory {
  const lowerText = text.toLowerCase();
  const lowerVenue = venueName?.toLowerCase() || '';

  if (
    lowerText.includes('game') ||
    lowerText.includes('match') ||
    lowerVenue.includes('field') ||
    lowerVenue.includes('stadium') ||
    lowerVenue.includes('arena')
  ) {
    return 'sports';
  }

  if (
    lowerText.includes('concert') ||
    lowerText.includes('show') ||
    lowerText.includes('live') ||
    lowerText.includes('tour')
  ) {
    return 'concert';
  }

  if (
    lowerText.includes('bar') ||
    lowerText.includes('pub') ||
    lowerText.includes('club') ||
    lowerText.includes('drinks') ||
    lowerText.includes('party') ||
    lowerVenue.includes('bar') ||
    lowerVenue.includes('pub') ||
    lowerVenue.includes('brewery')
  ) {
    return 'bar';
  }

  if (
    lowerText.includes('birthday') ||
    lowerText.includes('celebration') ||
    lowerText.includes('anniversary')
  ) {
    return 'general';
  }

  return 'general';
}

const BASE = 3.0;
const PER_MILE = 1.85;

const DEFAULT_LOCATION = { lat: 41.4993, lng: -81.6944 };

export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3959;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const aVal =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
}

export function estimateRide(distanceMiles: number, surge = 1): number {
  return Math.ceil((BASE + distanceMiles * PER_MILE) * surge * 20) / 20;
}

function mapPlaceCategoryToEventCategory(placeCategory: PlaceCategory): EventCategory {
  switch (placeCategory) {
    case 'stadium':
      return 'sports';
    case 'bar':
    case 'restaurant':
      return 'bar';
    case 'music':
    case 'theater':
      return 'concert';
    default:
      return 'general';
  }
}

export interface DetectIntentResult {
  category?: PlaceCategory;
  venueTokens?: string[];
  team?: 'browns' | 'guardians' | 'cavaliers' | null;
}

export function detectIntent(query: string): DetectIntentResult {
  const lower = query.toLowerCase();
  const result: DetectIntentResult = {};

  if (lower.includes('browns')) {
    result.team = 'browns';
    result.category = 'stadium';
  } else if (lower.includes('guardians') || lower.includes('tribe')) {
    result.team = 'guardians';
    result.category = 'stadium';
  } else if (lower.includes('cavs') || lower.includes('cavaliers')) {
    result.team = 'cavaliers';
    result.category = 'stadium';
  } else if (lower.includes('movie') || lower.includes('movies') || lower.includes('cinema') || lower.includes('theater')) {
    result.category = 'theater';
  } else if (lower.includes('bar') || lower.includes('pub') || lower.includes('drink')) {
    result.category = 'bar';
  } else if (lower.includes('restaurant') || lower.includes('food') || lower.includes('dinner') || lower.includes('lunch')) {
    result.category = 'restaurant';
  } else if (lower.includes('concert') || lower.includes('show') || lower.includes('music')) {
    result.category = 'music';
  } else if (lower.includes('park')) {
    result.category = 'park';
  }

  const atMatch = query.match(/\bat\s+(.+)/i);
  if (atMatch) {
    result.venueTokens = [atMatch[1].trim()];
  }

  return result;
}

const BUILT_IN_POIS: Place[] = [
  {
    id: 'plc_1899_pub',
    name: '1899 Pub',
    address: '38228 Glenn Ave, Willoughby, OH 44094',
    lat: 41.63994,
    lng: -81.40783,
    category: 'bar',
  },
  {
    id: 'plc_ballantine',
    name: 'Ballantine',
    address: '4113 Erie St, Willoughby, OH 44094',
    lat: 41.63942,
    lng: -81.40631,
    category: 'bar',
  },
  {
    id: 'plc_willoughby_brewing',
    name: 'Willoughby Brewing Co.',
    address: '4057 Erie St, Willoughby, OH 44094',
    lat: 41.6389,
    lng: -81.4057,
    category: 'bar',
  },
  {
    id: 'plc_morehouse',
    name: 'The Morehouse',
    address: '4054 Erie St, Willoughby, OH 44094',
    lat: 41.63878,
    lng: -81.4054,
    category: 'bar',
  },
  {
    id: 'plc_nicklebys',
    name: "Nickleby's",
    address: '4051 Erie St, Willoughby, OH 44094',
    lat: 41.63865,
    lng: -81.4052,
    category: 'bar',
  },
  {
    id: 'plc_firstenergy_stadium',
    name: 'Cleveland Browns Stadium',
    address: '100 Alfred Lerner Way, Cleveland, OH 44114',
    lat: 41.5061,
    lng: -81.6995,
    category: 'stadium',
  },
  {
    id: 'plc_progressive_field',
    name: 'Progressive Field',
    address: '2401 Ontario St, Cleveland, OH 44115',
    lat: 41.4957,
    lng: -81.6852,
    category: 'stadium',
  },
  {
    id: 'plc_rmfh',
    name: 'Rocket Mortgage FieldHouse',
    address: '1 Center Ct, Cleveland, OH 44115',
    lat: 41.4965,
    lng: -81.6882,
    category: 'stadium',
  },
  {
    id: 'plc_atlas_eastgate',
    name: 'Atlas Cinemas Eastgate 10',
    address: '1345 SOM Center Rd, Mayfield Heights, OH 44124',
    lat: 41.5197,
    lng: -81.4452,
    category: 'theater',
  },
];

export async function geocodeAndSearch(params: {
  query: string;
  userLatLng: { lat: number; lng: number };
  radiusMiles: number;
  category?: PlaceCategory;
}): Promise<Place[]> {
  const { query, userLatLng, radiusMiles, category } = params;

  const filtered = BUILT_IN_POIS.filter((poi) => {
    const distance = haversineMiles(userLatLng, { lat: poi.lat, lng: poi.lng });
    if (distance > radiusMiles) return false;
    if (category && poi.category !== category) return false;

    const lowerQuery = query.toLowerCase();
    const lowerName = poi.name.toLowerCase();
    const lowerAddress = poi.address.toLowerCase();

    return lowerName.includes(lowerQuery) || lowerAddress.includes(lowerQuery);
  });

  const withDistance = filtered.map((poi) => ({
    ...poi,
    distanceMiles: haversineMiles(userLatLng, { lat: poi.lat, lng: poi.lng }),
  }));

  withDistance.sort((a, b) => (a.distanceMiles || 0) - (b.distanceMiles || 0));

  return withDistance.slice(0, 6);
}

export async function smartAdd(params: {
  query: string;
  userLatLng?: { lat: number; lng: number };
  radiusMiles: number;
  surgeMultiplier?: number;
}): Promise<SmartAddResult> {
  const { query, userLatLng, radiusMiles, surgeMultiplier = 1.0 } = params;

  if (query.length < 3) {
    return {
      ok: false,
      query,
      candidates: [],
      surgeMultiplier,
      radiusMiles,
      notes: 'Type at least 3 characters',
    };
  }

  const userLoc = userLatLng || DEFAULT_LOCATION;
  const intent = detectIntent(query);

  let candidates: Place[] = [];

  if (intent.team === 'browns') {
    const stadium = BUILT_IN_POIS.find((p) => p.name.includes('Browns Stadium'));
    if (stadium) {
      const withDist = { ...stadium, distanceMiles: haversineMiles(userLoc, { lat: stadium.lat, lng: stadium.lng }) };
      candidates = [withDist];
    }
  } else if (intent.team === 'guardians') {
    const stadium = BUILT_IN_POIS.find((p) => p.name === 'Progressive Field');
    if (stadium) {
      const withDist = { ...stadium, distanceMiles: haversineMiles(userLoc, { lat: stadium.lat, lng: stadium.lng }) };
      candidates = [withDist];
    }
  } else if (intent.team === 'cavaliers') {
    const arena = BUILT_IN_POIS.find((p) => p.name.includes('Rocket Mortgage'));
    if (arena) {
      const withDist = { ...arena, distanceMiles: haversineMiles(userLoc, { lat: arena.lat, lng: arena.lng }) };
      candidates = [withDist];
    }
  } else {
    const searchQuery = intent.venueTokens ? intent.venueTokens[0] : query;
    candidates = await geocodeAndSearch({
      query: searchQuery,
      userLatLng: userLoc,
      radiusMiles,
      category: intent.category,
    });
  }

  if (candidates.length === 0) {
    return {
      ok: false,
      query,
      candidates: [],
      surgeMultiplier,
      radiusMiles,
      notes: 'No nearby matches—try a different phrase or increase radius',
    };
  }

  const primary = candidates[0];
  const rideEstimateUSD = primary.distanceMiles !== undefined ? estimateRide(primary.distanceMiles, surgeMultiplier) : undefined;

  return {
    ok: true,
    query,
    primary,
    candidates,
    rideEstimateUSD,
    surgeMultiplier,
    radiusMiles,
  };
}

export function parseSmartAdd(
  text: string,
  userLat?: number,
  userLng?: number
): { intent: string; category: EventCategory; query: string; primary: VenueMatch | null; quickSelect: VenueMatch[]; dropPoints: DropOffPoint[] } {
  const teamVenue = detectTeamMention(text);
  
  if (teamVenue) {
    const venue = NEARBY_VENUES_DB.find(v => v.name === teamVenue);
    if (venue) {
      return {
        intent: 'sports',
        category: 'sports',
        query: teamVenue,
        primary: venue,
        quickSelect: [venue],
        dropPoints: STADIUM_DROP_OFF_PRESETS[teamVenue] || [],
      };
    }
  }

  const atMatch = text.match(/\bat\s+(.+)/i);
  const query = atMatch ? atMatch[1].trim() : text;

  const matches = findVenueMatches(query, userLat, userLng);
  const primary = matches[0] || null;
  
  const category = inferCategory(text, primary?.name);
  
  const dropPoints = primary && STADIUM_DROP_OFF_PRESETS[primary.name]
    ? STADIUM_DROP_OFF_PRESETS[primary.name]
    : [];

  return {
    intent: category === 'bar' ? 'social' : category,
    category,
    query,
    primary,
    quickSelect: matches,
    dropPoints,
  };
}
