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

function formatDateMMDDYYYY(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = String(d.getFullYear());
  return `${m}/${day}/${y}`;
}

function formatTime12h(d: Date) {
  return d.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}


function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function normalizeWebDateInput(text: string) {
  const digits = text.replace(/[^0-9]/g, '').slice(0, 8);
  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);

  if (digits.length <= 2) return mm;
  if (digits.length <= 4) return `${mm}/${dd}`;
  return `${mm}/${dd}/${yyyy}`;
}

function parseWebDate(dateText: string): { y: number; m: number; d: number } | null {
  const trimmed = dateText.trim();
  const mdyMatch = /^\d{2}\/\d{2}\/\d{4}$/.test(trimmed);
  if (!mdyMatch) return null;

  const [mmS, ddS, yyyyS] = trimmed.split('/');
  const mm = Number(mmS);
  const dd = Number(ddS);
  const yyyy = Number(yyyyS);

  if (!Number.isFinite(mm) || !Number.isFinite(dd) || !Number.isFinite(yyyy)) return null;
  if (yyyy < 1970 || yyyy > 2100) return null;
  if (mm < 1 || mm > 12) return null;

  const maxDay = new Date(yyyy, mm, 0).getDate();
  if (dd < 1 || dd > maxDay) return null;

  return { y: yyyy, m: mm, d: dd };
}

