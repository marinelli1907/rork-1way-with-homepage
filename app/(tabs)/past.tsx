import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useEvents } from '@/providers/EventsProvider';
import { Event } from '@/types';

export default function PastEventsScreen() {
  const router = useRouter();
  const { pastEvents, isLoading } = useEvents();

  const pastEventsWithRides = pastEvents.filter(event => 
    event.rides && event.rides.length > 0
  );

  const formatEventDate = (isoString: string) => {
    const date = new Date(isoString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { month, day, time };
  };

  const getCategoryColor = (category: Event['category']) => {
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

  const renderEvent = (event: Event) => {
    const { month, day, time } = formatEventDate(event.startISO);
    const color = event.color || getCategoryColor(event.category);

    return (
      <Pressable
        key={event.id}
        style={({ pressed }) => [
          styles.eventCard,
          pressed && styles.eventCardPressed,
        ]}
        onPress={() => router.push(`/event/${event.id}`)}
      >
        <View style={[styles.dateBox, { backgroundColor: color }]}>
          <Text style={styles.dateMonth}>{month.toUpperCase()}</Text>
          <Text style={styles.dateDay}>{day}</Text>
        </View>

        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventVenue}>{event.venue}</Text>
          <Text style={styles.eventTime}>{time}</Text>
        </View>

        <View style={[styles.categoryDot, { backgroundColor: color }]} />
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.push('/my-events')}
        >
          <ChevronLeft size={28} color="#1E3A8A" strokeWidth={2} />
          <Text style={styles.backText}>Calendar</Text>
        </Pressable>
        <Image
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/47vdru1syrb0iukk596rl' }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {pastEventsWithRides.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No past events with rides</Text>
          <Text style={styles.emptyStateSubtext}>
            Events you ordered rides to will appear here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {pastEventsWithRides.map(renderEvent)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  logo: {
    width: 240,
    height: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  dateBox: {
    width: 60,
    height: 60,
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
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 13,
    color: '#94A3B8',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
