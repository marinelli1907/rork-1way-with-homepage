import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import BottomSheetModal from '@/components/BottomSheetModal';
import { roundUpToInterval } from '@/components/DateTimePickerModal';
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

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

type DateTimeTarget = 'start' | 'end';

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i);
const ITEM_HEIGHT = 44;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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

  const [activeTarget, setActiveTarget] = useState<DateTimeTarget | null>(null);
  const [viewMonth, setViewMonth] = useState<number>(initialStart.getMonth());
  const [viewYear, setViewYear] = useState<number>(initialStart.getFullYear());

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

  const toggleTarget = useCallback((target: DateTimeTarget) => {
    if (activeTarget === target) {
      setActiveTarget(null);
    } else {
      setActiveTarget(target);
      const targetDate = target === 'start' ? startAt : endAt;
      setViewMonth(targetDate.getMonth());
      setViewYear(targetDate.getFullYear());
    }
  }, [activeTarget, startAt, endAt]);

  const handleDateSelect = useCallback((day: number) => {
    const targetDate = activeTarget === 'start' ? startAt : endAt;
    const newDate = new Date(targetDate);
    newDate.setFullYear(viewYear, viewMonth, day);
    
    if (activeTarget === 'start') {
      setStartAt(newDate);
      if (endAt.getTime() <= newDate.getTime()) {
        const autoEnd = new Date(newDate.getTime() + 2 * 60 * 60 * 1000);
        setEndAt(autoEnd);
      }
    } else {
      if (newDate.getTime() <= startAt.getTime()) {
        Alert.alert('Invalid date', 'End date must be after start date.');
        return;
      }
      setEndAt(newDate);
    }
  }, [activeTarget, startAt, endAt, viewMonth, viewYear]);

  const handleHourSelect = useCallback((hour: number, isPM: boolean) => {
    const targetDate = activeTarget === 'start' ? startAt : endAt;
    const newDate = new Date(targetDate);
    let hour24 = hour;
    if (isPM && hour !== 12) hour24 = hour + 12;
    if (!isPM && hour === 12) hour24 = 0;
    newDate.setHours(hour24, 0, 0, 0);
    
    if (activeTarget === 'start') {
      setStartAt(newDate);
      if (endAt.getTime() <= newDate.getTime()) {
        const autoEnd = new Date(newDate.getTime() + 2 * 60 * 60 * 1000);
        setEndAt(autoEnd);
      }
    } else {
      if (newDate.getTime() <= startAt.getTime()) {
        Alert.alert('Invalid time', 'End time must be after start time.');
        return;
      }
      setEndAt(newDate);
    }
  }, [activeTarget, startAt, endAt]);

  const handleMinuteSelect = useCallback((minute: number) => {
    const targetDate = activeTarget === 'start' ? startAt : endAt;
    const newDate = new Date(targetDate);
    newDate.setMinutes(minute);
    
    if (activeTarget === 'start') {
      setStartAt(newDate);
      if (endAt.getTime() <= newDate.getTime()) {
        const autoEnd = new Date(newDate.getTime() + 2 * 60 * 60 * 1000);
        setEndAt(autoEnd);
      }
    } else {
      if (newDate.getTime() <= startAt.getTime()) {
        Alert.alert('Invalid time', 'End time must be after start time.');
        return;
      }
      setEndAt(newDate);
    }
  }, [activeTarget, startAt, endAt]);

  const goToPrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }, [viewMonth, viewYear]);

  const goToNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }, [viewMonth, viewYear]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days: (number | null)[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [viewMonth, viewYear]);

  const getSelectedHour = useCallback((date: Date): { hour: number; isPM: boolean } => {
    const h = date.getHours();
    if (h === 0) return { hour: 12, isPM: false };
    if (h === 12) return { hour: 12, isPM: true };
    if (h > 12) return { hour: h - 12, isPM: true };
    return { hour: h, isPM: false };
  }, []);

  const currentTargetDate = activeTarget === 'start' ? startAt : endAt;
  const currentHourInfo = getSelectedHour(currentTargetDate);
  const currentMinute = currentTargetDate.getMinutes();

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (activeTarget) {
      const targetDate = activeTarget === 'start' ? startAt : endAt;
      const h = targetDate.getHours();
      let hour12: number;
      if (h === 0) hour12 = 12;
      else if (h === 12) hour12 = 12;
      else if (h > 12) hour12 = h - 12;
      else hour12 = h;
      
      const hourIndex = HOURS_12.indexOf(hour12);
      const minuteIndex = targetDate.getMinutes();
      
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({ y: hourIndex * ITEM_HEIGHT, animated: false });
        minuteScrollRef.current?.scrollTo({ y: minuteIndex * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, [activeTarget, startAt, endAt]);

  const handleHourScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, HOURS_12.length - 1));
    const hour = HOURS_12[clampedIndex];
    
    if (hour !== currentHourInfo.hour) {
      handleHourSelect(hour, currentHourInfo.isPM);
    }
  }, [currentHourInfo, handleHourSelect]);

  const handleMinuteScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const minute = Math.max(0, Math.min(index, 59));
    
    if (minute !== currentMinute) {
      handleMinuteSelect(minute);
    }
  }, [currentMinute, handleMinuteSelect]);

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
        <Text style={styles.label}>When</Text>
        <View style={styles.timeCardsRow}>
          <Pressable
            style={[styles.timeCardCompact, activeTarget === 'start' && styles.timeCardActive]}
            onPress={() => toggleTarget('start')}
            testID="createEventStartPicker"
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
            style={[styles.timeCardCompact, activeTarget === 'end' && styles.timeCardActive]}
            onPress={() => toggleTarget('end')}
            testID="createEventEndPicker"
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

        {activeTarget && (
          <View style={styles.pickerContainer}>
            <View style={styles.calendarHeader}>
              <Pressable onPress={goToPrevMonth} style={styles.monthNav} hitSlop={8}>
                <ChevronLeft size={20} color="#64748B" />
              </Pressable>
              <Text style={styles.monthTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
              <Pressable onPress={goToNextMonth} style={styles.monthNav} hitSlop={8}>
                <ChevronRight size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.dayNamesRow}>
              {DAY_NAMES.map((d) => (
                <Text key={d} style={styles.dayName}>{d}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <View key={`empty-${idx}`} style={styles.dayCell} />;
                }
                const isSelected = 
                  currentTargetDate.getDate() === day &&
                  currentTargetDate.getMonth() === viewMonth &&
                  currentTargetDate.getFullYear() === viewYear;
                const today = new Date();
                const isToday = 
                  today.getDate() === day &&
                  today.getMonth() === viewMonth &&
                  today.getFullYear() === viewYear;
                return (
                  <Pressable
                    key={day}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      isToday && !isSelected && styles.dayCellToday,
                    ]}
                    onPress={() => handleDateSelect(day)}
                  >
                    <Text style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                    ]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.timeSectionDivider} />

            <View style={styles.wheelPickerContainer}>
              <View style={styles.wheelColumn}>
                <Text style={styles.wheelLabel}>Hour</Text>
                <View style={styles.wheelWrapper}>
                  <View style={styles.wheelHighlight} />
                  <ScrollView
                    ref={hourScrollRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={handleHourScroll}
                    contentContainerStyle={styles.wheelContent}
                  >
                    {HOURS_12.map((h) => {
                      const isSelected = currentHourInfo.hour === h;
                      return (
                        <Pressable
                          key={h}
                          style={styles.wheelItem}
                          onPress={() => {
                            handleHourSelect(h, currentHourInfo.isPM);
                            const index = HOURS_12.indexOf(h);
                            hourScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
                          }}
                        >
                          <Text style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}>
                            {h}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              <Text style={styles.wheelSeparator}>:</Text>

              <View style={styles.wheelColumn}>
                <Text style={styles.wheelLabel}>Min</Text>
                <View style={styles.wheelWrapper}>
                  <View style={styles.wheelHighlight} />
                  <ScrollView
                    ref={minuteScrollRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={handleMinuteScroll}
                    contentContainerStyle={styles.wheelContent}
                  >
                    {MINUTES_60.map((m) => {
                      const isSelected = currentMinute === m;
                      return (
                        <Pressable
                          key={m}
                          style={styles.wheelItem}
                          onPress={() => {
                            handleMinuteSelect(m);
                            minuteScrollRef.current?.scrollTo({ y: m * ITEM_HEIGHT, animated: true });
                          }}
                        >
                          <Text style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}>
                            {m.toString().padStart(2, '0')}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.amPmColumn}>
                <Text style={styles.wheelLabel}>Period</Text>
                <View style={styles.amPmVertical}>
                  <Pressable
                    style={[styles.amPmVerticalBtn, !currentHourInfo.isPM && styles.amPmVerticalBtnActive]}
                    onPress={() => handleHourSelect(currentHourInfo.hour, false)}
                  >
                    <Text style={[styles.amPmVerticalText, !currentHourInfo.isPM && styles.amPmVerticalTextActive]}>AM</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.amPmVerticalBtn, currentHourInfo.isPM && styles.amPmVerticalBtnActive]}
                    onPress={() => handleHourSelect(currentHourInfo.hour, true)}
                  >
                    <Text style={[styles.amPmVerticalText, currentHourInfo.isPM && styles.amPmVerticalTextActive]}>PM</Text>
                  </Pressable>
                </View>
              </View>
            </View>
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
  timeCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCardCompact: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    color: '#0F172A',
  },
  timeCardTime: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
    marginTop: 2,
  },
  pickerContainer: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNav: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#0F172A',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  dayTextToday: {
    color: '#3B82F6',
    fontWeight: '700' as const,
  },
  timeSectionDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  wheelPickerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 8,
  },
  wheelColumn: {
    alignItems: 'center',
  },
  wheelLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94A3B8',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  wheelWrapper: {
    height: ITEM_HEIGHT * 3,
    width: 70,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  wheelHighlight: {
    position: 'absolute' as const,
    top: ITEM_HEIGHT,
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    zIndex: 0,
  },
  wheelContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  wheelItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  wheelSeparator: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#0F172A',
    marginTop: 68,
  },
  amPmColumn: {
    alignItems: 'center',
    marginLeft: 8,
  },
  amPmVertical: {
    gap: 8,
  },
  amPmVerticalBtn: {
    width: 56,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amPmVerticalBtnActive: {
    backgroundColor: '#3B82F6',
  },
  amPmVerticalText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#64748B',
  },
  amPmVerticalTextActive: {
    color: '#FFFFFF',
  },
});
