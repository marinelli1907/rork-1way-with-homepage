import { useRouter } from 'expo-router';
import {
  MapPin,
  Navigation,
  Clock,
  ArrowRight,
  Users,
  Zap,
  LocateFixed,
  ArrowUpDown,
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import { calculateRideQuote } from '@/utils/pricing';
import * as Location from 'expo-location';
import MyAddresses from '@/components/MyAddresses';
import { SavedAddress } from '@/utils/addresses';
import ScreenShell from '@/components/ScreenShell';

interface Driver {
  id: string;
  name: string;
  rating: number;
  totalTrips: number;
  estimatedArrival: number;
  vehicleModel: string;
  vehicleBrand: string;
  vehicleColor: string;
  licensePlate: string;
  priceModifier: number;
  distance: number;
  avatar: string;
  isAvailable: boolean;
}

const AVAILABLE_DRIVERS: Driver[] = [
  {
    id: 'driver_1',
    name: 'Michael Rodriguez',
    rating: 4.9,
    totalTrips: 1247,
    estimatedArrival: 3,
    vehicleModel: 'Camry',
    vehicleBrand: 'Toyota',
    vehicleColor: 'Silver',
    licensePlate: 'ABC-1234',
    priceModifier: 0,
    distance: 0.4,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    isAvailable: true,
  },
  {
    id: 'driver_2',
    name: 'Sarah Johnson',
    rating: 5.0,
    totalTrips: 2134,
    estimatedArrival: 5,
    vehicleModel: 'Accord',
    vehicleBrand: 'Honda',
    vehicleColor: 'Black',
    licensePlate: 'XYZ-5678',
    priceModifier: 2,
    distance: 0.8,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    isAvailable: true,
  },
  {
    id: 'driver_3',
    name: 'David Chen',
    rating: 4.8,
    totalTrips: 892,
    estimatedArrival: 7,
    vehicleModel: 'Altima',
    vehicleBrand: 'Nissan',
    vehicleColor: 'White',
    licensePlate: 'LMN-9012',
    priceModifier: -3,
    distance: 1.2,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    isAvailable: true,
  },
  {
    id: 'driver_4',
    name: 'Emma Williams',
    rating: 4.95,
    totalTrips: 1563,
    estimatedArrival: 4,
    vehicleModel: 'Model 3',
    vehicleBrand: 'Tesla',
    vehicleColor: 'Blue',
    licensePlate: 'ELC-3456',
    priceModifier: 5,
    distance: 0.6,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    isAvailable: true,
  },
  {
    id: 'driver_5',
    name: 'James Martinez',
    rating: 4.7,
    totalTrips: 634,
    estimatedArrival: 6,
    vehicleModel: 'Suburban',
    vehicleBrand: 'Chevrolet',
    vehicleColor: 'Gray',
    licensePlate: 'PQR-7890',
    priceModifier: -1,
    distance: 1.0,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    isAvailable: true,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [onlineDrivers, setOnlineDrivers] = useState(AVAILABLE_DRIVERS.filter(d => d.isAvailable));
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        setPickupAddress('Enter your pickup location');
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const formattedAddress = `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
        setPickupAddress(formattedAddress || 'Current location');
      } else {
        setPickupAddress('Current location');
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      setPickupAddress('Enter your pickup location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineDrivers(AVAILABLE_DRIVERS.filter(d => d.isAvailable));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const calculatePrice = async () => {
      if (!pickupAddress || !dropoffAddress) {
        setEstimatedPrice(null);
        return;
      }

      setIsCalculating(true);
      try {
        const quote = await calculateRideQuote({
          origin: pickupAddress,
          destination: dropoffAddress,
          pickupTime: new Date().toISOString(),
        });
        setEstimatedPrice(quote.total);
      } catch (error) {
        console.error('Failed to calculate price:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    const timer = setTimeout(() => {
      calculatePrice();
    }, 500);

    return () => clearTimeout(timer);
  }, [pickupAddress, dropoffAddress]);

  const swapAddresses = () => {
    const temp = pickupAddress;
    setPickupAddress(dropoffAddress);
    setDropoffAddress(temp);
  };

  const handleAddressFromSaved = (addr: SavedAddress, type: 'pickup' | 'dropoff') => {
    const formattedAddress = addr.line1;
    if (type === 'pickup') {
      setPickupAddress(formattedAddress);
    } else {
      setDropoffAddress(formattedAddress);
    }
  };

  const handleBookNow = () => {
    if (!pickupAddress || !dropoffAddress) return;

    const basePrice = estimatedPrice || 25.0;
    router.push({
      pathname: '/select-driver',
      params: {
        eventId: 'instant_ride',
        eventTitle: 'Instant Ride',
        rideType: 'arrival',
        basePrice: basePrice.toString(),
        pickupAddress,
        dropoffAddress,
        pickupTime: new Date().toISOString(),
      },
    });
  };

  return (
    <ScreenShell>

        <View style={styles.networkStatus}>
          <View style={styles.networkBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.networkText}>Network Active</Text>
          </View>
          <View style={styles.driverCount}>
            <Users size={16} color="#059669" />
            <Text style={styles.driverCountText}>
              {onlineDrivers.length} drivers online
            </Text>
          </View>
        </View>

        <View style={styles.bookingCard}>
          <Text style={styles.bookingTitle}>Book a Ride</Text>

          <View style={styles.addressInputs}>
            <View style={styles.addressRow}>
              <View style={styles.inputIcon}>
                <View style={styles.pickupDot} />
              </View>

              <View style={styles.textBox}>
                <TextInput
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                  placeholder="Pickup location"
                  placeholderTextColor="#94A3B8"
                  style={styles.addressInput}
                  testID="homePickupInput"
                />
              </View>

              <View style={styles.rightSlot}>
                <Pressable
                  style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
                  onPress={getCurrentLocation}
                  disabled={isLoadingLocation}
                  testID="homeRefreshLocation"
                >
                  <LocateFixed
                    size={18}
                    color="#1E3A8A"
                    strokeWidth={2.5}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.middleRow}>
              <View style={styles.routeLine} />
              <Pressable style={styles.swapButton} onPress={swapAddresses} testID="homeSwapAddresses">
                <ArrowUpDown size={16} color="#64748B" strokeWidth={2.5} />
              </Pressable>
            </View>

            <View style={styles.addressRow}>
              <View style={styles.inputIcon}>
                <MapPin size={20} color="#DC2626" strokeWidth={2.5} />
              </View>

              <View style={styles.textBox}>
                <TextInput
                  value={dropoffAddress}
                  onChangeText={setDropoffAddress}
                  placeholder="Where to?"
                  placeholderTextColor="#94A3B8"
                  style={styles.addressInput}
                  testID="homeDropoffInput"
                />
              </View>

              <View style={styles.rightSlot} />
            </View>
          </View>

          <View style={styles.savedAddressesSection}>
            <View style={styles.savedAddressesHeader}>
              <Text style={styles.savedAddressesLabel}>Quick Fill</Text>
              <Text style={styles.savedAddressesHint}>Tap a chip → Pickup / Venue</Text>
            </View>
            <MyAddresses
              compact
              onPickAsPickup={(addr) => handleAddressFromSaved(addr, 'pickup')}
              onPickAsVenue={(addr) => handleAddressFromSaved(addr, 'dropoff')}
            />
          </View>

          {isCalculating && (
            <View style={styles.priceEstimate}>
              <ActivityIndicator size="small" color="#1E3A8A" />
              <Text style={styles.priceEstimateText}>Calculating...</Text>
            </View>
          )}

          {!isCalculating && estimatedPrice && (
            <View style={styles.priceEstimate}>
              <Zap size={18} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.priceEstimateLabel}>Estimated fare:</Text>
              <Text style={styles.priceEstimateValue}>${estimatedPrice.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.quickDriversSection}>
            <View style={styles.quickDriversHeader}>
              <Text style={styles.quickDriversTitle}>Pick a driver fast</Text>
              <Text style={styles.quickDriversSubtitle}>Skip scrolling later</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickDriversScroll}
              testID="homeQuickDriversScroll"
            >
              {onlineDrivers.slice(0, 5).map((driver) => {
                const disabled = !pickupAddress || !dropoffAddress;
                return (
                  <Pressable
                    key={driver.id}
                    style={({ pressed }) => [
                      styles.quickDriverChip,
                      pressed && styles.quickDriverChipPressed,
                      disabled && styles.quickDriverChipDisabled,
                    ]}
                    onPress={() => {
                      if (disabled) return;
                      const basePrice = estimatedPrice || 25.0;
                      router.push({
                        pathname: '/select-driver',
                        params: {
                          eventId: 'instant_ride',
                          eventTitle: 'Instant Ride',
                          rideType: 'arrival',
                          basePrice: basePrice.toString(),
                          pickupAddress,
                          dropoffAddress,
                          pickupTime: new Date().toISOString(),
                          preselect: 'select_driver',
                          quickDriverId: driver.id,
                        },
                      });
                    }}
                    disabled={disabled}
                    testID={`homeQuickDriver_${driver.id}`}
                  >
                    <Image source={{ uri: driver.avatar }} style={styles.quickDriverAvatar} />
                    <View style={styles.quickDriverText}>
                      <Text style={styles.quickDriverName} numberOfLines={1}>
                        {driver.name.split(' ')[0]}
                      </Text>
                      <Text style={styles.quickDriverMeta} numberOfLines={1}>
                        {driver.estimatedArrival} min • {driver.rating.toFixed(1)}★
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.bookButton,
              pressed && styles.bookButtonPressed,
              (!pickupAddress || !dropoffAddress) && styles.bookButtonDisabled,
            ]}
            onPress={handleBookNow}
            disabled={!pickupAddress || !dropoffAddress}
            testID="homeBookNow"
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
            <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>


        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/my-events')}
          >
            <View style={styles.quickActionIcon}>
              <Navigation size={24} color="#1E3A8A" strokeWidth={2.5} />
            </View>
            <Text style={styles.quickActionTitle}>My Events</Text>
            <Text style={styles.quickActionSubtitle}>View scheduled rides</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionCard}
            onPress={() => router.push('/ride-history')}
          >
            <View style={styles.quickActionIcon}>
              <Clock size={24} color="#8B5CF6" strokeWidth={2.5} />
            </View>
            <Text style={styles.quickActionTitle}>Ride History</Text>
            <Text style={styles.quickActionSubtitle}>Past trips</Text>
          </Pressable>
        </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  networkStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginHorizontal: 20,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  networkText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#059669',
  },
  driverCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverCountText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#059669',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    marginHorizontal: 20,
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 20,
  },
  addressInputs: {
    marginBottom: 12,
    gap: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  textBox: {
    flex: 1,
  },
  addressInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rightSlot: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 15,
  },
  routeLine: {
    width: 2,
    height: 22,
    backgroundColor: '#CBD5E1',
  },
  swapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  savedAddressesSection: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  savedAddressesHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  savedAddressesLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#475569',
  },
  savedAddressesHint: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  priceEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  quickDriversSection: {
    marginBottom: 12,
  },
  quickDriversHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  quickDriversTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  quickDriversSubtitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  quickDriversScroll: {
    gap: 10,
    paddingRight: 4,
  },
  quickDriverChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 140,
  },
  quickDriverChipPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  quickDriverChipDisabled: {
    opacity: 0.5,
  },
  quickDriverAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  quickDriverText: {
    flex: 1,
    gap: 2,
  },
  quickDriverName: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#0F172A',
  },
  quickDriverMeta: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  priceEstimateText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#92400E',
  },
  priceEstimateLabel: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500' as const,
  },
  priceEstimateValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#92400E',
  },
  bookButton: {
    backgroundColor: '#E31937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#E31937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  bookButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});