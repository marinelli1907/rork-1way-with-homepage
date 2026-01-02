import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Star, Heart, DollarSign, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '@/providers/EventsProvider';

const TIP_OPTIONS = [2, 5, 10, 15];

export default function RateRideScreen() {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { events, updateRideStatus } = useEvents();
  
  const [rating, setRating] = useState(0);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');
  const [comment, setComment] = useState('');
  const [addToFavorites, setAddToFavorites] = useState(false);

  const ride = events
    .flatMap(e => e.rides || [])
    .find(r => r.id === rideId);

  const driver = ride?.driver;

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please rate your driver before submitting');
      return;
    }

    const tipAmount = selectedTip || (customTip ? parseFloat(customTip) : 0);

    try {
      await updateRideStatus(rideId, 'paid');
      
      Alert.alert(
        'Thank You!',
        `Your ${rating}-star rating has been submitted${tipAmount > 0 ? ` with a $${tipAmount.toFixed(2)} tip` : ''}. ${addToFavorites ? `${driver?.name} has been added to your favorite drivers.` : ''}`,
        [
          {
            text: 'Done',
            onPress: () => {
              router.back();
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit rating:', error);
      Alert.alert('Error', 'Failed to submit your rating. Please try again.');
    }
  };

  if (!ride || !driver) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Rate Your Ride' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ride information not found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const vehicleInfo = `${driver.vehicleColor} ${driver.vehicleBrand} ${driver.vehicleModel}`;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: 'Rate Your Ride',
          headerBackVisible: true,
        }} 
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>Ride Completed</Text>
          </View>
          
          {driver.avatar ? (
            <Image source={{ uri: driver.avatar }} style={styles.driverAvatar} />
          ) : (
            <View style={styles.driverAvatarPlaceholder}>
              <User size={40} color="#FFFFFF" />
            </View>
          )}
          
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.vehicleText}>{vehicleInfo}</Text>
          <Text style={styles.licensePlateText}>{driver.licensePlate}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How was your ride?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Star
                  size={48}
                  color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                  fill={star <= rating ? '#F59E0B' : 'transparent'}
                  strokeWidth={2}
                />
              </Pressable>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good!' : rating === 3 ? 'Okay' : rating === 2 ? 'Not Great' : 'Poor'}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a tip (optional)</Text>
          <View style={styles.tipGrid}>
            {TIP_OPTIONS.map((amount) => (
              <Pressable
                key={amount}
                style={[
                  styles.tipButton,
                  selectedTip === amount && styles.tipButtonSelected,
                ]}
                onPress={() => {
                  setSelectedTip(amount);
                  setCustomTip('');
                }}
              >
                <DollarSign
                  size={20}
                  color={selectedTip === amount ? '#FFFFFF' : '#059669'}
                />
                <Text
                  style={[
                    styles.tipButtonText,
                    selectedTip === amount && styles.tipButtonTextSelected,
                  ]}
                >
                  ${amount}
                </Text>
              </Pressable>
            ))}
            <View style={styles.customTipContainer}>
              <Text style={styles.customTipLabel}>Custom</Text>
              <View style={styles.customTipInputWrapper}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.customTipInput}
                  value={customTip}
                  onChangeText={(text) => {
                    setCustomTip(text);
                    setSelectedTip(null);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments (optional)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Share more about your experience..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{comment.length}/500</Text>
        </View>

        <Pressable
          style={styles.favoritesToggle}
          onPress={() => setAddToFavorites(!addToFavorites)}
        >
          <View style={styles.favoritesToggleIcon}>
            <Heart
              size={20}
              color={addToFavorites ? '#DC2626' : '#64748B'}
              fill={addToFavorites ? '#DC2626' : 'transparent'}
            />
          </View>
          <View style={styles.favoritesToggleContent}>
            <Text style={styles.favoritesToggleTitle}>Add to Favorite Drivers</Text>
            <Text style={styles.favoritesToggleDescription}>
              Request {driver.name} again for future rides
            </Text>
          </View>
        </Pressable>

        <View style={styles.rideDetailsCard}>
          <Text style={styles.rideDetailsTitle}>Ride Details</Text>
          <View style={styles.rideDetailRow}>
            <Text style={styles.rideDetailLabel}>Total Fare</Text>
            <Text style={styles.rideDetailValue}>${ride.estimate.toFixed(2)}</Text>
          </View>
          {(selectedTip || customTip) && (
            <View style={styles.rideDetailRow}>
              <Text style={styles.rideDetailLabel}>Tip</Text>
              <Text style={styles.rideDetailValue}>
                ${(selectedTip || parseFloat(customTip || '0')).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.rideDetailRow, styles.rideDetailRowTotal]}>
            <Text style={styles.rideDetailLabelTotal}>Total</Text>
            <Text style={styles.rideDetailValueTotal}>
              ${(ride.estimate + (selectedTip || parseFloat(customTip || '0'))).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0}
        >
          <Text style={styles.submitButtonText}>Submit Rating</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  completedBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  completedBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  driverAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  driverAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 8,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 4,
  },
  licensePlateText: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'monospace' as const,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#059669',
    textAlign: 'center',
  },
  tipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tipButton: {
    flex: 1,
    minWidth: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  tipButtonSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  tipButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#059669',
  },
  tipButtonTextSelected: {
    color: '#FFFFFF',
  },
  customTipContainer: {
    flex: 1,
    minWidth: 140,
  },
  customTipLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 8,
  },
  customTipInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginRight: 4,
  },
  customTipInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    paddingVertical: 14,
  },
  commentInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 8,
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  favoritesToggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoritesToggleContent: {
    flex: 1,
  },
  favoritesToggleTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  favoritesToggleDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  rideDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rideDetailsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 16,
  },
  rideDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideDetailRowTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: 0,
  },
  rideDetailLabel: {
    fontSize: 15,
    color: '#64748B',
  },
  rideDetailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  rideDetailLabelTotal: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  rideDetailValueTotal: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#059669',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
