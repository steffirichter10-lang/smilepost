import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ENABLED_KEY = 'daily-smile-notifications-enabled';
const SMILE_NOTIFICATION_KIND = 'daily-smile';
const SCHEDULED_DAYS = 14;
const MINIMUM_SCHEDULED_SMILES = 7;

const SMILE_MESSAGES = [
  'Your smile could brighten someone’s day today.',
  'Small joy, big impact: Make someone smile today.',
  'You’re a wonderful reason to smile today.',
  'A kind thought for you: It’s good to have you here.',
  'Today, give yourself a reason to smile.',
  'Sometimes a beautiful moment begins with a simple smile.',
  'A smile costs nothing, yet it can be priceless.',
  'Take a moment to think of something that makes you happy.',
  'Your positive spirit makes a difference.',
  'A little Smile for your day—just for you.',
];

export type SmileNotificationStatus = 'enabled' | 'disabled' | 'unsupported';

function randomMessage() {
  return SMILE_MESSAGES[Math.floor(Math.random() * SMILE_MESSAGES.length)];
}

function randomTimeForDay(dayOffset: number) {
  const now = new Date();
  const date = new Date(now);
  date.setDate(now.getDate() + dayOffset);

  const startHour = dayOffset === 0 ? Math.max(9, now.getHours() + 1) : 9;
  date.setHours(
    startHour + Math.floor(Math.random() * (20 - startHour)),
    Math.floor(Math.random() * 60),
    0,
    0,
  );
  return date;
}

async function getScheduledSmiles() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter(
    (notification) => notification.content.data?.kind === SMILE_NOTIFICATION_KIND,
  );
}

async function cancelScheduledSmiles() {
  const scheduledSmiles = await getScheduledSmiles();
  await Promise.all(
    scheduledSmiles.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
  );
}

async function scheduleSmiles() {
  await cancelScheduledSmiles();

  const firstDayOffset = new Date().getHours() >= 19 ? 1 : 0;
  for (let day = 0; day < SCHEDULED_DAYS; day += 1) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'A Smile for you',
        body: randomMessage(),
        data: { kind: SMILE_NOTIFICATION_KIND },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: randomTimeForDay(day + firstDayOffset),
        channelId: Platform.OS === 'android' ? 'daily-smiles' : undefined,
      },
    });
  }
}

export async function getSmileNotificationsEnabled() {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';
}

export async function enableSmileNotifications(): Promise<SmileNotificationStatus> {
  if (Platform.OS === 'web') return 'unsupported';

  const currentPermissions = await Notifications.getPermissionsAsync();
  const permissions =
    currentPermissions.status === Notifications.PermissionStatus.GRANTED
      ? currentPermissions
      : await Notifications.requestPermissionsAsync();

  if (permissions.status !== Notifications.PermissionStatus.GRANTED) {
    await AsyncStorage.setItem(ENABLED_KEY, 'false');
    return 'disabled';
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-smiles', {
      name: 'Daily Smiles',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await scheduleSmiles();
  await AsyncStorage.setItem(ENABLED_KEY, 'true');
  return 'enabled';
}

export async function disableSmileNotifications() {
  await cancelScheduledSmiles();
  await AsyncStorage.setItem(ENABLED_KEY, 'false');
}

export async function refreshSmileNotifications() {
  if (Platform.OS === 'web' || !(await getSmileNotificationsEnabled())) return;

  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== Notifications.PermissionStatus.GRANTED) {
    await AsyncStorage.setItem(ENABLED_KEY, 'false');
    return;
  }

  const scheduledSmiles = await getScheduledSmiles();
  if (scheduledSmiles.length < MINIMUM_SCHEDULED_SMILES) await scheduleSmiles();
}

export function configureSmileNotificationHandler() {
  if (Platform.OS === 'web') return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
