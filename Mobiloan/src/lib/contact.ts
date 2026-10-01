import { Linking } from 'react-native';

const normalizePhone = (value: string) => value.replace(/[^\d]/g, '');

const openExternalUrl = async (url: string) => {
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    throw new Error('El dispositivo no puede abrir este enlace.');
  }

  await Linking.openURL(url);
};

export const openPhoneCall = async (phone: string | null | undefined) => {
  if (!phone) {
    throw new Error('El cliente no tiene telefono registrado.');
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error('El telefono registrado no es valido.');
  }

  await openExternalUrl(`tel:${normalized}`);
};

export const openWhatsApp = async (phone: string | null | undefined) => {
  if (!phone) {
    throw new Error('El cliente no tiene telefono registrado.');
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error('El telefono registrado no es valido.');
  }

  await openExternalUrl(`https://wa.me/${normalized}`);
};
