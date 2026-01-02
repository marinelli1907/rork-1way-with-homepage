import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Phone, MapPin, Building, Briefcase, Calendar, Users as UsersIcon, Plus, X, Globe, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProfiles } from '@/providers/ProfilesProvider';
import { WorkGroup } from '@/types';

export default function ProfileDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProfile, getProfileGroups, groups, addMemberToGroup, removeMemberFromGroup, myProfile, updateMyProfile } = useProfiles();
  
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const isMyProfile = id === myProfile?.id;

  const profile = useMemo(() => getProfile(id || ''), [id, getProfile]);
  const profileGroups = useMemo(() => getProfileGroups(id || ''), [id, getProfileGroups]);

  const availableGroups = useMemo(() => {
    return groups.filter(g => !g.members.includes(id || ''));
  }, [groups, id]);

  const handleAddToGroup = async (groupId: string) => {
    if (id) {
      await addMemberToGroup(groupId, id);
      setShowGroupPicker(false);
    }
  };

  const handleRemoveFromGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      'Remove from Group',
      `Remove ${profile?.name} from ${groupName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await removeMemberFromGroup(groupId, id);
            }
          },
        },
      ]
    );
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1E293B" strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1E293B" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile.avatar && profile.avatar.trim() !== '' ? (
              <Image
                source={{ uri: profile.avatar }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <UsersIcon size={48} color="#FFFFFF" strokeWidth={2} />
            )}
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoList}>
            {profile.email && (
              <View style={styles.infoItem}>
                <Mail size={20} color="#64748B" strokeWidth={2} />
                <Text style={styles.infoText}>{profile.email}</Text>
              </View>
            )}
            {profile.phone && (
              <View style={styles.infoItem}>
                <Phone size={20} color="#64748B" strokeWidth={2} />
                <Text style={styles.infoText}>{profile.phone}</Text>
              </View>
            )}
            {profile.address && (
              <View style={styles.infoItem}>
                <MapPin size={20} color="#64748B" strokeWidth={2} />
                <Text style={styles.infoText}>{profile.address}</Text>
              </View>
            )}
          </View>
        </View>

        {(profile.company || profile.position) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Information</Text>
            <View style={styles.infoList}>
              {profile.company && (
                <View style={styles.infoItem}>
                  <Building size={20} color="#64748B" strokeWidth={2} />
                  <Text style={styles.infoText}>{profile.company}</Text>
                </View>
              )}
              {profile.position && (
                <View style={styles.infoItem}>
                  <Briefcase size={20} color="#64748B" strokeWidth={2} />
                  <Text style={styles.infoText}>{profile.position}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {profile.dateOfBirth && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Calendar size={20} color="#64748B" strokeWidth={2} />
                <Text style={styles.infoText}>
                  {new Date(profile.dateOfBirth).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {isMyProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Privacy</Text>
            <Text style={styles.sectionDescription}>
              Control who can see when you&apos;re attending events
            </Text>
            <View style={styles.privacyOptions}>
              <Pressable
                style={[
                  styles.privacyOption,
                  profile.eventPrivacyPublic && styles.privacyOptionActive,
                ]}
                onPress={() => updateMyProfile({ eventPrivacyPublic: true })}
              >
                <Globe size={24} color={profile.eventPrivacyPublic ? '#059669' : '#64748B'} strokeWidth={2} />
                <View style={styles.privacyOptionContent}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    profile.eventPrivacyPublic && styles.privacyOptionTitleActive,
                  ]}>
                    Public
                  </Text>
                  <Text style={styles.privacyOptionDescription}>
                    Other connections can see which events you&apos;re attending
                  </Text>
                </View>
                {profile.eventPrivacyPublic && (
                  <Eye size={20} color="#059669" strokeWidth={2} />
                )}
              </Pressable>
              <Pressable
                style={[
                  styles.privacyOption,
                  !profile.eventPrivacyPublic && styles.privacyOptionActive,
                ]}
                onPress={() => updateMyProfile({ eventPrivacyPublic: false })}
              >
                <Lock size={24} color={!profile.eventPrivacyPublic ? '#DC2626' : '#64748B'} strokeWidth={2} />
                <View style={styles.privacyOptionContent}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    !profile.eventPrivacyPublic && styles.privacyOptionTitleActive,
                  ]}>
                    Private
                  </Text>
                  <Text style={styles.privacyOptionDescription}>
                    Your event attendance is hidden from others
                  </Text>
                </View>
                {!profile.eventPrivacyPublic && (
                  <EyeOff size={20} color="#DC2626" strokeWidth={2} />
                )}
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Groups ({profileGroups.length})</Text>
            <Pressable
              style={styles.addButton}
              onPress={() => setShowGroupPicker(!showGroupPicker)}
            >
              <Plus size={20} color="#1E3A8A" strokeWidth={2} />
              <Text style={styles.addButtonText}>Add to Group</Text>
            </Pressable>
          </View>

          {showGroupPicker && availableGroups.length > 0 && (
            <View style={styles.groupPicker}>
              {availableGroups.map((group: WorkGroup) => (
                <Pressable
                  key={group.id}
                  style={styles.groupPickerItem}
                  onPress={() => handleAddToGroup(group.id)}
                >
                  <Text style={styles.groupPickerText}>{group.name}</Text>
                  <Plus size={20} color="#1E3A8A" strokeWidth={2} />
                </Pressable>
              ))}
            </View>
          )}

          {profileGroups.length === 0 ? (
            <View style={styles.emptyGroups}>
              <UsersIcon size={40} color="#CBD5E1" strokeWidth={1.5} />
              <Text style={styles.emptyGroupsText}>Not in any groups</Text>
            </View>
          ) : (
            <View style={styles.groupsList}>
              {profileGroups.map((group: WorkGroup) => (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupIcon}>
                    <UsersIcon size={20} color="#1E3A8A" strokeWidth={2} />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.groupDescription} numberOfLines={1}>
                        {group.description}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    style={styles.removeGroupButton}
                    onPress={() => handleRemoveFromGroup(group.id, group.name)}
                  >
                    <X size={18} color="#DC2626" strokeWidth={2} />
                  </Pressable>
                </View>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 100,
    height: 100,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E293B',
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
  sectionDescription: {
    fontSize: 14,
    color: '#64748B',
    marginTop: -8,
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
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
  groupPicker: {
    gap: 8,
  },
  groupPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  groupPickerText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  emptyGroups: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyGroupsText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  removeGroupButton: {
    padding: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#64748B',
  },
  privacyOptions: {
    gap: 12,
    marginTop: 8,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  privacyOptionActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF',
  },
  privacyOptionContent: {
    flex: 1,
    gap: 4,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  privacyOptionTitleActive: {
    color: '#1E3A8A',
  },
  privacyOptionDescription: {
    fontSize: 13,
    color: '#64748B',
  },
});
