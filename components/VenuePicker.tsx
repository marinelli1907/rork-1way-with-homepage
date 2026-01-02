import { MapPin, CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SmartAddResult, Place } from '@/utils/smart-add';

interface VenuePickerProps {
  result: SmartAddResult;
  value?: Place;
  onChange: (place: Place) => void;
}

export default function VenuePicker({ result, value, onChange }: VenuePickerProps) {
  if (!result.ok || result.candidates.length === 0) {
    return null;
  }

  const selectedId = value?.id;

  return (
    <View style={styles.container}>
      {result.primary && (
        <Pressable
          style={[
            styles.venueCard,
            styles.primaryCard,
            selectedId === result.primary.id && styles.selectedCard,
          ]}
          onPress={() => onChange(result.primary!)}
          accessibilityRole="button"
          accessibilityLabel={`Select ${result.primary.name} as venue`}
          accessibilityState={{ selected: selectedId === result.primary.id }}
        >
          <View style={styles.bestMatchBadge}>
            <Text style={styles.bestMatchText}>BEST MATCH</Text>
          </View>
          <View style={styles.cardHeader}>
            <MapPin size={18} color="#0B2A4A" />
            <Text style={styles.venueName}>{result.primary.name}</Text>
            {selectedId === result.primary.id && (
              <CheckCircle2 size={20} color="#0B2A4A" style={styles.checkIcon} />
            )}
          </View>
          {result.primary.address && (
            <Text style={styles.venueAddress} numberOfLines={1}>
              {result.primary.address}
            </Text>
          )}
          <View style={styles.cardFooter}>
            {result.primary.distanceMiles !== undefined && (
              <Text style={styles.distance}>
                {result.primary.distanceMiles.toFixed(1)} mi
              </Text>
            )}
            {result.rideEstimateUSD !== undefined && (
              <Text style={styles.estimate}>
                Est. Ride: ${result.rideEstimateUSD.toFixed(2)}
              </Text>
            )}
          </View>
        </Pressable>
      )}

      {result.candidates.length > 1 && (
        <View style={styles.alternatesSection}>
          <Text style={styles.alternatesLabel}>Alternates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {result.candidates.slice(1).map((candidate) => (
              <Pressable
                key={candidate.id}
                style={[
                  styles.alternateCard,
                  selectedId === candidate.id && styles.selectedCard,
                ]}
                onPress={() => onChange(candidate)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${candidate.name} as venue`}
                accessibilityState={{ selected: selectedId === candidate.id }}
              >
                <Text style={styles.alternateName} numberOfLines={1}>
                  {candidate.name}
                </Text>
                {candidate.distanceMiles !== undefined && (
                  <Text style={styles.alternateDistance}>
                    {candidate.distanceMiles.toFixed(1)} mi
                  </Text>
                )}
                {selectedId === candidate.id && (
                  <CheckCircle2
                    size={16}
                    color="#0B2A4A"
                    style={styles.alternateCheckIcon}
                  />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  venueCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  primaryCard: {
    borderColor: '#0B2A4A',
    backgroundColor: '#EFF6FF',
  },
  selectedCard: {
    backgroundColor: '#DBEAFE',
    borderColor: '#0B2A4A',
  },
  bestMatchBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: '#0B2A4A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  bestMatchText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  venueName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  checkIcon: {
    marginLeft: 'auto' as const,
  },
  venueAddress: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 26,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 26,
    marginTop: 4,
  },
  distance: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#0B2A4A',
  },
  estimate: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#059669',
  },
  alternatesSection: {
    gap: 8,
  },
  alternatesLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  alternateCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    minWidth: 120,
    gap: 4,
  },
  alternateName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  alternateDistance: {
    fontSize: 12,
    color: '#64748B',
  },
  alternateCheckIcon: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
  },
});
