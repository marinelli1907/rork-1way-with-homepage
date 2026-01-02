export const POPULAR_VENUES = [
  {
    name: 'Progressive Field',
    address: '2401 Ontario St, Cleveland, OH 44115',
    category: 'sports' as const,
    team: 'Cleveland Guardians',
  },
  {
    name: 'Rocket Mortgage FieldHouse',
    address: '1 Center Ct, Cleveland, OH 44115',
    category: 'sports' as const,
    team: 'Cleveland Cavaliers',
  },
  {
    name: 'FirstEnergy Stadium',
    address: '100 Alfred Lerner Way, Cleveland, OH 44114',
    category: 'sports' as const,
    team: 'Cleveland Browns',
  },
  {
    name: 'Jacobs Pavilion',
    address: '2014 Sycamore St, Cleveland, OH 44113',
    category: 'concert' as const,
  },
  {
    name: 'House of Blues Cleveland',
    address: '308 Euclid Ave, Cleveland, OH 44114',
    category: 'concert' as const,
  },
  {
    name: 'The Agora Theatre',
    address: '5000 Euclid Ave, Cleveland, OH 44103',
    category: 'concert' as const,
  },
] as const;

export const AIRPORTS = [
  { code: 'CLE', name: 'Cleveland Hopkins International Airport', fee: 25 },
  { code: 'CMH', name: 'John Glenn Columbus International Airport', fee: 20 },
  { code: 'DAY', name: 'Dayton International Airport', fee: 30 },
] as const;

export const VENUE_SURGE_MULTIPLIERS: Record<string, number> = {
  'Progressive Field': 1.3,
  'Rocket Mortgage FieldHouse': 1.25,
  'FirstEnergy Stadium': 1.4,
  'Jacobs Pavilion': 1.15,
  'House of Blues Cleveland': 1.1,
  'The Agora Theatre': 1.1,
};
