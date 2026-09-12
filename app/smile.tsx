import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Spinner, useThemeColor } from 'heroui-native';
import { ArrowRight, Globe2, Heart, MapPin, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { confirmSmile, resolveSmile } from '@/lib/smileChains';

type ScreenState = 'loading' | 'ready' | 'confirming' | 'confirmed' | 'error';

export default function ReceivedSmileScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : '';
  const [state, setState] = useState<ScreenState>('loading');
  const [generation, setGeneration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [foreground, accentForeground] = useThemeColor(['foreground', 'accent-foreground']);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) {
        setErrorMessage('In diesem Link fehlt der Smile-Code.');
        setState('error');
        return;
      }
      try {
        const result = await resolveSmile(token);
        if (!active) return;
        setGeneration(result.generation);
        setState(result.confirmed ? 'confirmed' : 'ready');
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error instanceof Error ? error.message : 'Der Smile-Link konnte nicht geöffnet werden.',
        );
        setState('error');
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [token]);

  const acceptSmile = async (includeArea: boolean) => {
    setState('confirming');
    setErrorMessage('');
    try {
      let coordinates: { latitude: number; longitude: number } | undefined;
      if (includeArea) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.granted) {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coordinates = location.coords;
        }
      }
      await confirmSmile(token, coordinates);
      setState('confirmed');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Der Smile konnte nicht bestätigt werden.',
      );
      setState('ready');
    }
  };

  return (
    <View className="bg-cream flex-1">
      <PastelBackdrop />
      <View className="p-safe-or-5 mx-auto w-full max-w-xl flex-1 justify-center">
        <View className="bg-card/95 items-center rounded-[36px] border border-white/90 p-7 shadow-sm">
          <View className="bg-blush size-20 items-center justify-center rounded-full">
            {state === 'loading' || state === 'confirming' ? (
              <Spinner color={foreground} />
            ) : (
              <Heart color={foreground} fill={foreground} size={34} />
            )}
          </View>

          {state === 'error' ? (
            <>
              <Text className="text-foreground mt-6 text-center text-3xl font-bold">
                Smile nicht gefunden
              </Text>
              <Text className="text-muted mt-3 text-center text-base leading-6">
                {errorMessage}
              </Text>
              <Button
                variant="secondary"
                onPress={() => router.replace('/')}
                className="mt-7 h-13 rounded-full px-6"
              >
                <Button.Label>Zur Startseite</Button.Label>
              </Button>
            </>
          ) : state === 'confirmed' ? (
            <>
              <Text className="text-muted mt-6 text-xs font-semibold tracking-[2px]">
                SMILE #{generation}
              </Text>
              <Text className="text-foreground mt-2 text-center text-4xl leading-tight font-bold">
                Jetzt beginnt dein Impact.
              </Text>
              <Text className="text-muted mt-3 text-center text-base leading-6">
                Dein Lächeln zählt zur Kette. Schick jetzt jemandem eine persönliche Nachricht und
                lass sie weiterwachsen.
              </Text>
              <View className="bg-sun/55 mt-6 w-full flex-row items-center rounded-[22px] p-4">
                <Sparkles color={foreground} size={22} />
                <Text className="text-foreground ml-3 flex-1 text-sm leading-5 font-medium">
                  Aus einem Smile können viele werden.
                </Text>
              </View>
              <Button
                variant="primary"
                onPress={() =>
                  router.replace({ pathname: '/send', params: { parentToken: token } })
                }
                className="mt-6 h-14 w-full rounded-full"
              >
                <Button.Label className="font-semibold">Smile weitergeben</Button.Label>
                <ArrowRight color={accentForeground} size={20} />
              </Button>
            </>
          ) : (
            <>
              <Text className="text-muted mt-6 text-xs font-semibold tracking-[2px]">
                EIN SMILE FÜR DICH
              </Text>
              <Text className="text-foreground mt-2 text-center text-4xl leading-tight font-bold">
                Ist dein Smile angekommen?
              </Text>
              <Text className="text-muted mt-3 text-center text-base leading-6">
                Bestätige ihn, damit sein Weg auf der Impact Map sichtbar wird. Namen und Nachricht
                werden nie gespeichert.
              </Text>
              <Button
                variant="primary"
                isDisabled={state === 'confirming'}
                onPress={() => acceptSmile(true)}
                className="mt-7 h-14 w-full rounded-full"
              >
                <MapPin color={accentForeground} size={20} />
                <Button.Label className="font-semibold">Anonym auf der Map zeigen</Button.Label>
              </Button>
              <Text className="text-muted mt-3 text-center text-xs leading-4">
                Nur ein grober Bereich wird gespeichert, nie dein genauer Standort. Die Freigabe ist
                freiwillig.
              </Text>
              <Button
                variant="ghost"
                isDisabled={state === 'confirming'}
                onPress={() => acceptSmile(false)}
                className="mt-2 h-12 rounded-full"
              >
                <Globe2 color={foreground} size={18} />
                <Button.Label>Ohne Standort bestätigen</Button.Label>
              </Button>
              {errorMessage ? (
                <Text className="text-danger mt-3 text-center text-sm">{errorMessage}</Text>
              ) : null}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function PastelBackdrop() {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <View className="bg-blush/45 absolute -top-24 -left-28 size-80 rounded-full" />
      <View className="bg-sun/35 absolute top-52 -right-24 size-72 rounded-full" />
      <View className="bg-lilac/40 absolute -bottom-32 -left-32 size-96 rounded-full" />
    </View>
  );
}
