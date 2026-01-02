import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, MapPin, Phone, Clock, Star, Users, Globe } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { CLEVELAND_RESTAURANTS, generateAvailableTimeSlots } from '@/constants/restaurants';
import * as Calendar from 'expo-calendar';

export default function RestaurantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const restaurant = CLEVELAND_RESTAURANTS.find(r => r.id === id);
  
  const [selectedDate, setSelectedDate] = useState(0);
  const [partySize, setPartySize] = useState(2);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const dates = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      result.push(date);
    }
    return result;
  }, []);

  const timeSlots = useMemo(() => {
    if (!restaurant) return [];
    return generateAvailableTimeSlots(restaurant.id, dates[selectedDate].toISOString());
  }, [restaurant, selectedDate, dates]);

  if (!restaurant) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Restaurant not found</Text>
      </View>
    );
  }

  const handleReservation = async (time: string) => {
    if (!customerName || !customerEmail || !customerPhone) {
      Alert.alert('Missing Information', 'Please fill in all required fields (Name, Email, Phone).');
      return;
    }

    const selectedDateObj = dates[selectedDate];
    const [hours, minutes] = time.split(':');
    const reservationDateTime = new Date(selectedDateObj);
    reservationDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const reservationEndTime = new Date(reservationDateTime.getTime() + 2 * 60 * 60 * 1000);

    Alert.alert(
      'Confirm Reservation',
      `Restaurant: ${restaurant.name}\nDate: ${selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\nTime: ${time}\nParty Size: ${partySize}\nName: ${customerName}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              if (Platform.OS !== 'web') {
                const { status } = await Calendar.requestCalendarPermissionsAsync();
                if (status === 'granted') {
                  const calendarId = await getDefaultCalendar();
                  if (calendarId) {
                    await Calendar.createEventAsync(calendarId, {
                      title: `🍽️ ${restaurant.name}`,
                      startDate: reservationDateTime,
                      endDate: reservationEndTime,
                      location: restaurant.address,
                      notes: `Party Size: ${partySize}\nName: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone}${specialRequests ? `\nSpecial Requests: ${specialRequests}` : ''}\n\nRating: ${restaurant.rating}⭐ (${restaurant.reviewCount} reviews)\nCuisine: ${restaurant.cuisine.join(', ')}`,
                      timeZone: 'America/New_York',
                      alarms: [{ relativeOffset: -60 }],
                    });
                    Alert.alert('Success!', 'Your reservation has been confirmed and added to your calendar.');
                    router.back();
                    return;
                  }
                }
              }
              Alert.alert('Success!', 'Your reservation request has been confirmed.');
              router.back();
            } catch (error) {
              console.error('Failed to add to calendar:', error);
              Alert.alert('Success!', 'Your reservation request has been confirmed.');
              router.back();
            }
          }
        }
      ]
    );
  };

  const getDefaultCalendar = async (): Promise<string | null> => {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(
        cal => cal.allowsModifications && cal.source.name === 'Default'
      );
      if (defaultCalendar) return defaultCalendar.id;
      const writableCalendar = calendars.find(cal => cal.allowsModifications);
      return writableCalendar?.id || null;
    } catch (error) {
      console.error('Failed to get default calendar:', error);
      return null;
    }
  };

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
            <Text style={styles.sectionTitle}>Make a Reservation</Text>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Party Size</Text>
              <View style={styles.partySizeSelector}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                  <Pressable
                    key={size}
                    style={[
                      styles.partySizeButton,
                      partySize === size && styles.partySizeButtonActive,
                    ]}
                    onPress={() => setPartySize(size)}
                  >
                    <Users size={16} color={partySize === size ? '#FFFFFF' : '#64748B'} />
                    <Text style={[
                      styles.partySizeText,
                      partySize === size && styles.partySizeTextActive,
                    ]}>
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Select Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.datesScroll}
              >
                {dates.map((date, idx) => (
                  <Pressable
                    key={idx}
                    style={[
                      styles.dateChip,
                      selectedDate === idx && styles.dateChipActive,
                    ]}
                    onPress={() => setSelectedDate(idx)}
                  >
                    <Text style={[
                      styles.dateDay,
                      selectedDate === idx && styles.dateDayActive,
                    ]}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text style={[
                      styles.dateNumber,
                      selectedDate === idx && styles.dateNumberActive,
                    ]}>
                      {date.getDate()}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Select Time</Text>
              <View style={styles.timeSlotsGrid}>
                {timeSlots.map((slot) => (
                  <Pressable
                    key={slot.time}
                    style={[
                      styles.timeSlotButton,
                      !slot.available && styles.timeSlotButtonDisabled,
                    ]}
                    onPress={() => slot.available && handleReservation(slot.time)}
                    disabled={!slot.available}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      !slot.available && styles.timeSlotTextDisabled,
                    ]}>
                      {slot.time}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Your Information</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor="#94A3B8"
                value={customerName}
                onChangeText={setCustomerName}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address *"
                placeholderTextColor="#94A3B8"
                value={customerEmail}
                onChangeText={setCustomerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                placeholderTextColor="#94A3B8"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />
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
  partySizeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  partySizeButton: {
    width: 70,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 4,
  },
  partySizeButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  partySizeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  partySizeTextActive: {
    color: '#FFFFFF',
  },
  datesScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  dateChip: {
    width: 70,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 4,
  },
  dateDayActive: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  dateNumberActive: {
    color: '#FFFFFF',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  timeSlotButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  timeSlotTextDisabled: {
    color: '#94A3B8',
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
