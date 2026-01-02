
import { CreditCard, Smartphone, Plus, Trash2, Check } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePayment } from '@/providers/PaymentProvider';
import { PaymentMethodType } from '@/types';

export default function PaymentMethodsScreen() {
  const { paymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod, isLoading } = usePayment();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<PaymentMethodType>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPaymentMethod = async () => {
    if (selectedType === 'card') {
      if (!cardNumber || !cardExpiry || !cardCVV) {
        Alert.alert('Error', 'Please fill in all card details');
        return;
      }

      if (cardNumber.length < 13) {
        Alert.alert('Error', 'Please enter a valid card number');
        return;
      }

      const expiryParts = cardExpiry.split('/');
      if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
        Alert.alert('Error', 'Please enter expiry in MM/YY format');
        return;
      }
    } else if (selectedType === 'paypal') {
      if (!paypalEmail) {
        Alert.alert('Error', 'Please enter your PayPal email');
        return;
      }

      if (!paypalEmail.includes('@')) {
        Alert.alert('Error', 'Please enter a valid email');
        return;
      }
    }

    setIsAdding(true);
    Keyboard.dismiss();

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (selectedType === 'card') {
        const last4 = cardNumber.slice(-4);
        const brand = detectCardBrand(cardNumber);
        
        await addPaymentMethod({
          type: 'card',
          isDefault: paymentMethods.length === 0,
          cardLast4: last4,
          cardBrand: brand,
          cardExpiry: cardExpiry,
        });
      } else if (selectedType === 'paypal') {
        await addPaymentMethod({
          type: 'paypal',
          isDefault: paymentMethods.length === 0,
          paypalEmail: paypalEmail,
        });
      } else {
        await addPaymentMethod({
          type: selectedType,
          isDefault: paymentMethods.length === 0,
        });
      }

      Alert.alert('Success', 'Payment method added successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to add payment method:', error);
      Alert.alert('Error', 'Failed to add payment method');
    } finally {
      setIsAdding(false);
    }
  };

  const detectCardBrand = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (cleaned.startsWith('5')) return 'Mastercard';
    if (cleaned.startsWith('3')) return 'Amex';
    if (cleaned.startsWith('6')) return 'Discover';
    return 'Card';
  };

  const resetForm = () => {
    setCardNumber('');
    setCardExpiry('');
    setCardCVV('');
    setPaypalEmail('');
    setSelectedType('card');
  };

  const handleRemovePaymentMethod = (id: string, isDefault: boolean) => {
    if (isDefault && paymentMethods.length > 1) {
      Alert.alert(
        'Default Payment Method',
        'Please set another payment method as default before removing this one',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePaymentMethod(id);
              Alert.alert('Success', 'Payment method removed');
            } catch (error) {
              console.error('Failed to remove payment method:', error);
              Alert.alert('Error', 'Failed to remove payment method');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPaymentMethod(id);
      Alert.alert('Success', 'Default payment method updated');
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      Alert.alert('Error', 'Failed to update default payment method');
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted.slice(0, 19));
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      setCardExpiry(cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4));
    } else {
      setCardExpiry(cleaned);
    }
  };

  const getPaymentIcon = (type: PaymentMethodType) => {
    switch (type) {
      case 'card':
        return <CreditCard size={24} color="#1E3A8A" />;
      case 'apple_pay':
      case 'google_pay':
      case 'paypal':
        return <Smartphone size={24} color="#1E3A8A" />;
      default:
        return <CreditCard size={24} color="#1E3A8A" />;
    }
  };

  const getPaymentLabel = (method: any) => {
    if (method.type === 'card') {
      return `${method.cardBrand} •••• ${method.cardLast4}`;
    } else if (method.type === 'paypal') {
      return `PayPal (${method.paypalEmail})`;
    } else if (method.type === 'apple_pay') {
      return 'Apple Pay';
    } else if (method.type === 'google_pay') {
      return 'Google Pay';
    }
    return 'Payment Method';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Loading payment methods...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <Text style={styles.headerSubtitle}>
          Manage your payment methods for ride bookings
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CreditCard size={48} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No payment methods added</Text>
            <Text style={styles.emptySubtext}>
              Add a payment method to book rides
            </Text>
          </View>
        ) : (
          paymentMethods.map((method) => (
            <View key={method.id} style={styles.paymentCard}>
              <View style={styles.paymentCardHeader}>
                <View style={styles.paymentCardLeft}>
                  <View style={styles.paymentIconContainer}>
                    {getPaymentIcon(method.type)}
                  </View>
                  <View style={styles.paymentCardInfo}>
                    <Text style={styles.paymentCardTitle}>
                      {getPaymentLabel(method)}
                    </Text>
                    {method.type === 'card' && method.cardExpiry && (
                      <Text style={styles.paymentCardSubtitle}>
                        Expires {method.cardExpiry}
                      </Text>
                    )}
                    {method.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Check size={12} color="#059669" strokeWidth={3} />
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.paymentCardActions}>
                  {!method.isDefault && (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(method.id)}
                    >
                      <Text style={styles.actionButtonText}>Set Default</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleRemovePaymentMethod(method.id, method.isDefault)}
                  >
                    <Trash2 size={18} color="#DC2626" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}

        <Pressable
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isAdding) {
            setShowAddModal(false);
            resetForm();
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Payment Method</Text>

            <View style={styles.typeSelector}>
              <Pressable
                style={[styles.typeButton, selectedType === 'card' && styles.typeButtonActive]}
                onPress={() => setSelectedType('card')}
                disabled={isAdding}
              >
                <CreditCard size={20} color={selectedType === 'card' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.typeButtonText, selectedType === 'card' && styles.typeButtonTextActive]}>
                  Card
                </Text>
              </Pressable>

              <Pressable
                style={[styles.typeButton, selectedType === 'paypal' && styles.typeButtonActive]}
                onPress={() => setSelectedType('paypal')}
                disabled={isAdding}
              >
                <Smartphone size={20} color={selectedType === 'paypal' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.typeButtonText, selectedType === 'paypal' && styles.typeButtonTextActive]}>
                  PayPal
                </Text>
              </Pressable>
            </View>

            {selectedType === 'card' && (
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <TextInput
                    style={styles.input}
                    value={cardNumber}
                    onChangeText={formatCardNumber}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={19}
                    editable={!isAdding}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Expiry</Text>
                    <TextInput
                      style={styles.input}
                      value={cardExpiry}
                      onChangeText={formatExpiry}
                      placeholder="MM/YY"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={5}
                      editable={!isAdding}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cardCVV}
                      onChangeText={(text) => setCardCVV(text.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                      editable={!isAdding}
                    />
                  </View>
                </View>
              </View>
            )}

            {selectedType === 'paypal' && (
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PayPal Email</Text>
                  <TextInput
                    style={styles.input}
                    value={paypalEmail}
                    onChangeText={setPaypalEmail}
                    placeholder="email@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isAdding}
                  />
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalCancelButton, isAdding && styles.buttonDisabled]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={isAdding}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalConfirmButton, isAdding && styles.buttonDisabled]}
                onPress={handleAddPaymentMethod}
                disabled={isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Plus size={18} color="#FFFFFF" />
                    <Text style={styles.modalConfirmButtonText}>Add Method</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600' as const,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCardInfo: {
    flex: 1,
    gap: 4,
  },
  paymentCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  paymentCardSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#059669',
    textTransform: 'uppercase' as const,
  },
  paymentCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  typeButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#64748B',
  },
  modalConfirmButton: {
    flex: 2,
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
