import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useEvents } from '@/providers/EventsProvider';
import { EventCategory, EventFormMode } from '@/types';

type Params = {
  mode?: EventFormMode;
  eventId?: string;
  holidayName?: string;
  holidayDate?: string;
};

type CategoryOption = {
  value: EventCategory;
  label: string;
  color: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'general', label: 'General', color: '#64748B' },
  { value: 'concert', label: 'Concert', color: '#4F46E5' },
  { value: 'sports', label: 'Sports', color: '#1D4ED8' },
  { value: 'comedy', label: 'Comedy', color: '#F59E0B' },
  { value: 'theater', label: 'Theater', color: '#7C3AED' },
  { value: 'festival', label: 'Festival', color: '#F97316' },
  { value: 'food', label: 'Food', color: '#16A34A' },
  { value: 'nightlife', label: 'Nightlife', color: '#DC2626' },
  { value: 'family', label: 'Family', color: '#0EA5E9' },
  { value: 'art', label: 'Art', color: '#DB2777' },
  { value: 'community', label: 'Community', color: '#84CC16' },
  { value: 'conference', label: 'Conference', color: '#06B6D4' },
  { value: 'bar', label: 'Bar/Club', color: '#B91C1C' },
  { value: 'holiday', label: 'Holiday', color: '#059669' },
];

