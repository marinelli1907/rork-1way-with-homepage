import { useRouter } from 'expo-router';
import { Calendar, Plus, Edit, Copy, Trash2, CheckSquare, Square, Download, List, History } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEvents } from '@/providers/EventsProvider';
import { Event } from '@/types';
import MonthCalendar from '@/components/MonthCalendar';


const SWIPE_THRESHOLD = 80;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MyEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    upcomingEvents,
    isLoading,
    deleteEvent,
    deleteEvents,
    importFromIOSCalendar,
    updateEvent,
    duplicateEvent,
  } = useEvents();

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [swipeAnimations] = useState<Record<string, Animated.Value>>({});
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  const getSwipeAnimation = (id: string) => {
    if (!swipeAnimations[id]) {
      swipeAnimations[id] = new Animated.Value(0);
    }
    return swipeAnimations[id];
  };

  const handleSwipeStart = (id: string) => {
    setSwipedId(id);
  };

  const handleSwipeDelete = (id: string, title: string) => {
    Alert.alert('Delete Event', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteEvent(id);
          setSwipedId(null);
        },
      },
    ]);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  const toggleEventSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    
    Alert.alert(
      'Delete Events',
      `Are you sure you want to delete ${selectedIds.size} event${selectedIds.size === 1 ? '' : 's'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEvents(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleImportFromCalendar = async () => {
    setIsImporting(true);
    try {
      const count = await importFromIOSCalendar();
      if (count > 0) {
        Alert.alert(
          'Import Successful',
          `Imported ${count} event${count === 1 ? '' : 's'} from your iOS calendar.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No New Events',
          'No new events found to import or all events have already been imported.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      Alert.alert(
        'Import Failed',
        'Failed to import events from your calendar. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsImporting(false);
    }
  };

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
    const swipeAnim = getSwipeAnimation(event.id);
    const isSelected = selectedIds.has(event.id);

    if (isSelectionMode) {
      return (
        <Pressable
          key={event.id}
          style={[styles.eventCard, isSelected && styles.eventCardSelected]}
          onPress={() => toggleEventSelection(event.id)}
        >
          <Pressable
            style={styles.checkbox}
            onPress={() => toggleEventSelection(event.id)}
          >
            {isSelected ? (
              <CheckSquare size={24} color="#1E3A8A" strokeWidth={2} />
            ) : (
              <Square size={24} color="#94A3B8" strokeWidth={2} />
            )}
          </Pressable>

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
    }

    return (
      <View key={event.id} style={styles.eventCardContainer}>
        <Animated.View
          style={[
            styles.actionsBackground,
            {
              opacity: swipeAnim.interpolate({
                inputRange: [-SWIPE_THRESHOLD * 3, 0],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              router.push(`/create-event?mode=edit&eventId=${event.id}`);
              setSwipedId(null);
            }}
          >
            <Edit size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              router.push(`/create-event?mode=duplicate&eventId=${event.id}`);
              setSwipedId(null);
            }}
          >
            <Copy size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.actionButtonText}>Duplicate</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleSwipeDelete(event.id, event.title)}
          >
            <Trash2 size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.actionButtonText}>Delete</Text>
          </Pressable>
        </Animated.View>

        <Animated.View
          style={[
            styles.eventCardWrapper,
            {
              transform: [
                {
                  translateX: swipeAnim,
                },
              ],
            },
          ]}
          {...{
            onTouchStart: () => handleSwipeStart(event.id),
            onTouchMove: (e: any) => {
              if (swipedId === event.id) {
                const deltaX = Math.min(0, e.nativeEvent.pageX - SCREEN_WIDTH + 100);
                swipeAnim.setValue(Math.max(deltaX, -SWIPE_THRESHOLD * 3));
              }
            },
            onTouchEnd: () => {
              if (swipedId === event.id) {
                const currentValue = (swipeAnim as any)._value;
                if (currentValue < -SWIPE_THRESHOLD * 2) {
                  Animated.spring(swipeAnim, {
                    toValue: -SWIPE_THRESHOLD * 3,
                    useNativeDriver: true,
                  }).start();
                } else {
                  Animated.spring(swipeAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                  }).start();
                  setSwipedId(null);
                }
              }
            },
          }}
        >
          <Pressable
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
        </Animated.View>
      </View>
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
      <View style={[styles.toolbarContainer, { paddingTop: insets.top + 12 }]}>
        <Pressable
          style={styles.toolbarButton}
          onPress={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
        >
          {viewMode === 'list' ? (
            <Calendar size={22} color="#1E3A8A" strokeWidth={2} />
          ) : (
            <List size={22} color="#1E3A8A" strokeWidth={2} />
          )}
          <Text style={styles.toolbarButtonText}>
            {viewMode === 'list' ? 'Calendar' : 'List'}
          </Text>
        </Pressable>
        {viewMode === 'list' && (
          <Pressable
            style={styles.toolbarButton}
            onPress={toggleSelectionMode}
          >
            <CheckSquare size={22} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.toolbarButtonText}>
              {isSelectionMode ? 'Cancel' : 'Select'}
            </Text>
          </Pressable>
        )}
        <Pressable
          style={styles.toolbarButton}
          onPress={() => router.push('/past')}
        >
          <History size={22} color="#1E3A8A" strokeWidth={2} />
          <Text style={styles.toolbarButtonText}>Past</Text>
        </Pressable>
      </View>

      {isSelectionMode && (
        <View style={styles.selectionBar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>
              {selectedIds.size} selected
            </Text>
          </View>
          {selectedIds.size > 0 && (
            <Pressable
              style={styles.bulkDeleteButton}
              onPress={handleBulkDelete}
            >
              <Trash2 size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.bulkDeleteText}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}

      {upcomingEvents.length === 0 ? (
        <View style={styles.importContainer}>
          <Calendar size={48} color="#1E3A8A" strokeWidth={1.5} />
          <Text style={styles.importTitle}>No upcoming events</Text>
          <Text style={styles.importSubtitle}>
            Add your first event or browse nearby events
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.importButton,
              pressed && styles.importButtonPressed,
              isImporting && styles.importButtonDisabled,
            ]}
            onPress={handleImportFromCalendar}
            disabled={isImporting}
          >
            <Download size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.importButtonText}>
              {isImporting ? 'Importing...' : 'Import from iOS Calendar'}
            </Text>
          </Pressable>
        </View>
      ) : viewMode === 'calendar' ? (
        <MonthCalendar 
          events={upcomingEvents} 
          onEventUpdate={updateEvent}
          onEventDuplicate={duplicateEvent}
          onEventDelete={deleteEvent}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {upcomingEvents.map(renderEvent)}
        </ScrollView>
      )}

      <View style={styles.fab}>
        <Pressable
          style={({ pressed }) => [
            styles.fabButton,
            pressed && styles.fabButtonPressed,
          ]}
          onPress={() => router.push('/create-event')}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>
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
  toolbarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bulkDeleteText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  importContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  importTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  importSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  importButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  eventCardContainer: {
    marginBottom: 12,
  },
  actionsBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_THRESHOLD * 3,
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  eventCardWrapper: {
    backgroundColor: 'transparent',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventCardSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  checkbox: {
    marginRight: 12,
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
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E31937',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
