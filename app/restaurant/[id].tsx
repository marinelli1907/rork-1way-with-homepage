import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, MapPin, Phone, Clock, Star, Users, Globe, Car, Calendar as CalendarIcon, Plus, Minus, Info } from 'lucide-react-native';
import React, { useState, useMemo, useCallback } from 'react';
import UnifiedDateTimePicker, { UnifiedDateTimePickerResult, roundToNext30Minutes, adjustEndTimeIfNeeded } from '@/components/UnifiedDateTimePicker';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { CLEVELAND_RESTAURANTS } from '@/constants/restaurants';
import { useEvents } from '@/providers/EventsProvider';


export default function RestaurantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const restaurant = CLEVELAND_RESTAURANTS.find(r => r.id === id);
  const { addEvent } = useEvents();
  
  const [partySize, setPartySize] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  
  const initialStart = useMemo(() => {
    const now = new Date();
    const rounded = roundToNext30Minutes(now);
    if (rounded.getTime() <= now.getTime()) {
      const bumped = new Date(rounded);
      bumped.setMinutes(bumped.getMinutes() + 30);
      return bumped;
    }
    return rounded;
  }, []);

  const initialEnd = useMemo(() => {
    return new Date(initialStart.getTime() + 2 * 60 * 60 * 1000);
  }, [initialStart]);

  const [startAt, setStartAt] = useState<Date>(initialStart);
  const [endAt, setEndAt] = useState<Date>(initialEnd);
  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [dateTimePickerTarget, setDateTimePickerTarget] = useState<'start' | 'end' | null>(null);

  const openDateTimePicker = useCallback((target: 'start' | 'end') => {
    setDateTimePickerTarget(target);
    setDateTimePickerVisible(true);
  }, []);

  const closeDateTimePicker = useCallback(() => {
    setDateTimePickerVisible(false);
    setDateTimePickerTarget(null);
  }, []);

  const dateTimePickerInitialDate = useMemo((): Date => {
    return dateTimePickerTarget === 'end' ? endAt : startAt;
  }, [dateTimePickerTarget, endAt, startAt]);

  const handleDateTimePickerDone = useCallback(
    (value: UnifiedDateTimePickerResult) => {
      const next = value.date;

      if (dateTimePickerTarget === 'start') {
        setStartAt(next);
        setEndAt(adjustEndTimeIfNeeded(next, endAt));
        closeDateTimePicker();
        return;
      }

      if (dateTimePickerTarget === 'end') {
        if (next.getTime() <= startAt.getTime()) {
          Alert.alert('Invalid time', 'End time must be after the start time.');
          return;
        }
        setEndAt(next);
        closeDateTimePicker();
        return;
      }

      closeDateTimePicker();
    },
    [closeDateTimePicker, dateTimePickerTarget, endAt, startAt]
  );

  const handleAddToCalendar = useCallback(async () => {
    if (!restaurant) return;

    try {
      const startISO = startAt.toISOString();

      const newEvent = await addEvent({
        userId: 'user_1',
        createdBy: 'user_1',
        title: `${restaurant.name}`,
        category: 'food',
        startISO,
        endISO: endAt.toISOString(),
        venue: restaurant.name,
        address: restaurant.address,
        color: '#10B981',
        tags: ['Dining'],
        source: 'manual',
        notes: specialRequests ? `Notes: ${specialRequests}` : undefined,
        verifiedAddress: {
          lat: restaurant.geo.lat,
          lng: restaurant.geo.lng,
          formatted: restaurant.address,
        },
      });

      console.log('[restaurant] addEvent success', { id: newEvent.id, title: newEvent.title });

      Alert.alert(
        'Added to calendar',
        'Saved this plan to your calendar. You can book a ride later from the event.',
        [
          {
            text: 'View calendar',
            onPress: () => router.push('/(tabs)/my-events'),
          },
          {
            text: 'Done',
            style: 'cancel',
          },
        ]
      );
    } catch (e) {
      console.error('[restaurant] handleAddToCalendar failed', e);
      Alert.alert('Error', 'Failed to add to calendar. Please try again.');
    }
  }, [addEvent, startAt, endAt, restaurant, router, specialRequests]);

  const handleBookRideNow = useCallback(() => {
    if (!restaurant) return;
    const pickupTimeISO = new Date().toISOString();
    router.push(`/select-driver?eventId=${encodeURIComponent('adhoc_restaurant')}&eventTitle=${encodeURIComponent(restaurant.name)}&rideType=arrival&basePrice=18&pickupAddress=${encodeURIComponent('Current location')}&dropoffAddress=${encodeURIComponent(restaurant.address)}&pickupTime=${encodeURIComponent(pickupTimeISO)}&returnTo=${encodeURIComponent('/(tabs)/discover')}`);
  }, [restaurant, router]);

  if (!restaurant) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Restaurant not found</Text>
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: restaurant.imageUrl }} style={styles.headerImage} />
        
        <View style={styles.content}>
          <Text style={styles.title}>{restaurant.name}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{restaurant.rating}</Text>
              <Text style={styles.reviewText}>({restaurant.reviewCount})</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.priceText}>{restaurant.priceRange}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.cuisineText}>{restaurant.cuisine.join(', ')}</Text>
            </View>
          </View>

          <Text style={styles.description}>{restaurant.description}</Text>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <MapPin size={18} color="#64748B" />
              <Text style={styles.infoText}>{restaurant.address}</Text>
            </View>
            {restaurant.phone && (
              <View style={styles.infoRow}>
                <Phone size={18} color="#64748B" />
                <Text style={styles.infoText}>{restaurant.phone}</Text>
              </View>
            )}
            {restaurant.openingHours && (
              <View style={styles.infoRow}>
                <Clock size={18} color="#64748B" />
                <Text style={styles.infoText}>{restaurant.openingHours}</Text>
              </View>
            )}
            {restaurant.website && (
              <View style={styles.infoRow}>
                <Globe size={18} color="#64748B" />
                <Text style={styles.infoText}>{restaurant.website}</Text>
              </View>
            )}
          </View>

          {restaurant.features.length > 0 && (
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.featuresGrid}>
                {restaurant.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureChip}>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.reservationSection}>
            <Text style={styles.sectionTitle}>Plan your night</Text>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Party Size</Text>
              <View style={styles.partySizeControl}>
                <Pressable
                  style={[styles.partySizeAdjustButton, partySize <= 1 && styles.partySizeAdjustButtonDisabled]}
                  onPress={() => partySize > 1 && setPartySize(partySize - 1)}
                  disabled={partySize <= 1}
                >
                  <Minus size={20} color={partySize <= 1 ? '#CBD5E1' : '#1E293B'} strokeWidth={2.5} />
                </Pressable>
                
                <View style={styles.partySizeDisplay}>
                  <Users size={20} color="#1E3A8A" />
                  <Text style={styles.partySizeNumber}>{partySize}</Text>
                  <Text style={styles.partySizeLabel}>{partySize === 1 ? 'person' : 'people'}</Text>
                </View>
                
                <Pressable
                  style={styles.partySizeAdjustButton}
                  onPress={() => setPartySize(partySize + 1)}
                >
                  <Plus size={20} color="#1E293B" strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>When</Text>
              <View style={styles.timeCardsRow}>
                <Pressable
                  style={[styles.timeCardCompact, dateTimePickerVisible && dateTimePickerTarget === 'start' && styles.timeCardActive]}
                  onPress={() => openDateTimePicker('start')}
                  testID="restaurantStartPicker"
                >
                  <Text style={styles.timeCardLabel}>Start</Text>
                  <Text style={styles.timeCardDate}>
                    {startAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.timeCardTime}>
                    {startAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.timeCardCompact, dateTimePickerVisible && dateTimePickerTarget === 'end' && styles.timeCardActive]}
                  onPress={() => openDateTimePicker('end')}
                  testID="restaurantEndPicker"
                >
                  <Text style={styles.timeCardLabel}>End</Text>
                  <Text style={styles.timeCardDate}>
                    {endAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.timeCardTime}>
                    {endAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.infoBox}>
                <Info size={16} color="#3B82F6" />
                <Text style={styles.infoText2}>This does not create an actual reservation at the restaurant. It only adds to your calendar.</Text>
              </View>
            </View>

            <View style={styles.ctaRow}>
              <Pressable
                style={({ pressed }) => [styles.ctaPrimary, pressed && styles.ctaPressed]}
                onPress={handleBookRideNow}
                testID="restaurantBookRideNow"
              >
                <Car size={18} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.ctaPrimaryText}>Book ride now</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.ctaSecondary, pressed && styles.ctaPressed]}
                onPress={handleAddToCalendar}
                testID="restaurantAddToCalendar"
              >
                <CalendarIcon size={18} color="#0F172A" strokeWidth={2} />
                <Text style={styles.ctaSecondaryText}>Add to calendar</Text>
              </Pressable>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Optional details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Special Requests (Optional)"
                placeholderTextColor="#94A3B8"
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <UnifiedDateTimePicker
        visible={dateTimePickerVisible}
        title={dateTimePickerTarget === 'end' ? 'End Time' : 'Start Time'}
        initialDate={dateTimePickerInitialDate}
        allowASAP={false}
        onCancel={closeDateTimePicker}
        onDone={handleDateTimePickerDone}
      />
    </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#E2E8F0',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  reviewText: {
    fontSize: 14,
    color: '#64748B',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#059669',
  },
  cuisineText: {
    fontSize: 14,
    color: '#64748B',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 20,
  },
  infoSection: {
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  reservationSection: {
    marginTop: 8,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  partySizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  partySizeAdjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partySizeAdjustButtonDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.5,
  },
  partySizeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  partySizeNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  partySizeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  timeCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timeCardCompact: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  timeCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  timeCardLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timeCardDate: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  timeCardTime: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText2: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#1E40AF',
    fontWeight: '500' as const,
  },
  ctaRow: {
    gap: 10,
    marginBottom: 24,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#E31937',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  ctaPrimaryText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ctaSecondaryText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  ctaPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 100,
  },
});
