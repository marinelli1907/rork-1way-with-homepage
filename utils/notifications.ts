import { Platform } from 'react-native';
import { CatalogEvent } from '@/types';
import Constants from 'expo-constants';

let Notifications: any = null;

const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  try {
    if (Platform.OS !== 'web') {
      Notifications = require('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (error) {
    console.log('expo-notifications not available:', error);
  }
}

export async function registerForPushNotifications(): Promise<boolean> {
  if (Platform.OS === 'web' || !Notifications || isExpoGo) {
    console.log('Push notifications not available in Expo Go. Use a development build for notifications.');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('event-reminders', {
        name: 'Event Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E3A8A',
      });
    }

    console.log('Push notifications registered');
    return true;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return false;
  }
}

export async function scheduleEventNotification(event: CatalogEvent): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications || isExpoGo) {
    console.log('Notifications not available in Expo Go');
    return null;
  }

  try {
    const eventDate = new Date(event.startISO);
    const now = new Date();
    
    if (eventDate <= now) {
      console.log('Event is in the past or happening now, not scheduling notification');
      return null;
    }

    const oneDayBefore = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
    const oneHourBefore = new Date(eventDate.getTime() - 60 * 60 * 1000);

    let triggerDate = oneDayBefore;
    let triggerMessage = 'Tomorrow';

    if (oneDayBefore < now) {
      triggerDate = oneHourBefore;
      triggerMessage = 'In 1 hour';
    }

    if (triggerDate <= now) {
      console.log('Notification trigger time is in the past, not scheduling');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${event.title} ${triggerMessage}!`,
        body: `Don't forget about ${event.title} at ${event.venue}`,
        data: { eventId: event.id, type: 'event_reminder' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: triggerDate,
        channelId: 'event-reminders',
      },
    });

    console.log('Event notification scheduled:', notificationId, 'for', triggerDate);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule event notification:', error);
    return null;
  }
}

export async function cancelNotification(notificationId: string): Promise<void> {
  if (Platform.OS === 'web' || !Notifications || isExpoGo) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('Notification cancelled:', notificationId);
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}

export async function getAllScheduledNotifications(): Promise<any[]> {
  if (Platform.OS === 'web' || !Notifications || isExpoGo) {
    return [];
  }

  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Found ${notifications.length} scheduled notifications`);
    return notifications;
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
    return [];
  }
}
