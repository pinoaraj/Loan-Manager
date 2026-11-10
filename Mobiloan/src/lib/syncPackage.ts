import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { localDb } from '../data/database';

export const exportPortableSyncPackage = async () => {
  const payload = await localDb.exportPortableSnapshot();
  const json = JSON.stringify(payload, null, 2);

  if (Platform.OS === 'web') {
    throw new Error('La exportacion portable esta pensada para Android o iOS.');
  }

  const directory = FileSystem.cacheDirectory;
  if (!directory) {
    throw new Error('No se pudo acceder al almacenamiento temporal del dispositivo.');
  }

  const fileUri = `${directory}mobiloan-sync-${new Date().toISOString().slice(0, 10)}.json`;
  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('El dispositivo no permite compartir archivos desde esta app.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'Exportar cartera Mobiloan al desktop',
  });

  return fileUri;
};
