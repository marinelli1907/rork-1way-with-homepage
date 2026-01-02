import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Tag, Trash2, Edit3, Calendar, Users, DollarSign } from 'lucide-react-native';
import { useCoupons } from '@/providers/CouponProvider';
import { Coupon, CouponType } from '@/types';

export default function ManageCouponsScreen() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon, getActiveCoupons } = useCoupons();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const activeCoupons = getActiveCoupons();
  const inactiveCoupons = coupons.filter(c => !activeCoupons.find(ac => ac.id === c.id));

  const handleDeleteCoupon = (couponId: string, code: string) => {
    Alert.alert(
      'Delete Coupon',
      `Are you sure you want to delete coupon "${code}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCoupon(couponId);
            Alert.alert('Success', 'Coupon deleted successfully');
          },
        },
      ]
    );
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingCoupon(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Coupons</Text>
        <Text style={styles.headerSubtitle}>
          {activeCoupons.length} active • {inactiveCoupons.length} inactive
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Pressable style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create New Coupon</Text>
        </Pressable>

        {activeCoupons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Coupons</Text>
            {activeCoupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onEdit={handleEditCoupon}
                onDelete={handleDeleteCoupon}
              />
            ))}
          </View>
        )}

        {inactiveCoupons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inactive Coupons</Text>
            {inactiveCoupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onEdit={handleEditCoupon}
                onDelete={handleDeleteCoupon}
                inactive
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CouponFormModal
        visible={showCreateModal}
        onClose={closeModal}
        onSave={async (data) => {
          try {
            if (editingCoupon) {
              await updateCoupon(editingCoupon.id, data);
              Alert.alert('Success', 'Coupon updated successfully');
            } else {
              await addCoupon(data);
              Alert.alert('Success', 'Coupon created successfully');
            }
            closeModal();
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save coupon');
          }
        }}
        editingCoupon={editingCoupon}
      />
    </SafeAreaView>
  );
}

function CouponCard({
  coupon,
  onEdit,
  onDelete,
  inactive = false,
}: {
  coupon: Coupon;
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string, code: string) => void;
  inactive?: boolean;
}) {
  return (
    <View style={[styles.couponCard, inactive && styles.couponCardInactive]}>
      <View style={styles.couponHeader}>
        <View style={styles.couponTitleRow}>
          <View style={[styles.couponIcon, inactive && styles.couponIconInactive]}>
            <Tag size={20} color="#FFFFFF" />
          </View>
          <View style={styles.couponTitleContent}>
            <Text style={[styles.couponCode, inactive && styles.couponCodeInactive]}>
              {coupon.code}
            </Text>
            <Text style={[styles.couponDescription, inactive && styles.couponDescriptionInactive]}>
              {coupon.description}
            </Text>
          </View>
        </View>

        <View style={styles.couponActions}>
          <Pressable style={styles.actionButton} onPress={() => onEdit(coupon)}>
            <Edit3 size={18} color="#1E3A8A" />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => onDelete(coupon.id, coupon.code)}>
            <Trash2 size={18} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      <View style={styles.couponStats}>
        <View style={styles.statItem}>
          <DollarSign size={16} color={inactive ? '#94A3B8' : '#059669'} />
          <Text style={[styles.statText, inactive && styles.statTextInactive]}>
            {coupon.type === 'percentage'
              ? `${coupon.value}% off`
              : `$${coupon.value} off`}
          </Text>
        </View>

        {coupon.usageLimit && (
          <View style={styles.statItem}>
            <Users size={16} color={inactive ? '#94A3B8' : '#1E3A8A'} />
            <Text style={[styles.statText, inactive && styles.statTextInactive]}>
              {coupon.usageCount}/{coupon.usageLimit} used
            </Text>
          </View>
        )}

        {coupon.expiresAt && (
          <View style={styles.statItem}>
            <Calendar size={16} color={inactive ? '#94A3B8' : '#8B5CF6'} />
            <Text style={[styles.statText, inactive && styles.statTextInactive]}>
              Expires {new Date(coupon.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {coupon.minRideAmount && (
        <View style={styles.couponBadge}>
          <Text style={styles.couponBadgeText}>
            Min. ${coupon.minRideAmount} ride
          </Text>
        </View>
      )}
    </View>
  );
}

function CouponFormModal({
  visible,
  onClose,
  onSave,
  editingCoupon,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Coupon, 'id' | 'createdAt' | 'usageCount'>) => Promise<void>;
  editingCoupon: Coupon | null;
}) {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CouponType>('percentage');
  const [value, setValue] = useState('');
  const [minRideAmount, setMinRideAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [status, setStatus] = useState<'active' | 'disabled'>('active');
  const [firstRideOnly, setFirstRideOnly] = useState(false);

  React.useEffect(() => {
    if (editingCoupon) {
      setCode(editingCoupon.code);
      setDescription(editingCoupon.description);
      setType(editingCoupon.type);
      setValue(editingCoupon.value.toString());
      setMinRideAmount(editingCoupon.minRideAmount?.toString() || '');
      setMaxDiscount(editingCoupon.maxDiscount?.toString() || '');
      setUsageLimit(editingCoupon.usageLimit?.toString() || '');
      setExpiresAt(editingCoupon.expiresAt || '');
      setStatus(editingCoupon.status === 'active' ? 'active' : 'disabled');
      setFirstRideOnly(editingCoupon.firstRideOnly || false);
    } else {
      setCode('');
      setDescription('');
      setType('percentage');
      setValue('');
      setMinRideAmount('');
      setMaxDiscount('');
      setUsageLimit('');
      setExpiresAt('');
      setStatus('active');
      setFirstRideOnly(false);
    }
  }, [editingCoupon, visible]);

  const handleSave = () => {
    if (!code.trim() || !description.trim() || !value) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const couponData = {
      code: code.trim().toUpperCase(),
      description: description.trim(),
      type,
      value: parseFloat(value),
      status,
      createdBy: 'admin',
      minRideAmount: minRideAmount ? parseFloat(minRideAmount) : undefined,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : undefined,
      expiresAt: expiresAt || undefined,
      firstRideOnly,
    };

    onSave(couponData);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Coupon Code *</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                placeholder="e.g., SAVE20"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g., $20 off your ride"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type *</Text>
              <View style={styles.typeSelector}>
                <Pressable
                  style={[styles.typeButton, type === 'percentage' && styles.typeButtonActive]}
                  onPress={() => setType('percentage')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'percentage' && styles.typeButtonTextActive,
                    ]}
                  >
                    Percentage
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.typeButton, type === 'fixed_amount' && styles.typeButtonActive]}
                  onPress={() => setType('fixed_amount')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'fixed_amount' && styles.typeButtonTextActive,
                    ]}
                  >
                    Fixed Amount
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
              </Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                placeholder={type === 'percentage' ? 'e.g., 20' : 'e.g., 20.00'}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Min. Ride Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  value={minRideAmount}
                  onChangeText={setMinRideAmount}
                  placeholder="Optional"
                  keyboardType="decimal-pad"
                />
              </View>

              {type === 'percentage' && (
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Max Discount ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={maxDiscount}
                    onChangeText={setMaxDiscount}
                    placeholder="Optional"
                    keyboardType="decimal-pad"
                  />
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Usage Limit</Text>
              <TextInput
                style={styles.input}
                value={usageLimit}
                onChangeText={setUsageLimit}
                placeholder="Optional (unlimited if empty)"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>First Ride Only</Text>
                <Switch value={firstRideOnly} onValueChange={setFirstRideOnly} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={status === 'active'}
                  onValueChange={(val) => setStatus(val ? 'active' : 'disabled')}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={onClose}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={handleSave}>
                <Text style={styles.modalSaveButtonText}>
                  {editingCoupon ? 'Update' : 'Create'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  createButton: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  couponCardInactive: {
    opacity: 0.6,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  couponTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  couponIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponIconInactive: {
    backgroundColor: '#94A3B8',
  },
  couponTitleContent: {
    flex: 1,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 2,
  },
  couponCodeInactive: {
    color: '#64748B',
  },
  couponDescription: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  couponDescriptionInactive: {
    color: '#94A3B8',
  },
  couponActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  statTextInactive: {
    color: '#94A3B8',
  },
  couponBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: 8,
  },
  couponBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#DC2626',
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
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  modalSaveButton: {
    flex: 2,
    backgroundColor: '#1E3A8A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
