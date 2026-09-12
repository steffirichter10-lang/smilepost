import { router } from 'expo-router';
import { Button, useThemeColor } from 'heroui-native';
import { ArrowRight, Play, Sparkles } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

export default function HomeScreen() {
  const [foreground, accentForeground] = useThemeColor(['foreground', 'accent-foreground']);

  return (
    <View className="bg-cream flex-1">
      <PastelBackdrop />
      <ScrollView
        contentContainerClassName="p-safe-or-5 flex-grow"
        showsVerticalScrollIndicator={false}
      >
        <View className="web:py-10 mx-auto w-full max-w-3xl flex-1 py-5">
          <View className="mb-8 flex-row items-center justify-between">
            <View className="bg-card/85 rounded-full border border-white/80 px-4 py-2">
              <Text className="text-foreground text-xs font-bold tracking-[1.7px]">
                TO MAKE SOMEONE SMILE
              </Text>
            </View>
            <View className="bg-sun size-11 items-center justify-center rounded-full">
              <Sparkles color={foreground} size={20} />
            </View>
          </View>

          <View className="mb-7">
            <Text className="text-foreground web:text-7xl max-w-2xl text-5xl leading-[1.04] font-bold">
              Joy begins with a smile
            </Text>
            <Text className="text-muted mt-4 max-w-xl text-base leading-7">
              Ein kleiner Moment, eine persönliche Nachricht und ein Lächeln, das weiterwirkt.
            </Text>
          </View>

          <View className="bg-card/90 overflow-hidden rounded-[36px] border border-white/90 p-3 shadow-sm">
            <View
              className="bg-lilac/70 relative w-full items-center justify-center overflow-hidden rounded-[28px]"
              style={{ aspectRatio: 16 / 9 }}
            >
              <View className="bg-blush/70 absolute -top-12 -right-10 size-44 rounded-full" />
              <View className="bg-sun/60 absolute -bottom-16 -left-8 size-48 rounded-full" />
              <View className="bg-card/90 size-20 items-center justify-center rounded-full shadow-sm">
                <Play color={foreground} fill={foreground} size={30} />
              </View>
              <View className="absolute right-5 bottom-5 left-5 flex-row items-end justify-between">
                <View>
                  <Text className="text-foreground text-base font-bold">Dein Video</Text>
                  <Text className="text-muted mt-1 text-xs">Video-Platzhalter</Text>
                </View>
                <View className="rounded-full bg-white/70 px-3 py-1.5">
                  <Text className="text-foreground text-xs font-semibold">00:00</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-7 flex-row items-center gap-4">
            <Button
              variant="primary"
              onPress={() => router.push('/send')}
              className="h-14 flex-1 rounded-full"
            >
              <Button.Label className="font-semibold">Ein Lächeln senden</Button.Label>
              <ArrowRight color={accentForeground} size={20} />
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function PastelBackdrop() {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <View className="bg-blush/40 absolute -top-28 -left-24 size-80 rounded-full" />
      <View className="bg-sun/30 absolute top-64 -right-24 size-72 rounded-full" />
      <View className="bg-lilac/35 absolute -bottom-36 -left-20 size-96 rounded-full" />
    </View>
  );
}
