import { useRouter } from 'expo-router';
import {
  MapPin,
  Search,
  Calendar,
  Navigation,
  AlertCircle,
  Filter,
  Facebook,
  Globe,
  Ticket,
} from 'lucide-react-native';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '@/providers/EventsProvider';
import {
  EventCategory,
  DistanceOption,
  SortOption,
  PromotionWithDistance,
  RedemptionStatus,
} from '@/types';
import { MOCK_PROMOTIONS, PROMO_CAROUSEL_ITEMS } from '@/constants/promotions';
import { CATALOG_EVENTS } from '@/constants/catalog-events';
import { PromoCarousel } from '@/components/PromoCarousel';
import { PromoCard } from '@/components/PromoCard';
import { EventCard } from '@/components/EventCard';
import { RedemptionModal } from '@/components/RedemptionModal';

const CATEGORIES: { value: EventCategory | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: '#6B7280' },
  { value: 'sports', label: 'Sports', color: '#1E3A8A' },
  { value: 'concert', label: 'Concerts', color: '#9333EA' },
  { value: 'bar', label: 'Bars', color: '#DC2626' },
  { value: 'general', label: 'Other', color: '#059669' },
];

const DISTANCE_OPTIONS: DistanceOption[] = [5, 10, 25, 50];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'soonest', label: 'Soonest' },
  { value: 'nearest', label: 'Nearest' },
  { value: 'popular', label: 'Popular' },
];

const EVENT_SOURCES = [
  { id: 'eventbrite', name: 'Eventbrite', icon: 'ticket', enabled: true },
  { id: 'facebook', name: 'Facebook', icon: 'facebook', enabled: true },
  { id: 'ticketmaster', name: 'Ticketmaster', icon: 'ticket', enabled: true },
  { id: 'venue', name: 'Venue Sites', icon: 'globe', enabled: true },
];

