import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { Shield, Eye, Database, Share2, Lock, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIVACY_SECTIONS = [
  {
    icon: Database,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    title: 'Information We Collect',
    items: [
      'Account information (name, email, phone number)',
      'Payment information (securely processed)',
      'Location data during rides',
      'Device information and usage data',
      'Communication records with support',
    ],
  },
  {
    icon: Eye,
    iconBg: '#F0FDF4',
    iconColor: '#10B981',
    title: 'How We Use Your Data',
    items: [
      'Provide and improve our services',
      'Process payments and prevent fraud',
      'Connect you with nearby drivers',
      'Send important service updates',
      'Personalize your experience',
    ],
  },
  {
    icon: Share2,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    title: 'Information Sharing',
    items: [
      'Drivers receive your pickup/dropoff location',
      'Payment processors handle transactions',
      'Law enforcement when legally required',
      'We never sell your personal data',
    ],
  },
  {
    icon: Lock,
    iconBg: '#FCE7F3',
    iconColor: '#DB2777',
    title: 'Data Security',
    items: [
      'Industry-standard encryption (TLS/SSL)',
      'Secure data centers with 24/7 monitoring',
      'Regular security audits and testing',
      'Employee access controls and training',
    ],
  },
  {
    icon: Trash2,
    iconBg: '#FEE2E2',
    iconColor: '#DC2626',
    title: 'Your Rights',
    items: [
      'Access your personal data',
      'Request data correction or deletion',
      'Opt out of marketing communications',
      'Download a copy of your data',
      'Close your account at any time',
    ],
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTitleStyle: { fontWeight: '600', color: '#0F172A' },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Shield size={32} color="#2563EB" />
          </View>
          <Text style={styles.headerTitle}>Your Privacy Matters</Text>
          <Text style={styles.headerSubtitle}>
            We are committed to protecting your personal information and being transparent about
            how we use it.
          </Text>
          <Text style={styles.lastUpdated}>Last Updated: January 1, 2024</Text>
        </View>

        {PRIVACY_SECTIONS.map((section, index) => {
          const Icon = section.icon;
          return (
            <View key={index} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: section.iconBg }]}>
                  <Icon size={22} color={section.iconColor} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <View style={styles.itemsList}>
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.item}>
                    <View style={styles.bullet} />
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions About Your Privacy?</Text>
          <Text style={styles.contactText}>
            Contact our Data Protection Officer at privacy@example.com or through the Help &
            Support section in the app.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  itemsList: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginTop: 7,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  contactText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
});
