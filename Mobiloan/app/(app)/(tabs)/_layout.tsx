import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useWindowDimensions } from 'react-native';

import { APP_THEME } from '../../../src/lib/config';

type TabIconProps = {
  color: ColorValue;
  size: number;
  focused: boolean;
};

const tabIcon =
  (active: keyof typeof Ionicons.glyphMap, inactive: keyof typeof Ionicons.glyphMap) =>
  ({ color, size, focused }: TabIconProps) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color as string} />
  );

/**
 * A partir de este ancho la app cambia a navegacion lateral permanente.
 * En telefono se mantiene la barra inferior, que es el patron movil correcto.
 */
const SIDEBAR_BREAKPOINT = 720;

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const useSidebar = width >= SIDEBAR_BREAKPOINT;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: APP_THEME.accent,
        tabBarInactiveTintColor: '#829AB1',
        tabBarActiveBackgroundColor: useSidebar ? APP_THEME.accentSoft : 'transparent',
        tabBarPosition: useSidebar ? 'left' : 'bottom',
        tabBarVariant: useSidebar ? 'material' : 'uikit',
        tabBarLabelPosition: useSidebar ? 'beside-icon' : 'below-icon',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarHideOnKeyboard: true,
        tabBarStyle: useSidebar
          ? {
              width: 240,
              minWidth: 240,
              backgroundColor: '#FFFFFF',
              borderRightColor: '#E2E8F0',
              paddingTop: 12,
            }
          : {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E2E8F0',
              paddingTop: 6,
            },
        tabBarItemStyle: useSidebar ? { borderRadius: 14, marginHorizontal: 8 } : undefined,
        sceneStyle: { backgroundColor: APP_THEME.mist },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Cobranza',
          tabBarIcon: tabIcon('cash', 'cash-outline'),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Cartera',
          tabBarIcon: tabIcon('albums', 'albums-outline'),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Análisis',
          tabBarIcon: tabIcon('stats-chart', 'stats-chart-outline'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: tabIcon('settings', 'settings-outline'),
        }}
      />
    </Tabs>
  );
}
