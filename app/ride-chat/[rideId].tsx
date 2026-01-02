import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Send, Image as ImageIcon, User, Phone, MapPin, Star, CheckCircle, Navigation } from 'lucide-react-native';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useEvents } from '@/providers/EventsProvider';
import { usePayment } from '@/providers/PaymentProvider';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'driver';
  timestamp: string;
  imageUri?: string;
}

export default function RideChatScreen() {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { events, updateRideStatus } = useEvents();
  const { processPayment, getTransactionForRide, paymentMethods } = usePayment();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_1',
      text: 'Hi! I\'m your driver. I\'ll be there soon.',
      sender: 'driver',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [driverStatus, setDriverStatus] = useState<'on_way' | 'arrived' | 'in_progress' | 'completed'>('on_way');
  const [minutesUntilArrival, setMinutesUntilArrival] = useState(8);
  const [distanceAway, setDistanceAway] = useState(2.4);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const ride = events
    .flatMap(e => e.rides || [])
    .find(r => r.id === rideId);

  const driver = ride?.driver;

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (driverStatus === 'on_way') {
        setMinutesUntilArrival((prev) => {
          if (prev <= 1) {
            setDriverStatus('arrived');
            return 0;
          }
          return prev - 1;
        });
        setDistanceAway((prev) => Math.max(0, prev - 0.3));
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [driverStatus]);

  useEffect(() => {
    const statusProgress: Record<typeof driverStatus, number> = {
      on_way: 0.25,
      arrived: 0.5,
      in_progress: 0.75,
      completed: 1,
    };

    Animated.spring(progressAnim, {
      toValue: statusProgress[driverStatus],
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [driverStatus]);

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      text: inputText.trim(),
      sender: 'me',
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    setTimeout(() => {
      const autoReply: Message = {
        id: `msg_${Date.now() + 1}`,
        text: 'Got it! Thanks for letting me know.',
        sender: 'driver',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, autoReply]);
    }, 2000);
  };

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        text: 'Sent an image',
        sender: 'me',
        timestamp: new Date().toISOString(),
        imageUri: result.assets[0].uri,
      };

      setMessages([...messages, newMessage]);

      setTimeout(() => {
        const autoReply: Message = {
          id: `msg_${Date.now() + 1}`,
          text: 'Perfect! I can see the location now.',
          sender: 'driver',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, autoReply]);
      }, 2000);
    }
  };

  const handleCallDriver = () => {
    if (!driver?.phone) {
      Alert.alert('No Phone Number', 'Driver phone number not available');
      return;
    }

    const phoneUrl = `tel:${driver.phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone call not available on this device');
        }
      })
      .catch((error) => {
        console.error('Error opening phone:', error);
        Alert.alert('Error', 'Failed to open phone application');
      });
  };

  const handleCompleteRide = async () => {
    if (!ride) return;

    Alert.alert(
      'Complete Ride',
      `Mark this ride as completed?\n\nThe passenger will be automatically charged ${ride.estimate.toFixed(2)}.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete Ride',
          onPress: async () => {
            setIsProcessingPayment(true);
            
            try {
              const transaction = getTransactionForRide(ride.id);
              
              if (!transaction) {
                Alert.alert('Error', 'No payment transaction found for this ride');
                setIsProcessingPayment(false);
                return;
              }

              const paymentMethod = paymentMethods.find(pm => pm.id === transaction.paymentMethodId);
              const paymentMethodLabel = paymentMethod?.type === 'card' 
                ? `${paymentMethod.cardBrand} •••• ${paymentMethod.cardLast4}`
                : paymentMethod?.type === 'paypal'
                  ? `PayPal (${paymentMethod.paypalEmail})`
                  : paymentMethod?.type === 'apple_pay'
                    ? 'Apple Pay'
                    : 'Google Pay';

              const success = await processPayment(transaction.id);

              if (success) {
                await updateRideStatus(ride.id, 'completed');
                
                Alert.alert(
                  'Ride Completed',
                  `Payment of ${ride.estimate.toFixed(2)} has been successfully processed.\n\nPayment Method: ${paymentMethodLabel}\n\nThank you for using our service!`,
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                Alert.alert(
                  'Payment Failed',
                  'Payment processing failed. Please try again or contact support.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Error completing ride:', error);
              Alert.alert('Error', 'Failed to complete ride. Please try again.');
            } finally {
              setIsProcessingPayment(false);
            }
          },
        },
      ]
    );
  };

  if (!ride || !driver) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Chat' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ride or driver information not found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const vehicleInfo = `${driver.vehicleColor} ${driver.vehicleBrand} ${driver.vehicleModel}`;
  const pickupTime = new Date(ride.pickupTime);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: 'Chat with Driver',
          headerBackTitle: 'Back',
          headerBackVisible: true,
        }} 
      />

      <View style={styles.trackingBar}>
        <View style={styles.trackingContent}>
          <View style={styles.trackingStatus}>
            {driverStatus === 'on_way' && (
              <>
                <Navigation size={18} color="#3B82F6" />
                <View style={styles.trackingTextContainer}>
                  <Text style={styles.trackingMainText}>Driver on the way</Text>
                  <Text style={styles.trackingSubText}>
                    {minutesUntilArrival} min • {distanceAway.toFixed(1)} mi away
                  </Text>
                </View>
              </>
            )}
            {driverStatus === 'arrived' && (
              <>
                <CheckCircle size={18} color="#059669" />
                <View style={styles.trackingTextContainer}>
                  <Text style={styles.trackingMainText}>Driver arrived</Text>
                  <Text style={styles.trackingSubText}>Driver is waiting at pickup location</Text>
                </View>
              </>
            )}
            {driverStatus === 'in_progress' && (
              <>
                <Navigation size={18} color="#8B5CF6" />
                <View style={styles.trackingTextContainer}>
                  <Text style={styles.trackingMainText}>Trip in progress</Text>
                  <Text style={styles.trackingSubText}>Heading to destination</Text>
                </View>
              </>
            )}
            {driverStatus === 'completed' && (
              <>
                <CheckCircle size={18} color="#059669" />
                <View style={styles.trackingTextContainer}>
                  <Text style={styles.trackingMainText}>Trip completed</Text>
                  <Text style={styles.trackingSubText}>Thank you for riding!</Text>
                </View>
              </>
            )}
          </View>
          <Pressable onPress={handleCallDriver} style={styles.trackingCallButton}>
            <Phone size={18} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, driverStatus !== 'on_way' && styles.progressStepActive]}>
              <Text style={[styles.progressStepText, driverStatus !== 'on_way' && styles.progressStepTextActive]}>
                On way
              </Text>
            </View>
            <View style={[styles.progressStep, (driverStatus === 'in_progress' || driverStatus === 'completed') && styles.progressStepActive]}>
              <Text style={[styles.progressStepText, (driverStatus === 'in_progress' || driverStatus === 'completed') && styles.progressStepTextActive]}>
                Arrived
              </Text>
            </View>
            <View style={[styles.progressStep, driverStatus === 'completed' && styles.progressStepActive]}>
              <Text style={[styles.progressStepText, driverStatus === 'completed' && styles.progressStepTextActive]}>
                In progress
              </Text>
            </View>
            <View style={[styles.progressStep, driverStatus === 'completed' && styles.progressStepActive]}>
              <Text style={[styles.progressStepText, driverStatus === 'completed' && styles.progressStepTextActive]}>
                Done
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.driverHeader}>
        <View style={styles.driverHeaderContent}>
          {driver.avatar ? (
            <Image source={{ uri: driver.avatar }} style={styles.driverAvatar} />
          ) : (
            <View style={styles.driverAvatarPlaceholder}>
              <User size={24} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <View style={styles.ratingRow}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
              <Text style={styles.tripsText}>• {driver.totalTrips} trips</Text>
            </View>
            <Text style={styles.vehicleText}>{vehicleInfo}</Text>
            <Text style={styles.licensePlateText}>{driver.licensePlate}</Text>
          </View>
        </View>

        <View style={styles.rideInfoCard}>
          <View style={styles.rideInfoRow}>
            <MapPin size={14} color="#059669" />
            <Text style={styles.rideInfoLabel}>Pickup:</Text>
          </View>
          <Text style={styles.rideInfoValue} numberOfLines={1}>
            {ride.pickupAddress}
          </Text>
          <Text style={styles.rideInfoTime}>
            {pickupTime.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.sender === 'me' ? styles.myMessageBubble : styles.driverMessageBubble,
              ]}
            >
              {message.imageUri && (
                <Image source={{ uri: message.imageUri }} style={styles.messageImage} />
              )}
              <Text
                style={[
                  styles.messageText,
                  message.sender === 'me' ? styles.myMessageText : styles.driverMessageText,
                ]}
              >
                {message.text}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  message.sender === 'me' ? styles.myMessageTime : styles.driverMessageTime,
                ]}
              >
                {new Date(message.timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))}
        </ScrollView>

        {ride && ride.status !== 'completed' && ride.status !== 'paid' && (
          <View style={styles.completeRideContainer}>
            <Pressable
              style={[styles.completeRideButton, isProcessingPayment && styles.buttonDisabled]}
              onPress={handleCompleteRide}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.completeRideButtonText}>Complete Ride & Process Payment</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Pressable style={styles.imageButton} onPress={handleSelectImage}>
            <ImageIcon size={24} color="#1E3A8A" />
          </Pressable>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={inputText.trim() === ''}
          >
            <Send size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  trackingBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 12,
  },
  trackingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  trackingStatus: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackingTextContainer: {
    flex: 1,
  },
  trackingMainText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 2,
  },
  trackingSubText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  trackingCallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressStepActive: {
    opacity: 1,
  },
  progressStepText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  progressStepTextActive: {
    color: '#1E3A8A',
  },
  driverHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  driverHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  driverAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  tripsText: {
    fontSize: 12,
    color: '#64748B',
  },
  vehicleText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 2,
  },
  licensePlateText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace' as const,
  },
  rideInfoCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rideInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rideInfoLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
  },
  rideInfoValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  rideInfoTime: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600' as const,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E3A8A',
    borderBottomRightRadius: 4,
  },
  driverMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  driverMessageText: {
    color: '#1E293B',
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  driverMessageTime: {
    color: '#94A3B8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  imageButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  completeRideContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  completeRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
  },
  completeRideButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
