import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  Keyboard,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DRAG_THRESHOLD = 50;

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onSave?: () => void;
  saveButtonText?: string;
  saveButtonDisabled?: boolean;
  children: React.ReactNode;
  isDirty?: boolean;
  showSaveButton?: boolean;
}

export default function BottomSheetModal({
  visible,
  onClose,
  title,
  subtitle,
  onSave,
  saveButtonText = 'Save',
  saveButtonDisabled = false,
  children,
  isDirty = false,
  showSaveButton = true,
}: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = useCallback(() => {
    if (isDirty) {
      Keyboard.dismiss();
      setTimeout(() => {
        const canSave = Boolean(onSave) && !saveButtonDisabled;

        if (Platform.OS === 'web') {
          if (canSave) {
            const shouldSave = window.confirm('Save your changes?');
            if (shouldSave) {
              onSave?.();
              return;
            }
          }

          const shouldDiscard = window.confirm('Discard your changes?');
          if (shouldDiscard) {
            onClose();
          }
          return;
        }

        if (canSave) {
          Alert.alert('Unsaved Changes', 'What would you like to do?', [
            { text: 'Keep Editing', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: onClose },
            {
              text: 'Save',
              style: 'default',
              onPress: () => {
                onSave?.();
              },
            },
          ]);
          return;
        }

        Alert.alert('Unsaved Changes', 'You have unsaved changes. Are you sure you want to close?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]);
      }, 100);
    } else {
      onClose();
    }
  }, [isDirty, onClose, onSave, saveButtonDisabled]);

  const handleBackdropPress = useCallback(() => {
    Keyboard.dismiss();
    setTimeout(() => {
      handleClose();
    }, 100);
  }, [handleClose]);

  const handleSave = useCallback(() => {
    if (onSave && !saveButtonDisabled) {
      onSave();
    }
  }, [onSave, saveButtonDisabled]);

  const sheetHeight = SCREEN_HEIGHT * 0.9;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleBackdropPress}
          pointerEvents="auto"
          testID="bottomSheetBackdrop"
        />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              height: sheetHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
          >
            <View style={[styles.sheet, { paddingTop: insets.top || 20 }]}>
              <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              <View style={styles.header}>
                <Pressable
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={24} color="#64748B" strokeWidth={2} />
                </Pressable>

                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{title}</Text>
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>

                {showSaveButton && onSave ? (
                  <Pressable
                    style={[styles.saveButton, saveButtonDisabled && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saveButtonDisabled}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text
                      style={[
                        styles.saveButtonText,
                        saveButtonDisabled && styles.saveButtonTextDisabled,
                      ]}
                    >
                      {saveButtonText}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.saveButton} />
                )}
              </View>

              <View
                style={[
                  styles.keyboardSpacer,
                  isKeyboardVisible && { height: 12 },
                ]}
              />

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: Math.max(insets.bottom, 20) + 96 },
                ]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  sheetContainer: {
    width: '100%',
    zIndex: 1,
    elevation: 20,
  },
  keyboardView: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  saveButton: {
    width: 70,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#E31937',
  },
  saveButtonTextDisabled: {
    color: '#94A3B8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  keyboardSpacer: {
    height: 0,
  },
});
