import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { UsersRound, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useProfiles } from '@/providers/ProfilesProvider';
import { WorkGroup } from '@/types';

export default function GroupsScreen() {
  const router = useRouter();
  const { groups } = useProfiles();

  const handleCreateGroup = () => {
    router.push('/create-group' as any);
  };

  const handleGroupPress = (groupId: string) => {
    router.push(`/group/${groupId}` as any);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.safeAreaTop} />
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/47vdru1syrb0iukk596rl' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.createButtonContainer}>
          <Pressable style={styles.createButton} onPress={handleCreateGroup}>
            <Plus size={24} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.createButtonText}>Create Group</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <UsersRound size={64} color="#CBD5E1" strokeWidth={1.5} />
              <Text style={styles.emptyStateTitle}>No Groups Yet</Text>
              <Text style={styles.emptyStateText}>
                Create groups to organize your connections for events and activities
              </Text>
            </View>
          ) : (
            <View style={styles.groupsList}>
              {groups.map((group: WorkGroup) => (
                <Pressable
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => handleGroupPress(group.id)}
                >
                  <View style={styles.groupIcon}>
                    <UsersRound size={28} color="#1E3A8A" strokeWidth={2} />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.groupDescription} numberOfLines={2}>
                        {group.description}
                      </Text>
                    )}
                    <Text style={styles.memberCount}>
                      {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  safeAreaTop: {
    height: 48,
  },
  logo: {
    width: 240,
    height: 80,
  },
  createButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1E3A8A',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  groupsList: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
    gap: 6,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  groupDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  memberCount: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
});
