'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import type { QuizSetupData, Question, QuizSettingsData } from '@/components/management_ui/QuizEditor';
import { useCustomToast } from '@/components/ui/CustomToast';
import { Badge } from '@/components/ui/badge';

// Define a type for PowerUp for local use, can be expanded
interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string; // Placeholder for icon path or component
}

// Placeholder power-up data
const AVAILABLE_POWER_UPS: PowerUp[] = [
  { id: 'fiftyFifty', name: '50/50', description: 'Removes two incorrect answers.', icon: '❓' },
  { id: 'doublePoints', name: 'Double Points', description: 'Doubles points earned for this question.', icon: '2️✖️' },
  { id: 'timeExtension', name: 'Extra Time', description: 'Adds 30 seconds to the timer.', icon: '⏱️' },
  { id: 'comeback', name: 'Comeback', description: 'Bonus points for the team that is behind for one minute.', icon: '⏭️' },
];

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
}

export default function QuizFinalizeForm({
  quizSetupData,
  questionsList,
  initialQuizSettings,
  onFinalize,
  onGoBackToContent
}: QuizFinalizeFormProps) {
  const { addToast } = useCustomToast();
  const [currentTheme, setCurrentTheme] = useState<string | undefined>(initialQuizSettings.theme);
  const [selectedPowerUps, setSelectedPowerUps] = useState<string[]>(initialQuizSettings.powerUps || []);
  const [gameMode, setGameMode] = useState<QuizSettingsData['gameMode']>(initialQuizSettings.gameMode ?? 'basic');
  const [guessOptions, setGuessOptions] = useState<string>(initialQuizSettings.guessOptions ?? 'zero');
  const [music, setMusic] = useState<boolean>(initialQuizSettings.music ?? true);
  const [soundEffects, setSoundEffects] = useState<boolean>(initialQuizSettings.soundEffects ?? true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [currentPreviewQuestionIndex, setCurrentPreviewQuestionIndex] = useState(0);
  const [timeLimit, setTimeLimit] = useState<string>(initialQuizSettings.timeLimit ?? 'ten');


  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
  };

  const togglePowerUp = (powerUpId: string) => {
    setSelectedPowerUps(prev =>
      prev.includes(powerUpId) ? prev.filter(id => id !== powerUpId) : [...prev, powerUpId]
    );
  };

  const handlePublish = async () => {
    try {
      await onFinalize({
        quizSetup: quizSetupData,
        questions: questionsList,
        settings: {
          theme: currentTheme,
          powerUps: selectedPowerUps,
          gameMode: gameMode,
          guessOptions: guessOptions,
          timeLimit: timeLimit,
          music: music,
          soundEffects: soundEffects,
        },
      });

    } catch (error) {
      console.error("Failed to publish quiz:", error);
      addToast("Failed to publish quiz. Please try again.", { variant: 'error', position: 'top-center' });
    }
  };
  
  const currentPreviewQuestion = questionsList[currentPreviewQuestionIndex];

  // Placeholder for theme color preview - this would need actual color values based on theme
  const ThemeColorPreview = () => {
    // Example: Hardcoded colors for demonstration
    let colors: string[] = [];
    if (currentTheme === 'forest') {
      colors = ['bg-green-700', 'bg-green-500', 'bg-yellow-600', 'bg-lime-300'];
    } else if (currentTheme === 'dark') {
      colors = ['bg-gray-800', 'bg-gray-600', 'bg-purple-500', 'bg-teal-400'];
    } else { // default
      colors = ['bg-sky-500', 'bg-sky-300', 'bg-white', 'bg-slate-200'];
    }
    return (
      <div className="flex w-full gap-2 p-1 items-center border border-[--border-light] rounded-md bg-slate-50 shadow-sm">
        {colors.map((color, index) => (
          <div key={index} className={`w-8 h-8 rounded-full ${color} border border-slate-300 shadow-inner`}></div>
        ))}
        <span className="text-sm text-gray-600 ml-2 capitalize">{currentTheme || 'Default'} Theme Colors</span>
      </div>
    );
  };


  return (
    <Card className="flex flex-col gap-4 max-w-screen-lg mx-auto w-full grandstander text-[--text-color] p-2 md:p-6 bg-[--background] border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)] rounded-lg">

      <div className='flex w-full justify-between px-4 gap-4'>
        <Button 
          variant="outline" 
          onClick={onGoBackToContent}
            className="flex items-center h-full pt-2 pb-1 px-6 text-lg font-semibold border border-[--border-dark] gap-2 bg-[--background] text-[--text-color] shadow-[4px_4px_0px_0px_var(--border-dark)] hover:bg-teal-50 hover:border-[--border-dark] hover:shadow-[4px_6px_0px_0px_var(--border-dark)] hover:scale-105 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2 -mt-0.5" />
            Back to Edit Quiz
        </Button>   

        <Button 
          variant="default" 
          onClick={handlePublish}
            className="flex items-center text-lg pt-2 pb-1 px-6 font-semibold border border-[#1F6E91] gap-2 bg-[--text-color] text-white shadow-[4px_4px_0px_0px_#1F6E91] hover:bg-white hover:border-[#1F6E91] hover:shadow-[4px_6px_0px_0px_#1F6E91] hover:scale-105 hover:text-[--text-color] transition-all duration-300"
        >
          Publish Quiz Now <ArrowRight className="w-5 h-5 ml-2 -mt-0.5" />
        </Button>
      </div>

      {/* Quiz Details Section */}
      <div className='w-full flex'>
        <CardHeader className="basis-1/3 p-4">
            <div className="flex aspect-[16/9] rounded-md overflow-hidden border border-[--border-light]">
              <Image 
              src={quizSetupData.coverImageFile ? URL.createObjectURL(quizSetupData.coverImageFile) : quizSetupData.coverImageUrl} 
              alt={quizSetupData.title || "Quiz cover"} 
              width={240}
              height={160}
              className='rounded-lg w-full h-auto object-cover aspect-[16/9]'
            />
            </div>
        </CardHeader>
        <CardContent className="p-4 basis-2/3 flex items-center gap-4 justify-center">
          <div className="flex flex-col gap-2 text-sm">
            <CardTitle className="text-2xl mb-0 text-[--text-color]">{quizSetupData.title}</CardTitle>
            {quizSetupData.description && <CardDescription className="text-[--text-color]"><strong>Description:</strong> {quizSetupData.description}</CardDescription>}
            <p><strong>Type:</strong> <span className="font-normal capitalize">{quizSetupData.quizType.replace(/_/g, ' ')}</span></p>
            <p><strong>Questions:</strong> <span className="font-normal">{questionsList.length}</span></p>
            {quizSetupData.tags && quizSetupData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <strong>Tags:</strong>
                {quizSetupData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer text-sm transition-all text-nowrap duration-150 border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)] ease-in-out hover:shadow-md">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Theme Selection & Color Preview Section */}
      <CardContent className="w-full">
          <div className="flex flex-col gap-4">
              <div className="flex-1 w-full sm:w-auto">
                  <label htmlFor="quiz-theme" className="text-lg font-semibold text-[--text-color] mb-1 block">Choose Default Quiz Theme</label>
                  <p className="text-sm text-gray-600 mb-2">Users can still change the theme before starting the quiz.</p>
                  <div className="flex w-full gap-4 mt-2">
                    <Select value={currentTheme} onValueChange={handleThemeChange}>
                        <SelectTrigger className="flex px-6 max-w-64 bg-white text-[--text-color] font-semibold border border-[--border-dark] shadow-[2px_2px_0px_0px_var(--border-dark)] focus:ring-2 focus:ring-[--primary-accent]">
                            <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-[--text-color] font-semibold border border-[--border-dark] shadow-[2px_2px_0px_0px_var(--border-dark)]">
                            <SelectItem value="default" className="hover:bg-[--primary-light] focus:bg-[--primary-light]">Default (Clouds)</SelectItem>
                            <SelectItem value="forest" className="hover:bg-[--primary-light] focus:bg-[--primary-light]">Forest</SelectItem>
                            <SelectItem value="dark" className="hover:bg-[--primary-light] focus:bg-[--primary-light]">Dark Mode</SelectItem>
                        </SelectContent>
                    </Select>
                    <ThemeColorPreview />
                  </div>
              </div>
              <div className="flex w-full justify-start items-center">
                <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
                    <DialogTrigger asChild>  
                        <Button variant="outline"
                          className="flex items-center text-lg pt-2 pb-1 px-6 font-semibold border border-[#1F6E91] gap-2 bg-[--text-color] text-white shadow-[4px_4px_0px_0px_#1F6E91] hover:bg-white hover:border-[#1F6E91] hover:shadow-[4px_6px_0px_0px_#1F6E91] hover:scale-105 hover:text-[--text-color] transition-all duration-300"
                        >
                            Preview Question Layout
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-[600px] bg-white grandstander text-[--text-color] border-[--border-dark] shadow-[6px_6px_0px_0px_var(--border-dark)] rounded-lg">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Question Preview ({currentPreviewQuestionIndex + 1}/{questionsList.length})</DialogTitle>
                            <DialogDescription>
                                This is a simplified preview of how a question might look with the selected theme.
                            </DialogDescription>
                        </DialogHeader>
                        {currentPreviewQuestion && (
                            <div className="my-4 p-4 rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#334155' : (currentTheme === 'forest' ? '#f0fff4' : '#e0f2fe')}}>
                                {currentPreviewQuestion.imageUrl && currentPreviewQuestion.imageUrl !== '/images/placeholder.webp' && (
                                    <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden border border-slate-300">
                                        <Image src={currentPreviewQuestion.imageUrl} alt={currentPreviewQuestion.question} fill style={{objectFit: 'contain'}}/>
                                    </div>
                                )}
                                <p className={`font-semibold text-2xl text-center mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-[--text-color]'}`}>{currentPreviewQuestion.question}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {currentPreviewQuestion.answers.map((answer, index) => (
                                        <p key={index} className={`p-3 rounded-md border-2 text-center text-lg ${
                                            currentTheme === 'dark' ? 'bg-slate-700 text-slate-100 border-slate-600' : 
                                            currentTheme === 'forest' ? 'bg-green-100 text-green-800 border-green-300' :
                                            'bg-sky-100 text-sky-800 border-sky-300'
                                        }`}>{answer}</p>
                                    ))}
                                    {/* Fill remaining answer slots for consistent grid */}
                                    {Array(Math.max(0, 4 - currentPreviewQuestion.answers.length)).fill(null).map((_, index) => (
                                        <p key={`placeholder-preview-${index}`} className={`p-3 rounded-md border-2 text-center text-lg ${
                                            currentTheme === 'dark' ? 'bg-slate-800 text-slate-500 border-slate-700' :
                                            currentTheme === 'forest' ? 'bg-green-50 text-green-400 border-green-200' :
                                            'bg-sky-50 text-sky-400 border-sky-200'
                                        }`}>Answer Placeholder</p>
                                    ))}
                                </div>
                            </div>
                        )}
                        <DialogFooter className="sm:justify-between gap-2 mt-2">
                            <div className="flex gap-2">
                                <Button 
                                    variant='outline' 
                                    onClick={() => setCurrentPreviewQuestionIndex(prev => Math.max(0, prev - 1))} 
                                    disabled={currentPreviewQuestionIndex === 0}
                                    className="bg-white text-[--text-color] border-2 border-[--border-dark] shadow-[2px_2px_0px_0px_var(--border-dark)] hover:bg-slate-100"
                                >
                                    Previous
                                </Button>
                                <Button 
                                    variant='outline' 
                                    onClick={() => setCurrentPreviewQuestionIndex(prev => Math.min(questionsList.length - 1, prev + 1))} 
                                    disabled={currentPreviewQuestionIndex === questionsList.length - 1 || questionsList.length === 0}
                                    className="bg-white text-[--text-color] border-2 border-[--border-dark] shadow-[2px_2px_0px_0px_var(--border-dark)] hover:bg-slate-100"
                                >
                                    Next
                                </Button>
                            </div>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-300">
                                    Close Preview
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>     
              </div>
          </div>
      </CardContent>  
      
      {/* Game Mechanics Section */}
      <CardContent className="grandstander p-4">
        <h3 className="text-lg font-semibold text-[--text-color]">Game Mechanics</h3>
        <p className="text-sm text-gray-600 mb-4">Set the default rules for how the game is played.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Game Mode */}
          <div>
            <Label className="text-md font-semibold text-[--text-color] mb-2 block">Game Mode</Label>
            <RadioGroup value={gameMode} onValueChange={(val) => setGameMode(val as QuizSettingsData['gameMode'])} className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="basic" id="basic" />
                <Label htmlFor="basic">Basic Scoring</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="boosted" id="boosted" />
                <Label htmlFor="boosted">Boosted (Time-based Scoring)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Time Limit */}
          <div>
            <Label className="text-md font-semibold text-[--text-color] mb-2 block">Time Limit</Label>
            <RadioGroup value={timeLimit} onValueChange={(val) => setTimeLimit(val)} className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ten" id="ten" />
                <Label htmlFor="10">10 Seconds</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fifteen" id="15" />
                <Label htmlFor="15">15 Seconds</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="twenty" id="20" />
                <Label htmlFor="20">20 Seconds</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Guess Options */}
          <div>
            <Label className="text-md font-semibold text-[--text-color] mb-2 block">Limited Guesses</Label>
            <RadioGroup value={guessOptions} onValueChange={(val) => setGuessOptions(val)} className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zero" id="0" />
                <Label htmlFor="0">Unlimited Guesses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one" id="1" />
                <Label htmlFor="1">One</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="three" id="3" />
                <Label htmlFor="3">Three</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="five" id="5" />
                <Label htmlFor="5">Five</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Audio Options */}
          <div>
            <Label className="text-md font-semibold text-[--text-color] mb-3 block">Audio Settings</Label>
            <div className="flex flex-col gap-4">
              <div className="flex items-center space-x-3">
                <Switch id="music-mode" checked={music} onCheckedChange={setMusic} />
                <Label htmlFor="music-mode">Music (On/Off)</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Switch id="sfx-mode" checked={soundEffects} onCheckedChange={setSoundEffects} />
                <Label htmlFor="sfx-mode">Sound Effects (On/Off)</Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Power-ups Selection Section */}
      <CardContent className="grandstander p-4">
        <h3 className="text-lg font-semibold text-[--text-color]">Select Power-ups</h3>
        <p className="text-sm text-gray-600 mb-2">Choose power-ups that players can use during the quiz.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AVAILABLE_POWER_UPS.map(pu => (
            <Button
              key={pu.id}
              variant="outline"
              onClick={() => togglePowerUp(pu.id)}
              className={`p-4 h-auto flex flex-col border items-center justify-center gap-2 text-center transition-all duration-200 ease-in-out transform hover:scale-105 rounded-lg
                          ${selectedPowerUps.includes(pu.id) 
                              ? 'bg-violet-200 text-[--text-color] shadow-[2px_2px_0px_0px_var(--border-dark)]' 
                              : 'bg-white text-[--text-color] border-[--border-dark] shadow-[2px_2px_0px_0px_var(--border-dark)]'
                          }`}
            >
              <span className="text-3xl">{pu.icon}</span>
              <span className="font-semibold text-md">{pu.name}</span>
              <span className="flex w-full text-xs text-wrap font-normal opacity-80">{pu.description}</span>
            </Button>
          ))}
        </div>
      </CardContent>

      <div className="flex gap-4 w-full">
      {/* Action Buttons: Preview & Publish */}

      </div>
      </Card>
  );
} 