import { EventCategory } from '@/types';

export interface CatalogEvent {
  id: string;
  title: string;
  category: EventCategory;
  startISO: string;
  endISO: string;
  venue: string;
  address: string;
  geo: {
    lat: number;
    lng: number;
  };
  popularity: number;
  distanceMi: number;
  popularScore: number;
  source: 'catalog';
  description?: string;
}

function getDaysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function setTimeToDate(date: Date, hours: number, minutes: number = 0): string {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result.toISOString();
}

function addHours(isoString: string, hours: number): string {
  const date = new Date(isoString);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

export const CATALOG_EVENTS: CatalogEvent[] = [
  {
    id: 'cat_001',
    title: 'Guardians vs Athletics',
    category: 'sports',
    startISO: setTimeToDate(getDaysFromNow(2), 18, 10),
    endISO: addHours(setTimeToDate(getDaysFromNow(2), 18, 10), 3),
    venue: 'Progressive Field',
    address: '2401 Ontario St, Cleveland, OH 44115',
    geo: { lat: 41.4962, lng: -81.6852 },
    popularity: 0.92,
    distanceMi: 12.3,
    popularScore: 920,
    source: 'catalog',
    description: 'MLB Baseball',
  },
  {
    id: 'cat_002',
    title: 'Browns vs Ravens',
    category: 'sports',
    startISO: setTimeToDate(getDaysFromNow(4), 13, 0),
    endISO: addHours(setTimeToDate(getDaysFromNow(4), 13, 0), 3.5),
    venue: 'Cleveland Browns Stadium',
    address: '100 Alfred Lerner Way, Cleveland, OH 44114',
    geo: { lat: 41.5061, lng: -81.6995 },
    popularity: 0.98,
    distanceMi: 13.1,
    popularScore: 980,
    source: 'catalog',
    description: 'NFL Football',
  },
  {
    id: 'cat_003',
    title: 'Imagine Dragons Live',
    category: 'concert',
    startISO: setTimeToDate(getDaysFromNow(6), 20, 0),
    endISO: addHours(setTimeToDate(getDaysFromNow(6), 20, 0), 3),
    venue: 'Rocket Mortgage FieldHouse',
    address: '1 Center Ct, Cleveland, OH 44115',
    geo: { lat: 41.4965, lng: -81.6881 },
    popularity: 0.95,
    distanceMi: 12.5,
    popularScore: 950,
    source: 'catalog',
    description: 'Arena Rock Concert',
  },
  {
    id: 'cat_004',
    title: 'Downtown Willoughby Bar Crawl',
    category: 'bar',
    startISO: setTimeToDate(getDaysFromNow(1), 21, 0),
    endISO: addHours(setTimeToDate(getDaysFromNow(1), 21, 0), 4),
    venue: 'Downtown Willoughby',
    address: '4057 Erie St, Willoughby, OH 44094',
    geo: { lat: 41.6397, lng: -81.4067 },
    popularity: 0.78,
    distanceMi: 3.2,
    popularScore: 780,
    source: 'catalog',
    description: 'Pub crawl featuring 1899, Ballantine, Willoughby Brewing Co.',
  },
  {
    id: 'cat_005',
    title: 'Latest Blockbuster Movie',
    category: 'general',
    startISO: setTimeToDate(getDaysFromNow(0), 19, 30),
    endISO: addHours(setTimeToDate(getDaysFromNow(0), 19, 30), 2.5),
    venue: 'Atlas Cinemas Eastgate 10',
    address: '1970 Mentor Ave, Painesville, OH 44077',
    geo: { lat: 41.7294, lng: -81.2458 },
    popularity: 0.72,
    distanceMi: 8.7,
    popularScore: 720,
    source: 'catalog',
    description: 'Opening weekend premiere',
  },
  {
    id: 'cat_006',
    title: 'Comedy Night at Hilarities',
    category: 'general',
    startISO: setTimeToDate(getDaysFromNow(3), 20, 0),
    endISO: addHours(setTimeToDate(getDaysFromNow(3), 20, 0), 2),
    venue: 'Hilarities 4th Street Theatre',
    address: '2035 E 4th St, Cleveland, OH 44115',
    geo: { lat: 41.4989, lng: -81.6901 },
    popularity: 0.85,
    distanceMi: 12.8,
    popularScore: 850,
    source: 'catalog',
    description: 'Stand-up comedy showcase',
  },
  {
    id: 'cat_007',
    title: 'Hamilton at Playhouse Square',
    category: 'general',
    startISO: setTimeToDate(getDaysFromNow(7), 19, 30),
    endISO: addHours(setTimeToDate(getDaysFromNow(7), 19, 30), 3),
    venue: 'Playhouse Square',
    address: '1501 Euclid Ave, Cleveland, OH 44115',
    geo: { lat: 41.5014, lng: -81.6789 },
    popularity: 0.96,
    distanceMi: 12.2,
    popularScore: 960,
    source: 'catalog',
    description: 'Broadway Musical',
  },
  {
    id: 'cat_008',
    title: 'Summer Music Festival',
    category: 'concert',
    startISO: setTimeToDate(getDaysFromNow(10), 17, 0),
    endISO: addHours(setTimeToDate(getDaysFromNow(10), 17, 0), 5),
    venue: 'Blossom Music Center',
    address: '1145 W Steels Corners Rd, Cuyahoga Falls, OH 44223',
    geo: { lat: 41.1597, lng: -81.5547 },
    popularity: 0.89,
    distanceMi: 25.4,
    popularScore: 890,
    source: 'catalog',
    description: 'Outdoor festival with multiple artists',
  },
  {
    id: 'cat_009',
    title: 'Museum Gala at University Circle',
    category: 'general',
    startISO: setTimeToDate(getDaysFromNow(5), 18, 0),
    endISO: addHours(setTimeToDate(getDaysFromNow(5), 18, 0), 4),
    venue: 'Cleveland Museum of Art',
    address: '11150 East Blvd, Cleveland, OH 44106',
    geo: { lat: 41.5089, lng: -81.6119 },
    popularity: 0.81,
    distanceMi: 15.3,
    popularScore: 810,
    source: 'catalog',
    description: 'Family-friendly art event',
  },
  {
    id: 'cat_010',
    title: 'Edgewater Summer Festival',
    category: 'general',
    startISO: setTimeToDate(getDaysFromNow(8), 12, 0),
    endISO: addHours(setTimeToDate(getDaysFromNow(8), 12, 0), 8),
    venue: 'Edgewater Park',
    address: '6500 Cleveland Memorial Shoreway, Cleveland, OH 44102',
    geo: { lat: 41.4869, lng: -81.7397 },
    popularity: 0.83,
    distanceMi: 18.9,
    popularScore: 830,
    source: 'catalog',
    description: 'Beach festival with food, music, and activities',
  },
  {
    id: 'cat_011',
    title: 'Jazz Night at Nighttown',
    category: 'bar',
    startISO: setTimeToDate(getDaysFromNow(2), 21, 30),
    endISO: addHours(setTimeToDate(getDaysFromNow(2), 21, 30), 3),
    venue: 'Nighttown',
    address: '12387 Cedar Rd, Cleveland Heights, OH 44106',
    geo: { lat: 41.5043, lng: -81.5841 },
    popularity: 0.76,
    distanceMi: 16.8,
    popularScore: 760,
    source: 'catalog',
    description: 'Live jazz performance',
  },
  {
    id: 'cat_012',
    title: 'Indie Film Premiere',
    category: 'general',
    startISO: setTimeToDate(getDaysFromNow(6), 19, 0),
    endISO: addHours(setTimeToDate(getDaysFromNow(6), 19, 0), 2),
    venue: 'Tower City Cinemas',
    address: '230 W Huron Rd, Cleveland, OH 44113',
    geo: { lat: 41.4982, lng: -81.6942 },
    popularity: 0.68,
    distanceMi: 12.6,
    popularScore: 680,
    source: 'catalog',
    description: 'Independent film screening',
  },
  {
    id: 'cat_013',
    title: 'Guardians vs Yankees',
    category: 'sports',
    startISO: setTimeToDate(getDaysFromNow(12), 19, 10),
    endISO: addHours(setTimeToDate(getDaysFromNow(12), 19, 10), 3),
    venue: 'Progressive Field',
    address: '2401 Ontario St, Cleveland, OH 44115',
    geo: { lat: 41.4962, lng: -81.6852 },
    popularity: 0.97,
    distanceMi: 12.3,
    popularScore: 970,
    source: 'catalog',
    description: 'MLB Baseball',
  },
  {
    id: 'cat_014',
    title: 'Electronic Music Festival',
    category: 'concert',
    startISO: setTimeToDate(getDaysFromNow(9), 22, 0),
    endISO: addHours(setTimeToDate(getDaysFromNow(9), 22, 0), 5),
    venue: 'The Agora Theatre',
    address: '5000 Euclid Ave, Cleveland, OH 44103',
    geo: { lat: 41.5042, lng: -81.6163 },
    popularity: 0.84,
    distanceMi: 14.7,
    popularScore: 840,
    source: 'catalog',
    description: 'EDM showcase with top DJs',
  },
  {
    id: 'cat_015',
    title: 'Cavs Watch Party',
    category: 'bar',
    startISO: setTimeToDate(getDaysFromNow(4), 20, 0),
    endISO: addHours(setTimeToDate(getDaysFromNow(4), 20, 0), 3),
    venue: 'Barley House',
    address: '1261 W 58th St, Cleveland, OH 44102',
    geo: { lat: 41.4846, lng: -81.7178 },
    popularity: 0.73,
    distanceMi: 17.2,
    popularScore: 730,
    source: 'catalog',
    description: 'NBA playoff watch party',
  },
];
