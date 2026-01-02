import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Coupon, CouponUsage, AppliedCoupon } from '@/types';
import { safeGetItem, safeSetItem } from '@/utils/storage-helpers';

const STORAGE_KEY_COUPONS = '@coupons';
const STORAGE_KEY_COUPON_USAGE = '@coupon_usage';

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coupon_welcome',
    code: 'WELCOME50',
    type: 'percentage',
    value: 50,
    description: '50% off your first ride',
    minRideAmount: 0,
    maxDiscount: 25,
    usageLimit: 1,
    usageCount: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    firstRideOnly: true,
  },
  {
    id: 'coupon_save20',
    code: 'SAVE20',
    type: 'fixed_amount',
    value: 20,
    description: '$20 off any ride',
    minRideAmount: 40,
    usageLimit: 1,
    usageCount: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'coupon_airport',
    code: 'AIRPORT15',
    type: 'percentage',
    value: 15,
    description: '15% off airport rides',
    minRideAmount: 50,
    maxDiscount: 30,
    usageLimit: 3,
    usageCount: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'coupon_cavaliers',
    code: 'CAVS2025',
    type: 'fixed_amount',
    value: 10,
    description: '$10 off Cavaliers games',
    minRideAmount: 30,
    usageLimit: 5,
    usageCount: 0,
    status: 'active',
    expiresAt: new Date('2025-06-30').toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: 'system',
  },
];

