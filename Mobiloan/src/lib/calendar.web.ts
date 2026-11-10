import type { LocalReminderInput, LocalReminderResult } from '../types/sync';

export const createCollectionReminder = async (
  _input: LocalReminderInput,
): Promise<LocalReminderResult> => {
  throw new Error('Los recordatorios nativos de calendario y notificaciones solo estan disponibles en Android o iOS.');
};
