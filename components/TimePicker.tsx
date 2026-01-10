import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
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
  lightBackground?: boolean;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM'];

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

interface ScrollColumnProps {
  data: (number | string)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem?: (item: number | string) => string;
  accentColor: string;
  lightBackground?: boolean;
}

function ScrollColumn({ data, selectedIndex, onSelect, formatItem, accentColor, lightBackground }: ScrollColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const hasInitialized = useRef(false);
  const lastSelectedIndex = useRef(selectedIndex);

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

  const handleScrollEnd = useCallback((event: any) => {
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
      <View style={[styles.selectionHighlight, { borderColor: accentColor, backgroundColor: lightBackground ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }]} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={(e) => {
          if (e.nativeEvent.velocity?.y === 0) {
            handleScrollEnd(e);
          }
        }}
        contentContainerStyle={{
          paddingVertical: paddingItems * ITEM_HEIGHT,
        }}
        style={styles.scrollView}
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
                  lightBackground && styles.itemTextLight,
                  isSelected && [styles.itemTextSelected, { color: accentColor }],
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

export default function TimePicker({ value, onChange, accentColor = '#3B82F6', lightBackground = false }: TimePickerProps) {
  const valueRef = useRef(value);
  
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const hour24 = value.getHours();
  const minute = value.getMinutes();
  const isPM = hour24 >= 12;
  const hour12 = hour24 % 12 || 12;

  const [localHourIndex, setLocalHourIndex] = useState(HOURS.indexOf(hour12));
  const [localMinuteIndex, setLocalMinuteIndex] = useState(minute);
  const [localPeriodIndex, setLocalPeriodIndex] = useState(isPM ? 1 : 0);

  const isUpdatingFromProps = useRef(false);

  useEffect(() => {
    const newHourIndex = HOURS.indexOf(hour12);
    const newMinuteIndex = minute;
    const newPeriodIndex = isPM ? 1 : 0;
    
    if (localHourIndex !== newHourIndex || localMinuteIndex !== newMinuteIndex || localPeriodIndex !== newPeriodIndex) {
      isUpdatingFromProps.current = true;
      setLocalHourIndex(newHourIndex);
      setLocalMinuteIndex(newMinuteIndex);
      setLocalPeriodIndex(newPeriodIndex);
      setTimeout(() => {
        isUpdatingFromProps.current = false;
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour12, minute, isPM]);

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
    const currentMinute = localMinuteIndex;
    const currentPM = localPeriodIndex === 1;
    updateTime(newHour, currentMinute, currentPM);
  }, [localMinuteIndex, localPeriodIndex, updateTime]);

  const handleMinuteChange = useCallback((index: number) => {
    setLocalMinuteIndex(index);
    const currentHour = HOURS[localHourIndex];
    const currentPM = localPeriodIndex === 1;
    updateTime(currentHour, index, currentPM);
  }, [localHourIndex, localPeriodIndex, updateTime]);

  const handlePeriodChange = useCallback((index: number) => {
    setLocalPeriodIndex(index);
    const currentHour = HOURS[localHourIndex];
    const currentMinute = localMinuteIndex;
    updateTime(currentHour, currentMinute, index === 1);
  }, [localHourIndex, localMinuteIndex, updateTime]);

  return (
    <View style={styles.container}>
      <View style={styles.pickerRow}>
        <ScrollColumn
          data={HOURS}
          selectedIndex={localHourIndex}
          onSelect={handleHourChange}
          accentColor={accentColor}
          lightBackground={lightBackground}
        />
        <Text style={[styles.separator, lightBackground && styles.separatorLight]}>:</Text>
        <ScrollColumn
          data={MINUTES}
          selectedIndex={localMinuteIndex}
          onSelect={handleMinuteChange}
          formatItem={(m) => padZero(m as number)}
          accentColor={accentColor}
          lightBackground={lightBackground}
        />
        <ScrollColumn
          data={PERIODS}
          selectedIndex={localPeriodIndex}
          onSelect={handlePeriodChange}
          accentColor={accentColor}
          lightBackground={lightBackground}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  scrollView: {
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    color: '#64748B',
  },
  itemTextSelected: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  itemTextLight: {
    color: '#9CA3AF',
  },
  separator: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#64748B',
    marginHorizontal: 4,
  },
  separatorLight: {
    color: '#9CA3AF',
  },
});
