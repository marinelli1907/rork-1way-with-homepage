import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Tag, X, Check } from 'lucide-react-native';
import { useCoupons } from '@/providers/CouponProvider';
import { AppliedCoupon } from '@/types';

interface CouponInputProps {
  userId: string;
  rideAmount: number;
  venue?: string;
  isFirstRide?: boolean;
  onCouponApplied: (appliedCoupon: AppliedCoupon) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: AppliedCoupon | null;
}

export default function CouponInput({
  userId,
  rideAmount,
  venue,
  isFirstRide,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}: CouponInputProps) {
  const { applyCoupon } = useCoupons();
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setIsValidating(true);
    setError('');

    setTimeout(() => {
      const result = applyCoupon(couponCode.trim(), userId, rideAmount, venue, isFirstRide);

      if ('error' in result) {
        setError(result.error);
        setIsValidating(false);
      } else {
        onCouponApplied(result);
        setCouponCode('');
        setError('');
        setIsValidating(false);
      }
    }, 300);
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCouponCode('');
    setError('');
  };

  if (appliedCoupon) {
    return (
      <View style={styles.appliedContainer}>
        <View style={styles.appliedHeader}>
          <View style={styles.appliedIconContainer}>
            <Check size={20} color="#FFFFFF" strokeWidth={3} />
          </View>
          <View style={styles.appliedContent}>
            <Text style={styles.appliedCode}>{appliedCoupon.coupon.code}</Text>
            <Text style={styles.appliedDescription}>{appliedCoupon.coupon.description}</Text>
          </View>
          <View style={styles.appliedDiscount}>
            <Text style={styles.appliedDiscountText}>
              -${appliedCoupon.discountAmount.toFixed(2)}
            </Text>
          </View>
        </View>
        <Pressable style={styles.removeButton} onPress={handleRemoveCoupon}>
          <X size={16} color="#DC2626" />
          <Text style={styles.removeButtonText}>Remove</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Tag size={18} color="#1E3A8A" />
        <Text style={styles.headerText}>Have a coupon code?</Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={couponCode}
            onChangeText={(text) => {
              setCouponCode(text.toUpperCase());
              setError('');
            }}
            placeholder="Enter code"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isValidating}
          />
          <Pressable
            style={[styles.applyButton, isValidating && styles.applyButtonDisabled]}
            onPress={handleApplyCoupon}
            disabled={isValidating}
          >
            {isValidating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyButtonText}>Apply</Text>
            )}
          </Pressable>
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  inputContainer: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  applyButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500' as const,
  },
  appliedContainer: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#059669',
  },
  appliedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  appliedIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appliedContent: {
    flex: 1,
  },
  appliedCode: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 2,
  },
  appliedDescription: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  appliedDiscount: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  appliedDiscountText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
});
