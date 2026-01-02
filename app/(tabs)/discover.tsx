import { useRouter } from 'expo-router';
import {
  Plus,
  MapPinned,
  Heart,
  Search,
  Navigation,
  Calendar,
  Film,
  Utensils,
  Star,
} from 'lucide-react-native';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { useEvents } from '@/providers/EventsProvider';
import { EventCategory, CatalogEventWithDistance } from '@/types';
import EventDiscoveryCard from '@/components/EventDiscoveryCard';
import RadiusSlider from '@/components/RadiusSlider';
import RotatingAdHeader from '@/components/RotatingAdHeader';
import { NOW_PLAYING_MOVIES } from '@/constants/movies';
import { CLEVELAND_RESTAURANTS } from '@/constants/restaurants';

type DiscoveryMode = 'events' | 'movies' | 'restaurants';

export default function DiscoverScreen() {
  const router = useRouter();
  const {
    getEventInterestStatus,
    userLocation,
    locationLoading,
    requestLocation,
    getNearbyEvents,
    discoverNearbyEvents,
    eventsLoading,
  } = useEvents();

  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [discoveredEvents, setDiscoveredEvents] = useState<CatalogEventWithDistance[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [searchDistance, setSearchDistance] = useState(25);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [customLocationSearch, setCustomLocationSearch] = useState('');

  useEffect(() => {
    if (!userLocation) {
      requestLocation();
    }
  }, [userLocation, requestLocation]);

  useEffect(() => {
    if (userLocation) {
      handleDiscoverEvents();
    }
  }, [userLocation, selectedCategory, searchDistance]);

  const handleDiscoverEvents = async () => {
    if (!userLocation || isDiscovering) return;

    setIsDiscovering(true);
    try {
      const startDate = new Date().toISOString();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      await discoverNearbyEvents({
        category: selectedCategory,
        distance: searchDistance as any,
        startDate,
        endDate: endDate.toISOString(),
        sort: 'soonest',
        searchQuery,
      });

      const events = getNearbyEvents({
        category: selectedCategory,
        distance: searchDistance as any,
        startDate,
        endDate: endDate.toISOString(),
        sort: 'soonest',
        searchQuery,
      });

      setDiscoveredEvents(events);
      console.log(`Found ${events.length} events`);
    } catch (error) {
      console.error('Failed to discover events:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  const filteredMovies = useMemo(() => {
    return NOW_PLAYING_MOVIES.filter(movie => 
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const filteredRestaurants = useMemo(() => {
    return CLEVELAND_RESTAURANTS.filter(restaurant =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
      <View style={styles.header}>
        <RotatingAdHeader />
      </View>

      <View style={styles.modeSelector}>
        <Pressable
          style={[styles.modeButton, discoveryMode === 'events' && styles.modeButtonActive]}
          onPress={() => setDiscoveryMode('events')}
        >
          <Calendar size={20} color={discoveryMode === 'events' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.modeButtonText, discoveryMode === 'events' && styles.modeButtonTextActive]}>
            Events
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeButton, discoveryMode === 'movies' && styles.modeButtonActive]}
          onPress={() => setDiscoveryMode('movies')}
        >
          <Film size={20} color={discoveryMode === 'movies' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.modeButtonText, discoveryMode === 'movies' && styles.modeButtonTextActive]}>
            Movies
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeButton, discoveryMode === 'restaurants' && styles.modeButtonActive]}
          onPress={() => setDiscoveryMode('restaurants')}
        >
          <Utensils size={20} color={discoveryMode === 'restaurants' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.modeButtonText, discoveryMode === 'restaurants' && styles.modeButtonTextActive]}>
            Dining
          </Text>
        </Pressable>
      </View>

      {discoveryMode === 'events' && (
      <View style={styles.discoverHeader}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#64748B" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleDiscoverEvents}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {(['all', 'sports', 'concert', 'comedy', 'theater', 'art', 'food', 'nightlife', 'family', 'festival', 'conference', 'community', 'holiday', 'general'] as const).map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.distanceSliderContainer}>
          <RadiusSlider value={searchDistance} onChange={setSearchDistance} />
        </View>

        <View style={styles.actionBar}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => setShowLocationModal(true)}
          >
            <MapPinned size={18} color="#1E3A8A" strokeWidth={2} />
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
              showFavoritesOnly && styles.actionButtonActive,
            ]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Heart size={18} color={showFavoritesOnly ? "#DC2626" : "#1E3A8A"} strokeWidth={2} fill={showFavoritesOnly ? "#DC2626" : "none"} />
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.actionButtonPrimary, pressed && styles.actionButtonPressed]}
            onPress={() => router.push('/create-event')}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </View>
      </View>
      )}

      {discoveryMode === 'events' && (isDiscovering || eventsLoading || locationLoading) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>
            {locationLoading ? 'Getting your location...' : 'Discovering events nearby...'}
          </Text>
        </View>
      ) : null}

      {discoveryMode === 'events' && !(isDiscovering || eventsLoading || locationLoading) && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {discoveredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No events found</Text>
              <Text style={styles.emptyStateText}>
                Try adjusting your filters or search in a different area
              </Text>
              <Pressable
                style={styles.refreshButton}
                onPress={handleDiscoverEvents}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </Pressable>
            </View>
          ) : (
            discoveredEvents
              .filter(event => {
                if (!showFavoritesOnly) return true;
                return getEventInterestStatus(event.id) === 'interested';
              })
              .map((event) => (
                <EventDiscoveryCard
                  key={event.id}
                  event={event}
                  distance={event.distance}
                />
              ))
          )}
        </ScrollView>
      )}

      {discoveryMode === 'movies' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchContainer}>
            <Search size={18} color="#64748B" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search movies..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {filteredMovies.map((movie) => (
            <Pressable
              key={movie.id}
              style={styles.movieCard}
              onPress={() => router.push(`/movie/${movie.id}`)}
            >
              <Image source={{ uri: movie.posterUrl }} style={styles.moviePoster} />
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.movieGenre}>{movie.genre.join(', ')}</Text>
                <View style={styles.movieMeta}>
                  <Text style={styles.movieRating}>{movie.rating}</Text>
                  <Text style={styles.movieDuration}>{movie.duration} min</Text>
                </View>
                <Text style={styles.movieDescription} numberOfLines={2}>
                  {movie.description}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {discoveryMode === 'restaurants' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchContainer}>
            <Search size={18} color="#64748B" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search restaurants..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {filteredRestaurants.map((restaurant) => (
            <Pressable
              key={restaurant.id}
              style={styles.restaurantCard}
              onPress={() => router.push(`/restaurant/${restaurant.id}`)}
            >
              <Image source={{ uri: restaurant.imageUrl }} style={styles.restaurantImage} />
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <View style={styles.restaurantMeta}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.restaurantRating}>{restaurant.rating}</Text>
                  <Text style={styles.restaurantPrice}>{restaurant.priceRange}</Text>
                </View>
                <Text style={styles.restaurantCuisine}>{restaurant.cuisine.join(', ')}</Text>
                <Text style={styles.restaurantDescription} numberOfLines={2}>
                  {restaurant.description}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {discoveryMode === 'events' && showLocationModal && (
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setShowLocationModal(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Location</Text>
            <Text style={styles.modalSubtitle}>
              Search for events in a different area
            </Text>
            
            <View style={styles.locationOptions}>
              <Pressable
                style={({ pressed }) => [
                  styles.locationOption,
                  pressed && styles.locationOptionPressed,
                ]}
                onPress={async () => {
                  await requestLocation();
                  setShowLocationModal(false);
                  handleDiscoverEvents();
                }}
              >
                <Navigation size={20} color="#1E3A8A" strokeWidth={2} />
                <Text style={styles.locationOptionText}>Use Current Location</Text>
              </Pressable>

              <View style={styles.searchLocationContainer}>
                <TextInput
                  style={styles.locationSearchInput}
                  placeholder="Enter city, address, or zip code"
                  placeholderTextColor="#94A3B8"
                  value={customLocationSearch}
                  onChangeText={setCustomLocationSearch}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.searchLocationButton,
                    pressed && styles.searchLocationButtonPressed,
                    !customLocationSearch && styles.searchLocationButtonDisabled,
                  ]}
                  onPress={() => {
                    Alert.alert(
                      'Coming Soon',
                      'Custom location search will be available soon. For now, you can use your current location.',
                      [{ text: 'OK' }]
                    );
                  }}
                  disabled={!customLocationSearch}
                >
                  <Text style={styles.searchLocationButtonText}>Search</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && styles.modalCloseButtonPressed,
              ]}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  discoverHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryScrollContent: {
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  distanceSliderContainer: {
    marginTop: 4,
    paddingVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
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
  refreshButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    gap: 6,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#E31937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  actionButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
  },
  locationOptions: {
    gap: 16,
    marginBottom: 20,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationOptionPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  locationOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  searchLocationContainer: {
    gap: 12,
  },
  locationSearchInput: {
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchLocationButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchLocationButtonPressed: {
    opacity: 0.8,
  },
  searchLocationButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  searchLocationButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  modalCloseButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseButtonPressed: {
    opacity: 0.7,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modeButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  moviePoster: {
    width: 100,
    height: 150,
    backgroundColor: '#E2E8F0',
  },
  movieInfo: {
    flex: 1,
    padding: 12,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  movieGenre: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  movieMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  movieRating: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
  },
  movieDuration: {
    fontSize: 12,
    color: '#64748B',
  },
  movieDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  restaurantImage: {
    width: 100,
    height: 120,
    backgroundColor: '#E2E8F0',
  },
  restaurantInfo: {
    flex: 1,
    padding: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  restaurantRating: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  restaurantPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#059669',
    marginLeft: 4,
  },
  restaurantCuisine: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  restaurantDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});
