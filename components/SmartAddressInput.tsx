import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MapPin } from 'lucide-react-native';

interface AddressSuggestion {
  id: string;
  fullAddress: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface SmartAddressInputProps {
  value: AddressComponents;
  onAddressChange: (address: AddressComponents) => void;
  placeholder?: string;
  style?: any;
}

const US_CITIES = [
  { city: 'Cleveland', state: 'OH' },
  { city: 'Lakewood', state: 'OH' },
  { city: 'Parma', state: 'OH' },
  { city: 'Columbus', state: 'OH' },
  { city: 'Cincinnati', state: 'OH' },
  { city: 'Toledo', state: 'OH' },
  { city: 'Akron', state: 'OH' },
  { city: 'Dayton', state: 'OH' },
  { city: 'New York', state: 'NY' },
  { city: 'Los Angeles', state: 'CA' },
  { city: 'Chicago', state: 'IL' },
  { city: 'Houston', state: 'TX' },
  { city: 'Phoenix', state: 'AZ' },
  { city: 'Philadelphia', state: 'PA' },
  { city: 'San Antonio', state: 'TX' },
  { city: 'San Diego', state: 'CA' },
];

const CLEVELAND_STREETS = [
  'Euclid Ave', 'Superior Ave', 'Carnegie Ave', 'Prospect Ave',
  'Ontario St', 'Detroit Ave', 'Lorain Ave', 'Madison Ave',
  'Pearl Rd', 'Cedar Ave', 'St Clair Ave', 'Woodland Ave',
];

const generateSuggestions = (query: string): AddressSuggestion[] => {
  if (!query || query.length < 2) return [];

  const suggestions: AddressSuggestion[] = [];
  const lowerQuery = query.toLowerCase().trim();

  const startsWithNumber = /^\d/.test(query);
  
  if (startsWithNumber) {
    const parts = query.split(' ');
    const streetNumber = parts[0];
    const restOfQuery = parts.slice(1).join(' ').toLowerCase();
    
    CLEVELAND_STREETS.forEach(street => {
      if (restOfQuery === '' || street.toLowerCase().includes(restOfQuery)) {
        US_CITIES.slice(0, 3).forEach(({ city, state }) => {
          const zip = state === 'OH' && city === 'Cleveland' ? '44115' : state === 'OH' ? '44102' : '10001';
          suggestions.push({
            id: `${streetNumber}-${street}-${city}-${state}-${Date.now()}-${Math.random()}`,
            fullAddress: `${streetNumber} ${street}, ${city}, ${state} ${zip}`,
            street: `${streetNumber} ${street}`,
            city,
            state,
            zip,
          });
        });
      }
    });
  } else {
    CLEVELAND_STREETS.forEach(street => {
      if (street.toLowerCase().includes(lowerQuery)) {
        US_CITIES.slice(0, 3).forEach(({ city, state }) => {
          const streetNumber = Math.floor(Math.random() * 9000) + 1000;
          const zip = state === 'OH' && city === 'Cleveland' ? '44115' : state === 'OH' ? '44102' : '10001';
          suggestions.push({
            id: `${streetNumber}-${street}-${city}-${state}-${Date.now()}-${Math.random()}`,
            fullAddress: `${streetNumber} ${street}, ${city}, ${state} ${zip}`,
            street: `${streetNumber} ${street}`,
            city,
            state,
            zip,
          });
        });
      }
    });

    US_CITIES.forEach(({ city, state }) => {
      if (city.toLowerCase().includes(lowerQuery)) {
        CLEVELAND_STREETS.slice(0, 3).forEach(street => {
          const streetNumber = Math.floor(Math.random() * 9000) + 1000;
          const zip = state === 'OH' && city === 'Cleveland' ? '44115' : state === 'OH' ? '44102' : '10001';
          suggestions.push({
            id: `${streetNumber}-${street}-${city}-${state}-${Date.now()}-${Math.random()}`,
            fullAddress: `${streetNumber} ${street}, ${city}, ${state} ${zip}`,
            street: `${streetNumber} ${street}`,
            city,
            state,
            zip,
          });
        });
      }
    });
  }

  return suggestions.slice(0, 5);
};

export default function SmartAddressInput({
  value,
  onAddressChange,
  placeholder = 'Start typing an address...',
  style,
}: SmartAddressInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value.street && value.city && value.state && value.zip) {
      const formatted = `${value.street}, ${value.city}, ${value.state} ${value.zip}`;
      setInputValue(formatted);
    } else if (value.street || value.city || value.state || value.zip) {
      const formatted = [
        value.street,
        value.city,
        value.state,
        value.zip,
      ].filter(Boolean).join(', ');
      setInputValue(formatted);
    }
  }, [value.street, value.city, value.state, value.zip]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    setShowSuggestions(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceTimer.current = setTimeout(() => {
      const newSuggestions = generateSuggestions(text);
      setSuggestions(newSuggestions);
      setIsSearching(false);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.fullAddress);
    onAddressChange({
      street: suggestion.street,
      city: suggestion.city,
      state: suggestion.state,
      zip: suggestion.zip,
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <MapPin size={20} color="#64748B" strokeWidth={2} style={styles.icon} />
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          autoCapitalize="words"
        />
        {isSearching && (
          <ActivityIndicator size="small" color="#1E3A8A" style={styles.loader} />
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <ScrollView 
          style={styles.suggestionsContainer}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.id}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin size={16} color="#64748B" strokeWidth={2} />
              <View style={styles.suggestionTextContainer}>
                <Text style={styles.suggestionText}>{suggestion.fullAddress}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {value.street && value.city && value.state && value.zip && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Street:</Text>
            <Text style={styles.detailValue}>{value.street}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>City:</Text>
            <Text style={styles.detailValue}>{value.city}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>State:</Text>
            <Text style={styles.detailValue}>{value.state}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ZIP:</Text>
            <Text style={styles.detailValue}>{value.zip}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  loader: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    color: '#1E293B',
  },
  detailsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
});
