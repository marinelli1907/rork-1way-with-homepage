export interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  genre: string[];
  rating: string;
  duration: number;
  releaseDate: string;
  description: string;
  director?: string;
  cast?: string[];
  trailer?: string;
}

export interface MovieTheater {
  id: string;
  name: string;
  address: string;
  geo: {
    lat: number;
    lng: number;
  };
  phone?: string;
  amenities: string[];
}

export interface MovieShowtime {
  id: string;
  movieId: string;
  theaterId: string;
  startTime: string;
  format: '2D' | '3D' | 'IMAX' | 'Dolby';
  price: number;
  availableSeats: number;
}

export const CLEVELAND_THEATERS: MovieTheater[] = [
  {
    id: 'tower-city',
    name: 'Tower City Cinemas',
    address: '230 W Huron Rd, Cleveland, OH 44113',
    geo: { lat: 41.4985, lng: -81.6933 },
    phone: '(216) 623-4629',
    amenities: ['IMAX', 'Dolby Atmos', 'Reserved Seating', 'Food & Drinks'],
  },
  {
    id: 'regal-crocker',
    name: 'Regal Crocker Park',
    address: '177 Market St, Westlake, OH 44145',
    geo: { lat: 41.4556, lng: -81.9219 },
    phone: '(844) 462-7342',
    amenities: ['IMAX', 'RPX', 'Recliners', 'Food & Drinks'],
  },
  {
    id: 'atlas-lakeshore',
    name: 'Atlas Cinemas Lakeshore 7',
    address: '7850 Mentor Ave, Mentor, OH 44060',
    geo: { lat: 41.6898, lng: -81.3562 },
    phone: '(440) 974-9234',
    amenities: ['Reserved Seating', 'Food & Drinks'],
  },
  {
    id: 'cinemark-valley',
    name: 'Cinemark Valley View',
    address: '6001 Canal Rd, Valley View, OH 44125',
    geo: { lat: 41.3897, lng: -81.6644 },
    phone: '(216) 328-2340',
    amenities: ['XD', 'Luxury Loungers', 'Food & Drinks'],
  },
  {
    id: 'cedar-lee',
    name: 'Cedar Lee Theatre',
    address: '2163 Lee Rd, Cleveland Heights, OH 44118',
    geo: { lat: 41.5069, lng: -81.5594 },
    phone: '(216) 321-5411',
    amenities: ['Art House', 'Bar', 'Indie Films'],
  },
];

export const NOW_PLAYING_MOVIES: Movie[] = [
  {
    id: 'movie-1',
    title: 'Dune: Part Three',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
    genre: ['Sci-Fi', 'Adventure'],
    rating: 'PG-13',
    duration: 166,
    releaseDate: '2025-03-15',
    description: 'The epic conclusion to the Dune saga follows Paul Atreides as he unites with Chani and the Fremen while seeking revenge against those who destroyed his family.',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
  },
  {
    id: 'movie-2',
    title: 'The Last Stand',
    posterUrl: 'https://images.unsplash.com/photo-1485095329183-d0797cdc5676?w=400',
    genre: ['Action', 'Thriller'],
    rating: 'R',
    duration: 128,
    releaseDate: '2025-02-28',
    description: 'A retired special forces operative must protect a small town from a ruthless cartel leader.',
    director: 'Christopher Nolan',
    cast: ['Idris Elba', 'Oscar Isaac', 'Ana de Armas'],
  },
  {
    id: 'movie-3',
    title: 'Love in Paris',
    posterUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400',
    genre: ['Romance', 'Comedy'],
    rating: 'PG-13',
    duration: 112,
    releaseDate: '2025-02-14',
    description: 'Two strangers meet by chance in Paris and spend an unforgettable night exploring the city and falling in love.',
    director: 'Greta Gerwig',
    cast: ['Florence Pugh', 'Dev Patel'],
  },
  {
    id: 'movie-4',
    title: 'Quantum Breach',
    posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400',
    genre: ['Sci-Fi', 'Mystery'],
    rating: 'PG-13',
    duration: 135,
    releaseDate: '2025-03-08',
    description: 'A brilliant physicist discovers a way to communicate with parallel universes but unleashes consequences she never imagined.',
    director: 'Alex Garland',
    cast: ['Tessa Thompson', 'John Boyega', 'Lupita Nyongo'],
  },
  {
    id: 'movie-5',
    title: 'The Haunting Hour',
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400',
    genre: ['Horror', 'Thriller'],
    rating: 'R',
    duration: 98,
    releaseDate: '2025-03-01',
    description: 'A family moves into a historic mansion only to discover its dark secrets and the malevolent presence that haunts its halls.',
    director: 'Ari Aster',
    cast: ['Mahershala Ali', 'Jodie Comer'],
  },
  {
    id: 'movie-6',
    title: 'Guardians United',
    posterUrl: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400',
    genre: ['Action', 'Adventure', 'Superhero'],
    rating: 'PG-13',
    duration: 145,
    releaseDate: '2025-03-22',
    description: 'When an ancient evil threatens Earth, a team of unlikely heroes must band together to save humanity.',
    director: 'Ryan Coogler',
    cast: ['Michael B. Jordan', 'Letitia Wright', 'Jonathan Majors'],
  },
  {
    id: 'movie-7',
    title: 'Whispers in the Wind',
    posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
    genre: ['Drama'],
    rating: 'PG',
    duration: 122,
    releaseDate: '2025-02-21',
    description: 'A heartwarming story about a young girl who discovers a magical connection with nature after moving to the countryside.',
    director: 'Chloé Zhao',
    cast: ['Gemma Chan', 'Brian Tyree Henry'],
  },
  {
    id: 'movie-8',
    title: 'Code Red',
    posterUrl: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400',
    genre: ['Action', 'Spy'],
    rating: 'PG-13',
    duration: 138,
    releaseDate: '2025-03-15',
    description: 'A CIA operative must stop a global terrorist network before they unleash a devastating cyberattack.',
    director: 'James Mangold',
    cast: ['Tom Hardy', 'Emily Blunt', 'Rami Malek'],
  },
];

export function generateShowtimes(movieId: string): MovieShowtime[] {
  const theaters = CLEVELAND_THEATERS;
  const showtimes: MovieShowtime[] = [];
  const today = new Date();
  
  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    
    theaters.forEach((theater, theaterIdx) => {
      const times = ['11:00', '13:30', '16:00', '18:30', '21:00', '23:30'];
      const formats: ('2D' | '3D' | 'IMAX' | 'Dolby')[] = ['2D', '3D'];
      
      if (theater.amenities.includes('IMAX')) {
        formats.push('IMAX');
      }
      if (theater.amenities.includes('Dolby Atmos')) {
        formats.push('Dolby');
      }
      
      times.forEach((time, timeIdx) => {
        const [hours, minutes] = time.split(':');
        const showDate = new Date(date);
        showDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const format = formats[timeIdx % formats.length];
        const basePrice = format === 'IMAX' ? 18 : format === 'Dolby' ? 16 : format === '3D' ? 14 : 12;
        
        showtimes.push({
          id: `${movieId}-${theater.id}-${day}-${timeIdx}`,
          movieId,
          theaterId: theater.id,
          startTime: showDate.toISOString(),
          format,
          price: basePrice,
          availableSeats: Math.floor(Math.random() * 100) + 50,
        });
      });
    });
  }
  
  return showtimes.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}
