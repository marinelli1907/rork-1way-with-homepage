import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import BottomSheetModal from '@/components/BottomSheetModal';
import DateTimePickerModal, {
  DateTimePickerResult,
  roundUpToInterval,
} from '@/components/DateTimePickerModal';
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

type DateTimeTarget = 'start' | 'end';

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
    if (holidayDate) {
      const d = new Date(holidayDate);
      d.setHours(12, 0, 0, 0);
      return d;
    }

    const now = new Date();
    const rounded = roundUpToInterval(now, 30);

    if (rounded.getTime() <= now.getTime()) {
      const bumped = new Date(rounded);
      bumped.setMinutes(bumped.getMinutes() + 30);
      return bumped;
    }

    return rounded;
  }, [existingEvent?.startISO, holidayDate]);

  const initialEnd = useMemo(() => {
    if (existingEvent?.endISO) {
      const d = new Date(existingEvent.endISO);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return new Date(initialStart.getTime() + 2 * 60 * 60 * 1000);
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

  const [dateTimeModalVisible, setDateTimeModalVisible] = useState<boolean>(false);
  const [dateTimeTarget, setDateTimeTarget] = useState<DateTimeTarget>('start');

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

    const start = new Date(existingEvent.startISO);
    const end = new Date(existingEvent.endISO);
    if (!Number.isNaN(start.getTime())) setStartAt(start);
    if (!Number.isNaN(end.getTime())) setEndAt(end);

    setNotes(existingEvent.notes ?? '');
  }, [existingEvent, mode]);

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

  const openDateTime = useCallback((target: DateTimeTarget) => {
    console.log('[create-event] open DateTimePickerModal', { target });
    setDateTimeTarget(target);
    setDateTimeModalVisible(true);
  }, []);

  const handleDateTimeDone = useCallback(
    (res: DateTimePickerResult) => {
      console.log('[create-event] DateTimePickerModal done', {
        target: dateTimeTarget,
        isASAP: res.isASAP,
        iso: res.date.toISOString(),
      });

      setDateTimeModalVisible(false);

      const next = res.date;
      if (dateTimeTarget === 'start') {
        setStartAt(next);
        setEndAt((prev) => {
          if (prev.getTime() <= next.getTime()) {
            const autoEnd = new Date(next.getTime() + 2 * 60 * 60 * 1000);
            console.log('[create-event] auto-adjust endAt because start moved after end', {
              startISO: next.toISOString(),
              endISO: autoEnd.toISOString(),
            });
            return autoEnd;
          }
          return prev;
        });
        return;
      }

      setEndAt(() => {
        if (next.getTime() <= startAt.getTime()) {
          const autoEnd = new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
          console.log('[create-event] prevent end before start; auto-adjust', {
            startISO: startAt.toISOString(),
            attemptedEndISO: next.toISOString(),
            endISO: autoEnd.toISOString(),
          });
          Alert.alert('Invalid time', 'End time must be after the start time.');
          return autoEnd;
        }
        return next;
      });
    },
    [dateTimeTarget, startAt]
  );

  const submit = useCallback(async () => {
    console.log('[create-event] submit called', { mode, title: title.trim(), venue: venue.trim() });

    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter an event title.');
      return;
    }

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
      Alert.alert('Success!', mode === 'duplicate' ? 'Event duplicated.' : 'Event created.', [
        {
          text: 'OK',
          onPress: () => {
            console.log('[create-event] closing after save');
            close();
          },
        },
      ]);
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
      <DateTimePickerModal
        visible={dateTimeModalVisible}
        title={dateTimeTarget === 'start' ? 'Start time' : 'End time'}
        initialValue={{ date: dateTimeTarget === 'start' ? startAt : endAt, isASAP: false }}
        allowASAP={false}
        mode="event"
        onCancel={() => {
          console.log('[create-event] DateTimePickerModal cancel');
          setDateTimeModalVisible(false);
        }}
        onDone={handleDateTimeDone}
      />

      <View style={styles.section}>
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Dinner with Friends"
          placeholderTextColor="#94A3B8"
          returnKeyType="next"
          testID="createEventTitle"
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
                testID={`createEventCategory_${opt.value}`}
              >
                <Text style={[styles.categoryText, isSelected && { color: '#FFF' }]}>{opt.label}</Text>
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
          testID="createEventVenue"
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
          testID="createEventAddress"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Time</Text>
        <View style={{ gap: 12 }}>
          <Pressable
            style={styles.timeCard}
            onPress={() => openDateTime('start')}
            testID="createEventStartPicker"
          >
            <Text style={styles.timeLabel}>Start</Text>
            <Text style={styles.timeValue}>{formatWhen(startAt)}</Text>
          </Pressable>

          <Pressable
            style={styles.timeCard}
            onPress={() => openDateTime('end')}
            testID="createEventEndPicker"
          >
            <Text style={styles.timeLabel}>End</Text>
            <Text style={styles.timeValue}>{formatWhen(endAt)}</Text>
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
          testID="createEventNotes"
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
  timeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
});
