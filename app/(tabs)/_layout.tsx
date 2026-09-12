import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const statusBarProps = { style: 'dark' as const };

export default function TabLayout() {
  return (
    <>
      <StatusBar {...statusBarProps} />
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="index" options={{ title: 'To make someone smile' }} />
      </Tabs>
    </>
  );
}
