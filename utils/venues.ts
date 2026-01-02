import { haversineMiles } from '@/utils/smart-add';
import { EventCategory } from '@/types';

export interface VenueResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: EventCategory;
  distanceMiles: number;
}

const ALL_VENUES: Omit<VenueResult, 'distanceMiles'>[] = [
  {
    id: 'v_1899_pub',
    name: '1899 Pub',
    address: '38228 Glenn Ave, Willoughby, OH 44094',
    lat: 41.63994,
    lng: -81.40783,
    category: 'bar',
  },
  {
    id: 'v_ballantine',
    name: 'Ballantine',
    address: '4113 Erie St, Willoughby, OH 44094',
    lat: 41.63942,
    lng: -81.40631,
    category: 'bar',
  },
  {
    id: 'v_willoughby_brewing',
    name: 'Willoughby Brewing Co.',
    address: '4057 Erie St, Willoughby, OH 44094',
    lat: 41.6389,
    lng: -81.4057,
    category: 'bar',
  },
  {
    id: 'v_morehouse',
    name: 'The Morehouse',
    address: '4054 Erie St, Willoughby, OH 44094',
    lat: 41.63878,
    lng: -81.4054,
    category: 'bar',
  },
  {
    id: 'v_nicklebys',
    name: "Nickleby's",
    address: '4051 Erie St, Willoughby, OH 44094',
    lat: 41.63865,
    lng: -81.4052,
    category: 'bar',
  },
  {
    id: 'v_progressive_field',
    name: 'Progressive Field',
    address: '2401 Ontario St, Cleveland, OH 44115',
    lat: 41.4957,
    lng: -81.6852,
    category: 'sports',
  },
  {
    id: 'v_firstenergy',
    name: 'FirstEnergy Stadium',
    address: '100 Alfred Lerner Way, Cleveland, OH 44114',
    lat: 41.5061,
    lng: -81.6995,
    category: 'sports',
  },
  {
    id: 'v_rmfh',
    name: 'Rocket Mortgage FieldHouse',
    address: '1 Center Ct, Cleveland, OH 44115',
    lat: 41.4965,
    lng: -81.6882,
    category: 'sports',
  },
  {
    id: 'v_blossom',
    name: 'Blossom Music Center',
    address: '1145 W Steels Corners Rd, Cuyahoga Falls, OH 44223',
    lat: 41.2039,
    lng: -81.5447,
    category: 'concert',
  },
  {
    id: 'v_agora',
    name: 'Agora Theatre',
    address: '5000 Euclid Ave, Cleveland, OH 44103',
    lat: 41.4881,
    lng: -81.6344,
    category: 'concert',
  },
  {
    id: 'v_playhouse',
    name: 'Playhouse Square',
    address: '1501 Euclid Ave, Cleveland, OH 44115',
    lat: 41.5020,
    lng: -81.6772,
    category: 'holiday',
  },
  {
    id: 'v_public_square',
    name: 'Public Square',
    address: '1 Public Square, Cleveland, OH 44113',
    lat: 41.4993,
    lng: -81.6944,
    category: 'general',
  },
  {
    id: 'v_hilarities',
    name: 'Hilarities Comedy Club',
    address: '2035 East 4th St, Cleveland, OH 44115',
    lat: 41.4988,
    lng: -81.6892,
    category: 'bar',
  },
  {
    id: 'v_atlas_cinemas',
    name: 'Atlas Cinemas Eastgate 10',
    address: '1345 SOM Center Rd, Mayfield Heights, OH 44124',
    lat: 41.5197,
    lng: -81.4452,
    category: 'general',
  },
  {
    id: 'v_edgewater_park',
    name: 'Edgewater Park',
    address: '6500 Cleveland Memorial Shoreway, Cleveland, OH 44102',
    lat: 41.4870,
    lng: -81.7329,
    category: 'general',
  },
  {
    id: 'v_university_circle',
    name: 'University Circle',
    address: '11150 East Blvd, Cleveland, OH 44106',
    lat: 41.5089,
    lng: -81.6101,
    category: 'general',
  },
  {
    id: 'v_flannery',
    name: "Flannery's Pub",
    address: '323 Prospect Ave E, Cleveland, OH 44115',
    lat: 41.4977,
    lng: -81.6897,
    category: 'bar',
  },
  {
    id: 'v_barley_house',
    name: 'Barley House',
    address: '1261 W 6th St, Cleveland, OH 44113',
    lat: 41.4961,
    lng: -81.6995,
    category: 'bar',
  },
  {
    id: 'v_warehouse_district',
    name: 'Warehouse District Tavern',
    address: '1200 W 6th St, Cleveland, OH 44113',
    lat: 41.4959,
    lng: -81.6987,
    category: 'bar',
  },
  {
    id: 'v_great_lakes',
    name: 'Great Lakes Brewing Co.',
    address: '2516 Market Ave, Cleveland, OH 44113',
    lat: 41.4841,
    lng: -81.7018,
    category: 'bar',
  },
];

export async function fetchVenuesPage(params: {
  center: { lat: number; lng: number };
  category?: EventCategory;
  radiusMiles: number;
  page: number;
  limit: number;
}): Promise<VenueResult[]> {
  const { center, category, radiusMiles, page, limit } = params;

  let filtered = ALL_VENUES.map((venue) => ({
    ...venue,
    distanceMiles: haversineMiles(center, { lat: venue.lat, lng: venue.lng }),
  })).filter((v) => v.distanceMiles <= radiusMiles);

  if (category) {
    filtered = filtered.filter((v) => v.category === category);
  }

  filtered.sort((a, b) => a.distanceMiles - b.distanceMiles);

  const startIdx = page * limit;
  const endIdx = startIdx + limit;

  return filtered.slice(startIdx, endIdx);
}
