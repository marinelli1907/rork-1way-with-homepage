import { useRouter, Stack } from 'expo-router';
import { Clock, MapPin, DollarSign, Star, Download, Calendar } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Share,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '@/providers/EventsProvider';
import { usePayment } from '@/providers/PaymentProvider';
import { RideBooking } from '@/types';

export default function RideHistoryScreen() {
  const router = useRouter();
  const { events } = useEvents();
  const { paymentMethods } = usePayment();

  const completedRides = useMemo(() => {
    const rides: RideBooking[] = [];
    
    events.forEach(event => {
      if (event.rides) {
        event.rides.forEach(ride => {
          if (ride.status === 'completed' || ride.status === 'paid') {
            rides.push(ride);
          }
        });
      }
    });

    return rides.sort((a, b) => {
      const aTime = new Date(a.completedAt || a.bookedAt).getTime();
      const bTime = new Date(b.completedAt || b.bookedAt).getTime();
      return bTime - aTime;
    });
  }, [events]);

  const handleExportReceipt = async (ride: RideBooking) => {
    const paymentMethod = paymentMethods.find(pm => pm.id === ride.paymentMethodId);
    const paymentMethodLabel = paymentMethod?.type === 'card' 
      ? `${paymentMethod.cardBrand} •••• ${paymentMethod.cardLast4}`
      : paymentMethod?.type === 'paypal'
        ? `PayPal (${paymentMethod.paypalEmail})`
        : paymentMethod?.type === 'apple_pay'
          ? 'Apple Pay'
          : 'Google Pay';

    const rideDate = new Date(ride.pickupTime);
    const completedDate = new Date(ride.completedAt || ride.bookedAt);
    
    const vehicleInfo = ride.driver 
      ? `${ride.driver.vehicleColor} ${ride.driver.vehicleBrand} ${ride.driver.vehicleModel}`
      : 'N/A';

    const receiptText = `
RIDE RECEIPT
━━━━━━━━━━━━━━━━━━━━

Ride ID: ${ride.id}
Date: ${rideDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Time: ${rideDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}

DRIVER
${ride.driver?.name || 'N/A'}
${vehicleInfo}
License: ${ride.driver?.licensePlate || 'N/A'}
${ride.rating ? `Rating: ${ride.rating} ⭐` : ''}

ROUTE
From: ${ride.pickupAddress}
To: ${ride.dropoffAddress}

PAYMENT
Fare: $${ride.estimate.toFixed(2)}
${ride.tip ? `Tip: $${ride.tip.toFixed(2)}` : ''}
${ride.tip ? `Total: $${(ride.estimate + ride.tip).toFixed(2)}` : ''}
Payment Method: ${paymentMethodLabel}
Status: Paid
Completed: ${completedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${completedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}

━━━━━━━━━━━━━━━━━━━━
Thank you for riding with us!
    `.trim();

    try {
      await Share.share({
        message: receiptText,
        title: `Ride Receipt - ${rideDate.toLocaleDateString()}`,
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to export receipt');
    }
  };

  const handleViewRideDetails = (ride: RideBooking) => {
    const paymentMethod = paymentMethods.find(pm => pm.id === ride.paymentMethodId);
    const paymentMethodLabel = paymentMethod?.type === 'card' 
      ? `${paymentMethod.cardBrand} •••• ${paymentMethod.cardLast4}`
      : paymentMethod?.type === 'paypal'
        ? `PayPal (${paymentMethod.paypalEmail})`
        : paymentMethod?.type === 'apple_pay'
          ? 'Apple Pay'
          : 'Google Pay';

    const rideDate = new Date(ride.pickupTime);
    const completedDate = new Date(ride.completedAt || ride.bookedAt);
    
    const vehicleInfo = ride.driver 
      ? `${ride.driver.vehicleColor} ${ride.driver.vehicleBrand} ${ride.driver.vehicleModel}`
      : 'N/A';

    const detailsText = `
Driver: ${ride.driver?.name || 'N/A'}
Vehicle: ${vehicleInfo}
License: ${ride.driver?.licensePlate || 'N/A'}
${ride.rating ? `Rating: ${ride.rating} ⭐` : ''}

Pickup: ${ride.pickupAddress}
Dropoff: ${ride.dropoffAddress}

Scheduled: ${rideDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
Completed: ${completedDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}

Fare: $${ride.estimate.toFixed(2)}
${ride.tip ? `Tip: $${ride.tip.toFixed(2)}\nTotal: $${(ride.estimate + ride.tip).toFixed(2)}` : ''}

Payment: ${paymentMethodLabel}
    `.trim();

    Alert.alert('Ride Details', detailsText, [
      {
        text: 'Export Receipt',
        onPress: () => handleExportReceipt(ride),
      },
      {
        text: 'Close',
        style: 'cancel',
      },
    ]);
  };

  if (completedRides.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Ride History',
            headerBackVisible: true,
          }} 
        />
        <View style={styles.emptyContainer}>
          <Calendar size={64} color="#CBD5E1" strokeWidth={2} />
          <Text style={styles.emptyTitle}>No Completed Rides</Text>
          <Text style={styles.emptyDescription}>
            Your completed rides will appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: 'Ride History',
          headerBackVisible: true,
        }} 
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.totalRidesText}>{completedRides.length} completed ride{completedRides.length !== 1 ? 's' : ''}</Text>
        </View>

        {completedRides.map((ride) => {
          const rideDate = new Date(ride.pickupTime);
          const vehicleInfo = ride.driver 
            ? `${ride.driver.vehicleColor} ${ride.driver.vehicleBrand} ${ride.driver.vehicleModel}`
            : 'N/A';

          return (
            <Pressable
              key={ride.id}
              style={styles.rideCard}
              onPress={() => handleViewRideDetails(ride)}
            >
              <View style={styles.rideCardHeader}>
                <View style={styles.driverInfo}>
                  {ride.driver?.avatar ? (
                    <Image source={{ uri: ride.driver.avatar }} style={styles.driverAvatar} />
                  ) : (
                    <View style={styles.driverAvatarPlaceholder}>
                      <Text style={styles.driverAvatarText}>
                        {ride.driver?.name?.charAt(0) || '?'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.driverDetails}>
                    <Text style={styles.driverName}>{ride.driver?.name || 'N/A'}</Text>
                    <Text style={styles.vehicleText}>{vehicleInfo}</Text>
                    {ride.rating && (
                      <View style={styles.ratingRow}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>{ride.rating} ⭐</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>${ride.estimate.toFixed(2)}</Text>
                  {ride.tip && <Text style={styles.tipText}>+${ride.tip.toFixed(2)} tip</Text>}
                </View>
              </View>

              <View style={styles.routeInfo}>
                <View style={styles.routeRow}>
                  <MapPin size={14} color="#059669" />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {ride.pickupAddress}
                  </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                  <MapPin size={14} color="#DC2626" />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {ride.dropoffAddress}
                  </Text>
                </View>
              </View>

              <View style={styles.rideCardFooter}>
                <View style={styles.dateRow}>
                  <Clock size={14} color="#64748B" />
                  <Text style={styles.dateText}>
                    {rideDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                    {rideDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                <Pressable
                  style={styles.exportButton}
                  onPress={() => handleExportReceipt(ride)}
                >
                  <Download size={16} color="#1E3A8A" />
                  <Text style={styles.exportButtonText}>Receipt</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  totalRidesText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  driverAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverAvatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  driverDetails: {
    flex: 1,
    gap: 4,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  vehicleText: {
    fontSize: 13,
    color: '#64748B',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#059669',
  },
  tipText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  routeInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#CBD5E1',
    marginLeft: 6,
    marginVertical: 4,
  },
  routeText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  rideCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
});
