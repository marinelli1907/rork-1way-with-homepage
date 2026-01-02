import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { safeGetItem, safeSetItem } from '@/utils/storage-helpers';

const STORAGE_KEY_AUTH = '@auth_data';

export type UserRole = 'customer' | 'driver';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  createdAt: string;
}

export interface DriverInfo {
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  licensePlate: string;
  licenseNumber: string;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  isAvailable: boolean;
}

interface AuthState {
  user: AuthUser | null;
  driverInfo: DriverInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    driverInfo: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;
    
    const loadAuthData = async () => {
      try {
        const authData = await safeGetItem<AuthState>(STORAGE_KEY_AUTH);
        if (mounted) {
          if (authData) {
            setAuthState({
              ...authData,
              isLoading: false,
            });
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        console.error('Failed to load auth data:', error);
        if (mounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    loadAuthData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const saveAuthData = useCallback(async (data: Partial<AuthState>) => {
    try {
      const newState = { ...authState, ...data };
      await safeSetItem(STORAGE_KEY_AUTH, {
        user: newState.user,
        driverInfo: newState.driverInfo,
        isAuthenticated: newState.isAuthenticated,
        isLoading: false,
      });
      setAuthState(newState);
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  }, [authState]);

  const signIn = useCallback(async (email: string, password: string, role: UserRole) => {
    try {
      console.log('Signing in:', email, role);
      
      const user: AuthUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: email.split('@')[0],
        email,
        role,
        createdAt: new Date().toISOString(),
      };

      let driverInfo: DriverInfo | null = null;

      if (role === 'driver') {
        driverInfo = {
          vehicleType: 'Sedan',
          vehicleMake: 'Toyota',
          vehicleModel: 'Camry',
          vehicleYear: '2020',
          licensePlate: 'ABC-1234',
          licenseNumber: 'DL123456',
          rating: 4.8,
          totalRides: 0,
          totalEarnings: 0,
          isAvailable: true,
        };
      }

      await saveAuthData({
        user,
        driverInfo,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true, user };
    } catch (error) {
      console.error('Sign in failed:', error);
      return { success: false, error: 'Sign in failed' };
    }
  }, [saveAuthData]);

  const signUp = useCallback(async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    driverData?: Partial<DriverInfo>
  ) => {
    try {
      console.log('Signing up:', name, email, role);
      
      const user: AuthUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      };

      let driverInfo: DriverInfo | null = null;

      if (role === 'driver' && driverData) {
        driverInfo = {
          vehicleType: driverData.vehicleType || 'Sedan',
          vehicleMake: driverData.vehicleMake || '',
          vehicleModel: driverData.vehicleModel || '',
          vehicleYear: driverData.vehicleYear || '',
          licensePlate: driverData.licensePlate || '',
          licenseNumber: driverData.licenseNumber || '',
          rating: 5.0,
          totalRides: 0,
          totalEarnings: 0,
          isAvailable: true,
        };
      }

      await saveAuthData({
        user,
        driverInfo,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true, user };
    } catch (error) {
      console.error('Sign up failed:', error);
      return { success: false, error: 'Sign up failed' };
    }
  }, [saveAuthData]);

  const signOut = useCallback(async () => {
    try {
      await saveAuthData({
        user: null,
        driverInfo: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [saveAuthData]);

  const updateDriverInfo = useCallback(async (updates: Partial<DriverInfo>) => {
    if (!authState.driverInfo) return;

    const updatedDriverInfo = { ...authState.driverInfo, ...updates };
    await saveAuthData({
      ...authState,
      driverInfo: updatedDriverInfo,
    });
  }, [authState, saveAuthData]);

  const toggleDriverAvailability = useCallback(async () => {
    if (!authState.driverInfo) return;

    const updatedDriverInfo = {
      ...authState.driverInfo,
      isAvailable: !authState.driverInfo.isAvailable,
    };
    await saveAuthData({
      ...authState,
      driverInfo: updatedDriverInfo,
    });
  }, [authState, saveAuthData]);

  return useMemo(() => ({
    user: authState.user,
    driverInfo: authState.driverInfo,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    signIn,
    signUp,
    signOut,
    updateDriverInfo,
    toggleDriverAvailability,
  }), [authState, signIn, signUp, signOut, updateDriverInfo, toggleDriverAvailability]);
});
