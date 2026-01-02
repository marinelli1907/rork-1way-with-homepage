import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { EventCategory } from '@/types';
import { PromoVenue, getQuickSelectVenues } from '@/utils/promotions';
import { haversineMiles, estimateRide } from '@/utils/smart-add';

interface QuickSelectVenuesProps {
  category: EventCategory;
  userLocation: { lat: number; lng: number };
  onSelect: (venue: PromoVenue) => void;
}

export default function QuickSelectVenues({
  category,
  userLocation,
  onSelect,
}: QuickSelectVenuesProps) {
  const [venues, setVenues] = useState<PromoVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVenues = async () => {
      setLoading(true);
      try {
        const quickSelect = await getQuickSelectVenues(category, userLocation);
        setVenues(quickSelect);
      } catch (error) {
        console.error('Failed to load quick-select venues:', error);
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };

    void loadVenues();
  }, [category, userLocation]);

  if (loading || venues.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quick Select Venue</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {venues.map((venue) => {
          const distance = haversineMiles(userLocation, {
            lat: venue.lat,
            lng: venue.lng,
          });
          const estimate = estimateRide(distance, 1.0);

          return (
            <Pressable
              key={venue.id}
              style={({ pressed }) => [
                styles.venueCard,
                pressed && styles.venueCardPressed,
              ]}
              onPress={() => onSelect(venue)}
            >
              {venue.sponsored && (
                <View style={styles.sponsoredBadge}>
                  <Star size={10} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.sponsoredText}>{venue.badgeText}</Text>
                </View>
              )}
              <View style={styles.venueHeader}>
                <MapPin size={16} color="#0B2A4A" />
                <Text style={styles.venueName} numberOfLines={1}>
                  {venue.name}
                </Text>
              </View>
              <Text style={styles.venueAddress} numberOfLines={2}>
                {venue.address}
              </Text>
              <View style={styles.venueFooter}>
                <Text style={styles.distance}>{distance.toFixed(1)} mi</Text>
                <Text style={styles.estimate}>${estimate.toFixed(2)}</Text>
              </View>
            </Pressable>
          );
        })}
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
  scrollContent: {
    gap: 12,
  },
  venueCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  venueCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  sponsoredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start' as const,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  sponsoredText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#F59E0B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    minHeight: 36,
  },
  venueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
});
