import * as Contacts from 'expo-contacts';
import { Platform, Alert, Linking } from 'react-native';
import { Contact, ContactSource, UserProfile } from '@/types';

export async function requestPhoneContactsPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request contacts permission:', error);
    return false;
  }
}

export async function syncPhoneContacts(): Promise<Contact[]> {
  if (Platform.OS === 'web') {
    Alert.alert('Not Available', 'Phone contacts sync is not available on web');
    return [];
  }

  try {
    const { status } = await Contacts.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Please enable contacts access in your device settings to sync contacts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return [];
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Image,
      ],
    });

    const contacts: Contact[] = data.map(contact => ({
      id: `phone_${contact.id}`,
      name: contact.name || 'Unknown',
      email: contact.emails?.[0]?.email,
      phone: contact.phoneNumbers?.[0]?.number,
      source: 'phone' as ContactSource,
      avatar: contact.image?.uri,
      isAppUser: false,
      syncedAt: new Date().toISOString(),
    }));

    return contacts;
  } catch (error) {
    console.error('Failed to sync phone contacts:', error);
    Alert.alert('Error', 'Failed to sync phone contacts');
    return [];
  }
}

export async function syncGmailContacts(): Promise<Contact[]> {
  Alert.alert(
    'Gmail Sync',
    'Gmail contact syncing requires OAuth authentication. This feature will connect to your Google account to fetch your contacts.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Continue', 
        onPress: () => {
          Alert.alert('Coming Soon', 'Gmail sync will be available in the next update');
        }
      }
    ]
  );
  return [];
}

export async function syncOutlookContacts(): Promise<Contact[]> {
  Alert.alert(
    'Outlook Sync',
    'Outlook contact syncing requires OAuth authentication. This feature will connect to your Microsoft account to fetch your contacts.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Continue', 
        onPress: () => {
          Alert.alert('Coming Soon', 'Outlook sync will be available in the next update');
        }
      }
    ]
  );
  return [];
}

export async function syncFacebookContacts(): Promise<Contact[]> {
  Alert.alert(
    'Facebook Sync',
    'Facebook contact syncing requires Facebook authentication. This feature will connect to your Facebook account to find your friends.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Continue', 
        onPress: () => {
          Alert.alert('Coming Soon', 'Facebook sync will be available in the next update');
        }
      }
    ]
  );
  return [];
}

export async function syncLinkedInContacts(): Promise<Contact[]> {
  Alert.alert(
    'LinkedIn Sync',
    'LinkedIn contact syncing requires LinkedIn authentication. This feature will connect to your LinkedIn account to fetch your professional connections.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Continue', 
        onPress: () => {
          Alert.alert('Coming Soon', 'LinkedIn sync will be available in the next update');
        }
      }
    ]
  );
  return [];
}

export async function syncTeamsContacts(): Promise<Contact[]> {
  Alert.alert(
    'Microsoft Teams Sync',
    'Microsoft Teams contact syncing requires Microsoft authentication. This feature will connect to your Teams account to fetch your work contacts and colleagues.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Continue', 
        onPress: () => {
          Alert.alert('Coming Soon', 'Microsoft Teams sync will be available in the next update');
        }
      }
    ]
  );
  return [];
}

export async function syncWhatsAppContacts(): Promise<Contact[]> {
  Alert.alert(
    'WhatsApp Sync',
    'WhatsApp contact syncing will access your WhatsApp contacts to find friends using the app. This feature requires WhatsApp Business API integration.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Continue', 
        onPress: () => {
          Alert.alert('Coming Soon', 'WhatsApp sync will be available in the next update');
        }
      }
    ]
  );
  return [];
}

export function matchContactsWithProfiles(
  contacts: Contact[],
  profiles: UserProfile[]
): Contact[] {
  return contacts.map(contact => {
    const matchedProfile = profiles.find(profile => {
      const emailMatch = contact.email && profile.email && 
        contact.email.toLowerCase() === profile.email.toLowerCase();
      
      const phoneMatch = contact.phone && profile.phone && 
        normalizePhoneNumber(contact.phone) === normalizePhoneNumber(profile.phone);

      return emailMatch || phoneMatch;
    });

    if (matchedProfile) {
      return {
        ...contact,
        isAppUser: true,
        profileId: matchedProfile.id,
      };
    }

    return contact;
  });
}

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function groupContactsBySource(contacts: Contact[]): Record<ContactSource, Contact[]> {
  return contacts.reduce((acc, contact) => {
    if (!acc[contact.source]) {
      acc[contact.source] = [];
    }
    acc[contact.source].push(contact);
    return acc;
  }, {} as Record<ContactSource, Contact[]>);
}

export function filterAppUsers(contacts: Contact[]): Contact[] {
  return contacts.filter(contact => contact.isAppUser);
}

export function filterNonAppUsers(contacts: Contact[]): Contact[] {
  return contacts.filter(contact => !contact.isAppUser);
}

export function searchContacts(contacts: Contact[], query: string): Contact[] {
  if (!query.trim()) {
    return contacts;
  }

  const lowercaseQuery = query.toLowerCase();
  return contacts.filter(contact =>
    contact.name.toLowerCase().includes(lowercaseQuery) ||
    contact.email?.toLowerCase().includes(lowercaseQuery) ||
    contact.phone?.includes(query)
  );
}

export async function syncXContacts(): Promise<Contact[]> {
  Alert.alert(
    'X (Twitter) Sync',
    'X contact syncing will access your X followers and following to find friends using the app. This feature requires X API authentication.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Continue', 
        onPress: () => {
          Alert.alert('Coming Soon', 'X sync will be available in the next update');
        }
      }
    ]
  );
  return [];
}

export async function syncDiscordContacts(): Promise<Contact[]> {
  Alert.alert(
    'Discord Sync',
    'Discord contact syncing will access your Discord friends and server members to find friends using the app. This feature requires Discord OAuth authentication.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Continue', 
        onPress: () => {
          Alert.alert('Coming Soon', 'Discord sync will be available in the next update');
        }
      }
    ]
  );
  return [];
}

export async function inviteNonAppUser(contact: Contact): Promise<void> {
  const message = encodeURIComponent(
    `Hey ${contact.name}! I'm using 1Way Calendar to organize events. Join me on the app!`
  );

  if (contact.phone) {
    const phoneNumber = normalizePhoneNumber(contact.phone);
    const smsUrl = Platform.select({
      ios: `sms:${phoneNumber}&body=${message}`,
      android: `sms:${phoneNumber}?body=${message}`,
      default: `sms:${phoneNumber}?body=${message}`,
    });
    
    try {
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Error', 'Cannot open SMS app');
      }
    } catch (error) {
      console.error('Failed to open SMS:', error);
      Alert.alert('Error', 'Failed to open SMS app');
    }
  } else {
    Alert.alert('No Contact Info', 'This contact has no phone number');
  }
}
