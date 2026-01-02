import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { MapPin, Tag, Type, Clock } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEvents } from '@/providers/EventsProvider';
import { EventCategory, EventFormMode } from '@/types';



const CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: 'sports', label: 'Sports', color: '#1E3A8A' },
  { value: 'concert', label: 'Concert', color: '#6366F1' },
  { value: 'comedy', label: 'Comedy', color: '#F59E0B' },
  { value: 'theater', label: 'Theater', color: '#8B5CF6' },
  { value: 'art', label: 'Art', color: '#EC4899' },
  { value: 'food', label: 'Food', color: '#10B981' },
  { value: 'nightlife', label: 'Nightlife', color: '#EF4444' },
  { value: 'family', label: 'Family', color: '#3B82F6' },
  { value: 'festival', label: 'Festival', color: '#F97316' },
  { value: 'conference', label: 'Conference', color: '#0EA5E9' },
  { value: 'community', label: 'Community', color: '#84CC16' },
  { value: 'bar', label: 'Bar/Club', color: '#DC2626' },
  { value: 'holiday', label: 'Holiday', color: '#059669' },
  { value: 'general', label: 'General', color: '#6B7280' },
];

const DEFAULT_RADIUS = 25;

function getStoredRadius(): number {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('smartAddRadius');
    return stored ? parseInt(stored, 10) : DEFAULT_RADIUS;
  }
  return DEFAULT_RADIUS;
}

function setStoredRadius(value: number) {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem('smartAddRadius', value.toString());
  }
}

