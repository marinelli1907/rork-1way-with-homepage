export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  rating: number;
  reviewCount: number;
  address: string;
  geo: {
    lat: number;
    lng: number;
  };
  phone?: string;
  website?: string;
  imageUrl: string;
  description: string;
  openingHours?: string;
  features: string[];
}

export interface RestaurantReservation {
  id: string;
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export const CLEVELAND_RESTAURANTS: Restaurant[] = [
  {
    id: 'lola-bistro',
    name: 'Lola Bistro',
    cuisine: ['American', 'Contemporary'],
    priceRange: '$$$',
    rating: 4.6,
    reviewCount: 1240,
    address: '2058 E 4th St, Cleveland, OH 44115',
    geo: { lat: 41.4984, lng: -81.6862 },
    phone: '(216) 621-5652',
    website: 'https://lolabistro.com',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    description: 'Upscale American bistro featuring seasonal ingredients and creative dishes by Chef Michael Symon.',
    openingHours: 'Mon-Thu 5-10pm, Fri-Sat 5-11pm',
    features: ['Fine Dining', 'Wine Bar', 'Outdoor Seating', 'Private Events'],
  },
  {
    id: 'greenhouse-tavern',
    name: 'The Greenhouse Tavern',
    cuisine: ['Farm-to-Table', 'American'],
    priceRange: '$$',
    rating: 4.5,
    reviewCount: 890,
    address: '2038 E 4th St, Cleveland, OH 44115',
    geo: { lat: 41.4985, lng: -81.6864 },
    phone: '(216) 443-0511',
    website: 'https://thegreenhousetavern.com',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    description: 'Seasonal farm-to-table dining with a focus on locally sourced ingredients and craft cocktails.',
    openingHours: 'Daily 5-10pm',
    features: ['Farm-to-Table', 'Craft Cocktails', 'Brunch', 'Vegetarian Options'],
  },
  {
    id: 'dante',
    name: 'Dante',
    cuisine: ['Italian', 'Mediterranean'],
    priceRange: '$$$',
    rating: 4.7,
    reviewCount: 1580,
    address: '2247 Professor Ave, Cleveland, OH 44113',
    geo: { lat: 41.4824, lng: -81.7045 },
    phone: '(216) 274-1200',
    website: 'https://dantenext.com',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    description: 'Contemporary Italian cuisine with house-made pasta and an extensive wine selection.',
    openingHours: 'Tue-Thu 5-9pm, Fri-Sat 5-10pm',
    features: ['Italian Wine Bar', 'Handmade Pasta', 'Date Night', 'Special Occasions'],
  },
  {
    id: 'marble-room',
    name: 'Marble Room Steaks and Raw Bar',
    cuisine: ['Steakhouse', 'Seafood'],
    priceRange: '$$$$',
    rating: 4.8,
    reviewCount: 2100,
    address: '623 Euclid Ave, Cleveland, OH 44114',
    geo: { lat: 41.5008, lng: -81.6903 },
    phone: '(216) 523-7000',
    website: 'https://marbleroom.com',
    imageUrl: 'https://images.unsplash.com/photo-1588795945-3f1c16a1cd07?w=800',
    description: 'Upscale steakhouse in a historic bank building featuring premium steaks and fresh seafood.',
    openingHours: 'Mon-Thu 4-10pm, Fri-Sat 4-11pm, Sun 4-9pm',
    features: ['Premium Steaks', 'Raw Bar', 'Historic Venue', 'Business Dining'],
  },
  {
    id: 'barrio',
    name: 'Barrio Tacos',
    cuisine: ['Mexican', 'Street Food'],
    priceRange: '$$',
    rating: 4.4,
    reviewCount: 3200,
    address: '806 Literary Rd, Cleveland, OH 44113',
    geo: { lat: 41.4839, lng: -81.7014 },
    phone: '(216) 862-4466',
    website: 'https://barrio-tacos.com',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    description: 'Build-your-own tacos with creative toppings and a vibrant atmosphere. Great for groups.',
    openingHours: 'Daily 11am-11pm',
    features: ['Build Your Own', 'Happy Hour', 'Groups', 'Vegetarian Options'],
  },
  {
    id: 'momocho',
    name: 'Momocho',
    cuisine: ['Mexican', 'Modern'],
    priceRange: '$$',
    rating: 4.6,
    reviewCount: 1450,
    address: '1835 Fulton Rd, Cleveland, OH 44113',
    geo: { lat: 41.4808, lng: -81.7059 },
    phone: '(216) 694-2122',
    website: 'https://momocho.com',
    imageUrl: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800',
    description: 'Modern Mexican cuisine with house-made tortillas, craft margaritas, and a lively atmosphere.',
    openingHours: 'Tue-Thu 4-10pm, Fri-Sat 11am-11pm, Sun 11am-9pm',
    features: ['Craft Margaritas', 'Brunch', 'Outdoor Patio', 'Groups'],
  },
  {
    id: 'sushi-rock',
    name: 'Sushi Rock',
    cuisine: ['Japanese', 'Sushi'],
    priceRange: '$$',
    rating: 4.3,
    reviewCount: 780,
    address: '1276 W 6th St, Cleveland, OH 44113',
    geo: { lat: 41.4862, lng: -81.7001 },
    phone: '(216) 623-1233',
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
    description: 'Modern sushi restaurant with creative rolls and a fun, energetic vibe.',
    openingHours: 'Mon-Thu 11:30am-10pm, Fri-Sat 11:30am-11pm',
    features: ['Sushi Bar', 'Happy Hour', 'Late Night', 'Takeout'],
  },
  {
    id: 'parallax',
    name: 'Parallax Restaurant',
    cuisine: ['American', 'Seafood'],
    priceRange: '$$$',
    rating: 4.7,
    reviewCount: 1120,
    address: '2179 W 11th St, Cleveland, OH 44113',
    geo: { lat: 41.4821, lng: -81.7069 },
    phone: '(216) 583-9999',
    website: 'https://parallaxrestaurant.com',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    description: 'Contemporary American cuisine with an emphasis on seafood and seasonal ingredients.',
    openingHours: 'Tue-Thu 5-10pm, Fri-Sat 5-11pm',
    features: ['Seasonal Menu', 'Craft Cocktails', 'Date Night', 'Chef\'s Table'],
  },
  {
    id: 'fire-food',
    name: 'Fire Food and Drink',
    cuisine: ['American', 'Grill'],
    priceRange: '$$',
    rating: 4.5,
    reviewCount: 2340,
    address: '13220 Shaker Square, Cleveland, OH 44120',
    geo: { lat: 41.4753, lng: -81.5871 },
    phone: '(216) 921-3473',
    website: 'https://firefoodanddrink.com',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    description: 'Neighborhood favorite featuring wood-fired dishes and an extensive wine list.',
    openingHours: 'Daily 5-10pm, Brunch Sat-Sun 10am-2pm',
    features: ['Wood-Fired', 'Wine List', 'Brunch', 'Outdoor Seating'],
  },
  {
    id: 'xinji-noodle',
    name: 'Xinji Noodle Bar',
    cuisine: ['Asian', 'Noodles'],
    priceRange: '$',
    rating: 4.6,
    reviewCount: 890,
    address: '3211 Payne Ave, Cleveland, OH 44114',
    geo: { lat: 41.5057, lng: -81.6725 },
    phone: '(216) 465-8888',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    description: 'Authentic Asian noodle dishes in a casual, modern setting. Fast and delicious.',
    openingHours: 'Daily 11am-9pm',
    features: ['Quick Service', 'Takeout', 'Vegan Options', 'Budget Friendly'],
  },
];

export function generateAvailableTimeSlots(restaurantId: string, date: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const times = [
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
    '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
    '9:00 PM', '9:30 PM', '10:00 PM',
  ];

  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isToday = selectedDate.toDateString() === today.toDateString();
  const currentHour = new Date().getHours();

  times.forEach((time) => {
    const [timeStr, period] = time.split(' ');
    const [hours] = timeStr.split(':');
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    const isPast = isToday && hour <= currentHour;
    const randomAvailability = Math.random() > 0.3;
    
    slots.push({
      time,
      available: !isPast && randomAvailability,
    });
  });

  return slots;
}
