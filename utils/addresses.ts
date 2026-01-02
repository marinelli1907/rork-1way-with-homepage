import { Platform } from 'react-native';

export type SavedAddress = {
  id: string;
  label: string;
  line1: string;
  city?: string;
  state?: string;
  zip?: string;
  lat: number;
  lng: number;
};

const STORAGE_KEY = 'oneway.savedAddresses';

export async function loadSavedAddresses(): Promise<SavedAddress[]> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          if (typeof stored !== 'string' || stored.trim() === '' || stored === 'undefined' || stored === 'null' || stored === 'object' || stored === '[object Object]') {
            console.warn('Invalid addresses data type, resetting. Got:', typeof stored, stored?.substring(0, 50));
            localStorage.removeItem(STORAGE_KEY);
            return [];
          }
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed;
          } else {
            console.warn('Invalid addresses data format, resetting. Got:', typeof parsed);
            localStorage.removeItem(STORAGE_KEY);
            return [];
          }
        } catch (parseError) {
          console.error('Failed to parse addresses. Error:', parseError, 'Data type:', typeof stored, 'Data preview:', stored?.substring(0, 100));
          localStorage.removeItem(STORAGE_KEY);
          return [];
        }
      }
    }
    return [];
  } catch (error) {
    console.error('Failed to load saved addresses:', error);
    return [];
  }
}

export async function saveSavedAddresses(addresses: SavedAddress[]): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    }
  } catch (error) {
    console.error('Failed to save addresses:', error);
  }
}

export async function addSavedAddress(address: Omit<SavedAddress, 'id'>): Promise<SavedAddress> {
  const addresses = await loadSavedAddresses();
  const newAddress: SavedAddress = {
    ...address,
    id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  addresses.push(newAddress);
  await saveSavedAddresses(addresses);
  return newAddress;
}

export async function deleteSavedAddress(id: string): Promise<void> {
  const addresses = await loadSavedAddresses();
  const filtered = addresses.filter(a => a.id !== id);
  await saveSavedAddresses(filtered);
}

export function formatAddressShort(address: SavedAddress): string {
  const parts = [address.line1];
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  return parts.join(', ');
}
