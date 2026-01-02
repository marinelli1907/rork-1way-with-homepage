import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, MapPin, Clock } from 'lucide-react-native';

type SavedEvent = {
  id: string;
  title: string;
  venue: string;
  date: Date;
  time: Date;
};

export default function SmartCalendarDemo() {
  const [title, setTitle] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);

  const detectVenues = (text: string): string[] => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('1899') || lowerText.includes('downtown willoughby')) {
      return [
        '1899 Pub',
        'Ballantine',
        'Willoughby Brewing Co.',
        'The Morehouse',
        "Nickleby's",
      ];
    }

    if (lowerText.includes('browns')) {
      return ['Cleveland Browns Stadium'];
    }

    if (lowerText.includes('movies')) {
      return ['Atlas Cinemas Eastgate 10'];
    }

    return [];
  };

  const venues = detectVenues(title);

  const handleSave = () => {
    if (!title.trim() || !selectedVenue) {
      return;
    }

    const newEvent: SavedEvent = {
      id: Date.now().toString(),
      title: title.trim(),
      venue: selectedVenue,
      date: startDate,
      time: startTime,
    };

    setSavedEvents([...savedEvents, newEvent]);
    setTitle('');
    setSelectedVenue('');
    setStartDate(new Date());
    setStartTime(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Calendar size={32} color="#E31937" strokeWidth={2} />
          <Text style={styles.headerTitle}>Smart Calendar Demo</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Event Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Try: Birthday party at 1899, Browns game, movies"
            placeholderTextColor="#94A3B8"
          />

          {venues.length > 0 && (
            <View style={styles.chipsContainer}>
              <Text style={styles.chipsLabel}>Quick Select Venue:</Text>
              <View style={styles.chips}>
                {venues.map((venue) => (
                  <Pressable
                    key={venue}
                    style={({ pressed }) => [
                      styles.chip,
                      selectedVenue === venue && styles.chipSelected,
                      pressed && styles.chipPressed,
                    ]}
                    onPress={() => setSelectedVenue(venue)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedVenue === venue && styles.chipTextSelected,
                      ]}
                    >
                      {venue}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {selectedVenue ? (
            <View style={styles.selectedVenueContainer}>
              <View style={styles.selectedVenueHeader}>
                <MapPin size={16} color="#64748B" strokeWidth={2} />
                <Text style={styles.selectedVenueLabel}>Selected Venue</Text>
              </View>
              <View style={styles.venueBox}>
                <Text style={styles.venueText}>{selectedVenue}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeField}>
              <Text style={styles.label}>Start Date</Text>
              <Pressable
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={18} color="#64748B" strokeWidth={2} />
                <Text style={styles.dateTimeText}>{formatDate(startDate)}</Text>
              </Pressable>
            </View>

            <View style={styles.dateTimeField}>
              <Text style={styles.label}>Start Time</Text>
              <Pressable
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={18} color="#64748B" strokeWidth={2} />
                <Text style={styles.dateTimeText}>{formatTime(startTime)}</Text>
              </Pressable>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event: any, selectedDate?: Date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event: any, selectedTime?: Date) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  setStartTime(selectedTime);
                }
              }}
            />
          )}

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              (!title.trim() || !selectedVenue) && styles.saveButtonDisabled,
              pressed && styles.saveButtonPressed,
            ]}
            onPress={handleSave}
            disabled={!title.trim() || !selectedVenue}
          >
            <Text style={styles.saveButtonText}>Save Event</Text>
          </Pressable>
        </View>

        {savedEvents.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.savedTitle}>Saved Events</Text>
            {savedEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventCardLeft}>
                  <View style={styles.eventDateBox}>
                    <Text style={styles.eventDateMonth}>
                      {event.date
                        .toLocaleDateString('en-US', { month: 'short' })
                        .toUpperCase()}
                    </Text>
                    <Text style={styles.eventDateDay}>
                      {event.date.getDate()}
                    </Text>
                  </View>
                </View>

                <View style={styles.eventCardRight}>
                  <Text style={styles.eventCardTitle}>{event.title}</Text>
                  <View style={styles.eventCardDetail}>
                    <MapPin size={14} color="#64748B" strokeWidth={2} />
                    <Text style={styles.eventCardVenue}>{event.venue}</Text>
                  </View>
                  <View style={styles.eventCardDetail}>
                    <Clock size={14} color="#64748B" strokeWidth={2} />
                    <Text style={styles.eventCardTime}>
                      {formatTime(event.time)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipsContainer: {
    marginTop: 16,
  },
  chipsLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: '#E31937',
    borderColor: '#E31937',
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#475569',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  selectedVenueContainer: {
    marginTop: 16,
  },
  selectedVenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  selectedVenueLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  venueBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  venueText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#1E293B',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  dateTimeField: {
    flex: 1,
  },
  dateTimeButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateTimeText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500' as const,
  },
  saveButton: {
    backgroundColor: '#E31937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  saveButtonPressed: {
    opacity: 0.8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  savedSection: {
    marginTop: 24,
  },
  savedTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventCardLeft: {
    marginRight: 16,
  },
  eventDateBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDateMonth: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  eventDateDay: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  eventCardRight: {
    flex: 1,
    justifyContent: 'center',
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 8,
  },
  eventCardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eventCardVenue: {
    fontSize: 14,
    color: '#64748B',
  },
  eventCardTime: {
    fontSize: 14,
    color: '#64748B',
  },
});
