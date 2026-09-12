import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Home, Map, Send, Settings } from 'lucide-react-native';
import { useThemeColor } from 'heroui-native';

const statusBarProps = { style: 'dark' as const };

export default function TabLayout() {
  const [background, foreground, muted, accent] = useThemeColor([
    'background',
    'foreground',
    'muted',
    'accent',
  ]);

  return (
    <>
      <StatusBar {...statusBarProps} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: accent,
          tabBarInactiveTintColor: muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarStyle: {
            backgroundColor: background,
            borderTopColor: foreground,
            borderTopWidth: 0,
            height: 72,
            paddingTop: 8,
            paddingBottom: 8,
            shadowColor: foreground,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 10,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2.2} />,
          }}
        />
        <Tabs.Screen
          name="send"
          options={{
            title: 'Send',
            tabBarIcon: ({ color, size }) => <Send color={color} size={size} strokeWidth={2.2} />,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Impact',
            tabBarIcon: ({ color, size }) => <Map color={color} size={size} strokeWidth={2.2} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Settings color={color} size={size} strokeWidth={2.2} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
