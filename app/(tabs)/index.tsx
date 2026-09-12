import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
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
import { Button, Input, Spinner, TextArea, TextField, useThemeColor } from 'heroui-native';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';

import { GesturePressable } from '@/components/ui/primitives/GesturePressable';
import { bilt } from '@/lib/bilt';

type Reason = {
  id: string;
  label: string;
  prompt: string;
  className: string;
  icon: typeof Heart;
};

type ImproveResponse = { message?: string };

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

const TOTAL_STEPS = 3;

export default function Home() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [foreground, accentForeground] = useThemeColor(['foreground', 'accent-foreground']);

  const selectedReason = useMemo(
    () => REASONS.find((reason) => reason.id === reasonId),
    [reasonId],
  );

  const canContinue =
    step === 1 ? name.trim().length > 0 && Boolean(reasonId) : details.trim().length > 0;

  const baseMessage = useMemo(() => {
    const greeting = `Hey ${name.trim()},`;
    return `${greeting}\n\n${details.trim()}\n\nIch wollte dir das einfach mal sagen.`;
  }, [details, name]);

  const goForward = () => {
    setFeedback('');
    if (step === 2) {
      setMessage(baseMessage);
      setStep(3);
      return;
    }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const goBack = () => {
    setFeedback('');
    setStep((current) => Math.max(1, current - 1));
  };

  const improveMessage = async () => {
    if (!selectedReason || !details.trim()) return;
    setIsImproving(true);
    setFeedback('');

    const { data, error } = await bilt.functions.invoke<ImproveResponse>('improve-smile-message', {
      body: {
        name: name.trim(),
        reason: selectedReason.prompt,
        details: details.trim(),
      },
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

  const copyMessage = async () => {
    await Clipboard.setStringAsync(message);
    setFeedback('Nachricht kopiert.');
  };

  const shareMessage = async () => {
    await Share.share({ message, title: `Eine Nachricht für ${name.trim()}` });
  };

  const shareOnWhatsApp = async () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-cream flex-1"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <PastelBackdrop />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="p-safe-or-5 flex-grow"
        showsVerticalScrollIndicator={false}
      >
        <View className="web:py-8 mx-auto w-full max-w-2xl flex-1 py-4">
          <Text className="text-muted mb-5 text-center text-xs font-semibold tracking-[3px]">
            TO MAKE SOMEONE SMILE
          </Text>

          <StepHeader step={step} />

          <View className="bg-card/90 web:p-9 mt-5 overflow-hidden rounded-[36px] border border-white/80 p-6 shadow-sm">
            {step === 1 ? (
              <RecipientStep
                name={name}
                onNameChange={setName}
                reasonId={reasonId}
                onReasonChange={setReasonId}
                foreground={foreground}
              />
            ) : null}

            {step === 2 ? (
              <DetailsStep
                name={name}
                reason={selectedReason?.label ?? ''}
                details={details}
                onDetailsChange={setDetails}
              />
            ) : null}

            {step === 3 ? (
              <ResultStep
                name={name}
                message={message}
                onMessageChange={setMessage}
                onImprove={improveMessage}
                isImproving={isImproving}
                feedback={feedback}
                foreground={foreground}
                accentForeground={accentForeground}
                onWhatsApp={shareOnWhatsApp}
                onShare={shareMessage}
                onCopy={copyMessage}
              />
            ) : null}

            {step < 3 ? (
              <View className="mt-8 flex-row gap-3">
                {step > 1 ? (
                  <Button
                    variant="secondary"
                    isIconOnly
                    onPress={goBack}
                    className="size-14 rounded-full"
                  >
                    <ArrowLeft size={21} color={foreground} />
                  </Button>
                ) : null}
                <Button
                  variant="primary"
                  isDisabled={!canContinue}
                  onPress={goForward}
                  className="h-14 flex-1 rounded-full"
                >
                  <Button.Label className="font-semibold">Weiter</Button.Label>
                  <ArrowRight size={20} color={accentForeground} />
                </Button>
              </View>
            ) : (
              <Button variant="ghost" onPress={goBack} className="mt-7 self-start rounded-full">
                <ArrowLeft size={18} color={foreground} />
                <Button.Label>Text ändern</Button.Label>
              </Button>
            )}
          </View>

          <Text className="text-muted mt-5 text-center text-sm leading-5">
            Kleine Worte. Große Wirkung.
          </Text>
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

function StepHeader({ step }: { step: number }) {
  const titles = ['Für wen?', 'Was möchtest du sagen?', 'Deine Nachricht'];
  return (
    <View className="border-border/70 bg-card/80 flex-row items-center rounded-full border p-2.5">
      <View className="bg-foreground size-11 items-center justify-center rounded-full">
        <Text className="text-background text-base font-semibold">{step}</Text>
      </View>
      <Text className="text-foreground ml-3 flex-1 text-base font-semibold">
        {titles[step - 1]}
      </Text>
      <View className="mr-2 flex-row gap-2">
        {[1, 2, 3].map((item) => (
          <View
            key={item}
            className={`size-2.5 rounded-full ${item <= step ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </View>
    </View>
  );
}

function RecipientStep({
  name,
  onNameChange,
  reasonId,
  onReasonChange,
  foreground,
}: {
  name: string;
  onNameChange: (value: string) => void;
  reasonId: string;
  onReasonChange: (value: string) => void;
  foreground: string;
}) {
  return (
    <View>
      <Text className="text-foreground web:text-5xl text-4xl leading-tight font-bold">
        Für wen?
      </Text>
      <Text className="text-muted mt-2 text-base leading-6">
        Wem möchtest du heute ein Lächeln schenken?
      </Text>

      <TextField className="mt-7">
        <Input
          value={name}
          onChangeText={onNameChange}
          placeholder="Name, z. B. Mia"
          autoCapitalize="words"
          returnKeyType="done"
          className="bg-background h-14 rounded-full px-5 text-base"
        />
      </TextField>

      <Text className="text-foreground mt-7 mb-3 text-sm font-semibold">Was ist dein Anlass?</Text>
      <View className="flex-row flex-wrap gap-3">
        {REASONS.map((reason) => {
          const Icon = reason.icon;
          const isSelected = reasonId === reason.id;
          return (
            <GesturePressable
              key={reason.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onReasonChange(reason.id)}
              className={`min-h-36 w-[47%] flex-grow justify-between rounded-[28px] border p-4 ${reason.className} ${isSelected ? 'border-foreground' : 'border-white/60'}`}
            >
              <View className="size-10 items-center justify-center rounded-full bg-white/65">
                {isSelected ? (
                  <Check size={20} color={foreground} />
                ) : (
                  <Icon size={20} color={foreground} />
                )}
              </View>
              <Text className="text-foreground mt-5 text-base leading-5 font-semibold">
                {reason.label}
              </Text>
            </GesturePressable>
          );
        })}
      </View>
    </View>
  );
}

function DetailsStep({
  name,
  reason,
  details,
  onDetailsChange,
}: {
  name: string;
  reason: string;
  details: string;
  onDetailsChange: (value: string) => void;
}) {
  return (
    <View>
      <View className="bg-lilac self-start rounded-full px-4 py-2">
        <Text className="text-foreground text-xs font-semibold">{reason}</Text>
      </View>
      <Text className="text-foreground web:text-5xl mt-5 text-4xl leading-tight font-bold">
        Was soll {name.trim()} wissen?
      </Text>
      <Text className="text-muted mt-2 text-base leading-6">
        Schreib einfach frei heraus. Stichpunkte reichen völlig.
      </Text>

      <TextField className="mt-7">
        <TextArea
          value={details}
          onChangeText={onDetailsChange}
          placeholder="Zum Beispiel: Danke, dass du immer zuhörst und selbst an stressigen Tagen für mich da bist …"
          autoFocus
          maxLength={900}
          className="bg-background min-h-44 rounded-[28px] px-5 py-4 text-base leading-6"
        />
      </TextField>
      <Text className="text-muted mt-2 text-right text-xs">{details.length}/900</Text>

      <View className="bg-sun/55 mt-5 flex-row items-center rounded-[24px] p-4">
        <WandSparkles size={20} color="#18283d" />
        <Text className="text-foreground ml-3 flex-1 text-sm leading-5">
          Im nächsten Schritt kannst du deinen Text mit KI wärmer und persönlicher formulieren.
        </Text>
      </View>
    </View>
  );
}

function ResultStep({
  name,
  message,
  onMessageChange,
  onImprove,
  isImproving,
  feedback,
  foreground,
  accentForeground,
  onWhatsApp,
  onShare,
  onCopy,
}: {
  name: string;
  message: string;
  onMessageChange: (value: string) => void;
  onImprove: () => void;
  isImproving: boolean;
  feedback: string;
  foreground: string;
  accentForeground: string;
  onWhatsApp: () => void;
  onShare: () => void;
  onCopy: () => void;
}) {
  return (
    <View>
      <Text className="text-foreground web:text-5xl text-4xl leading-tight font-bold">
        Bereit für {name.trim()}.
      </Text>
      <Text className="text-muted mt-2 text-base leading-6">
        Passe die Nachricht an, bis sie sich wirklich nach dir anhört.
      </Text>

      <TextField className="mt-7">
        <TextArea
          value={message}
          onChangeText={onMessageChange}
          maxLength={1500}
          className="bg-background min-h-56 rounded-[28px] px-5 py-4 text-base leading-6"
        />
      </TextField>

      <Button
        variant="secondary"
        onPress={onImprove}
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

      {feedback ? <Text className="text-muted mt-3 text-sm leading-5">{feedback}</Text> : null}

      <View className="mt-7 gap-3">
        <Button variant="primary" onPress={onWhatsApp} className="h-14 rounded-full">
          <MessageCircleHeart size={20} color={accentForeground} />
          <Button.Label className="font-semibold">Über WhatsApp senden</Button.Label>
        </Button>
        <View className="flex-row gap-3">
          <Button variant="secondary" onPress={onShare} className="h-13 flex-1 rounded-full">
            <Share2 size={19} color={foreground} />
            <Button.Label>Teilen</Button.Label>
          </Button>
          <Button variant="secondary" onPress={onCopy} className="h-13 flex-1 rounded-full">
            <Copy size={19} color={foreground} />
            <Button.Label>Kopieren</Button.Label>
          </Button>
        </View>
      </View>
    </View>
  );
}
