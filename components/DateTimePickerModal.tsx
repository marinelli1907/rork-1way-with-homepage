import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ChevronLeft, ChevronRight, X, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import TimePicker from './TimePicker';

export type DateTimePickerResult = {
  date: Date;
  isASAP: boolean;
};

export type DateTimePickerModalMode = 'event' | 'ride';

export interface DateTimePickerModalProps {
  visible: boolean;
  title: string;
  initialValue: DateTimePickerResult;
  allowASAP?: boolean;
  mode?: DateTimePickerModalMode;
  onCancel: () => void;
  onDone: (value: DateTimePickerResult) => void;
}

export function roundUpToInterval(date: Date, intervalMinutes: number): Date {
  const out = new Date(date);
  out.setSeconds(0, 0);
  const minutes = out.getMinutes();
  const remainder = minutes % intervalMinutes;
  const add = remainder === 0 ? 0 : intervalMinutes - remainder;
  out.setMinutes(minutes + add);

  if (out.getTime() <= date.getTime()) {
    out.setMinutes(out.getMinutes() + intervalMinutes);
  }

  return out;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatTime12h(d: Date) {
  return d.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
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

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  accentColor: string;
  textColor: string;
  subtextColor: string;
}

function Calendar({ selectedDate, onSelectDate, accentColor, textColor, subtextColor }: CalendarProps) {
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
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <Text style={[styles.calendarTitle, { color: textColor }]}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <Pressable onPress={goToNextMonth} style={styles.calendarNavBtn} hitSlop={8}>
          <ChevronRight size={22} color={textColor} />
        </Pressable>
      </View>

      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: subtextColor }]}>{day}</Text>
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
            const isPast = cellDate < today && !isSameDay(cellDate, today);

            return (
              <Pressable
                key={dayIdx}
                style={[
                  styles.dayCell,
                  isSelected && [styles.dayCellSelected, { backgroundColor: accentColor }],
                  isToday && !isSelected && styles.dayCellToday,
                ]}
                onPress={() => handleDayPress(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: isPast ? subtextColor : textColor },
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && { color: accentColor },
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

export default function DateTimePickerModal({
  visible,
  title,
  initialValue,
  allowASAP = false,
  mode = 'event',
  onCancel,
  onDone,
}: DateTimePickerModalProps) {
  const [draftIsASAP, setDraftIsASAP] = useState<boolean>(Boolean(initialValue.isASAP));
  const [draftDate, setDraftDate] = useState<Date>(initialValue.date);

  useEffect(() => {
    if (!visible) return;
    console.log('[DateTimePickerModal] open', { title, allowASAP, mode });
    setDraftIsASAP(Boolean(initialValue.isASAP));
    setDraftDate(initialValue.date);
  }, [allowASAP, initialValue.date, initialValue.isASAP, mode, title, visible]);

  const theme = useMemo(() => {
    if (mode === 'ride') {
      return {
        accent: '#1E3A8A',
        asap: '#F59E0B',
        background: '#0B1220',
        card: '#111B2E',
        text: '#E5E7EB',
        subtext: '#94A3B8',
        border: 'rgba(255,255,255,0.10)',
      };
    }

    return {
      accent: '#E31937',
      asap: '#F59E0B',
      background: '#0B0F17',
      card: '#121826',
      text: '#E5E7EB',
      subtext: '#94A3B8',
      border: 'rgba(255,255,255,0.10)',
    };
  }, [mode]);

  const handleDateSelect = useCallback((newDate: Date) => {
    setDraftIsASAP(false);
    const updated = new Date(draftDate);
    updated.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    setDraftDate(updated);
  }, [draftDate]);

  const handleTimeChange = useCallback((newDate: Date) => {
    setDraftIsASAP(false);
    const updated = new Date(draftDate);
    updated.setHours(newDate.getHours(), newDate.getMinutes(), 0, 0);
    setDraftDate(updated);
  }, [draftDate]);

  const commitDone = useCallback(() => {
    console.log('[DateTimePickerModal] done', { title, isASAP: draftIsASAP, iso: draftDate?.toISOString?.() });
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
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
      transparent={false}
    >
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                console.log('[DateTimePickerModal] cancel');
                onCancel();
              }}
              style={styles.headerIconBtn}
              testID="dateTimePickerCancel"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={22} color={theme.subtext} />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.subtext }]} numberOfLines={1}>
                {draftIsASAP ? 'Leaving now' : `${formattedDate} • ${formatTime12h(draftDate)}`}
              </Text>
            </View>

            <Pressable
              onPress={commitDone}
              style={[styles.doneBtn, { backgroundColor: theme.accent }]}
              testID="dateTimePickerDone"
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {allowASAP && (
              <View style={styles.asapRow}>
                <Pressable
                  onPress={() => {
                    console.log('[DateTimePickerModal] set ASAP true');
                    setDraftIsASAP(true);
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                  }}
                  style={[
                    styles.asapPill,
                    { borderColor: theme.border },
                    draftIsASAP && { backgroundColor: theme.asap, borderColor: theme.asap },
                  ]}
                  testID="dateTimePickerASAP"
                >
                  <Zap size={16} color={draftIsASAP ? '#111827' : theme.asap} />
                  <Text style={[styles.asapText, { color: draftIsASAP ? '#111827' : theme.text }]}>ASAP</Text>
                </Pressable>
                <Text style={[styles.asapHint, { color: theme.subtext }]}>or pick a time</Text>
              </View>
            )}

            <View style={[styles.calendarCard, { backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,0.08)' }]}>
              <Calendar
                selectedDate={draftDate}
                onSelectDate={handleDateSelect}
                accentColor={theme.accent}
                textColor="#1F2937"
                subtextColor="#6B7280"
              />
            </View>

            <View style={[styles.timeCard, { backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,0.08)' }]}>
              <Text style={[styles.timeLabel, { color: '#6B7280' }]}>TIME</Text>
              <TimePicker
                value={draftDate}
                onChange={handleTimeChange}
                accentColor={theme.accent}
                lightBackground
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  doneBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
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
    backgroundColor: 'transparent',
  },
  asapText: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  asapHint: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  calendarCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
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
    borderRadius: 8,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  timeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
});
