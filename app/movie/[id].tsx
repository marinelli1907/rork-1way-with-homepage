import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, Clock, MapPin } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { NOW_PLAYING_MOVIES, generateShowtimes, CLEVELAND_THEATERS, MovieShowtime } from '@/constants/movies';
import * as Calendar from 'expo-calendar';
import { syncEventToCalendar } from '@/utils/calendar-sync';
import { Platform } from 'react-native';

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const movie = NOW_PLAYING_MOVIES.find(m => m.id === id);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTheater, setSelectedTheater] = useState<string | null>(null);

  const showtimes = useMemo(() => {
    if (!movie) return [];
    return generateShowtimes(movie.id);
  }, [movie]);

  const dates = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      result.push(date);
    }
    return result;
  }, []);

  const filteredShowtimes = useMemo(() => {
    const selectedDateObj = dates[selectedDate];
    selectedDateObj.setHours(0, 0, 0, 0);
    
    return showtimes.filter(st => {
      const stDate = new Date(st.startTime);
      stDate.setHours(0, 0, 0, 0);
      const matchesDate = stDate.getTime() === selectedDateObj.getTime();
      const matchesTheater = !selectedTheater || st.theaterId === selectedTheater;
      return matchesDate && matchesTheater;
    });
  }, [showtimes, selectedDate, selectedTheater, dates]);

  const groupedByTheater = useMemo(() => {
    const groups: Record<string, MovieShowtime[]> = {};
    filteredShowtimes.forEach(st => {
      if (!groups[st.theaterId]) {
        groups[st.theaterId] = [];
      }
      groups[st.theaterId].push(st);
    });
    return groups;
  }, [filteredShowtimes]);

  if (!movie) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Movie not found</Text>
      </View>
    );
  }

  const handleBooking = async (showtime: MovieShowtime) => {
    const theater = CLEVELAND_THEATERS.find(t => t.id === showtime.theaterId);
    const startTime = new Date(showtime.startTime);
    const endTime = new Date(startTime.getTime() + movie.duration * 60 * 1000);
    
    Alert.alert(
      'Book Tickets',
      `${movie.title}\n${theater?.name}\n${startTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}\n${showtime.format} - ${showtime.price}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Booking',
          onPress: async () => {
            try {
              if (Platform.OS !== 'web') {
                const { status } = await Calendar.requestCalendarPermissionsAsync();
                if (status === 'granted') {
                  const calendarId = await getDefaultCalendar();
                  if (calendarId) {
                    await Calendar.createEventAsync(calendarId, {
                      title: `🎬 ${movie.title}`,
                      startDate: startTime,
                      endDate: endTime,
                      location: `${theater?.name}, ${theater?.address}`,
                      notes: `${showtime.format}\nPrice: ${showtime.price}\nRating: ${movie.rating}`,
                      timeZone: 'America/New_York',
                      alarms: [{ relativeOffset: -60 }],
                    });
                    Alert.alert('Success!', 'Your movie reservation has been added to your calendar.');
                    router.back();
                    return;
                  }
                }
              }
              Alert.alert('Booking Confirmed', 'Your movie reservation has been confirmed.');
              router.back();
            } catch (error) {
              console.error('Failed to add to calendar:', error);
              Alert.alert('Booking Confirmed', 'Your movie reservation has been confirmed.');
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
        <Image source={{ uri: movie.posterUrl }} style={styles.poster} />
        
        <View style={styles.content}>
          <Text style={styles.title}>{movie.title}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.rating}>{movie.rating}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Clock size={14} color="#64748B" />
              <Text style={styles.metaText}>{movie.duration} min</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaText}>{movie.genre.join(', ')}</Text>
            </View>
          </View>

          <Text style={styles.description}>{movie.description}</Text>

          {movie.director && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Director</Text>
              <Text style={styles.infoValue}>{movie.director}</Text>
            </View>
          )}

          {movie.cast && movie.cast.length > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Cast</Text>
              <Text style={styles.infoValue}>{movie.cast.join(', ')}</Text>
            </View>
          )}

          <View style={styles.showtimesSection}>
            <Text style={styles.sectionTitle}>Select Date</Text>
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

            <Text style={styles.sectionTitle}>Select Theater</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.theatersScroll}
            >
              <Pressable
                style={[
                  styles.theaterChip,
                  !selectedTheater && styles.theaterChipActive,
                ]}
                onPress={() => setSelectedTheater(null)}
              >
                <Text style={[
                  styles.theaterChipText,
                  !selectedTheater && styles.theaterChipTextActive,
                ]}>
                  All Theaters
                </Text>
              </Pressable>
              {CLEVELAND_THEATERS.map((theater) => (
                <Pressable
                  key={theater.id}
                  style={[
                    styles.theaterChip,
                    selectedTheater === theater.id && styles.theaterChipActive,
                  ]}
                  onPress={() => setSelectedTheater(theater.id)}
                >
                  <Text style={[
                    styles.theaterChipText,
                    selectedTheater === theater.id && styles.theaterChipTextActive,
                  ]}>
                    {theater.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Available Showtimes</Text>
            {Object.keys(groupedByTheater).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No showtimes available</Text>
              </View>
            ) : (
              Object.entries(groupedByTheater).map(([theaterId, times]) => {
                const theater = CLEVELAND_THEATERS.find(t => t.id === theaterId);
                if (!theater) return null;

                return (
                  <View key={theaterId} style={styles.theaterSection}>
                    <View style={styles.theaterHeader}>
                      <View style={styles.theaterInfo}>
                        <Text style={styles.theaterName}>{theater.name}</Text>
                        <View style={styles.theaterLocation}>
                          <MapPin size={12} color="#64748B" />
                          <Text style={styles.theaterAddress}>{theater.address}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.showtimesGrid}>
                      {times.map((showtime) => (
                        <Pressable
                          key={showtime.id}
                          style={({ pressed }) => [
                            styles.showtimeButton,
                            pressed && styles.showtimeButtonPressed,
                          ]}
                          onPress={() => handleBooking(showtime)}
                        >
                          <View style={styles.showtimeContent}>
                            <Text style={styles.showtimeTime}>
                              {new Date(showtime.startTime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </Text>
                            <Text style={styles.showtimeFormat}>{showtime.format}</Text>
                            <Text style={styles.showtimePrice}>${showtime.price}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              })
            )}
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
  poster: {
    width: '100%',
    height: 400,
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
  rating: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  metaText: {
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
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 20,
  },
  showtimesSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 8,
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
  theatersScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  theaterChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  theaterChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  theaterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  theaterChipTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
  },
  theaterSection: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  theaterHeader: {
    marginBottom: 16,
  },
  theaterInfo: {
    gap: 6,
  },
  theaterName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  theaterLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  theaterAddress: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  showtimesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  showtimeButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    minWidth: 100,
  },
  showtimeButtonPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  showtimeContent: {
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  showtimeTime: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  showtimeFormat: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
  },
  showtimePrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 100,
  },
});
