import { Redirect, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_THEME } from '../../src/lib/config';
import { useSession } from '../../src/providers/AppProviders';

export default function AppLayout() {
  const { session } = useSession();
  const insets = useSafeAreaInsets();

  if (!session) {
    return <Redirect href="/login" />;
  }

  /**
   * Las pantallas de detalle no llevan barra inferior, asi que reservamos el
   * alto del gesto de navegacion para que el ultimo contenido no quede debajo.
   */
  const detailContentStyle = {
    backgroundColor: APP_THEME.mist,
    paddingBottom: insets.bottom,
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: APP_THEME.ink },
        headerTintColor: '#F8FDFF',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: APP_THEME.mist },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="new-client"
        options={{ title: 'Nuevo cliente', contentStyle: detailContentStyle }}
      />
      <Stack.Screen
        name="new-loan"
        options={{ title: 'Nuevo prestamo', contentStyle: detailContentStyle }}
      />
      <Stack.Screen
        name="calculator"
        options={{ title: 'Calculadora', contentStyle: detailContentStyle }}
      />
      <Stack.Screen
        name="clients/[id]"
        options={{ title: 'Cliente', contentStyle: detailContentStyle }}
      />
      <Stack.Screen
        name="loans/[id]"
        options={{ title: 'Prestamo', contentStyle: detailContentStyle }}
      />
    </Stack>
  );
}
