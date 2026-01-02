import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { X, CheckCircle, Clock, MapPin } from 'lucide-react-native';
import { PromotionWithDistance, RedemptionStatus } from '@/types';

interface RedemptionModalProps {
  visible: boolean;
  promo: PromotionWithDistance | null;
  status: RedemptionStatus;
  token?: string;
  onClose: () => void;
}

export function RedemptionModal({ visible, promo, status, token, onClose }: RedemptionModalProps) {
  if (!promo) return null;

  const renderQRCode = () => {
    const code = token || '------';
    
    return (
      <View style={styles.qrSection}>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrCode}>{code}</Text>
        </View>
        <Text style={styles.qrLabel}>Show this code to staff</Text>
      </View>
    );
  };

  const renderUnlockedContent = () => (
    <>
      <View style={styles.statusSection}>
        <CheckCircle size={48} color="#059669" strokeWidth={2} />
        <Text style={styles.statusTitle}>Perk Unlocked!</Text>
        <Text style={styles.statusSubtitle}>
          You&apos;ve arrived. Show this code to redeem your perk.
        </Text>
      </View>

      {renderQRCode()}

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Perk</Text>
          <Text style={styles.detailValue}>{promo.title}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Merchant</Text>
          <Text style={styles.detailValue}>{promo.merchantName}</Text>
        </View>
        {promo.minSpend && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Min. Spend</Text>
            <Text style={styles.detailValue}>${promo.minSpend}</Text>
          </View>
        )}
      </View>

      {promo.fineprint && (
        <View style={styles.fineprintSection}>
          <Text style={styles.fineprintTitle}>Fine Print</Text>
          <Text style={styles.fineprintText}>{promo.fineprint}</Text>
        </View>
      )}
    </>
  );

  const renderLockedContent = () => (
    <>
      <View style={styles.statusSection}>
        <Clock size={48} color="#EA580C" strokeWidth={2} />
        <Text style={styles.statusTitle}>Ride Required</Text>
        <Text style={styles.statusSubtitle}>
          Take a 1Way ride to {promo.merchantName} to unlock this perk.
        </Text>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <MapPin size={16} color="#64748B" />
          <Text style={styles.detailValue}>{promo.address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>{promo.distance.toFixed(1)} miles</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Est. Fare</Text>
          <Text style={styles.detailValue}>${promo.rideFare}</Text>
        </View>
      </View>

      <Text style={styles.instructionText}>
        Once you arrive within 120m of the venue during valid hours, your perk will unlock
        automatically.
      </Text>
    </>
  );

  const renderRedeemedContent = () => (
    <>
      <View style={styles.statusSection}>
        <CheckCircle size={48} color="#94A3B8" strokeWidth={2} />
        <Text style={styles.statusTitle}>Already Redeemed</Text>
        <Text style={styles.statusSubtitle}>
          This perk has been used. Check back for more deals!
        </Text>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Merchant</Text>
          <Text style={styles.detailValue}>{promo.merchantName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Perk</Text>
          <Text style={styles.detailValue}>{promo.title}</Text>
        </View>
      </View>
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#64748B" strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {status === 'unlocked' && renderUnlockedContent()}
            {status === 'locked' && renderLockedContent()}
            {status === 'redeemed' && renderRedeemedContent()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 12,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 24,
  },
  statusSection: {
    alignItems: 'center',
    gap: 12,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  qrSection: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCode: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1E293B',
    letterSpacing: 4,
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  detailsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
  },
  fineprintSection: {
    gap: 8,
  },
  fineprintTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  fineprintText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
  },
});
