import { useState } from 'react';
import { MapPin, Sparkles } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useThemeColor } from 'heroui-native';

import MapView, { type MapMarker } from '@/components/MapView';

const SMILE_PLACES: MapMarker[] = [
  {
    id: 'garten',
    coordinate: { latitude: 48.1402, longitude: 11.5721 },
    title: 'Englischer Garten',
    description: 'Ein Spaziergang, der den Kopf frei macht.',
    color: 'orange',
  },
  {
    id: 'isar',
    coordinate: { latitude: 48.1278, longitude: 11.5782 },
    title: 'Isarwiesen',
    description: 'Sonne, Wasser und gute Gespräche.',
    color: 'purple',
  },
  {
    id: 'markt',
    coordinate: { latitude: 48.1351, longitude: 11.5763 },
    title: 'Viktualienmarkt',
    description: 'Ein Lieblingsplatz für kleine Genussmomente.',
    color: 'yellow',
  },
  {
    id: 'museum',
    coordinate: { latitude: 48.1301, longitude: 11.5835 },
    title: 'Deutsches Museum',
    description: 'Neugier macht Freude.',
    color: 'cyan',
  },
];

export default function SmileMapScreen() {
  const [selectedPlace, setSelectedPlace] = useState<MapMarker>(SMILE_PLACES[0]);
  const [foreground] = useThemeColor(['foreground']);

  return (
    <View className="bg-cream flex-1">
      <View className="p-safe-or-5 flex-1">
        <View className="mx-auto w-full max-w-4xl flex-1 py-4">
          <View className="mb-5 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-muted text-xs font-semibold tracking-[2.5px]">SMILE MAP</Text>
              <Text className="text-foreground mt-2 text-4xl font-bold">Smile-Orte</Text>
              <Text className="text-muted mt-2 text-sm leading-5">
                Orte in München, die Raum für schöne Momente schaffen.
              </Text>
            </View>
            <View className="bg-sun size-12 items-center justify-center rounded-full">
              <Sparkles color={foreground} size={21} />
            </View>
          </View>

          <View className="bg-card flex-1 overflow-hidden rounded-[34px] border border-white/90 p-2 shadow-sm">
            <MapView
              initialRegion={{
                latitude: 48.1351,
                longitude: 11.582,
                latitudeDelta: 0.035,
                longitudeDelta: 0.035,
              }}
              markers={SMILE_PLACES}
              onMarkerPress={setSelectedPlace}
              style={{ flex: 1, minHeight: 360, borderRadius: 27 }}
            />
          </View>

          <View className="bg-card mt-4 flex-row items-center rounded-[26px] border border-white/90 p-4 shadow-sm">
            <View className="bg-blush size-12 items-center justify-center rounded-full">
              <MapPin color={foreground} size={21} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-foreground text-base font-bold">{selectedPlace.title}</Text>
              <Text className="text-muted mt-1 text-sm leading-5">{selectedPlace.description}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
