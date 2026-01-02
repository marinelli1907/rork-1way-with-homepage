import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, Search, Plus, UserX, Users as UsersIcon } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProfiles } from '@/providers/ProfilesProvider';
import { UserProfile } from '@/types';

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGroup, getGroupMembers, deleteGroup, addMemberToGroup, removeMemberFromGroup, getConnectedProfiles, searchProfiles } = useProfiles();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  const group = useMemo(() => getGroup(id || ''), [id, getGroup]);
  const members = useMemo(() => getGroupMembers(id || ''), [id, getGroupMembers]);
  const connections = useMemo(() => getConnectedProfiles(), [getConnectedProfiles]);

  const availableConnections = useMemo(() => {
    if (!group) return [];
    return connections.filter(c => !group.members.includes(c.id));
  }, [connections, group]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return availableConnections;
    return searchProfiles(searchQuery).filter(p => !group?.members.includes(p.id));
  }, [searchQuery, availableConnections, searchProfiles, group]);

  useEffect(() => {
    if (!group) {
      Alert.alert('Error', 'Group not found', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    }
  }, [group, router]);

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteGroup(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleAddMember = async (profileId: string) => {
    if (id) {
      await addMemberToGroup(id, profileId);
      setSearchQuery('');
      setShowAddMember(false);
    }
  };

  const handleRemoveMember = (profileId: string, profileName: string) => {
    Alert.alert(
      'Remove Member',
      `Remove ${profileName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await removeMemberFromGroup(id, profileId);
            }
          },
        },
      ]
    );
  };

  const handleMemberPress = (profileId: string) => {
    router.push(`/profile/${profileId}` as any);
  };

  if (!group) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1E293B" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Group Details</Text>
        <Pressable style={styles.deleteButton} onPress={handleDeleteGroup}>
          <Trash2 size={20} color="#DC2626" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}>
            <UsersIcon size={32} color="#1E3A8A" strokeWidth={2} />
          </View>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Members ({members.length})
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={() => setShowAddMember(!showAddMember)}
            >
              <Plus size={20} color="#1E3A8A" strokeWidth={2} />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          {showAddMember && (
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color="#64748B" strokeWidth={2} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search connections"
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
              </View>

              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map((profile) => (
                    <Pressable
                      key={profile.id}
                      style={styles.searchResultItem}
                      onPress={() => handleAddMember(profile.id)}
                    >
                      <View style={styles.profileAvatar}>
                        {profile.avatar && profile.avatar.trim() !== '' ? (
                          <Image
                            source={{ uri: profile.avatar }}
                            style={styles.profileAvatarImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <UsersIcon size={20} color="#FFFFFF" strokeWidth={2} />
                        )}
                      </View>
                      <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{profile.name}</Text>
                        {profile.email && (
                          <Text style={styles.profileDetail}>{profile.email}</Text>
                        )}
                      </View>
                      <Plus size={20} color="#1E3A8A" strokeWidth={2} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {members.length === 0 ? (
            <View style={styles.emptyState}>
              <UsersIcon size={48} color="#CBD5E1" strokeWidth={1.5} />
              <Text style={styles.emptyStateText}>No members yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add connections to this group
              </Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {members.map((member: UserProfile) => (
                <Pressable
                  key={member.id}
                  style={styles.memberItem}
                  onPress={() => handleMemberPress(member.id)}
                >
                  <View style={styles.profileAvatar}>
                    {member.avatar && member.avatar.trim() !== '' ? (
                      <Image
                        source={{ uri: member.avatar }}
                        style={styles.profileAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <UsersIcon size={20} color="#FFFFFF" strokeWidth={2} />
                    )}
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{member.name}</Text>
                    {member.email && (
                      <Text style={styles.profileDetail}>{member.email}</Text>
                    )}
                  </View>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemoveMember(member.id, member.name)}
                  >
                    <UserX size={20} color="#DC2626" strokeWidth={2} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  groupHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  groupIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    textAlign: 'center',
  },
  groupDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  searchContainer: {
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  searchResults: {
    gap: 8,
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: 48,
    height: 48,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  profileDetail: {
    fontSize: 14,
    color: '#64748B',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
