import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/providers/AuthProvider';
import { MapPin, Clock, DollarSign, User, Navigation, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface JobRequest {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime: string;
  passengers: number;
  estimatedFare: number;
  distance: number;
  customerName: string;
  customerRating: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed';
}

const mockJobs: JobRequest[] = [
  {
    id: 'job_1',
    pickupAddress: '123 Main St, Cleveland, OH',
    dropoffAddress: 'Progressive Field, Cleveland, OH',
    pickupTime: new Date(Date.now() + 3600000).toISOString(),
    passengers: 2,
    estimatedFare: 45,
    distance: 8.5,
    customerName: 'John Smith',
    customerRating: 4.8,
    status: 'pending',
  },
  {
    id: 'job_2',
    pickupAddress: '456 Oak Ave, Cleveland, OH',
    dropoffAddress: 'Rocket Mortgage FieldHouse, Cleveland, OH',
    pickupTime: new Date(Date.now() + 7200000).toISOString(),
    passengers: 4,
    estimatedFare: 65,
    distance: 12.3,
    customerName: 'Sarah Johnson',
    customerRating: 4.9,
    status: 'pending',
  },
];

export default function DriverJobsScreen() {
  const { driverInfo, toggleDriverAvailability } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRequest[]>(mockJobs);

  const isAvailable = driverInfo?.isAvailable || false;

  const handleAcceptJob = (jobId: string) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, status: 'accepted' as const } : job
      )
    );
  };

  const handleDeclineJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const handleStartJob = (jobId: string) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, status: 'in_progress' as const } : job
      )
    );
  };

  const handleCompleteJob = (jobId: string) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, status: 'completed' as const } : job
      )
    );
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const activeJobs = jobs.filter(j => j.status === 'accepted' || j.status === 'in_progress');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Driver Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {isAvailable ? 'You are online' : 'You are offline'}
            </Text>
          </View>
          <View style={styles.availabilityToggle}>
            <Text style={styles.toggleLabel}>
              {isAvailable ? 'Online' : 'Offline'}
            </Text>
            <Switch
              value={isAvailable}
              onValueChange={toggleDriverAvailability}
              trackColor={{ false: '#94A3B8', true: '#10B981' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {!isAvailable && (
          <View style={styles.offlineNotice}>
            <Text style={styles.offlineText}>
              Go online to start receiving ride requests
            </Text>
          </View>
        )}

        {activeJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Rides</Text>
            {activeJobs.map(job => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={styles.customerInfo}>
                    <User size={20} color="#1E3A8A" />
                    <Text style={styles.customerName}>{job.customerName}</Text>
                    <Text style={styles.rating}>★ {job.customerRating}</Text>
                  </View>
                  <View style={styles.fareBox}>
                    <DollarSign size={18} color="#10B981" />
                    <Text style={styles.fareAmount}>${job.estimatedFare}</Text>
                  </View>
                </View>

                <View style={styles.routeInfo}>
                  <View style={styles.locationRow}>
                    <MapPin size={18} color="#3B82F6" />
                    <Text style={styles.address}>{job.pickupAddress}</Text>
                  </View>
                  <View style={styles.locationRow}>
                    <Navigation size={18} color="#EF4444" />
                    <Text style={styles.address}>{job.dropoffAddress}</Text>
                  </View>
                </View>

                <View style={styles.jobDetails}>
                  <View style={styles.detailItem}>
                    <Clock size={16} color="#64748B" />
                    <Text style={styles.detailText}>{formatTime(job.pickupTime)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <User size={16} color="#64748B" />
                    <Text style={styles.detailText}>{job.passengers} passengers</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MapPin size={16} color="#64748B" />
                    <Text style={styles.detailText}>{job.distance} mi</Text>
                  </View>
                </View>

                <View style={styles.jobActions}>
                  <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => router.push(`/ride-chat/${job.id}`)}
                  >
                    <MessageCircle size={20} color="#3B82F6" />
                    <Text style={styles.messageButtonText}>Message</Text>
                  </TouchableOpacity>
                  
                  {job.status === 'accepted' && (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => handleStartJob(job.id)}
                    >
                      <Text style={styles.primaryButtonText}>Start Ride</Text>
                    </TouchableOpacity>
                  )}
                  
                  {job.status === 'in_progress' && (
                    <TouchableOpacity
                      style={[styles.primaryButton, styles.completeButton]}
                      onPress={() => handleCompleteJob(job.id)}
                    >
                      <Text style={styles.primaryButtonText}>Complete Ride</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {isAvailable && pendingJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Rides</Text>
            {pendingJobs.map(job => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={styles.customerInfo}>
                    <User size={20} color="#1E3A8A" />
                    <Text style={styles.customerName}>{job.customerName}</Text>
                    <Text style={styles.rating}>★ {job.customerRating}</Text>
                  </View>
                  <View style={styles.fareBox}>
                    <DollarSign size={18} color="#10B981" />
                    <Text style={styles.fareAmount}>${job.estimatedFare}</Text>
                  </View>
                </View>

                <View style={styles.routeInfo}>
                  <View style={styles.locationRow}>
                    <MapPin size={18} color="#3B82F6" />
                    <Text style={styles.address}>{job.pickupAddress}</Text>
                  </View>
                  <View style={styles.locationRow}>
                    <Navigation size={18} color="#EF4444" />
                    <Text style={styles.address}>{job.dropoffAddress}</Text>
                  </View>
                </View>

                <View style={styles.jobDetails}>
                  <View style={styles.detailItem}>
                    <Clock size={16} color="#64748B" />
                    <Text style={styles.detailText}>{formatTime(job.pickupTime)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <User size={16} color="#64748B" />
                    <Text style={styles.detailText}>{job.passengers} passengers</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MapPin size={16} color="#64748B" />
                    <Text style={styles.detailText}>{job.distance} mi</Text>
                  </View>
                </View>

                <View style={styles.jobActions}>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDeclineJob(job.id)}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptJob(job.id)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {isAvailable && pendingJobs.length === 0 && activeJobs.length === 0 && (
          <View style={styles.emptyState}>
            <MapPin size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No rides available</Text>
            <Text style={styles.emptySubtitle}>
              Stay online and we'll notify you when new ride requests come in
            </Text>
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  offlineNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  offlineText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  jobCard: {
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  rating: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  fareBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  routeInfo: {
    marginBottom: 16,
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  jobActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748B',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    lineHeight: 20,
  },
});