function parseWebTime(timeText: string): { hh: number; mm: number } | null {
  const raw = timeText.trim().toUpperCase();

  const ampmMatch = raw.match(/^\s*(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM)\s*$/);
  if (ampmMatch) {
    const h = Number(ampmMatch[1]);
    const m = Number(ampmMatch[2]);
    const ap = ampmMatch[3];
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    if (h < 1 || h > 12) return null;
    if (m < 0 || m > 59) return null;

    let hh = h % 12;
    if (ap === 'PM') hh += 12;
    return { hh, mm: m };
  }

  const h24Match = raw.match(/^\s*(\d{1,2})\s*:\s*(\d{2})\s*$/);
  if (h24Match) {
    const hh = Number(h24Match[1]);
    const mm = Number(h24Match[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;
    return { hh, mm };
  }

  return null;
}

function parseWebDateTime(dateText: string, timeText: string): Date | null {
  const d = parseWebDate(dateText);
  const t = parseWebTime(timeText);
  if (!d || !t) return null;
  const result = new Date(d.y, d.m - 1, d.d, t.hh, t.mm, 0, 0);
  return Number.isNaN(result.getTime()) ? null : result;
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
      const start = new Date(existingEvent.startISO);
      const end = new Date(existingEvent.endISO);
      setWebStartDateText(toWebDateText(start));
      setWebStartTimeText(toWebTimeText(start));
      setWebEndDateText(toWebDateText(end));
      setWebEndTimeText(toWebTimeText(end));
    }
  }, [existingEvent, mode]);

  function toWebDateText(d: Date) {
    return formatDateMMDDYYYY(d);
  }

  function toWebTimeText(d: Date) {
    return formatTime12h(d);
  }


  type PickerTarget = 'start' | 'end';
  type PickerStep = 'date' | 'time';

  const [pickerVisible, setPickerVisible] = useState<boolean>(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>('start');
  const [pickerStep, setPickerStep] = useState<PickerStep>('date');
  const pendingDateRef = useRef<Date | null>(null);

  const [webStartDateText, setWebStartDateText] = useState<string>(() => toWebDateText(startAt));
  const [webStartTimeText, setWebStartTimeText] = useState<string>(() => toWebTimeText(startAt));
  const [webEndDateText, setWebEndDateText] = useState<string>(() => toWebDateText(endAt));
  const [webEndTimeText, setWebEndTimeText] = useState<string>(() => toWebTimeText(endAt));

  const WEB_TIME_OPTIONS = useMemo(() => {
    const out: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const d = new Date(2000, 0, 1, h, m, 0, 0);
        out.push(formatTime12h(d));
      }
    }
    return out;
  }, []);

  const [webTimePickerVisible, setWebTimePickerVisible] = useState<boolean>(false);
  const [webTimePickerTarget, setWebTimePickerTarget] = useState<PickerTarget>('start');
  const [webTimePickerDraft, setWebTimePickerDraft] = useState<string>('');

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

    const parsedStart = parseWebDateTime(webStartDateText, webStartTimeText);
    const parsedEnd = parseWebDateTime(webEndDateText, webEndTimeText);

    if (!parsedStart) {
      Alert.alert('Invalid start time', 'Use format MM/DD/YYYY and a valid time (e.g. 7:30 PM).');
      return false;
    }
    if (!parsedEnd) {
      Alert.alert('Invalid end time', 'Use format MM/DD/YYYY and a valid time (e.g. 9:00 PM).');
      return false;
    }

    setStartAt(parsedStart);
    setEndAt(parsedEnd);
    return true;
  }, [webEndDateText, webEndTimeText, webStartDateText, webStartTimeText]);

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
            <View style={styles.webWhenRow}>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={styles.webWhenLabel}>Start date</Text>
                <TextInput
                  style={styles.input}
                  value={webStartDateText}
                  onChangeText={(t) => {
                    const next = normalizeWebDateInput(t);
                    setWebStartDateText(next);
                  }}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  testID="createEventStartDateWeb"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={styles.webWhenLabel}>Start time</Text>
                <Pressable
                  style={[styles.input, styles.webTimeButton]}
                  onPress={() => {
                    setWebTimePickerTarget('start');
                    setWebTimePickerDraft(webStartTimeText);
                    setWebTimePickerVisible(true);
                  }}
                  testID="createEventStartTimeWeb"
                >
                  <Text style={styles.webTimeButtonText}>{webStartTimeText || 'Select time'}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.webWhenRow}>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={styles.webWhenLabel}>End date</Text>
                <TextInput
                  style={styles.input}
                  value={webEndDateText}
                  onChangeText={(t) => {
                    const next = normalizeWebDateInput(t);
                    setWebEndDateText(next);
                  }}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  testID="createEventEndDateWeb"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={styles.webWhenLabel}>End time</Text>
                <Pressable
                  style={[styles.input, styles.webTimeButton]}
                  onPress={() => {
                    setWebTimePickerTarget('end');
                    setWebTimePickerDraft(webEndTimeText);
                    setWebTimePickerVisible(true);
                  }}
                  testID="createEventEndTimeWeb"
                >
                  <Text style={styles.webTimeButtonText}>{webEndTimeText || 'Select time'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <>
            <View style={{ gap: 12 }}>
              <Pressable
                style={styles.timeCard}
                onPress={() => {
                  console.log('[create-event] open picker for start');
                  setPickerTarget('start');
                  setPickerStep('date');
                  pendingDateRef.current = null;
                  setPickerVisible(true);
                }}
                testID="createEventStartPicker"
              >
                <Text style={styles.timeLabel}>Start</Text>
                <Text style={styles.timeValue}>{formatWhen(startAt)}</Text>
              </Pressable>

              <Pressable
                style={styles.timeCard}
                onPress={() => {
                  console.log('[create-event] open picker for end');
                  setPickerTarget('end');
                  setPickerStep('date');
                  pendingDateRef.current = null;
                  setPickerVisible(true);
                }}
                testID="createEventEndPicker"
              >
                <Text style={styles.timeLabel}>End</Text>
                <Text style={styles.timeValue}>{formatWhen(endAt)}</Text>
              </Pressable>
            </View>

            {Platform.OS === 'android' && pickerVisible && (
              <DateTimePicker
                value={pickerTarget === 'start' ? startAt : endAt}
                mode={pickerStep}
                display="default"
                onChange={(event, selectedDate) => {
                  console.log('[create-event] android picker changed', {
                    pickerTarget,
                    pickerStep,
                    type: event.type,
                    iso: selectedDate?.toISOString(),
                  });

                  if (event.type === 'dismissed' || !selectedDate) {
                    setPickerVisible(false);
                    pendingDateRef.current = null;
                    setPickerStep('date');
                    return;
                  }

                  const current = pickerTarget === 'start' ? startAt : endAt;

                  if (pickerStep === 'date') {
                    const next = new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth(),
                      selectedDate.getDate(),
                      current.getHours(),
                      current.getMinutes(),
                      0,
                      0
                    );

                    pendingDateRef.current = next;
                    setPickerStep('time');
                    return;
                  }

                  const base = pendingDateRef.current ?? current;
                  const next = new Date(
                    base.getFullYear(),
                    base.getMonth(),
                    base.getDate(),
                    selectedDate.getHours(),
                    selectedDate.getMinutes(),
                    0,
                    0
                  );

                  setPickerVisible(false);
                  pendingDateRef.current = null;
                  setPickerStep('date');

                  if (pickerTarget === 'start') {
                    setStartAt(next);
                    if (next > endAt) {
                      setEndAt(new Date(next.getTime() + 2 * 3600000));
                    }
                  } else {
                    setEndAt(next);
                  }
                }}
              />
            )}

            {Platform.OS === 'ios' && pickerVisible && (
              <View style={styles.pickerContainer} testID="createEventWhenPickerContainer">
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>
                    {pickerTarget === 'start' ? 'Start' : 'End'}: pick date & time
                  </Text>
                </View>

                <View style={styles.iosPickerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.iosPickerLabel}>Date</Text>
                    <DateTimePicker
                      value={pickerTarget === 'start' ? startAt : endAt}
                      mode="date"
                      display="spinner"
                      onChange={(_, selectedDate) => {
                        if (!selectedDate) return;

                        const current = pickerTarget === 'start' ? startAt : endAt;
                        const next = new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth(),
                          selectedDate.getDate(),
                          current.getHours(),
                          current.getMinutes(),
                          0,
                          0
                        );

                        console.log('[create-event] ios date changed', {
                          pickerTarget,
                          iso: next.toISOString(),
                        });

                        if (pickerTarget === 'start') {
                          setStartAt(next);
                          if (next > endAt) {
                            setEndAt(new Date(next.getTime() + 2 * 3600000));
                          }
                        } else {
                          setEndAt(next);
                        }
                      }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.iosPickerLabel}>Time</Text>
                    <DateTimePicker
                      value={pickerTarget === 'start' ? startAt : endAt}
                      mode="time"
                      display="spinner"
                      onChange={(_, selectedDate) => {
                        if (!selectedDate) return;

                        const current = pickerTarget === 'start' ? startAt : endAt;
                        const next = new Date(
                          current.getFullYear(),
                          current.getMonth(),
                          current.getDate(),
                          selectedDate.getHours(),
                          selectedDate.getMinutes(),
                          0,
                          0
                        );

                        console.log('[create-event] ios time changed', {
                          pickerTarget,
                          iso: next.toISOString(),
                        });

                        if (pickerTarget === 'start') {
                          setStartAt(next);
                          if (next > endAt) {
                            setEndAt(new Date(next.getTime() + 2 * 3600000));
                          }
                        } else {
                          setEndAt(next);
                        }
                      }}
                    />
                  </View>
                </View>

                <View style={styles.pickerFooter}>
                  <Pressable
                    style={styles.closePickerButton}
                    onPress={() => {
                      setPickerVisible(false);
                      pendingDateRef.current = null;
                      setPickerStep('date');
                    }}
                    testID="createEventPickerDone"
                  >
                    <Text style={styles.closePickerText}>Done</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </>
        )}

        {Platform.OS === 'web' && (
          <View style={styles.webTimePickerHost} pointerEvents={webTimePickerVisible ? 'auto' : 'none'}>
            {webTimePickerVisible && (
              <View style={styles.webTimePickerOverlay}>
                <View style={styles.webTimePickerCard} testID="createEventWebTimePicker">
                  <Text style={styles.webTimePickerTitle}>
                    Select {webTimePickerTarget === 'start' ? 'Start' : 'End'} time
                  </Text>

                  <View style={styles.webTimeQuickRow}>
                    {['6:00 PM', '7:00 PM', '7:30 PM', '8:00 PM', '9:00 PM', '10:00 PM'].map((t) => {
                      const isSelected = (webTimePickerDraft || '') === t;
                      return (
                        <Pressable
                          key={t}
                          style={[styles.webTimeQuickChip, isSelected && styles.webTimeQuickChipActive]}
                          onPress={() => setWebTimePickerDraft(t)}
                          testID={`createEventWebTimeQuick_${t.replace(/[^0-9APM]/g, '')}`}
                        >
                          <Text style={[styles.webTimeQuickText, isSelected && styles.webTimeQuickTextActive]}>{t}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.webTimeSearchRow}>
                    <TextInput
                      style={[styles.input, styles.webTimeSearchInput]}
                      value={webTimePickerDraft}
                      onChangeText={setWebTimePickerDraft}
                      placeholder="e.g. 7:30 PM"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      testID="createEventWebTimeSearch"
                    />
                  </View>

                  <View style={styles.webTimeList}>
                    <View style={styles.webTimeListInner}>
                      {WEB_TIME_OPTIONS.map((t) => {
                        const isSelected = webTimePickerDraft === t;
                        return (
                          <Pressable
                            key={t}
                            style={[styles.webTimeRow, isSelected && styles.webTimeRowActive]}
                            onPress={() => setWebTimePickerDraft(t)}
                          >
                            <Text style={[styles.webTimeRowText, isSelected && styles.webTimeRowTextActive]}>{t}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.webTimePickerFooter}>
                    <Pressable
                      style={[styles.webTimeFooterBtn, styles.webTimeFooterBtnGhost]}
                      onPress={() => {
                        setWebTimePickerVisible(false);
                        setWebTimePickerDraft('');
                      }}
                      testID="createEventWebTimeCancel"
                    >
                      <Text style={styles.webTimeFooterBtnGhostText}>Cancel</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.webTimeFooterBtn, styles.webTimeFooterBtnPrimary]}
                      onPress={() => {
                        const parsed = parseWebTime(webTimePickerDraft);
                        if (!parsed) {
                          Alert.alert('Invalid time', 'Try something like 7:30 PM.');
                          return;
                        }

                        if (webTimePickerTarget === 'start') setWebStartTimeText(webTimePickerDraft);
                        else setWebEndTimeText(webTimePickerDraft);

                        setWebTimePickerVisible(false);
                        setWebTimePickerDraft('');
                      }}
                      testID="createEventWebTimeApply"
                    >
                      <Text style={styles.webTimeFooterBtnPrimaryText}>Apply</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
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
  timeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
  },
  webTimeButton: {
    justifyContent: 'center',
  },
  webTimeButtonText: {
    fontSize: 16,
    color: '#0F172A',
  },
  webTimePickerHost: {
    position: 'relative',
    zIndex: 50,
  },
  webTimePickerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    paddingTop: 6,
  },
  webTimePickerCard: {
    backgroundColor: '#0B1220',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  webTimePickerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#E2E8F0',
    marginBottom: 10,
  },
  webTimeQuickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  webTimeQuickChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  webTimeQuickChipActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  webTimeQuickText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  webTimeQuickTextActive: {
    color: '#04120A',
  },
  webTimeSearchRow: {
    marginBottom: 10,
  },
  webTimeSearchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
    color: '#E2E8F0',
  },
  webTimeList: {
    maxHeight: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  webTimeListInner: {
    paddingVertical: 6,
  },
  webTimeRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  webTimeRowActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  webTimeRowText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  webTimeRowTextActive: {
    color: '#86EFAC',
  },
  webTimePickerFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  webTimeFooterBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webTimeFooterBtnGhost: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  webTimeFooterBtnGhostText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '800' as const,
  },
  webTimeFooterBtnPrimary: {
    backgroundColor: '#22C55E',
  },
  webTimeFooterBtnPrimaryText: {
    color: '#04120A',
    fontSize: 14,
    fontWeight: '900' as const,
  },
  iosPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iosPickerLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#64748B',
    marginBottom: 6,
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
  webWhenRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  webWhenLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
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

  pickerFooter: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  closePickerButton: {
    backgroundColor: '#1E3A8A',
    padding: 14,
    borderRadius: 14,
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
