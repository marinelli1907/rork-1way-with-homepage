import { EventCategory } from '@/types';

export interface PromoVenue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: EventCategory;
  sponsored?: boolean;
  badgeText?: string;
}

const SPONSORED_VENUES: PromoVenue[] = [
  {
    id: 'promo_1899',
    name: '1899 Pub',
    address: '38228 Glenn Ave, Willoughby, OH 44094',
    lat: 41.63994,
    lng: -81.40783,
    category: 'bar',
    sponsored: true,
    badgeText: 'Sponsored',
  },
  {
    id: 'promo_willoughby_brewing',
    name: 'Willoughby Brewing Co.',
    address: '4057 Erie St, Willoughby, OH 44094',
    lat: 41.6389,
    lng: -81.4057,
    category: 'bar',
    sponsored: true,
    badgeText: 'Sponsored',
  },
  {
    id: 'promo_progressive_field',
    name: 'Progressive Field',
    address: '2401 Ontario St, Cleveland, OH 44115',
    lat: 41.4957,
    lng: -81.6852,
    category: 'sports',
    sponsored: true,
    badgeText: 'Sponsored',
  },
];

const POPULAR_VENUES_BY_CATEGORY: Record<EventCategory, PromoVenue[]> = {
  bar: [
    {
      id: 'pop_1899',
      name: '1899 Pub',
      address: '38228 Glenn Ave, Willoughby, OH 44094',
      lat: 41.63994,
      lng: -81.40783,
      category: 'bar',
    },
    {
      id: 'pop_ballantine',
      name: 'Ballantine',
      address: '4113 Erie St, Willoughby, OH 44094',
      lat: 41.63942,
      lng: -81.40631,
      category: 'bar',
    },
    {
      id: 'pop_willoughby_brewing',
      name: 'Willoughby Brewing Co.',
      address: '4057 Erie St, Willoughby, OH 44094',
      lat: 41.6389,
      lng: -81.4057,
      category: 'bar',
    },
    {
      id: 'pop_morehouse',
      name: 'The Morehouse',
      address: '4054 Erie St, Willoughby, OH 44094',
      lat: 41.63878,
      lng: -81.4054,
      category: 'bar',
    },
  ],
  sports: [
    {
      id: 'pop_progressive',
      name: 'Progressive Field',
      address: '2401 Ontario St, Cleveland, OH 44115',
      lat: 41.4957,
      lng: -81.6852,
      category: 'sports',
    },
    {
      id: 'pop_firstenergy',
      name: 'FirstEnergy Stadium',
      address: '100 Alfred Lerner Way, Cleveland, OH 44114',
      lat: 41.5061,
      lng: -81.6995,
      category: 'sports',
    },
    {
      id: 'pop_rmfh',
      name: 'Rocket Mortgage FieldHouse',
      address: '1 Center Ct, Cleveland, OH 44115',
      lat: 41.4965,
      lng: -81.6882,
      category: 'sports',
    },
  ],
  concert: [
    {
      id: 'pop_rmfh_concert',
      name: 'Rocket Mortgage FieldHouse',
      address: '1 Center Ct, Cleveland, OH 44115',
      lat: 41.4965,
      lng: -81.6882,
      category: 'concert',
    },
    {
      id: 'pop_blossom',
      name: 'Blossom Music Center',
      address: '1145 W Steels Corners Rd, Cuyahoga Falls, OH 44223',
      lat: 41.2039,
      lng: -81.5447,
      category: 'concert',
    },
    {
      id: 'pop_agora',
      name: 'Agora Theatre',
      address: '5000 Euclid Ave, Cleveland, OH 44103',
      lat: 41.4881,
      lng: -81.6344,
      category: 'concert',
    },
  ],
  holiday: [
    {
      id: 'pop_playhouse',
      name: 'Playhouse Square',
      address: '1501 Euclid Ave, Cleveland, OH 44115',
      lat: 41.5020,
      lng: -81.6772,
      category: 'holiday',
    },
  ],
  general: [
    {
      id: 'pop_public_square',
      name: 'Public Square',
      address: '1 Public Square, Cleveland, OH 44113',
      lat: 41.4993,
      lng: -81.6944,
      category: 'general',
    },
  ],
  comedy: [],
  theater: [],
  art: [],
  food: [],
  family: [],
  festival: [],
  conference: [],
  community: [],
  nightlife: [],
};

function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
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

export async function getQuickSelectVenues(
  category: EventCategory,
  center: { lat: number; lng: number }
): Promise<PromoVenue[]> {
  const sponsored = SPONSORED_VENUES.filter((v) => v.category === category);
  
  const popular = POPULAR_VENUES_BY_CATEGORY[category] || [];
  
  const withDistance = popular.map((v) => ({
    ...v,
    distance: haversineMiles(center, { lat: v.lat, lng: v.lng }),
  }));
  
  const nearby = withDistance
    .filter((v) => v.distance <= 50)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6 - sponsored.length);
  
  const combined = [
    ...sponsored,
    ...nearby.map(({ distance, ...v }) => v),
  ];
  
  return combined.slice(0, 6);
}
