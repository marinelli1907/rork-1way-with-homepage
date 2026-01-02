import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Car, MapPin } from 'lucide-react-native';

interface Props {
  status: 'pending' | 'confirmed' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'paid' | 'cancelled';
  pickupTime: string;
  estimatedArrivalTime?: string;
}

export default function DriverArrivalBar({ status, pickupTime, estimatedArrivalTime }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [minutesAway, setMinutesAway] = useState(5);

  useEffect(() => {
    if (status === 'en_route') {
      // Animate progress bar indefinitely to simulate movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Mock counting down minutes
      const interval = setInterval(() => {
        setMinutesAway((prev) => (prev > 1 ? prev - 1 : 1));
      }, 60000); // Reduce minute every 60s

      return () => clearInterval(interval);
    } else {
      progress.setValue(0);
    }
  }, [status]);

  if (status !== 'en_route' && status !== 'arrived' && status !== 'confirmed') {
    return null;
  }

  const getStatusText = () => {
    switch (status) {
      case 'confirmed':
        return 'Driver found, preparing to head your way';
      case 'en_route':
        return `Driver is ${minutesAway} min away`;
      case 'arrived':
        return 'Driver has arrived!';
      default:
        return '';
    }
  };

  const getProgressWidth = () => {
    if (status === 'arrived') return '100%';
    if (status === 'confirmed') return '10%';
    return '60%'; // Fixed for en_route visual
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <Text style={styles.timeText}>
          {new Date(pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.track}>
        {status === 'en_route' ? (
          <Animated.View
            style={[
              styles.bar,
              {
                width: '30%',
                left: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '70%'],
                }),
              },
            ]}
          />
        ) : (
          <View style={[styles.bar, { width: getProgressWidth() }]} />
        )}
      </View>

      <View style={styles.icons}>
        <Car size={16} color="#1E3A8A" />
        <MapPin size={16} color="#059669" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  timeText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  track: {
    height: 6,
    backgroundColor: '#DBEAFE',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  bar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
