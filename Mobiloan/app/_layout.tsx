import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { AppProviders, useSession } from '../src/providers/AppProviders';
import { APP_THEME } from '../src/lib/config';

function RootNavigator() {
  const { isReady } = useSession();

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: APP_THEME.mist,
        }}
      >
        <ActivityIndicator size="large" color={APP_THEME.accent} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: APP_THEME.ink },
        headerTintColor: '#F8FDFF',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: APP_THEME.mist },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
