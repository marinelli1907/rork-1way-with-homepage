import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Lock, Globe } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import BottomSheetModal from '@/components/BottomSheetModal';
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
  const [isPublic, setIsPublic] = useState<boolean>(existingEvent?.isPublic ?? false);

  const [openStartPicker, setOpenStartPicker] = useState<boolean>(false);
  const [openEndPicker, setOpenEndPicker] = useState<boolean>(false);

  const [webStartText, setWebStartText] = useState<string>(() => startAt.toISOString());
  const [webEndText, setWebEndText] = useState<string>(() => endAt.toISOString());

  const screenTitle = useMemo(() => {
    if (mode === 'edit') return 'Edit Event';
    if (mode === 'duplicate') return 'Duplicate Event';
    return 'Create Event';
  }, [mode]);

  const primaryCtaText = useMemo(() => {
    if (mode === 'edit') return 'Save';
    if (mode === 'duplicate') return 'Duplicate';
    return 'Create';
  }, [mode]);

  const categoryMeta = useMemo(() => {
    return CATEGORY_OPTIONS.find((c) => c.value === category) ?? CATEGORY_OPTIONS[0];
  }, [category]);

  const isDirty = useMemo(() => {
    const baseDirty = title.trim() !== '' || venue.trim() !== '' || notes.trim() !== '' || isPublic;

    if (mode === 'edit' && existingEvent) {
      const startISO = startAt.toISOString();
      const endISO = endAt.toISOString();
      const addressValue = (address.trim() || venue.trim()) as string;

      return (
        title.trim() !== (existingEvent.title ?? '').trim() ||
        venue.trim() !== (existingEvent.venue ?? '').trim() ||
        addressValue.trim() !== (existingEvent.address ?? '').trim() ||
        notes.trim() !== (existingEvent.notes ?? '').trim() ||
        category !== existingEvent.category ||
        isPublic !== (existingEvent.isPublic ?? false) ||
        startISO !== existingEvent.startISO ||
        endISO !== existingEvent.endISO
      );
    }

    return baseDirty;
  }, [address, category, existingEvent, isPublic, mode, notes, startAt, endAt, title, venue]);

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

    const venueValue = venue.trim() || 'Unknown Location';

    const payload = {
      title: title.trim(),
      category,
      startISO,
      endISO,
      venue: venueValue,
      address: (address.trim() || venueValue) as string,
      color,
      notes: notes.trim() || undefined,
      isPublic,
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

      Alert.alert('Done', mode === 'duplicate' ? 'Event duplicated.' : 'Event created.', [
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
    isPublic,
  ]);

  const saveButtonDisabled = !title.trim();

  return (
    <BottomSheetModal
      visible={true}
      onClose={close}
      title={screenTitle}
      onSave={submit}
      saveButtonText={primaryCtaText}
      saveButtonDisabled={saveButtonDisabled}
      isDirty={isDirty}
    >
      <View style={styles.section}>
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Dinner with Friends"
          placeholderTextColor="#94A3B8"
          returnKeyType="next"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORY_OPTIONS.map((opt) => {
            const isSelected = opt.value === category;
            return (
              <Pressable
                key={opt.value}
                style={[
                  styles.categoryChip,
                  isSelected && { backgroundColor: opt.color, borderColor: opt.color },
                ]}
                onPress={() => setCategory(opt.value)}
              >
                <Text style={[styles.categoryText, isSelected && { color: '#FFF' }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Venue *</Text>
        <TextInput
          style={styles.input}
          value={venue}
          onChangeText={setVenue}
          placeholder="Venue Name"
          placeholderTextColor="#94A3B8"
          returnKeyType="next"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Address (Optional)</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="123 Main St, City, State"
          placeholderTextColor="#94A3B8"
          returnKeyType="next"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Time</Text>
        {Platform.OS === 'web' ? (
          <View style={{ gap: 10 }}>
            <TextInput
              style={styles.input}
              value={webStartText}
              onChangeText={setWebStartText}
              placeholder="Start ISO (2026-01-05T19:30:00.000Z)"
              placeholderTextColor="#94A3B8"
            />
            <TextInput
              style={styles.input}
              value={webEndText}
              onChangeText={setWebEndText}
              placeholder="End ISO (2026-01-05T21:30:00.000Z)"
              placeholderTextColor="#94A3B8"
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

      <View style={styles.section}>
        <Text style={styles.label}>Privacy</Text>
        <View style={styles.privacyRow}>
          <Pressable
            style={[styles.privacyOption, !isPublic && styles.privacyOptionActive]}
            onPress={() => setIsPublic(false)}
            testID="eventPrivacyPrivate"
          >
            <Lock size={16} color={!isPublic ? '#FFFFFF' : '#64748B'} strokeWidth={2} />
            <Text style={[styles.privacyText, !isPublic && styles.privacyTextActive]}>Private</Text>
          </Pressable>
          <Pressable
            style={[
              styles.privacyOption,
              isPublic && styles.privacyOptionActive,
            ]}
            onPress={() => setIsPublic(true)}
            testID="eventPrivacyPublic"
          >
            <Globe size={16} color={isPublic ? '#FFFFFF' : '#64748B'} strokeWidth={2} />
            <Text style={[styles.privacyText, isPublic && styles.privacyTextActive]}>Public</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add details..."
          placeholderTextColor="#94A3B8"
          multiline
          textAlignVertical="top"
        />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
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
  privacyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  privacyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  privacyOptionActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  privacyOptionDisabled: {
    opacity: 0.45,
  },
  privacyText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#64748B',
  },
  privacyTextActive: {
    color: '#FFFFFF',
  },
  privacyHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
  },
  importedNote: {
    marginTop: 6,
    fontSize: 12,
    color: '#F59E0B',
    fontStyle: 'italic' as const,
  },
});
