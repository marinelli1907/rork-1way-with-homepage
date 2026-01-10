import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function RadiusSlider({ value, onChange }: RadiusSliderProps) {
  return (
    <View style={styles.container} testID="radiusSlider">
      <View style={styles.header}>
        <Text style={styles.label}>Radius</Text>
        <Text style={styles.value}>{value} mi</Text>
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
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#334155',
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#001f3f',
    letterSpacing: 0.2,
  },
  slider: {
    width: '100%',
    height: 28,
  },
});
