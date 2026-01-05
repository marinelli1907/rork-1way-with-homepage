import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheetModal from '@/components/BottomSheetModal';
import { useProfiles } from '@/providers/ProfilesProvider';
import { Car, Sparkles } from 'lucide-react-native';

const MOCK_USER = {
  name: 'Jordan Smith',
  email: 'jordan.smith@example.com',
  phone: '+1 (555) 123-4567',
  avatar: 'https://i.pravatar.cc/300?img=12',
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { myProfile, updateMyProfile } = useProfiles();

  const [name, setName] = useState(myProfile?.name || MOCK_USER.name);
  const [email, setEmail] = useState(myProfile?.email || MOCK_USER.email);
  const [phone, setPhone] = useState(myProfile?.phone || MOCK_USER.phone);
  const [carMake, setCarMake] = useState(myProfile?.carMake || '');
  const [carModel, setCarModel] = useState(myProfile?.carModel || '');
  const [carYear, setCarYear] = useState(myProfile?.carYear || '');
  const [carColor, setCarColor] = useState(myProfile?.carColor || '');
  const [carImageUrl, setCarImageUrl] = useState(myProfile?.carImageUrl || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    name !== (myProfile?.name || MOCK_USER.name) ||
    email !== (myProfile?.email || MOCK_USER.email) ||
    phone !== (myProfile?.phone || MOCK_USER.phone) ||
    carMake !== (myProfile?.carMake || '') ||
    carModel !== (myProfile?.carModel || '') ||
    carYear !== (myProfile?.carYear || '') ||
    carColor !== (myProfile?.carColor || '') ||
    carImageUrl !== (myProfile?.carImageUrl || '');

  const canGenerateCar = carMake && carModel && carYear && carColor;

  const handleGenerateCarImage = async () => {
    if (!canGenerateCar) {
      Alert.alert('Missing Information', 'Please fill in all car details (make, model, year, and color) to generate an image.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('https://toolkit.rork.com/images/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `A high-quality, professional studio photograph of a ${carYear} ${carColor} ${carMake} ${carModel}. The car should be shown from a 3/4 front angle view, positioned on a clean white studio background. Perfect lighting, photorealistic, detailed, modern automotive photography style. The car should be clean and well-maintained.`,
          size: '1536x1024',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image generation failed:', errorText);
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      if (data.image && data.image.base64Data) {
        const imageUri = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
        setCarImageUrl(imageUri);
        Alert.alert('Success', 'Car image generated successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to generate car image:', error);
      Alert.alert('Error', 'Failed to generate car image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMyProfile({
        name,
        email,
        phone,
        carMake,
        carModel,
        carYear,
        carColor,
        carImageUrl,
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
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Car size={20} color="#1E3A8A" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
        </View>
        
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.inputHalf]}>
            <Text style={styles.label}>Make</Text>
            <TextInput
              style={styles.input}
              value={carMake}
              onChangeText={setCarMake}
              placeholder="Toyota"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={[styles.inputGroup, styles.inputHalf]}>
            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              value={carModel}
              onChangeText={setCarModel}
              placeholder="Camry"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.inputHalf]}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              value={carYear}
              onChangeText={setCarYear}
              placeholder="2023"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <View style={[styles.inputGroup, styles.inputHalf]}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              value={carColor}
              onChangeText={setCarColor}
              placeholder="Silver"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.generateButton,
            pressed && styles.generateButtonPressed,
            (!canGenerateCar || isGenerating) && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerateCarImage}
          disabled={!canGenerateCar || isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Sparkles size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.generateButtonText}>Generate Car Image</Text>
            </>
          )}
        </Pressable>

        {carImageUrl ? (
          <View style={styles.carImageContainer}>
            <Text style={styles.carImageLabel}>Generated Image</Text>
            <Image
              source={{ uri: carImageUrl }}
              style={styles.carImage}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  generateButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  carImageContainer: {
    marginTop: 20,
  },
  carImageLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 8,
  },
  carImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
});
