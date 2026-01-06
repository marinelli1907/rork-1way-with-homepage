import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  History,
  Receipt,
  Star,
  CreditCard,
  Wallet,
  MapPin,
  Tag,
  HelpCircle,
  FileText,
  ChevronRight,
  LogOut,
  Edit3,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import ScreenShell from '@/components/ScreenShell';
import { useProfiles } from '@/providers/ProfilesProvider';

type MenuItem = {
  icon: typeof User;
  title: string;
  onPress: () => void;
  iconBg?: string;
  iconColor?: string;
};

type Section = {
  title: string;
  items: MenuItem[];
};

const MOCK_USER = {
  name: 'Jordan Smith',
  avatar: 'https://i.pravatar.cc/300?img=12',
  rating: 4.8,
  totalTrips: 127,
  email: 'jordan.smith@example.com',
  phone: '+1 (555) 123-4567',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { myProfile } = useProfiles();

  const handleEditProfile = () => {
    router.push('/edit-profile' as any);
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

  const sections: Section[] = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          title: 'Name',
          onPress: () => console.log('Name tapped'),
          iconBg: '#EFF6FF',
          iconColor: '#2563EB',
        },
        {
          icon: Mail,
          title: 'Email',
          onPress: () => console.log('Email tapped'),
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
        },
        {
          icon: Phone,
          title: 'Phone Number',
          onPress: () => console.log('Phone tapped'),
          iconBg: '#D1FAE5',
          iconColor: '#059669',
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: Lock,
          title: 'Change Password',
          onPress: () => Alert.alert('Change Password', 'Password update screen'),
          iconBg: '#FCE7F3',
          iconColor: '#DB2777',
        },
        {
          icon: Shield,
          title: 'Two-Factor Authentication',
          onPress: () => Alert.alert('2FA', 'Enable two-factor authentication'),
          iconBg: '#E0E7FF',
          iconColor: '#6366F1',
        },
        {
          icon: Shield,
          title: 'Face ID / Biometrics',
          onPress: () => Alert.alert('Biometrics', 'Biometric settings'),
          iconBg: '#DBEAFE',
          iconColor: '#0284C7',
        },
      ],
    },
    {
      title: 'Trips',
      items: [
        {
          icon: History,
          title: 'Trip History',
          onPress: () => router.push('/ride-history'),
          iconBg: '#E0E7FF',
          iconColor: '#4F46E5',
        },
        {
          icon: Receipt,
          title: 'Receipts',
          onPress: () => Alert.alert('Receipts', 'View all receipts'),
          iconBg: '#DBEAFE',
          iconColor: '#0EA5E9',
        },
        {
          icon: Star,
          title: 'Ratings',
          onPress: () => Alert.alert('Ratings', 'View your ratings'),
          iconBg: '#FEF3C7',
          iconColor: '#F59E0B',
        },
      ],
    },
    {
      title: 'Payments',
      items: [
        {
          icon: CreditCard,
          title: 'Payment Methods',
          onPress: () => router.push('/payment-methods'),
          iconBg: '#E0E7FF',
          iconColor: '#5B21B6',
        },
        {
          icon: Wallet,
          title: 'Wallet / Balance',
          onPress: () => Alert.alert('Wallet', 'View wallet and balance'),
          iconBg: '#D1FAE5',
          iconColor: '#10B981',
        },
      ],
    },
    {
      title: 'Saved',
      items: [
        {
          icon: MapPin,
          title: 'Saved Addresses',
          onPress: () => Alert.alert('Addresses', 'Manage saved addresses'),
          iconBg: '#FED7AA',
          iconColor: '#EA580C',
        },
        {
          icon: Tag,
          title: 'Coupons',
          onPress: () => router.push('/manage-coupons'),
          iconBg: '#D1FAE5',
          iconColor: '#059669',
        },
      ],
    },
    {
      title: 'Support & Legal',
      items: [
        {
          icon: HelpCircle,
          title: 'Help / Contact Support',
          onPress: () => Alert.alert('Support', 'Contact customer support'),
          iconBg: '#DBEAFE',
          iconColor: '#0284C7',
        },
        {
          icon: FileText,
          title: 'Terms of Service',
          onPress: () => Alert.alert('Terms', 'View terms of service'),
          iconBg: '#F3E8FF',
          iconColor: '#9333EA',
        },
        {
          icon: FileText,
          title: 'Privacy Policy',
          onPress: () => Alert.alert('Privacy', 'View privacy policy'),
          iconBg: '#E0E7FF',
          iconColor: '#6366F1',
        },
      ],
    },
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Text key={`full-${i}`} style={styles.starFull}>
          ★
        </Text>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Text key="half" style={styles.starFull}>
          ★
        </Text>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Text key={`empty-${i}`} style={styles.starEmpty}>
          ★
        </Text>
      );
    }

    return stars;
  };

  const displayName = myProfile?.name ?? MOCK_USER.name;
  const displayAvatar = myProfile?.avatar ?? MOCK_USER.avatar;
  const hasAnimals = myProfile?.hasAnimals ?? false;
  const animalCount = Math.max(0, myProfile?.animalCount ?? 0);
  const animalsLabel = hasAnimals ? `${animalCount} animal${animalCount === 1 ? '' : 's'}` : 'No animals';
  const handicapLabel = (myProfile?.isHandicap ?? false) ? 'Handicap: Yes' : 'Handicap: No';

  return (
    <ScreenShell>

        <View style={styles.userSummary}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: displayAvatar }}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.userName}>{displayName}</Text>

          <View style={styles.badgesRow}>
            <View style={[styles.badge, (myProfile?.isHandicap ?? false) ? styles.badgeBlue : styles.badgeNeutral]}>
              <Text style={styles.badgeText}>{handicapLabel}</Text>
            </View>
            <View style={[styles.badge, hasAnimals ? styles.badgeWarm : styles.badgeNeutral]}>
              <Text style={styles.badgeText}>{animalsLabel}</Text>
            </View>
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.stars}>{renderStars(MOCK_USER.rating)}</View>
            <Text style={styles.ratingText}>{MOCK_USER.rating}</Text>
          </View>

          <Text style={styles.tripsText}>{MOCK_USER.totalTrips} trips completed</Text>

          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.editButtonPressed,
            ]}
            onPress={handleEditProfile}
            testID="profileEditButton"
          >
            <Edit3 size={14} color="#2563EB" strokeWidth={2.5} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>

        {sections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isLast = itemIndex === section.items.length - 1;
                return (
                  <Pressable
                    key={item.title}
                    style={({ pressed }) => [
                      styles.menuItem,
                      !isLast && styles.menuItemBorder,
                      pressed && styles.menuItemPressed,
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={styles.menuItemLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: item.iconBg || '#F1F5F9' },
                        ]}
                      >
                        <Icon
                          size={20}
                          color={item.iconColor || '#64748B'}
                          strokeWidth={2}
                        />
                      </View>
                      <Text style={styles.menuItemText}>{item.title}</Text>
                    </View>
                    <ChevronRight size={20} color="#CBD5E1" strokeWidth={2} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <View style={styles.card}>
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={handleLogout}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, styles.logoutIconBg]}>
                  <LogOut size={20} color="#DC2626" strokeWidth={2} />
                </View>
                <Text style={[styles.menuItemText, styles.logoutText]}>
                  Log Out
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  userSummary: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E2E8F0',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0F172A',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeBlue: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  badgeWarm: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderColor: 'rgba(217, 119, 6, 0.22)',
  },
  badgeNeutral: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  starFull: {
    fontSize: 16,
    color: '#FBBF24',
  },
  starEmpty: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#475569',
  },
  tripsText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  editButtonPressed: {
    backgroundColor: '#DBEAFE',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemPressed: {
    backgroundColor: '#F8FAFC',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#1E293B',
  },
  logoutIconBg: {
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600' as const,
  },
});
