import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { Button, Input, Spinner, TextArea, TextField, useThemeColor } from 'heroui-native';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Heart,
  MessageCircleHeart,
  Share2,
  Sparkles,
  Star,
  WandSparkles,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Share,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { GesturePressable } from '@/components/ui/primitives/GesturePressable';
import { buildSmileUrl, createChainLink } from '@/lib/smileChains';
import { bilt } from '@/lib/bilt';

type Reason = {
  id: string;
  label: string;
  prompt: string;
  className: string;
  icon: typeof Heart;
};

type ImproveResponse = { message?: string };
type ActiveChainLink = { shareToken: string; trackerToken: string };

const SMILE_FOOTER =
  'Wenn dich das zum Lächeln gebracht hat, schenk bitte auch jemandem einen Smile und lass ihn weiterwandern:';

const REASONS: Reason[] = [
  {
    id: 'thinking',
    label: 'Ich denke an dich',
    prompt: 'Ich möchte zeigen, dass ich an die Person denke.',
    className: 'bg-lilac',
    icon: Sparkles,
  },
  {
    id: 'thanks',
    label: 'Danke sagen',
    prompt: 'Ich möchte mich ehrlich bedanken.',
    className: 'bg-blush',
    icon: MessageCircleHeart,
  },
  {
    id: 'impact',
    label: 'Du bewegst mich',
    prompt: 'Ich möchte sagen, welchen positiven Unterschied die Person macht.',
    className: 'bg-sand',
    icon: Heart,
  },
  {
    id: 'proud',
    label: 'Ich bin stolz auf dich',
    prompt: 'Ich möchte Anerkennung und Stolz ausdrücken.',
    className: 'bg-sun',
    icon: Star,
  },
];

