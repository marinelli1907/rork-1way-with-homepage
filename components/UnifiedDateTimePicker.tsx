import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export interface UnifiedDateTimePickerResult {
  date: Date;
  isASAP?: boolean;
}

export interface UnifiedDateTimePickerProps {
  visible: boolean;
  title: string;
  initialDate?: Date;
  initialIsASAP?: boolean;
  minimumDate?: Date;
  allowASAP?: boolean;
  onCancel: () => void;
  onDone: (result: UnifiedDateTimePickerResult) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM'];

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const ACCENT_COLOR = '#1E3A8A';
const ASAP_COLOR = '#F59E0B';

type PickerStep = 'date' | 'time';

export function roundToNext30Minutes(date: Date): Date {
  const result = new Date(date);
  result.setSeconds(0, 0);
  const minutes = result.getMinutes();
  const remainder = minutes % 30;
  const add = remainder === 0 ? 30 : 30 - remainder;
  result.setMinutes(minutes + add);
  return result;
}

export function getDefaultDateTime(): Date {
  const now = new Date();
  const rounded = roundToNext30Minutes(now);
  if (rounded.getHours() === 0 && rounded.getMinutes() === 0) {
    rounded.setHours(12, 0, 0, 0);
  }
  return rounded;
}

export function adjustEndTimeIfNeeded(startDate: Date, endDate: Date): Date {
  if (endDate.getTime() <= startDate.getTime()) {
    return new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  }
  return endDate;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTime12h(d: Date): string {
  return d.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface ScrollColumnProps {
  data: (number | string)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem?: (item: number | string) => string;
}

function ScrollColumn({ data, selectedIndex, onSelect, formatItem }: ScrollColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const hasInitialized = useRef(false);
  const lastSelectedIndex = useRef(selectedIndex);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
      lastSelectedIndex.current = selectedIndex;
      return;
    }
    
    if (!isScrolling.current && selectedIndex !== lastSelectedIndex.current) {
      lastSelectedIndex.current = selectedIndex;
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [selectedIndex]);

  const handleScrollEnd = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    isScrolling.current = false;
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(data.length - 1, index));

    if (clampedIndex !== lastSelectedIndex.current) {
      lastSelectedIndex.current = clampedIndex;
      onSelect(clampedIndex);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    scrollRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });
  }, [data.length, onSelect]);

  const handleScrollBegin = useCallback(() => {
    isScrolling.current = true;
  }, []);

  const paddingItems = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <View style={styles.columnContainer}>
      <View style={styles.selectionHighlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={() => {
          handleScrollBegin();
          if (snapTimerRef.current) {
            clearTimeout(snapTimerRef.current);
            snapTimerRef.current = null;
          }
        }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={(e) => {
          if (snapTimerRef.current) {
            clearTimeout(snapTimerRef.current);
          }
          snapTimerRef.current = setTimeout(() => {
            handleScrollEnd(e);
          }, 60);
        }}
        contentContainerStyle={{
          paddingVertical: paddingItems * ITEM_HEIGHT,
        }}
        style={styles.scrollViewColumn}
      >
        {data.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Pressable
              key={index}
              onPress={() => {
                onSelect(index);
                scrollRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              style={styles.item}
            >
              <Text
                style={[
                  styles.itemText,
                  isSelected && styles.itemTextSelected,
                ]}
              >
                {formatItem ? formatItem(item) : String(item)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

interface CalendarProps {
  selectedDate: Date;
  minimumDate?: Date;
  onSelectDate: (date: Date) => void;
}

function Calendar({ selectedDate, minimumDate, onSelectDate }: CalendarProps) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  const today = new Date();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const goToPrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [viewMonth, viewYear]);

  const goToNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [viewMonth, viewYear]);

  const handleDayPress = useCallback((day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(viewYear, viewMonth, day);
    onSelectDate(newDate);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [onSelectDate, selectedDate, viewMonth, viewYear]);

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <Pressable onPress={goToPrevMonth} style={styles.calendarNavBtn} hitSlop={8}>
          <ChevronLeft size={22} color="#1F2937" />
        </Pressable>
        <Text style={styles.calendarTitle}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <Pressable onPress={goToNextMonth} style={styles.calendarNavBtn} hitSlop={8}>
          <ChevronRight size={22} color="#1F2937" />
        </Pressable>
      </View>

      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, weekIdx) => (
        <View key={weekIdx} style={styles.weekRow}>
          {week.map((day, dayIdx) => {
            if (day === null) {
              return <View key={dayIdx} style={styles.dayCell} />;
            }

            const cellDate = new Date(viewYear, viewMonth, day);
            const isSelected = isSameDay(cellDate, selectedDate);
            const isToday = isSameDay(cellDate, today);
            const isDisabled = minimumDate ? cellDate < new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate()) : false;

            return (
              <Pressable
                key={dayIdx}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isToday && !isSelected && styles.dayCellToday,
                ]}
                onPress={() => !isDisabled && handleDayPress(day)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.dayText,
                    isDisabled && styles.dayTextDisabled,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface TimePickerInlineProps {
  value: Date;
  onChange: (date: Date) => void;
}

function TimePickerInline({ value, onChange }: TimePickerInlineProps) {
  const valueRef = useRef<Date>(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const derived = useMemo(() => {
    const hour24 = value.getHours();
    const minute = value.getMinutes();
    const isPM = hour24 >= 12;
    const hour12 = hour24 % 12 || 12;
    const roundedMinute = Math.round(minute / 5) * 5;
    const normalizedMinute = roundedMinute >= 60 ? 0 : roundedMinute;

    return {
      hour12,
      isPM,
      minuteValue: normalizedMinute,
    };
  }, [value]);

  const [localHourIndex, setLocalHourIndex] = useState<number>(HOURS.indexOf(derived.hour12));
  const [localMinuteIndex, setLocalMinuteIndex] = useState<number>(Math.max(0, MINUTES.indexOf(derived.minuteValue)));
  const [localPeriodIndex, setLocalPeriodIndex] = useState<number>(derived.isPM ? 1 : 0);

  const isUpdatingFromProps = useRef<boolean>(false);

  useEffect(() => {
    const newHourIndex = HOURS.indexOf(derived.hour12);
    const newMinuteIndex = Math.max(0, MINUTES.indexOf(derived.minuteValue));
    const newPeriodIndex = derived.isPM ? 1 : 0;

    if (localHourIndex !== newHourIndex || localMinuteIndex !== newMinuteIndex || localPeriodIndex !== newPeriodIndex) {
      isUpdatingFromProps.current = true;
      setLocalHourIndex(newHourIndex);
      setLocalMinuteIndex(newMinuteIndex);
      setLocalPeriodIndex(newPeriodIndex);
      requestAnimationFrame(() => {
        isUpdatingFromProps.current = false;
      });
    }
  }, [derived, localHourIndex, localMinuteIndex, localPeriodIndex]);

  const updateTime = useCallback((h12: number, min: number, pm: boolean) => {
    if (isUpdatingFromProps.current) return;
    
    let h24 = h12;
    if (pm && h12 !== 12) {
      h24 = h12 + 12;
    } else if (!pm && h12 === 12) {
      h24 = 0;
    }

    const newDate = new Date(valueRef.current);
    newDate.setHours(h24, min, 0, 0);
    onChange(newDate);
  }, [onChange]);

  const handleHourChange = useCallback((index: number) => {
    setLocalHourIndex(index);
    const newHour = HOURS[index];
    const currentMinute = MINUTES[localMinuteIndex];
    const currentPM = localPeriodIndex === 1;
    updateTime(newHour, currentMinute, currentPM);
  }, [localMinuteIndex, localPeriodIndex, updateTime]);

  const handleMinuteChange = useCallback((index: number) => {
    setLocalMinuteIndex(index);
    const currentHour = HOURS[localHourIndex];
    const currentPM = localPeriodIndex === 1;
    updateTime(currentHour, MINUTES[index], currentPM);
  }, [localHourIndex, localPeriodIndex, updateTime]);

  const handlePeriodChange = useCallback((index: number) => {
    setLocalPeriodIndex(index);
    const currentHour = HOURS[localHourIndex];
    const currentMinute = MINUTES[localMinuteIndex];
    updateTime(currentHour, currentMinute, index === 1);
  }, [localHourIndex, localMinuteIndex, updateTime]);

  return (
    <View style={styles.timePickerContainer}>
      <View style={styles.pickerRow}>
        <ScrollColumn
          data={HOURS}
          selectedIndex={localHourIndex}
          onSelect={handleHourChange}
        />
        <Text style={styles.separator}>:</Text>
        <ScrollColumn
          data={MINUTES}
          selectedIndex={localMinuteIndex}
          onSelect={handleMinuteChange}
          formatItem={(m) => padZero(m as number)}
        />
        <ScrollColumn
          data={PERIODS}
          selectedIndex={localPeriodIndex}
          onSelect={handlePeriodChange}
        />
      </View>
    </View>
  );
}

export default function UnifiedDateTimePicker({
  visible,
  title,
  initialDate,
  initialIsASAP = false,
  minimumDate,
  allowASAP = false,
  onCancel,
  onDone,
}: UnifiedDateTimePickerProps) {
  const defaultDate = useMemo(() => initialDate || getDefaultDateTime(), [initialDate]);
  
  const [draftIsASAP, setDraftIsASAP] = useState<boolean>(initialIsASAP);
  const [draftDate, setDraftDate] = useState<Date>(defaultDate);
  const [step, setStep] = useState<PickerStep>('date');

  useEffect(() => {
    if (!visible) return;
    console.log('[UnifiedDateTimePicker] open', { title, allowASAP, initialDate: initialDate?.toISOString() });
    setDraftIsASAP(initialIsASAP);
    setDraftDate(initialDate || getDefaultDateTime());
    setStep('date');
  }, [visible, allowASAP, initialDate, initialIsASAP, title]);

  const handleDateSelect = useCallback((newDate: Date) => {
    setDraftIsASAP(false);
    const updated = new Date(draftDate);
    updated.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    setDraftDate(updated);
    setStep('time');
  }, [draftDate]);

  const handleTimeChange = useCallback((newDate: Date) => {
    setDraftIsASAP(false);
    const updated = new Date(draftDate);
    updated.setHours(newDate.getHours(), newDate.getMinutes(), 0, 0);
    setDraftDate(updated);
  }, [draftDate]);

  const commitDone = useCallback(() => {
    console.log('[UnifiedDateTimePicker] done', { title, isASAP: draftIsASAP, iso: draftDate?.toISOString?.() });
    if (draftIsASAP) {
      onDone({ date: new Date(), isASAP: true });
      return;
    }
    onDone({ date: draftDate, isASAP: false });
  }, [draftDate, draftIsASAP, onDone, title]);

  const formattedDate = draftDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : 'fullScreen'}
      onRequestClose={onCancel}
      transparent
    >
      <View style={styles.backdropRoot} testID="unifiedPickerBackdropRoot">
        <Pressable
          style={styles.backdropPressable}
          onPress={onCancel}
          testID="unifiedPickerBackdrop"
        />

        <View style={styles.sheet} testID="unifiedPickerSheet">
          <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                console.log('[UnifiedDateTimePicker] cancel');
                onCancel();
              }}
              style={styles.headerBtn}
              testID="unifiedPickerCancel"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {draftIsASAP ? 'Leaving now' : `${formattedDate} • ${formatTime12h(draftDate)}`}
              </Text>
            </View>

            <Pressable
              onPress={commitDone}
              style={styles.doneBtn}
              testID="unifiedPickerDone"
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} testID="unifiedPickerScroll">
            {allowASAP && (
              <View style={styles.asapRow}>
                <Pressable
                  onPress={() => {
                    console.log('[UnifiedDateTimePicker] set ASAP true');
                    setDraftIsASAP(true);
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                  }}
                  style={[
                    styles.asapPill,
                    draftIsASAP && styles.asapPillActive,
                  ]}
                  testID="unifiedPickerASAP"
                >
                  <Zap size={16} color={draftIsASAP ? '#111827' : ASAP_COLOR} />
                  <Text style={[styles.asapText, draftIsASAP && styles.asapTextActive]}>ASAP</Text>
                </Pressable>
                <Text style={styles.asapHint}>or pick a time</Text>
              </View>
            )}

            <View style={styles.stepToggleWrap} testID="unifiedPickerStepToggle">
              <Pressable
                onPress={() => setStep('date')}
                style={[styles.stepPill, step === 'date' && styles.stepPillActive]}
                testID="unifiedPickerStepDate"
              >
                <Text style={[styles.stepText, step === 'date' && styles.stepTextActive]}>Date</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep('time')}
                style={[styles.stepPill, step === 'time' && styles.stepPillActive]}
                testID="unifiedPickerStepTime"
              >
                <Text style={[styles.stepText, step === 'time' && styles.stepTextActive]}>Time</Text>
              </Pressable>
            </View>

            {step === 'date' ? (
              <View style={styles.calendarCard} testID="unifiedPickerCalendarCard">
                <Calendar
                  selectedDate={draftDate}
                  minimumDate={minimumDate}
                  onSelectDate={handleDateSelect}
                />
              </View>
            ) : (
              <View style={styles.timeCard} testID="unifiedPickerTimeCard">
                <Text style={styles.timeLabel}>TIME</Text>
                <TimePickerInline
                  value={draftDate}
                  onChange={handleTimeChange}
                />
              </View>
            )}
          </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropRoot: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.62)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: ACCENT_COLOR,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    minHeight: 520,
    maxHeight: '92%',
  },
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#CBD5E1',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#CBD5E1',
  },
  doneBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  doneBtnText: {
    color: ACCENT_COLOR,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  stepToggleWrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    padding: 4,
    gap: 6,
    marginBottom: 14,
  },
  stepPill: {
    minWidth: 96,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillActive: {
    backgroundColor: '#FFFFFF',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#E5E7EB',
  },
  stepTextActive: {
    color: ACCENT_COLOR,
  },
  asapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  asapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
  },
  asapPillActive: {
    backgroundColor: ASAP_COLOR,
    borderColor: ASAP_COLOR,
  },
  asapText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  asapTextActive: {
    color: '#111827',
  },
  asapHint: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#CBD5E1',
  },
  calendarCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  calendar: {
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
  },
  dayCellSelected: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 8,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#1F2937',
  },
  dayTextDisabled: {
    color: '#D1D5DB',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  dayTextToday: {
    color: ACCENT_COLOR,
    fontWeight: '700' as const,
  },
  timeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 12,
    textAlign: 'center' as const,
    color: '#6B7280',
  },
  timePickerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnContainer: {
    height: PICKER_HEIGHT,
    width: 70,
    position: 'relative',
  },
  scrollViewColumn: {
    height: PICKER_HEIGHT,
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
    backgroundColor: 'rgba(30, 58, 138, 0.05)',
    zIndex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 22,
    fontWeight: '500' as const,
    color: '#9CA3AF',
  },
  itemTextSelected: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: ACCENT_COLOR,
  },
  separator: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    marginHorizontal: 4,
  },
});
