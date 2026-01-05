import AsyncStorage from '@react-native-async-storage/async-storage';

export async function safeGetItem<T>(key: string): Promise<T | null> {
  try {
    const item = await AsyncStorage.getItem(key);
    
    if (!item) {
      return null;
    }
    
    if (typeof item !== 'string') {
      console.warn(`[Storage] Invalid data type for key ${key}, expected string but got ${typeof item}`);
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    const trimmed = item.trim();
    
    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
      console.warn(`[Storage] Empty/invalid data for key ${key}`);
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('"') && !trimmed.match(/^[0-9]/) && trimmed !== 'true' && trimmed !== 'false') {
      console.error(`[Storage] Invalid JSON format for key ${key}: "${trimmed.substring(0, 50)}..."`);
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    try {
      const parsed = JSON.parse(trimmed);
      return parsed as T;
    } catch (parseError) {
      console.error(`[Storage] JSON parse failed for key ${key}:`, parseError);
      console.error(`[Storage] Data preview (first 200 chars):`, trimmed.substring(0, 200));
      console.error(`[Storage] Error message:`, parseError instanceof Error ? parseError.message : String(parseError));
      await AsyncStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.error(`[Storage] Failed to get item for key ${key}:`, error);
    return null;
  }
}

function getCircularReplacer() {
  const seen = new WeakSet();
  return (_key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
}

export async function safeSetItem<T>(key: string, value: T): Promise<boolean> {
  try {
    if (value === null || value === undefined) {
      console.warn(`[Storage] Attempted to save null/undefined for key ${key}`);
      return false;
    }
    
    let stringified: string;
    try {
      stringified = JSON.stringify(value, getCircularReplacer());
    } catch (stringifyError) {
      console.error(`[Storage] JSON stringify failed for key ${key}:`, stringifyError);
      console.error(`[Storage] Value type:`, typeof value);
      console.error(`[Storage] Value preview:`, String(value).substring(0, 100));
      return false;
    }
    
    if (!stringified || stringified === 'undefined' || stringified === 'null') {
      console.error(`[Storage] Invalid stringified result for key ${key}: ${stringified}`);
      return false;
    }
    
    try {
      JSON.parse(stringified);
    } catch (validateError) {
      console.error(`[Storage] Stringified data is not valid JSON for key ${key}:`, validateError);
      return false;
    }
    
    await AsyncStorage.setItem(key, stringified);
    console.log(`[Storage] Successfully saved ${key} (${stringified.length} chars)`);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to set item for key ${key}:`, error);
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
