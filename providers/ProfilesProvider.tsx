import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { UserProfile, Contact, Connection, ContactSyncStatus, WorkGroup } from '@/types';
import { safeGetItem, safeSetItem } from '@/utils/storage-helpers';

const STORAGE_KEY_PROFILES = '@user_profiles';
const STORAGE_KEY_MY_PROFILE = '@my_profile';
const STORAGE_KEY_CONTACTS = '@contacts';
const STORAGE_KEY_CONNECTIONS = '@connections';
const STORAGE_KEY_SYNC_STATUS = '@contact_sync_status';
const STORAGE_KEY_GROUPS = '@work_groups';

export const [ProfilesProvider, useProfiles] = createContextHook(() => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [groups, setGroups] = useState<WorkGroup[]>([]);
  const [syncStatus, setSyncStatus] = useState<ContactSyncStatus>({
    phone: false,
    gmail: false,
    outlook: false,
    facebook: false,
    linkedin: false,
    teams: false,
    whatsapp: false,
    x: false,
    discord: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        const [profilesData, myProfileData, contactsData, connectionsData, syncStatusData, groupsData] = await Promise.all([
          safeGetItem<UserProfile[]>(STORAGE_KEY_PROFILES),
          safeGetItem<UserProfile>(STORAGE_KEY_MY_PROFILE),
          safeGetItem<Contact[]>(STORAGE_KEY_CONTACTS),
          safeGetItem<Connection[]>(STORAGE_KEY_CONNECTIONS),
          safeGetItem<ContactSyncStatus>(STORAGE_KEY_SYNC_STATUS),
          safeGetItem<WorkGroup[]>(STORAGE_KEY_GROUPS),
        ]);

        if (mounted) {
          if (profilesData && Array.isArray(profilesData)) {
            setProfiles(profilesData);
          }

          if (myProfileData) {
            setMyProfile(myProfileData);
          }

          if (contactsData && Array.isArray(contactsData)) {
            setContacts(contactsData);
          }

          if (connectionsData && Array.isArray(connectionsData)) {
            setConnections(connectionsData);
          }

          if (syncStatusData && typeof syncStatusData === 'object') {
            setSyncStatus(prev => ({ ...prev, ...syncStatusData }));
          }

          if (groupsData && Array.isArray(groupsData)) {
            setGroups(groupsData);
          }
        }
      } catch (error) {
        console.error('Failed to load profiles:', error);
      }
    };

    loadData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const saveProfiles = async (newProfiles: UserProfile[]) => {
    try {
      await safeSetItem(STORAGE_KEY_PROFILES, newProfiles);
      setProfiles(newProfiles);
    } catch (error) {
      console.error('Failed to save profiles:', error);
    }
  };

  const saveMyProfile = async (profile: UserProfile) => {
    try {
      await safeSetItem(STORAGE_KEY_MY_PROFILE, profile);
      setMyProfile(profile);
    } catch (error) {
      console.error('Failed to save my profile:', error);
    }
  };

  const createProfile = useCallback(async (profileData: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const newProfile: UserProfile = {
      ...profileData,
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedProfiles = [...profiles, newProfile];
    await saveProfiles(updatedProfiles);
    return newProfile;
  }, [profiles]);

  const updateMyProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!myProfile) {
      const newProfile: UserProfile = {
        id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: updates.name || 'My Profile',
        email: updates.email,
        phone: updates.phone,
        address: updates.address,
        company: updates.company,
        position: updates.position,
        dateOfBirth: updates.dateOfBirth,
        createdAt: new Date().toISOString(),
      };
      await saveMyProfile(newProfile);
      return newProfile;
    }

    const updatedProfile = { ...myProfile, ...updates };
    await saveMyProfile(updatedProfile);
    return updatedProfile;
  }, [myProfile]);

  const updateProfile = useCallback(async (id: string, updates: Partial<UserProfile>) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return null;
    
    const updatedProfile = { ...profile, ...updates };
    const updatedProfiles = profiles.map(p => p.id === id ? updatedProfile : p);
    await saveProfiles(updatedProfiles);
    return updatedProfile;
  }, [profiles]);

  const deleteProfile = useCallback(async (id: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== id);
    await saveProfiles(updatedProfiles);
  }, [profiles]);

  const searchProfiles = useCallback((query: string): UserProfile[] => {
    if (!query.trim()) {
      return profiles;
    }

    const lowercaseQuery = query.toLowerCase();
    return profiles.filter(profile =>
      profile.name.toLowerCase().includes(lowercaseQuery) ||
      profile.email?.toLowerCase().includes(lowercaseQuery) ||
      profile.company?.toLowerCase().includes(lowercaseQuery)
    );
  }, [profiles]);

  const getProfile = useCallback((id: string): UserProfile | null => {
    if (myProfile && myProfile.id === id) {
      return myProfile;
    }
    return profiles.find(p => p.id === id) || null;
  }, [profiles, myProfile]);

  const saveContacts = async (newContacts: Contact[]) => {
    try {
      await safeSetItem(STORAGE_KEY_CONTACTS, newContacts);
      setContacts(newContacts);
    } catch (error) {
      console.error('Failed to save contacts:', error);
    }
  };

  const saveConnections = async (newConnections: Connection[]) => {
    try {
      await safeSetItem(STORAGE_KEY_CONNECTIONS, newConnections);
      setConnections(newConnections);
    } catch (error) {
      console.error('Failed to save connections:', error);
    }
  };

  const saveSyncStatus = async (newStatus: ContactSyncStatus) => {
    try {
      await safeSetItem(STORAGE_KEY_SYNC_STATUS, newStatus);
      setSyncStatus(newStatus);
    } catch (error) {
      console.error('Failed to save sync status:', error);
    }
  };

  const addContacts = useCallback(async (newContacts: Contact[]) => {
    const existingIds = new Set(contacts.map(c => c.id));
    const uniqueNewContacts = newContacts.filter(c => !existingIds.has(c.id));
    const updatedContacts = [...contacts, ...uniqueNewContacts];
    await saveContacts(updatedContacts);
  }, [contacts]);

  const updateSyncStatus = useCallback(async (source: keyof ContactSyncStatus, status: boolean) => {
    setSyncStatus(prev => {
      const newStatus = {
        ...prev,
        [source]: status,
        lastSyncedAt: new Date().toISOString(),
      };
      saveSyncStatus(newStatus);
      return newStatus;
    });
  }, []);

  const addConnection = useCallback(async (profileId: string, source: Contact['source']) => {
    if (!myProfile) {
      console.error('No profile to add connection to');
      return;
    }

    const existingConnection = connections.find(
      c => c.myProfileId === myProfile.id && c.connectedProfileId === profileId
    );

    if (existingConnection) {
      console.log('Connection already exists');
      return;
    }

    const newConnection: Connection = {
      id: `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      myProfileId: myProfile.id,
      connectedProfileId: profileId,
      connectedAt: new Date().toISOString(),
      source,
    };

    const updatedConnections = [...connections, newConnection];
    await saveConnections(updatedConnections);

    const updatedMyProfile = {
      ...myProfile,
      connectionIds: [...(myProfile.connectionIds || []), profileId],
    };
    await saveMyProfile(updatedMyProfile);
  }, [connections, myProfile]);

  const removeConnection = useCallback(async (profileId: string) => {
    if (!myProfile) return;

    const updatedConnections = connections.filter(
      c => !(c.myProfileId === myProfile.id && c.connectedProfileId === profileId)
    );
    await saveConnections(updatedConnections);

    const updatedMyProfile = {
      ...myProfile,
      connectionIds: (myProfile.connectionIds || []).filter(id => id !== profileId),
    };
    await saveMyProfile(updatedMyProfile);
  }, [connections, myProfile]);

  const getConnectedProfiles = useCallback((): UserProfile[] => {
    if (!myProfile || !myProfile.connectionIds) return [];
    return profiles.filter(p => myProfile.connectionIds?.includes(p.id));
  }, [profiles, myProfile]);

  const saveGroups = async (newGroups: WorkGroup[]) => {
    try {
      await safeSetItem(STORAGE_KEY_GROUPS, newGroups);
      setGroups(newGroups);
    } catch (error) {
      console.error('Failed to save groups:', error);
    }
  };

  const createGroup = useCallback(async (groupData: Omit<WorkGroup, 'id' | 'createdAt'>) => {
    if (!myProfile) {
      console.error('No profile to create group');
      return null;
    }

    const newGroup: WorkGroup = {
      ...groupData,
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      createdBy: myProfile.id,
    };
    
    const updatedGroups = [...groups, newGroup];
    await saveGroups(updatedGroups);
    return newGroup;
  }, [groups, myProfile]);

  const updateGroup = useCallback(async (id: string, updates: Partial<WorkGroup>) => {
    const group = groups.find(g => g.id === id);
    if (!group) return null;
    
    const updatedGroup = { ...group, ...updates };
    const updatedGroups = groups.map(g => g.id === id ? updatedGroup : g);
    await saveGroups(updatedGroups);
    return updatedGroup;
  }, [groups]);

  const deleteGroup = useCallback(async (id: string) => {
    const updatedGroups = groups.filter(g => g.id !== id);
    await saveGroups(updatedGroups);
  }, [groups]);

  const addMemberToGroup = useCallback(async (groupId: string, profileId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return null;

    if (group.members.includes(profileId)) {
      console.log('Member already in group');
      return group;
    }

    const updatedGroup = {
      ...group,
      members: [...group.members, profileId],
    };

    const updatedGroups = groups.map(g => g.id === groupId ? updatedGroup : g);
    await saveGroups(updatedGroups);
    return updatedGroup;
  }, [groups]);

  const removeMemberFromGroup = useCallback(async (groupId: string, profileId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return null;

    const updatedGroup = {
      ...group,
      members: group.members.filter(m => m !== profileId),
    };

    const updatedGroups = groups.map(g => g.id === groupId ? updatedGroup : g);
    await saveGroups(updatedGroups);
    return updatedGroup;
  }, [groups]);

  const getGroup = useCallback((id: string): WorkGroup | null => {
    return groups.find(g => g.id === id) || null;
  }, [groups]);

  const getGroupMembers = useCallback((groupId: string): UserProfile[] => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    return profiles.filter(p => group.members.includes(p.id));
  }, [groups, profiles]);

  const getProfileGroups = useCallback((profileId: string): WorkGroup[] => {
    return groups.filter(g => g.members.includes(profileId));
  }, [groups]);

  return useMemo(() => ({
    profiles,
    myProfile,
    contacts,
    connections,
    groups,
    syncStatus,
    isLoading,
    createProfile,
    updateMyProfile,
    updateProfile,
    deleteProfile,
    searchProfiles,
    getProfile,
    addContacts,
    updateSyncStatus,
    addConnection,
    removeConnection,
    getConnectedProfiles,
    createGroup,
    updateGroup,
    deleteGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    getGroup,
    getGroupMembers,
    getProfileGroups,
  }), [profiles, myProfile, contacts, connections, groups, syncStatus, isLoading, createProfile, updateMyProfile, updateProfile, deleteProfile, searchProfiles, getProfile, addContacts, updateSyncStatus, addConnection, removeConnection, getConnectedProfiles, createGroup, updateGroup, deleteGroup, addMemberToGroup, removeMemberFromGroup, getGroup, getGroupMembers, getProfileGroups]);
});
