import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ENABLED_KEY = 'daily-smile-notifications-enabled';
const SMILE_NOTIFICATION_KIND = 'daily-smile';
const SCHEDULED_DAYS = 14;
const MINIMUM_SCHEDULED_SMILES = 7;

const SMILE_MESSAGES = [
  'Dein Lächeln kann heute jemandem den Tag verschönern.',
  'Kleine Freude, große Wirkung: Schenk heute jemandem ein Lächeln.',
  'Du bist ein guter Grund, heute zu lächeln.',
  'Ein lieber Gedanke für dich: Schön, dass es dich gibt.',
  'Heute darfst du dir selbst ein Lächeln schenken.',
  'Manchmal beginnt ein schöner Moment mit einem einfachen Lächeln.',
  'Ein Lächeln kostet nichts und kann trotzdem unbezahlbar sein.',
  'Denk kurz an etwas, das dich glücklich macht.',
  'Deine positive Art macht einen Unterschied.',
  'Ein kleiner Smile für zwischendurch – nur für dich.',
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
        title: 'Ein Smile für dich',
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
      name: 'Tägliche Smiles',
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
