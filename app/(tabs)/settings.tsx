import { Bell, ChevronRight, CircleHelp, Heart, Lock, Sparkles } from 'lucide-react-native';
import { Switch, useThemeColor } from 'heroui-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, View } from 'react-native';

import {
  disableSmileNotifications,
  enableSmileNotifications,
  getSmileNotificationsEnabled,
} from '@/lib/smileNotifications';

const ITEMS = [
  {
    title: 'AI status',
    description: 'Not connected yet',
    icon: Sparkles,
    className: 'bg-lilac',
  },
  {
    title: 'Privacy',
    description: 'How we handle your messages',
    icon: Lock,
    className: 'bg-blush',
  },
  {
    title: 'About the app',
    description: 'To make someone smile',
    icon: Heart,
    className: 'bg-sun',
  },
  { title: 'Help', description: 'Answers and contact', icon: CircleHelp, className: 'bg-sand' },
];

export default function SettingsScreen() {
  const [foreground, muted] = useThemeColor(['foreground', 'muted']);
  const [smilesEnabled, setSmilesEnabled] = useState(false);
  const [smilesLoading, setSmilesLoading] = useState(true);
  const [smilesMessage, setSmilesMessage] = useState('');

  useEffect(() => {
    void getSmileNotificationsEnabled()
      .then(setSmilesEnabled)
      .finally(() => setSmilesLoading(false));
  }, []);

  const handleSmileNotificationsChange = async (isSelected: boolean) => {
    setSmilesLoading(true);
    setSmilesMessage('');

    try {
      if (!isSelected) {
        await disableSmileNotifications();
        setSmilesEnabled(false);
        return;
      }

      const status = await enableSmileNotifications();
      setSmilesEnabled(status === 'enabled');
      if (status === 'disabled') {
        setSmilesMessage('Notifications are disabled. You can allow them in your device settings.');
      } else if (status === 'unsupported') {
        setSmilesMessage('Daily Smiles are available in the installed app.');
      }
    } catch {
      setSmilesEnabled(false);
      setSmilesMessage('We couldn’t set up your daily Smile right now.');
    } finally {
      setSmilesLoading(false);
    }
  };

  return (
    <View className="bg-cream flex-1">
      <ScrollView
        contentContainerClassName="p-safe-or-5 flex-grow"
        showsVerticalScrollIndicator={false}
      >
        <View className="web:py-10 mx-auto w-full max-w-2xl py-5">
          <Text className="text-muted text-xs font-semibold tracking-[2.5px]">YOUR APP</Text>
          <Text className="text-foreground mt-2 text-4xl font-bold">Settings</Text>
          <Text className="text-muted mt-3 text-base leading-6">
            Everything you need for your Smile messages, all in one place.
          </Text>

          <View className="mt-8 gap-3">
            <View className="bg-card rounded-[28px] border border-white/90 p-4 shadow-sm">
              <View className="flex-row items-center">
                <View className="bg-blush size-12 items-center justify-center rounded-full">
                  <Bell color={foreground} size={20} />
                </View>
                <View className="ml-4 flex-1 pr-3">
                  <Text className="text-foreground text-base font-semibold">Daily Smile</Text>
                  <Text className="text-muted mt-1 text-sm leading-5">
                    Once a day at a random time
                  </Text>
                </View>
                {smilesLoading ? (
                  <ActivityIndicator color={muted} />
                ) : (
                  <Switch
                    accessibilityLabel="Receive a daily Smile"
                    isDisabled={Platform.OS === 'web'}
                    isSelected={smilesEnabled}
                    onSelectedChange={(isSelected) => {
                      void handleSmileNotificationsChange(isSelected);
                    }}
                  />
                )}
              </View>
              {smilesMessage ? (
                <Text className="text-muted mt-3 pl-16 text-sm leading-5">{smilesMessage}</Text>
              ) : null}
            </View>

            {ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <View
                  key={item.title}
                  className="bg-card flex-row items-center rounded-[28px] border border-white/90 p-4 shadow-sm"
                >
                  <View
                    className={`${item.className} size-12 items-center justify-center rounded-full`}
                  >
                    <Icon color={foreground} size={20} />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-foreground text-base font-semibold">{item.title}</Text>
                    <Text className="text-muted mt-1 text-sm">{item.description}</Text>
                  </View>
                  <ChevronRight color={muted} size={20} />
                </View>
              );
            })}
          </View>

          <View className="bg-lilac/60 mt-8 rounded-[30px] p-6">
            <Text className="text-foreground text-xl font-bold">Small words. Big impact.</Text>
            <Text className="text-muted mt-2 text-sm leading-6">
              Version 1.0 · Thoughtfully designed for special people.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