export default function SendScreen() {
  const params = useLocalSearchParams<{ parentToken?: string }>();
  const parentToken = typeof params.parentToken === 'string' ? params.parentToken : undefined;
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [activeChainLink, setActiveChainLink] = useState<ActiveChainLink | null>(null);
  const [feedback, setFeedback] = useState('');
  const { height } = useWindowDimensions();
  const isCompact = height < 820;
  const [foreground, accentForeground] = useThemeColor(['foreground', 'accent-foreground']);
  const selectedReason = useMemo(
    () => REASONS.find((reason) => reason.id === reasonId),
    [reasonId],
  );
  const canContinue =
    step === 1 ? name.trim().length > 0 && Boolean(reasonId) : details.trim().length > 0;

  const goForward = () => {
    setFeedback('');
    if (step === 2) {
      setMessage(
        `Hey ${name.trim()},\n\n${details.trim()}\n\nIch wollte dir das einfach mal sagen.`,
      );
      setStep(3);
      return;
    }
    setStep(2);
  };

  const improveMessage = async () => {
    if (!selectedReason || !details.trim()) return;
    setIsImproving(true);
    setFeedback('');
    const { data, error } = await bilt.functions.invoke<ImproveResponse>('improve-smile-message', {
      body: { name: name.trim(), reason: selectedReason.prompt, details: details.trim() },
    });
    setIsImproving(false);
    if (error || !data?.message) {
      setFeedback(
        'Die KI ist noch nicht verbunden. Du kannst deinen Entwurf trotzdem bearbeiten und teilen.',
      );
      return;
    }
    setMessage(data.message);
    setFeedback('Deine Nachricht wurde verfeinert.');
  };

  const prepareSharedMessage = async () => {
    setIsPreparingShare(true);
    setFeedback('');
    try {
      const chainLink = activeChainLink ?? (await createChainLink(parentToken));
      setActiveChainLink(chainLink);
      const smileUrl = buildSmileUrl(chainLink.shareToken);
      return `${message.trim()}\n\n${SMILE_FOOTER}\n${smileUrl}`;
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Der persönliche Smile-Link konnte nicht erstellt werden.',
      );
      return null;
    } finally {
      setIsPreparingShare(false);
    }
  };

  const shareOnWhatsApp = async () => {
    const sharedMessage = await prepareSharedMessage();
    if (!sharedMessage) return;
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(sharedMessage)}`);
  };

  const shareMessage = async () => {
    const sharedMessage = await prepareSharedMessage();
    if (!sharedMessage) return;
    await Share.share({ message: sharedMessage, title: `Eine Nachricht für ${name.trim()}` });
  };

  const copyMessage = async () => {
    const sharedMessage = await prepareSharedMessage();
    if (!sharedMessage) return;
    await Clipboard.setStringAsync(sharedMessage);
    setFeedback('Nachricht mit persönlichem Smile-Link kopiert.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-cream flex-1"
    >
      <PastelBackdrop />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pb-safe-or-2 pt-safe-or-2 flex-grow"
        showsVerticalScrollIndicator={false}
      >
        <View className="web:pt-5 web:pb-8 mx-auto w-full max-w-2xl flex-1 pb-1">
          <Text
            className={`text-muted text-center text-[11px] font-semibold tracking-[3px] ${isCompact ? 'mb-0' : 'mb-2'}`}
          >
            TO MAKE SOMEONE SMILE
          </Text>
          <StepHeader step={step} compact={isCompact} />
          <View
            className={`bg-card/90 web:mt-4 web:p-9 overflow-hidden rounded-[32px] border border-white/80 shadow-sm ${isCompact ? 'mt-1 p-4' : 'mt-2 p-5'}`}
          >
            {step === 1 ? (
              <View>
                <Text
                  className={`text-foreground web:text-5xl leading-tight font-bold ${isCompact ? 'text-[28px]' : 'text-3xl'}`}
                >
                  Für wen?
                </Text>
                <Text
                  className={`text-muted text-base ${isCompact ? 'mt-1 leading-5' : 'mt-2 leading-6'}`}
                >
                  Wem möchtest du heute ein Lächeln schenken?
                </Text>
                <TextField className={isCompact ? 'mt-3' : 'web:mt-7 mt-5'}>
                  <Input
                    value={name}
                    onChangeText={setName}
                    placeholder="Name, z. B. Mia"
                    autoCapitalize="words"
                    returnKeyType="done"
                    className={`bg-background rounded-full px-5 text-base ${isCompact ? 'h-12' : 'h-14'}`}
                  />
                </TextField>
                <Text
                  className={`text-foreground text-sm font-semibold ${isCompact ? 'mt-3 mb-2' : 'web:mt-7 mt-5 mb-3'}`}
                >
                  Was ist dein Anlass?
                </Text>
                <View className={`flex-row flex-wrap ${isCompact ? 'gap-2' : 'gap-3'}`}>
                  {REASONS.map((reason) => {
                    const Icon = reason.icon;
                    const selected = reason.id === reasonId;
                    return (
                      <GesturePressable
                        key={reason.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setReasonId(reason.id)}
                        className={`web:min-h-28 web:flex-col web:items-stretch web:justify-between web:p-3 w-[47%] flex-grow flex-row items-center rounded-[20px] border ${isCompact ? 'min-h-14 p-2' : 'min-h-16 p-2.5'} ${reason.className} ${selected ? 'border-foreground' : 'border-white/60'}`}
                      >
                        <View
                          className={`web:size-9 shrink-0 items-center justify-center rounded-full bg-white/65 ${isCompact ? 'size-7' : 'size-8'}`}
                        >
                          {selected ? (
                            <Check size={18} color={foreground} />
                          ) : (
                            <Icon size={18} color={foreground} />
                          )}
                        </View>
                        <Text className="text-foreground web:mt-3 web:ml-0 web:flex-none web:text-sm web:leading-5 ml-2.5 flex-1 text-sm leading-4 font-semibold">
                          {reason.label}
                        </Text>
                      </GesturePressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {step === 2 ? (
              <View>
                <View className="bg-lilac self-start rounded-full px-3.5 py-1.5">
                  <Text className="text-foreground text-xs font-semibold">
                    {selectedReason?.label}
                  </Text>
                </View>
                <Text className="text-foreground web:text-5xl mt-3 text-3xl leading-tight font-bold">
                  Was soll {name.trim()} wissen?
                </Text>
                <Text className="text-muted mt-1 text-base leading-5">
                  Schreib einfach frei heraus. Stichpunkte reichen völlig.
                </Text>
                <TextField className={isCompact ? 'mt-3' : 'web:mt-7 mt-5'}>
                  <TextArea
                    value={details}
                    onChangeText={setDetails}
                    placeholder="Zum Beispiel: Danke, dass du immer zuhörst …"
                    autoFocus
                    maxLength={900}
                    className={`bg-background web:min-h-44 rounded-[24px] px-5 py-4 text-base leading-6 ${isCompact ? 'min-h-28' : 'min-h-36'}`}
                  />
                </TextField>
                <Text className="text-muted mt-2 text-right text-xs">{details.length}/900</Text>
                <View
                  className={`bg-sun/55 web:mt-5 flex-row items-center rounded-[20px] ${isCompact ? 'mt-2 p-2.5' : 'mt-3 p-3.5'}`}
                >
                  <WandSparkles size={20} color={foreground} />
                  <Text className="text-foreground ml-3 flex-1 text-sm leading-5">
                    Im nächsten Schritt kannst du deinen Text mit KI wärmer und persönlicher
                    formulieren.
                  </Text>
                </View>
              </View>
            ) : null}

            {step === 3 ? (
              <View>
                <Text className="text-foreground web:text-5xl text-3xl leading-tight font-bold">
                  Bereit für {name.trim()}.
                </Text>
                <Text className="text-muted mt-2 text-base leading-6">
                  Passe die Nachricht an, bis sie sich wirklich nach dir anhört.
                </Text>
                <TextField className="web:mt-7 mt-5">
                  <TextArea
                    value={message}
                    onChangeText={setMessage}
                    maxLength={1500}
                    className="bg-background web:min-h-56 min-h-40 rounded-[24px] px-5 py-4 text-base leading-6"
                  />
                </TextField>
                <Button
                  variant="secondary"
                  onPress={improveMessage}
                  isDisabled={isImproving}
                  className="bg-lilac mt-4 h-13 rounded-full"
                >
                  {isImproving ? (
                    <Spinner color={foreground} />
                  ) : (
                    <>
                      <WandSparkles size={19} color={foreground} />
                      <Button.Label className="font-semibold">Mit KI verbessern</Button.Label>
                    </>
                  )}
                </Button>
                {feedback ? (
                  <Text className="text-muted mt-3 text-sm leading-5">{feedback}</Text>
                ) : null}
                <View className="bg-sun/55 mt-4 flex-row items-center rounded-[20px] p-3.5">
                  <Sparkles size={20} color={foreground} />
                  <Text className="text-foreground ml-3 flex-1 text-sm leading-5">
                    Beim Senden erhält deine Nachricht einen persönlichen Link. So siehst du auf der
                    Impact Map, wie dein Smile weitergegeben wird.
                  </Text>
                </View>
                <View className="web:mt-7 mt-5 gap-3">
                  <Button
                    variant="primary"
                    onPress={shareOnWhatsApp}
                    isDisabled={isPreparingShare}
                    className="h-14 rounded-full"
                  >
                    {isPreparingShare ? (
                      <Spinner color={accentForeground} />
                    ) : (
                      <MessageCircleHeart size={20} color={accentForeground} />
                    )}
                    <Button.Label className="font-semibold">Über WhatsApp senden</Button.Label>
                  </Button>
                  <View className="flex-row gap-3">
                    <Button
                      variant="secondary"
                      onPress={shareMessage}
                      isDisabled={isPreparingShare}
                      className="h-13 flex-1 rounded-full"
                    >
                      <Share2 size={19} color={foreground} />
                      <Button.Label>Teilen</Button.Label>
                    </Button>
                    <Button
                      variant="secondary"
                      onPress={copyMessage}
                      isDisabled={isPreparingShare}
                      className="h-13 flex-1 rounded-full"
                    >
                      <Copy size={19} color={foreground} />
                      <Button.Label>Kopieren</Button.Label>
                    </Button>
                  </View>
                </View>
              </View>
            ) : null}

            {step < 3 ? (
              <View className={`web:mt-8 flex-row gap-3 ${isCompact ? 'mt-3' : 'mt-5'}`}>
                {step > 1 ? (
                  <Button
                    variant="secondary"
                    isIconOnly
                    onPress={() => setStep(1)}
                    className={`${isCompact ? 'size-12' : 'size-14'} rounded-full`}
                  >
                    <ArrowLeft size={21} color={foreground} />
                  </Button>
                ) : null}
                <Button
                  variant="primary"
                  isDisabled={!canContinue}
                  onPress={goForward}
                  className={`${isCompact ? 'h-12' : 'h-14'} flex-1 rounded-full`}
                >
                  <Button.Label className="font-semibold">Weiter</Button.Label>
                  <ArrowRight size={20} color={accentForeground} />
                </Button>
              </View>
            ) : (
              <Button
                variant="ghost"
                onPress={() => setStep(2)}
                className="mt-7 self-start rounded-full"
              >
                <ArrowLeft size={18} color={foreground} />
                <Button.Label>Text ändern</Button.Label>
              </Button>
            )}
          </View>
          {!isCompact ? (
            <Text className="text-muted web:mt-5 mt-3 text-center text-xs leading-4">
              Kleine Worte. Große Wirkung.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

function StepHeader({ step, compact }: { step: number; compact: boolean }) {
  const titles = ['Für wen?', 'Was möchtest du sagen?', 'Deine Nachricht'];
  return (
    <View
      className={`border-border/70 bg-card/80 flex-row items-center rounded-full border ${compact ? 'p-1' : 'p-2'}`}
    >
      <View
        className={`bg-foreground web:size-11 items-center justify-center rounded-full ${compact ? 'size-8' : 'size-10'}`}
      >
        <Text className={`text-background font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
          {step}
        </Text>
      </View>
      <Text
        className={`text-foreground flex-1 font-semibold ${compact ? 'ml-2 text-sm' : 'ml-3 text-base'}`}
      >
        {titles[step - 1]}
      </Text>
      <View className={`mr-2 flex-row ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {[1, 2, 3].map((item) => (
          <View
            key={item}
            className={`${compact ? 'size-2' : 'size-2.5'} rounded-full ${item <= step ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </View>
    </View>
  );
}
