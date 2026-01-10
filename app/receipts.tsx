import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Receipt,
  Download,
  Share2,
  MapPin,
  Filter,
  ChevronDown,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ReceiptItem = {
  id: string;
  date: string;
  time: string;
  pickup: string;
  destination: string;
  amount: number;
  tip: number;
  driver: string;
  eventType: string;
  paymentMethod: string;
};

const MOCK_RECEIPTS: ReceiptItem[] = [
  {
    id: 'R001',
    date: '2024-01-08',
    time: '7:30 PM',
    pickup: '123 Main St',
    destination: 'Rocket Mortgage FieldHouse',
    amount: 24.5,
    tip: 5.0,
    driver: 'Marcus T.',
    eventType: 'Concert',
    paymentMethod: 'Visa •••• 4242',
  },
  {
    id: 'R002',
    date: '2024-01-05',
    time: '6:00 PM',
    pickup: '456 Oak Ave',
    destination: 'Luca Italian Cuisine',
    amount: 18.0,
    tip: 4.0,
    driver: 'Sarah K.',
    eventType: 'Dinner',
    paymentMethod: 'Wallet',
  },
  {
    id: 'R003',
    date: '2024-01-02',
    time: '12:00 PM',
    pickup: '789 Elm Blvd',
    destination: 'Progressive Field',
    amount: 32.0,
    tip: 6.0,
    driver: 'James L.',
    eventType: 'Sports',
    paymentMethod: 'Mastercard •••• 5555',
  },
  {
    id: 'R004',
    date: '2023-12-28',
    time: '8:45 PM',
    pickup: '321 Pine St',
    destination: 'Atlas Cinemas',
    amount: 15.0,
    tip: 3.0,
    driver: 'Emily R.',
    eventType: 'Movie',
    paymentMethod: 'Visa •••• 4242',
  },
];

export default function ReceiptsScreen() {
  const insets = useSafeAreaInsets();
  const [receipts] = useState<ReceiptItem[]>(MOCK_RECEIPTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDownload = (receipt: ReceiptItem) => {
    Alert.alert('Download Receipt', `Receipt ${receipt.id} will be downloaded as PDF`);
  };

  const handleShare = (receipt: ReceiptItem) => {
    Alert.alert('Share Receipt', `Share options for receipt ${receipt.id}`);
  };

  const totalSpent = receipts.reduce((sum, r) => sum + r.amount + r.tip, 0);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Receipts',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTitleStyle: { fontWeight: '600', color: '#0F172A' },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Receipt size={24} color="#2563EB" />
            <View>
              <Text style={styles.summaryLabel}>Total This Month</Text>
              <Text style={styles.summaryAmount}>${totalSpent.toFixed(2)}</Text>
            </View>
          </View>
          <Pressable style={styles.filterButton}>
            <Filter size={18} color="#64748B" />
            <Text style={styles.filterText}>Filter</Text>
          </Pressable>
        </View>

        <View style={styles.receiptsList}>
          {receipts.map((receipt) => {
            const isExpanded = expandedId === receipt.id;
            const total = receipt.amount + receipt.tip;

            return (
              <Pressable
                key={receipt.id}
                style={styles.receiptCard}
                onPress={() => setExpandedId(isExpanded ? null : receipt.id)}
              >
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptInfo}>
                    <View style={styles.receiptBadge}>
                      <Text style={styles.receiptBadgeText}>{receipt.eventType}</Text>
                    </View>
                    <Text style={styles.receiptDate}>
                      {receipt.date} • {receipt.time}
                    </Text>
                  </View>
                  <View style={styles.receiptAmount}>
                    <Text style={styles.receiptTotal}>${total.toFixed(2)}</Text>
                    <ChevronDown
                      size={18}
                      color="#94A3B8"
                      style={isExpanded ? { transform: [{ rotate: '180deg' }] } : undefined}
                    />
                  </View>
                </View>

                <View style={styles.receiptRoute}>
                  <View style={styles.routePoint}>
                    <View style={styles.routeDot} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {receipt.pickup}
                    </Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routePoint}>
                    <MapPin size={12} color="#2563EB" />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {receipt.destination}
                    </Text>
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.receiptDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Driver</Text>
                      <Text style={styles.detailValue}>{receipt.driver}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fare</Text>
                      <Text style={styles.detailValue}>${receipt.amount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tip</Text>
                      <Text style={styles.detailValue}>${receipt.tip.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment</Text>
                      <Text style={styles.detailValue}>{receipt.paymentMethod}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Receipt ID</Text>
                      <Text style={styles.detailValue}>{receipt.id}</Text>
                    </View>

                    <View style={styles.receiptActions}>
                      <Pressable
                        style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                        onPress={() => handleDownload(receipt)}
                      >
                        <Download size={18} color="#2563EB" />
                        <Text style={styles.actionText}>Download</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                        onPress={() => handleShare(receipt)}
                      >
                        <Share2 size={18} color="#2563EB" />
                        <Text style={styles.actionText}>Share</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748B',
  },
  receiptsList: {
    gap: 12,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  receiptInfo: {
    gap: 4,
  },
  receiptBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  receiptBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  receiptDate: {
    fontSize: 13,
    color: '#64748B',
  },
  receiptAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  receiptRoute: {
    gap: 4,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: '#E2E8F0',
    marginLeft: 3,
  },
  routeText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  receiptDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1E293B',
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  actionPressed: {
    opacity: 0.8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
});
