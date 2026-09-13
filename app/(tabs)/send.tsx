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

type Reason = {
  id: string;
  label: string;
  className: string;
  icon: typeof Heart;
};

type ActiveChainLink = { shareToken: string; trackerToken: string };

const SMILE_FOOTER = 'If this made you smile, please send someone a Smile too and keep it moving:';

const REASONS: Reason[] = [
  {
    id: 'thinking',
    label: 'Thinking of you',
    className: 'bg-lilac',
    icon: Sparkles,
  },
  {
    id: 'thanks',
    label: 'Say thank you',
    className: 'bg-blush',
    icon: MessageCircleHeart,
  },
  {
    id: 'impact',
    label: 'You inspire me',
    className: 'bg-sand',
    icon: Heart,
  },
  {
    id: 'proud',
    label: "I'm proud of you",
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
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [activeChainLink, setActiveChainLink] = useState<ActiveChainLink | null>(null);
  const [feedback, setFeedback] = useState('');
  const { height, width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 768;
  const isCompact = height < 900;
  const isShortFirstStep = step === 1 && height < 760;
  const isSpaciousFirstStep = step === 1 && !isShortFirstStep && !isWideWeb;
  const isDetailsCompact = step === 2 && height < 900;
  const isResultCompact = step === 3 && height < 950;
  const useCompactLayout =
    step === 1 ? isShortFirstStep : isCompact || isDetailsCompact || isResultCompact;
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
      setMessage(`Hey ${name.trim()},\n\n${details.trim()}\n\nI just wanted you to know.`);
      setStep(3);
      return;
    }
    setStep(2);
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
        error instanceof Error ? error.message : 'We couldn’t create your personal Smile link.',
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
    await Share.share({ message: sharedMessage, title: `A message for ${name.trim()}` });
  };

  const copyMessage = async () => {
    const sharedMessage = await prepareSharedMessage();
    if (!sharedMessage) return;
    await Clipboard.setStringAsync(sharedMessage);
    setFeedback('Message copied with your personal Smile link.');
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
        <View className={`mx-auto w-full max-w-2xl flex-1 ${isWideWeb ? 'pt-5 pb-8' : 'pb-1'}`}>
          <Text
            className={`text-muted text-center text-[11px] font-semibold tracking-[3px] ${useCompactLayout ? 'hidden' : 'mb-2'}`}
          >
            TO MAKE SOMEONE SMILE
          </Text>
          <StepHeader step={step} compact={useCompactLayout} short={isShortFirstStep} />
          <View
            className={`bg-card/90 overflow-hidden rounded-[32px] border border-white/80 shadow-sm ${isSpaciousFirstStep ? 'flex-1' : ''} ${isWideWeb ? 'mt-4 p-9' : isShortFirstStep ? 'mt-1 p-3' : useCompactLayout ? 'mt-1 p-3.5' : 'mt-3 p-5'}`}
          >
            {step === 1 ? (
              <View className={isSpaciousFirstStep ? 'flex-1 justify-center py-2' : ''}>
                <Text
                  className={`text-foreground leading-tight font-bold ${isWideWeb ? 'text-5xl' : isShortFirstStep ? 'text-2xl' : 'text-3xl'}`}
                >
                  Who is it for?
                </Text>
                {isShortFirstStep ? null : (
                  <Text className="text-muted mt-2 text-base leading-6">
                    Who would you like to make smile today?
                  </Text>
                )}
                <TextField className={isWideWeb ? 'mt-7' : isShortFirstStep ? 'mt-1.5' : 'mt-5'}>
                  <Input
                    value={name}
                    onChangeText={setName}
                    placeholder="Name, e.g. Mia"
                    autoCapitalize="words"
                    returnKeyType="done"
                    className={`bg-background rounded-full px-5 text-base ${isShortFirstStep ? 'h-11' : 'h-14'}`}
                  />
                </TextField>
                <Text
                  className={`text-foreground text-sm font-semibold ${isWideWeb ? 'mt-7 mb-3' : isShortFirstStep ? 'mt-2 mb-1.5' : 'mt-5 mb-3'}`}
                >
                  What’s the occasion?
                </Text>
                <View className={`flex-col ${isShortFirstStep ? 'gap-1.5' : 'gap-2'}`}>
                  {REASONS.map((reason) => {
                    const Icon = reason.icon;
                    const selected = reason.id === reasonId;
                    return (
                      <GesturePressable
                        key={reason.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setReasonId(reason.id)}
                        className={`w-full flex-row items-center rounded-[20px] border ${isWideWeb ? 'min-h-16 p-3' : isShortFirstStep ? 'min-h-10 px-2 py-1.5' : 'min-h-13 p-2.5'} ${reason.className} ${selected ? 'border-foreground' : 'border-white/60'}`}
                      >
                        <View
                          className={`${isWideWeb ? 'size-9' : isShortFirstStep ? 'size-7' : 'size-8'} shrink-0 items-center justify-center rounded-full bg-white/65`}
                        >
                          {selected ? (
                            <Check size={18} color={foreground} />
                          ) : (
                            <Icon size={18} color={foreground} />
                          )}
                        </View>
                        <Text className="text-foreground ml-2.5 flex-1 text-sm leading-4 font-semibold">
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
                <View
                  className={`bg-lilac self-start rounded-full px-3.5 ${isDetailsCompact ? 'py-1' : 'py-1.5'}`}
                >
                  <Text className="text-foreground text-xs font-semibold">
                    {selectedReason?.label}
                  </Text>
                </View>
                <Text
                  className={`text-foreground web:text-5xl leading-tight font-bold ${isDetailsCompact ? 'mt-2 text-[27px]' : 'mt-3 text-3xl'}`}
                >
                  What would you like {name.trim()} to know?
                </Text>
                <Text
                  className={`text-muted text-base ${isDetailsCompact ? 'mt-0.5 leading-5' : 'mt-1 leading-5'}`}
                >
                  Write from the heart. A few notes are more than enough.
                </Text>
                <TextField className={isDetailsCompact ? 'mt-2.5' : 'web:mt-7 mt-5'}>
                  <TextArea
                    value={details}
                    onChangeText={setDetails}
                    placeholder="For example: Thank you for always listening …"
                    maxLength={900}
                    className={`bg-background web:min-h-44 rounded-[24px] px-5 text-base leading-6 ${isDetailsCompact ? 'min-h-24 py-3' : 'min-h-36 py-4'}`}
                  />
                </TextField>
                <Text
                  className={`text-muted text-right text-xs ${isDetailsCompact ? 'mt-1' : 'mt-2'}`}
                >
                  {details.length}/900
                </Text>
              </View>
            ) : null}

            {step === 3 ? (
              <View>
                <Text
                  className={`text-foreground web:text-5xl leading-tight font-bold ${isResultCompact ? 'text-[27px]' : 'text-3xl'}`}
                >
                  Ready for {name.trim()}.
                </Text>
                <Text
                  className={`text-muted text-base ${isResultCompact ? 'mt-0.5 text-sm leading-5' : 'mt-2 leading-6'}`}
                >
                  Edit the message until it truly sounds like you.
                </Text>
                <TextField className={isResultCompact ? 'mt-2.5' : 'web:mt-7 mt-5'}>
                  <TextArea
                    value={message}
                    onChangeText={setMessage}
                    maxLength={1500}
                    className={`bg-background web:min-h-56 rounded-[24px] px-5 text-base leading-6 ${isResultCompact ? 'h-28 py-3' : 'min-h-40 py-4'}`}
                  />
                </TextField>
              </View>
            ) : null}

            {step < 3 ? (
              <>
                <View
                  className={`flex-row gap-3 ${isWideWeb ? 'mt-8' : isShortFirstStep ? 'mt-2' : useCompactLayout ? 'mt-2.5' : 'mt-5'}`}
                >
                  {step > 1 ? (
                    <Button
                      variant="secondary"
                      isIconOnly
                      onPress={() => setStep(1)}
                      className={`${useCompactLayout ? 'size-12' : 'size-14'} rounded-full`}
                    >
                      <ArrowLeft size={21} color={foreground} />
                    </Button>
                  ) : null}
                  <Button
                    variant="primary"
                    isDisabled={!canContinue}
                    onPress={goForward}
                    className={`${useCompactLayout ? 'h-12' : 'h-14'} flex-1 rounded-full`}
                  >
                    <Button.Label className="font-semibold">Continue</Button.Label>
                    <ArrowRight size={20} color={accentForeground} />
                  </Button>
                </View>
              </>
            ) : (
              <Button
                variant="ghost"
                onPress={() => setStep(2)}
                className={`${isResultCompact ? 'mt-1.5 h-9' : 'mt-7'} self-start rounded-full`}
              >
                <ArrowLeft size={isResultCompact ? 16 : 18} color={foreground} />
                <Button.Label>Edit text</Button.Label>
              </Button>
            )}

            {step === 3 ? (
              <View className={`web:mt-7 ${isResultCompact ? 'mt-2 gap-2' : 'mt-5 gap-3'}`}>
                <Button
                  variant="primary"
                  onPress={shareOnWhatsApp}
                  isDisabled={isPreparingShare}
                  className={`${isResultCompact ? 'h-12' : 'h-14'} rounded-full`}
                >
                  {isPreparingShare ? (
                    <Spinner color={accentForeground} />
                  ) : (
                    <MessageCircleHeart size={20} color={accentForeground} />
                  )}
                  <Button.Label className="font-semibold">Send via WhatsApp</Button.Label>
                </Button>
                <View className={isResultCompact ? 'flex-row gap-2' : 'flex-row gap-3'}>
                  <Button
                    variant="secondary"
                    onPress={shareMessage}
                    isDisabled={isPreparingShare}
                    className={`${isResultCompact ? 'h-11' : 'h-13'} flex-1 rounded-full`}
                  >
                    <Share2 size={isResultCompact ? 17 : 19} color={foreground} />
                    <Button.Label>Share</Button.Label>
                  </Button>
                  <Button
                    variant="secondary"
                    onPress={copyMessage}
                    isDisabled={isPreparingShare}
                    className={`${isResultCompact ? 'h-11' : 'h-13'} flex-1 rounded-full`}
                  >
                    <Copy size={isResultCompact ? 17 : 19} color={foreground} />
                    <Button.Label>Copy</Button.Label>
                  </Button>
                </View>
                <View
                  className={`bg-sun/55 flex-row items-center rounded-[20px] ${isResultCompact ? 'p-2.5' : 'p-3.5'}`}
                >
                  <Sparkles size={isResultCompact ? 17 : 20} color={foreground} />
                  <Text
                    className={`text-foreground ml-2.5 flex-1 ${isResultCompact ? 'text-xs leading-4' : 'text-sm leading-5'}`}
                  >
                    When you send it, your message gets a personal link. This lets you see how your
                    Smile is passed on through the Impact Map.
                  </Text>
                </View>
                {feedback ? <Text className="text-muted text-sm leading-5">{feedback}</Text> : null}
              </View>
            ) : null}
          </View>
          {!useCompactLayout ? (
            <Text className="text-muted web:mt-5 mt-3 text-center text-xs leading-4">
              Small words. Big impact.
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

function StepHeader({ step, compact, short }: { step: number; compact: boolean; short: boolean }) {
  const titles = ['Who is it for?', 'What would you like to say?', 'Your message'];
  return (
    <View
      className={`border-border/70 bg-card/80 flex-row items-center rounded-full border ${short ? 'p-0.5' : compact ? 'p-1' : 'p-2'}`}
    >
      <View
        className={`bg-foreground items-center justify-center rounded-full ${short ? 'size-7' : compact ? 'size-8' : 'size-10'}`}
      >
        <Text
          className={`text-background font-semibold ${short ? 'text-xs' : compact ? 'text-sm' : 'text-base'}`}
        >
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
