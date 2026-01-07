import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

import BottomSheetModal from '@/components/BottomSheetModal';
import { useEvents } from '@/providers/EventsProvider';
import { EventCategory, EventFormMode } from '@/types';

type Params = {
  mode?: EventFormMode | EventFormMode[];
  eventId?: string | string[];
  holidayName?: string | string[];
  holidayDate?: string | string[];
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
  const date = d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${date} at ${time}`;
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default function CreateEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const modeParam = firstParam(params.mode as unknown as string | string[] | undefined);
  const mode: EventFormMode = (modeParam as EventFormMode) ?? 'create';

  const eventId = firstParam(params.eventId);
  const holidayNameParam = firstParam(params.holidayName);
  const holidayDateParam = firstParam(params.holidayDate);

  const { addEvent, updateEvent, events } = useEvents();

  const existingEvent = useMemo(() => {
    if (mode === 'create') return undefined;
    if (!eventId) return undefined;
    return events.find((e) => e.id === eventId);
  }, [eventId, events, mode]);

  const holidayName = useMemo(() => {
    const raw = holidayNameParam;
    if (!raw) return '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return String(raw);
    }
  }, [holidayNameParam]);

  const holidayDate = useMemo(() => {
    if (!holidayDateParam) return null;
    const parsed = new Date(holidayDateParam);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [holidayDateParam]);

  const initialStart = useMemo(() => {
    if (existingEvent?.startISO) {
      const d = new Date(existingEvent.startISO);
      return Number.isNaN(d.getTime()) ? new Date() : d;
    }
    if (holidayDate) return holidayDate;
    
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now;
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

  const hydratedFromExistingRef = useRef<boolean>(false);

  useEffect(() => {
    if (mode !== 'edit') return;
    if (!existingEvent) return;
    if (hydratedFromExistingRef.current) return;

    hydratedFromExistingRef.current = true;
    console.log('[create-event] hydrate form from existing event', {
      eventId: existingEvent.id,
      title: existingEvent.title,
      startISO: existingEvent.startISO,
      endISO: existingEvent.endISO,
    });

    setTitle(existingEvent.title ?? '');
    setVenue(existingEvent.venue ?? '');
    setAddress(existingEvent.address ?? '');
    setCategory(existingEvent.category ?? 'general');
    setStartAt(new Date(existingEvent.startISO));
    setEndAt(new Date(existingEvent.endISO));
    setNotes(existingEvent.notes ?? '');
    if (Platform.OS === 'web') {
      setWebStartText(existingEvent.startISO);
      setWebEndText(existingEvent.endISO);
    }
  }, [existingEvent, mode]);

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
    const baseDirty = title.trim() !== '' || venue.trim() !== '' || notes.trim() !== '';

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
        startISO !== existingEvent.startISO ||
        endISO !== existingEvent.endISO
      );
    }

    return baseDirty;
  }, [address, category, existingEvent, mode, notes, startAt, endAt, title, venue]);

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

  const submit = useCallback(async () => {
    console.log('[create-event] submit called', { mode, title: title.trim(), venue: venue.trim() });
    
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter an event title.');
      return;
    }

    if (!validateWebDates()) return;

    const startISO = startAt.toISOString();
    const endISO = endAt.toISOString();

    console.log('[create-event] dates validated', { startISO, endISO });

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
    };

    console.log('[create-event] payload prepared', { payload });

    try {
      if (mode === 'edit' && eventId) {
        console.log('[create-event] saving edit eventId=', eventId);
        await updateEvent(eventId, payload);
        console.log('[create-event] edit successful');
        Alert.alert('Saved', 'Event updated.', [{ text: 'OK', onPress: close }]);
        return;
      }

      if (mode === 'edit' && !eventId) {
        console.warn('[create-event] edit mode but missing eventId param');
        Alert.alert('Error', 'Missing event id. Please close and try again.');
        return;
      }

      console.log('[create-event] calling addEvent...');
      const newEvent = await addEvent({
        userId: 'user_1',
        createdBy: 'user_1',
        tags: [],
        source: 'manual',
        ...payload,
      });

      console.log('[create-event] event created successfully', { eventId: newEvent.id });
      Alert.alert(
        'Success!', 
        mode === 'duplicate' ? 'Event duplicated.' : 'Event created.', 
        [
          { text: 'OK', onPress: () => {
            console.log('[create-event] closing after save');
            close();
          }},
        ]
      );
    } catch (e) {
      console.error('[create-event] submit error', e);
      Alert.alert('Error', `Failed to save event: ${e instanceof Error ? e.message : 'Unknown error'}`);
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
    eventId,
    startAt,
    title,
    updateEvent,
    validateWebDates,
    venue,
  ]);

  const saveButtonDisabled = mode === 'edit' ? !isDirty || !title.trim() : !title.trim();

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
            <Pressable 
              style={styles.timeButton} 
              onPress={() => {
                setOpenEndPicker(false);
                setOpenStartPicker(true);
              }}
            >
              <Text style={styles.timeLabel}>Starts</Text>
              <Text style={styles.timeValue}>{formatWhen(startAt)}</Text>
            </Pressable>
            <View style={styles.timeDivider} />
            <Pressable 
              style={styles.timeButton} 
              onPress={() => {
                setOpenStartPicker(false);
                setOpenEndPicker(true);
              }}
            >
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
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {openStartPicker ? 'Select Start Time' : 'Select End Time'}
              </Text>
            </View>
            <Pressable
              style={styles.closePickerButton}
              onPress={() => {
                setOpenStartPicker(false);
                setOpenEndPicker(false);
              }}
            >
              <Text style={styles.closePickerText}>Done</Text>
            </Pressable>
          </View>
        )}
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
  pickerContainer: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  pickerHeader: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0F172A',
    textAlign: 'center',
  },
  closePickerButton: {
    backgroundColor: '#1E3A8A',
    padding: 14,
    alignItems: 'center',
  },
  closePickerText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 16,
  },
  importedNote: {
    marginTop: 6,
    fontSize: 12,
    color: '#F59E0B',
    fontStyle: 'italic' as const,
  },
});
