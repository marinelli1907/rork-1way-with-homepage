import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Home, Briefcase, MapPin, Plus, X } from 'lucide-react-native';
import {
  SavedAddress,
  loadSavedAddresses,
  addSavedAddress,
  formatAddressShort,
} from '@/utils/addresses';

interface MyAddressesProps {
  onPickAsPickup: (addr: SavedAddress) => void;
  onPickAsVenue: (addr: SavedAddress) => void;
}

export default function MyAddresses({
  onPickAsPickup,
  onPickAsVenue,
}: MyAddressesProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');

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
    if (!newLabel.trim() || !newAddress.trim()) {
      Alert.alert('Error', 'Please enter both label and address');
      return;
    }

    try {
      const newAddr = await addSavedAddress({
        label: newLabel.trim(),
        line1: newAddress.trim(),
        lat: 41.4993 + Math.random() * 0.1,
        lng: -81.6944 + Math.random() * 0.1,
      });

      setAddresses((prev) => [...prev, newAddr]);
      setNewLabel('');
      setNewAddress('');
      setShowAddForm(false);
      Alert.alert('Success', 'Address added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add address');
    }
  };



  const getIconForLabel = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('home')) return <Home size={14} color="#1E3A8A" />;
    if (lower.includes('work')) return <Briefcase size={14} color="#1E3A8A" />;
    return <MapPin size={14} color="#1E3A8A" />;
  };

  return (
    <View style={styles.container}>

      {loading ? (
        <Text style={styles.loadingText}>Loading addresses...</Text>
      ) : addresses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No saved addresses yet.</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <Plus size={16} color="#1E3A8A" />
            <Text style={styles.addButtonText}>Add Address</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {addresses.map((addr) => (
              <View
                key={addr.id}
                style={styles.addressChip}
              >
                <View style={styles.chipHeader}>
                  {getIconForLabel(addr.label)}
                  <Text
                    style={styles.chipLabel}
                    numberOfLines={1}
                  >
                    {addr.label}
                  </Text>
                </View>
                <Text
                  style={styles.chipAddress}
                  numberOfLines={1}
                >
                  {addr.line1}
                </Text>
                <View style={styles.chipActions}>
                  <Pressable
                    style={styles.chipActionButton}
                    onPress={() => onPickAsPickup(addr)}
                    accessibilityLabel={`Set ${addr.label} as pickup location`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.chipActionText}>Pickup</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.chipActionButton, styles.chipActionButtonVenue]}
                    onPress={() => onPickAsVenue(addr)}
                    accessibilityLabel={`Set ${addr.label} as venue`}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.chipActionText, styles.chipActionTextVenue]}>Venue</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable
              style={styles.addChip}
              onPress={() => setShowAddForm(true)}
            >
              <Plus size={20} color="#64748B" />
              <Text style={styles.addChipText}>Add</Text>
            </Pressable>
          </ScrollView>
        </>
      )}

      {showAddForm && (
        <View style={styles.addForm}>
          <View style={styles.addFormHeader}>
            <Text style={styles.addFormTitle}>Add New Address</Text>
            <Pressable
              onPress={() => {
                setShowAddForm(false);
                setNewLabel('');
                setNewAddress('');
              }}
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
          />
          <TextInput
            style={styles.addFormInput}
            value={newAddress}
            onChangeText={setNewAddress}
            placeholder="Street address"
            placeholderTextColor="#94A3B8"
            multiline
          />
          <Pressable style={styles.saveButton} onPress={handleAddAddress}>
            <Text style={styles.saveButtonText}>Save Address</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },

  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  scrollContent: {
    gap: 10,
  },
  addressChip: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    gap: 6,
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
    marginBottom: 8,
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
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  chipActionButtonVenue: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  chipActionText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  chipActionTextVenue: {
    color: '#166534',
  },
  addChip: {
    width: 80,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderStyle: 'dashed',
  },
  addChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
