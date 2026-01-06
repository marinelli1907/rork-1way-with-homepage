import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Star, Clock, DollarSign, User, ArrowRight, CheckCircle, Users, Gavel, Zap, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '@/providers/EventsProvider';
import { usePayment } from '@/providers/PaymentProvider';
import { useCoupons } from '@/providers/CouponProvider';
import { syncRideToCalendar } from '@/utils/calendar-sync';
import CouponInput from '@/components/CouponInput';
import { AppliedCoupon } from '@/types';

type PricingOption = 'app_price' | 'select_driver' | 'name_price' | 'receive_bids' | null;

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
  bio?: string;
  bidPrice?: number;
  vehicleImage?: string;
  petFriendly?: boolean;
  xlVehicle?: boolean;
  childSeat?: boolean;
}

const MOCK_DRIVERS: Driver[] = [
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
    bio: '5+ years of experience. Clean vehicle, safe driver.',
    petFriendly: true,
    childSeat: true,
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
    bio: 'Professional driver. Great conversation!',
    xlVehicle: false,
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
    bio: 'Quiet, safe rides. Always on time.',
    petFriendly: false,
  },
  {
    id: 'driver_4',
    name: 'Emma Williams',
    rating: 4.95,
    totalTrips: 1563,
    estimatedArrival: 8,
    vehicleModel: 'Model 3',
    vehicleBrand: 'Tesla',
    vehicleColor: 'Blue',
    licensePlate: 'ELC-3456',
    priceModifier: 5,
    distance: 1.5,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    bio: 'Eco-friendly rides in a Tesla!',
    xlVehicle: false,
    childSeat: true,
  },
  {
    id: 'driver_5',
    name: 'James Martinez',
    rating: 4.7,
    totalTrips: 634,
    estimatedArrival: 10,
    vehicleModel: 'Suburban',
    vehicleBrand: 'Chevrolet',
    vehicleColor: 'Gray',
    licensePlate: 'PQR-7890',
    priceModifier: -1,
    distance: 1.8,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    bio: 'Comfortable rides, XL vehicle for groups.',
    xlVehicle: true,
    childSeat: true,
  },
];

