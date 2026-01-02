import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, Pressable } from 'react-native';

interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  ctaText?: string;
  onPress?: () => void;
}

const ADS: Ad[] = [
  {
    id: '1',
    title: 'Save 20% on your next event!',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format',
    ctaText: 'Book Now',
  },
  {
    id: '2',
    title: 'Exclusive VIP experiences available',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format',
    ctaText: 'View Deals',
  },
  {
    id: '3',
    title: 'Group discounts for 5+ people',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format',
    ctaText: 'Learn More',
  },
  {
    id: '4',
    title: 'Free ride for first-time users',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format',
    ctaText: 'Claim Offer',
  },
];

const ROTATION_INTERVAL = 5000;

export default function RotatingAdHeader() {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ADS.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  const currentAd = ADS[currentAdIndex];

  return (
    <Pressable
      style={styles.container}
      onPress={currentAd.onPress}
    >
      <Animated.View style={[styles.adContent, { opacity: fadeAnim }]}>
        <Image
          source={{ uri: currentAd.imageUrl }}
          style={styles.adImage}
          resizeMode="cover"
        />
        <View style={styles.adOverlay}>
          <Text style={styles.adTitle} numberOfLines={2}>
            {currentAd.title}
          </Text>
          {currentAd.ctaText && (
            <View style={styles.ctaBadge}>
              <Text style={styles.ctaText}>{currentAd.ctaText}</Text>
            </View>
          )}
        </View>
      </Animated.View>
      
      <View style={styles.dotsContainer}>
        {ADS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentAdIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    borderRadius: 12,
  },
  adContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  adOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginRight: 12,
  },
  ctaBadge: {
    backgroundColor: '#E31937',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
});
