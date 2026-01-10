import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';

interface TimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  accentColor?: string;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const QUICK_MINUTES = [0, 15, 30, 45];

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

export default function TimePicker({ value, onChange, accentColor = '#3B82F6' }: TimePickerProps) {
  const hour24 = value.getHours();
  const minute = value.getMinutes();
  
  const isPM = hour24 >= 12;
  const hour12 = hour24 % 12 || 12;

  const [selectedHour, setSelectedHour] = useState(hour12);
  const [selectedMinute, setSelectedMinute] = useState(minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(isPM ? 'PM' : 'AM');
  const [showMinuteGrid, setShowMinuteGrid] = useState(false);

  useEffect(() => {
    const h24 = value.getHours();
    const m = value.getMinutes();
    const pm = h24 >= 12;
    const h12 = h24 % 12 || 12;
    
    setSelectedHour(h12);
    setSelectedMinute(m);
    setSelectedPeriod(pm ? 'PM' : 'AM');
  }, [value]);

  const updateTime = useCallback((hour: number, min: number, period: 'AM' | 'PM') => {
    let hour24Value = hour;
    if (period === 'PM' && hour !== 12) {
      hour24Value = hour + 12;
    } else if (period === 'AM' && hour === 12) {
      hour24Value = 0;
    }

    const newDate = new Date(value);
    newDate.setHours(hour24Value, min, 0, 0);
    onChange(newDate);
  }, [onChange, value]);

  const selectHour = useCallback((hour: number) => {
    setSelectedHour(hour);
    updateTime(hour, selectedMinute, selectedPeriod);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [selectedMinute, selectedPeriod, updateTime]);

  const selectMinute = useCallback((min: number) => {
    setSelectedMinute(min);
    updateTime(selectedHour, min, selectedPeriod);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [selectedHour, selectedPeriod, updateTime]);

  const togglePeriod = useCallback((period: 'AM' | 'PM') => {
    if (period !== selectedPeriod) {
      setSelectedPeriod(period);
      updateTime(selectedHour, selectedMinute, period);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [selectedHour, selectedMinute, selectedPeriod, updateTime]);

  const adjustMinute = useCallback((delta: number) => {
    let newMin = selectedMinute + delta;
    if (newMin < 0) newMin = 59;
    if (newMin > 59) newMin = 0;
    selectMinute(newMin);
  }, [selectMinute, selectedMinute]);

  const selectQuickTime = useCallback((h: number, m: number, p: 'AM' | 'PM') => {
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedPeriod(p);
    updateTime(h, m, p);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [updateTime]);

  return (
    <View style={styles.container}>
      <View style={styles.displayRow}>
        <Text style={[styles.displayTime, { color: accentColor }]}>
          {selectedHour}:{padZero(selectedMinute)}
        </Text>
        <View style={styles.periodToggle}>
          <Pressable
            style={[
              styles.periodBtn,
              selectedPeriod === 'AM' && [styles.periodBtnActive, { backgroundColor: accentColor }],
            ]}
            onPress={() => togglePeriod('AM')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'AM' && styles.periodTextActive]}>
              AM
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.periodBtn,
              selectedPeriod === 'PM' && [styles.periodBtnActive, { backgroundColor: accentColor }],
            ]}
            onPress={() => togglePeriod('PM')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'PM' && styles.periodTextActive]}>
              PM
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Hour</Text>
      </View>
      <View style={styles.hourGrid}>
        {HOURS.map((hour) => {
          const isSelected = hour === selectedHour;
          return (
            <Pressable
              key={hour}
              style={[
                styles.hourCell,
                isSelected && [styles.hourCellSelected, { backgroundColor: accentColor }],
              ]}
              onPress={() => selectHour(hour)}
            >
              <Text style={[styles.hourText, isSelected && styles.hourTextSelected]}>
                {hour}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Minute</Text>
        <Pressable 
          style={styles.finetuneToggle}
          onPress={() => setShowMinuteGrid(!showMinuteGrid)}
        >
          <Text style={[styles.finetuneText, { color: accentColor }]}>
            {showMinuteGrid ? 'Quick Select' : 'Fine Tune'}
          </Text>
        </Pressable>
      </View>

      {!showMinuteGrid ? (
        <View style={styles.minuteQuickRow}>
          {QUICK_MINUTES.map((min) => {
            const isSelected = min === selectedMinute;
            return (
              <Pressable
                key={min}
                style={[
                  styles.minuteQuickCell,
                  isSelected && [styles.minuteQuickCellSelected, { backgroundColor: accentColor }],
                ]}
                onPress={() => selectMinute(min)}
              >
                <Text style={[styles.minuteQuickText, isSelected && styles.minuteQuickTextSelected]}>
                  :{padZero(min)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.minuteFineTune}>
          <Pressable
            style={[styles.minuteAdjustBtn, { borderColor: accentColor }]}
            onPress={() => adjustMinute(-1)}
          >
            <Minus size={20} color={accentColor} />
          </Pressable>
          <View style={[styles.minuteDisplay, { borderColor: accentColor }]}>
            <Text style={[styles.minuteDisplayText, { color: accentColor }]}>
              :{padZero(selectedMinute)}
            </Text>
          </View>
          <Pressable
            style={[styles.minuteAdjustBtn, { borderColor: accentColor }]}
            onPress={() => adjustMinute(1)}
          >
            <Plus size={20} color={accentColor} />
          </Pressable>
        </View>
      )}

      {!QUICK_MINUTES.includes(selectedMinute) && !showMinuteGrid && (
        <View style={styles.customMinuteIndicator}>
          <Text style={styles.customMinuteText}>
            Current: :{padZero(selectedMinute)}
          </Text>
        </View>
      )}

      <View style={styles.quickPresetsSection}>
        <Text style={styles.quickPresetsLabel}>Quick Times</Text>
        <View style={styles.quickPresetsRow}>
          {[
            { h: 9, m: 0, p: 'AM' as const, label: '9 AM' },
            { h: 12, m: 0, p: 'PM' as const, label: 'Noon' },
            { h: 5, m: 0, p: 'PM' as const, label: '5 PM' },
            { h: 7, m: 30, p: 'PM' as const, label: '7:30 PM' },
          ].map((preset, idx) => {
            const isActive = 
              selectedHour === preset.h && 
              selectedMinute === preset.m && 
              selectedPeriod === preset.p;
            return (
              <Pressable
                key={idx}
                style={[
                  styles.quickPresetChip,
                  isActive && [styles.quickPresetChipActive, { backgroundColor: accentColor }],
                ]}
                onPress={() => selectQuickTime(preset.h, preset.m, preset.p)}
              >
                <Text style={[styles.quickPresetText, isActive && styles.quickPresetTextActive]}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  displayTime: {
    fontSize: 48,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
  periodToggle: {
    flexDirection: 'column',
    gap: 4,
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  periodBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#64748B',
    textAlign: 'center' as const,
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  finetuneToggle: {
    padding: 4,
  },
  finetuneText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  hourCell: {
    width: '23%',
    aspectRatio: 1.6,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourCellSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  hourText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  hourTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  minuteQuickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  minuteQuickCell: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteQuickCellSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  minuteQuickText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  minuteQuickTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  minuteFineTune: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  minuteAdjustBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  minuteDisplay: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  minuteDisplayText: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  customMinuteIndicator: {
    alignItems: 'center',
    marginBottom: 8,
  },
  customMinuteText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  quickPresetsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  quickPresetsLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  quickPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickPresetChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  quickPresetChipActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickPresetText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  quickPresetTextActive: {
    color: '#FFFFFF',
  },
});
