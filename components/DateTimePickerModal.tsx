import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, Zap, X } from 'lucide-react-native';
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

  const [showIOSDate, setShowIOSDate] = useState<boolean>(false);
  const [showIOSTime, setShowIOSTime] = useState<boolean>(false);

  const [showAndroidDate, setShowAndroidDate] = useState<boolean>(false);

  const [webDateText, setWebDateText] = useState<string>('');
  const [webTimeText, setWebTimeText] = useState<string>('');

  useEffect(() => {
    if (!visible) return;
    console.log('[DateTimePickerModal] open', {
      title,
      allowASAP,
      mode,
      initial: {
        isASAP: initialValue.isASAP,
        iso: initialValue.date?.toISOString?.(),
      },
    });

    setDraftIsASAP(Boolean(initialValue.isASAP));
    setDraftDate(initialValue.date);

    if (Platform.OS === 'web') {
      setWebDateText(formatDateMMDDYYYY(initialValue.date));
      setWebTimeText(formatTime12h(initialValue.date));
    }

    setShowIOSDate(false);
    setShowIOSTime(false);
    setShowAndroidDate(false);
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

  const closeAllPickers = useCallback(() => {
    setShowIOSDate(false);
    setShowIOSTime(false);
    setShowAndroidDate(false);
  }, []);

  const requestOpenDate = useCallback(() => {
    setDraftIsASAP(false);
    closeAllPickers();
    if (Platform.OS === 'ios') {
      setShowIOSDate(true);
      return;
    }
    if (Platform.OS === 'android') {
      setShowAndroidDate(true);
      return;
    }
  }, [closeAllPickers]);

  const requestOpenTime = useCallback(() => {
    setDraftIsASAP(false);
    closeAllPickers();
    setShowIOSTime(true);
  }, [closeAllPickers]);

  const commitDone = useCallback(() => {
    console.log('[DateTimePickerModal] done', {
      title,
      isASAP: draftIsASAP,
      iso: draftDate?.toISOString?.(),
    });

    if (draftIsASAP) {
      onDone({ date: new Date(), isASAP: true });
      return;
    }

    if (Platform.OS === 'web') {
      const parsed = parseWebDateTime(webDateText, webTimeText);
      if (!parsed) {
        Alert.alert('Invalid date/time', 'Use MM/DD/YYYY and a valid time (e.g. 7:30 PM).');
        return;
      }
      onDone({ date: parsed, isASAP: false });
      return;
    }

    onDone({ date: draftDate, isASAP: false });
  }, [draftDate, draftIsASAP, onDone, title, webDateText, webTimeText]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
      transparent={false}
    >
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                console.log('[DateTimePickerModal] cancel');
                closeAllPickers();
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
                {draftIsASAP ? 'Leaving now' : `${formatDateMMDDYYYY(draftDate)} • ${formatTime12h(draftDate)}`}
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

          <View style={styles.content}>
            {allowASAP ? (
              <View style={styles.asapRow}>
                <Pressable
                  onPress={() => {
                    console.log('[DateTimePickerModal] set ASAP true');
                    closeAllPickers();
                    setDraftIsASAP(true);
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
            ) : null}

            {Platform.OS === 'web' ? (
              <View style={styles.webGrid}>
                <View style={styles.webField}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Date</Text>
                  <TextInput
                    value={webDateText}
                    onChangeText={(t) => {
                      setDraftIsASAP(false);
                      setWebDateText(normalizeWebDateInput(t));
                    }}
                    style={[styles.webInput, { borderColor: theme.border, color: theme.text }]}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={theme.subtext}
                    testID="dateTimePickerWebDate"
                  />
                </View>
                <View style={[styles.webTimePickerWrapper, { borderColor: theme.border, backgroundColor: theme.card, borderWidth: 1, borderRadius: 18, padding: 20 }]}>
                  <TimePicker
                    value={draftDate}
                    onChange={(newDate) => {
                      setDraftIsASAP(false);
                      const next = new Date(draftDate);
                      next.setHours(newDate.getHours(), newDate.getMinutes(), 0, 0);
                      setDraftDate(next);
                      setWebTimeText(formatTime12h(next));
                    }}
                    accentColor={theme.accent}
                  />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.cardsRow}>
                  <Pressable
                    style={[styles.cardBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                    onPress={requestOpenDate}
                    testID="dateTimePickerOpenDate"
                  >
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                      <Calendar size={18} color={theme.text} />
                    </View>
                    <View style={styles.cardTextWrap}>
                      <Text style={[styles.cardLabel, { color: theme.subtext }]}>Date</Text>
                      <Text style={[styles.cardValue, { color: theme.text }]}>{formatDateMMDDYYYY(draftDate)}</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[styles.cardBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                    onPress={requestOpenTime}
                    testID="dateTimePickerOpenTime"
                  >
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                      <Clock size={18} color={theme.text} />
                    </View>
                    <View style={styles.cardTextWrap}>
                      <Text style={[styles.cardLabel, { color: theme.subtext }]}>Time</Text>
                      <Text style={[styles.cardValue, { color: theme.text }]}>{formatTime12h(draftDate)}</Text>
                    </View>
                  </Pressable>
                </View>

                {Platform.OS === 'ios' && showIOSDate ? (
                  <View style={[styles.pickerPanel, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    <DateTimePicker
                      value={draftDate}
                      mode="date"
                      display="spinner"
                      onChange={(_, selected) => {
                        if (!selected) return;
                        setDraftIsASAP(false);
                        const next = new Date(draftDate);
                        next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                        setDraftDate(next);
                      }}
                    />
                    <Pressable
                      onPress={() => setShowIOSDate(false)}
                      style={[styles.inlineDoneBtn, { backgroundColor: theme.accent }]}
                      testID="dateTimePickerIOSDateDone"
                    >
                      <Text style={styles.inlineDoneText}>Done</Text>
                    </Pressable>
                  </View>
                ) : null}

                {showIOSTime ? (
                  <View style={[styles.timePickerPanel, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    <TimePicker
                      value={draftDate}
                      onChange={(newDate) => {
                        setDraftIsASAP(false);
                        const next = new Date(draftDate);
                        next.setHours(newDate.getHours(), newDate.getMinutes(), 0, 0);
                        setDraftDate(next);
                      }}
                      accentColor={theme.accent}
                    />
                    <Pressable
                      onPress={() => setShowIOSTime(false)}
                      style={[styles.inlineDoneBtn, { backgroundColor: theme.accent }]}
                      testID="dateTimePickerIOSTimeDone"
                    >
                      <Text style={styles.inlineDoneText}>Done</Text>
                    </Pressable>
                  </View>
                ) : null}

                {Platform.OS === 'android' && showAndroidDate ? (
                  <DateTimePicker
                    value={draftDate}
                    mode="date"
                    display="default"
                    onChange={(event, selected) => {
                      setShowAndroidDate(false);
                      if (event.type === 'dismissed' || !selected) return;
                      setDraftIsASAP(false);
                      const next = new Date(draftDate);
                      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                      setDraftDate(next);
                    }}
                  />
                ) : null}

                
              </>
            )}
          </View>
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
    paddingTop: 6,
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
    gap: 14,
  },
  asapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  pickerPanel: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  timePickerPanel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    paddingTop: 30,
  },
  inlineDoneBtn: {
    margin: 12,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineDoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800' as const,
  },
  webGrid: {
    gap: 20,
  },
  webField: {
    gap: 8,
  },
  webTimePickerWrapper: {
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  webInput: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700' as const,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
