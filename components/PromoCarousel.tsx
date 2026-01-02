import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { PromoCarouselItem } from '@/types';

interface PromoCarouselProps {
  items: PromoCarouselItem[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function PromoCarousel({ items, selected, onSelect }: PromoCarouselProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={[
              styles.item,
              { backgroundColor: selected === item.id ? item.color : '#F1F5F9' },
            ]}
            onPress={() => onSelect(selected === item.id ? '' : item.id)}
          >
            <Text
              style={[
                styles.itemText,
                { color: selected === item.id ? '#FFFFFF' : '#64748B' },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
