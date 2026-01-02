export type EventCategory = 'concert' | 'bar' | 'holiday' | 'sports' | 'general' | 'comedy' | 'theater' | 'art' | 'food' | 'family' | 'festival' | 'conference' | 'community' | 'nightlife';
export type PerkType = 'free_item' | 'percent_off' | 'dollar_off' | 'appetizer' | 'drink';
export type RedemptionStatus = 'locked' | 'unlocked' | 'redeemed' | 'expired' | 'denied';
export type EventSourceType = 'manual' | 'ticket' | 'import' | 'nearby';
export type RideType = 'arrival' | 'return';
export type SortOption = 'soonest' | 'nearest' | 'popular';
export type DistanceOption = 5 | 10 | 25 | 50;
export type EventFormMode = 'create' | 'edit' | 'duplicate';

export interface Event {
  id: string;
  userId: string;
  title: string;
  category: EventCategory;
  startISO: string;
  endISO: string;
  venue: string;
  address: string;
  color: string;
  tags: string[];
  source: EventSourceType;
  notes?: string;
  ticketInfo?: TicketInfo;
  calendarEventId?: string;
  isPublic?: boolean;
  invitedProfiles?: string[];
  verifiedAddress?: {
    lat: number;
    lng: number;
    formatted: string;
  };
  createdBy?: string;
  attendees?: EventAttendee[];
  personalSchedule?: PersonalSchedule;
  rides?: RideBooking[];
}

export interface TicketInfo {
  orderId?: string;
  section?: string;
  row?: string;
  seatRange?: string;
  team?: string;
}

export interface RideTemplate {
  eventId: string;
  arrivalPickupTime: string;
  returnPickupTime: string;
  arrivalQuote: number;
  returnQuote: number;
}

export interface UserPrefs {
  favoriteGenres: string[];
  favoriteTeams: string[];
  defaultArrivalBufferMin: number;
  defaultReturnBufferMin: number;
  homeAddress?: string;
}

export interface SurgePreset {
  venueMultipliers: Record<string, number>;
  airportFees: Record<string, number>;
  eventOverrides: Record<string, { venue: string; surgeMultiplier: number }>;
}

export interface RideQuoteParams {
  origin: string;
  destination: string;
  pickupTime: string;
  venue?: string;
  isAirport?: boolean;
  eventDate?: string;
  passengers?: number;
  luggage?: number;
}

export interface RideQuote {
  base: number;
  distanceMiles: number;
  perMileCost: number;
  airportFee: number;
  surge: number;
  total: number;
  breakdown: string[];
}

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
  source: 'catalog';
  description?: string;
}

export interface CatalogEventWithDistance extends CatalogEvent {
  distance: number;
  expectedSurge: number;
}

export type EventInterest = 'interested' | 'not_interested' | null;

export interface InterestedEvent {
  catalogEventId: string;
  interestedAt: string;
  notificationScheduled: boolean;
  notificationId?: string;
}

export interface NearbyFilters {
  category: EventCategory | 'all';
  distance: DistanceOption;
  startDate: string;
  endDate: string;
  sort: SortOption;
  searchQuery: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  granted: boolean;
}

export interface Promotion {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  title: string;
  description: string;
  perkType: PerkType;
  perkValue: number;
  minSpend?: number;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  radiusMeters: number;
  budgetCents: number;
  dailyCap: number;
  active: boolean;
  tags: string[];
  geo: { lat: number; lng: number };
  address: string;
  category: EventCategory;
  fineprint?: string;
  sponsored?: boolean;
}

export interface PromotionWithDistance extends Promotion {
  distance: number;
  rideFare: number;
}

export interface Redemption {
  id: string;
  promoId: string;
  userId: string;
  rideId?: string;
  token: string;
  status: RedemptionStatus;
  unlockedAt?: string;
  redeemedAt?: string;
  geoValid: boolean;
  spendValid: boolean;
}

