import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { MapPin, Clock, Star, Car } from 'lucide-react-native';
import { PromotionWithDistance } from '@/types';

interface PromoCardProps {
  promo: PromotionWithDistance;
  onGetRide: (promo: PromotionWithDistance) => void;
  onClaim: (promo: PromotionWithDistance) => void;
  redemptionStatus?: 'locked' | 'unlocked' | 'redeemed';
}

export function PromoCard({ promo, onGetRide, onClaim, redemptionStatus = 'locked' }: PromoCardProps) {
  const getPerkLabel = () => {
    switch (promo.perkType) {
      case 'free_item':
        return 'Free Item';
      case 'percent_off':
        return `${promo.perkValue}% Off`;
      case 'dollar_off':
        return `$${promo.perkValue} Off`;
      case 'appetizer':
        return 'Free Appetizer';
      case 'drink':
        return 'Free Drink';
      default:
        return 'Perk';
    }
  };

  const getTimeWindow = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (promo.daysOfWeek.length === 7) {
      return `Daily ${promo.startHour}:00-${promo.endHour}:00`;
    }
    const dayLabels = promo.daysOfWeek.map(d => days[d]).join(', ');
    return `${dayLabels} · ${promo.startHour}:00-${promo.endHour}:00`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {promo.merchantLogo && promo.merchantLogo.trim() !== '' ? (
          <Image source={{ uri: promo.merchantLogo }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Text style={styles.logoText}>{promo.merchantName[0]}</Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.merchantName} numberOfLines={1}>
              {promo.merchantName}
            </Text>
            {promo.sponsored && (
              <View style={styles.sponsoredBadge}>
                <Star size={10} color="#EA580C" fill="#EA580C" />
                <Text style={styles.sponsoredText}>Sponsored</Text>
              </View>
            )}
          </View>
          <View style={styles.addressRow}>
            <MapPin size={12} color="#64748B" />
            <Text style={styles.address} numberOfLines={1}>
              {promo.address}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.perkSection}>
        <View style={styles.perkBadge}>
          <Text style={styles.perkLabel}>{getPerkLabel()}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {promo.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {promo.description}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Clock size={14} color="#64748B" />
          <Text style={styles.metaText} numberOfLines={1}>
            {getTimeWindow()}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.distanceBadge}>
          <MapPin size={12} color="#059669" />
          <Text style={styles.distanceText}>{promo.distance.toFixed(1)} mi</Text>
        </View>
        <View style={styles.fareBadge}>
          <Car size={12} color="#1E3A8A" />
          <Text style={styles.fareText}>Est. ${promo.rideFare}</Text>
        </View>
        {promo.tags.slice(0, 1).map((tag) => (
          <View key={tag} style={styles.tagBadge}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {promo.fineprint && (
        <Text style={styles.fineprint} numberOfLines={1}>
          {promo.fineprint}
        </Text>
      )}

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => onGetRide(promo)}
        >
          <Car size={16} color="#1E3A8A" strokeWidth={2} />
          <Text style={styles.buttonSecondaryText}>Get Ride</Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            styles.buttonPrimary,
            redemptionStatus === 'unlocked' && styles.buttonUnlocked,
            redemptionStatus === 'redeemed' && styles.buttonRedeemed,
          ]}
          onPress={() => onClaim(promo)}
          disabled={redemptionStatus === 'locked' || redemptionStatus === 'redeemed'}
        >
          <Text
            style={[
              styles.buttonPrimaryText,
              redemptionStatus === 'redeemed' && styles.buttonRedeemedText,
            ]}
          >
            {redemptionStatus === 'locked' && 'Claim Perk'}
            {redemptionStatus === 'unlocked' && 'Unlock Perk'}
            {redemptionStatus === 'redeemed' && 'Redeemed'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  logoPlaceholder: {
    backgroundColor: '#E31937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  merchantName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1E293B',
    flex: 1,
  },
  sponsoredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF7ED',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  sponsoredText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#EA580C',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  perkSection: {
    gap: 6,
  },
  perkBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#059669',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  perkLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  metaRow: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#059669',
  },
  fareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  fareText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  tagBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  fineprint: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic' as const,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonPrimary: {
    backgroundColor: '#E31937',
  },
  buttonUnlocked: {
    backgroundColor: '#059669',
  },
  buttonRedeemed: {
    backgroundColor: '#94A3B8',
  },
  buttonSecondary: {
    backgroundColor: '#EFF6FF',
  },
  buttonPrimaryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  buttonRedeemedText: {
    color: '#FFFFFF',
  },
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
});
