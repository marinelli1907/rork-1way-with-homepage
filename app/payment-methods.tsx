import { CreditCard, Smartphone, Plus, Trash2, Check } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomSheetModal from '@/components/BottomSheetModal';
import { usePayment } from '@/providers/PaymentProvider';
import { PaymentMethodType } from '@/types';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ closeOnAdd?: string; returnTo?: string }>();
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

      if (params.closeOnAdd === '1') {
        console.log('[payment-methods] closeOnAdd=1 -> returning to previous screen');
        router.back();
      }
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

  const isAddFormValid = () => {
    if (selectedType === 'card') {
      return cardNumber.length >= 13 && cardExpiry.length === 5 && cardCVV.length >= 3;
    } else if (selectedType === 'paypal') {
      return paypalEmail.includes('@');
    }
    return false;
  };

  const isDirty = cardNumber !== '' || cardExpiry !== '' || cardCVV !== '' || paypalEmail !== '';

  if (isLoading) {
    return (
      <BottomSheetModal
        visible={true}
        onClose={() => router.back()}
        title="Payment Methods"
        showSaveButton={false}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Loading payment methods...</Text>
        </View>
      </BottomSheetModal>
    );
  }

  return (
    <>
      <BottomSheetModal
        visible={true}
        onClose={() => router.back()}
        title="Payment Methods"
        subtitle="Manage your payment methods"
        showSaveButton={false}
      >
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CreditCard size={48} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No payment methods added</Text>
            <Text style={styles.emptySubtext}>
              Add a payment method to book rides
            </Text>
          </View>
        ) : (
          <View style={styles.methodsList}>
            {paymentMethods.map((method) => (
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
            ))}
          </View>
        )}

        <Pressable
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </Pressable>
      </BottomSheetModal>

      <BottomSheetModal
        visible={showAddModal}
        onClose={() => {
          if (!isAdding) {
            setShowAddModal(false);
            resetForm();
          }
        }}
        title="Add Payment Method"
        onSave={handleAddPaymentMethod}
        saveButtonText="Add"
        saveButtonDisabled={!isAddFormValid() || isAdding}
        isDirty={isDirty}
      >
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
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600' as const,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  methodsList: {
    gap: 12,
    marginBottom: 20,
  },
  paymentCard: {
    backgroundColor: '#F8FAFC',
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
});
