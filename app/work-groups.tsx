import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Plus, X, ArrowLeft, User as UserIcon, Trash2, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfiles } from '@/providers/ProfilesProvider';
import { UserProfile } from '@/types';

const STORAGE_KEY_GROUPS = '@work_groups';

interface WorkGroup {
  id: string;
  name: string;
  description: string;
  members: string[];
  createdAt: string;
}

export default function WorkGroupsScreen() {
  const router = useRouter();
  const { profiles, searchProfiles } = useProfiles();
  const [groups, setGroups] = useState<WorkGroup[]>([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showProfileSearch, setShowProfileSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_GROUPS);
      if (stored && typeof stored === 'string' && stored.trim() !== '') {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setGroups(parsed);
          } else {
            console.warn('Invalid groups data format, resetting');
            await AsyncStorage.removeItem(STORAGE_KEY_GROUPS);
          }
        } catch (parseError) {
          console.error('Failed to parse groups data:', parseError, 'Data:', stored?.substring(0, 100));
          await AsyncStorage.removeItem(STORAGE_KEY_GROUPS);
        }
      } else if (stored) {
        console.warn('Invalid groups data, resetting');
        await AsyncStorage.removeItem(STORAGE_KEY_GROUPS);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const saveGroups = async (updatedGroups: WorkGroup[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(updatedGroups));
      setGroups(updatedGroups);
    } catch (error) {
      console.error('Failed to save groups:', error);
    }
  };

  const createGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    const newGroup: WorkGroup = {
      id: `group_${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDescription.trim(),
      members: [],
      createdAt: new Date().toISOString(),
    };

    saveGroups([...groups, newGroup]);
    setNewGroupName('');
    setNewGroupDescription('');
    setShowAddGroup(false);
    Alert.alert('Success', 'Work group created successfully!');
  };

  const addMember = (groupId: string, profileId: string) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        if (group.members.includes(profileId)) {
          Alert.alert('Duplicate Member', 'This person is already in the group');
          return group;
        }
        return { ...group, members: [...group.members, profileId] };
      }
      return group;
    });

    saveGroups(updatedGroups);
    setSearchQuery('');
    setShowProfileSearch(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchProfiles(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const removeMember = (groupId: string, profileId: string) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        return { ...group, members: group.members.filter(m => m !== profileId) };
      }
      return group;
    });

    saveGroups(updatedGroups);
  };

  const getProfileName = (profileId: string): string => {
    const profile = profiles.find(p => p.id === profileId);
    return profile?.name || 'Unknown User';
  };

  const deleteGroup = (groupId: string) => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedGroups = groups.filter(g => g.id !== groupId);
            saveGroups(updatedGroups);
            if (selectedGroupId === groupId) {
              setSelectedGroupId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1E293B" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Work Groups</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => setShowAddGroup(true)}
        >
          <Plus size={24} color="#1E3A8A" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 && !showAddGroup ? (
          <View style={styles.emptyState}>
            <Users size={64} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>No Work Groups</Text>
            <Text style={styles.emptyStateText}>
              Create a work group to organize your team events
            </Text>
            <Pressable
              style={styles.createFirstButton}
              onPress={() => setShowAddGroup(true)}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.createFirstButtonText}>Create First Group</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {showAddGroup && (
              <View style={styles.addGroupForm}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>New Work Group</Text>
                  <Pressable onPress={() => setShowAddGroup(false)}>
                    <X size={24} color="#64748B" strokeWidth={2} />
                  </Pressable>
                </View>
                <TextInput
                  style={styles.input}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholder="Group name (e.g., Marketing Team)"
                  placeholderTextColor="#94A3B8"
                />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={newGroupDescription}
                  onChangeText={setNewGroupDescription}
                  placeholder="Description (optional)"
                  placeholderTextColor="#94A3B8"
                  multiline
                />
                <Pressable style={styles.createButton} onPress={createGroup}>
                  <Text style={styles.createButtonText}>Create Group</Text>
                </Pressable>
              </View>
            )}

            {groups.map((group) => (
              <View key={group.id} style={styles.groupCard}>
                <Pressable
                  style={styles.groupHeader}
                  onPress={() => setSelectedGroupId(selectedGroupId === group.id ? null : group.id)}
                >
                  <View style={styles.groupIcon}>
                    <Users size={24} color="#1E3A8A" strokeWidth={2} />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.groupDescription}>{group.description}</Text>
                    )}
                    <Text style={styles.memberCount}>
                      {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteGroup(group.id)}
                  >
                    <Trash2 size={20} color="#DC2626" strokeWidth={2} />
                  </Pressable>
                </Pressable>

                {selectedGroupId === group.id && (
                  <View style={styles.groupDetails}>
                    <View style={styles.addMemberForm}>
                      <Pressable
                        style={styles.searchToggleButton}
                        onPress={() => setShowProfileSearch(!showProfileSearch)}
                      >
                        <Search size={20} color="#1E3A8A" strokeWidth={2} />
                        <Text style={styles.searchToggleText}>Search Profiles</Text>
                      </Pressable>

                      {showProfileSearch && (
                        <View style={styles.searchContainer}>
                          <View style={styles.addMemberInputContainer}>
                            <Search size={20} color="#64748B" strokeWidth={2} />
                            <TextInput
                              style={styles.addMemberInput}
                              value={searchQuery}
                              onChangeText={handleSearch}
                              placeholder="Search by name, email, or company"
                              placeholderTextColor="#94A3B8"
                              autoCapitalize="none"
                            />
                          </View>
                          {searchResults.length > 0 && (
                            <View style={styles.searchResultsList}>
                              {searchResults.map((profile) => (
                                <Pressable
                                  key={profile.id}
                                  style={styles.searchResultItem}
                                  onPress={() => addMember(group.id, profile.id)}
                                >
                                  <UserIcon size={16} color="#64748B" strokeWidth={2} />
                                  <View style={styles.searchResultInfo}>
                                    <Text style={styles.searchResultName}>{profile.name}</Text>
                                    {profile.email && (
                                      <Text style={styles.searchResultEmail}>{profile.email}</Text>
                                    )}
                                  </View>
                                  <Plus size={16} color="#1E3A8A" strokeWidth={2} />
                                </Pressable>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {group.members.length > 0 ? (
                      <View style={styles.membersList}>
                        {group.members.map((profileId) => (
                          <View key={profileId} style={styles.memberItem}>
                            <UserIcon size={16} color="#64748B" strokeWidth={2} />
                            <Text style={styles.memberEmail}>{getProfileName(profileId)}</Text>
                            <Pressable
                              onPress={() => removeMember(group.id, profileId)}
                              style={styles.removeMemberButton}
                            >
                              <X size={16} color="#DC2626" strokeWidth={2} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noMembersText}>No members yet</Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </>
        )}
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  addGroupForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
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
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
    gap: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  groupDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  memberCount: {
    fontSize: 13,
    color: '#94A3B8',
  },
  deleteButton: {
    padding: 8,
  },
  groupDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 16,
    gap: 16,
  },
  addMemberForm: {
    marginBottom: 8,
  },
  addMemberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addMemberInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  addMemberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  memberEmail: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  removeMemberButton: {
    padding: 4,
  },
  noMembersText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  searchToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchToggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  searchContainer: {
    gap: 8,
  },
  searchResultsList: {
    gap: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchResultInfo: {
    flex: 1,
    gap: 2,
  },
  searchResultName: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600' as const,
  },
  searchResultEmail: {
    fontSize: 12,
    color: '#64748B',
  },
});
