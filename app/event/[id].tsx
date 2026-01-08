import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Calendar,
  MapPin,
  Clock,
  Car,
  TrendingUp,
  ArrowRight,
  Trash2,
  Edit,
  Copy,
  Check,
  Users,
  CheckCircle,
  MessageCircle,
  X,
  UserPlus,
  Heart,
  ThumbsDown,
  Share2,
  DollarSign,
  Users2,
  User,
  Star,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  Platform,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { useEvents } from '@/providers/EventsProvider';
import DateTimePickerModal, { DateTimePickerResult } from '@/components/DateTimePickerModal';
import { useProfiles } from '@/providers/ProfilesProvider';
import { calculateRideQuote } from '@/utils/pricing';
import { RideBooking } from '@/types';
import DriverArrivalBar from '@/components/DriverArrivalBar';
import { CATALOG_EVENTS } from '@/constants/catalog-events';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, deleteEvent, userPrefs, updatePersonalSchedule, cancelRide, saveFromCatalog, markEventInterested, markEventNotInterested, removeEventInterest, getEventInterestStatus } = useEvents();
  const { getProfile, myProfile, getConnectedProfiles } = useProfiles();
  const [showRideModal, setShowRideModal] = useState(false);
  const [selectedRideType, setSelectedRideType] = useState<'arrival' | 'return'>('arrival');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [customPickupTime, setCustomPickupTime] = useState<Date>(new Date());
  const [useASAP, setUseASAP] = useState(false);
  const [showRideTimeModal, setShowRideTimeModal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSplitCostModal, setShowSplitCostModal] = useState(false);
  const [selectedRideForSplit, setSelectedRideForSplit] = useState<RideBooking | null>(null);
  const [splitWithProfiles, setSplitWithProfiles] = useState<Set<string>>(new Set());

  const isCatalogEvent = id?.startsWith('catalog-');
  const actualId = isCatalogEvent ? id.replace('catalog-', '') : id;

  const event = useMemo(() => {
    return events.find(e => e.id === actualId);
  }, [events, actualId]);

  const catalogEvent = useMemo(() => {
    if (!isCatalogEvent) return null;
    return CATALOG_EVENTS.find(e => e.id === actualId);
  }, [isCatalogEvent, actualId]);

  const displayEvent = useMemo(() => {
    if (event) return event;
    if (catalogEvent) {
      return {
        id: catalogEvent.id,
        title: catalogEvent.title,
        category: catalogEvent.category,
        startISO: catalogEvent.startISO,
        endISO: catalogEvent.endISO,
        venue: catalogEvent.venue,
        address: catalogEvent.address,
        notes: catalogEvent.description,
        color: '#1E3A8A',
        tags: [],
        source: 'catalog' as const,
        userId: '',
      };
    }
    return null;
  }, [event, catalogEvent]);

  const isMyEvent = useMemo(() => {
    if (!event || !myProfile) return false;
    return event.userId === myProfile.id || event.createdBy === myProfile.id;
  }, [event, myProfile]);

  const safeClose = useCallback(() => {
    const canGoBackFn = (router as unknown as { canGoBack?: () => boolean }).canGoBack;
    const canGoBack = typeof canGoBackFn === 'function' ? canGoBackFn() : false;

    console.log('EventDetailScreen.safeClose', {
      id,
      actualId,
      isCatalogEvent,
      canGoBack,
    });

    if (canGoBack) {
      router.back();
      return;
    }

    router.replace('/my-events');
  }, [actualId, id, isCatalogEvent, router]);

  const interestStatus = catalogEvent ? getEventInterestStatus(catalogEvent.id) : null;
  const isInterested = interestStatus === 'interested';
  const isNotInterested = interestStatus === 'not_interested';

  if (!displayEvent) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
          <Pressable
            style={styles.backButton}
            onPress={safeClose}
            testID="eventNotFoundCloseButton"
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const startDate = new Date(displayEvent.startISO);
  const endDate = new Date(displayEvent.endISO);

  const arrivalPickupTime = new Date(
    startDate.getTime() - userPrefs.defaultArrivalBufferMin * 60 * 1000
  );
  const returnPickupTime = new Date(
    endDate.getTime() + userPrefs.defaultReturnBufferMin * 60 * 1000
  );

  const hasValidDestination = displayEvent.venue !== 'Unknown Location' && displayEvent.address !== 'Unknown Location';

  const arrivalQuote = hasValidDestination ? calculateRideQuote({
    origin: userPrefs.homeAddress || 'Cleveland, OH',
    destination: displayEvent.address,
    pickupTime: arrivalPickupTime.toISOString(),
    venue: displayEvent.venue,
    eventDate: displayEvent.startISO,
  }) : null;

  const returnQuote = hasValidDestination ? calculateRideQuote({
    origin: displayEvent.address,
    destination: userPrefs.homeAddress || 'Cleveland, OH',
    pickupTime: returnPickupTime.toISOString(),
    venue: displayEvent.venue,
    eventDate: displayEvent.startISO,
  }) : null;

  const handleBookRide = (type: 'arrival' | 'return') => {
    setSelectedRideType(type);
    setSelectedRecipients(new Set());
    const defaultPickupTime = type === 'arrival' ? arrivalPickupTime : returnPickupTime;
    setCustomPickupTime(defaultPickupTime);
    setUseASAP(false);
    setShowRideTimeModal(false);
    setShowRideModal(true);
  };

  const toggleRecipientSelection = (profileId: string) => {
    const newSelection = new Set(selectedRecipients);
    if (newSelection.has(profileId)) {
      newSelection.delete(profileId);
    } else {
      newSelection.add(profileId);
    }
    setSelectedRecipients(newSelection);
  };

  const handleConfirmMultipleRideBookings = async () => {
    if (!myProfile) {
      Alert.alert('Error', 'Please set up your profile first');
      return;
    }

    if (selectedRecipients.size === 0) {
      Alert.alert('Error', 'Please select at least one person');
      return;
    }

    if (!arrivalQuote || !returnQuote) {
      Alert.alert('Error', 'Unable to calculate ride price without a valid destination');
      return;
    }

    let eventToBookFor = event;
    let needsCalendarAddition = false;

    if (catalogEvent && !event) {
      needsCalendarAddition = true;
    }

    if (!eventToBookFor && !catalogEvent) {
      Alert.alert('Error', 'Event not found');
      return;
    }

    const quote = selectedRideType === 'arrival' ? arrivalQuote : returnQuote;
    const pickupTimeToUse = customPickupTime;

    if (needsCalendarAddition && catalogEvent) {
      try {
        const newEvent = await saveFromCatalog(catalogEvent.id);
        if (!newEvent) {
          Alert.alert('Error', 'Failed to add event to calendar');
          return;
        }
        eventToBookFor = newEvent;
      } catch (error) {
        console.error('Failed to add event to calendar:', error);
        Alert.alert('Error', 'Failed to add event to calendar');
        return;
      }
    }

    if (!eventToBookFor) {
      Alert.alert('Error', 'Event not found');
      return;
    }

    const recipient = selectedRecipients.has('myself') ? myProfile : getProfile(Array.from(selectedRecipients)[0]);
    if (!recipient) {
      Alert.alert('Error', 'Recipient not found');
      return;
    }

    const pickupAddress = selectedRideType === 'arrival' 
      ? (recipient.id === myProfile.id ? (userPrefs.homeAddress || 'Cleveland, OH') : (recipient.address || 'Cleveland, OH')) 
      : displayEvent.address;
    const dropoffAddress = selectedRideType === 'arrival' 
      ? displayEvent.address 
      : (recipient.id === myProfile.id ? (userPrefs.homeAddress || 'Cleveland, OH') : (recipient.address || 'Cleveland, OH'));

    setShowRideModal(false);
    
    const petsCount = Math.max(0, (recipient.hasAnimals ? (recipient.animalCount ?? 0) : 0) ?? 0);
    const accessibilityNeeds = (recipient.isHandicap ?? false) ? '1' : '0';

    router.push({
      pathname: '/select-driver',
      params: {
        eventId: eventToBookFor.id,
        eventTitle: eventToBookFor.title,
        rideType: selectedRideType,
        basePrice: quote.total.toString(),
        pickupAddress,
        dropoffAddress,
        pickupTime: pickupTimeToUse.toISOString(),
        petsCount: String(petsCount),
        accessibilityNeeds,
        preselect: 'app_price',
      },
    });
  };

  const handleASAPToggle = () => {
    console.log('EventDetailScreen.handleASAPToggle');
    setUseASAP(true);
    setCustomPickupTime(new Date());
    setShowRideTimeModal(false);
  };

  const handleRideTimeDone = (res: DateTimePickerResult) => {
    console.log('EventDetailScreen.handleRideTimeDone', {
      isASAP: res.isASAP,
      iso: res.date.toISOString(),
    });

    setShowRideTimeModal(false);
    setUseASAP(res.isASAP);
    setCustomPickupTime(res.date);
  };

  const handleCancelRide = (rideId: string, forProfileName: string) => {
    if (!event) return;
    Alert.alert(
      'Cancel Ride',
      `Are you sure you want to cancel the ride for ${forProfileName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            await cancelRide(event.id, rideId);
            Alert.alert('Success', 'Ride cancelled');
          },
        },
      ]
    );
  };

  const handleSplitCost = (ride: RideBooking) => {
    setSelectedRideForSplit(ride);
    setSplitWithProfiles(new Set());
    setShowSplitCostModal(true);
  };

  const toggleSplitProfile = (profileId: string) => {
    const newSelection = new Set(splitWithProfiles);
    if (newSelection.has(profileId)) {
      newSelection.delete(profileId);
    } else {
      newSelection.add(profileId);
    }
    setSplitWithProfiles(newSelection);
  };

  const calculateSplitAmount = () => {
    if (!selectedRideForSplit || splitWithProfiles.size === 0) return 0;
    return selectedRideForSplit.estimate / (splitWithProfiles.size + 1);
  };

  const handleDelete = () => {
    if (!isMyEvent || !event) {
      Alert.alert('Error', 'You can only delete your own events');
      return;
    }

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEvent(event.id);
            safeClose();
          },
        },
      ]
    );
  };

  const handleEditEvent = () => {
    if (!isMyEvent || !event) {
      Alert.alert('Error', 'You can only edit your own events');
      return;
    }
    router.push(`/create-event?mode=edit&eventId=${event.id}`);
  };

  const handleEditPersonalSchedule = () => {
    if (!event) return;
    setScheduleStart(event.personalSchedule?.attendStartISO || event.startISO);
    setScheduleEnd(event.personalSchedule?.attendEndISO || event.endISO);
    setScheduleNotes(event.personalSchedule?.notes || '');
    setShowScheduleModal(true);
  };

  const handleSavePersonalSchedule = async () => {
    if (!event) return;
    await updatePersonalSchedule(event.id, {
      attendStartISO: scheduleStart,
      attendEndISO: scheduleEnd,
      notes: scheduleNotes,
    });
    Alert.alert('Success', 'Your personal schedule updated');
    setShowScheduleModal(false);
  };

  const handleInviteBySMS = () => {
    const startDate = new Date(displayEvent.startISO);
    const endDate = new Date(displayEvent.endISO);
    const formattedDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = `${startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })} - ${endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;

    const message = `You're invited to ${displayEvent.title}!\n\nDate: ${formattedDate}\nTime: ${formattedTime}\nVenue: ${displayEvent.venue}\nAddress: ${displayEvent.address}\n\nSee you there!`;

    const smsUrl = Platform.select({
      ios: `sms:&body=${encodeURIComponent(message)}`,
      android: `sms:?body=${encodeURIComponent(message)}`,
      default: `sms:?body=${encodeURIComponent(message)}`,
    });

    Linking.canOpenURL(smsUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(smsUrl);
        } else {
          Alert.alert('Error', 'SMS is not available on this device');
        }
      })
      .catch((error) => {
        console.error('Error opening SMS:', error);
        Alert.alert('Error', 'Failed to open SMS application');
      });
  };

  const handleAddToCalendar = async () => {
    if (!catalogEvent || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const newEvent = await saveFromCatalog(catalogEvent.id);
      if (newEvent) {
        Alert.alert('Success', 'Event added to your calendar!', [
          { text: 'View', onPress: () => router.replace(`/event/${newEvent.id}`) },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    } catch (error) {
      console.error('Failed to add to calendar:', error);
      Alert.alert('Error', 'Failed to add event to calendar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInterested = async () => {
    if (!catalogEvent || isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isInterested) {
        await removeEventInterest(catalogEvent.id);
      } else {
        await markEventInterested(catalogEvent);
      }
    } catch (error) {
      console.error('Failed to update interest:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotInterested = async () => {
    if (!catalogEvent || isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isNotInterested) {
        await removeEventInterest(catalogEvent.id);
      } else {
        await markEventNotInterested(catalogEvent.id);
        Alert.alert('Hidden', 'Event hidden from your discover feed', [
          { text: 'OK', onPress: safeClose },
        ]);
      }
    } catch (error) {
      console.error('Failed to update not interested:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const categoryColor = displayEvent.color;
  const connectedProfiles = getConnectedProfiles();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Event Details',
          headerBackTitle: 'Back',
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable onPress={safeClose} style={{ padding: 8 }} testID="eventDetailCloseButton">
              <X size={24} color="#64748B" strokeWidth={2} />
            </Pressable>
          ),
          headerRight: () => {
            if (!isMyEvent || !event) return null;
            return (
              <Pressable
                onPress={handleDelete}
                style={{ padding: 8 }}
                testID="eventDetailDeleteButton"
              >
                <Trash2 size={22} color="#DC2626" strokeWidth={2.2} />
              </Pressable>
            );
          },
        }} 
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: categoryColor }]}>
          <Text style={styles.headerTitle}>{displayEvent.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{displayEvent.category.toUpperCase()}</Text>
          </View>
        </View>

        {catalogEvent && (
          <View style={styles.catalogActions}>
            <Pressable
              style={[styles.addButton, isProcessing && { opacity: 0.5 }]}
              onPress={handleAddToCalendar}
              disabled={isProcessing}
            >
              <View style={styles.addButtonIconContainer}>
                <Calendar size={24} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={styles.addButtonContent}>
                <Text style={styles.addButtonTitle}>Add to My Calendar</Text>
                <Text style={styles.addButtonSubtitle}>Save this event & book rides</Text>
              </View>
            </Pressable>

            <View style={styles.catalogSecondaryActions}>
              <Pressable
                style={[styles.catalogIconButton, isInterested && styles.interestedButtonActive, isProcessing && { opacity: 0.5 }]}
                onPress={handleInterested}
                disabled={isProcessing}
              >
                <Heart
                  size={22}
                  color={isInterested ? '#FFFFFF' : '#DC2626'}
                  strokeWidth={2}
                  fill={isInterested ? '#FFFFFF' : 'none'}
                />
              </Pressable>

              <Pressable
                style={[styles.catalogIconButton, isNotInterested && styles.notInterestedButtonActive, isProcessing && { opacity: 0.5 }]}
                onPress={handleNotInterested}
                disabled={isProcessing}
              >
                <ThumbsDown
                  size={22}
                  color={isNotInterested ? '#FFFFFF' : '#64748B'}
                  strokeWidth={2}
                  fill={isNotInterested ? '#FFFFFF' : 'none'}
                />
              </Pressable>

              <Pressable
                style={[styles.catalogIconButton, isProcessing && { opacity: 0.5 }]}
                onPress={handleInviteBySMS}
                disabled={isProcessing}
              >
                <Share2 size={22} color="#1E3A8A" strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Calendar size={20} color="#1E3A8A" />
            <View style={styles.infoContent}>
              <View style={styles.labelWithBadge}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                {event?.calendarEventId && (
                  <View style={styles.syncBadge}>
                    <Check size={12} color="#059669" />
                    <Text style={styles.syncBadgeText}>Synced to Calendar</Text>
                  </View>
                )}
              </View>
              <Text style={styles.infoValue}>
                {startDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.infoValue}>
                {startDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}{' '}
                -{' '}
                {endDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
              {event?.personalSchedule && (
                <View style={styles.personalScheduleBadge}>
                  <Clock size={12} color="#8B5CF6" />
                  <Text style={styles.personalScheduleText}>
                    Your attendance: {new Date(event.personalSchedule.attendStartISO || event.startISO).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(event.personalSchedule.attendEndISO || event.endISO).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
              )}
              {event && (
                <Pressable style={styles.editScheduleButton} onPress={handleEditPersonalSchedule}>
                  <Edit size={14} color="#8B5CF6" />
                  <Text style={styles.editScheduleButtonText}>Edit My Schedule</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={20} color="#1E3A8A" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Venue</Text>
              <Text style={styles.infoValue}>{displayEvent.venue}</Text>
              <Text style={styles.infoSubtext}>{displayEvent.address}</Text>
            </View>
          </View>

          {displayEvent.notes && (
            <View style={styles.infoRow}>
              <Clock size={20} color="#1E3A8A" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoValue}>{displayEvent.notes}</Text>
              </View>
            </View>
          )}

          {event?.verifiedAddress && (
            <View style={styles.infoRow}>
              <CheckCircle size={20} color="#059669" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Verified Address</Text>
                <Text style={styles.infoValue}>{event.verifiedAddress.formatted}</Text>
                <Text style={styles.infoSubtext}>Lat: {event.verifiedAddress.lat.toFixed(6)}, Lng: {event.verifiedAddress.lng.toFixed(6)}</Text>
              </View>
            </View>
          )}


          {event?.invitedProfiles && event.invitedProfiles.length > 0 && (
            <View style={styles.infoRow}>
              <Users size={20} color="#1E3A8A" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Event Attendees</Text>
                
                <View style={styles.attendeesContainer}>
                  <Text style={styles.sectionSubheader}>Invited ({event.invitedProfiles.length})</Text>
                  {event.invitedProfiles.map((profileId, index) => {
                    const profile = getProfile(profileId);
                    const attendee = event.attendees?.find(a => a.profileId === profileId);
                    
                    return (
                      <Pressable
                        key={index}
                        style={styles.attendeeRow}
                        onPress={() => router.push(`/profile/${profileId}`)}
                      >
                        <View style={styles.attendeeInfo}>
                          <Text style={styles.attendeeName}>
                            • {profile?.name || 'Unknown User'}
                          </Text>
                          {attendee?.status && attendee.status !== 'pending' && (
                            <View style={[
                              styles.statusBadge,
                              attendee.status === 'accepted' ? styles.statusAccepted : styles.statusDeclined
                            ]}>
                              <Text style={styles.statusBadgeText}>
                                {attendee.status === 'accepted' ? 'Going' : 'Declined'}
                              </Text>
                            </View>
                          )}
                          {attendee?.rideInfo && (
                            <View style={styles.rideIndicator}>
                              <MessageCircle size={12} color="#059669" strokeWidth={2} />
                              <Text style={styles.rideIndicatorText}>Ride arranged</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>

        {hasValidDestination && (
          <View style={styles.ridesSection}>
            <View style={styles.ridesSectionHeader}>
              <Car size={24} color="#1E3A8A" strokeWidth={2} />
              <Text style={styles.ridesSectionTitle}>Smart Ride Booking</Text>
            </View>

          {event && event.rides && event.rides.length > 0 && (
            <View style={styles.bookedRidesSection}>
              <Text style={styles.bookedRidesTitle}>Booked Rides</Text>
              {event.rides.filter(r => r.status !== 'cancelled').map((ride) => (
                <View key={ride.id} style={styles.bookedRideCard}>
                  <View style={styles.bookedRideHeader}>
                    <View style={styles.bookedRideTypeRow}>
                      {ride.rideType === 'arrival' ? (
                        <ArrowRight size={18} color="#059669" />
                      ) : (
                        <ArrowRight size={18} color="#DC2626" style={{ transform: [{ rotate: '180deg' }] }} />
                      )}
                      <Text style={styles.bookedRideType}>
                        {ride.rideType === 'arrival' ? 'Arrival' : 'Return'}
                      </Text>
                    </View>
                    <Text style={styles.bookedRidePrice}>${ride.estimate}</Text>
                  </View>
                  
                  {ride.driver && (
                    <View style={styles.driverInfoSection}>
                      <View style={styles.driverInfoHeader}>
                        {ride.driver.avatar ? (
                          <Image source={{ uri: ride.driver.avatar }} style={styles.driverAvatarSmall} />
                        ) : (
                          <View style={styles.driverAvatarPlaceholder}>
                            <User size={20} color="#FFFFFF" />
                          </View>
                        )}
                        <View style={styles.driverInfoText}>
                          <Text style={styles.driverNameSmall}>{ride.driver.name}</Text>
                          <View style={styles.driverRatingRow}>
                            <Star size={12} color="#F59E0B" fill="#F59E0B" />
                            <Text style={styles.driverRatingSmall}>{ride.driver.rating.toFixed(1)}</Text>
                            <Text style={styles.driverVehicle}> • {ride.driver.vehicleColor} {ride.driver.vehicleBrand} {ride.driver.vehicleModel}</Text>
                          </View>
                        </View>
                      </View>
                      <Pressable
                        style={styles.messageDriverButton}
                        onPress={() => router.push(`/ride-chat/${ride.id}`)}
                      >
                        <MessageCircle size={16} color="#1E3A8A" />
                        <Text style={styles.messageDriverButtonText}>Message</Text>
                      </Pressable>
                    </View>
                  )}

                  <DriverArrivalBar status={ride.status} pickupTime={ride.pickupTime} estimatedArrivalTime={ride.estimatedArrivalTime} />
                  
                  <Text style={styles.bookedRideFor}>For: {ride.forProfileName}</Text>
                  <Text style={styles.bookedRideDetail}>Booked by: {ride.bookedByProfileName}</Text>
                  <Text style={styles.bookedRideDetail}>
                    Pickup: {new Date(ride.pickupTime).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                  <View style={styles.rideActionsRow}>
                    <Pressable
                      style={styles.splitCostButton}
                      onPress={() => handleSplitCost(ride)}
                    >
                      <DollarSign size={14} color="#059669" />
                      <Text style={styles.splitCostButtonText}>Split Costs</Text>
                    </Pressable>
                    <Pressable
                      style={styles.cancelRideButton}
                      onPress={() => handleCancelRide(ride.id, ride.forProfileName)}
                    >
                      <X size={14} color="#DC2626" />
                      <Text style={styles.cancelRideButtonText}>Cancel Ride</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {(!event || !event.rides || !event.rides.some(r => r.rideType === 'arrival' && r.status !== 'cancelled')) && (
          <Pressable
            style={styles.rideCard}
            onPress={() => handleBookRide('arrival')}
          >
            <View style={styles.rideCardHeader}>
              <View style={styles.rideCardTitleRow}>
                <ArrowRight size={20} color="#059669" />
                <Text style={styles.rideCardTitle}>Book Ride for Arrival</Text>
              </View>
              <Text style={styles.rideCardPrice}>${arrivalQuote?.total || 0}</Text>
            </View>

            <View style={styles.rideCardDetails}>
              <Text style={styles.rideCardDetailText}>
                <Text style={styles.rideCardDetailLabel}>Pickup: </Text>
                {arrivalPickupTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
              <Text style={styles.rideCardDetailText}>
                <Text style={styles.rideCardDetailLabel}>Arrive by: </Text>
                {startDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>

            {arrivalQuote && arrivalQuote.surge > 1 && (
              <View style={styles.surgeIndicator}>
                <TrendingUp size={14} color="#DC2626" />
                <Text style={styles.surgeText}>
                  {((arrivalQuote.surge - 1) * 100).toFixed(0)}% surge pricing
                </Text>
              </View>
            )}

            <View style={styles.breakdown}>
              {arrivalQuote?.breakdown.map((item, idx) => (
                <Text key={idx} style={styles.breakdownText}>
                  • {item}
                </Text>
              ))}
            </View>
          </Pressable>
          )}

          {(!event || !event.rides || !event.rides.some(r => r.rideType === 'return' && r.status !== 'cancelled')) && (
          <Pressable
            style={styles.rideCard}
            onPress={() => handleBookRide('return')}
          >
            <View style={styles.rideCardHeader}>
              <View style={styles.rideCardTitleRow}>
                <ArrowRight size={20} color="#DC2626" style={{ transform: [{ rotate: '180deg' }] }} />
                <Text style={styles.rideCardTitle}>Book Ride for Return</Text>
              </View>
              <Text style={styles.rideCardPrice}>${returnQuote?.total || 0}</Text>
            </View>

            <View style={styles.rideCardDetails}>
              <Text style={styles.rideCardDetailText}>
                <Text style={styles.rideCardDetailLabel}>Pickup: </Text>
                {returnPickupTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
              <Text style={styles.rideCardDetailText}>
                <Text style={styles.rideCardDetailLabel}>Event ends: </Text>
                {endDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>

            {returnQuote && returnQuote.surge > 1 && (
              <View style={styles.surgeIndicator}>
                <TrendingUp size={14} color="#DC2626" />
                <Text style={styles.surgeText}>
                  {((returnQuote.surge - 1) * 100).toFixed(0)}% surge pricing
                </Text>
              </View>
            )}

            <View style={styles.breakdown}>
              {returnQuote?.breakdown.map((item, idx) => (
                <Text key={idx} style={styles.breakdownText}>
                  • {item}
                </Text>
              ))}
            </View>
          </Pressable>
          )}
          </View>
        )}

        {isMyEvent && event && (
          <View style={styles.actionsRow}>
            <Pressable 
              style={[styles.actionButton, styles.editButton]} 
              onPress={handleEditEvent}
            >
              <Edit size={18} color="#1E3A8A" />
              <Text style={styles.editButtonText}>Edit Event</Text>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, styles.duplicateButton]} 
              onPress={() => router.push(`/create-event?mode=duplicate&eventId=${event.id}`)}
            >
              <Copy size={18} color="#123A66" />
              <Text style={styles.duplicateButtonText}>Duplicate</Text>
            </Pressable>
          </View>
        )}

        {event && (
          <Pressable style={styles.inviteButton} onPress={handleInviteBySMS}>
            <MessageCircle size={20} color="#059669" />
            <Text style={styles.inviteButtonText}>Invite via Text Message</Text>
          </Pressable>
        )}

        {isMyEvent && event && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 size={18} color="#DC2626" />
            <Text style={styles.deleteButtonText}>Delete Event</Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal
        visible={showRideModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRideModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Book {selectedRideType === 'arrival' ? 'Arrival' : 'Return'} Ride
              </Text>
              <Pressable onPress={() => setShowRideModal(false)}>
                <X size={24} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.pickupTimeSection}>
                <Text style={styles.sectionLabel}>Pickup Time</Text>
                <View style={styles.pickupTimeDisplay}>
                  <Clock size={16} color="#1E3A8A" />
                  <Text style={styles.pickupTimeText}>
                    {useASAP ? 'ASAP' : customPickupTime.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </Text>
                </View>
                
                <View style={styles.timeOptionsContainer}>
                  <Pressable 
                    style={[styles.timeOptionButton, useASAP && styles.timeOptionButtonActive]} 
                    onPress={handleASAPToggle}
                  >
                    <Text style={[styles.timeOptionButtonText, useASAP && styles.timeOptionButtonTextActive]}>ASAP</Text>
                  </Pressable>
                  
                  <View style={styles.customTimeDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  
                  <Text style={styles.customTimeLabel}>Pick Custom Time</Text>
                  
                  <View style={styles.pickerButtonsRow}>
                    <Pressable
                      style={styles.pickerButton}
                      onPress={() => {
                        console.log('EventDetailScreen.openRideTimeModal (date button)');
                        setUseASAP(false);
                        setShowRideTimeModal(true);
                      }}
                      testID="ridePickupDateButton"
                    >
                      <Calendar size={18} color="#1E3A8A" />
                      <Text style={styles.pickerButtonText}>
                        {customPickupTime.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.pickerButton}
                      onPress={() => {
                        console.log('EventDetailScreen.openRideTimeModal (time button)');
                        setUseASAP(false);
                        setShowRideTimeModal(true);
                      }}
                      testID="ridePickupTimeButton"
                    >
                      <Clock size={18} color="#1E3A8A" />
                      <Text style={styles.pickerButtonText}>
                        {customPickupTime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </Text>
                    </Pressable>
                  </View>

                </View>
              </View>

              <Text style={styles.sectionLabel}>Select Recipients</Text>
              
              <Pressable
                style={[
                  styles.rideRecipientCard,
                  selectedRecipients.has('myself') && styles.rideRecipientCardSelected
                ]}
                onPress={() => toggleRecipientSelection('myself')}
              >
                <UserPlus size={20} color={selectedRecipients.has('myself') ? '#FFFFFF' : '#1E3A8A'} />
                <Text style={[
                  styles.rideRecipientText,
                  selectedRecipients.has('myself') && styles.rideRecipientTextSelected
                ]}>Book for Myself</Text>
                {selectedRecipients.has('myself') && (
                  <CheckCircle size={20} color="#FFFFFF" style={styles.checkIcon} />
                )}
              </Pressable>

              {connectedProfiles.length > 0 && (
                <>
                  <Text style={styles.rideModalSubheader}>Connections:</Text>
                  {connectedProfiles.map((profile) => (
                    <Pressable
                      key={profile.id}
                      style={[
                        styles.rideRecipientCard,
                        selectedRecipients.has(profile.id) && styles.rideRecipientCardSelected
                      ]}
                      onPress={() => toggleRecipientSelection(profile.id)}
                    >
                      <Users size={20} color={selectedRecipients.has(profile.id) ? '#FFFFFF' : '#8B5CF6'} />
                      <Text style={[
                        styles.rideRecipientText,
                        selectedRecipients.has(profile.id) && styles.rideRecipientTextSelected
                      ]}>{profile.name}</Text>
                      {selectedRecipients.has(profile.id) && (
                        <CheckCircle size={20} color="#FFFFFF" style={styles.checkIcon} />
                      )}
                    </Pressable>
                  ))}
                </>
              )}

              <Pressable 
                style={[
                  styles.confirmBookingButton,
                  selectedRecipients.size === 0 && styles.confirmBookingButtonDisabled
                ]} 
                onPress={handleConfirmMultipleRideBookings}
                disabled={selectedRecipients.size === 0}
              >
                <Car size={20} color="#FFFFFF" />
                <Text style={styles.confirmBookingButtonText}>
                  Book for {selectedRecipients.size} {selectedRecipients.size === 1 ? 'Person' : 'People'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        visible={showRideTimeModal}
        title="Pickup time"
        initialValue={{ date: customPickupTime, isASAP: useASAP }}
        allowASAP
        mode="ride"
        onCancel={() => {
          console.log('EventDetailScreen.rideTimeModal cancel');
          setShowRideTimeModal(false);
        }}
        onDone={handleRideTimeDone}
      />

      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit My Schedule</Text>
              <Pressable onPress={() => setShowScheduleModal(false)}>
                <X size={24} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Attend From:</Text>
              <TextInput
                style={styles.input}
                value={new Date(scheduleStart).toLocaleString()}
                editable={false}
              />

              <Text style={styles.inputLabel}>Attend Until:</Text>
              <TextInput
                style={styles.input}
                value={new Date(scheduleEnd).toLocaleString()}
                editable={false}
              />

              <Text style={styles.inputLabel}>Notes (Optional):</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={scheduleNotes}
                onChangeText={setScheduleNotes}
                multiline
                numberOfLines={4}
                placeholder="Add notes about your attendance..."
              />

              <Pressable style={styles.saveButton} onPress={handleSavePersonalSchedule}>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Schedule</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSplitCostModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSplitCostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Split Ride Cost</Text>
              <Pressable onPress={() => setShowSplitCostModal(false)}>
                <X size={24} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedRideForSplit && (
                <>
                  <View style={styles.splitCostSummary}>
                    <View style={styles.splitCostHeader}>
                      <Users2 size={24} color="#059669" />
                      <Text style={styles.splitCostTitle}>Total: ${selectedRideForSplit.estimate}</Text>
                    </View>
                    <Text style={styles.splitCostSubtext}>
                      {selectedRideForSplit.rideType === 'arrival' ? 'Arrival' : 'Return'} ride for {selectedRideForSplit.forProfileName}
                    </Text>
                  </View>

                  {splitWithProfiles.size > 0 && (
                    <View style={styles.splitBreakdown}>
                      <Text style={styles.splitBreakdownTitle}>Cost per person:</Text>
                      <Text style={styles.splitBreakdownAmount}>
                        ${calculateSplitAmount().toFixed(2)}
                      </Text>
                      <Text style={styles.splitBreakdownPeople}>
                        Split between {splitWithProfiles.size + 1} people
                      </Text>
                    </View>
                  )}

                  <Text style={styles.sectionLabel}>Split With:</Text>

                  {myProfile && (
                    <View style={styles.splitProfileCard}>
                      <View style={styles.splitProfileInfo}>
                        <Users size={20} color="#1E3A8A" />
                        <View style={styles.splitProfileTextContainer}>
                          <Text style={styles.splitProfileName}>{myProfile.name} (You)</Text>
                          <Text style={styles.splitProfileRole}>Organizer</Text>
                        </View>
                      </View>
                      <View style={styles.splitProfileAmount}>
                        <Text style={styles.splitAmountLabel}>{splitWithProfiles.size > 0 ? `${calculateSplitAmount().toFixed(2)}` : `${selectedRideForSplit.estimate}`}</Text>
                      </View>
                    </View>
                  )}

                  {connectedProfiles.length > 0 && (
                    <>
                      <Text style={styles.rideModalSubheader}>Select connections to split with:</Text>
                      {connectedProfiles.map((profile) => (
                        <Pressable
                          key={profile.id}
                          style={[
                            styles.splitSelectionCard,
                            splitWithProfiles.has(profile.id) && styles.splitSelectionCardActive
                          ]}
                          onPress={() => toggleSplitProfile(profile.id)}
                        >
                          <View style={styles.splitProfileInfo}>
                            <Users size={20} color={splitWithProfiles.has(profile.id) ? '#FFFFFF' : '#8B5CF6'} />
                            <Text style={[
                              styles.splitSelectionName,
                              splitWithProfiles.has(profile.id) && styles.splitSelectionNameActive
                            ]}>{profile.name}</Text>
                          </View>
                          {splitWithProfiles.has(profile.id) && (
                            <View style={styles.splitAmountTag}>
                              <Text style={styles.splitAmountTagText}>Owes ${calculateSplitAmount().toFixed(2)}</Text>
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </>
                  )}

                  {splitWithProfiles.size > 0 && (
                    <Pressable
                      style={styles.sendSplitButton}
                      onPress={() => {
                        const splitAmount = calculateSplitAmount().toFixed(2);
                        
                        const message = `Hi! I'm splitting the cost of our ${selectedRideForSplit.rideType} ride to ${displayEvent.title}. Your share is ${splitAmount}. Total ride cost: ${selectedRideForSplit.estimate}`;
                        
                        const smsUrl = Platform.select({
                          ios: `sms:&body=${encodeURIComponent(message)}`,
                          android: `sms:?body=${encodeURIComponent(message)}`,
                          default: `sms:?body=${encodeURIComponent(message)}`,
                        });
                        
                        Linking.openURL(smsUrl).catch(() => {
                          Alert.alert('Error', 'Failed to open SMS');
                        });
                        
                        setShowSplitCostModal(false);
                      }}
                    >
                      <MessageCircle size={20} color="#FFFFFF" />
                      <Text style={styles.sendSplitButtonText}>
                        Send Split Request via SMS
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  header: {
    padding: 24,
    paddingTop: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
  },
  labelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#059669',
  },
  infoValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500' as const,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  personalScheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3E8FF',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  personalScheduleText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600' as const,
  },
  editScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editScheduleButtonText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '600' as const,
  },
  ridesSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  ridesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  ridesSectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  bookedRidesSection: {
    marginBottom: 20,
  },
  bookedRidesTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  bookedRideCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookedRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookedRideTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookedRideType: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  bookedRidePrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#059669',
  },
  bookedRideFor: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  bookedRideDetail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  rideActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  splitCostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  splitCostButtonText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600' as const,
  },
  cancelRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  cancelRideButtonText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600' as const,
  },
  driverInfoSection: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  driverInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  driverAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  driverAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfoText: {
    flex: 1,
  },
  driverNameSmall: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 2,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverRatingSmall: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  driverVehicle: {
    fontSize: 11,
    color: '#64748B',
  },
  messageDriverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  messageDriverButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rideCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rideCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  rideCardPrice: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#059669',
  },
  rideCardDetails: {
    marginBottom: 12,
  },
  rideCardDetailText: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 4,
  },
  rideCardDetailLabel: {
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  surgeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  surgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  breakdown: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  breakdownText: {
    fontSize: 13,
    color: '#64748B',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  duplicateButton: {
    backgroundColor: '#F6F7F9',
    borderColor: '#E2E8F0',
  },
  duplicateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#123A66',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  publicText: {
    color: '#059669',
  },
  privateText: {
    color: '#DC2626',
  },
  attendeesContainer: {
    marginTop: 12,
    gap: 12,
  },
  sectionSubheader: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    gap: 12,
  },
  attendeeInfo: {
    flex: 1,
    gap: 6,
  },
  attendeeName: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500' as const,
  },
  statusBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusAccepted: {
    backgroundColor: '#ECFDF5',
  },
  statusDeclined: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#059669',
  },
  rideIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rideIndicatorText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500' as const,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  privacyBadgePrivate: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  privacyText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#059669',
  },
  privacyTextPrivate: {
    color: '#DC2626',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  modalScroll: {
    padding: 20,
  },
  rideRecipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rideRecipientText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  rideModalSubheader: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  pickupTimeSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  pickupTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
  },
  pickupTimeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  timeOptionsContainer: {
    marginTop: 16,
  },
  timeOptionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    alignItems: 'center' as const,
  },
  timeOptionButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  timeOptionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  timeOptionButtonTextActive: {
    color: '#FFFFFF',
  },
  customTimeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600' as const,
  },
  customTimeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 8,
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  pickerContainer: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  picker: {
    height: 200,
  },
  doneButton: {
    paddingVertical: 14,
    backgroundColor: '#1E3A8A',
    alignItems: 'center' as const,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  rideRecipientCardSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  rideRecipientTextSelected: {
    color: '#FFFFFF',
  },
  checkIcon: {
    marginLeft: 'auto' as const,
  },
  confirmBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  confirmBookingButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmBookingButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  catalogActions: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#1E3A8A',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonContent: {
    flex: 1,
    gap: 4,
  },
  addButtonTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  addButtonSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  catalogSecondaryActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  catalogIconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestedButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  notInterestedButtonActive: {
    backgroundColor: '#64748B',
    borderColor: '#64748B',
  },
  splitCostSummary: {
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  splitCostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  splitCostTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#059669',
  },
  splitCostSubtext: {
    fontSize: 14,
    color: '#047857',
    marginTop: 4,
  },
  splitBreakdown: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  splitBreakdownTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 8,
  },
  splitBreakdownAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#1E3A8A',
    marginBottom: 4,
  },
  splitBreakdownPeople: {
    fontSize: 13,
    color: '#64748B',
  },
  splitProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  splitProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  splitProfileTextContainer: {
    gap: 2,
  },
  splitProfileName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  splitProfileRole: {
    fontSize: 12,
    color: '#64748B',
  },
  splitProfileAmount: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  splitAmountLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  splitSelectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  splitSelectionCardActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  splitSelectionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  splitSelectionNameActive: {
    color: '#FFFFFF',
  },
  splitAmountTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  splitAmountTagText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  sendSplitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1E3A8A',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  sendSplitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
