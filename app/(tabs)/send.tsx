import * as Clipboard from 'expo-clipboard';
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

export default function SendScreen() {
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

  const copyMessage = async () => {
    await Clipboard.setStringAsync(message);
    setFeedback('Nachricht kopiert.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-cream flex-1"
    >
      <PastelBackdrop />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="p-safe-or-4 flex-grow"
        showsVerticalScrollIndicator={false}
      >
        <View className="web:py-8 mx-auto w-full max-w-2xl flex-1 py-2">
          <Text className="text-muted mb-3 text-center text-[11px] font-semibold tracking-[3px]">
            TO MAKE SOMEONE SMILE
          </Text>
          <StepHeader step={step} />
          <View className="bg-card/90 web:mt-5 web:p-9 mt-3 overflow-hidden rounded-[32px] border border-white/80 p-5 shadow-sm">
            {step === 1 ? (
              <View>
                <Text className="text-foreground web:text-5xl text-3xl leading-tight font-bold">
                  Für wen?
                </Text>
                <Text className="text-muted mt-2 text-base leading-6">
                  Wem möchtest du heute ein Lächeln schenken?
                </Text>
                <TextField className="web:mt-7 mt-5">
                  <Input
                    value={name}
                    onChangeText={setName}
                    placeholder="Name, z. B. Mia"
                    autoCapitalize="words"
                    returnKeyType="done"
                    className="bg-background h-14 rounded-full px-5 text-base"
                  />
                </TextField>
                <Text className="text-foreground web:mt-7 mt-5 mb-3 text-sm font-semibold">
                  Was ist dein Anlass?
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {REASONS.map((reason) => {
                    const Icon = reason.icon;
                    const selected = reason.id === reasonId;
                    return (
                      <GesturePressable
                        key={reason.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setReasonId(reason.id)}
                        className={`web:min-h-28 web:flex-col web:items-stretch web:justify-between web:p-3 min-h-16 w-[47%] flex-grow flex-row items-center rounded-[20px] border p-2.5 ${reason.className} ${selected ? 'border-foreground' : 'border-white/60'}`}
                      >
                        <View className="web:size-9 size-8 shrink-0 items-center justify-center rounded-full bg-white/65">
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
                <Text className="text-foreground web:text-5xl mt-4 text-3xl leading-tight font-bold">
                  Was soll {name.trim()} wissen?
                </Text>
                <Text className="text-muted mt-2 text-base leading-6">
                  Schreib einfach frei heraus. Stichpunkte reichen völlig.
                </Text>
                <TextField className="web:mt-7 mt-5">
                  <TextArea
                    value={details}
                    onChangeText={setDetails}
                    placeholder="Zum Beispiel: Danke, dass du immer zuhörst …"
                    autoFocus
                    maxLength={900}
                    className="bg-background web:min-h-44 min-h-36 rounded-[24px] px-5 py-4 text-base leading-6"
                  />
                </TextField>
                <Text className="text-muted mt-2 text-right text-xs">{details.length}/900</Text>
                <View className="bg-sun/55 web:mt-5 mt-3 flex-row items-center rounded-[20px] p-3.5">
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
                <View className="web:mt-7 mt-5 gap-3">
                  <Button
                    variant="primary"
                    onPress={() =>
                      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`)
                    }
                    className="h-14 rounded-full"
                  >
                    <MessageCircleHeart size={20} color={accentForeground} />
                    <Button.Label className="font-semibold">Über WhatsApp senden</Button.Label>
                  </Button>
                  <View className="flex-row gap-3">
                    <Button
                      variant="secondary"
                      onPress={() =>
                        Share.share({ message, title: `Eine Nachricht für ${name.trim()}` })
                      }
                      className="h-13 flex-1 rounded-full"
                    >
                      <Share2 size={19} color={foreground} />
                      <Button.Label>Teilen</Button.Label>
                    </Button>
                    <Button
                      variant="secondary"
                      onPress={copyMessage}
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
              <View className="web:mt-8 mt-5 flex-row gap-3">
                {step > 1 ? (
                  <Button
                    variant="secondary"
                    isIconOnly
                    onPress={() => setStep(1)}
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
          <Text className="text-muted web:mt-5 mt-3 text-center text-xs leading-4">
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
    <View className="border-border/70 bg-card/80 flex-row items-center rounded-full border p-2">
      <View className="bg-foreground web:size-11 size-10 items-center justify-center rounded-full">
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