export default function SelectDriverScreen() {
  const router = useRouter();
  const { bookRide, events } = useEvents();

  const { hasPaymentMethods, getDefaultPaymentMethod, createPendingTransaction } = usePayment();
  const { hasUserCompletedRide, recordCouponUsage } = useCoupons();
  const params = useLocalSearchParams<{
    closeOnAdd?: string;
    returnTo?: string;
    eventId: string;
    eventTitle: string;
    rideType: 'arrival' | 'return';
    basePrice: string;
    pickupAddress: string;
    dropoffAddress: string;
    pickupTime: string;
    preselect?: string;
    quickDriverId?: string;
    petsCount?: string;
    accessibilityNeeds?: string;
  }>();

  const [selectedOption, setSelectedOption] = useState<PricingOption>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [biddingMode, setBiddingMode] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [splitCostEnabled, setSplitCostEnabled] = useState(false);
  const [numberOfPassengers, setNumberOfPassengers] = useState(1);
  const [petsCount, setPetsCount] = useState<number>(0);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<boolean>(false);
  const [generatingVehicleImages, setGeneratingVehicleImages] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidsReceived, setBidsReceived] = useState<{ driverId: string; bidPrice: number }[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const basePrice = parseFloat(params.basePrice || '0');

  const pickupDate = new Date(params.pickupTime);

  const event = events.find(e => e.id === params.eventId);

  React.useEffect(() => {
    if (event && event.invitedProfiles && event.invitedProfiles.length > 0) {
      const totalPassengers = event.invitedProfiles.length + 1;
      setNumberOfPassengers(totalPassengers);
    }

    const nextPets = Math.max(0, parseInt((params.petsCount ?? '0').toString() || '0', 10) || 0);
    setPetsCount(nextPets);

    const nextAccessibility = (params.accessibilityNeeds ?? '0').toString() === '1';
    setAccessibilityNeeds(nextAccessibility);
  }, [event, params.accessibilityNeeds, params.petsCount]);


  const loadDrivers = useCallback(async (optionForAutoSelect?: PricingOption) => {
    setLoading(true);
    setGeneratingVehicleImages(false);

    try {
      const sortedDrivers = [...MOCK_DRIVERS].sort((a, b) => a.distance - b.distance);
      setDrivers(sortedDrivers);

      const quickDriverId = (params.quickDriverId ?? '').toString();
      if (quickDriverId) {
        const found = sortedDrivers.find(d => d.id === quickDriverId);
        if (found) {
          console.log('[select-driver] quick driver selected:', found.name);
          setSelectedDriver(found);
          return;
        }
      }

      if (optionForAutoSelect === 'app_price' && sortedDrivers.length > 0) {
        const nearestDriver = sortedDrivers[0];
        console.log('[select-driver] auto-select nearest driver:', nearestDriver.name);
        setSelectedDriver(nearestDriver);
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
    } finally {
      setLoading(false);
    }
  }, [params.quickDriverId]);

  useFocusEffect(
    useCallback(() => {
      if (params.closeOnAdd === '1') {
        console.log('[select-driver] returned from payment-methods: clearing closeOnAdd flag');
        router.setParams({ closeOnAdd: undefined, returnTo: undefined });
      }

      if (!selectedOption) return;

      const hasPay = hasPaymentMethods();
      console.log('[select-driver] focus: selectedOption=', selectedOption, 'hasPaymentMethods=', hasPay);

      if (hasPay) {
        loadDrivers(selectedOption);
      }
    }, [hasPaymentMethods, loadDrivers, params.closeOnAdd, router, selectedOption])
  );

  const handleDriverSelection = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  const handleSendBidRequest = async () => {
    const isNameYourPrice = selectedOption === 'name_price';
    
    if (isNameYourPrice && (!bidAmount || parseFloat(bidAmount) <= 0)) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return;
    }

    Keyboard.dismiss();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    setShowBidModal(false);
    setLoading(true);
    
    if (isNameYourPrice) {
      Alert.alert('Request Sent', 'Your ride request has been sent to all available drivers. They will see both the app price and your offer.');
    } else {
      Alert.alert('Request Sent', 'Your ride request has been sent to all available drivers. They will bid on your ride.');
    }
    
    await loadDrivers(selectedOption);
    
    setTimeout(() => {
      const mockBids = MOCK_DRIVERS.map((driver) => ({
        driverId: driver.id,
        bidPrice: isNameYourPrice 
          ? parseFloat(bidAmount) + (Math.random() * 10 - 5)
          : basePrice + (Math.random() * 15 - 10),
      })).sort((a, b) => a.bidPrice - b.bidPrice);
      
      setDrivers((currentDrivers) => {
        return currentDrivers.map((driver) => {
          const bid = mockBids.find(b => b.driverId === driver.id);
          return bid ? { ...driver, bidPrice: bid.bidPrice } : driver;
        });
      });
      
      setBidsReceived(mockBids);
      setBiddingMode(true);
      Alert.alert('Bids Received', `You received ${mockBids.length} bids from drivers!`);
    }, 3000);
  };

  const handleConfirmDriver = async () => {
    if (!selectedDriver) {
      Alert.alert('Error', 'Please select a driver');
      return;
    }

    if (!hasPaymentMethods()) {
      Alert.alert(
        'Payment Method Required',
        'Please add a payment method before booking a ride',
        [
          {
            text: 'Add Payment Method',
            onPress: () => router.push({ pathname: '/payment-methods', params: { closeOnAdd: '1', returnTo: 'select-driver' } }),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    let finalPrice = biddingMode && selectedDriver.bidPrice 
      ? selectedDriver.bidPrice 
      : basePrice + selectedDriver.priceModifier;

    if (appliedCoupon) {
      finalPrice = appliedCoupon.finalAmount;
    }

    const pricePerPerson = splitCostEnabled ? finalPrice / numberOfPassengers : finalPrice;

    const paymentMethod = getDefaultPaymentMethod();
    if (!paymentMethod) {
      Alert.alert('Error', 'No payment method found');
      return;
    }

    const pickupDate = new Date(params.pickupTime);
    const estimatedArrivalTime = new Date(pickupDate.getTime() + selectedDriver.estimatedArrival * 60 * 1000).toISOString();
    
    const vehicleInfo = `${selectedDriver.vehicleColor} ${selectedDriver.vehicleBrand} ${selectedDriver.vehicleModel}`;
    
    const calendarEventId = await syncRideToCalendar(
      params.eventTitle,
      params.rideType as 'arrival' | 'return',
      params.pickupTime,
      params.pickupAddress,
      params.dropoffAddress,
      selectedDriver.name,
      undefined,
      vehicleInfo,
      selectedDriver.licensePlate
    );

    const newRide = await bookRide(params.eventId, {
      rideType: params.rideType as 'arrival' | 'return',
      forProfileId: 'myself',
      forProfileName: 'You',
      pickupAddress: params.pickupAddress,
      dropoffAddress: params.dropoffAddress,
      pickupTime: params.pickupTime,
      estimatedArrivalTime,
      estimate: finalPrice,
      bookedByProfileId: 'user_1',
      bookedByProfileName: 'You',
      driver: {
        id: selectedDriver.id,
        name: selectedDriver.name,
        rating: selectedDriver.rating,
        totalTrips: selectedDriver.totalTrips,
        vehicleModel: selectedDriver.vehicleModel,
        vehicleBrand: selectedDriver.vehicleBrand,
        vehicleColor: selectedDriver.vehicleColor,
        licensePlate: selectedDriver.licensePlate,
        avatar: selectedDriver.avatar,
        bio: selectedDriver.bio,
        vehicleImage: selectedDriver.vehicleImage,
      },
      calendarEventId: calendarEventId || undefined,
      paymentMethodId: paymentMethod.id,
      petsCount,
      accessibilityNeeds,
    });

    if (newRide) {
      await createPendingTransaction(newRide.id, finalPrice, paymentMethod.id);
      
      if (appliedCoupon) {
        await recordCouponUsage(appliedCoupon.coupon.id, 'user_1', newRide.id, appliedCoupon.discountAmount);
      }
      
      const paymentMethodLabel = paymentMethod.type === 'card' 
        ? `${paymentMethod.cardBrand} •••• ${paymentMethod.cardLast4}`
        : paymentMethod.type === 'paypal'
          ? `PayPal (${paymentMethod.paypalEmail})`
          : paymentMethod.type === 'apple_pay'
            ? 'Apple Pay'
            : 'Google Pay';

      const couponText = appliedCoupon 
        ? `\nCoupon Applied: ${appliedCoupon.coupon.code} (-${appliedCoupon.discountAmount.toFixed(2)})` 
        : '';

      Alert.alert(
        'Ride Confirmed',
        `Driver ${selectedDriver.name} will meet you at ${pickupDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.\n\nVehicle: ${vehicleInfo}\nLicense: ${selectedDriver.licensePlate}\n${splitCostEnabled ? `Split between ${numberOfPassengers} passengers: ${pricePerPerson.toFixed(2)} each\n` : ''}${couponText}\nTotal Price: ${finalPrice.toFixed(2)}\n\nPayment: ${paymentMethodLabel}\nPayment will be processed when the ride is completed.\n\n${calendarEventId ? '✓ Added to calendar with 15-min reminder' : ''}`,
        [
          {
            text: 'View Event',
            onPress: () => {
              router.back();
              router.back();
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Failed to book ride');
    }
  };

  const calculateFinalPrice = (driver: Driver) => {
    let price = basePrice + driver.priceModifier;
    if (biddingMode && driver.bidPrice) {
      price = driver.bidPrice;
    }
    if (appliedCoupon) {
      price = appliedCoupon.finalAmount;
    }
    return price.toFixed(2);
  };

  const calculateSplitPrice = (driver: Driver) => {
    const total = parseFloat(calculateFinalPrice(driver));
    return (total / numberOfPassengers).toFixed(2);
  };

  const handleOptionSelect = (option: PricingOption) => {
    proceedWithOption(option);
  };

  const proceedWithOption = useCallback(async (option: PricingOption) => {
    console.log('[select-driver] proceedWithOption:', option);
    setSelectedOption(option);

    if (option === 'app_price' || option === 'select_driver') {
      await loadDrivers(option);
    } else if (option === 'name_price' || option === 'receive_bids') {
      setShowBidModal(true);
    }
  }, [loadDrivers]);

  React.useEffect(() => {
    const raw = (params.preselect ?? '').toString();
    const next = (raw === 'app_price' || raw === 'select_driver' || raw === 'name_price' || raw === 'receive_bids')
      ? (raw as PricingOption)
      : null;

    if (next && !selectedOption) {
      console.log('[select-driver] preselect option:', next);
      proceedWithOption(next);
    }
  }, [params.preselect, proceedWithOption, selectedOption]);



  const handleCloseModal = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      setShowBidModal(false);
      setSelectedOption(null);
      setBidAmount('');
    }, 100);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>
            {generatingVehicleImages ? 'Loading driver vehicles...' : 'Finding available drivers...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedOption) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Choose Booking Method</Text>
            <Pressable 
              style={styles.closeButton}
              onPress={() => router.back()}
              hitSlop={8}
            >
              <X size={24} color="#64748B" />
            </Pressable>
          </View>
          <Text style={styles.headerSubtitle}>{params.eventTitle}</Text>

          <View style={styles.rideInfoCard}>
            <View style={styles.rideInfoRow}>
              <MapPin size={16} color="#059669" />
              <Text style={styles.rideInfoText} numberOfLines={1}>
                {params.pickupAddress}
              </Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.rideInfoRow}>
              <MapPin size={16} color="#DC2626" />
              <Text style={styles.rideInfoText} numberOfLines={1}>
                {params.dropoffAddress}
              </Text>
            </View>
            <View style={styles.ridePriceRow}>
              <Clock size={14} color="#64748B" />
              <Text style={styles.rideDateText}>
                {pickupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                {pickupDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {(!event || !event.invitedProfiles || event.invitedProfiles.length === 0) && (
            <View style={styles.passengersTopCard}>
              <Text style={styles.passengersTopLabel}>Passengers</Text>
              <View style={styles.passengersTopControl}>
                <Pressable
                  style={styles.passengersTopButton}
                  onPress={() => setNumberOfPassengers(Math.max(1, numberOfPassengers - 1))}
                >
                  <Text style={styles.passengersTopButtonText}>-</Text>
                </Pressable>
                <View style={styles.passengersTopDisplay}>
                  <Users size={16} color="#1E3A8A" />
                  <Text style={styles.passengersTopValue}>{numberOfPassengers}</Text>
                </View>
                <Pressable
                  style={styles.passengersTopButton}
                  onPress={() => setNumberOfPassengers(Math.min(6, numberOfPassengers + 1))}
                >
                  <Text style={styles.passengersTopButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.optionsContent}>
          <Pressable 
            style={({pressed}) => [
              styles.optionCard, 
              pressed && styles.optionCardPressed
            ]} 
            onPress={() => handleOptionSelect('app_price')}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIconContainer}>
                <Zap size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={styles.optionHeaderText}>
                <Text style={styles.optionTitle}>App Price</Text>
                <Text style={styles.optionPrice}>${basePrice.toFixed(2)}</Text>
              </View>
            </View>
            <Text style={styles.optionDescription}>
              Accept our calculated fare and get matched with the nearest available driver immediately.
            </Text>
            <View style={styles.optionBadge}>
              <Text style={styles.optionBadgeText}>FASTEST</Text>
            </View>
          </Pressable>

          <Pressable 
            style={({pressed}) => [
              styles.optionCard, 
              styles.optionCardQuaternary,
              pressed && styles.optionCardPressed
            ]} 
            onPress={() => handleOptionSelect('select_driver')}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.optionIconContainer, styles.optionIconQuaternary]}>
                <User size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={styles.optionHeaderText}>
                <Text style={styles.optionTitle}>Select a Driver</Text>
                <Text style={styles.optionSubtitle}>Choose your driver</Text>
              </View>
            </View>
            <Text style={styles.optionDescription}>
              Browse available drivers, view their profiles and vehicles, then select the one you prefer.
            </Text>
            <View style={[styles.optionBadge, styles.optionBadgeQuaternary]}>
              <Text style={[styles.optionBadgeText, styles.optionBadgeTextQuaternary]}>YOUR CHOICE</Text>
            </View>
          </Pressable>

          <Pressable 
            style={({pressed}) => [
              styles.optionCard, 
              styles.optionCardSecondary,
              pressed && styles.optionCardPressed
            ]} 
            onPress={() => handleOptionSelect('name_price')}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.optionIconContainer, styles.optionIconSecondary]}>
                <DollarSign size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={styles.optionHeaderText}>
                <Text style={styles.optionTitle}>Name Your Price</Text>
                <Text style={styles.optionSubtitle}>Set your budget</Text>
              </View>
            </View>
            <Text style={styles.optionDescription}>
              Send your maximum price to all nearby drivers. They&apos;ll see both the app price (${basePrice.toFixed(2)}) and your offer.
            </Text>
            <View style={[styles.optionBadge, styles.optionBadgeSecondary]}>
              <Text style={[styles.optionBadgeText, styles.optionBadgeTextSecondary]}>BUDGET FRIENDLY</Text>
            </View>
          </Pressable>

          <Pressable 
            style={({pressed}) => [
              styles.optionCard, 
              styles.optionCardTertiary,
              pressed && styles.optionCardPressed
            ]} 
            onPress={() => handleOptionSelect('receive_bids')}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.optionIconContainer, styles.optionIconTertiary]}>
                <Gavel size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={styles.optionHeaderText}>
                <Text style={styles.optionTitle}>Receive Bids</Text>
                <Text style={styles.optionSubtitle}>Let drivers compete</Text>
              </View>
            </View>
            <Text style={styles.optionDescription}>
              Drivers will see the app price (${basePrice.toFixed(2)}) and bid to compete for your ride. Choose the best offer.
            </Text>
            <View style={[styles.optionBadge, styles.optionBadgeTertiary]}>
              <Text style={[styles.optionBadgeText, styles.optionBadgeTextTertiary]}>BEST DEALS</Text>
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable style={styles.backToOptions} onPress={() => {
            setSelectedOption(null);
            setDrivers([]);
            setSelectedDriver(null);
            setBiddingMode(false);
          }}>
            <ArrowRight size={20} color="#1E3A8A" style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.backToOptionsText}>Change Method</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {selectedOption === 'app_price' && 'Nearest Driver'}
            {selectedOption === 'select_driver' && 'Select Your Driver'}
            {selectedOption === 'name_price' && 'Name Your Price'}
            {selectedOption === 'receive_bids' && 'Receive Bids'}
          </Text>
          <Text style={styles.headerSubtitle}>{params.eventTitle}</Text>
        </View>

        <View style={styles.rideInfoCard}>
          <View style={styles.rideInfoRow}>
            <MapPin size={16} color="#059669" />
            <Text style={styles.rideInfoText} numberOfLines={1}>
              {params.pickupAddress}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.rideInfoRow}>
            <MapPin size={16} color="#DC2626" />
            <Text style={styles.rideInfoText} numberOfLines={1}>
              {params.dropoffAddress}
            </Text>
          </View>
        </View>

        {biddingMode && (
          <View style={styles.biddingActiveCard}>
            <Gavel size={18} color="#059669" />
            <Text style={styles.biddingActiveText}>
              Bidding mode active • {bidsReceived.length} bids received
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <CouponInput
          userId="user_1"
          rideAmount={basePrice}
          venue={params.dropoffAddress}
          isFirstRide={!hasUserCompletedRide('user_1')}
          onCouponApplied={setAppliedCoupon}
          onCouponRemoved={() => setAppliedCoupon(null)}
          appliedCoupon={appliedCoupon}
        />

        <View style={styles.splitCostCard}>
          <View style={styles.splitCostHeader}>
            <Users size={20} color="#1E3A8A" />
            <Text style={styles.splitCostTitle}>Split Cost</Text>
          </View>
          <Pressable
            style={styles.splitCostToggle}
            onPress={() => setSplitCostEnabled(!splitCostEnabled)}
          >
            <View style={[styles.toggleCircle, splitCostEnabled && styles.toggleCircleActive]} />
          </Pressable>
        </View>

        {splitCostEnabled && (
          <View style={styles.passengersCard}>
            <Text style={styles.passengersLabel}>Number of passengers:</Text>
            <View style={styles.passengersControl}>
              <Pressable
                style={styles.passengersButton}
                onPress={() => setNumberOfPassengers(Math.max(1, numberOfPassengers - 1))}
              >
                <Text style={styles.passengersButtonText}>-</Text>
              </Pressable>
              <Text style={styles.passengersValue}>{numberOfPassengers}</Text>
              <Pressable
                style={styles.passengersButton}
                onPress={() => setNumberOfPassengers(Math.min(6, numberOfPassengers + 1))}
              >
                <Text style={styles.passengersButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          {biddingMode ? 'Select Best Bid' : `${drivers.length} driver${drivers.length !== 1 ? 's' : ''} nearby`}
        </Text>

        {drivers.map((driver, index) => {
          const isSelected = selectedDriver?.id === driver.id;
          const finalPrice = calculateFinalPrice(driver);
          const isNearest = index === 0;

          return (
            <Pressable
              key={driver.id}
              style={[styles.driverCard, isSelected && styles.driverCardSelected]}
              onPress={() => handleDriverSelection(driver)}
            >
              {isNearest && selectedOption === 'app_price' && !biddingMode && (
                <View style={styles.nearestBadge}>
                  <Zap size={14} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.nearestBadgeText}>NEAREST</Text>
                </View>
              )}
              {biddingMode && driver.bidPrice && (
                <View style={styles.bidBadge}>
                  <Text style={styles.bidBadgeText}>BID: ${driver.bidPrice.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.driverCardHeader}>
                <View style={styles.driverInfo}>
                  {driver.avatar ? (
                    <Image source={{ uri: driver.avatar }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarContainer}>
                      <User size={32} color="#FFFFFF" strokeWidth={2} />
                    </View>
                  )}
                  <View style={styles.driverDetails}>
                    <Text style={[styles.driverName, isSelected && styles.driverNameSelected]}>
                      {driver.name}
                    </Text>
                    <View style={styles.ratingContainer}>
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <Text style={[styles.ratingText, isSelected && styles.ratingTextSelected]}>
                        {driver.rating.toFixed(1)}
                      </Text>
                      <Text style={[styles.tripsText, isSelected && styles.tripsTextSelected]}>
                        • {driver.totalTrips} trips
                      </Text>
                    </View>
                    {driver.bio && (
                      <Text style={[styles.driverBio, isSelected && styles.driverBioSelected]} numberOfLines={1}>
                        {driver.bio}
                      </Text>
                    )}
                  </View>
                </View>

                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <CheckCircle size={24} color="#FFFFFF" fill="#059669" />
                  </View>
                )}
              </View>

              {driver.vehicleImage && (
                <Image 
                  source={{ uri: driver.vehicleImage }} 
                  style={styles.vehicleImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.vehicleInfo}>
                <Text style={[styles.vehicleText, isSelected && styles.vehicleTextSelected]}>
                  {driver.vehicleColor} {driver.vehicleBrand} {driver.vehicleModel}
                </Text>
                <Text style={[styles.licensePlate, isSelected && styles.licensePlateSelected]}>
                  {driver.licensePlate}
                </Text>
              </View>

              <View style={styles.driverStats}>
                <View style={styles.statItem}>
                  <Clock size={16} color={isSelected ? '#FFFFFF' : '#059669'} />
                  <Text style={[styles.statText, isSelected && styles.statTextSelected]}>
                    {driver.estimatedArrival} min
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <MapPin size={16} color={isSelected ? '#FFFFFF' : '#1E3A8A'} />
                  <Text style={[styles.statText, isSelected && styles.statTextSelected]}>
                    {driver.distance.toFixed(1)} mi away
                  </Text>
                </View>

                <View style={styles.priceContainer}>
                  <DollarSign size={20} color={isSelected ? '#FFFFFF' : '#059669'} />
                  <View style={styles.priceColumn}>
                    <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
                      ${finalPrice}
                    </Text>
                    {splitCostEnabled && (
                      <Text style={[styles.splitPriceText, isSelected && styles.splitPriceTextSelected]}>
                        ${calculateSplitPrice(driver)} each
                      </Text>
                    )}
                  </View>
                  {!biddingMode && driver.priceModifier !== 0 && (
                    <Text style={[styles.priceModifier, isSelected && styles.priceModifierSelected]}>
                      {driver.priceModifier > 0 ? '+' : ''}${driver.priceModifier}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedDriver && (
        <View style={styles.footer}>
          <Pressable style={styles.confirmButton} onPress={handleConfirmDriver}>
            <Text style={styles.confirmButtonText}>
              Confirm Ride with {selectedDriver.name}
            </Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      <Modal
        visible={showBidModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name Your Price</Text>
            <Text style={styles.modalDescription}>
              {selectedOption === 'name_price' 
                ? `Enter your maximum price. Drivers will see both the app price (${basePrice.toFixed(2)}) and your offer, then decide if they want to accept.`
                : `Drivers will see the app price (${basePrice.toFixed(2)}) and bid to compete for your ride.`}
            </Text>

            {selectedOption === 'name_price' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Your Maximum Price</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={bidAmount}
                    onChangeText={setBidAmount}
                    keyboardType="decimal-pad"
                    placeholder={basePrice.toFixed(2)}
                    placeholderTextColor="#94A3B8"
                    autoFocus={false}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={handleSendBidRequest}
              >
                <Gavel size={18} color="#FFFFFF" />
                <Text style={styles.modalConfirmButtonText}>
                  {selectedOption === 'name_price' ? 'Send to All Drivers' : 'Request Bids'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backToOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backToOptionsText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600' as const,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  optionsContent: {
    padding: 20,
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#1E3A8A',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  optionCardSecondary: {
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  optionCardTertiary: {
    borderColor: '#059669',
    shadowColor: '#059669',
  },
  optionCardQuaternary: {
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  optionCardDisabled: {
    opacity: 0.5,
    borderColor: '#94A3B8',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
  },
  optionCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconSecondary: {
    backgroundColor: '#8B5CF6',
  },
  optionIconTertiary: {
    backgroundColor: '#059669',
  },
  optionIconQuaternary: {
    backgroundColor: '#F59E0B',
  },
  optionHeaderText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748B',
  },
  optionPrice: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#059669',
  },
  optionDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
    marginBottom: 16,
  },
  optionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E3A8A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionBadgeSecondary: {
    backgroundColor: '#8B5CF6',
  },
  optionBadgeTertiary: {
    backgroundColor: '#059669',
  },
  optionBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  optionBadgeTextSecondary: {
    color: '#FFFFFF',
  },
  optionBadgeTextTertiary: {
    color: '#FFFFFF',
  },
  optionBadgeQuaternary: {
    backgroundColor: '#F59E0B',
  },
  optionBadgeTextQuaternary: {
    color: '#FFFFFF',
  },
  unavailableBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  unavailableBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  ridePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  rideDateText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  rideInfoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rideInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rideInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500' as const,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#CBD5E1',
    marginLeft: 7,
    marginVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 16,
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  driverCardSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  driverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
    gap: 4,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  driverNameSelected: {
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  ratingTextSelected: {
    color: '#FFFFFF',
  },
  tripsText: {
    fontSize: 13,
    color: '#64748B',
  },
  tripsTextSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedBadge: {
    marginLeft: 8,
  },
  vehicleInfo: {
    marginBottom: 12,
    paddingLeft: 68,
  },
  vehicleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 2,
  },
  vehicleTextSelected: {
    color: '#FFFFFF',
  },
  licensePlate: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'monospace' as const,
  },
  licensePlateSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  statTextSelected: {
    color: '#FFFFFF',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#059669',
  },
  priceTextSelected: {
    color: '#FFFFFF',
  },
  priceModifier: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  priceModifierSelected: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  confirmButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  biddingButton: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  biddingButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  biddingActiveCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#059669',
  },
  biddingActiveText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#059669',
  },
  splitCostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  splitCostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splitCostTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  splitCostToggle: {
    width: 52,
    height: 30,
    backgroundColor: '#CBD5E1',
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleCircleActive: {
    backgroundColor: '#059669',
    alignSelf: 'flex-end',
  },
  passengersCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  passengersLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  passengersTopCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passengersTopLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  passengersTopControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  passengersTopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengersTopButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  passengersTopDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    minWidth: 60,
    justifyContent: 'center',
  },
  passengersTopValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  passengersControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  passengersButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengersButtonText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  passengersValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E293B',
    minWidth: 40,
    textAlign: 'center',
  },
  bidBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1,
  },
  bidBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  driverBio: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  driverBioSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  vehicleImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  priceColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  splitPriceText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
    marginTop: 2,
  },
  splitPriceTextSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    paddingVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#64748B',
  },
  modalConfirmButton: {
    flex: 2,
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  passengerPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginVertical: 32,
  },
  passengerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerButtonText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  passengerDisplay: {
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
  },
  passengerCount: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  passengerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  nearestBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  nearestBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
