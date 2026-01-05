import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Car, CheckCircle2, Flag, MapPin } from 'lucide-react-native';

type RideStatus =
  | 'pending'
  | 'confirmed'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'cancelled';

interface Props {
  status: RideStatus;
  pickupTime: string;
  estimatedArrivalTime?: string;
}

type StepKey = 'on_way' | 'arrived_pickup' | 'to_destination' | 'arrived_destination';

const COLORS = {
  cardBg: '#F6FAFF',
  cardBorder: '#D7E7FF',
  textPrimary: '#0B1B3A',
  textSecondary: '#5B6B86',
  accent: '#2563EB',
  accentSoft: '#DBEAFE',
  success: '#16A34A',
  track: '#CFE3FF',
  nodeBorder: '#8BB6FF',
} as const;

function safeFormatTime(value: string | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function statusToStepKey(status: RideStatus): StepKey | null {
  if (status === 'confirmed' || status === 'en_route') return 'on_way';
  if (status === 'arrived') return 'arrived_pickup';
  if (status === 'in_progress') return 'to_destination';
  if (status === 'completed' || status === 'paid') return 'arrived_destination';
  return null;
}

export default function DriverArrivalBar({ status, pickupTime, estimatedArrivalTime }: Props) {
  const stepKey = statusToStepKey(status);
  const progressAnim = useRef<Animated.Value>(new Animated.Value(0)).current;

  const steps = useMemo(
    () =>
      [
        { key: 'on_way' as const, label: 'On the way', icon: Car },
        { key: 'arrived_pickup' as const, label: 'Arrived', icon: MapPin },
        { key: 'to_destination' as const, label: 'To destination', icon: Flag },
        { key: 'arrived_destination' as const, label: 'Arrived', icon: CheckCircle2 },
      ] satisfies { key: StepKey; label: string; icon: typeof Car }[],
    []
  );

  const activeIndex = useMemo<number>(() => {
    if (!stepKey) return -1;
    return steps.findIndex((s) => s.key === stepKey);
  }, [stepKey, steps]);

  const progressRatio = useMemo<number>(() => {
    if (activeIndex < 0) return 0;
    if (activeIndex === 0) return 0.1;
    if (activeIndex >= steps.length - 1) return 1;
    return activeIndex / (steps.length - 1);
  }, [activeIndex, steps.length]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }

    Animated.spring(progressAnim, {
      toValue: progressRatio,
      useNativeDriver: false,
      tension: 55,
      friction: 10,
    }).start();
  }, [activeIndex, progressAnim, progressRatio]);

  if (!stepKey) {
    return null;
  }

  const etaText = safeFormatTime(estimatedArrivalTime) ?? safeFormatTime(pickupTime);

  const statusTitle = (() => {
    switch (stepKey) {
      case 'on_way':
        return 'Driver is on the way';
      case 'arrived_pickup':
        return 'Driver has arrived';
      case 'to_destination':
        return 'Headed to destination';
      case 'arrived_destination':
        return 'Arrived at destination';
      default:
        return 'Ride update';
    }
  })();

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isCompleted = (index: number) => index < activeIndex;
  const isActive = (index: number) => index === activeIndex;

  return (
    <View style={styles.container} testID="driverArrivalBar">
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.statusText} numberOfLines={2} testID="driverArrivalBar_statusText">
            {statusTitle}
          </Text>
        </View>

        {etaText ? (
          <View style={styles.etaPill} testID="driverArrivalBar_etaPill">
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaValue} numberOfLines={1}>
              {etaText}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.stepper} testID="driverArrivalBar_stepper">
        <View style={styles.trackBg} />
        <Animated.View style={[styles.trackFill, { width: progressWidth }]} />

        <View style={styles.nodesRow}>
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const completed = isCompleted(idx);
            const active = isActive(idx);
            const nodeBg = completed ? COLORS.accent : COLORS.cardBg;
            const nodeBorder = completed || active ? COLORS.accent : COLORS.nodeBorder;
            const iconColor = completed ? '#FFFFFF' : active ? COLORS.accent : COLORS.textSecondary;

            return (
              <View key={s.key} style={styles.nodeCol} testID={`driverArrivalBar_step_${s.key}`}>
                <View
                  style={[
                    styles.node,
                    {
                      backgroundColor: nodeBg,
                      borderColor: nodeBorder,
                      transform: [{ scale: active ? 1.06 : 1 }],
                    },
                  ]}
                >
                  <Icon size={14} color={iconColor} />
                </View>
                <Text style={[styles.nodeLabel, active ? styles.nodeLabelActive : null]} numberOfLines={1}>
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  etaPill: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  etaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
  },
  etaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  stepper: {
    height: 54,
    justifyContent: 'center',
  },
  trackBg: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 18,
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.track,
  },
  trackFill: {
    position: 'absolute',
    left: 14,
    top: 18,
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  nodeCol: {
    width: '25%',
    alignItems: 'center',
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    maxWidth: 88,
  },
  nodeLabelActive: {
    color: COLORS.textPrimary,
  },
});
