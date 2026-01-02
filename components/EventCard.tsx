import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapPin, Navigation, Calendar, Heart, X, TrendingUp } from 'lucide-react-native';
import { CatalogEventWithDistance } from '@/types';

interface EventCardProps {
  event: CatalogEventWithDistance;
  onSave: (event: CatalogEventWithDistance) => void;
  onInterested: (event: CatalogEventWithDistance) => void;
  onNotInterested: (event: CatalogEventWithDistance) => void;
  interestStatus: 'interested' | 'not_interested' | null;
}

export function EventCard({ event, onSave, onInterested, onNotInterested, interestStatus }: EventCardProps) {
  const formatDate = () => {
    const date = new Date(event.startISO);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return { month, day };
  };

  const formatTime = () => {
    const date = new Date(event.startISO);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${weekday}, ${time}`;
  };

  const getCategoryColor = () => {
    const colors: Record<string, string> = {
      sports: '#1E3A8A',
      concert: '#6366F1',
      bar: '#DC2626',
      holiday: '#059669',
      general: '#6B7280',
      comedy: '#F59E0B',
      theater: '#8B5CF6',
      art: '#EC4899',
      food: '#EF4444',
      family: '#10B981',
      festival: '#F97316',
      conference: '#3B82F6',
      community: '#14B8A6',
      nightlife: '#A855F7',
    };
    return colors[event.category] || colors.general;
  };

  const { month, day } = formatDate();
  const color = getCategoryColor();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.dateBox, { backgroundColor: color }]}>
          <Text style={styles.dateMonth}>{month.toUpperCase()}</Text>
          <Text style={styles.dateDay}>{day}</Text>
        </View>

        <View style={styles.mainInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={styles.metaRow}>
            <MapPin size={12} color="#64748B" />
            <Text style={styles.venue} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>
          <Text style={styles.time}>{formatTime()}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.badges}>
          <View style={styles.distanceBadge}>
            <Navigation size={12} color="#059669" />
            <Text style={styles.distanceText}>{event.distance.toFixed(1)} mi</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.categoryText, { color }]}>
              {event.category.toUpperCase()}
            </Text>
          </View>
          {event.expectedSurge > 1.2 && (
            <View style={styles.surgeBadge}>
              <TrendingUp size={10} color="#DC2626" />
              <Text style={styles.surgeText}>{event.expectedSurge.toFixed(1)}×</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.actionButton, styles.calendarButton]}
          onPress={() => onSave(event)}
        >
          <Calendar size={18} color="#1E3A8A" strokeWidth={2} />
          <Text style={styles.actionButtonText}>Add to Calendar</Text>
        </Pressable>
        <Pressable
          style={[
            styles.actionButton,
            styles.interestedButton,
            interestStatus === 'interested' && styles.interestedButtonActive,
          ]}
          onPress={() => onInterested(event)}
          disabled={interestStatus === 'interested'}
        >
          <Heart
            size={18}
            color={interestStatus === 'interested' ? '#FFFFFF' : '#DC2626'}
            fill={interestStatus === 'interested' ? '#FFFFFF' : 'none'}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.actionButtonText,
              interestStatus === 'interested' && styles.actionButtonTextActive,
            ]}
          >
            {interestStatus === 'interested' ? 'Interested' : 'Interested'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.notInterestedButton]}
          onPress={() => onNotInterested(event)}
          disabled={interestStatus === 'not_interested'}
        >
          <X size={18} color="#64748B" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  mainInfo: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venue: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  time: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#059669',
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  surgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF2F2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  surgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  calendarButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  interestedButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  interestedButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  notInterestedButton: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    flex: 0,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
});
