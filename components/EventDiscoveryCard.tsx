import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Image } from 'react-native';
import { Calendar, Heart, ThumbsDown, MapPin, Clock, Users, ArrowRight } from 'lucide-react-native';
import { CatalogEvent, EventCategory } from '@/types';
import { useEvents } from '@/providers/EventsProvider';
import { useProfiles } from '@/providers/ProfilesProvider';
import { useRouter } from 'expo-router';

interface EventDiscoveryCardProps {
  event: CatalogEvent;
  distance?: number;
}

export default function EventDiscoveryCard({ event, distance }: EventDiscoveryCardProps) {
  const router = useRouter();
  const {
    saveFromCatalog,
    markEventInterested,
    markEventNotInterested,
    removeEventInterest,
    getEventInterestStatus,
    events,
  } = useEvents();
  const { getConnectedProfiles } = useProfiles();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const interestStatus = getEventInterestStatus(event.id);
  
  const connectedProfiles = getConnectedProfiles();
  
  const attendingConnections = useMemo(() => {
    const myEvents = events.filter(e => 
      e.title === event.title && 
      e.startISO === event.startISO &&
      e.venue === event.venue
    );
    
    const attendees = myEvents.flatMap(e => e.attendees || []);
    
    return connectedProfiles.filter(profile => {
      const isPublic = profile.eventPrivacyPublic !== false;
      const isAttending = attendees.some(a => a.profileId === profile.id);
      return isPublic && isAttending;
    });
  }, [events, connectedProfiles, event]);
  
  const savedEvent = useMemo(() => {
    return events.find(e => 
      e.title === event.title && 
      e.startISO === event.startISO &&
      e.venue === event.venue
    );
  }, [events, event]);

  const formatEventDate = (isoString: string) => {
    const date = new Date(isoString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    return { month, day, time, weekday };
  };

  const getCategoryColor = (category: EventCategory) => {
    const colors = {
      sports: '#1E3A8A',
      concert: '#6366F1',
      bar: '#DC2626',
      holiday: '#059669',
      general: '#6B7280',
      comedy: '#F59E0B',
      theater: '#8B5CF6',
      art: '#EC4899',
      food: '#10B981',
      family: '#3B82F6',
      festival: '#F97316',
      conference: '#0EA5E9',
      community: '#84CC16',
      nightlife: '#EF4444',
    };
    return colors[category] || colors.general;
  };

  const handleAddToCalendar = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const newEvent = await saveFromCatalog(event.id);
      if (newEvent) {
        Alert.alert('Success', 'Event added to your calendar!', [
          { text: 'View Event', onPress: () => router.push(`/event/${newEvent.id}`) },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    } catch (error) {
      console.error('Failed to add to calendar:', error);
      Alert.alert('Error', 'Failed to add event to calendar. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCardPress = () => {
    if (savedEvent) {
      router.push(`/event/${savedEvent.id}`);
    } else {
      router.push(`/event/catalog-${event.id}`);
    }
  };

  const handleInterested = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isInterested) {
        await removeEventInterest(event.id);
        console.log('Removed interested status');
      } else {
        await markEventInterested(event);
        console.log('Marked as interested');
      }
    } catch (error) {
      console.error('Failed to update interest status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotInterested = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isNotInterested) {
        await removeEventInterest(event.id);
        console.log('Removed not interested status');
      } else {
        await markEventNotInterested(event.id);
        console.log('Marked as not interested');
      }
    } catch (error) {
      console.error('Failed to update not interested status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const { month, day, time, weekday } = formatEventDate(event.startISO);
  const color = getCategoryColor(event.category);
  const isInterested = interestStatus === 'interested';
  const isNotInterested = interestStatus === 'not_interested';

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        isInterested && styles.cardInterested,
        isNotInterested && styles.cardNotInterested,
        pressed && styles.cardPressed,
      ]}
      onPress={handleCardPress}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.dateBox, { backgroundColor: color }]}>
          <Text style={styles.dateMonth}>{month.toUpperCase()}</Text>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateWeekday}>{weekday}</Text>
        </View>

        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.infoRow}>
            <MapPin size={14} color="#64748B" strokeWidth={2} />
            <Text style={styles.eventVenue} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color="#64748B" strokeWidth={2} />
            <Text style={styles.eventTime}>{time}</Text>
            {distance !== undefined && (
              <Text style={styles.distanceText}> • {distance.toFixed(1)} mi</Text>
            )}
          </View>
        </View>
      </View>

      {event.description && (
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
      )}

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.interestedButton,
            isInterested && styles.interestedButtonActive,
            pressed && styles.actionButtonPressed,
            isProcessing && styles.actionButtonDisabled,
          ]}
          onPress={handleInterested}
          disabled={isProcessing}
        >
          <Heart
            size={20}
            color={isInterested ? '#FFFFFF' : '#DC2626'}
            strokeWidth={2}
            fill={isInterested ? '#FFFFFF' : 'none'}
          />
          <Text style={[
            styles.actionButtonText,
            styles.interestedButtonText,
            isInterested && styles.interestedButtonTextActive,
          ]}>
            {isInterested ? 'Interested' : 'Like'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.notInterestedButton,
            isNotInterested && styles.notInterestedButtonActive,
            pressed && styles.actionButtonPressed,
            isProcessing && styles.actionButtonDisabled,
          ]}
          onPress={handleNotInterested}
          disabled={isProcessing}
        >
          <ThumbsDown
            size={20}
            color={isNotInterested ? '#FFFFFF' : '#64748B'}
            strokeWidth={2}
            fill={isNotInterested ? '#FFFFFF' : 'none'}
          />
          <Text style={[
            styles.actionButtonText,
            styles.notInterestedButtonText,
            isNotInterested && styles.notInterestedButtonTextActive,
          ]}>
            {isNotInterested ? 'Hidden' : 'Pass'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.calendarButton,
            pressed && styles.actionButtonPressed,
            isProcessing && styles.actionButtonDisabled,
          ]}
          onPress={handleAddToCalendar}
          disabled={isProcessing}
        >
          <Calendar size={20} color="#1E3A8A" strokeWidth={2} />
          <Text style={[styles.actionButtonText, styles.calendarButtonText]}>
            Add to Calendar
          </Text>
        </Pressable>
      </View>

      {isInterested && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationText}>You'll be reminded about this event</Text>
        </View>
      )}
      
      {attendingConnections.length > 0 && (
        <View style={styles.attendingSection}>
          <View style={styles.attendingHeader}>
            <Users size={16} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.attendingTitle}>
              {attendingConnections.length} {attendingConnections.length === 1 ? 'connection' : 'connections'} going
            </Text>
          </View>
          <View style={styles.attendingList}>
            {attendingConnections.slice(0, 3).map((profile, index) => (
              <View key={profile.id} style={styles.attendingItem}>
                {profile.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.attendingAvatar} />
                ) : (
                  <View style={styles.attendingAvatarPlaceholder}>
                    <Text style={styles.attendingAvatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.attendingName} numberOfLines={1}>{profile.name}</Text>
              </View>
            ))}
            {attendingConnections.length > 3 && (
              <Text style={styles.attendingMore}>+{attendingConnections.length - 3} more</Text>
            )}
          </View>
        </View>
      )}
      
      {savedEvent && (
        <View style={styles.savedBadge}>
          <ArrowRight size={14} color="#059669" strokeWidth={2} />
          <Text style={styles.savedBadgeText}>Tap to view event details</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInterested: {
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  cardNotInterested: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateBox: {
    width: 70,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginVertical: 2,
  },
  dateWeekday: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  eventVenue: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  eventTime: {
    fontSize: 14,
    color: '#64748B',
  },
  distanceText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
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
    borderWidth: 1.5,
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  interestedButton: {
    borderColor: '#DC2626',
    backgroundColor: '#FFFFFF',
  },
  interestedButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  interestedButtonText: {
    color: '#DC2626',
  },
  interestedButtonTextActive: {
    color: '#FFFFFF',
  },
  notInterestedButton: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  notInterestedButtonActive: {
    backgroundColor: '#64748B',
    borderColor: '#64748B',
  },
  notInterestedButtonText: {
    color: '#64748B',
  },
  notInterestedButtonTextActive: {
    color: '#FFFFFF',
  },
  calendarButton: {
    borderColor: '#1E3A8A',
    backgroundColor: '#FFFFFF',
  },
  calendarButtonText: {
    color: '#1E3A8A',
  },
  notificationBadge: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  notificationText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#DC2626',
    textAlign: 'center',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  attendingSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  attendingTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  attendingList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    maxWidth: 150,
  },
  attendingAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  attendingAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendingAvatarText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  attendingName: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#1E3A8A',
    flex: 1,
  },
  attendingMore: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  savedBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#059669',
  },
});
