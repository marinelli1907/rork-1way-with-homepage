import AsyncStorage from '@react-native-async-storage/async-storage';

export async function safeGetItem<T>(key: string): Promise<T | null> {
  try {
    const item = await AsyncStorage.getItem(key);
    
    if (!item) {
      return null;
    }
    
    if (typeof item !== 'string') {
      console.warn(`Invalid data type for key ${key}, expected string but got ${typeof item}`);
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    const trimmed = item.trim();
    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null' || !trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('"')) {
      console.warn(`Invalid data for key ${key}: "${trimmed.substring(0, 50)}..."`);
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    try {
      const parsed = JSON.parse(trimmed);
      return parsed as T;
    } catch (parseError) {
      console.error(`Failed to parse data for key ${key}:`, parseError);
      console.error('Data preview:', trimmed.substring(0, 100));
      console.error('Parse error details:', parseError instanceof Error ? parseError.message : String(parseError));
      await AsyncStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.error(`Failed to get item for key ${key}:`, error);
    return null;
  }
}

export async function safeSetItem<T>(key: string, value: T): Promise<boolean> {
  try {
    if (value === null || value === undefined) {
      console.warn(`Attempted to save null/undefined for key ${key}`);
      return false;
    }
    
    const stringified = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringified);
    return true;
  } catch (error) {
    console.error(`Failed to set item for key ${key}:`, error);
    return false;
  }
}

export async function clearStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
    console.log('Storage cleared successfully');
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}
