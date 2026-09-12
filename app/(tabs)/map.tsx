import { useFocusEffect } from 'expo-router';
import { Button, Spinner, useThemeColor } from 'heroui-native';
import { GitFork, Globe2, Heart, RefreshCw, Sparkles } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import MapView, { type MapMarker, type MapPolyline } from '@/components/MapView';
import { loadSmileSummaries, type SmileChainSummary } from '@/lib/smileChains';

export default function SmileMapScreen() {
  const [summaries, setSummaries] = useState<SmileChainSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [foreground, accent, muted] = useThemeColor(['foreground', 'accent', 'muted']);
  const { height } = useWindowDimensions();
  const isCompact = height < 760;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setSummaries(await loadSmileSummaries());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'We couldn’t load your Smile impact.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const { markers, polylines, confirmedSmiles, generations } = useMemo(() => {
    const nextMarkers: MapMarker[] = [];
    const nextPolylines: MapPolyline[] = [];

    for (const [chainIndex, summary] of summaries.entries()) {
      const locations = new Map(
        summary.nodes
          .filter((node) => node.latitude !== null && node.longitude !== null)
          .map((node) => [node.id, { latitude: node.latitude!, longitude: node.longitude! }]),
      );

      for (const node of summary.nodes) {
        const coordinate = locations.get(node.id);
        if (!coordinate) continue;
        nextMarkers.push({
          id: node.id,
          coordinate,
          title:
            node.generation === 1 ? 'This is where your Smile arrived' : `Smile ${node.generation}`,
          description: `Stop ${node.generation} in this Smile chain`,
          color: chainIndex % 2 === 0 ? 'orange' : 'purple',
        });
        const parentCoordinate = node.parentId ? locations.get(node.parentId) : undefined;
        if (parentCoordinate) {
          nextPolylines.push({
            id: `${node.parentId}-${node.id}`,
            coordinates: [parentCoordinate, coordinate],
            strokeColor: chainIndex % 2 === 0 ? accent : foreground,
            strokeWidth: 3,
            lineDashPattern: [8, 6],
          });
        }
      }
    }

    return {
      markers: nextMarkers,
      polylines: nextPolylines,
      confirmedSmiles: summaries.reduce((total, summary) => total + summary.confirmedSmiles, 0),
      generations: summaries.reduce(
        (highest, summary) => Math.max(highest, summary.generations),
        0,
      ),
    };
  }, [accent, foreground, summaries]);

  return (
    <View className="bg-cream flex-1">
      <PastelBackdrop />
      <View className="p-safe-or-4 mx-auto w-full max-w-5xl flex-1">
        <View className={isCompact ? 'mb-3 flex-row items-start' : 'mb-5 flex-row items-start'}>
          <View className="flex-1 pr-3">
            <Text className="text-muted text-xs font-semibold tracking-[2.5px]">
              YOUR SMILE IMPACT
            </Text>
            <Text
              className={`text-foreground mt-1 font-bold ${isCompact ? 'text-3xl' : 'text-4xl'}`}
            >
              A Smile keeps making a difference.
            </Text>
            {!isCompact ? (
              <Text className="text-muted mt-2 max-w-2xl text-sm leading-5">
                Every confirmed handoff helps your personal Smile chain grow.
              </Text>
            ) : null}
          </View>
          <Button
            variant="secondary"
            isIconOnly
            onPress={refresh}
            isDisabled={isLoading}
            className="size-11 rounded-full"
          >
            {isLoading ? (
              <Spinner color={foreground} />
            ) : (
              <RefreshCw color={foreground} size={19} />
            )}
          </Button>
        </View>

        <View className="mb-3 flex-row gap-2.5">
          <ImpactCard
            icon={Heart}
            value={confirmedSmiles}
            label="Smiles inspired"
            colorClass="bg-blush"
          />
          <ImpactCard
            icon={GitFork}
            value={generations}
            label="Handoff stages"
            colorClass="bg-lilac"
          />
          <ImpactCard
            icon={Globe2}
            value={markers.length}
            label="On the world map"
            colorClass="bg-sun"
          />
        </View>

        <View className="bg-card relative flex-1 overflow-hidden rounded-[32px] border border-white/90 p-2 shadow-sm">
          <MapView
            initialRegion={{
              latitude: 20,
              longitude: 0,
              latitudeDelta: 140,
              longitudeDelta: 280,
            }}
            markers={markers}
            polylines={polylines}
            minZoomLevel={1}
            style={{ flex: 1, minHeight: 300, borderRadius: 25 }}
          />

          {!isLoading && confirmedSmiles === 0 ? (
            <View className="bg-card/95 absolute right-5 bottom-5 left-5 items-center rounded-[26px] border border-white/90 p-5 shadow-sm">
              <View className="bg-sun size-11 items-center justify-center rounded-full">
                <Sparkles color={foreground} size={20} />
              </View>
              <Text className="text-foreground mt-3 text-center text-lg font-bold">
                Your first impact is waiting.
              </Text>
              <Text className="text-muted mt-1 text-center text-sm leading-5">
                Send a Smile. Once it’s confirmed, its real journey will begin here.
              </Text>
            </View>
          ) : null}
        </View>

        {errorMessage ? (
          <Text className="text-danger mt-3 text-center text-sm">{errorMessage}</Text>
        ) : markers.length < confirmedSmiles && confirmedSmiles > 0 ? (
          <Text className="mt-3 text-center text-xs leading-4" style={{ color: muted }}>
            {confirmedSmiles - markers.length} confirmed Smiles are counted without a location.
          </Text>
        ) : (
          <Text className="text-muted mt-3 text-center text-xs leading-4">
            The map only shows approximate areas shared voluntarily.
          </Text>
        )}
      </View>
    </View>
  );
}

function ImpactCard({
  icon: Icon,
  value,
  label,
  colorClass,
}: {
  icon: typeof Heart;
  value: number;
  label: string;
  colorClass: string;
}) {
  const [foreground] = useThemeColor(['foreground']);
  return (
    <View className="bg-card min-w-0 flex-1 rounded-[22px] border border-white/90 p-3 shadow-sm">
      <View className={`${colorClass} size-8 items-center justify-center rounded-full`}>
        <Icon color={foreground} size={16} />
      </View>
      <Text className="text-foreground mt-2 text-2xl font-bold">{value}</Text>
      <Text className="text-muted mt-0.5 text-[11px] leading-4">{label}</Text>
    </View>
  );
}

function PastelBackdrop() {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <View className="bg-blush/35 absolute -top-28 -left-24 size-80 rounded-full" />
      <View className="bg-sun/25 absolute top-64 -right-24 size-72 rounded-full" />
      <View className="bg-lilac/30 absolute -bottom-36 -left-20 size-96 rounded-full" />
    </View>
  );
}