function formatWhen(d: Date) {
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<Params>();
  const mode: EventFormMode = (params.mode as EventFormMode) ?? 'create';

  const { addEvent, updateEvent, events } = useEvents();

  const existingEvent = useMemo(() => {
    if (mode === 'create') return undefined;
    const eventId = params.eventId;
    if (!eventId) return undefined;
    return events.find((e) => e.id === eventId);
  }, [events, mode, params.eventId]);

  const holidayName = useMemo(() => {
    const raw = params.holidayName;
    if (!raw) return '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return String(raw);
    }
  }, [params.holidayName]);

  const holidayDate = useMemo(() => {
    if (!params.holidayDate) return null;
    const parsed = new Date(params.holidayDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [params.holidayDate]);

  const initialStart = useMemo(() => {
    if (existingEvent?.startISO) {
      const d = new Date(existingEvent.startISO);
      return Number.isNaN(d.getTime()) ? new Date() : d;
    }
    if (holidayDate) return holidayDate;
    return new Date();
  }, [existingEvent?.startISO, holidayDate]);

  const initialEnd = useMemo(() => {
    if (existingEvent?.endISO) {
      const d = new Date(existingEvent.endISO);
      if (!Number.isNaN(d.getTime())) return d;
    }
    const start = initialStart;
    return new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }, [existingEvent?.endISO, initialStart]);

  const [title, setTitle] = useState<string>(existingEvent?.title ?? holidayName ?? '');
  const [venue, setVenue] = useState<string>(existingEvent?.venue ?? '');
  const [address, setAddress] = useState<string>(existingEvent?.address ?? '');
  const [category, setCategory] = useState<EventCategory>(
    existingEvent?.category ?? (holidayName ? 'holiday' : 'general')
  );
  const [startAt, setStartAt] = useState<Date>(initialStart);
  const [endAt, setEndAt] = useState<Date>(initialEnd);
  const [notes, setNotes] = useState<string>(existingEvent?.notes ?? '');

  const [openStartPicker, setOpenStartPicker] = useState<boolean>(false);
  const [openEndPicker, setOpenEndPicker] = useState<boolean>(false);

  // Web fallbacks
  const [webStartText, setWebStartText] = useState<string>(() => startAt.toISOString());
  const [webEndText, setWebEndText] = useState<string>(() => endAt.toISOString());

  const titleRef = useRef<TextInput>(null);
  const venueRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const screenTitle = useMemo(() => {
    if (mode === 'edit') return 'Edit Event';
    if (mode === 'duplicate') return 'Duplicate Event';
    return 'Create Event';
  }, [mode]);

  const primaryCtaText = useMemo(() => {
    if (mode === 'edit') return 'Save Changes';
    if (mode === 'duplicate') return 'Duplicate Event';
    return 'Add Event';
  }, [mode]);

  const categoryMeta = useMemo(() => {
    return CATEGORY_OPTIONS.find((c) => c.value === category) ?? CATEGORY_OPTIONS[0];
  }, [category]);

  const close = useCallback(() => {
    router.back();
  }, [router]);

  const validateWebDates = useCallback(() => {
    if (Platform.OS !== 'web') return true;

    const parsedStart = new Date(webStartText);
    const parsedEnd = new Date(webEndText);

    if (Number.isNaN(parsedStart.getTime())) {
      Alert.alert('Invalid start time', 'Enter a valid ISO date (example: 2026-01-05T19:30:00.000Z)');
      return false;
    }
    if (Number.isNaN(parsedEnd.getTime())) {
      Alert.alert('Invalid end time', 'Enter a valid ISO date (example: 2026-01-05T21:30:00.000Z)');
      return false;
    }

    setStartAt(parsedStart);
    setEndAt(parsedEnd);
    return true;
  }, [webEndText, webStartText]);

  const submit = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter an event title.');
      titleRef.current?.focus();
      return;
    }

    if (!venue.trim()) {
      Alert.alert('Missing venue', 'Please enter a venue name.');
      venueRef.current?.focus();
      return;
    }

    if (!validateWebDates()) return;

    const startISO = startAt.toISOString();
    const endISO = endAt.toISOString();

    if (new Date(endISO).getTime() <= new Date(startISO).getTime()) {
      Alert.alert('Invalid time', 'End time must be after the start time.');
      return;
    }

    const color = categoryMeta.color;

    const payload = {
      title: title.trim(),
      category,
      startISO,
      endISO,
      venue: venue.trim(),
      address: (address.trim() || venue.trim()) as string,
      color,
      notes: notes.trim() || undefined,
    };

    try {
      if (mode === 'edit' && params.eventId) {
        updateEvent(params.eventId, payload);
        Alert.alert('Saved', 'Event updated.', [{ text: 'OK', onPress: close }]);
        return;
      }

      addEvent({
        userId: 'user_1',
        createdBy: 'user_1',
        tags: [],
        source: 'manual',
        ...payload,
      });

      Alert.alert('Done', mode === 'duplicate' ? 'Event duplicated.' : 'Event added.', [
        { text: 'OK', onPress: close },
      ]);
    } catch (e) {
      console.error('[create-event] submit error', e);
      Alert.alert('Something went wrong', 'Please try again.');
    }
  }, [
    addEvent,
    address,
    category,
    categoryMeta.color,
    close,
    endAt,
    mode,
    notes,
    params.eventId,
    startAt,
    title,
    updateEvent,
    validateWebDates,
    venue,
  ]);

  // Simplified keyboard behavior
  const behavior = Platform.OS === 'ios' ? 'padding' : 'height';
  // Adjust offset based on header height (approx 44-60 + status bar)
  const keyboardOffset = Platform.OS === 'ios' ? 100 : 0; 

  return (
    <>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerShown: true,
          headerLeft: () => (
            <Pressable onPress={close} style={{ paddingRight: 16 }}>
              <X size={24} color="#000" />
            </Pressable>
          ),
        }}
      />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={behavior} 
        keyboardVerticalOffset={keyboardOffset}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Event Title</Text>
            <TextInput
              ref={titleRef}
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Dinner with Friends"
              placeholderTextColor="#94A3B8"
              returnKeyType="next"
              onSubmitEditing={() => venueRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.categoryScroll}
              contentContainerStyle={{ gap: 8, paddingRight: 20 }}
            >
              {CATEGORY_OPTIONS.map((opt) => {
                const isSelected = opt.value === category;
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.categoryChip,
                      isSelected && { backgroundColor: opt.color, borderColor: opt.color }
                    ]}
                    onPress={() => setCategory(opt.value)}
                  >
                    <Text style={[styles.categoryText, isSelected && { color: '#FFF' }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Venue & Address */}
          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              ref={venueRef}
              style={styles.input}
              value={venue}
              onChangeText={setVenue}
              placeholder="Venue Name"
              placeholderTextColor="#94A3B8"
              returnKeyType="next"
              onSubmitEditing={() => addressRef.current?.focus()}
              blurOnSubmit={false}
            />
            <View style={{ height: 12 }} />
            <TextInput
              ref={addressRef}
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Address (Optional)"
              placeholderTextColor="#94A3B8"
              returnKeyType="next"
              onSubmitEditing={() => notesRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Time</Text>
            {Platform.OS === 'web' ? (
              <View style={{ gap: 10 }}>
                <TextInput
                  style={styles.input}
                  value={webStartText}
                  onChangeText={setWebStartText}
                  placeholder="Start ISO"
                />
                <TextInput
                  style={styles.input}
                  value={webEndText}
                  onChangeText={setWebEndText}
                  placeholder="End ISO"
                />
              </View>
            ) : (
              <View style={styles.timeRow}>
                <Pressable style={styles.timeButton} onPress={() => setOpenStartPicker(true)}>
                  <Text style={styles.timeLabel}>Starts</Text>
                  <Text style={styles.timeValue}>{formatWhen(startAt)}</Text>
                </Pressable>
                <View style={styles.timeDivider} />
                <Pressable style={styles.timeButton} onPress={() => setOpenEndPicker(true)}>
                  <Text style={styles.timeLabel}>Ends</Text>
                  <Text style={styles.timeValue}>{formatWhen(endAt)}</Text>
                </Pressable>
              </View>
            )}
            
            {openStartPicker && (
              <DateTimePicker
                value={startAt}
                mode="datetime"
                display="spinner"
                onChange={(e, d) => {
                  if (Platform.OS === 'android') setOpenStartPicker(false);
                  if (d) {
                    setStartAt(d);
                    if (d > endAt) {
                      setEndAt(new Date(d.getTime() + 2 * 3600000));
                    }
                  }
                }}
              />
            )}
            
            {openEndPicker && (
              <DateTimePicker
                value={endAt}
                mode="datetime"
                display="spinner"
                onChange={(e, d) => {
                  if (Platform.OS === 'android') setOpenEndPicker(false);
                  if (d) setEndAt(d);
                }}
              />
            )}
            
            {Platform.OS === 'ios' && (openStartPicker || openEndPicker) && (
              <Pressable 
                style={styles.closePickerButton}
                onPress={() => {
                  setOpenStartPicker(false);
                  setOpenEndPicker(false);
                }}
              >
                <Text style={styles.closePickerText}>Done</Text>
              </Pressable>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              ref={notesRef}
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add details..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
            />
          </View>

        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={styles.submitButton} onPress={submit}>
            <Text style={styles.submitButtonText}>{primaryCtaText}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  timeRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  timeButton: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  timeDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  closePickerButton: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 8,
  },
  closePickerText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: '#E31937',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
