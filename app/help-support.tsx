import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ChevronDown,
  Search,
  CreditCard,
  Car,
  MapPin,
  Shield,
  AlertCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    question: 'How do I cancel a ride?',
    answer: 'You can cancel a ride from the ride details screen before the driver arrives. If the driver has already started heading to your location, a cancellation fee may apply.',
    category: 'rides',
  },
  {
    id: '2',
    question: 'How do I add a payment method?',
    answer: 'Go to Profile > Payment Methods and tap "Add Payment Method". You can add credit/debit cards or link your bank account.',
    category: 'payments',
  },
  {
    id: '3',
    question: 'What if I left something in the car?',
    answer: 'Check your ride history and contact the driver directly through the app. You can also reach out to our support team for assistance.',
    category: 'rides',
  },
  {
    id: '4',
    question: 'How do I change my pickup location?',
    answer: 'You can modify your pickup location before confirming your ride request. Once a driver is assigned, changes may require canceling and rebooking.',
    category: 'rides',
  },
  {
    id: '5',
    question: 'How do refunds work?',
    answer: 'Refunds are processed within 5-7 business days to your original payment method. You can request a refund through the receipt in your ride history.',
    category: 'payments',
  },
  {
    id: '6',
    question: 'Is my personal information secure?',
    answer: 'Yes, we use industry-standard encryption to protect your data. We never share your personal information with third parties without your consent.',
    category: 'account',
  },
];

const CATEGORIES = [
  { id: 'rides', label: 'Rides', icon: Car },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'account', label: 'Account', icon: Shield },
  { id: 'locations', label: 'Locations', icon: MapPin },
];

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFAQs = FAQ_ITEMS.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContact = (method: 'chat' | 'phone' | 'email') => {
    switch (method) {
      case 'chat':
        Alert.alert('Live Chat', 'Connecting you with a support agent...');
        break;
      case 'phone':
        Linking.openURL('tel:+1-800-555-0123');
        break;
      case 'email':
        Linking.openURL('mailto:support@example.com');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Help & Support',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTitleStyle: { fontWeight: '600', color: '#0F172A' },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <Search size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for help..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactOptions}>
            <Pressable
              style={({ pressed }) => [styles.contactCard, pressed && styles.contactPressed]}
              onPress={() => handleContact('chat')}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#EFF6FF' }]}>
                <MessageCircle size={22} color="#2563EB" />
              </View>
              <Text style={styles.contactLabel}>Live Chat</Text>
              <Text style={styles.contactTime}>~2 min wait</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.contactCard, pressed && styles.contactPressed]}
              onPress={() => handleContact('phone')}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#D1FAE5' }]}>
                <Phone size={22} color="#059669" />
              </View>
              <Text style={styles.contactLabel}>Call Us</Text>
              <Text style={styles.contactTime}>24/7 Support</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.contactCard, pressed && styles.contactPressed]}
              onPress={() => handleContact('email')}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#FEF3C7' }]}>
                <Mail size={22} color="#D97706" />
              </View>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactTime}>~24h reply</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Browse by Topic</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                    onPress={() => setSelectedCategory(isSelected ? null : cat.id)}
                  >
                    <Icon size={16} color={isSelected ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {filteredFAQs.map((faq) => {
              const isExpanded = expandedFAQ === faq.id;
              return (
                <Pressable
                  key={faq.id}
                  style={styles.faqCard}
                  onPress={() => setExpandedFAQ(isExpanded ? null : faq.id)}
                >
                  <View style={styles.faqHeader}>
                    <HelpCircle size={20} color="#2563EB" />
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <ChevronDown
                      size={20}
                      color="#94A3B8"
                      style={isExpanded ? { transform: [{ rotate: '180deg' }] } : undefined}
                    />
                  </View>
                  {isExpanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.emergencySection}>
          <AlertCircle size={20} color="#DC2626" />
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>Emergency?</Text>
            <Text style={styles.emergencyText}>
              If you are in immediate danger, please call 911
            </Text>
          </View>
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
    gap: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0F172A',
    marginBottom: 12,
  },
  contactSection: {},
  contactOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  contactTime: {
    fontSize: 12,
    color: '#64748B',
  },
  categoriesSection: {},
  categoriesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748B',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  faqSection: {},
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  faqAnswer: {
    marginTop: 12,
    marginLeft: 32,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  emergencySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  emergencyText: {
    fontSize: 13,
    color: '#B91C1C',
    marginTop: 2,
  },
});
