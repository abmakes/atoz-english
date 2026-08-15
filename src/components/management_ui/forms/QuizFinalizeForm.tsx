'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import type { QuizSetupData, Question, QuizSettingsData } from '@/components/management_ui/QuizEditor';
import { useCustomToast } from '@/components/ui/CustomToast';
import { Badge } from '@/components/ui/badge';

interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const AVAILABLE_POWER_UPS: PowerUp[] = [
  { id: 'fiftyFifty', name: '50/50', description: 'Removes two wrong answers.', icon: '❓' },
  { id: 'doublePoints', name: '2× Points', description: 'Double points for this question.', icon: '2️⃣' },
  { id: 'timeExtension', name: 'Extra Time', description: 'Adds time to the timer.', icon: '⏱️' },
  { id: 'comeback', name: 'Comeback', description: 'Bonus for the trailing team.', icon: '⏭️' },
];

const THEME_OPTIONS = [
  { id: 'default', label: 'Default (Clouds)' },
  { id: 'forest', label: 'Forest' },
  { id: 'dark', label: 'Dark Mode' },
] as const;

interface QuizFinalizeFormProps {
  quizSetupData: QuizSetupData;
  questionsList: Question[];
  initialQuizSettings: QuizSettingsData;
  onFinalize: (finalizedData: {
    quizSetup: QuizSetupData;
    questions: Question[];
    settings: QuizSettingsData;
  }) => Promise<void>;
  onGoBackToContent: () => void;
  isPublishing?: boolean;
  publishStatusMessage?: string;
}

function themePreviewColors(theme: string | undefined) {
  if (theme === 'forest') {
    return {
      panel: '#f0fff4',
      text: '#14532d',
      answer: 'bg-green-100 text-green-800 border-green-300',
      colors: ['bg-green-700', 'bg-green-500', 'bg-yellow-600', 'bg-lime-300'],
    };
  }
  if (theme === 'dark') {
    return {
      panel: '#334155',
      text: '#ffffff',
      answer: 'bg-slate-700 text-slate-100 border-slate-600',
      colors: ['bg-gray-800', 'bg-gray-600', 'bg-purple-500', 'bg-teal-400'],
    };
  }
  return {
    panel: '#e0f2fe',
    text: 'var(--text-color)',
    answer: 'bg-sky-100 text-sky-800 border-sky-300',
    colors: ['bg-sky-500', 'bg-sky-300', 'bg-white', 'bg-slate-200'],
  };
}

function ThemeSwatches({
  colors,
  size = 'md',
}: {
  colors: string[];
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {colors.map((color) => (
        <span
          key={color}
          className={`${dim} rounded-full border border-slate-300 shadow-inner ${color}`}
        />
      ))}
    </span>
  );
}