export default function CreateEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: EventFormMode; eventId?: string; holidayName?: string; holidayDate?: string }>();
  const mode: EventFormMode = (params.mode as EventFormMode) || 'create';
  const { addEvent, updateEvent, events } = useEvents();
  
  const existingEvent = mode !== 'create' && params.eventId 
    ? events.find(e => e.id === params.eventId)
    : undefined;
  
  const holidayDate = params.holidayDate ? new Date(params.holidayDate) : null;
  const holidayName = params.holidayName ? decodeURIComponent(params.holidayName) : '';
  
  const [title, setTitle] = useState(existingEvent?.title || holidayName || '');
  const [venue, setVenue] = useState(existingEvent?.venue || '');
  const [address, setAddress] = useState(existingEvent?.address || '');
  const [category, setCategory] = useState<EventCategory>(existingEvent?.category || (holidayName ? 'holiday' : 'general'));
  const [startDate, setStartDate] = useState<Date>(
    existingEvent ? new Date(existingEvent.startISO) : (holidayDate || new Date())
  );
  const [endDate, setEndDate] = useState<Date>(
    existingEvent ? new Date(existingEvent.endISO) : new Date((holidayDate || new Date()).getTime() + 3 * 60 * 60 * 1000)
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [notes, setNotes] = useState(existingEvent?.notes || '');



  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    if (!venue.trim()) {
      Alert.alert('Error', 'Please enter a venue');
      return;
    }

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const categoryColor = CATEGORIES.find(c => c.value === category)?.color || '#6B7280';

    if (mode === 'edit' && params.eventId) {
      updateEvent(params.eventId, {
        title: title.trim(),
        category,
        startISO,
        endISO,
        venue: venue.trim(),
        address: address.trim() || venue.trim(),
        color: categoryColor,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Success', 'Event updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      addEvent({
        userId: 'user_1',
        title: title.trim(),
        category,
        startISO,
        endISO,
        venue: venue.trim(),
        address: address.trim() || venue.trim(),
        color: categoryColor,
        tags: [],
        source: 'manual',
        notes: notes.trim() || undefined,
        createdBy: 'user_1',
      });
      const action = mode === 'duplicate' ? 'duplicated' : 'added';
      Alert.alert('Success', `Event ${action} successfully!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: mode === 'edit' ? 'Edit Event' : mode === 'duplicate' ? 'Duplicate Event' : 'Create Event',
          headerShown: true,
        }} 
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Type size={20} color="#1E3A8A" />
            <Text style={styles.fieldLabel}>Event Title</Text>
          </View>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor="#94A3B8"
            autoFocus
          />
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Tag size={20} color="#1E3A8A" />
            <Text style={styles.fieldLabel}>Category</Text>
          </View>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat.value}
                style={[
                  styles.categoryChip,
                  category === cat.value && {
                    backgroundColor: cat.color,
                  },
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat.value && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <MapPin size={20} color="#1E3A8A" />
            <Text style={styles.fieldLabel}>Venue</Text>
          </View>
          <TextInput
            style={styles.input}
            value={venue}
            onChangeText={setVenue}
            placeholder="e.g., Progressive Field"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <MapPin size={20} color="#1E3A8A" />
            <Text style={styles.fieldLabel}>Address</Text>
          </View>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Venue address"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Clock size={20} color="#1E3A8A" />
            <Text style={styles.fieldLabel}>Start Date & Time</Text>
          </View>
          <Pressable
            style={styles.dateTimeButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.dateTimeButtonText}>
              {startDate.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </Pressable>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display="default"
              onChange={(event, date) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (date) setStartDate(date);
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Clock size={20} color="#1E3A8A" />
            <Text style={styles.fieldLabel}>End Date & Time</Text>
          </View>
          <Pressable
            style={styles.dateTimeButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.dateTimeButtonText}>
              {endDate.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </Pressable>
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="datetime"
              display="default"
              onChange={(event, date) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (date) setEndDate(date);
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Type size={20} color="#1E3A8A" />
            <Text style={styles.fieldLabel}>Notes (Optional)</Text>
          </View>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional details..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
          />
        </View>

        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            {mode === 'edit' ? 'Save Changes' : mode === 'duplicate' ? 'Duplicate Event' : 'Add Event'}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  venueScroll: {
    marginHorizontal: -20,
  },
  venueScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  venueChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  venueChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  venueChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748B',
  },
  venueChipTextActive: {
    color: '#FFFFFF',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
  },
  hint: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
  },
  locationNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  errorNote: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic' as const,
  },
  dateTimeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500' as const,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#E31937',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  smartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 'auto' as const,
  },
  smartBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#0B2A4A',
  },
  smartVenueChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    minWidth: 140,
  },
  smartVenueChipPrimary: {
    borderColor: '#0B2A4A',
    backgroundColor: '#EFF6FF',
  },
  smartVenueChipActive: {
    backgroundColor: '#0B2A4A',
    borderColor: '#0B2A4A',
  },
  smartVenueChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  smartVenueChipTextActive: {
    color: '#FFFFFF',
  },
  smartVenueChipDistance: {
    fontSize: 12,
    color: '#64748B',
  },
  primaryBadge: {
    marginTop: 6,
    backgroundColor: '#0B2A4A',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start' as const,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  estimateCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#166534',
  },
  estimateValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#15803D',
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  visibilityOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  visibilityOptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  visibilityOptionTextActive: {
    color: '#1E3A8A',
  },
  visibilityOptionDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  inviteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inviteInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  inviteButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  invitedList: {
    gap: 8,
    marginBottom: 12,
  },
  invitedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  invitedInfo: {
    flex: 1,
    gap: 4,
  },
  invitedEmail: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500' as const,
  },
  rideInfo: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500' as const,
  },
  invitedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rideButtonActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  rideButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  rideButtonTextActive: {
    color: '#059669',
  },
  removeInviteButton: {
    padding: 4,
  },
  inviteHint: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic' as const,
  },
  workGroupsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  workGroupsToggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  workGroupsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  workGroupCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workGroupInfo: {
    flex: 1,
    gap: 4,
  },
  workGroupName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  workGroupMemberCount: {
    fontSize: 13,
    color: '#64748B',
  },
  addAllButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addAllButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  workGroupMembers: {
    gap: 8,
  },
  quickAddMember: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickAddMemberInvited: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  quickAddMemberText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500' as const,
  },
  quickAddMemberTextInvited: {
    color: '#166534',
  },
  searchProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  searchProfileButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  profileSearchContainer: {
    marginBottom: 16,
  },
  searchResultsList: {
    gap: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchResultInfo: {
    flex: 1,
    gap: 2,
  },
  searchResultName: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600' as const,
  },
  searchResultEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  rideInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
