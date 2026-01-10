import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  X,
  CreditCard,
  DollarSign,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
};

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'credit', amount: 25.0, description: 'Referral Bonus', date: '2024-01-08' },
  { id: '2', type: 'debit', amount: 15.5, description: 'Ride Payment', date: '2024-01-07' },
  { id: '3', type: 'credit', amount: 10.0, description: 'Promo Credit', date: '2024-01-05' },
  { id: '4', type: 'debit', amount: 22.0, description: 'Event Booking', date: '2024-01-03' },
  { id: '5', type: 'credit', amount: 50.0, description: 'Added Funds', date: '2024-01-01' },
];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(47.5);
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  const handleAddFunds = () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setBalance((prev) => prev + amount);
    setAddAmount('');
    setShowAddFundsModal(false);
    Alert.alert('Success', `$${amount.toFixed(2)} added to your wallet`);
  };

  const quickAmounts = [10, 25, 50, 100];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Wallet',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTitleStyle: { fontWeight: '600', color: '#0F172A' },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.walletIcon}>
              <Wallet size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
          <Pressable
            style={({ pressed }) => [styles.addFundsButton, pressed && styles.addFundsPressed]}
            onPress={() => setShowAddFundsModal(true)}
          >
            <Plus size={20} color="#10B981" />
            <Text style={styles.addFundsText}>Add Funds</Text>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
              <Gift size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Refer & Earn</Text>
          </Pressable>
          <Pressable style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
              <CreditCard size={22} color="#10B981" />
            </View>
            <Text style={styles.actionLabel}>Link Card</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={styles.transactionsList}>
            {transactions.map((tx) => (
              <View key={tx.id} style={styles.transactionItem}>
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.txIcon,
                      { backgroundColor: tx.type === 'credit' ? '#D1FAE5' : '#FEE2E2' },
                    ]}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft size={18} color="#059669" />
                    ) : (
                      <ArrowUpRight size={18} color="#DC2626" />
                    )}
                  </View>
                  <View>
                    <Text style={styles.txDescription}>{tx.description}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                </View>
                <Text
                  style={[styles.txAmount, { color: tx.type === 'credit' ? '#059669' : '#DC2626' }]}
                >
                  {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showAddFundsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Funds</Text>
              <Pressable onPress={() => setShowAddFundsModal(false)}>
                <X size={24} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.amountInputContainer}>
              <DollarSign size={28} color="#64748B" />
              <TextInput
                style={styles.amountInput}
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.quickAmounts}>
              {quickAmounts.map((amt) => (
                <Pressable
                  key={amt}
                  style={({ pressed }) => [
                    styles.quickAmountButton,
                    addAmount === amt.toString() && styles.quickAmountSelected,
                    pressed && styles.quickAmountPressed,
                  ]}
                  onPress={() => setAddAmount(amt.toString())}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      addAmount === amt.toString() && styles.quickAmountTextSelected,
                    ]}
                  >
                    ${amt}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmPressed]}
              onPress={handleAddFunds}
            >
              <Text style={styles.confirmButtonText}>Add to Wallet</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  balanceCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500' as const,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  addFundsPressed: {
    opacity: 0.9,
  },
  addFundsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  transactionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDescription: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#1E293B',
  },
  txDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#0F172A',
    minWidth: 120,
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  quickAmountSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  quickAmountPressed: {
    opacity: 0.8,
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  quickAmountTextSelected: {
    color: '#2563EB',
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmPressed: {
    opacity: 0.9,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
