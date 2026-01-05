import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { Home, Briefcase, MapPin, Plus, X } from 'lucide-react-native';
import SmartAddressInput from '@/components/SmartAddressInput';
import {
  SavedAddress,
  loadSavedAddresses,
  addSavedAddress,
  formatAddressShort,
} from '@/utils/addresses';

interface MyAddressesProps {
  onPickAsPickup: (addr: SavedAddress) => void;
  onPickAsVenue: (addr: SavedAddress) => void;
  compact?: boolean;
}

export default function MyAddresses({
  onPickAsPickup,
  onPickAsVenue,
  compact = false,
}: MyAddressesProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState<string>('');
  const [newAddress, setNewAddress] = useState<{ street: string; city: string; state: string; zip: string }>({
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const loaded = await loadSavedAddresses();
      setAddresses(loaded);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    const label = newLabel.trim();
    const street = newAddress.street.trim();
    const city = newAddress.city.trim();
    const state = newAddress.state.trim();
    const zip = newAddress.zip.trim();

    if (!label || !street || !city || !state || !zip) {
      Alert.alert('Error', 'Please enter label, street, city, state, and ZIP');
      return;
    }

    const line1 = `${street}, ${city}, ${state} ${zip}`.trim();

    try {
      const newAddr = await addSavedAddress({
        label,
        line1,
        lat: 41.4993 + Math.random() * 0.1,
        lng: -81.6944 + Math.random() * 0.1,
      });

      setAddresses((prev) => [...prev, newAddr]);
      setNewLabel('');
      setNewAddress({ street: '', city: '', state: '', zip: '' });
      setShowAddForm(false);
      Alert.alert('Success', 'Address added successfully');
    } catch {
      Alert.alert('Error', 'Failed to add address');
    }
  };

  const headerLabel = useMemo(() => (compact ? 'Saved' : 'Saved Addresses'), [compact]);

  const getIconForLabel = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('home')) return <Home size={14} color="#1E3A8A" />;
    if (lower.includes('work')) return <Briefcase size={14} color="#1E3A8A" />;
    return <MapPin size={14} color="#1E3A8A" />;
  };

  const form = (
    <View style={styles.addForm}>
      <View style={styles.addFormHeader}>
        <Text style={styles.addFormTitle}>Add New Address</Text>
        <Pressable
          onPress={() => {
            setShowAddForm(false);
            setNewLabel('');
            setNewAddress({ street: '', city: '', state: '', zip: '' });
          }}
          testID="addressesCloseAddForm"
        >
          <X size={20} color="#64748B" />
        </Pressable>
      </View>
      <TextInput
        style={styles.addFormInput}
        value={newLabel}
        onChangeText={setNewLabel}
        placeholder="Label (e.g., Home, Work, Gym)"
        placeholderTextColor="#94A3B8"
        testID="addressesNewLabel"
      />

      <SmartAddressInput
        value={newAddress}
        onAddressChange={(addr) => setNewAddress(addr)}
        placeholder="Search address"
        hideDetails
        testIDPrefix="addressesLookup"
        style={styles.lookupWrap}
      />

      <View style={styles.fieldGrid}>
        <View style={styles.fieldColFull}>
          <Text style={styles.fieldLabel}>Street</Text>
          <TextInput
            style={styles.fieldInput}
            value={newAddress.street}
            onChangeText={(t) => setNewAddress((prev) => ({ ...prev, street: t }))}
            placeholder="123 Main St"
            placeholderTextColor="#94A3B8"
            autoCapitalize="words"
            testID="addressesStreet"
          />
        </View>

        <View style={styles.fieldCol}>
          <Text style={styles.fieldLabel}>City</Text>
          <TextInput
            style={styles.fieldInput}
            value={newAddress.city}
            onChangeText={(t) => setNewAddress((prev) => ({ ...prev, city: t }))}
            placeholder="City"
            placeholderTextColor="#94A3B8"
            autoCapitalize="words"
            testID="addressesCity"
          />
        </View>

        <View style={styles.fieldCol}>
          <Text style={styles.fieldLabel}>State</Text>
          <TextInput
            style={styles.fieldInput}
            value={newAddress.state}
            onChangeText={(t) => setNewAddress((prev) => ({ ...prev, state: t.toUpperCase() }))}
            placeholder="OH"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            maxLength={2}
            testID="addressesState"
          />
        </View>

        <View style={styles.fieldColFull}>
          <Text style={styles.fieldLabel}>ZIP</Text>
          <TextInput
            style={styles.fieldInput}
            value={newAddress.zip}
            onChangeText={(t) => setNewAddress((prev) => ({ ...prev, zip: t.replace(/[^0-9]/g, '') }))}
            placeholder="44115"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={10}
            testID="addressesZip"
          />
        </View>
      </View>
      <Pressable style={styles.saveButton} onPress={handleAddAddress} testID="addressesSaveNew">
        <Text style={styles.saveButtonText}>Save Address</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>{headerLabel}</Text>
        <Pressable
          style={({ pressed }) => [styles.headerAdd, pressed && styles.headerAddPressed]}
          onPress={() => setShowAddForm(true)}
          testID="addressesHeaderAdd"
        >
          <Plus size={16} color="#1E3A8A" />
          <Text style={styles.headerAddText}>Add</Text>
        </Pressable>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading addresses...</Text>
      ) : addresses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No saved addresses yet.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          testID="addressesScroll"
        >
          {addresses.map((addr) => (
            <View key={addr.id} style={[styles.addressChip, compact && styles.addressChipCompact]}>
              <View style={styles.chipHeader}>
                {getIconForLabel(addr.label)}
                <Text style={styles.chipLabel} numberOfLines={1}>
                  {addr.label}
                </Text>
              </View>
              <Text style={styles.chipAddress} numberOfLines={1}>
                {formatAddressShort(addr)}
              </Text>
              <View style={styles.chipActions}>
                <Pressable
                  style={[styles.chipActionButton, compact && styles.chipActionButtonCompact]}
                  onPress={() => onPickAsPickup(addr)}
                  accessibilityLabel={`Set ${addr.label} as pickup location`}
                  accessibilityRole="button"
                  testID={`addressesPickup_${addr.id}`}
                >
                  <Text style={[styles.chipActionText, compact && styles.chipActionTextCompact]}>Pickup</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.chipActionButton,
                    styles.chipActionButtonVenue,
                    compact && styles.chipActionButtonCompact,
                  ]}
                  onPress={() => onPickAsVenue(addr)}
                  accessibilityLabel={`Set ${addr.label} as venue`}
                  accessibilityRole="button"
                  testID={`addressesVenue_${addr.id}`}
                >
                  <Text style={[styles.chipActionText, styles.chipActionTextVenue, compact && styles.chipActionTextCompact]}>
                    Venue
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {compact ? (
        <Modal
          visible={showAddForm}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddForm(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalSheet}>
              {form}
            </KeyboardAvoidingView>
          </View>
        </Modal>
      ) : (
        showAddForm && form
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  headerAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  headerAddPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  headerAddText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },

  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyState: {
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  scrollContent: {
    gap: 10,
  },
  addressChip: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  addressChipCompact: {
    width: 150,
    padding: 10,
  },
  chipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  chipAddress: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  chipActions: {
    flexDirection: 'row',
    gap: 6,
  },
  chipActionButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  chipActionButtonCompact: {
    paddingVertical: 6,
    borderRadius: 9,
  },
  chipActionButtonVenue: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  chipActionText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  chipActionTextCompact: {
    fontSize: 10,
  },
  chipActionTextVenue: {
    color: '#166534',
  },

  addForm: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    padding: 12,
  },
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addFormTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  addFormInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  lookupWrap: {
    zIndex: 5,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fieldCol: {
    width: '48%',
    gap: 6,
  },
  fieldColFull: {
    width: '100%',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  saveButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
