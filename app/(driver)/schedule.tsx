import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, User } from 'lucide-react-native';

interface ScheduledRide {
  id: string;
  date: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime: string;
  estimatedFare: number;
  passengers: number;
}

const mockScheduledRides: ScheduledRide[] = [
  {
    id: 'ride_1',
    date: new Date(Date.now() + 86400000).toISOString(),
    customerName: 'Emma Wilson',
    pickupAddress: '789 Park Ave, Cleveland, OH',
    dropoffAddress: 'Cleveland Hopkins Airport',
    pickupTime: new Date(Date.now() + 86400000 + 28800000).toISOString(),
    estimatedFare: 55,
    passengers: 2,
  },
  {
    id: 'ride_2',
    date: new Date(Date.now() + 172800000).toISOString(),
    customerName: 'David Brown',
    pickupAddress: '321 Elm St, Cleveland, OH',
    dropoffAddress: 'FirstEnergy Stadium',
    pickupTime: new Date(Date.now() + 172800000 + 61200000).toISOString(),
    estimatedFare: 42,
    passengers: 4,
  },
];

export default function DriverScheduleScreen() {
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const groupedRides = mockScheduledRides.reduce((acc, ride) => {
    const dateKey = formatDate(ride.date);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(ride);
    return acc;
  }, {} as Record<string, ScheduledRide[]>);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <Text style={styles.headerSubtitle}>
          {mockScheduledRides.length} upcoming rides
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {Object.entries(groupedRides).length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No scheduled rides</Text>
            <Text style={styles.emptySubtitle}>
              Scheduled rides will appear here
            </Text>
          </View>
        ) : (
          Object.entries(groupedRides).map(([date, rides]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {rides.map(ride => (
                <View key={ride.id} style={styles.rideCard}>
                  <View style={styles.rideHeader}>
                    <View style={styles.timeBox}>
                      <Clock size={16} color="#3B82F6" />
                      <Text style={styles.timeText}>{formatTime(ride.pickupTime)}</Text>
                    </View>
                    <View style={styles.fareBox}>
                      <Text style={styles.fareText}>${ride.estimatedFare}</Text>
                    </View>
                  </View>

                  <View style={styles.customerRow}>
                    <User size={18} color="#64748B" />
                    <Text style={styles.customerName}>{ride.customerName}</Text>
                    <Text style={styles.passengerCount}>
                      {ride.passengers} {ride.passengers === 1 ? 'passenger' : 'passengers'}
                    </Text>
                  </View>

                  <View style={styles.routeInfo}>
                    <View style={styles.locationRow}>
                      <MapPin size={18} color="#10B981" />
                      <Text style={styles.address}>{ride.pickupAddress}</Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.locationRow}>
                      <MapPin size={18} color="#EF4444" />
                      <Text style={styles.address}>{ride.dropoffAddress}</Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.detailsButton}>
                      <Text style={styles.detailsButtonText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 12,
    paddingLeft: 4,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  fareBox: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fareText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  passengerCount: {
    fontSize: 13,
    color: '#64748B',
  },
  routeInfo: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#CBD5E1',
    marginLeft: 8,
    marginVertical: 4,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
