import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIF_PREFIX = 'notif_task_';

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowList: true,
    }),
  });
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTaskNotification(
  taskId: string | number,
  title: string,
  dueDateYMD: string
): Promise<void> {
  try {
    const [y, m, d] = dueDateYMD.split('-').map(Number);
    const fireDate = new Date(y, m - 1, d, 9, 0, 0);
    if (fireDate <= new Date()) return;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Task Due Today',
        body: title,
        data: { taskId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });

    await AsyncStorage.setItem(`${NOTIF_PREFIX}${taskId}`, id);
  } catch (e) {
    console.warn('Failed to schedule notification', e);
  }
}

export async function cancelTaskNotification(taskId: string | number): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(`${NOTIF_PREFIX}${taskId}`);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(`${NOTIF_PREFIX}${taskId}`);
    }
  } catch (e) {
    console.warn('Failed to cancel notification', e);
  }
}

export async function schedulePomodoroNotification(label: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏱️ Pomodoro Complete!',
        body: `"${label}" session finished. Take a break!`,
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('Failed to send pomodoro notification', e);
  }
}