export const [CouponProvider, useCoupons] = createContextHook(() => {
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [couponUsage, setCouponUsage] = useState<CouponUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        const [couponsData, usageData] = await Promise.all([
          safeGetItem<Coupon[]>(STORAGE_KEY_COUPONS),
          safeGetItem<CouponUsage[]>(STORAGE_KEY_COUPON_USAGE),
        ]);

        if (mounted) {
          if (couponsData && Array.isArray(couponsData)) {
            setCoupons(couponsData);
          } else {
            await safeSetItem(STORAGE_KEY_COUPONS, INITIAL_COUPONS);
          }

          if (usageData && Array.isArray(usageData)) {
            setCouponUsage(usageData);
          }
        }
      } catch (error) {
        console.error('Failed to load coupon data:', error);
      }
    };

    loadData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const saveCoupons = async (newCoupons: Coupon[]) => {
    try {
      await safeSetItem(STORAGE_KEY_COUPONS, newCoupons);
      setCoupons(newCoupons);
    } catch (error) {
      console.error('Failed to save coupons:', error);
    }
  };

  const saveCouponUsage = async (newUsage: CouponUsage[]) => {
    try {
      await safeSetItem(STORAGE_KEY_COUPON_USAGE, newUsage);
      setCouponUsage(newUsage);
    } catch (error) {
      console.error('Failed to save coupon usage:', error);
    }
  };

  const addCoupon = useCallback(async (couponData: Omit<Coupon, 'id' | 'createdAt' | 'usageCount'>) => {
    const existingCoupon = coupons.find(c => c.code.toUpperCase() === couponData.code.toUpperCase());
    if (existingCoupon) {
      throw new Error('Coupon code already exists');
    }

    const newCoupon: Coupon = {
      ...couponData,
      id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: couponData.code.toUpperCase(),
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedCoupons = [...coupons, newCoupon];
    await saveCoupons(updatedCoupons);
    return newCoupon;
  }, [coupons]);

  const updateCoupon = useCallback(async (couponId: string, updates: Partial<Coupon>) => {
    const updatedCoupons = coupons.map(c => {
      if (c.id === couponId) {
        return { ...c, ...updates };
      }
      return c;
    });
    await saveCoupons(updatedCoupons);
  }, [coupons]);

  const deleteCoupon = useCallback(async (couponId: string) => {
    const updatedCoupons = coupons.filter(c => c.id !== couponId);
    await saveCoupons(updatedCoupons);
  }, [coupons]);

  const validateCoupon = useCallback((
    code: string,
    userId: string,
    rideAmount: number,
    venue?: string,
    isFirstRide?: boolean
  ): { valid: boolean; error?: string; coupon?: Coupon } => {
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());

    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    if (coupon.status === 'disabled') {
      return { valid: false, error: 'This coupon is no longer available' };
    }

    if (coupon.status === 'expired') {
      return { valid: false, error: 'This coupon has expired' };
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, error: 'This coupon has expired' };
    }

    if (coupon.firstRideOnly && !isFirstRide) {
      return { valid: false, error: 'This coupon is only valid for first-time riders' };
    }

    if (coupon.validForUserIds && !coupon.validForUserIds.includes(userId)) {
      return { valid: false, error: 'This coupon is not valid for your account' };
    }

    if (coupon.excludedVenues && venue && coupon.excludedVenues.includes(venue)) {
      return { valid: false, error: 'This coupon is not valid for this venue' };
    }

    if (coupon.minRideAmount && rideAmount < coupon.minRideAmount) {
      return { 
        valid: false, 
        error: `Minimum ride amount is $${coupon.minRideAmount.toFixed(2)}` 
      };
    }

    const userUsageCount = couponUsage.filter(
      usage => usage.couponId === coupon.id && usage.userId === userId
    ).length;

    if (coupon.usageLimit && userUsageCount >= coupon.usageLimit) {
      return { valid: false, error: 'You have already used this coupon' };
    }

    return { valid: true, coupon };
  }, [coupons, couponUsage]);

  const calculateDiscount = useCallback((coupon: Coupon, rideAmount: number): number => {
    let discount = 0;

    if (coupon.type === 'percentage') {
      discount = (rideAmount * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else if (coupon.type === 'fixed_amount') {
      discount = Math.min(coupon.value, rideAmount);
    } else if (coupon.type === 'first_ride_free') {
      discount = rideAmount;
    }

    return Math.round(discount * 100) / 100;
  }, []);

  const applyCoupon = useCallback((
    code: string,
    userId: string,
    rideAmount: number,
    venue?: string,
    isFirstRide?: boolean
  ): AppliedCoupon | { error: string } => {
    const validation = validateCoupon(code, userId, rideAmount, venue, isFirstRide);

    if (!validation.valid || !validation.coupon) {
      return { error: validation.error || 'Invalid coupon' };
    }

    const discountAmount = calculateDiscount(validation.coupon, rideAmount);
    const finalAmount = Math.max(0, rideAmount - discountAmount);

    return {
      coupon: validation.coupon,
      discountAmount,
      finalAmount,
    };
  }, [validateCoupon, calculateDiscount]);

  const recordCouponUsage = useCallback(async (
    couponId: string,
    userId: string,
    rideId: string,
    discountAmount: number
  ) => {
    const newUsage: CouponUsage = {
      id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      couponId,
      userId,
      rideId,
      discountAmount,
      appliedAt: new Date().toISOString(),
    };

    const updatedUsage = [...couponUsage, newUsage];
    await saveCouponUsage(updatedUsage);

    const updatedCoupons = coupons.map(c => {
      if (c.id === couponId) {
        return { ...c, usageCount: c.usageCount + 1 };
      }
      return c;
    });
    await saveCoupons(updatedCoupons);
  }, [couponUsage, coupons]);

  const getCouponByCode = useCallback((code: string): Coupon | null => {
    return coupons.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
  }, [coupons]);

  const getActiveCoupons = useCallback((): Coupon[] => {
    return coupons.filter(c => {
      if (c.status !== 'active') return false;
      if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
      if (c.usageLimit && c.usageCount >= c.usageLimit) return false;
      return true;
    });
  }, [coupons]);

  const getUserCouponUsage = useCallback((userId: string, couponId: string): number => {
    return couponUsage.filter(
      usage => usage.userId === userId && usage.couponId === couponId
    ).length;
  }, [couponUsage]);

  const hasUserCompletedRide = useCallback((userId: string): boolean => {
    return couponUsage.some(usage => usage.userId === userId);
  }, [couponUsage]);

  return useMemo(() => ({
    coupons,
    couponUsage,
    isLoading,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    calculateDiscount,
    applyCoupon,
    recordCouponUsage,
    getCouponByCode,
    getActiveCoupons,
    getUserCouponUsage,
    hasUserCompletedRide,
  }), [
    coupons,
    couponUsage,
    isLoading,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    calculateDiscount,
    applyCoupon,
    recordCouponUsage,
    getCouponByCode,
    getActiveCoupons,
    getUserCouponUsage,
    hasUserCompletedRide,
  ]);
});
