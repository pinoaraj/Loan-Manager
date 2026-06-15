import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { LocalReminderInput, LocalReminderResult } from '../types/sync';

const REMINDER_CHANNEL_ID = 'collections-reminders';

const buildReminderTitle = (input: LocalReminderInput) =>
  `Cobranza ${input.installmentLabel} - ${input.clientName}`;

const buildReminderNotes = (input: LocalReminderInput) =>
  [
    'Recordatorio de cobranza Mobiloan.',
    `Cliente: ${input.clientName}`,
    `Cuota: ${input.installmentLabel}`,
    `Monto: ${new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(input.amount)}`,
    input.clientPhone ? `Telefono: ${input.clientPhone}` : null,
    `Prestamo: ${input.loanId}`,
    `Pago: ${input.paymentId}`,
  ]
    .filter(Boolean)
    .join('\n');

const ensureCalendarPermission = async () => {
  const permission = await Calendar.requestCalendarPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Permiso de calendario denegado.');
  }
};

const ensureNotificationPermission = async () => {
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Permiso de notificaciones denegado.');
  }
};

const ensureNotificationChannel = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Recordatorios de cobranza',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0E7490',
  });
};

const resolveWritableCalendarId = async () => {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const preferredCalendar =
    calendars.find((calendar) => calendar.allowsModifications && calendar.isPrimary) ||
    calendars.find((calendar) => calendar.allowsModifications);

  if (!preferredCalendar) {
    throw new Error('No se encontro un calendario editable en el dispositivo.');
  }

  return preferredCalendar.id;
};

const resolveReminderDate = (dueDate: string) => {
  const now = new Date();
  const sameDayReminder = new Date(`${dueDate.slice(0, 10)}T09:00:00`);

  if (sameDayReminder.getTime() > now.getTime() + 60_000) {
    return sameDayReminder;
  }

  return new Date(now.getTime() + 5 * 60 * 1000);
};

const scheduleCollectionNotification = async (input: LocalReminderInput, reminderDate: Date) => {
  await ensureNotificationPermission();
  await ensureNotificationChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: buildReminderTitle(input),
      body: `${input.clientName} - ${new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }).format(input.amount)} vence ${input.dueDate.slice(0, 10)}`,
      data: {
        paymentId: input.paymentId,
        loanId: input.loanId,
      },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      channelId: Platform.OS === 'android' ? REMINDER_CHANNEL_ID : undefined,
    },
  });
};

export const createCollectionReminder = async (input: LocalReminderInput): Promise<LocalReminderResult> => {
  await ensureCalendarPermission();
  const calendarId = await resolveWritableCalendarId();
  const reminderDate = resolveReminderDate(input.dueDate);
  const startDate = new Date(reminderDate);
  const endDate = new Date(reminderDate.getTime() + 30 * 60 * 1000);

  const eventId = await Calendar.createEventAsync(calendarId, {
    title: buildReminderTitle(input),
    notes: buildReminderNotes(input),
    startDate,
    endDate,
    alarms: [{ relativeOffset: -24 * 60 }],
  });

  let notificationId = null;
  try {
    notificationId = await scheduleCollectionNotification(input, reminderDate);
  } catch (error) {
    if (error instanceof Error && /notificaciones/i.test(error.message)) {
      return {
        calendarEventId: eventId,
        notificationId: null,
        scheduledFor: reminderDate.toISOString(),
      };
    }

    throw error;
  }

  return {
    calendarEventId: eventId,
    notificationId,
    scheduledFor: reminderDate.toISOString(),
  };
};
