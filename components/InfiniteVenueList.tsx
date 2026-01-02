import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { EventCategory } from '@/types';
import { fetchVenuesPage, VenueResult } from '@/utils/venues';
import { estimateRide } from '@/utils/smart-add';

interface InfiniteVenueListProps {
  queryCenter: { lat: number; lng: number };
  category?: EventCategory;
  radiusMiles: number;
  onSelect: (venue: VenueResult) => void;
}

const PAGE_LIMIT = 10;

export default function InfiniteVenueList({
  queryCenter,
  category,
  radiusMiles,
  onSelect,
}: InfiniteVenueListProps) {
  const [venues, setVenues] = useState<VenueResult[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadVenues = useCallback(async (pageNum: number, reset = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const results = await fetchVenuesPage({
        center: queryCenter,
        category,
        radiusMiles,
        page: pageNum,
        limit: PAGE_LIMIT,
      });

      if (results.length < PAGE_LIMIT) {
        setHasMore(false);
      }

      setVenues((prev) => (reset ? results : [...prev, ...results]));
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      setLoading(false);
    }
  }, [queryCenter, category, radiusMiles, loading]);

  useEffect(() => {
    setVenues([]);
    setPage(0);
    setHasMore(true);
    void loadVenues(0, true);
  }, [queryCenter.lat, queryCenter.lng, category, radiusMiles]);

  const handleScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;

      if (isNearBottom && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        void loadVenues(nextPage);
      }
    },
    [hasMore, loading, page, loadVenues]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quick Select Venue</Text>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={true}
      >
        {venues.map((venue) => {
          const estimate = estimateRide(venue.distanceMiles, 1.0);
          return (
            <Pressable
              key={venue.id}
              style={({ pressed }) => [
                styles.venueCard,
                pressed && styles.venueCardPressed,
              ]}
              onPress={() => onSelect(venue)}
            >
              <View style={styles.venueHeader}>
                <MapPin size={16} color="#0B2A4A" />
                <Text style={styles.venueName} numberOfLines={1}>
                  {venue.name}
                </Text>
              </View>
              <Text style={styles.venueAddress} numberOfLines={1}>
                {venue.address}
              </Text>
              <View style={styles.venueFooter}>
                <Text style={styles.distance}>{venue.distanceMiles.toFixed(1)} mi</Text>
                <Text style={styles.estimate}>Est. Ride: ${estimate.toFixed(2)}</Text>
              </View>
            </Pressable>
          );
        })}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#0B2A4A" />
            <Text style={styles.loadingText}>Loading more venues...</Text>
          </View>
        )}
        {!hasMore && venues.length > 0 && (
          <View style={styles.endContainer}>
            <Text style={styles.endText}>All venues loaded</Text>
          </View>
        )}
        {venues.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No venues found within {radiusMiles} miles</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 8,
  },
  venueCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  venueCardPressed: {
    opacity: 0.7,
    backgroundColor: '#F6F7F9',
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  venueName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  venueAddress: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 24,
  },
  venueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginLeft: 24,
  },
  distance: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#0B2A4A',
  },
  estimate: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#059669',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#8A8F98',
  },
  endContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  endText: {
    fontSize: 12,
    color: '#8A8F98',
    fontStyle: 'italic' as const,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8A8F98',
    textAlign: 'center',
  },
});
