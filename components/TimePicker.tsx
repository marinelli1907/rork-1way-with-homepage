import React, { useCallback, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!isScrolling.current) {
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
    
    if (clampedIndex !== selectedIndex) {
      onSelect(clampedIndex);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    scrollRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });
  }, [data.length, onSelect, selectedIndex]);

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
  const hour24 = value.getHours();
  const minute = value.getMinutes();
  const isPM = hour24 >= 12;
  const hour12 = hour24 % 12 || 12;

  const hourIndex = HOURS.indexOf(hour12);
  const minuteIndex = minute;
  const periodIndex = isPM ? 1 : 0;

  const updateTime = useCallback((h12: number, min: number, pm: boolean) => {
    let h24 = h12;
    if (pm && h12 !== 12) {
      h24 = h12 + 12;
    } else if (!pm && h12 === 12) {
      h24 = 0;
    }

    const newDate = new Date(value);
    newDate.setHours(h24, min, 0, 0);
    onChange(newDate);
  }, [onChange, value]);

  const handleHourChange = useCallback((index: number) => {
    const newHour = HOURS[index];
    updateTime(newHour, minute, isPM);
  }, [minute, isPM, updateTime]);

  const handleMinuteChange = useCallback((index: number) => {
    updateTime(hour12, index, isPM);
  }, [hour12, isPM, updateTime]);

  const handlePeriodChange = useCallback((index: number) => {
    updateTime(hour12, minute, index === 1);
  }, [hour12, minute, updateTime]);

  return (
    <View style={styles.container}>
      <View style={styles.pickerRow}>
        <ScrollColumn
          data={HOURS}
          selectedIndex={hourIndex}
          onSelect={handleHourChange}
          accentColor={accentColor}
          lightBackground={lightBackground}
        />
        <Text style={[styles.separator, lightBackground && styles.separatorLight]}>:</Text>
        <ScrollColumn
          data={MINUTES}
          selectedIndex={minuteIndex}
          onSelect={handleMinuteChange}
          formatItem={(m) => padZero(m as number)}
          accentColor={accentColor}
          lightBackground={lightBackground}
        />
        <ScrollColumn
          data={PERIODS}
          selectedIndex={periodIndex}
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
