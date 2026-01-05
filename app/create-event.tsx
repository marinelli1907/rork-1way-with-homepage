import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarClock, Check, ChevronDown, MapPin, Tag, Type, X } from 'lucide-react-native';
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

  const [webStartText, setWebStartText] = useState<string>(() => startAt.toISOString());
  const [webEndText, setWebEndText] = useState<string>(() => endAt.toISOString());

  const titleRef = useRef<TextInput | null>(null);
  const venueRef = useRef<TextInput | null>(null);
  const addressRef = useRef<TextInput | null>(null);
  const notesRef = useRef<TextInput | null>(null);

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
    console.log('[create-event] close');
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
    console.log('[create-event] submit start', { mode, category });

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
        console.log('[create-event] update event', { eventId: params.eventId, payload });
        updateEvent(params.eventId, payload);
        Alert.alert('Saved', 'Event updated.', [{ text: 'OK', onPress: close }]);
        return;
      }

      console.log('[create-event] add event', payload);
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

  const kbdBehavior = useMemo(() => {
    if (Platform.OS === 'ios') return 'padding' as const;
    return undefined;
  }, []);

  const footerHeight = 74;

  return (
    <>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerShown: true,
          headerLeft: () => (
            <Pressable
              onPress={close}
              style={styles.headerLeft}
              accessibilityRole="button"
              accessibilityLabel="Close"
              testID="createEvent_close"
            >
              <X size={22} color={COLORS.text} />
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={kbdBehavior}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        testID="createEvent_kav"
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingBottom: footerHeight + insets.bottom + 20,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          showsVerticalScrollIndicator={false}
          testID="createEvent_scroll"
        >
          <View style={styles.hero}>
            <View style={styles.heroDot} />
            <Text style={styles.heroTitle}>{screenTitle}</Text>
            <Text style={styles.heroSubtitle}>Add details now — you can edit anytime later.</Text>
          </View>

          <View style={styles.card}>
            <FieldLabel icon={<Type size={18} color={COLORS.primary} />} label="Event title" />
            <TextInput
              ref={(r) => {
                titleRef.current = r;
              }}
              value={title}
              onChangeText={setTitle}
              placeholder="What’s happening?"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => venueRef.current?.focus()}
              testID="createEvent_title"
            />
          </View>

          <View style={styles.card}>
            <FieldLabel icon={<Tag size={18} color={COLORS.primary} />} label="Category" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              keyboardShouldPersistTaps="handled"
              testID="createEvent_categoryRow"
            >
              {CATEGORY_OPTIONS.map((opt) => {
                const active = opt.value === category;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      console.log('[create-event] category', opt.value);
                      setCategory(opt.value);
                    }}
                    style={[
                      styles.chip,
                      active && { backgroundColor: opt.color, borderColor: opt.color },
                    ]}
                    testID={`createEvent_category_${opt.value}`}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                    {active ? <Check size={14} color="#fff" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.card}>
            <FieldLabel icon={<MapPin size={18} color={COLORS.primary} />} label="Venue" />
            <TextInput
              ref={(r) => {
                venueRef.current = r;
              }}
              value={venue}
              onChangeText={setVenue}
              placeholder="e.g., Rocket Mortgage FieldHouse"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => addressRef.current?.focus()}
              testID="createEvent_venue"
            />

            <View style={{ height: 12 }} />

            <FieldLabel icon={<MapPin size={18} color={COLORS.primary} />} label="Address (optional)" />
            <TextInput
              ref={(r) => {
                addressRef.current = r;
              }}
              value={address}
              onChangeText={setAddress}
              placeholder="Street address"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => notesRef.current?.focus()}
              testID="createEvent_address"
            />
          </View>

          <View style={styles.card}>
            <FieldLabel icon={<CalendarClock size={18} color={COLORS.primary} />} label="When" />

            {Platform.OS === 'web' ? (
              <>
                <Text style={styles.webHint}>Web: edit ISO timestamps</Text>
                <TextInput
                  value={webStartText}
                  onChangeText={setWebStartText}
                  placeholder="Start (ISO)"
                  placeholderTextColor={COLORS.muted}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="createEvent_webStart"
                />
                <View style={{ height: 12 }} />
                <TextInput
                  value={webEndText}
                  onChangeText={setWebEndText}
                  placeholder="End (ISO)"
                  placeholderTextColor={COLORS.muted}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="createEvent_webEnd"
                />
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => {
                    console.log('[create-event] open start picker');
                    setOpenStartPicker(true);
                  }}
                  style={styles.whenRow}
                  testID="createEvent_startButton"
                >
                  <Text style={styles.whenLabel}>Starts</Text>
                  <View style={styles.whenValueWrap}>
                    <Text style={styles.whenValue}>{formatWhen(startAt)}</Text>
                    <ChevronDown size={16} color={COLORS.muted} />
                  </View>
                </Pressable>

                <View style={styles.divider} />

                <Pressable
                  onPress={() => {
                    console.log('[create-event] open end picker');
                    setOpenEndPicker(true);
                  }}
                  style={styles.whenRow}
                  testID="createEvent_endButton"
                >
                  <Text style={styles.whenLabel}>Ends</Text>
                  <View style={styles.whenValueWrap}>
                    <Text style={styles.whenValue}>{formatWhen(endAt)}</Text>
                    <ChevronDown size={16} color={COLORS.muted} />
                  </View>
                </Pressable>

                {openStartPicker ? (
                  <DateTimePicker
                    value={startAt}
                    mode="datetime"
                    display="default"
                    onChange={(_, date) => {
                      const keepOpen = Platform.OS === 'ios';
                      setOpenStartPicker(keepOpen);
                      if (!date) return;
                      setStartAt(date);
                      setWebStartText(date.toISOString());
                      if (endAt.getTime() <= date.getTime()) {
                        const bumped = new Date(date.getTime() + 2 * 60 * 60 * 1000);
                        setEndAt(bumped);
                        setWebEndText(bumped.toISOString());
                      }
                    }}
                  />
                ) : null}

                {openEndPicker ? (
                  <DateTimePicker
                    value={endAt}
                    mode="datetime"
                    display="default"
                    onChange={(_, date) => {
                      const keepOpen = Platform.OS === 'ios';
                      setOpenEndPicker(keepOpen);
                      if (!date) return;
                      setEndAt(date);
                      setWebEndText(date.toISOString());
                    }}
                  />
                ) : null}
              </>
            )}
          </View>

          <View style={styles.card}>
            <FieldLabel icon={<Type size={18} color={COLORS.primary} />} label="Notes (optional)" />
            <TextInput
              ref={(r) => {
                notesRef.current = r;
              }}
              value={notes}
              onChangeText={setNotes}
              placeholder="Dress code, meetup spot, anything helpful…"
              placeholderTextColor={COLORS.muted}
              style={[styles.input, styles.notes]}
              multiline
              textAlignVertical="top"
              testID="createEvent_notes"
            />
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
          testID="createEvent_footer"
        >
          <Pressable
            onPress={submit}
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.92 }]}
            testID="createEvent_submit"
          >
            <Text style={styles.primaryButtonText}>{primaryCtaText}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

function FieldLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.fieldLabelRow}>
      {icon}
      <Text style={styles.fieldLabelText}>{label}</Text>
    </View>
  );
}

const COLORS = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  primary: '#0B2A4A',
  primarySoft: '#E6F0FF',
  danger: '#DC2626',
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerLeft: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scroll: {
    flex: 1,
  },

  hero: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
  },
  heroDot: {
    width: 44,
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    opacity: 0.12,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
    color: COLORS.text,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },

  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  fieldLabelText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.text,
  },

  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },

  chipsRow: {
    paddingRight: 12,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F1F5F9',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.muted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  whenRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whenLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.muted,
  },
  whenValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whenValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  notes: {
    minHeight: 96,
  },

  webHint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 10,
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  primaryButton: {
    backgroundColor: '#E31937',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
