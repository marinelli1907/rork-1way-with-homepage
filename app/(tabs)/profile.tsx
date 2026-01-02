import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Save, Camera, CreditCard, ChevronRight, Tag, LogOut, Plus, Trash2, Home, Users, CalendarDays } from 'lucide-react-native';
import RotatingAdHeader from '@/components/RotatingAdHeader';
import { useProfiles } from '@/providers/ProfilesProvider';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useEvents } from '@/providers/EventsProvider';
import { SavedAddress } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { myProfile, updateMyProfile, getConnectedProfiles, groups } = useProfiles();
  const { signOut } = useAuth();
  const { upcomingEvents } = useEvents();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressComponents, setAddressComponents] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
  });
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  const connectedProfiles = useMemo(() => getConnectedProfiles(), [getConnectedProfiles]);
  const connectionCount = connectedProfiles.length;
  const groupCount = groups.length;
  const savedAddressCount = savedAddresses.length;
  const nextEvent = useMemo(() => upcomingEvents[0] ?? null, [upcomingEvents]);
  const nextEventLabel = useMemo(() => {
    if (!nextEvent) {
      return 'No upcoming events yet';
    }
    try {
      const eventDate = new Date(nextEvent.startISO);
      const dateLabel = eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const timeLabel = eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return `${dateLabel} · ${timeLabel}`;
    } catch (error) {
      console.log('Failed to format next event date', error);
      return 'Upcoming details unavailable';
    }
  }, [nextEvent]);
  const nextEventTitle = nextEvent?.title ?? 'Add your next plan';

  const handleNavigateToConnections = useCallback(() => {
    console.log('Navigating to connections from profile insights');
    router.push('/connections');
  }, [router]);

  const handleNavigateToGroups = useCallback(() => {
    console.log('Navigating to groups from profile insights');
    router.push('/groups');
  }, [router]);

  const handleManageAddresses = useCallback(() => {
    console.log('Opening saved addresses manager from profile insights');
    setIsEditing(true);
    setShowAddAddressForm(true);
  }, []);

  const handleNavigateToEvents = useCallback(() => {
    console.log('Navigating to upcoming events from profile insights');
    router.push('/my-events');
  }, [router]);

  useEffect(() => {
    if (myProfile) {
      setName(myProfile.name || '');
      setFirstName(myProfile.firstName || '');
      setMiddleName(myProfile.middleName || '');
      setLastName(myProfile.lastName || '');
      setEmail(myProfile.email || '');
      setPhone(myProfile.phone || '');
      setAddress(myProfile.address || '');
      setCompany(myProfile.company || '');
      setPosition(myProfile.position || '');
      setDateOfBirth(myProfile.dateOfBirth || '');
      setSavedAddresses(myProfile.savedAddresses || []);

      if (myProfile.street || myProfile.city || myProfile.state || myProfile.zip) {
        setAddressComponents({
          street: myProfile.street || '',
          city: myProfile.city || '',
          state: myProfile.state || '',
          zip: myProfile.zip || '',
        });
      } else if (myProfile.address) {
        const parts = myProfile.address.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          setAddressComponents({
            street: parts[0] || '',
            city: parts[1] || '',
            state: parts[2]?.split(' ')[0] || '',
            zip: parts[2]?.split(' ')[1] || '',
          });
        }
      }
    }
  }, [myProfile]);

  const saveProfile = async () => {
    try {
      const formattedAddress = addressComponents.street && addressComponents.city && addressComponents.state && addressComponents.zip
        ? `${addressComponents.street}, ${addressComponents.city}, ${addressComponents.state} ${addressComponents.zip}`
        : address;

      await updateMyProfile({
        name,
        firstName,
        middleName,
        lastName,
        email,
        phone,
        address: formattedAddress,
        street: addressComponents.street,
        city: addressComponents.city,
        state: addressComponents.state,
        zip: addressComponents.zip,
        company,
        position,
        dateOfBirth,
        savedAddresses,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsUploadingImage(true);
        const imageUri = result.assets[0].uri;
        
        await updateMyProfile({
          avatar: imageUri,
        });
        
        Alert.alert('Success', 'Profile photo updated!');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsUploadingImage(true);
        const imageUri = result.assets[0].uri;
        
        await updateMyProfile({
          avatar: imageUri,
        });
        
        Alert.alert('Success', 'Profile photo updated!');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleAddAddress = () => {
    if (!newAddressLabel.trim() || !newAddressLine.trim()) {
      Alert.alert('Error', 'Please enter label and address');
      return;
    }

    const newAddress: SavedAddress = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: newAddressLabel.trim(),
      line1: newAddressLine.trim(),
      createdAt: new Date().toISOString(),
    };

    setSavedAddresses([...savedAddresses, newAddress]);
    setNewAddressLabel('');
    setNewAddressLine('');
    setShowAddAddressForm(false);
  };

  const handleRemoveAddress = (id: string) => {
    Alert.alert(
      'Remove Address',
      'Are you sure you want to remove this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSavedAddresses(savedAddresses.filter(addr => addr.id !== id));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerBackground, { paddingTop: insets.top + 20 }]}>
        <View style={styles.toolbar}>
          <RotatingAdHeader />
          <View style={styles.titleBar}>
            <Text style={styles.pageTitle}>Profile</Text>
            <Pressable
              style={styles.editButton}
              onPress={() => {
                if (isEditing) {
                  saveProfile();
                } else {
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? (
                <Save size={20} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Text style={styles.editButtonText}>Edit Profile</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarContainer}>
          <Pressable onPress={isEditing ? handleChangePhoto : undefined} disabled={isUploadingImage}>
            <View style={styles.avatar}>
              {isUploadingImage ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (myProfile?.avatar && myProfile.avatar.trim() !== '') ? (
                <Image
                  source={{ uri: myProfile.avatar }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <User size={48} color="#FFFFFF" strokeWidth={2} />
              )}
              {isEditing && !isUploadingImage && (
                <View style={styles.cameraOverlay}>
                  <Camera size={24} color="#FFFFFF" strokeWidth={2} />
                </View>
              )}
            </View>
          </Pressable>
          {isEditing && !isUploadingImage && (
            <Pressable style={styles.changeAvatarButton} onPress={handleChangePhoto}>
              <Text style={styles.changeAvatarText}>Change Photo</Text>
            </Pressable>
          )}
          {isUploadingImage && (
            <Text style={styles.uploadingText}>Uploading...</Text>
          )}
        </View>
        <View style={styles.insightsSection} testID="profile-insights">
          <LinearGradient
            colors={['#1E3A8A', '#312E81']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.insightsGradient}
          >
            <View style={styles.insightsHeader}>
              <Text style={styles.insightsTitle}>Your Network Pulse</Text>
              <Text style={styles.insightsSubtitle}>Keep momentum going with your community</Text>
            </View>
            <View style={styles.insightsStatsRow}>
              <Pressable
                testID="profile-stat-connections"
                style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
                onPress={handleNavigateToConnections}
              >
                <View style={[styles.statIconCircle, styles.statIconConnections]}>
                  <Users size={20} color="#1E3A8A" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{connectionCount}</Text>
                <Text style={styles.statLabel}>Connections</Text>
              </Pressable>
              <Pressable
                testID="profile-stat-groups"
                style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
                onPress={handleNavigateToGroups}
              >
                <View style={[styles.statIconCircle, styles.statIconGroups]}>
                  <Users size={20} color="#0F172A" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{groupCount}</Text>
                <Text style={styles.statLabel}>Groups</Text>
              </Pressable>
              <Pressable
                testID="profile-stat-addresses"
                style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
                onPress={handleManageAddresses}
              >
                <View style={[styles.statIconCircle, styles.statIconAddresses]}>
                  <Home size={20} color="#0F172A" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{savedAddressCount}</Text>
                <Text style={styles.statLabel}>Saved Spots</Text>
              </Pressable>
            </View>
            <Pressable
              testID="profile-next-event"
              style={({ pressed }) => [styles.nextEventCard, pressed && styles.nextEventCardPressed]}
              onPress={handleNavigateToEvents}
            >
              <View style={styles.nextEventIcon}>
                <CalendarDays size={22} color="#1E3A8A" strokeWidth={2} />
              </View>
              <View style={styles.nextEventContent}>
                <Text style={styles.nextEventTitle}>{nextEventTitle}</Text>
                <Text style={styles.nextEventSubtitle}>{nextEventLabel}</Text>
              </View>
              <ChevronRight size={18} color="#1E3A8A" strokeWidth={2} />
            </Pressable>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <User size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>First Name</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.fieldValue}>{firstName || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <User size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>Middle Name</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={middleName}
              onChangeText={setMiddleName}
              placeholder="Enter your middle name"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.fieldValue}>{middleName || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <User size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>Last Name</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.fieldValue}>{lastName || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Mail size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>Email</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.fieldValue}>{email || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Phone size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>Phone</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.fieldValue}>{phone || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <MapPin size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>Street Address</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={addressComponents.street}
              onChangeText={(text) => {
                const newAddress = { ...addressComponents, street: text };
                setAddressComponents(newAddress);
                if (newAddress.street && newAddress.city && newAddress.state && newAddress.zip) {
                  setAddress(`${newAddress.street}, ${newAddress.city}, ${newAddress.state} ${newAddress.zip}`);
                }
              }}
              placeholder="Enter street address"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.fieldValue}>{addressComponents.street || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <MapPin size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>City</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={addressComponents.city}
              onChangeText={(text) => {
                const newAddress = { ...addressComponents, city: text };
                setAddressComponents(newAddress);
                if (newAddress.street && newAddress.city && newAddress.state && newAddress.zip) {
                  setAddress(`${newAddress.street}, ${newAddress.city}, ${newAddress.state} ${newAddress.zip}`);
                }
              }}
              placeholder="Enter city"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.fieldValue}>{addressComponents.city || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <MapPin size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>State</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={addressComponents.state}
              onChangeText={(text) => {
                const newAddress = { ...addressComponents, state: text };
                setAddressComponents(newAddress);
                if (newAddress.street && newAddress.city && newAddress.state && newAddress.zip) {
                  setAddress(`${newAddress.street}, ${newAddress.city}, ${newAddress.state} ${newAddress.zip}`);
                }
              }}
              placeholder="Enter state"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              maxLength={2}
            />
          ) : (
            <Text style={styles.fieldValue}>{addressComponents.state || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <MapPin size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>ZIP Code</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={addressComponents.zip}
              onChangeText={(text) => {
                const newAddress = { ...addressComponents, zip: text };
                setAddressComponents(newAddress);
                if (newAddress.street && newAddress.city && newAddress.state && newAddress.zip) {
                  setAddress(`${newAddress.street}, ${newAddress.city}, ${newAddress.state} ${newAddress.zip}`);
                }
              }}
              placeholder="Enter ZIP code"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={5}
            />
          ) : (
            <Text style={styles.fieldValue}>{addressComponents.zip || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Briefcase size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>Company</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="Enter your company"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.fieldValue}>{company || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Briefcase size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>Position</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={position}
              onChangeText={setPosition}
              placeholder="Enter your position"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.fieldValue}>{position || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Calendar size={20} color="#1E3A8A" strokeWidth={2} />
            <Text style={styles.fieldLabel}>Date of Birth</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.fieldValue}>{dateOfBirth || 'Not set'}</Text>
          )}
        </View>

        {isEditing && (
          <View style={styles.section}>
            <View style={styles.fieldHeader}>
              <Home size={20} color="#1E3A8A" strokeWidth={2} />
              <Text style={styles.fieldLabel}>Saved Addresses</Text>
            </View>
            
            {savedAddresses.map((addr) => (
              <View key={addr.id} style={styles.savedAddressCard}>
                <View style={styles.savedAddressInfo}>
                  <Text style={styles.savedAddressLabel}>{addr.label}</Text>
                  <Text style={styles.savedAddressLine}>{addr.line1}</Text>
                  {addr.city && (
                    <Text style={styles.savedAddressLine}>
                      {addr.city}{addr.state ? `, ${addr.state}` : ''}{addr.zip ? ` ${addr.zip}` : ''}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => handleRemoveAddress(addr.id)}
                  style={styles.removeAddressButton}
                >
                  <Trash2 size={18} color="#DC2626" strokeWidth={2} />
                </Pressable>
              </View>
            ))}

            {showAddAddressForm ? (
              <View style={styles.addAddressForm}>
                <TextInput
                  style={styles.input}
                  value={newAddressLabel}
                  onChangeText={setNewAddressLabel}
                  placeholder="Label (e.g., Home, Work)"
                  placeholderTextColor="#94A3B8"
                />
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  value={newAddressLine}
                  onChangeText={setNewAddressLine}
                  placeholder="Address"
                  placeholderTextColor="#94A3B8"
                />
                <View style={styles.addAddressActions}>
                  <Pressable
                    style={styles.addAddressCancelButton}
                    onPress={() => {
                      setShowAddAddressForm(false);
                      setNewAddressLabel('');
                      setNewAddressLine('');
                    }}
                  >
                    <Text style={styles.addAddressCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.addAddressSaveButton}
                    onPress={handleAddAddress}
                  >
                    <Text style={styles.addAddressSaveText}>Add</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.addAddressButton}
                onPress={() => setShowAddAddressForm(true)}
              >
                <Plus size={20} color="#1E3A8A" strokeWidth={2} />
                <Text style={styles.addAddressButtonText}>Add Saved Address</Text>
              </Pressable>
            )}
          </View>
        )}

        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment & Rewards</Text>
            <Pressable
              style={[styles.menuItem, styles.menuItemWithMargin]}
              onPress={() => router.push('/payment-methods')}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <CreditCard size={20} color="#1E3A8A" strokeWidth={2} />
                </View>
                <Text style={styles.menuItemText}>Payment Methods</Text>
              </View>
              <ChevronRight size={20} color="#94A3B8" />
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push('/manage-coupons')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, styles.menuIconCoupon]}>
                  <Tag size={20} color="#059669" strokeWidth={2} />
                </View>
                <Text style={styles.menuItemText}>Manage Coupons</Text>
              </View>
              <ChevronRight size={20} color="#94A3B8" />
            </Pressable>
          </View>
        )}

        {!isEditing && (
          <View style={styles.section}>
            <Pressable
              style={[styles.menuItem, styles.logoutButton]}
              onPress={handleLogout}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, styles.menuIconLogout]}>
                  <LogOut size={20} color="#DC2626" strokeWidth={2} />
                </View>
                <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBackground: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  toolbar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E3A8A',
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  insightsSection: {
    marginBottom: 32,
  },
  insightsGradient: {
    borderRadius: 24,
    padding: 20,
    gap: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  insightsHeader: {
    gap: 6,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F8FAFC',
    flexShrink: 1,
  },
  insightsSubtitle: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  insightsStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  statCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  statIconCircle: {
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconConnections: {
    backgroundColor: '#DBEAFE',
  },
  statIconGroups: {
    backgroundColor: '#E2E8F0',
  },
  statIconAddresses: {
    backgroundColor: '#FDE68A',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
  },
  nextEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  nextEventCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  nextEventIcon: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextEventContent: {
    flex: 1,
    gap: 4,
  },
  nextEventTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  nextEventSubtitle: {
    fontSize: 13,
    color: '#475569',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 58, 138, 0.8)',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
  },
  changeAvatarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  changeAvatarText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  section: {
    marginBottom: 24,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldValue: {
    fontSize: 16,
    color: '#64748B',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  menuItemWithMargin: {
    marginBottom: 12,
  },
  menuIconCoupon: {
    backgroundColor: '#ECFDF5',
  },
  menuIconLogout: {
    backgroundColor: '#FEE2E2',
  },
  logoutButton: {
    borderColor: '#FECACA',
  },
  logoutText: {
    color: '#DC2626',
  },
  savedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  savedAddressInfo: {
    flex: 1,
  },
  savedAddressLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  savedAddressLine: {
    fontSize: 13,
    color: '#64748B',
  },
  removeAddressButton: {
    padding: 8,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    borderStyle: 'dashed',
  },
  addAddressButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  addAddressForm: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  addAddressActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  addAddressCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  addAddressCancelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  addAddressSaveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  addAddressSaveText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
