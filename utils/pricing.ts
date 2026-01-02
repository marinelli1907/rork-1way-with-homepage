import { RideQuote, RideQuoteParams } from '@/types';
import { AIRPORTS, VENUE_SURGE_MULTIPLIERS } from '@/constants/venues';

const BASE_FARE = 40;
const PER_MILE_RIDE = 1.2;

function calculateDistance(origin: string, destination: string): number {
  const hash = (origin + destination).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 5 + (hash % 25);
}

function getTimeOfDaySurge(pickupTime: string): number {
  const hour = new Date(pickupTime).getHours();
  
  if (hour >= 17 && hour <= 20) {
    return 0.3;
  }
  
  if (hour >= 21 && hour <= 23) {
    return 0.2;
  }
  
  if (hour >= 6 && hour <= 8) {
    return 0.15;
  }
  
  return 0;
}

function getVenueSurge(venue?: string): number {
  if (!venue) return 0;
  
  const multiplier = VENUE_SURGE_MULTIPLIERS[venue];
  if (!multiplier) return 0;
  
  return multiplier - 1;
}

function getAirportFee(destination: string): number {
  const airportMatch = AIRPORTS.find(airport => 
    destination.toLowerCase().includes(airport.name.toLowerCase()) ||
    destination.toLowerCase().includes(airport.code.toLowerCase())
  );
  
  return airportMatch ? airportMatch.fee : 0;
}

function getEventDaySurge(eventDate?: string, venue?: string): number {
  if (!eventDate || !venue) return 0;
  
  const knownEventVenues = ['Progressive Field', 'Rocket Mortgage FieldHouse', 'FirstEnergy Stadium'];
  if (knownEventVenues.includes(venue)) {
    return 0.5;
  }
  
  return 0;
}

function roundToFive(num: number): number {
  return Math.ceil(num / 5) * 5;
}

export function calculateRideQuote(params: RideQuoteParams): RideQuote {
  const distanceMiles = calculateDistance(params.origin, params.destination);
  const airportFee = getAirportFee(params.destination);
  const timeOfDaySurge = getTimeOfDaySurge(params.pickupTime);
  const venueSurge = getVenueSurge(params.venue);
  const eventDaySurge = getEventDaySurge(params.eventDate, params.venue);
  
  const basePlusDistance = BASE_FARE + (distanceMiles * PER_MILE_RIDE);
  const totalSurge = 1 + timeOfDaySurge + venueSurge + eventDaySurge;
  const subtotal = (basePlusDistance + airportFee) * totalSurge;
  const total = roundToFive(subtotal);
  
  const breakdown: string[] = [
    `Base fare: $${BASE_FARE}`,
    `Distance (${distanceMiles} mi): $${(distanceMiles * PER_MILE_RIDE).toFixed(2)}`,
  ];
  
  if (airportFee > 0) {
    breakdown.push(`Airport fee: $${airportFee}`);
  }
  
  if (timeOfDaySurge > 0) {
    breakdown.push(`Time surge: +${(timeOfDaySurge * 100).toFixed(0)}%`);
  }
  
  if (venueSurge > 0) {
    breakdown.push(`Venue surge: +${(venueSurge * 100).toFixed(0)}%`);
  }
  
  if (eventDaySurge > 0) {
    breakdown.push(`Event day surge: +${(eventDaySurge * 100).toFixed(0)}%`);
  }
  
  return {
    base: BASE_FARE,
    distanceMiles,
    perMileCost: PER_MILE_RIDE * distanceMiles,
    airportFee,
    surge: totalSurge,
    total,
    breakdown,
  };
}