export default function QuizFinalizeForm({
  quizSetupData,
  questionsList,
  initialQuizSettings,
  onFinalize,
  onGoBackToContent,
  isPublishing = false,
  publishStatusMessage,
}: QuizFinalizeFormProps) {
  const { addToast } = useCustomToast();
  const [currentTheme, setCurrentTheme] = useState<string | undefined>(
    initialQuizSettings.theme ?? 'default'
  );
  const [selectedPowerUps, setSelectedPowerUps] = useState<string[]>(
    initialQuizSettings.powerUps || []
  );
  const [gameMode, setGameMode] = useState<QuizSettingsData['gameMode']>(
    initialQuizSettings.gameMode ?? 'basic'
  );
  const [guessOptions, setGuessOptions] = useState<string>(
    initialQuizSettings.guessOptions ?? 'zero'
  );
  const [music, setMusic] = useState<boolean>(initialQuizSettings.music ?? true);
  const [soundEffects, setSoundEffects] = useState<boolean>(
    initialQuizSettings.soundEffects ?? true
  );
  const [currentPreviewQuestionIndex, setCurrentPreviewQuestionIndex] = useState(0);
  const [timeLimit, setTimeLimit] = useState<string>(
    initialQuizSettings.timeLimit ?? 'fifteen'
  );

  const togglePowerUp = (powerUpId: string) => {
    setSelectedPowerUps((prev) =>
      prev.includes(powerUpId)
        ? prev.filter((id) => id !== powerUpId)
        : [...prev, powerUpId]
    );
  };

  const handlePublish = async () => {
    if (isPublishing) return;
    try {
      await onFinalize({
        quizSetup: quizSetupData,
        questions: questionsList,
        settings: {
          theme: currentTheme,
          powerUps: selectedPowerUps,
          gameMode,
          guessOptions,
          timeLimit,
          music,
          soundEffects,
        },
      });
    } catch (error) {
      console.error('Failed to publish quiz:', error);
      addToast('Failed to publish quiz. Please try again.', {
        variant: 'error',
        position: 'top-center',
      });
    }
  };

  const previewQuestion = questionsList[currentPreviewQuestionIndex];
  const themeColors = useMemo(
    () => themePreviewColors(currentTheme),
    [currentTheme]
  );
  const themeLabel =
    THEME_OPTIONS.find((option) => option.id === currentTheme)?.label ||
    'Select a theme';

  return (
    <Card className="mx-auto flex w-full max-w-screen-lg flex-col gap-5 grandstander rounded-lg border border-[--border-dark] bg-[--background] p-4 text-[--text-color] shadow-[4px_4px_0px_0px_var(--border-dark)] md:p-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={isPublishing}
          onClick={onGoBackToContent}
          className="flex h-12 items-center gap-2 border border-[--border-dark] bg-[--background] px-6 text-lg font-semibold text-[--text-color] shadow-[4px_4px_0px_0px_var(--border-dark)] hover:bg-teal-50 hover:border-[--border-dark] hover:shadow-[4px_6px_0px_0px_var(--border-dark)] hover:scale-105 transition-all duration-300"
        >
          <ArrowLeft className="-mt-0.5 h-5 w-5" />
          Back to Edit Quiz
        </Button>

        <Button
          variant="default"
          disabled={isPublishing}
          onClick={() => void handlePublish()}
          className="flex h-12 items-center gap-2 border border-[#1F6E91] bg-[--text-color] px-6 text-lg font-semibold text-white shadow-[4px_4px_0px_0px_#1F6E91] hover:bg-white hover:border-[#1F6E91] hover:shadow-[4px_6px_0px_0px_#1F6E91] hover:scale-105 hover:text-[--text-color] transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100"
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Publishing…
            </>
          ) : (
            <>
              Publish Quiz Now <ArrowRight className="-mt-0.5 h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      {isPublishing && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-violet-300 bg-violet-50 px-4 py-3 text-sm text-violet-950">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-700" />
          <div>
            <p className="font-semibold">Publishing your quiz</p>
            <p className="text-violet-800">
              {publishStatusMessage || 'Please wait — this can take a moment.'}
            </p>
          </div>
        </div>
      )}

      {/* Quiz summary */}
      <div className="grid grid-cols-1 gap-4 rounded-lg border-2 border-slate-200 bg-white p-4 md:grid-cols-3">
        <div className="overflow-hidden rounded-md border border-[--border-light] md:col-span-1">
          <Image
            src={
              quizSetupData.coverImageFile
                ? URL.createObjectURL(quizSetupData.coverImageFile)
                : quizSetupData.coverImageUrl
            }
            alt={quizSetupData.title || 'Quiz cover'}
            width={320}
            height={180}
            className="aspect-[16/9] h-auto w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center gap-2 md:col-span-2">
          <CardTitle className="text-2xl text-[--text-color]">
            {quizSetupData.title}
          </CardTitle>
          {quizSetupData.description ? (
            <CardDescription className="text-sm text-slate-700">
              {quizSetupData.description}
            </CardDescription>
          ) : null}
          <p className="text-sm">
            <strong>{questionsList.length}</strong> questions
          </p>
          {quizSetupData.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {quizSetupData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="border-[--primary-accent] text-sm shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Power-ups + question preview / theme */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border-2 border-slate-200 bg-white p-4">
          <div>
            <h3 className="text-base font-semibold">Power-ups</h3>
            <p className="text-xs text-slate-600">Toggle what players can use.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_POWER_UPS.map((pu) => {
              const selected = selectedPowerUps.includes(pu.id);
              return (
                <button
                  key={pu.id}
                  type="button"
                  disabled={isPublishing}
                  title={pu.description}
                  onClick={() => togglePowerUp(pu.id)}
                  className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-center transition-colors ${
                    selected
                      ? 'border-violet-600 bg-violet-200 text-[--text-color] shadow-[2px_2px_0px_0px_var(--border-dark)]'
                      : 'border-[--border-dark] bg-white text-[--text-color] shadow-[2px_2px_0px_0px_var(--border-dark)] hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {pu.icon}
                  </span>
                  <span className="text-sm font-semibold">{pu.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border-2 border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold">Question preview</h3>
            {questionsList.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPreviewQuestionIndex === 0}
                  onClick={() =>
                    setCurrentPreviewQuestionIndex((prev) => Math.max(0, prev - 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-12 text-center text-xs text-slate-600">
                  {Math.min(currentPreviewQuestionIndex + 1, questionsList.length)}/
                  {questionsList.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={
                    currentPreviewQuestionIndex >= questionsList.length - 1
                  }
                  onClick={() =>
                    setCurrentPreviewQuestionIndex((prev) =>
                      Math.min(questionsList.length - 1, prev + 1)
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {previewQuestion ? (
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: themeColors.panel }}
            >
              {previewQuestion.imageUrl &&
                previewQuestion.imageUrl !== '/images/placeholder.webp' && (
                  <div className="relative mb-3 h-28 w-full overflow-hidden rounded-md border border-slate-300 bg-white/50">
                    <Image
                      src={previewQuestion.imageUrl}
                      alt={previewQuestion.question}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              <p
                className="mb-3 text-center text-base font-semibold"
                style={{ color: themeColors.text }}
              >
                {previewQuestion.question || 'Untitled question'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {previewQuestion.answers.map((answer, index) => (
                  <p
                    key={`${previewQuestion.question}-${index}`}
                    className={`rounded-md border-2 p-2 text-center text-sm ${themeColors.answer}`}
                  >
                    {answer || `Answer ${index + 1}`}
                  </p>
                ))}
                {Array(Math.max(0, 4 - previewQuestion.answers.length))
                  .fill(null)
                  .map((_, index) => (
                    <p
                      key={`ph-${index}`}
                      className={`rounded-md border-2 border-dashed p-2 text-center text-sm opacity-50 ${themeColors.answer}`}
                    >
                      —
                    </p>
                  ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No questions to preview.</p>
          )}

          <Select
            value={currentTheme}
            onValueChange={setCurrentTheme}
            disabled={isPublishing}
          >
            <SelectTrigger className="w-full border border-[--border-dark] bg-white px-3 font-semibold text-[--text-color] shadow-[2px_2px_0px_0px_var(--border-dark)]">
              <span className="flex items-center gap-2 truncate">
                <ThemeSwatches colors={themeColors.colors} size="sm" />
                <span className="truncate">{themeLabel}</span>
              </span>
            </SelectTrigger>
            <SelectContent className="border border-[--border-dark] bg-white font-semibold text-[--text-color] shadow-[2px_2px_0px_0px_var(--border-dark)]">
              {THEME_OPTIONS.map((option) => {
                const swatches = themePreviewColors(option.id).colors;
                return (
                  <SelectItem
                    key={option.id}
                    value={option.id}
                    className="pl-2 focus:bg-[--primary-light]"
                  >
                    <span className="flex items-center gap-2">
                      <ThemeSwatches colors={swatches} size="sm" />
                      {option.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Game settings — always visible, 4 cols → 2 on smaller screens */}
      <div className="space-y-3 rounded-lg border-2 border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold">Game settings</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="mb-2 block text-sm font-semibold">Game mode</Label>
            <RadioGroup
              value={gameMode}
              onValueChange={(val) =>
                setGameMode(val as QuizSettingsData['gameMode'])
              }
              className="flex flex-col gap-1.5"
              disabled={isPublishing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="basic" id="basic" />
                <Label htmlFor="basic" className="font-normal">
                  Basic scoring
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="boosted" id="boosted" />
                <Label htmlFor="boosted" className="font-normal">
                  Boosted (time-based)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold">Time limit</Label>
            <RadioGroup
              value={timeLimit}
              onValueChange={setTimeLimit}
              className="flex flex-col gap-1.5"
              disabled={isPublishing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ten" id="ten" />
                <Label htmlFor="ten" className="font-normal">
                  10 seconds
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fifteen" id="fifteen" />
                <Label htmlFor="fifteen" className="font-normal">
                  15 seconds
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="twenty" id="twenty" />
                <Label htmlFor="twenty" className="font-normal">
                  20 seconds
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold">
              Limited guesses
            </Label>
            <RadioGroup
              value={guessOptions}
              onValueChange={setGuessOptions}
              className="flex flex-col gap-1.5"
              disabled={isPublishing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zero" id="guess-0" />
                <Label htmlFor="guess-0" className="font-normal">
                  Unlimited
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one" id="guess-1" />
                <Label htmlFor="guess-1" className="font-normal">
                  One
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="three" id="guess-3" />
                <Label htmlFor="guess-3" className="font-normal">
                  Three
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="five" id="guess-5" />
                <Label htmlFor="guess-5" className="font-normal">
                  Five
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold">Audio</Label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center space-x-3">
                <Switch
                  id="music-mode"
                  checked={music}
                  onCheckedChange={setMusic}
                  disabled={isPublishing}
                />
                <Label htmlFor="music-mode" className="font-normal">
                  Music
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  id="sfx-mode"
                  checked={soundEffects}
                  onCheckedChange={setSoundEffects}
                  disabled={isPublishing}
                />
                <Label htmlFor="sfx-mode" className="font-normal">
                  Sound effects
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
