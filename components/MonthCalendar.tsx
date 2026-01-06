import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { Event } from '@/types';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Copy, Move } from 'lucide-react-native';
import { getMultiYearHolidays } from '@/constants/us-federal-holidays';

interface MonthCalendarProps {
  events: Event[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onEventUpdate?: (eventId: string, updates: Partial<Event>) => Promise<void>;
  onEventDuplicate?: (eventId: string) => Promise<Event | null>;
  onEventDelete?: (eventId: string) => Promise<void>;
}

interface DayCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

export default function MonthCalendar({ events, selectedDate, onDateSelect, onEventUpdate, onEventDuplicate, onEventDelete }: MonthCalendarProps) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || today);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(currentMonth.getMonth());
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'copy'>('move');
  const [isDragging, setIsDragging] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventActionsVisible, setEventActionsVisible] = useState(false);

  const holidays = useMemo(() => {
    const currentYear = currentMonth.getFullYear();
    return getMultiYearHolidays(currentYear - 1, currentYear + 1);
  }, [currentMonth]);

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

  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    const firstDayWeekday = firstDayOfMonth.getDay();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = firstDayWeekday;
    
    const totalCells = Math.ceil((daysInMonth + firstDayWeekday) / 7) * 7;
    const nextMonthDays = totalCells - (daysInMonth + prevMonthDays);
    
    const days: DayCell[] = [];
    
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStart = new Date(year, month, day, 0, 0, 0);
      const dateEnd = new Date(year, month, day, 23, 59, 59);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startISO);
        return eventDate >= dateStart && eventDate <= dateEnd;
      });

      const sortedDayEvents = [...dayEvents].sort((a, b) => a.startISO.localeCompare(b.startISO));

      const dayHolidays = holidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return (
          holidayDate.getDate() === day &&
          holidayDate.getMonth() === month &&
          holidayDate.getFullYear() === year
        );
      });

      const holidayEvents: Event[] = dayHolidays.map(holiday => ({
        id: `holiday_${holiday.date}`,
        userId: 'system',
        title: holiday.name,
        category: 'holiday' as const,
        startISO: holiday.date,
        endISO: holiday.date,
        venue: '',
        address: '',
        color: '#059669',
        tags: [holiday.type],
        source: 'manual' as const,
        notes: holiday.description,
      }));
      
      const isToday = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday,
        events: [...holidayEvents, ...sortedDayEvents],
      });
    }
    
    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }
    
    return days;
  }, [currentMonth, events, today, holidays]);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newMonth);
  };

  const openMonthPicker = () => {
    setPickerYear(currentMonth.getFullYear());
    setPickerMonth(currentMonth.getMonth());
    setShowMonthPicker(true);
  };

  const applyMonthPicker = () => {
    const newMonth = new Date(pickerYear, pickerMonth, 1);
    setCurrentMonth(newMonth);
    setShowMonthPicker(false);
  };

  const closeEventActions = useCallback(() => {
    setEventActionsVisible(false);
    setSelectedEvent(null);
  }, []);

  const openEventActions = useCallback((event: Event) => {
    console.log('[MonthCalendar] openEventActions', { id: event.id, title: event.title });
    setSelectedEvent(event);
    setEventActionsVisible(true);
  }, []);

  const handleEventLongPress = (event: Event) => {
    openEventActions(event);
  };

  const handleDeleteSelectedEvent = useCallback(async () => {
    if (!selectedEvent) return;
    if (!onEventDelete) {
      Alert.alert('Not available', 'Delete is not available here.');
      return;
    }

    try {
      console.log('[MonthCalendar] deleteEvent start', { id: selectedEvent.id });
      await onEventDelete(selectedEvent.id);
      console.log('[MonthCalendar] deleteEvent success', { id: selectedEvent.id });
      closeEventActions();
      Alert.alert('Deleted', 'Event has been deleted');
    } catch (error) {
      console.error('[MonthCalendar] deleteEvent failed', error);
      Alert.alert('Error', 'Failed to delete event. Please try again.');
    }
  }, [closeEventActions, onEventDelete, selectedEvent]);

  const handleDuplicateSelectedEvent = useCallback(async () => {
    if (!selectedEvent) return;
    if (!onEventDuplicate) {
      Alert.alert('Not available', 'Duplicate is not available here.');
      return;
    }

    try {
      console.log('[MonthCalendar] duplicateEvent start', { id: selectedEvent.id });
      await onEventDuplicate(selectedEvent.id);
      console.log('[MonthCalendar] duplicateEvent success', { id: selectedEvent.id });
      closeEventActions();
      Alert.alert('Success', 'Event duplicated');
    } catch (error) {
      console.error('[MonthCalendar] duplicateEvent failed', error);
      Alert.alert('Error', 'Failed to duplicate event.');
    }
  }, [closeEventActions, onEventDuplicate, selectedEvent]);

  const handleEditSelectedEvent = useCallback(() => {
    if (!selectedEvent) return;
    closeEventActions();
    router.push(`/create-event?mode=edit&eventId=${selectedEvent.id}`);
  }, [closeEventActions, router, selectedEvent]);

  const handleOpenSelectedEvent = useCallback(() => {
    if (!selectedEvent) return;
    closeEventActions();
    router.push(`/event/${selectedEvent.id}`);
  }, [closeEventActions, router, selectedEvent]);


  const handleDrop = async (targetDate: Date) => {
    if (!draggedEvent || !onEventUpdate) {
      setDraggedEvent(null);
      setIsDragging(false);
      return;
    }

    try {
      const originalStart = new Date(draggedEvent.startISO);
      const originalEnd = new Date(draggedEvent.endISO);
      const duration = originalEnd.getTime() - originalStart.getTime();

      const newStart = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        originalStart.getHours(),
        originalStart.getMinutes()
      );
      const newEnd = new Date(newStart.getTime() + duration);

      if (dragMode === 'move') {
        await onEventUpdate(draggedEvent.id, {
          startISO: newStart.toISOString(),
          endISO: newEnd.toISOString(),
        });
      } else if (dragMode === 'copy' && onEventDuplicate) {
        const duplicated = await onEventDuplicate(draggedEvent.id);
        if (duplicated && onEventUpdate) {
          await onEventUpdate(duplicated.id, {
            startISO: newStart.toISOString(),
            endISO: newEnd.toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Failed to move/copy event:', error);
      Alert.alert('Error', 'Failed to move/copy event');
    } finally {
      setDraggedEvent(null);
      setIsDragging(false);
    }
  };

  const renderDayCell = (dayCell: DayCell, index: number) => {
    return (
      <Pressable
        key={index}
        style={[
          styles.dayCell,
          dayCell.isToday && styles.todayCell,
          !dayCell.isCurrentMonth && styles.otherMonthCell,
          isDragging && styles.dayCellDragging,
        ]}
        onPress={() => {
          if (isDragging && draggedEvent) {
            handleDrop(dayCell.date);
          } else if (dayCell.isCurrentMonth && onDateSelect) {
            onDateSelect(dayCell.date);
          }
        }}
      >
        <View style={styles.dayHeader}>
          <Text
            style={[
              styles.dayNumber,
              !dayCell.isCurrentMonth && styles.otherMonthText,
              dayCell.isToday && styles.todayText,
            ]}
          >
            {dayCell.dayNumber}
          </Text>
        </View>
        
        <View style={styles.eventsContainer}>
          {dayCell.events.slice(0, 3).map((event, idx) => {
            const color = event.color || getCategoryColor(event.category);
            const eventTime = new Date(event.startISO).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
            
            const isBeingDragged = draggedEvent?.id === event.id;
            
            const isHoliday = event.id.startsWith('holiday_');

            return (
              <Pressable
                key={event.id}
                style={[
                  styles.eventDot,
                  { backgroundColor: color },
                  isBeingDragged && styles.eventDotDragging,
                ]}
                onPress={() => {
                  if (!isDragging) {
                    if (isHoliday) {
                      const holidayDate = new Date(event.startISO);
                      router.push(`/create-event?mode=create&holidayName=${encodeURIComponent(event.title)}&holidayDate=${holidayDate.toISOString()}`);
                    } else {
                      openEventActions(event);
                    }
                  }
                }}
                onLongPress={() => {
                  if (!isHoliday) {
                    handleEventLongPress(event);
                  }
                }}
                delayLongPress={500}
              >
                {!isHoliday && (
                  <Text style={styles.eventTime} numberOfLines={1}>
                    {eventTime}
                  </Text>
                )}
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>

              </Pressable>
            );
          })}
          
          {dayCell.events.length > 3 && (
            <View style={styles.moreIndicator}>
              <Text style={styles.moreText}>+{dayCell.events.length - 3} more</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
          <ChevronLeft size={24} color="#1E3A8A" strokeWidth={2} />
        </Pressable>
        
        <Pressable onPress={openMonthPicker} style={styles.monthNameButton}>
          <Text style={styles.monthName}>{monthName}</Text>
          <CalendarIcon size={18} color="#64748B" strokeWidth={2} />
        </Pressable>
        
        <Pressable onPress={goToNextMonth} style={styles.navButton}>
          <ChevronRight size={24} color="#1E3A8A" strokeWidth={2} />
        </Pressable>
      </View>

      {isDragging && draggedEvent && (
        <View style={styles.dragBanner}>
          <View style={styles.dragBannerIcon}>
            {dragMode === 'move' ? (
              <Move size={16} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <Copy size={16} color="#FFFFFF" strokeWidth={2} />
            )}
          </View>
          <Text style={styles.dragBannerText}>
            {dragMode === 'move' ? 'Moving' : 'Copying'} &quot;{draggedEvent.title}&quot; - Tap a day
          </Text>
          <Pressable
            onPress={() => {
              setDraggedEvent(null);
              setIsDragging(false);
            }}
            style={styles.cancelDragButton}
          >
            <Text style={styles.cancelDragText}>Cancel</Text>
          </Pressable>
        </View>
      )}
      
      <View style={styles.weekdaysHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.calendarGrid}
        showsVerticalScrollIndicator={false}
      >
        {calendarData.map((dayCell, index) => renderDayCell(dayCell, index))}
      </ScrollView>

      <Modal
        visible={eventActionsVisible}
        transparent
        animationType="fade"
        onRequestClose={closeEventActions}
      >
        <Pressable style={styles.eventActionsOverlay} onPress={closeEventActions} testID="monthCalendarEventActionsOverlay">
          <Pressable style={styles.eventActionsCard} onPress={(e) => e.stopPropagation()} testID="monthCalendarEventActionsCard">
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
              <Pressable style={styles.eventActionsPrimaryButton} onPress={handleOpenSelectedEvent} testID="monthCalendarOpenEventButton">
                <Text style={styles.eventActionsPrimaryText}>Open</Text>
              </Pressable>
              <Pressable style={styles.eventActionsSecondaryButton} onPress={handleEditSelectedEvent} testID="monthCalendarEditEventButton">
                <Text style={styles.eventActionsSecondaryText}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.eventActionsButtonsRow}>
              <Pressable style={styles.eventActionsSecondaryButton} onPress={handleDuplicateSelectedEvent} testID="monthCalendarDuplicateEventButton">
                <Text style={styles.eventActionsSecondaryText}>Duplicate</Text>
              </Pressable>
              <Pressable
                style={styles.eventActionsSecondaryButton}
                onPress={() => {
                  if (!selectedEvent) return;
                  setDraggedEvent(selectedEvent);
                  setDragMode('move');
                  setIsDragging(true);
                  closeEventActions();
                }}
                testID="monthCalendarMoveEventButton"
              >
                <Text style={styles.eventActionsSecondaryText}>Move</Text>
              </Pressable>
            </View>

            <View style={styles.eventActionsButtonsRow}>
              <Pressable
                style={styles.eventActionsSecondaryButton}
                onPress={() => {
                  if (!selectedEvent) return;
                  setDraggedEvent(selectedEvent);
                  setDragMode('copy');
                  setIsDragging(true);
                  closeEventActions();
                }}
                testID="monthCalendarCopyEventButton"
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
                testID="monthCalendarDeleteEventButton"
              >
                <Text style={styles.eventActionsDestructiveText}>Delete</Text>
              </Pressable>
            </View>

            <Pressable style={styles.eventActionsCancelButton} onPress={closeEventActions} testID="monthCalendarCancelEventActionsButton">
              <Text style={styles.eventActionsCancelText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowMonthPicker(false)}
        >
          <Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Select Month & Year</Text>
            
            <View style={styles.yearPicker}>
              <Pressable
                style={styles.yearButton}
                onPress={() => setPickerYear(pickerYear - 1)}
              >
                <ChevronLeft size={20} color="#1E3A8A" strokeWidth={2} />
              </Pressable>
              <TextInput
                style={styles.yearInput}
                value={pickerYear.toString()}
                onChangeText={(text) => {
                  const year = parseInt(text, 10);
                  if (!isNaN(year) && year >= 1900 && year <= 2100) {
                    setPickerYear(year);
                  }
                }}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Pressable
                style={styles.yearButton}
                onPress={() => setPickerYear(pickerYear + 1)}
              >
                <ChevronRight size={20} color="#1E3A8A" strokeWidth={2} />
              </Pressable>
            </View>

            <View style={styles.monthGrid}>
              {[
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
              ].map((monthName, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.monthButton,
                    pickerMonth === idx && styles.monthButtonActive,
                  ]}
                  onPress={() => setPickerMonth(idx)}
                >
                  <Text
                    style={[
                      styles.monthButtonText,
                      pickerMonth === idx && styles.monthButtonTextActive,
                    ]}
                  >
                    {monthName}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.pickerActions}>
              <Pressable
                style={styles.pickerCancelButton}
                onPress={() => setShowMonthPicker(false)}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.pickerApplyButton}
                onPress={applyMonthPicker}
              >
                <Text style={styles.pickerApplyText}>Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontWeight: '800',
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
    fontWeight: '800',
  },
  eventActionsSecondaryButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  eventActionsSecondaryText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  eventActionsDestructiveButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  eventActionsDestructiveText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '800',
  },
  eventActionsCancelButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  eventActionsCancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  monthName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  weekdaysHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  weekdayCell: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
  },
  scrollView: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
  },
  dayCell: {
    width: '14.28%',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    backgroundColor: '#FFFFFF',
  },
  todayCell: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  otherMonthCell: {
    backgroundColor: '#FFFFFF',
  },
  dayHeader: {
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    textAlign: 'center',
  },
  todayText: {
    color: '#1E3A8A',
    fontWeight: '700' as const,
  },
  otherMonthText: {
    color: '#1E293B',
  },
  eventsContainer: {
    gap: 3,
    marginTop: 2,
  },
  eventDot: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 8,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  eventTitle: {
    fontSize: 9,
    fontWeight: '500' as const,
    color: '#FFFFFF',
  },
  moreIndicator: {
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  moreText: {
    fontSize: 8,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  monthNameButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 12,
  },
  dragBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  dragBannerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  cancelDragButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelDragText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  dayCellDragging: {
    borderWidth: 2,
    borderColor: '#1E3A8A',
    borderStyle: 'dashed',
  },
  eventDotDragging: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  yearPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 16,
  },
  yearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  yearInput: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    textAlign: 'center',
    minWidth: 80,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  monthButton: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  monthButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  monthButtonTextActive: {
    color: '#FFFFFF',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  pickerApplyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  pickerApplyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
