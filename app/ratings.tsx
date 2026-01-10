import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Stack } from 'expo-router';
import { Star, ThumbsUp, MessageCircle, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Review = {
  id: string;
  driverName: string;
  rating: number;
  comment: string;
  date: string;
  tripType: string;
};

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    driverName: 'Marcus T.',
    rating: 5,
    comment: 'Great passenger! Very punctual and friendly.',
    date: '2024-01-08',
    tripType: 'Concert',
  },
  {
    id: '2',
    driverName: 'Sarah K.',
    rating: 5,
    comment: 'Pleasant conversation, on time at pickup.',
    date: '2024-01-05',
    tripType: 'Restaurant',
  },
  {
    id: '3',
    driverName: 'James L.',
    rating: 4,
    comment: 'Good passenger overall.',
    date: '2024-01-02',
    tripType: 'Sports Event',
  },
  {
    id: '4',
    driverName: 'Emily R.',
    rating: 5,
    comment: 'Wonderful! Always ready when I arrive.',
    date: '2023-12-28',
    tripType: 'Movie Night',
  },
];

export default function RatingsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');
  const overallRating = 4.8;
  const totalRatings = 127;

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            color={star <= rating ? '#FBBF24' : '#E5E7EB'}
            fill={star <= rating ? '#FBBF24' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  const ratingBreakdown = [
    { stars: 5, count: 98, percentage: 77 },
    { stars: 4, count: 20, percentage: 16 },
    { stars: 3, count: 6, percentage: 5 },
    { stars: 2, count: 2, percentage: 1.5 },
    { stars: 1, count: 1, percentage: 0.5 },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My Ratings',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTitleStyle: { fontWeight: '600', color: '#0F172A' },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.overviewCard}>
          <View style={styles.overviewLeft}>
            <Text style={styles.overviewRating}>{overallRating}</Text>
            {renderStars(Math.round(overallRating), 20)}
            <Text style={styles.overviewCount}>{totalRatings} ratings</Text>
          </View>
          <View style={styles.overviewRight}>
            {ratingBreakdown.map((item) => (
              <View key={item.stars} style={styles.breakdownRow}>
                <Text style={styles.breakdownStars}>{item.stars}</Text>
                <Star size={12} color="#FBBF24" fill="#FBBF24" />
                <View style={styles.breakdownBarContainer}>
                  <View style={[styles.breakdownBar, { width: `${item.percentage}%` }]} />
                </View>
                <Text style={styles.breakdownCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <ThumbsUp size={20} color="#059669" />
            </View>
            <Text style={styles.statValue}>95%</Text>
            <Text style={styles.statLabel}>Positive</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
              <MessageCircle size={20} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>84</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <TrendingUp size={20} color="#D97706" />
            </View>
            <Text style={styles.statValue}>+0.2</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'received' && styles.tabActive]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
              Received
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'given' && styles.tabActive]}
            onPress={() => setActiveTab('given')}
          >
            <Text style={[styles.tabText, activeTab === 'given' && styles.tabTextActive]}>
              Given
            </Text>
          </Pressable>
        </View>

        <View style={styles.reviewsList}>
          {MOCK_REVIEWS.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View>
                  <Text style={styles.reviewerName}>{review.driverName}</Text>
                  <Text style={styles.reviewTripType}>{review.tripType}</Text>
                </View>
                <View style={styles.reviewRating}>
                  {renderStars(review.rating, 14)}
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
              </View>
              {review.comment && (
                <Text style={styles.reviewComment}>&quot;{review.comment}&quot;</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
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
    padding: 16,
    gap: 20,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewLeft: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  overviewRating: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  overviewCount: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  overviewRight: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownStars: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
    width: 12,
  },
  breakdownBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
  },
  breakdownBar: {
    height: 6,
    backgroundColor: '#FBBF24',
    borderRadius: 3,
  },
  breakdownCount: {
    fontSize: 12,
    color: '#94A3B8',
    width: 24,
    textAlign: 'right',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0F172A',
  },
  reviewTripType: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  reviewRating: {
    alignItems: 'flex-end',
    gap: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  reviewComment: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic' as const,
    lineHeight: 20,
  },
});
