import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function RadiusSlider({ value, onChange }: RadiusSliderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Search radius</Text>
        <Text style={styles.value}>{value} miles</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={5}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#001f3f"
        maximumTrackTintColor="#E2E8F0"
        thumbTintColor="#001f3f"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  value: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#001f3f',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
