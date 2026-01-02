import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { 
  Search, 
  UserPlus, 
  Users as UsersIcon, 
  Smartphone,
  MessageCircle,
  Check,
  UserX,
  Plus,
  UsersRound,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useProfiles } from '@/providers/ProfilesProvider';
import { Contact, ContactSyncStatus, WorkGroup } from '@/types';
import {
  syncPhoneContacts,
  syncGmailContacts,
  syncOutlookContacts,
  syncFacebookContacts,
  syncLinkedInContacts,
  syncTeamsContacts,
  syncWhatsAppContacts,
  matchContactsWithProfiles,
  searchContacts,
  filterAppUsers,
  filterNonAppUsers,
  inviteNonAppUser,
  syncXContacts,
  syncDiscordContacts,
} from '@/utils/contact-sync';
import { seedFakeProfiles } from '@/utils/seed-profiles';
import RotatingAdHeader from '@/components/RotatingAdHeader';

type TabType = 'connections' | 'groups' | 'contacts';

export default function ConnectionsScreen() {
  const router = useRouter();
  const { 
    contacts, 
    addContacts, 
    syncStatus, 
    updateSyncStatus,
    profiles,
    addConnection,
    removeConnection,
    getConnectedProfiles,
    createProfile,
    myProfile,
    groups,
    getGroupMembers,
  } = useProfiles();

  const [activeTab, setActiveTab] = useState<TabType>('connections');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSeededProfiles, setHasSeededProfiles] = useState(false);

  useEffect(() => {
    const initializeProfiles = async () => {
      if (!hasSeededProfiles && myProfile && profiles.length === 0) {
        try {
          await seedFakeProfiles(createProfile, addConnection, myProfile.id);
          setHasSeededProfiles(true);
        } catch (error) {
          console.error('Failed to seed initial profiles:', error);
        }
      }
    };
    initializeProfiles();
  }, [myProfile, profiles.length, hasSeededProfiles, createProfile, addConnection]);

  const connectedProfiles = useMemo(() => getConnectedProfiles(), [getConnectedProfiles]);

  const matchedContacts = useMemo(() => {
    return matchContactsWithProfiles(contacts, profiles);
  }, [contacts, profiles]);

  const appUserContacts = useMemo(() => {
    const appUsers = filterAppUsers(matchedContacts);
    return appUsers.sort((a, b) => a.name.localeCompare(b.name));
  }, [matchedContacts]);

  const nonAppUserContacts = useMemo(() => {
    const nonAppUsers = filterNonAppUsers(matchedContacts);
    return nonAppUsers.sort((a, b) => a.name.localeCompare(b.name));
  }, [matchedContacts]);

  const allContactsSorted = useMemo(() => {
    return [...appUserContacts, ...nonAppUserContacts];
  }, [appUserContacts, nonAppUserContacts]);

  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connectedProfiles;
    const query = searchQuery.toLowerCase();
    return connectedProfiles.filter(profile =>
      profile.name.toLowerCase().includes(query) ||
      profile.email?.toLowerCase().includes(query) ||
      profile.phone?.includes(query)
    );
  }, [connectedProfiles, searchQuery]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter(group =>
      group.name.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query)
    );
  }, [groups, searchQuery]);

  const filteredContacts = useMemo(() => {
    return searchContacts(allContactsSorted, searchQuery);
  }, [allContactsSorted, searchQuery]);

  const handleSyncPhone = async () => {
    setIsSyncing(true);
    try {
      const phoneContacts = await syncPhoneContacts();
      if (phoneContacts.length > 0) {
        await addContacts(phoneContacts);
        await updateSyncStatus('phone', true);
        Alert.alert('Success', `Synced ${phoneContacts.length} contacts from your phone`);
      }
    } catch (error) {
      console.error('Failed to sync phone contacts:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncGmail = async () => {
    setIsSyncing(true);
    try {
      const gmailContacts = await syncGmailContacts();
      if (gmailContacts.length > 0) {
        await addContacts(gmailContacts);
        await updateSyncStatus('gmail', true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncOutlook = async () => {
    setIsSyncing(true);
    try {
      const outlookContacts = await syncOutlookContacts();
      if (outlookContacts.length > 0) {
        await addContacts(outlookContacts);
        await updateSyncStatus('outlook', true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFacebook = async () => {
    setIsSyncing(true);
    try {
      const facebookContacts = await syncFacebookContacts();
      if (facebookContacts.length > 0) {
        await addContacts(facebookContacts);
        await updateSyncStatus('facebook', true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncLinkedIn = async () => {
    setIsSyncing(true);
    try {
      const linkedinContacts = await syncLinkedInContacts();
      if (linkedinContacts.length > 0) {
        await addContacts(linkedinContacts);
        await updateSyncStatus('linkedin', true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncTeams = async () => {
    setIsSyncing(true);
    try {
      const teamsContacts = await syncTeamsContacts();
      if (teamsContacts.length > 0) {
        await addContacts(teamsContacts);
        await updateSyncStatus('teams', true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncWhatsApp = async () => {
    setIsSyncing(true);
    try {
      const whatsappContacts = await syncWhatsAppContacts();
      if (whatsappContacts.length > 0) {
        await addContacts(whatsappContacts);
        await updateSyncStatus('whatsapp', true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncX = async () => {
    setIsSyncing(true);
    try {
      const xContacts = await syncXContacts();
      if (xContacts.length > 0) {
        await addContacts(xContacts);
        await updateSyncStatus('x', true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncDiscord = async () => {
    setIsSyncing(true);
    try {
      const discordContacts = await syncDiscordContacts();
      if (discordContacts.length > 0) {
        await addContacts(discordContacts);
        await updateSyncStatus('discord', true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnect = async (contact: Contact) => {
    if (contact.profileId) {
      await addConnection(contact.profileId, contact.source);
      Alert.alert('Connected', `You are now connected with ${contact.name}`);
    }
  };

  const handleDisconnect = async (profileId: string, name: string) => {
    Alert.alert(
      'Remove Connection',
      `Are you sure you want to remove ${name} from your connections?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeConnection(profileId);
            Alert.alert('Removed', `${name} has been removed from your connections`);
          }
        }
      ]
    );
  };

  const handleInvite = async (contact: Contact) => {
    await inviteNonAppUser(contact);
  };

  const handleCreateGroup = () => {
    router.push('/create-group' as any);
  };

  const handleGroupPress = (groupId: string) => {
    router.push(`/group/${groupId}` as any);
  };

  const handleProfilePress = (profileId: string) => {
    router.push(`/profile/${profileId}` as any);
  };

  const getSourceLogo = (source: string) => {
    const logos: Record<string, string> = {
      phone: 'phone',
      gmail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/1200px-Gmail_icon_%282020%29.svg.png',
      outlook: 'https://cdn-icons-png.flaticon.com/512/732/732223.png',
      facebook: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1200px-Facebook_Logo_%282019%29.png',
      linkedin: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/640px-LinkedIn_logo_initials.png',
      teams: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg/2203px-Microsoft_Office_Teams_%282018%E2%80%93present%29.svg.png',
      whatsapp: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png',
      x: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/X_logo_2023.svg/1200px-X_logo_2023.svg.png',
      discord: 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/4f/Discord_Logo_sans_texte.svg/1024px-Discord_Logo_sans_texte.svg.png',
    };
    return logos[source] || 'phone';
  };

  const renderSyncButtons = () => (
    <View style={styles.syncSection}>
      <Text style={styles.syncTitle}>Sync Contacts</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.syncScrollContent}
      >
        <Pressable 
          style={styles.syncButton} 
          onPress={handleSyncPhone}
          disabled={isSyncing}
        >
          <Smartphone size={40} color={syncStatus.phone ? '#10B981' : '#1E3A8A'} strokeWidth={2} />
          {syncStatus.phone && <View style={styles.syncCheck}><Check size={12} color="#FFF" strokeWidth={3} /></View>}
        </Pressable>

        <Pressable 
          style={styles.syncButton} 
          onPress={handleSyncFacebook}
          disabled={isSyncing}
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1200px-Facebook_Logo_%282019%29.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {syncStatus.facebook && <View style={styles.syncCheck}><Check size={12} color="#FFF" strokeWidth={3} /></View>}
        </Pressable>

        <Pressable 
          style={styles.syncButton} 
          onPress={handleSyncLinkedIn}
          disabled={isSyncing}
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/640px-LinkedIn_logo_initials.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {syncStatus.linkedin && <View style={styles.syncCheck}><Check size={12} color="#FFF" strokeWidth={3} /></View>}
        </Pressable>

        <Pressable 
          style={styles.syncButton} 
          onPress={handleSyncWhatsApp}
          disabled={isSyncing}
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {syncStatus.whatsapp && <View style={styles.syncCheck}><Check size={12} color="#FFF" strokeWidth={3} /></View>}
        </Pressable>

        <Pressable 
          style={styles.syncButton} 
          onPress={handleSyncX}
          disabled={isSyncing}
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/X_logo_2023.svg/1200px-X_logo_2023.svg.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {(syncStatus as any).x && <View style={styles.syncCheck}><Check size={12} color="#FFF" strokeWidth={3} /></View>}
        </Pressable>

        <Pressable 
          style={styles.syncButton} 
          onPress={handleSyncGmail}
          disabled={isSyncing}
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/1200px-Gmail_icon_%282020%29.svg.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {syncStatus.gmail && <View style={styles.syncCheck}><Check size={12} color="#FFF" strokeWidth={3} /></View>}
        </Pressable>

        <Pressable 
          style={styles.syncButton} 
          onPress={handleSyncOutlook}
          disabled={isSyncing}
        >
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/732/732223.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {syncStatus.outlook && <View style={styles.syncCheck}><Check size={12} color="#FFF" strokeWidth={3} /></View>}
        </Pressable>

        <Pressable 
          style={styles.syncButton} 
          onPress={handleSyncTeams}
          disabled={isSyncing}
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg/2203px-Microsoft_Office_Teams_%282018%E2%80%93present%29.svg.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {syncStatus.teams && <View style={styles.syncCheck}><Check size={12} color="#FFF" strokeWidth={3} /></View>}
        </Pressable>

        <Pressable 
          style={styles.syncButton} 
          onPress={handleSyncDiscord}
          disabled={isSyncing}
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/4f/Discord_Logo_sans_texte.svg/1024px-Discord_Logo_sans_texte.svg.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {(syncStatus as any).discord && <View style={styles.syncCheck}><Check size={12} color="#FFF" strokeWidth={3} /></View>}
        </Pressable>
      </ScrollView>
      {isSyncing && (
        <View style={styles.syncingIndicator}>
          <ActivityIndicator size="small" color="#1E3A8A" />
          <Text style={styles.syncingText}>Syncing...</Text>
        </View>
      )}
    </View>
  );

  const renderProfileItem = (profile: typeof connectedProfiles[0]) => {
    return (
      <Pressable 
        key={profile.id} 
        style={styles.contactItem}
        onPress={() => handleProfilePress(profile.id)}
      >
        <View style={styles.contactAvatar}>
          {profile.avatar && profile.avatar.trim() !== '' ? (
            <Image
              source={{ uri: profile.avatar }}
              style={styles.contactAvatarImage}
              resizeMode="cover"
            />
          ) : (
            <UsersIcon size={24} color="#FFFFFF" strokeWidth={2} />
          )}
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{profile.name}</Text>
          {profile.email && <Text style={styles.contactDetail}>{profile.email}</Text>}
          {profile.phone && <Text style={styles.contactDetail}>{profile.phone}</Text>}
        </View>
        <Pressable 
          style={styles.removeButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDisconnect(profile.id, profile.name);
          }}
        >
          <UserX size={20} color="#EF4444" strokeWidth={2} />
        </Pressable>
      </Pressable>
    );
  };

  const renderGroupItem = (group: WorkGroup) => {
    const members = getGroupMembers(group.id);
    return (
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
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderContactItem = (contact: Contact) => {
    const isConnected = connectedProfiles.some(p => p.id === contact.profileId);
    const sourceLogo = getSourceLogo(contact.source);
    
    return (
      <Pressable 
        key={contact.id} 
        style={styles.contactItem}
        onPress={() => contact.profileId && contact.isAppUser && handleProfilePress(contact.profileId)}
        disabled={!contact.profileId || !contact.isAppUser}
      >
        <View style={styles.contactAvatar}>
          {contact.avatar && contact.avatar.trim() !== '' ? (
            <Image
              source={{ uri: contact.avatar }}
              style={styles.contactAvatarImage}
              resizeMode="cover"
            />
          ) : (
            <UsersIcon size={24} color="#FFFFFF" strokeWidth={2} />
          )}
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          {contact.email && <Text style={styles.contactDetail}>{contact.email}</Text>}
          {contact.phone && <Text style={styles.contactDetail}>{contact.phone}</Text>}
          <View style={styles.contactSource}>
            {sourceLogo === 'phone' ? (
              <Smartphone size={14} color="#94A3B8" strokeWidth={2} />
            ) : (
              <Image 
                source={{ uri: sourceLogo }}
                style={styles.sourceLogoSmall}
                resizeMode="contain"
              />
            )}
            {contact.isAppUser && (
              <View style={styles.appUserBadge}>
                <Text style={styles.appUserBadgeText}>On 1Way</Text>
              </View>
            )}
          </View>
        </View>
        {contact.isAppUser ? (
          isConnected ? (
            <Pressable 
              style={styles.connectedButton}
              onPress={(e) => {
                e.stopPropagation();
                contact.profileId && handleDisconnect(contact.profileId, contact.name);
              }}
            >
              <Check size={20} color="#10B981" strokeWidth={2} />
              <Text style={styles.connectedButtonText}>Connected</Text>
            </Pressable>
          ) : (
            <Pressable 
              style={styles.connectButton}
              onPress={(e) => {
                e.stopPropagation();
                handleConnect(contact);
              }}
            >
              <UserPlus size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.connectButtonText}>Connect</Text>
            </Pressable>
          )
        ) : (
          <Pressable 
            style={styles.inviteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleInvite(contact);
            }}
          >
            <MessageCircle size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.inviteButtonText}>Invite</Text>
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.adHeaderContainer}>
          <RotatingAdHeader />
        </View>

        {renderSyncButtons()}

        <View style={styles.searchContainer}>
          <Search size={20} color="#64748B" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'connections' && styles.tabActive]}
            onPress={() => setActiveTab('connections')}
          >
            <Text style={[styles.tabText, activeTab === 'connections' && styles.tabTextActive]}>
              Connections
            </Text>
            <Text style={[styles.tabCount, activeTab === 'connections' && styles.tabCountActive]}>
              {filteredConnections.length}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>
              Groups
            </Text>
            <Text style={[styles.tabCount, activeTab === 'groups' && styles.tabCountActive]}>
              {filteredGroups.length}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'contacts' && styles.tabActive]}
            onPress={() => setActiveTab('contacts')}
          >
            <Text style={[styles.tabText, activeTab === 'contacts' && styles.tabTextActive]}>
              Contacts
            </Text>
            <Text style={[styles.tabCount, activeTab === 'contacts' && styles.tabCountActive]}>
              {filteredContacts.length}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {activeTab === 'connections' && (
            <View style={styles.list}>
              {filteredConnections.length === 0 ? (
                <View style={styles.emptyState}>
                  <UsersIcon size={48} color="#CBD5E1" strokeWidth={2} />
                  <Text style={styles.emptyStateText}>No connections yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Connect with other users to see them here
                  </Text>
                </View>
              ) : (
                filteredConnections.map(renderProfileItem)
              )}
            </View>
          )}

          {activeTab === 'groups' && (
            <View style={styles.list}>
              <View style={styles.createGroupContainer}>
                <Pressable style={styles.createGroupButton} onPress={handleCreateGroup}>
                  <Plus size={24} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.createGroupButtonText}>Create Group</Text>
                </Pressable>
              </View>
              
              {filteredGroups.length === 0 ? (
                <View style={styles.emptyState}>
                  <UsersRound size={48} color="#CBD5E1" strokeWidth={2} />
                  <Text style={styles.emptyStateText}>No groups yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Create groups to organize your connections
                  </Text>
                </View>
              ) : (
                filteredGroups.map(renderGroupItem)
              )}
            </View>
          )}

          {activeTab === 'contacts' && (
            <View style={styles.list}>
              {filteredContacts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Smartphone size={48} color="#CBD5E1" strokeWidth={2} />
                  <Text style={styles.emptyStateText}>No contacts synced</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Sync your contacts to invite friends
                  </Text>
                </View>
              ) : (
                filteredContacts.map(contact => renderContactItem(contact))
              )}
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
  adHeaderContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  syncSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  syncScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  syncButton: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 32,
    position: 'relative',
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  syncCheck: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  syncingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  syncingText: {
    fontSize: 14,
    color: '#64748B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  tabActive: {
    borderBottomColor: '#1E3A8A',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1E3A8A',
  },
  tabCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  tabCountActive: {
    color: '#1E3A8A',
  },
  scrollView: {
    flex: 1,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  createGroupContainer: {
    marginBottom: 20,
  },
  createGroupButton: {
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
  createGroupButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  contactAvatarImage: {
    width: 48,
    height: 48,
  },
  contactInfo: {
    flex: 1,
    gap: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  contactDetail: {
    fontSize: 14,
    color: '#64748B',
  },
  contactSource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sourceLogoSmall: {
    width: 14,
    height: 14,
  },
  appUserBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
  },
  appUserBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  connectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  connectedButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E3A8A',
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
    marginBottom: 12,
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
