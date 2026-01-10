import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface TimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  accentColor?: string;
}

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

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

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      setTimeout(() => {
        const hourIndex = HOURS.indexOf(hour12);
        const minuteIndex = minute;
        
        hourScrollRef.current?.scrollTo({
          y: hourIndex * ITEM_HEIGHT,
          animated: false,
        });
        minuteScrollRef.current?.scrollTo({
          y: minuteIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [hour12, minute]);

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

  const handleHourScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, HOURS.length - 1));
    const newHour = HOURS[clampedIndex];
    
    if (newHour !== selectedHour) {
      setSelectedHour(newHour);
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    }
  }, [selectedHour]);

  const handleHourScrollEnd = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, HOURS.length - 1));
    const newHour = HOURS[clampedIndex];
    
    hourScrollRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });
    
    setSelectedHour(newHour);
    updateTime(newHour, selectedMinute, selectedPeriod);
  }, [selectedMinute, selectedPeriod, updateTime]);

  const handleMinuteScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, MINUTES.length - 1));
    const newMinute = MINUTES[clampedIndex];
    
    if (newMinute !== selectedMinute) {
      setSelectedMinute(newMinute);
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    }
  }, [selectedMinute]);

  const handleMinuteScrollEnd = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, MINUTES.length - 1));
    const newMinute = MINUTES[clampedIndex];
    
    minuteScrollRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });
    
    setSelectedMinute(newMinute);
    updateTime(selectedHour, newMinute, selectedPeriod);
  }, [selectedHour, selectedPeriod, updateTime]);

  const handlePeriodChange = useCallback((period: 'AM' | 'PM') => {
    if (period !== selectedPeriod) {
      setSelectedPeriod(period);
      updateTime(selectedHour, selectedMinute, period);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [selectedHour, selectedMinute, selectedPeriod, updateTime]);

  const selectHour = useCallback((hour: number) => {
    const index = HOURS.indexOf(hour);
    hourScrollRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: true,
    });
    setSelectedHour(hour);
    updateTime(hour, selectedMinute, selectedPeriod);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [selectedMinute, selectedPeriod, updateTime]);

  const selectMinute = useCallback((min: number) => {
    minuteScrollRef.current?.scrollTo({
      y: min * ITEM_HEIGHT,
      animated: true,
    });
    setSelectedMinute(min);
    updateTime(selectedHour, min, selectedPeriod);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [selectedHour, selectedPeriod, updateTime]);

  const renderWheelItem = (item: number, isSelected: boolean, isHour: boolean) => {
    const displayValue = isHour ? item.toString() : padZero(item);
    
    return (
      <Pressable
        key={item}
        style={styles.wheelItem}
        onPress={() => isHour ? selectHour(item) : selectMinute(item)}
      >
        <Animated.Text
          style={[
            styles.wheelText,
            isSelected && [styles.wheelTextSelected, { color: accentColor }],
          ]}
        >
          {displayValue}
        </Animated.Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.displayRow}>
        <Text style={[styles.displayTime, { color: accentColor }]}>
          {selectedHour}:{padZero(selectedMinute)} {selectedPeriod}
        </Text>
      </View>

      <View style={styles.pickerContainer}>
        <View style={[styles.selectionIndicator, { borderColor: accentColor }]} />
        
        <View style={styles.wheelWrapper}>
          <Text style={styles.wheelLabel}>Hour</Text>
          <ScrollView
            ref={hourScrollRef}
            style={styles.wheel}
            contentContainerStyle={styles.wheelContent}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onScroll={handleHourScroll}
            onMomentumScrollEnd={handleHourScrollEnd}
            onScrollEndDrag={handleHourScrollEnd}
            scrollEventThrottle={16}
          >
            {HOURS.map((hour) => renderWheelItem(hour, hour === selectedHour, true))}
          </ScrollView>
        </View>

        <View style={styles.colonContainer}>
          <Text style={styles.colon}>:</Text>
        </View>

        <View style={styles.wheelWrapper}>
          <Text style={styles.wheelLabel}>Min</Text>
          <ScrollView
            ref={minuteScrollRef}
            style={styles.wheel}
            contentContainerStyle={styles.wheelContent}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onScroll={handleMinuteScroll}
            onMomentumScrollEnd={handleMinuteScrollEnd}
            onScrollEndDrag={handleMinuteScrollEnd}
            scrollEventThrottle={16}
          >
            {MINUTES.map((min) => renderWheelItem(min, min === selectedMinute, false))}
          </ScrollView>
        </View>

        <View style={styles.periodContainer}>
          <Pressable
            style={[
              styles.periodButton,
              selectedPeriod === 'AM' && [styles.periodButtonActive, { backgroundColor: accentColor }],
            ]}
            onPress={() => handlePeriodChange('AM')}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'AM' && styles.periodTextActive,
              ]}
            >
              AM
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.periodButton,
              selectedPeriod === 'PM' && [styles.periodButtonActive, { backgroundColor: accentColor }],
            ]}
            onPress={() => handlePeriodChange('PM')}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'PM' && styles.periodTextActive,
              ]}
            >
              PM
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.quickSelectContainer}>
        <Text style={styles.quickSelectLabel}>Quick Select</Text>
        <View style={styles.quickSelectRow}>
          {[
            { h: 9, m: 0, p: 'AM' as const },
            { h: 12, m: 0, p: 'PM' as const },
            { h: 3, m: 0, p: 'PM' as const },
            { h: 6, m: 0, p: 'PM' as const },
            { h: 8, m: 0, p: 'PM' as const },
          ].map((preset, idx) => {
            const isActive = selectedHour === preset.h && selectedMinute === preset.m && selectedPeriod === preset.p;
            return (
              <Pressable
                key={idx}
                style={[
                  styles.quickSelectChip,
                  isActive && [styles.quickSelectChipActive, { backgroundColor: accentColor }],
                ]}
                onPress={() => {
                  selectHour(preset.h);
                  selectMinute(preset.m);
                  handlePeriodChange(preset.p);
                }}
              >
                <Text style={[styles.quickSelectText, isActive && styles.quickSelectTextActive]}>
                  {preset.h}:{padZero(preset.m)} {preset.p}
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
    alignItems: 'center',
    marginBottom: 20,
  },
  displayTime: {
    fontSize: 42,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: PICKER_HEIGHT,
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  wheelWrapper: {
    alignItems: 'center',
  },
  wheelLabel: {
    position: 'absolute',
    top: -24,
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  wheel: {
    height: PICKER_HEIGHT,
    width: 80,
  },
  wheelContent: {
    paddingVertical: ITEM_HEIGHT * 2,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelText: {
    fontSize: 28,
    fontWeight: '500' as const,
    color: '#94A3B8',
  },
  wheelTextSelected: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  colonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  colon: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#64748B',
  },
  periodContainer: {
    marginLeft: 16,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  periodButtonActive: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  periodText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#64748B',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  quickSelectContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  quickSelectLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  quickSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickSelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  quickSelectChipActive: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  quickSelectText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  quickSelectTextActive: {
    color: '#FFFFFF',
  },
});
