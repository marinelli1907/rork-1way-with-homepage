import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By accessing or using our ride-sharing service, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.',
  },
  {
    title: '2. Service Description',
    content:
      'Our platform connects riders with drivers for transportation services. We act as an intermediary and do not directly provide transportation services. Drivers are independent contractors, not employees.',
  },
  {
    title: '3. User Accounts',
    content:
      'You must create an account to use our service. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate and complete information when creating your account.',
  },
  {
    title: '4. User Conduct',
    content:
      'You agree to use the service lawfully and respectfully. Prohibited behaviors include harassment, discrimination, fraud, impersonation, and any illegal activities. Violation of these terms may result in account suspension or termination.',
  },
  {
    title: '5. Payments and Fees',
    content:
      'Fares are calculated based on distance, time, and demand. You agree to pay all fees associated with your rides. Additional charges may apply for cancellations, wait times, or cleaning fees. All payments are processed securely through our platform.',
  },
  {
    title: '6. Cancellation Policy',
    content:
      'You may cancel a ride before the driver arrives. A cancellation fee may apply if canceled after the driver has started traveling to your location. Repeated cancellations may affect your account standing.',
  },
  {
    title: '7. Safety',
    content:
      'Your safety is our priority. All drivers undergo background checks. However, you acknowledge that transportation inherently involves risk. Please wear seatbelts and follow all safety guidelines.',
  },
  {
    title: '8. Limitation of Liability',
    content:
      'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.',
  },
  {
    title: '9. Modifications',
    content:
      'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.',
  },
  {
    title: '10. Contact',
    content:
      'If you have questions about these terms, please contact our support team through the app or email us at legal@example.com.',
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Terms of Service',
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
          <Text style={styles.lastUpdated}>Last Updated: January 1, 2024</Text>
          <Text style={styles.intro}>
            Please read these terms carefully before using our service. These terms govern your
            use of our ride-sharing platform.
          </Text>
        </View>

        {TERMS_SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using our service, you acknowledge that you have read, understood, and agree to
            be bound by these Terms of Service.
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
    gap: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  intro: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  sectionContent: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  footer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  footerText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
    textAlign: 'center',
  },
});