export default function EventsNearbyScreen() {
  const router = useRouter();
  const { userLocation, locationLoading, eventsLoading, requestLocation, getNearbyEvents, discoverNearbyEvents, saveFromCatalog, markEventInterested, markEventNotInterested, getEventInterestStatus } =
    useEvents();

  const [activeTab, setActiveTab] = useState<'promos' | 'events'>('promos');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<EventCategory | 'all'>('all');
  const [distance, setDistance] = useState<DistanceOption>(25);
  const [sort, setSort] = useState<SortOption>('soonest');
  const [carouselFilter, setCarouselFilter] = useState<string | null>(null);
  const [ridePerkOnly, setRidePerkOnly] = useState(false);

  const [selectedPromo, setSelectedPromo] = useState<PromotionWithDistance | null>(null);
  const [redemptionStatus, setRedemptionStatus] = useState<RedemptionStatus>('locked');
  const [redemptionToken, setRedemptionToken] = useState<string | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(false);

  useEffect(() => {
    if (!userLocation && !locationLoading) {
      requestLocation();
    }
  }, [userLocation, locationLoading, requestLocation]);

  useEffect(() => {
    if (userLocation && activeTab === 'events') {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const filters = {
        category,
        distance,
        startDate: now.toISOString(),
        endDate: nextMonth.toISOString(),
        sort,
        searchQuery,
      };

      discoverNearbyEvents(filters);
    }
  }, [userLocation, activeTab, category, distance, sort, searchQuery, discoverNearbyEvents]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimateRideFare = (distanceMiles: number): number => {
    const BASE = 3.0;
    const PER_MILE = 1.85;
    const total = BASE + distanceMiles * PER_MILE;
    return Math.ceil(total);
  };

  const filteredPromos = useMemo(() => {
    if (!userLocation) return [];

    let promos = MOCK_PROMOTIONS.filter((promo) => promo.active);

    if (category !== 'all') {
      promos = promos.filter((p) => p.category === category);
    }

    if (carouselFilter) {
      promos = promos.filter((p) => p.tags.some((tag) => tag.toLowerCase().includes(carouselFilter.toLowerCase())));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      promos = promos.filter(
        (p) =>
          p.merchantName.toLowerCase().includes(query) ||
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    const withDistance = promos.map((promo) => {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        promo.geo.lat,
        promo.geo.lng
      );
      const fare = estimateRideFare(dist);
      return {
        ...promo,
        distance: dist,
        rideFare: fare,
      };
    });

    const withinDistance = withDistance.filter((p) => p.distance <= distance);

    withinDistance.sort((a, b) => {
      switch (sort) {
        case 'soonest':
          return a.startTime.localeCompare(b.startTime);
        case 'nearest':
          return a.distance - b.distance;
        case 'popular':
          return b.sponsored === a.sponsored ? 0 : b.sponsored ? 1 : -1;
        default:
          return 0;
      }
    });

    return withinDistance;
  }, [userLocation, category, distance, sort, searchQuery, carouselFilter]);

  const nearbyEvents = useMemo(() => {
    if (!userLocation) return [];

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const filters = {
      category,
      distance,
      startDate: now.toISOString(),
      endDate: nextMonth.toISOString(),
      sort,
      searchQuery,
    };

    const allEvents = getNearbyEvents(filters);
    
    const filteredEvents = allEvents.filter(event => {
      const interestStatus = getEventInterestStatus(event.id);
      return interestStatus !== 'not_interested';
    });

    return filteredEvents;
  }, [userLocation, category, distance, sort, searchQuery, getNearbyEvents, getEventInterestStatus]);

  const handleSaveEvent = useCallback(
    async (catalogId: string, title: string) => {
      const savedEvent = await saveFromCatalog(catalogId);
      if (savedEvent) {
        Alert.alert('Saved!', `"${title}" has been added to your calendar.`, [
          { text: 'View', onPress: () => router.push(`/event/${savedEvent.id}`) },
          { text: 'OK' },
        ]);
      }
    },
    [saveFromCatalog, router]
  );

  const handleMarkInterested = useCallback(async (event: typeof nearbyEvents[0]) => {
    const allEvents = [...CATALOG_EVENTS, ...getNearbyEvents({
      category: 'all',
      distance: 50,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      sort: 'soonest',
      searchQuery: '',
    })];
    
    const catalogEvent = allEvents.find(e => e.id === event.id);
    if (catalogEvent) {
      await markEventInterested(catalogEvent);
      Alert.alert('Interested!', `You'll be notified about ${event.title}`);
    }
  }, [markEventInterested, getNearbyEvents]);

  const handleMarkNotInterested = useCallback(async (event: typeof nearbyEvents[0]) => {
    await markEventNotInterested(event.id);
    console.log('Event marked as not interested:', event.title);
  }, [markEventNotInterested]);

  const handleGetRide = useCallback((promo: PromotionWithDistance) => {
    console.log('Getting ride to:', promo.merchantName);
    Alert.alert('Ride Requested', `Requesting ride to ${promo.merchantName}`);
  }, []);

  const handleClaimPerk = useCallback((promo: PromotionWithDistance) => {
    setSelectedPromo(promo);
    setRedemptionStatus('locked');
    setRedemptionToken(undefined);
    setModalVisible(true);
  }, []);

  const calculatePrice = (distanceMi: number): number => {
    const base = 40;
    const perMile = 1.2;
    const total = base + distanceMi * perMile;
    return Math.round(total / 5) * 5;
  };

  if (locationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Navigation size={48} color="#1E3A8A" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Location Required</Text>
          <Text style={styles.errorText}>
            We need your location to show nearby events and promotions.
          </Text>
          <Pressable style={styles.retryButton} onPress={requestLocation}>
            <Text style={styles.retryButtonText}>Enable Location</Text>
          </Pressable>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Go Out Tonight</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#64748B" />
              <Text style={styles.locationText}>
                {userLocation.granted ? 'Current location' : 'Cleveland, OH (default)'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search events, venues, deals..."
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'promos' && styles.tabActive]}
          onPress={() => setActiveTab('promos')}
        >
          <Text style={[styles.tabText, activeTab === 'promos' && styles.tabTextActive]}>
            Promos
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'events' && styles.tabActive]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
            Events
          </Text>
        </Pressable>
      </View>

      {activeTab === 'promos' && (
        <PromoCarousel
          items={PROMO_CAROUSEL_ITEMS}
          selected={carouselFilter}
          onSelect={setCarouselFilter}
        />
      )}

      {activeTab === 'events' && (
        <View style={styles.eventSourcesRow}>
          <Filter size={16} color="#64748B" />
          <Text style={styles.eventSourcesLabel}>Sources:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventSources}>
            {EVENT_SOURCES.map((source) => (
              <View key={source.id} style={styles.sourceChip}>
                {source.icon === 'ticket' && <Ticket size={12} color="#059669" />}
                {source.icon === 'facebook' && <Facebook size={12} color="#059669" />}
                {source.icon === 'globe' && <Globe size={12} color="#059669" />}
                <Text style={styles.sourceChipText}>{source.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}



      {filterExpanded && (
        <View style={styles.inlineFilterContainer}>
          <View style={styles.inlineFilterContent}>
            {activeTab === 'promos' && (
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Ride+Perk Only</Text>
                <Switch
                  value={ridePerkOnly}
                  onValueChange={setRidePerkOnly}
                  trackColor={{ false: '#E2E8F0', true: '#059669' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            )}

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                <View style={styles.filterChips}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat.value}
                      style={[
                        styles.filterChip,
                        category === cat.value && {
                          backgroundColor: cat.color,
                        },
                      ]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          category === cat.value && styles.filterChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Distance</Text>
              <View style={styles.filterChips}>
                {DISTANCE_OPTIONS.map((dist) => (
                  <Pressable
                    key={dist}
                    style={[
                      styles.filterChip,
                      distance === dist && styles.filterChipActiveAlt,
                    ]}
                    onPress={() => setDistance(dist)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        distance === dist && styles.filterChipTextActiveAlt,
                      ]}
                    >
                      {dist} mi
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Sort by</Text>
              <View style={styles.filterChips}>
                {SORT_OPTIONS.map((s) => (
                  <Pressable
                    key={s.value}
                    style={[
                      styles.filterChip,
                      sort === s.value && styles.filterChipActiveAlt,
                    ]}
                    onPress={() => setSort(s.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        sort === s.value && styles.filterChipTextActiveAlt,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {eventsLoading && activeTab === 'events' ? (
          <View style={styles.loadingContainer}>
            <Navigation size={48} color="#1E3A8A" />
            <Text style={styles.loadingText}>Finding events near you...</Text>
          </View>
        ) : (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {activeTab === 'promos'
                ? `${filteredPromos.length} ${filteredPromos.length === 1 ? 'promo' : 'promos'} found`
                : `${nearbyEvents.length} ${nearbyEvents.length === 1 ? 'event' : 'events'} found`}
            </Text>
          </View>
        )}

        {!eventsLoading && activeTab === 'promos' ? (
          filteredPromos.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#94A3B8" strokeWidth={1.5} />
              <Text style={styles.emptyStateTitle}>No promos found</Text>
              <Text style={styles.emptyStateText}>
                Try adjusting your filters or expanding your search radius.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredPromos.map((promo) => (
                <PromoCard
                  key={promo.id}
                  promo={promo}
                  onGetRide={handleGetRide}
                  onClaim={handleClaimPerk}
                  redemptionStatus="locked"
                />
              ))}
            </View>
          )
        ) : nearbyEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#94A3B8" strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>No events found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your filters or expanding your search radius.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {nearbyEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSave={(e) => handleSaveEvent(e.id, e.title)}
                onInterested={handleMarkInterested}
                onNotInterested={handleMarkNotInterested}
                interestStatus={getEventInterestStatus(event.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <RedemptionModal
        visible={modalVisible}
        promo={selectedPromo}
        status={redemptionStatus}
        token={redemptionToken}
        onClose={() => setModalVisible(false)}
      />

      <View style={styles.bottomToolbar}>
        <Pressable
          style={({ pressed }) => [
            styles.toolbarButton,
            pressed && styles.toolbarButtonPressed,
          ]}
          onPress={() => setFilterExpanded(!filterExpanded)}
        >
          <Filter size={24} color="#1E3A8A" strokeWidth={2} />
          <Text style={styles.toolbarButtonLabel}>Filter</Text>
        </Pressable>
        
        <Pressable
          style={({ pressed }) => [
            styles.toolbarButton,
            pressed && styles.toolbarButtonPressed,
          ]}
          onPress={() => requestLocation()}
        >
          <Navigation size={24} color="#1E3A8A" strokeWidth={2} />
          <Text style={styles.toolbarButtonLabel}>Location</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#64748B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1E3A8A',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1E3A8A',
  },
  eventSourcesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  eventSourcesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  eventSources: {
    gap: 8,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  sourceChipText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#059669',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E3A8A',
    flex: 1,
  },
  filtersSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryScroll: {
    flexGrow: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  filterRow: {
    gap: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActiveAlt: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipTextActiveAlt: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  grid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyState: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  bottomToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  toolbarButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toolbarButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  toolbarButtonLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  inlineFilterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inlineFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  modalCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
});
