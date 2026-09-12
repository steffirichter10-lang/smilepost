import { router } from 'expo-router';
import { Button, useThemeColor } from 'heroui-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { Text, useWindowDimensions, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const HERO_VIDEO_URL =
  'https://res.cloudinary.com/hnb8c0nk/video/upload/v1789256936/make-someone-smile-spot.mp4';

export default function HomeScreen() {
  const [foreground, accentForeground] = useThemeColor(['foreground', 'accent-foreground']);
  const player = useVideoPlayer(HERO_VIDEO_URL, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });
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
            A small moment, a personal message, and a smile that keeps making a difference.
          </Text>
        </View>

        <View className="bg-card/90 overflow-hidden rounded-[36px] border border-white/90 p-3 shadow-sm">
          <View
            className="bg-lilac/70 relative w-full overflow-hidden rounded-[28px]"
            style={{ height: videoHeight }}
          >
            <VideoView
              player={player}
              nativeControls={false}
              contentFit="cover"
              style={{ width: '100%', height: videoHeight }}
            />
          </View>
        </View>

        <View className={isCompact ? 'mt-3 flex-row items-center' : 'mt-5 flex-row items-center'}>
          <Button
            variant="primary"
            onPress={() => router.push('/send')}
            className="h-14 flex-1 rounded-full"
          >
            <Button.Label className="font-semibold">Send a smile</Button.Label>
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
