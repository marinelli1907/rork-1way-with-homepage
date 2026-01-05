import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheetModal from '@/components/BottomSheetModal';
import { useProfiles } from '@/providers/ProfilesProvider';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { createGroup } = useProfiles();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = useMemo(() => {
    return name.trim() !== '' || description.trim() !== '';
  }, [name, description]);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setIsSubmitting(true);
    try {
      const newGroup = await createGroup({
        name: name.trim(),
        description: description.trim(),
        members: [],
        createdBy: '',
      });

      if (newGroup) {
        Alert.alert('Success', 'Group created successfully!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveButtonDisabled = !name.trim() || isSubmitting;

  return (
    <BottomSheetModal
      visible={true}
      onClose={() => router.back()}
      title="Create Group"
      onSave={handleCreate}
      saveButtonText="Create"
      saveButtonDisabled={saveButtonDisabled}
      isDirty={isDirty}
    >
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Group Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Marketing Team, Book Club"
          placeholderTextColor="#94A3B8"
          autoFocus
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add a description for your group"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <Text style={styles.hint}>
        You can add members to this group after creation
      </Text>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});
