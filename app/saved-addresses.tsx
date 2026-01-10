import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Home, Briefcase, MapPin, Plus, X, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SmartAddressInput from '@/components/SmartAddressInput';
import {
  SavedAddress,
  loadSavedAddresses,
  addSavedAddress,
  deleteSavedAddress,
  formatAddressShort,
} from '@/utils/addresses';

export default function SavedAddressesScreen() {
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState({
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
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const line1 = `${street}, ${city}, ${state} ${zip}`;

    try {
      const newAddr = await addSavedAddress({
        label,
        line1,
        lat: 41.4993 + Math.random() * 0.1,
        lng: -81.6944 + Math.random() * 0.1,
      });

      setAddresses((prev) => [...prev, newAddr]);
      resetForm();
      Alert.alert('Success', 'Address saved successfully');
    } catch {
      Alert.alert('Error', 'Failed to save address');
    }
  };

  const handleDeleteAddress = (addr: SavedAddress) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${addr.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedAddress(addr.id);
              setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
            } catch {
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setNewLabel('');
    setNewAddress({ street: '', city: '', state: '', zip: '' });
    setShowAddModal(false);
  };

  const getIconForLabel = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('home')) return <Home size={22} color="#2563EB" />;
    if (lower.includes('work')) return <Briefcase size={22} color="#7C3AED" />;
    return <MapPin size={22} color="#059669" />;
  };

  const getIconBgForLabel = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('home')) return '#EFF6FF';
    if (lower.includes('work')) return '#F3E8FF';
    return '#D1FAE5';
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Saved Addresses',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTitleStyle: { fontWeight: '600', color: '#0F172A' },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading addresses...</Text>
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPin size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Saved Addresses</Text>
            <Text style={styles.emptyText}>
              Add your home, work, or frequently visited places for quick access
            </Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={[styles.iconContainer, { backgroundColor: getIconBgForLabel(addr.label) }]}>
                  {getIconForLabel(addr.label)}
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>{addr.label}</Text>
                  <Text style={styles.addressLine}>{formatAddressShort(addr)}</Text>
                </View>
              </View>
              <View style={styles.addressActions}>
                <Pressable
                  style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.actionPressed]}
                  onPress={() => handleDeleteAddress(addr)}
                >
                  <Trash2 size={18} color="#DC2626" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Address</Text>
        </Pressable>
      </View>

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Address</Text>
                <Pressable onPress={resetForm} style={styles.closeButton}>
                  <X size={24} color="#64748B" />
                </Pressable>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Label</Text>
                <TextInput
                  style={styles.input}
                  value={newLabel}
                  onChangeText={setNewLabel}
                  placeholder="e.g., Home, Work, Gym"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <SmartAddressInput
                  value={newAddress}
                  onAddressChange={setNewAddress}
                  placeholder="Search address"
                  hideDetails
                  testIDPrefix="savedAddresses"
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Street</Text>
                  <TextInput
                    style={styles.input}
                    value={newAddress.street}
                    onChangeText={(t) => setNewAddress((p) => ({ ...p, street: t }))}
                    placeholder="123 Main St"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={newAddress.city}
                    onChangeText={(t) => setNewAddress((p) => ({ ...p, city: t }))}
                    placeholder="City"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.input}
                    value={newAddress.state}
                    onChangeText={(t) => setNewAddress((p) => ({ ...p, state: t.toUpperCase() }))}
                    placeholder="OH"
                    placeholderTextColor="#94A3B8"
                    maxLength={2}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>ZIP</Text>
                  <TextInput
                    style={styles.input}
                    value={newAddress.zip}
                    onChangeText={(t) => setNewAddress((p) => ({ ...p, zip: t.replace(/[^0-9]/g, '') }))}
                    placeholder="44115"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
                onPress={handleAddAddress}
              >
                <Text style={styles.saveButtonText}>Save Address</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0F172A',
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 14,
    color: '#64748B',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionPressed: {
    opacity: 0.7,
  },
  fabContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  fab: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  fieldHalf: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
