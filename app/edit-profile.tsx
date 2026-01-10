import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheetModal from '@/components/BottomSheetModal';
import { useProfiles } from '@/providers/ProfilesProvider';
import { Accessibility } from 'lucide-react-native';
import SmartAddressInput from '@/components/SmartAddressInput';

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zip: string;
}

const MOCK_USER = {
  name: 'Jordan Smith',
  phone: '(555) 123-4567',
  avatar: 'https://i.pravatar.cc/300?img=12',
};

const DEFAULT_ADDRESS: AddressComponents = {
  street: '',
  city: '',
  state: '',
  zip: '',
};

const parseAddress = (address: string | AddressComponents | undefined): AddressComponents => {
  if (!address) return DEFAULT_ADDRESS;
  if (typeof address === 'string') {
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      const stateZip = parts[2]?.split(' ') || [];
      return {
        street: parts[0] || '',
        city: parts[1] || '',
        state: stateZip[0] || '',
        zip: stateZip[1] || '',
      };
    }
    return { street: address, city: '', state: '', zip: '' };
  }
  return address;
};

const formatAddress = (addr: AddressComponents): string => {
  if (!addr.street && !addr.city && !addr.state && !addr.zip) return '';
  const parts = [addr.street, addr.city, `${addr.state} ${addr.zip}`.trim()].filter(Boolean);
  return parts.join(', ');
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { myProfile, updateMyProfile } = useProfiles();

  const initialAddress = parseAddress(myProfile?.address);

  const [name, setName] = useState(myProfile?.name || MOCK_USER.name);
  const phone = myProfile?.phone || MOCK_USER.phone;
  const [address, setAddress] = useState<AddressComponents>(initialAddress);
  const [isHandicap, setIsHandicap] = useState<boolean>(myProfile?.isHandicap ?? false);
  const [isSaving, setIsSaving] = useState(false);

  const addressChanged = 
    address.street !== initialAddress.street ||
    address.city !== initialAddress.city ||
    address.state !== initialAddress.state ||
    address.zip !== initialAddress.zip;

  const isDirty =
    name !== (myProfile?.name || MOCK_USER.name) ||
    addressChanged ||
    isHandicap !== (myProfile?.isHandicap ?? false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMyProfile({
        name,
        phone,
        address: formatAddress(address),
        isHandicap,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <BottomSheetModal
      visible={true}
      onClose={handleClose}
      title="Edit Profile"
      subtitle="Update your personal information"
      onSave={handleSave}
      saveButtonText={isSaving ? 'Saving...' : 'Save'}
      saveButtonDisabled={isSaving || !isDirty}
      isDirty={isDirty}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={phone}
            editable={false}
            placeholder="Phone number"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
          />
          <Text style={styles.inputHint}>Phone number cannot be changed</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <SmartAddressInput
            value={address}
            onAddressChange={setAddress}
            placeholder="Enter your address"
            hideDetails
            testIDPrefix="editProfileAddress"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessibility</Text>

        <Pressable
          style={({ pressed }) => [
            styles.toggleRow,
            isHandicap && styles.toggleRowActive,
            pressed && styles.toggleRowPressed,
          ]}
          onPress={() => setIsHandicap((v) => !v)}
          testID="editProfileHandicapToggle"
        >
          <View style={[styles.toggleIcon, { backgroundColor: '#E0F2FE' }]}>
            <Accessibility size={18} color="#0284C7" strokeWidth={2.25} />
          </View>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>Handicap / accessibility needs</Text>
            <Text style={styles.toggleSubtitle}>Shows on your profile + helps match drivers</Text>
          </View>
          <View style={[styles.pill, isHandicap ? styles.pillOn : styles.pillOff]}>
            <Text style={[styles.pillText, isHandicap ? styles.pillTextOn : styles.pillTextOff]}>
              {isHandicap ? 'Yes' : 'No'}
            </Text>
          </View>
        </Pressable>
      </View>


    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  toggleRowPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  toggleRowActive: {
    borderColor: 'rgba(2, 132, 199, 0.35)',
    backgroundColor: 'rgba(224, 242, 254, 0.55)',
  },
  toggleRowActiveWarm: {
    borderColor: 'rgba(217, 119, 6, 0.35)',
    backgroundColor: 'rgba(254, 243, 199, 0.45)',
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleTextCol: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  toggleSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillOn: {
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.35)',
  },
  pillOnWarm: {
    backgroundColor: 'rgba(217, 119, 6, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
  },
  pillOff: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 0.2,
  },
  pillTextOn: {
    color: '#0284C7',
  },
  pillTextOnWarm: {
    color: '#D97706',
  },
  pillTextOff: {
    color: '#64748B',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 16,
  },
  inputGroup: {
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
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  inputHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    marginLeft: 4,
  },
});
