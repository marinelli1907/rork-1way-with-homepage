import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  PanResponderGestureState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Copy, Move, Car } from 'lucide-react-native';

import { Event } from '@/types';

const HOUR_ROW_HEIGHT = 64;
const DAY_MINUTES = 24 * 60;
const SNAP_MINUTES = 15;

interface HourlyAgendaProps {
  events: Event[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEventUpdate?: (eventId: string, updates: Partial<Event>) => Promise<void>;
  onEventDuplicate?: (eventId: string) => Promise<Event | null>;
  onEventDelete?: (eventId: string) => Promise<void>;
}

type DragMode = 'move' | 'copy';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function minutesSinceDayStart(iso: string, day: Date): number {
  const dt = new Date(iso);
  const base = startOfDay(day);
  return Math.floor((dt.getTime() - base.getTime()) / 60000);
}

function formatHourLabel(hour24: number): string {
  const h = hour24 % 24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${ampm}`;
}

function getCategoryColor(category: Event['category']): string {
  const colors: Record<string, string> = {
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
}

export default function HourlyAgenda({
  events,
  selectedDate,
  onDateChange,
  onEventUpdate,
  onEventDuplicate,
  onEventDelete,
}: HourlyAgendaProps) {
  const router = useRouter();

  const scrollRef = useRef<ScrollView | null>(null);
  const scrollYRef = useRef<number>(0);

  const [containerPageY, setContainerPageY] = useState<number>(0);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventActionsVisible, setEventActionsVisible] = useState(false);

  const [dragMode, setDragMode] = useState<DragMode>('move');
  const [draggingEvent, setDraggingEvent] = useState<Event | null>(null);
  const [dragMinutes, setDragMinutes] = useState<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const dragOpacity = useRef(new Animated.Value(0)).current;

  const dayStart = useMemo(() => startOfDay(selectedDate), [selectedDate]);
  const dayEnd = useMemo(() => endOfDay(selectedDate), [selectedDate]);

  const dayEvents = useMemo(() => {
    const startMs = dayStart.getTime();
    const endMs = dayEnd.getTime();

    const filtered = events.filter((e) => {
      const s = new Date(e.startISO).getTime();
      const en = new Date(e.endISO).getTime();
      return s <= endMs && en >= startMs;
    });

    return filtered.sort((a, b) => a.startISO.localeCompare(b.startISO));
  }, [dayEnd, dayStart, events]);

  const closeEventActions = useCallback(() => {
    setEventActionsVisible(false);
    setSelectedEvent(null);
  }, []);

  const openEventActions = useCallback((event: Event) => {
    console.log('[HourlyAgenda] openEventActions', { id: event.id, title: event.title });
    setSelectedEvent(event);
    setEventActionsVisible(true);
  }, []);

  const handleOpenSelectedEvent = useCallback(() => {
    if (!selectedEvent) return;
    closeEventActions();
    router.push(`/event/${selectedEvent.id}`);
  }, [closeEventActions, router, selectedEvent]);

  const handleEditSelectedEvent = useCallback(() => {
    if (!selectedEvent) return;
    closeEventActions();
    router.push(`/create-event?mode=edit&eventId=${selectedEvent.id}`);
  }, [closeEventActions, router, selectedEvent]);

  const handleDuplicateSelectedEvent = useCallback(async () => {
    if (!selectedEvent) return;
    if (!onEventDuplicate) {
      Alert.alert('Not available', 'Duplicate is not available here.');
      return;
    }

    try {
      console.log('[HourlyAgenda] duplicateEvent start', { id: selectedEvent.id });
      await onEventDuplicate(selectedEvent.id);
      console.log('[HourlyAgenda] duplicateEvent success', { id: selectedEvent.id });
      closeEventActions();
      Alert.alert('Success', 'Event duplicated');
    } catch (error) {
      console.error('[HourlyAgenda] duplicateEvent failed', error);
      Alert.alert('Error', 'Failed to duplicate event.');
    }
  }, [closeEventActions, onEventDuplicate, selectedEvent]);

  const handleDeleteSelectedEvent = useCallback(async () => {
    if (!selectedEvent) return;
    if (!onEventDelete) {
      Alert.alert('Not available', 'Delete is not available here.');
      return;
    }

    try {
      console.log('[HourlyAgenda] deleteEvent start', { id: selectedEvent.id });
      await onEventDelete(selectedEvent.id);
      console.log('[HourlyAgenda] deleteEvent success', { id: selectedEvent.id });
      closeEventActions();
      Alert.alert('Deleted', 'Event has been deleted');
    } catch (error) {
      console.error('[HourlyAgenda] deleteEvent failed', error);
      Alert.alert('Error', 'Failed to delete event. Please try again.');
    }
  }, [closeEventActions, onEventDelete, selectedEvent]);

  const goToPrevDay = useCallback(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  }, [onDateChange, selectedDate]);

  const goToNextDay = useCallback(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  }, [onDateChange, selectedDate]);

  const label = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  const beginDrag = useCallback(
    (event: Event, mode: DragMode) => {
      if (!onEventUpdate) {
        Alert.alert('Not available', 'Rescheduling is not available here.');
        return;
      }
      console.log('[HourlyAgenda] beginDrag', { id: event.id, mode });
      setDragMode(mode);
      setDraggingEvent(event);
      setDragMinutes(minutesSinceDayStart(event.startISO, selectedDate));
      dragOpacity.setValue(1);
    },
    [dragOpacity, onEventUpdate, selectedDate]
  );

  const endDrag = useCallback(
    async (gesture: PanResponderGestureState) => {
      if (!draggingEvent || dragMinutes == null) {
        setDraggingEvent(null);
        setDragMinutes(null);
        dragOpacity.setValue(0);
        return;
      }

      const originalStart = new Date(draggingEvent.startISO);
      const originalEnd = new Date(draggingEvent.endISO);
      const durationMs = Math.max(0, originalEnd.getTime() - originalStart.getTime());

      const minutePerPx = 60 / HOUR_ROW_HEIGHT;
      const yInTimeline = gesture.moveY - containerPageY + scrollYRef.current;
      const rawMinutes = yInTimeline * minutePerPx;

      const durationMin = Math.max(15, Math.round(durationMs / 60000));
      const maxStart = DAY_MINUTES - durationMin;
      const snapped = clamp(roundToStep(rawMinutes, SNAP_MINUTES), 0, maxStart);

      const newStart = new Date(dayStart.getTime() + snapped * 60000);
      const newEnd = new Date(newStart.getTime() + durationMs);

      console.log('[HourlyAgenda] endDrag', {
        id: draggingEvent.id,
        dragMode,
        snapped,
        newStartISO: newStart.toISOString(),
      });

      try {
        if (dragMode === 'move') {
          if (!onEventUpdate) throw new Error('update not available');
          await onEventUpdate(draggingEvent.id, {
            startISO: newStart.toISOString(),
            endISO: newEnd.toISOString(),
          });
        } else {
          if (!onEventDuplicate || !onEventUpdate) throw new Error('copy not available');
          const duplicated = await onEventDuplicate(draggingEvent.id);
          if (duplicated) {
            await onEventUpdate(duplicated.id, {
              startISO: newStart.toISOString(),
              endISO: newEnd.toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('[HourlyAgenda] reschedule failed', error);
        Alert.alert('Error', 'Failed to reschedule event');
      } finally {
        setDraggingEvent(null);
        setDragMinutes(null);
        dragOpacity.setValue(0);
      }
    },
    [containerPageY, dayStart, dragMinutes, dragMode, dragOpacity, draggingEvent, onEventDuplicate, onEventUpdate]
  );

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => !!draggingEvent,
      onPanResponderMove: (_, gesture) => {
        if (!draggingEvent) return;
        const minutePerPx = 60 / HOUR_ROW_HEIGHT;
        const yInTimeline = gesture.moveY - containerPageY + scrollYRef.current;
        const rawMinutes = yInTimeline * minutePerPx;
        const originalStart = new Date(draggingEvent.startISO);
        const originalEnd = new Date(draggingEvent.endISO);
        const durationMin = Math.max(15, Math.round((originalEnd.getTime() - originalStart.getTime()) / 60000));
        const maxStart = DAY_MINUTES - durationMin;
        const snapped = clamp(roundToStep(rawMinutes, SNAP_MINUTES), 0, maxStart);
        setDragMinutes(snapped);
        dragY.setValue((snapped / 60) * HOUR_ROW_HEIGHT);
      },
      onPanResponderRelease: (_, gesture) => {
        endDrag(gesture);
      },
      onPanResponderTerminate: (_, gesture) => {
        endDrag(gesture);
      },
    });
  }, [containerPageY, dragY, draggingEvent, endDrag]);

  useEffect(() => {
    if (draggingEvent && dragMinutes != null) {
      dragY.setValue((dragMinutes / 60) * HOUR_ROW_HEIGHT);
    }
  }, [dragMinutes, dragY, draggingEvent]);


  const updateContainerPageY = useCallback((ref: View | null) => {
    if (!ref) return;
    try {
      ref.measureInWindow((_x, y) => {
        setContainerPageY(y);
      });
    } catch (error) {
      console.warn('[HourlyAgenda] measureInWindow failed', error);
    }
  }, []);

  const hourLines = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  const renderEventBlock = useCallback(
    (event: Event) => {
      const color = event.color || getCategoryColor(event.category);
      const eventStart = new Date(event.startISO);

      const startMin = clamp(minutesSinceDayStart(event.startISO, selectedDate), -DAY_MINUTES, DAY_MINUTES * 2);
      const endMinRaw = clamp(minutesSinceDayStart(event.endISO, selectedDate), -DAY_MINUTES, DAY_MINUTES * 2);

      const clippedStart = clamp(startMin, 0, DAY_MINUTES);
      const clippedEnd = clamp(endMinRaw, 0, DAY_MINUTES);
      const durationMin = Math.max(15, clippedEnd - clippedStart);

      const top = (clippedStart / 60) * HOUR_ROW_HEIGHT;
      const height = (durationMin / 60) * HOUR_ROW_HEIGHT;

      const timeLabel = eventStart.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const isDragging = draggingEvent?.id === event.id;

      return (
        <View key={event.id} style={[styles.eventBlockWrap, { top, height }]} pointerEvents="box-none">
          <Pressable
            style={({ pressed }) => [
              styles.eventBlock,
              { backgroundColor: `${color}1A`, borderColor: `${color}55` },
              pressed && styles.eventBlockPressed,
              isDragging && styles.eventBlockHidden,
            ]}
            onPress={() => openEventActions(event)}
            onLongPress={() => {
              closeEventActions();
              beginDrag(event, 'move');
            }}
            delayLongPress={350}
            testID={`hourlyAgendaEvent_${event.id}`}
          >
            <View style={[styles.eventStripe, { backgroundColor: color }]} />
            <View style={styles.eventBlockContent}>
              <View style={styles.eventBlockTopRow}>
                <Text style={styles.eventTime} numberOfLines={1}>
                  {timeLabel}
                </Text>
                {event.rides?.some((r) => r.status !== 'cancelled') ? (
                  <View style={[styles.ridePill, { backgroundColor: color }]}>
                    <Car size={12} color="#FFFFFF" strokeWidth={2} />
                  </View>
                ) : null}
              </View>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.title}
              </Text>
              {!!event.venue && (
                <Text style={styles.eventVenue} numberOfLines={1}>
                  {event.venue}
                </Text>
              )}
            </View>
          </Pressable>
        </View>
      );
    },
    [beginDrag, closeEventActions, draggingEvent?.id, openEventActions, selectedDate]
  );

  const ghostLabel = useMemo(() => {
    if (!draggingEvent || dragMinutes == null) return '';
    const dt = new Date(dayStart.getTime() + dragMinutes * 60000);
    const time = dt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dragMode === 'copy' ? 'Copy' : 'Move'} • ${time}`;
  }, [dayStart, dragMinutes, dragMode, draggingEvent]);

  return (
    <View style={styles.container}>
      <View style={styles.dayHeader}>
        <Pressable onPress={goToPrevDay} style={styles.dayNavBtn} testID="hourlyAgendaPrevDay">
          <ChevronLeft size={22} color="#1E3A8A" strokeWidth={2} />
        </Pressable>
        <View style={styles.dayHeaderCenter}>
          <Text style={styles.dayHeaderTitle}>{label}</Text>
          <Text style={styles.dayHeaderSubtitle}>Long-press an event to drag</Text>
        </View>
        <Pressable onPress={goToNextDay} style={styles.dayNavBtn} testID="hourlyAgendaNextDay">
          <ChevronRight size={22} color="#1E3A8A" strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.timelineOuter} ref={updateContainerPageY} {...panResponder.panHandlers} testID="hourlyAgendaTimeline">
        <ScrollView
          ref={(r) => {
            scrollRef.current = r;
          }}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <View style={styles.timeline}>
            {hourLines.map((h) => (
              <View key={h} style={styles.hourRow}>
                <View style={styles.hourLabelCol}>
                  <Text style={styles.hourLabel}>{formatHourLabel(h)}</Text>
                </View>
                <View style={styles.hourLineCol}>
                  <View style={styles.hourLine} />
                  {h % 2 === 1 ? <View style={styles.halfHourLine} /> : null}
                </View>
              </View>
            ))}

            <View style={styles.eventsLayer} pointerEvents="box-none">
              {dayEvents.map(renderEventBlock)}
            </View>

            {draggingEvent && dragMinutes != null ? (
              <Animated.View
                style={[
                  styles.ghostWrap,
                  {
                    opacity: dragOpacity,
                    transform: [{ translateY: dragY }],
                  },
                ]}
                pointerEvents="none"
              >
                <View style={styles.ghostPill}>
                  <Text style={styles.ghostPillText} numberOfLines={1}>
                    {ghostLabel}
                  </Text>
                </View>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <Animated.View
        pointerEvents={draggingEvent ? 'auto' : 'none'}
        style={[styles.dragFooter, { opacity: dragOpacity }]}
      >
        <View style={styles.dragFooterInner}>
          <View style={styles.dragFooterIcon}>
            {dragMode === 'move' ? (
              <Move size={16} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <Copy size={16} color="#FFFFFF" strokeWidth={2} />
            )}
          </View>
          <Text style={styles.dragFooterText} numberOfLines={1}>
            Drag to a new time — release to {dragMode}
          </Text>
          <Pressable
            onPress={() => {
              console.log('[HourlyAgenda] cancel drag');
              setDraggingEvent(null);
              setDragMinutes(null);
              dragOpacity.setValue(0);
            }}
            style={styles.dragCancelBtn}
            testID="hourlyAgendaCancelDrag"
          >
            <Text style={styles.dragCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.dragModePill,
          { opacity: dragOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
        ]}
        pointerEvents={draggingEvent ? 'auto' : 'none'}
      >
        <Pressable
          style={({ pressed }) => [styles.dragModeButton, pressed && styles.dragModeButtonPressed]}
          onPress={() => {
            if (!draggingEvent) return;
            setDragMode((m) => (m === 'move' ? 'copy' : 'move'));
          }}
          testID="hourlyAgendaToggleDragMode"
        >
          <Text style={styles.dragModeButtonText}>{dragMode === 'move' ? 'Move' : 'Copy'}</Text>
        </Pressable>
      </Animated.View>

      {eventActionsVisible ? (
        <View style={styles.modalRoot} pointerEvents="box-none">
          <Pressable style={styles.eventActionsOverlay} onPress={closeEventActions} testID="hourlyAgendaEventActionsOverlay">
            <Pressable style={styles.eventActionsCard} onPress={(e) => e.stopPropagation()} testID="hourlyAgendaEventActionsCard">
              <Text style={styles.eventActionsTitle} numberOfLines={2}>
                {selectedEvent?.title ?? ''}
              </Text>
              <Text style={styles.eventActionsMeta} numberOfLines={1}>
                {selectedEvent
                  ? new Date(selectedEvent.startISO).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : ''}
              </Text>
              {!!selectedEvent?.venue && <Text style={styles.eventActionsMeta} numberOfLines={1}>{selectedEvent.venue}</Text>}

              <View style={styles.eventActionsButtonsRow}>
                <Pressable style={styles.eventActionsPrimaryButton} onPress={handleOpenSelectedEvent} testID="hourlyAgendaOpenEventButton">
                  <Text style={styles.eventActionsPrimaryText}>Open</Text>
                </Pressable>
                <Pressable style={styles.eventActionsSecondaryButton} onPress={handleEditSelectedEvent} testID="hourlyAgendaEditEventButton">
                  <Text style={styles.eventActionsSecondaryText}>Edit</Text>
                </Pressable>
              </View>

              <View style={styles.eventActionsButtonsRow}>
                <Pressable style={styles.eventActionsSecondaryButton} onPress={handleDuplicateSelectedEvent} testID="hourlyAgendaDuplicateEventButton">
                  <Text style={styles.eventActionsSecondaryText}>Duplicate</Text>
                </Pressable>
                <Pressable
                  style={styles.eventActionsSecondaryButton}
                  onPress={() => {
                    if (!selectedEvent) return;
                    closeEventActions();
                    beginDrag(selectedEvent, 'move');
                  }}
                  testID="hourlyAgendaMoveEventButton"
                >
                  <Text style={styles.eventActionsSecondaryText}>Move</Text>
                </Pressable>
              </View>

              <View style={styles.eventActionsButtonsRow}>
                <Pressable
                  style={styles.eventActionsSecondaryButton}
                  onPress={() => {
                    if (!selectedEvent) return;
                    closeEventActions();
                    beginDrag(selectedEvent, 'copy');
                  }}
                  testID="hourlyAgendaCopyEventButton"
                >
                  <Text style={styles.eventActionsSecondaryText}>Copy</Text>
                </Pressable>
                <Pressable
                  style={styles.eventActionsDestructiveButton}
                  onPress={() => {
                    if (!selectedEvent) return;
                    Alert.alert('Delete Event', `Are you sure you want to delete "${selectedEvent.title}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: handleDeleteSelectedEvent },
                    ]);
                  }}
                  testID="hourlyAgendaDeleteEventButton"
                >
                  <Text style={styles.eventActionsDestructiveText}>Delete</Text>
                </Pressable>
              </View>

              <Pressable style={styles.eventActionsCancelButton} onPress={closeEventActions} testID="hourlyAgendaCancelEventActionsButton">
                <Text style={styles.eventActionsCancelText}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  dayNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  dayHeaderTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#0F172A',
  },
  dayHeaderSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  timelineOuter: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  timeline: {
    height: HOUR_ROW_HEIGHT * 24,
    paddingTop: 4,
    paddingBottom: 24,
  },
  hourRow: {
    height: HOUR_ROW_HEIGHT,
    flexDirection: 'row',
  },
  hourLabelCol: {
    width: 74,
    paddingTop: 8,
    paddingRight: 10,
    alignItems: 'flex-end',
  },
  hourLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#334155',
  },
  hourLineCol: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingRight: 14,
  },
  hourLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 16,
  },
  halfHourLine: {
    position: 'absolute',
    left: 0,
    right: 14,
    top: HOUR_ROW_HEIGHT / 2 + 16,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  eventsLayer: {
    position: 'absolute',
    left: 74,
    right: 12,
    top: 0,
    bottom: 0,
  },
  eventBlockWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingRight: 6,
  },
  eventBlock: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  eventBlockPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  eventBlockHidden: {
    opacity: 0.2,
  },
  eventStripe: {
    width: 6,
  },
  eventBlockContent: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  eventBlockTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#0F172A',
  },
  ridePill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
  },
  eventTitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#0F172A',
  },
  eventVenue: {
    marginTop: 2,
    fontSize: 12,
    color: '#475569',
  },

  ghostWrap: {
    position: 'absolute',
    left: 74,
    right: 12,
    top: 0,
    height: 0,
  },
  ghostPill: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
  },
  ghostPillText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },

  dragFooter: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
  },
  dragFooterInner: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dragFooterIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragFooterText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  dragCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dragCancelText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },

  dragModePill: {
    position: 'absolute',
    right: 12,
    bottom: 72,
  },
  dragModeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  dragModeButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  dragModeButtonText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#0F172A',
  },

  modalRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  eventActionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  eventActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  eventActionsTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#0F172A',
    marginBottom: 6,
  },
  eventActionsMeta: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  eventActionsButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  eventActionsPrimaryButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  eventActionsPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  eventActionsSecondaryButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventActionsSecondaryText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  eventActionsDestructiveButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  eventActionsDestructiveText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '800' as const,
  },
  eventActionsCancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  eventActionsCancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
