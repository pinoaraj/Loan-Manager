import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { localDb } from '../data/database';
import { parseStoredDate } from './dates';
import { formatCurrency, formatDate } from './format';

const REMINDER_CHANNEL_ID = 'collections-reminders';
const SETTING_KEY = 'auto_reminders_enabled';
const HORIZON_DAYS = 60;
const MIN_LEAD_MS = 60_000;
const MIN_SYNC_INTERVAL_MS = 30_000;

let lastSyncAt = 0;

export interface AutoReminderResult {
  enabled: boolean;
  scheduled: number;
  permissionDenied?: boolean;
  skipped?: boolean;
}

const isAutoNotification = (request: Notifications.NotificationRequest) => {
  const data = request.content.data as Record<string, unknown> | null | undefined;
  return data?.autoReminder === true;
};

export const getAutoReminderEnabled = async () =>
  (await localDb.getMeta(SETTING_KEY)) === '1';

const ensureChannel = async () => {
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

const canNotify = async (requestPermission: boolean) => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  if (!requestPermission) {
    return false;
  }

  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
};

/** Quita solo los avisos automaticos; los recordatorios manuales se conservan. */
export const cancelAutoReminders = async (): Promise<number> => {
  if (Platform.OS === 'web') {
    return 0;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const auto = scheduled.filter(isAutoNotification);
  await Promise.all(auto.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  return auto.length;
};

const buildCandidates = (dueDate: string) => {
  const due = parseStoredDate(dueDate);
  if (!due) {
    return [];
  }

  const dueDay = new Date(due);
  dueDay.setHours(9, 0, 0, 0);

  const dayBefore = new Date(due);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(9, 0, 0, 0);

  return [
    { at: dayBefore, label: 'manana' },
    { at: dueDay, label: 'hoy' },
  ].filter((candidate) => candidate.at.getTime() > Date.now() + MIN_LEAD_MS);
};

/**
 * Serializa los recalculos: al abrir la app pueden dispararse dos efectos a la
 * vez (datos y volver a primer plano). Sin esta cola ambos cancelaban y volvian
 * a programar en paralelo, duplicando los avisos.
 */
let syncQueue: Promise<unknown> = Promise.resolve();

const runExclusive = <T,>(task: () => Promise<T>): Promise<T> => {
  const result = syncQueue.then(task, task);
  syncQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};

/**
 * Recalcula los avisos automaticos de cobro: un recordatorio el dia anterior
 * y otro el dia del vencimiento, a las 09:00, para cada cuota impaga de un
 * prestamo activo dentro de los proximos 60 dias.
 *
 * No pide permiso por si sola: eso ocurre solo cuando el usuario activa la
 * opcion en Ajustes, para no mostrar dialogos al abrir la app.
 */
export const syncAutoReminders = (
  options: { requestPermission?: boolean; force?: boolean } = {},
): Promise<AutoReminderResult> => runExclusive(() => performSync(options));

const performSync = async (options: {
  requestPermission?: boolean;
  force?: boolean;
}): Promise<AutoReminderResult> => {
  if (Platform.OS === 'web') {
    return { enabled: false, scheduled: 0 };
  }

  const enabled = await getAutoReminderEnabled();
  if (!enabled) {
    return { enabled: false, scheduled: 0 };
  }

  if (!options.force && Date.now() - lastSyncAt < MIN_SYNC_INTERVAL_MS) {
    return { enabled: true, scheduled: 0, skipped: true };
  }

  const granted = await canNotify(Boolean(options.requestPermission));
  if (!granted) {
    return { enabled: true, scheduled: 0, permissionDenied: true };
  }

  await ensureChannel();
  await cancelAutoReminders();

  const targets = await localDb.listReminderTargets(HORIZON_DAYS);
  let scheduled = 0;

  for (const target of targets) {
    for (const candidate of buildCandidates(target.dueDate)) {
      // Identificador estable: reprogramar la misma cuota reemplaza el aviso
      // anterior en vez de acumular copias si dos recalculos se cruzan.
      const identifier = `auto-${target.paymentId}-${candidate.label}`;

      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      } catch {
        // El aviso pudo no existir; no es un problema.
      }

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `Cobro ${candidate.label}: ${target.clientName}`,
          body: `${formatCurrency(target.remaining)} · cuota ${formatDate(target.dueDate)}`,
          data: {
            autoReminder: true,
            paymentId: target.paymentId,
            loanId: target.loanId,
            kind: candidate.label,
          },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: candidate.at,
          channelId: Platform.OS === 'android' ? REMINDER_CHANNEL_ID : undefined,
        },
      });
      scheduled += 1;
    }
  }

  lastSyncAt = Date.now();
  return { enabled: true, scheduled };
};

/** Activa o desactiva los avisos automaticos y los reprograma al instante. */
export const setAutoRemindersEnabled = (enabled: boolean): Promise<AutoReminderResult> =>
  runExclusive(async () => {
    await localDb.setMeta(SETTING_KEY, enabled ? '1' : '0');

    if (Platform.OS === 'web') {
      return { enabled, scheduled: 0 };
    }

    if (!enabled) {
      await cancelAutoReminders();
      lastSyncAt = 0;
      return { enabled: false, scheduled: 0 };
    }

    const result = await performSync({ requestPermission: true, force: true });

    if (result.permissionDenied) {
      // Si el usuario niega las notificaciones no dejamos el interruptor en on:
      // evitaria prometer avisos que nunca van a llegar.
      await localDb.setMeta(SETTING_KEY, '0');
      return { ...result, enabled: false };
    }

    return result;
  });
