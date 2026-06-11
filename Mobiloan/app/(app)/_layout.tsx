import { Redirect, Stack } from 'expo-router';

import { useSession } from '../../src/providers/AppProviders';

export default function AppLayout() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Cartera' }} />
      <Stack.Screen name="clients/[id]" options={{ title: 'Cliente' }} />
      <Stack.Screen name="loans/[id]" options={{ title: 'Prestamo' }} />
    </Stack>
  );
}
