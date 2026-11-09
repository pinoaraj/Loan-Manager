import { Redirect, Stack } from 'expo-router';

import { APP_THEME } from '../../src/lib/config';
import { useSession } from '../../src/providers/AppProviders';

export default function AppLayout() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: APP_THEME.ink },
        headerTintColor: '#F8FDFF',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: APP_THEME.mist },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Cartera' }} />
      <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
      <Stack.Screen name="new-client" options={{ title: 'Nuevo cliente' }} />
      <Stack.Screen name="new-loan" options={{ title: 'Nuevo prestamo' }} />
      <Stack.Screen name="calculator" options={{ title: 'Calculadora' }} />
      <Stack.Screen name="collections" options={{ title: 'Cobranza' }} />
      <Stack.Screen name="loans/index" options={{ title: 'Prestamos' }} />
      <Stack.Screen name="clients/[id]" options={{ title: 'Cliente' }} />
      <Stack.Screen name="loans/[id]" options={{ title: 'Prestamo' }} />
    </Stack>
  );
}
