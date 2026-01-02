import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/providers/AuthProvider';
import { DollarSign, TrendingUp, Clock, Calendar } from 'lucide-react-native';

interface EarningPeriod {
  period: string;
  amount: number;
  rides: number;
  hours: number;
}

interface Transaction {
  id: string;
  date: string;
  customerName: string;
  amount: number;
  status: 'completed' | 'pending';
}

const mockEarnings: EarningPeriod[] = [
  { period: 'Today', amount: 145.50, rides: 6, hours: 4.5 },
  { period: 'This Week', amount: 892.00, rides: 38, hours: 32 },
  { period: 'This Month', amount: 3456.80, rides: 156, hours: 128 },
  { period: 'All Time', amount: 12890.50, rides: 543, hours: 456 },
];

const mockTransactions: Transaction[] = [
  {
    id: 'txn_1',
    date: new Date().toISOString(),
    customerName: 'John Smith',
    amount: 45.50,
    status: 'completed',
  },
  {
    id: 'txn_2',
    date: new Date(Date.now() - 3600000).toISOString(),
    customerName: 'Sarah Johnson',
    amount: 65.00,
    status: 'completed',
  },
  {
    id: 'txn_3',
    date: new Date(Date.now() - 7200000).toISOString(),
    customerName: 'Mike Davis',
    amount: 35.00,
    status: 'completed',
  },
];

export default function DriverEarningsScreen() {
  const { driverInfo } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  const selectedEarning = mockEarnings.find(e => e.period === selectedPeriod) || mockEarnings[0];
  const averagePerRide = selectedEarning.amount / selectedEarning.rides;
  const averagePerHour = selectedEarning.amount / selectedEarning.hours;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.totalEarnings}>
          <Text style={styles.currencySymbol}>$</Text>
          <Text style={styles.totalAmount}>{selectedEarning.amount.toFixed(2)}</Text>
        </View>
        <Text style={styles.periodLabel}>{selectedPeriod}</Text>
      </LinearGradient>

      <View style={styles.periodSelector}>
        {mockEarnings.map(earning => (
          <TouchableOpacity
            key={earning.period}
            style={[
              styles.periodButton,
              selectedPeriod === earning.period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(earning.period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === earning.period && styles.periodButtonTextActive,
              ]}
            >
              {earning.period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <DollarSign size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{selectedEarning.rides}</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{selectedEarning.hours}h</Text>
            <Text style={styles.statLabel}>Hours Online</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingUp size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>${averagePerRide.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Avg per Ride</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Calendar size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>${averagePerHour.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Avg per Hour</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {mockTransactions.map(transaction => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <Text style={styles.customerName}>{transaction.customerName}</Text>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.date)}
                </Text>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>
                  ${transaction.amount.toFixed(2)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    transaction.status === 'completed'
                      ? styles.statusCompleted
                      : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      transaction.status === 'completed'
                        ? styles.statusTextCompleted
                        : styles.statusTextPending,
                    ]}
                  >
                    {transaction.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.payoutSection}>
          <View style={styles.payoutCard}>
            <Text style={styles.payoutTitle}>Available for Payout</Text>
            <Text style={styles.payoutAmount}>$892.00</Text>
            <TouchableOpacity style={styles.payoutButton}>
              <Text style={styles.payoutButtonText}>Cash Out</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.payoutNote}>
            Instant payouts available 24/7. Standard payouts are free and arrive in 1-3 business days.
          </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  totalEarnings: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  totalAmount: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
  },
  periodLabel: {
    fontSize: 14,
    color: '#D1FAE5',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#10B981',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748B',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusTextCompleted: {
    color: '#166534',
  },
  statusTextPending: {
    color: '#92400E',
  },
  payoutSection: {
    marginTop: 8,
  },
  payoutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payoutTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  payoutAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  payoutButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  payoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  payoutNote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
