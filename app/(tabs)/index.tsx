import { router } from 'expo-router';
import { Button, useThemeColor } from 'heroui-native';
import { ArrowRight, Play, Sparkles } from 'lucide-react-native';
import { Text, useWindowDimensions, View } from 'react-native';

export default function HomeScreen() {
  const [foreground, accentForeground] = useThemeColor(['foreground', 'accent-foreground']);
  const { height, width } = useWindowDimensions();
  const isCompact = height < 760;
  const contentWidth = Math.min(width - 40, 768);
  const videoHeight = Math.max(130, Math.min(contentWidth * (9 / 16), height * 0.3));

  return (
    <View className="bg-cream flex-1">
      <PastelBackdrop />
      <View className="p-safe-or-5 mx-auto w-full max-w-3xl flex-1">
        <View
          className={
            isCompact
              ? 'mb-3 flex-row items-center justify-between'
              : 'mb-5 flex-row items-center justify-between'
          }
        >
          <View className="bg-card/85 rounded-full border border-white/80 px-4 py-2">
            <Text className="text-foreground text-xs font-bold tracking-[1.7px]">
              TO MAKE SOMEONE SMILE
            </Text>
          </View>
          <View className="bg-sun size-11 items-center justify-center rounded-full">
            <Sparkles color={foreground} size={20} />
          </View>
        </View>

        <View className={isCompact ? 'mb-3' : 'mb-5'}>
          <Text
            className={`text-foreground max-w-2xl leading-[1.04] font-bold ${isCompact ? 'text-4xl' : 'web:text-6xl text-5xl'}`}
          >
            Joy begins with a smile
          </Text>
          <Text
            className={`text-muted max-w-xl text-base ${isCompact ? 'mt-2 leading-5' : 'mt-3 leading-6'}`}
          >
            Ein kleiner Moment, eine persönliche Nachricht und ein Lächeln, das weiterwirkt.
          </Text>
        </View>

        <View className="bg-card/90 overflow-hidden rounded-[36px] border border-white/90 p-3 shadow-sm">
          <View
            className="bg-lilac/70 relative w-full items-center justify-center overflow-hidden rounded-[28px]"
            style={{ height: videoHeight }}
          >
            <View className="bg-blush/70 absolute -top-12 -right-10 size-44 rounded-full" />
            <View className="bg-sun/60 absolute -bottom-16 -left-8 size-48 rounded-full" />
            <View
              className={`${isCompact ? 'size-16' : 'size-20'} bg-card/90 items-center justify-center rounded-full shadow-sm`}
            >
              <Play color={foreground} fill={foreground} size={isCompact ? 24 : 30} />
            </View>
            <View className="absolute right-5 bottom-4 left-5 flex-row items-end justify-between">
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

        <View className={isCompact ? 'mt-3 flex-row items-center' : 'mt-5 flex-row items-center'}>
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