export interface EventSource {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export interface PromoCarouselItem {
  id: string;
  label: string;
  color: string;
}

export interface EventAttendee {
  profileId: string;
  profileName: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
  respondedAt?: string;
  isPublic?: boolean;
  rideInfo?: RideInfo;
}

export interface RideInfo {
  rideType: 'arrival' | 'return';
  orderedBy: 'self' | 'organizer';
  forProfileId: string;
  forProfileName: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupTime: string;
  estimate: number;
  notificationSent?: boolean;
  confirmedAt?: string;
  bookedAt: string;
  bookedByProfileId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  company?: string;
  position?: string;
  dateOfBirth?: string;
  createdAt: string;
  avatar?: string;
  connectionIds?: string[];
  isAppUser?: boolean;
  eventPrivacyPublic?: boolean;
  savedAddresses?: SavedAddress[];
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: ContactSource;
  avatar?: string;
  isAppUser: boolean;
  profileId?: string;
  syncedAt: string;
}

export type ContactSource = 'phone' | 'gmail' | 'outlook' | 'facebook' | 'linkedin' | 'teams' | 'whatsapp' | 'x' | 'discord' | 'manual';

export interface ContactSyncStatus {
  lastSyncedAt?: string;
  phone: boolean;
  gmail: boolean;
  outlook: boolean;
  facebook: boolean;
  linkedin: boolean;
  teams: boolean;
  whatsapp: boolean;
  x: boolean;
  discord: boolean;
}

export interface Connection {
  id: string;
  myProfileId: string;
  connectedProfileId: string;
  connectedAt: string;
  source: ContactSource;
}

export interface WorkGroup {
  id: string;
  name: string;
  description: string;
  members: string[];
  createdAt: string;
  createdBy: string;
}

export interface PersonalSchedule {
  attendStartISO?: string;
  attendEndISO?: string;
  notes?: string;
}

export interface RideBooking {
  id: string;
  rideType: 'arrival' | 'return';
  forProfileId: string;
  forProfileName: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime: string;
  estimatedArrivalTime: string;
  estimate: number;
  bookedAt: string;
  bookedByProfileId: string;
  bookedByProfileName: string;
  status: 'pending' | 'confirmed' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'paid' | 'cancelled';
  driver?: DriverInfo;
  calendarEventId?: string;
  paymentMethodId?: string;
  transactionId?: string;
  specialNotes?: string;
  passengers?: number;
  luggage?: number;
  childSeats?: number;
  rating?: number;
  tip?: number;
  completedAt?: string;
}

export interface DriverInfo {
  id: string;
  name: string;
  rating: number;
  totalTrips: number;
  vehicleModel: string;
  vehicleBrand: string;
  vehicleColor: string;
  licensePlate: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  vehicleImage?: string;
  petFriendly?: boolean;
  xlVehicle?: boolean;
  childSeat?: boolean;
  isFavorite?: boolean;
}

export type PaymentMethodType = 'card' | 'paypal' | 'apple_pay' | 'google_pay';

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  isDefault: boolean;
  createdAt: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  paypalEmail?: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  rideId: string;
  amount: number;
  paymentMethodId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  couponId?: string;
  discount?: number;
}

export type CouponType = 'percentage' | 'fixed_amount' | 'first_ride_free' | 'referral';
export type CouponStatus = 'active' | 'expired' | 'disabled' | 'used';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  description: string;
  minRideAmount?: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usageCount: number;
  status: CouponStatus;
  createdAt: string;
  createdBy: string;
  firstRideOnly?: boolean;
  validForUserIds?: string[];
  excludedVenues?: string[];
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  rideId: string;
  discountAmount: number;
  appliedAt: string;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: number;
  finalAmount: number;
}

export interface SavedAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
}

export type BidFilterType = 'lowest_price' | 'highest_rated' | 'closest' | 'soonest';

export interface BidTimerConfig {
  startedAt: number;
  durationSeconds: number;
  autoSelectEnabled: boolean;
}

export interface DriverRating {
  rideId: string;
  driverId: string;
  userId: string;
  rating: number;
  tip: number;
  comment?: string;
  ratedAt: string;
}
