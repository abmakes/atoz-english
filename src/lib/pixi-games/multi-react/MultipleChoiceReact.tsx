import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Application, useApplication, extend, useTick } from '@pixi/react';
import { TextStyle, Text, Container as PixiContainer, Graphics as PixiGraphics } from 'pixi.js';
import { PixiThemeConfig, getThemeConfig } from '@/lib/themes';
import { QuestionData } from '@/types';
import { GameConfig } from '@/lib/pixi-engine/config/GameConfig';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { GAME_EVENTS, GAME_STATE_EVENTS, TIMER_EVENTS, SCORING_EVENTS, AnswerSelectedPayload } from '@/lib/pixi-engine/core/EventTypes';
import { TimerManager, TimerType } from '@/lib/pixi-engine/game/TimerManager';
import { PixiEngine, PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine';
import { GamePhase } from '@/lib/pixi-engine/core/GameStateManager';
import { MultipleChoiceLayoutManager } from './managers/MultipleChoiceLayoutManager';
import { MultipleChoiceDataManager } from './managers/MultipleChoiceDataManager';
import { Timer } from './components/Timer';
import { QuestionDisplay } from './components/QuestionDisplay';
import { AnswerButtonsGrid } from './components/AnswerButtonsGrid';
import { Background } from './components/Background';
import { ScoringManager } from '@/lib/pixi-engine/game/ScoringManager';

// Extend @pixi/react with our Pixi.js components
extend({ Text, Container: PixiContainer, Graphics: PixiGraphics });

export interface AnswerOptionUIData {
  id: string;
  text: string;
  isCorrect: boolean;
  length: number;
}

// Define our internal working answer option interface
interface AnswerOption {
  id: string | number;
  text: string;
  isCorrect: boolean;
}

// Define game state interface
interface MultipleChoiceGameState {
  currentQuestionIndex: number;
  activeTeamIndex: number;
  activeTeam: string | number;
  timerCompleteCount: number;
  hasTriggeredGameOver: boolean;
  phase: GamePhase;
  scores: Record<string | number, number>;
}

interface MultipleChoiceReactProps {
  config: GameConfig;
  managers: PixiEngineManagers;
  onGameOver: (scores: Record<string | number, number>, winner: string | number) => void;
}

const QUESTION_TIMER_ID = 'multipleChoiceQuestionTimer';
const INTER_QUESTION_DELAY = 1000; // 1 second between questions
const ANSWER_FEEDBACK_DELAY = 2000; // 2 seconds to show feedback

export const MultipleChoiceReact: React.FC<MultipleChoiceReactProps> = ({ 
  config, 
  managers, 
  onGameOver 
}) => {
  // Get the Pixi application from context
  const { app } = useApplication();
  
  // Theme config
  const themeConfig = useMemo(() => getThemeConfig(config.theme || 'default'), [config.theme]);
  
  // References and state
  const [gameState, setGameState] = useState<MultipleChoiceGameState>(() => ({
    currentQuestionIndex: 0,
    activeTeamIndex: 0,
    activeTeam: config.teams.length > 0 ? config.teams[0].id : 'unknown',
    timerCompleteCount: 0,
    hasTriggeredGameOver: false,
    phase: GamePhase.LOADING,
    scores: {}
  }));
  
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [answerOptions, setAnswerOptions] = useState<AnswerOptionUIData[]>([]);
  const [timerData, setTimerData] = useState({ remaining: 0, duration: 0 });
  const [answerButtonsEnabled, setAnswerButtonsEnabled] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  // Manager references
  const dataManagerRef = useRef<MultipleChoiceDataManager | null>(null);
  const layoutManagerRef = useRef<MultipleChoiceLayoutManager | null>(null);
  const questionSequencerRef = useRef<any>(null);
  
  // Extract managers from props
  const { 
    eventBus, 
    timerManager, 
    gameStateManager, 
    powerUpManager, 
    scoringManager, 
    assetLoader,
    audioManager,
    storageManager
  } = managers;
  
  // Initialize the Layout Manager
  useEffect(() => {
    const { width, height } = app.screen;
    layoutManagerRef.current = new MultipleChoiceLayoutManager(width, height);
    
    // Handle resize events
    const handleResize = () => {
      if (layoutManagerRef.current) {
        const { width, height } = app.screen;
        layoutManagerRef.current.updateLayout(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [app]);
  
  // Initialize the Data Manager and load game data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!config.quizId) {
          throw new Error("Missing required configuration: quizId");
        }

        // Set initial game phase
        gameStateManager.setPhase(GamePhase.LOADING);
        
        // Create the data manager with the right configuration
        dataManagerRef.current = new MultipleChoiceDataManager(
          config.quizId,
          {
            distributionMode: config.questionHandling?.distributionMode || 'sharedPool',
            randomizeOrder: config.questionHandling?.randomizeOrder || false,
            truncateForFairness: config.questionHandling?.truncateForFairness || false
          },
          assetLoader,
          eventBus
        );
        
        // Load question data
        await dataManagerRef.current.loadData();
        
        // Set up question sequencer based on team configuration
        dataManagerRef.current.initializeSequencer(config.teams.length);
        
        // Initialize team scores in scoring manager
        scoringManager.init(config.teams, config.gameMode);
        
        // Register audio if config includes it
        if (config.audio && config.audio.sounds) {
          config.audio.sounds.forEach(sound => {
            audioManager.registerSound(sound);
          });
        }
        
        // Game is ready to start
        gameStateManager.setPhase(GamePhase.READY);
        setGameState(prev => ({ 
          ...prev, 
          phase: GamePhase.READY 
        }));
        
        // Wait a moment then start gameplay
        setTimeout(() => {
          gameStateManager.setPhase(GamePhase.PLAYING);
          setGameState(prev => ({ 
            ...prev, 
            phase: GamePhase.PLAYING 
          }));
          showNextQuestion();
        }, 1000);
        
        // Emit game ready event
        eventBus.emit(GAME_STATE_EVENTS.GAME_STARTED);
      } catch (error) {
        console.error("Failed to initialize game data:", error);
        triggerGameOver();
      }
    };
    
    loadData();
    
    return () => {
      // Cleanup
      timerManager.stopAllTimers();
      
      if (dataManagerRef.current) {
        // Any specific cleanup for data manager if needed
      }
    };
  }, [config, assetLoader, eventBus, gameStateManager, scoringManager, audioManager, timerManager]);
  
  // Game event listeners
  useEffect(() => {
    const handleTimerComplete = (payload: any) => {
      if (payload.timerId === QUESTION_TIMER_ID) {
        handleTimeUp();
      }
    };
    
    eventBus.on(TIMER_EVENTS.TIMER_COMPLETED, handleTimerComplete);
    
    return () => {
      eventBus.off(TIMER_EVENTS.TIMER_COMPLETED, handleTimerComplete);
    };
  }, [eventBus]);
  
  // Timer tick handler
  useEffect(() => {
    const handleTimerTick = (payload: any) => {
      if (payload.timerId === QUESTION_TIMER_ID) {
        setTimerData({
          remaining: payload.remaining || 0,
          duration: payload.duration || 0
        });
      }
    };
    
    eventBus.on(TIMER_EVENTS.TIMER_TICK, handleTimerTick);
    return () => {
      eventBus.off(TIMER_EVENTS.TIMER_TICK, handleTimerTick);
    };
  }, [eventBus]);
  
  // Track phase changes from the game state manager
  useEffect(() => {
    const handlePhaseChanged = (payload: any) => {
      const { currentPhase } = payload;
      setGameState(prev => ({ ...prev, phase: currentPhase }));
    };
    
    eventBus.on(GAME_STATE_EVENTS.PHASE_CHANGED, handlePhaseChanged);
    return () => {
      eventBus.off(GAME_STATE_EVENTS.PHASE_CHANGED, handlePhaseChanged);
    };
  }, [eventBus]);
  
  // Track score updates
  useEffect(() => {
    const handleScoreUpdated = (payload: any) => {
      const { teamId, currentScore } = payload;
      setGameState(prev => ({
        ...prev,
        scores: { ...prev.scores, [teamId]: currentScore }
      }));
    };
    
    eventBus.on(SCORING_EVENTS.SCORE_UPDATED, handleScoreUpdated);
    return () => {
      eventBus.off(SCORING_EVENTS.SCORE_UPDATED, handleScoreUpdated);
    };
  }, [eventBus]);
  
  // Helper function to convert question data to our internal format
  const processQuestionData = (questionData: QuestionData): AnswerOptionUIData[] => {
    if (!questionData || !questionData.answers) return [];
    
    return questionData.answers.map((answer, index) => {
      // In case 'answers' is an array of strings in QuestionData
      if (typeof answer === 'string') {
        return {
          id: `answer-${index}`, 
          text: answer,
          isCorrect: index === 0, // Assume first answer is correct if string type
          length: answer.length
        };
      }
      
      // Handle case where answers might be objects
      if (typeof answer === 'object' && answer !== null) {
        const ansObj = answer as any;
        return {
          id: String(ansObj.id || `answer-${index}`),
          text: ansObj.text || String(ansObj),
          isCorrect: !!ansObj.isCorrect,
          length: (ansObj.text || String(ansObj)).length
        };
      }
      
      // Fallback for unexpected types
      return {
        id: `answer-${index}`,
        text: String(answer),
        isCorrect: false,
        length: String(answer).length
      };
    });
  };
  
  // Game logic functions
  const showNextQuestion = useCallback(() => {
    if (!dataManagerRef.current) return;
    
    try {
      const nextQuestion = dataManagerRef.current.getNextQuestion();
      if (!nextQuestion) {
        triggerGameOver();
        return;
      }
      
      setQuestion(nextQuestion);
      
      // Extract and process answer options
      const options = processQuestionData(nextQuestion);
      setAnswerOptions(options);
      
      // Reset UI state
      setShowAnswer(false);
      setSelectedAnswer(null);
      setAnswerButtonsEnabled(true);
      
      // Start timer
      startQuestionTimer();
    } catch (error) {
      console.error("Error showing next question:", error);
      triggerGameOver();
    }
  }, []);
  
  const startQuestionTimer = useCallback(() => {
    const durationMs = config.intensityTimeLimit 
      ? config.intensityTimeLimit * 1000
      : 30000; // Default 30 seconds
      
    timerManager.createTimer(
      QUESTION_TIMER_ID,
      durationMs,
      TimerType.COUNTDOWN
    );
    
    timerManager.startTimer(QUESTION_TIMER_ID);
    
    setTimerData({
      remaining: durationMs,
      duration: durationMs
    });
  }, [config.intensityTimeLimit, timerManager]);
  
  const handleAnswerSelected = useCallback((questionId: string, optionId: string) => {
    if (!question || !answerButtonsEnabled) return;
    
    setAnswerButtonsEnabled(false);
    setSelectedAnswer(optionId);
    setShowAnswer(true);
    
    // Stop the timer
    timerManager.pauseTimer(QUESTION_TIMER_ID);
    
    // Find the selected option
    const selectedOption = answerOptions.find(opt => opt.id === optionId);
    if (!selectedOption) return;
    
    // Process answer
    const isCorrect = selectedOption.isCorrect;
    const remainingTimeMs = timerData.remaining;
    
    // Check for power-ups
    const activeTeamId = gameState.activeTeam;
    const scoreMultiplier = powerUpManager.isPowerUpActiveForTarget('double_points', activeTeamId) ? 2 : 1;
    
    // Play sound for correct/incorrect answer
    if (isCorrect) {
      audioManager.play('correct-sound');
    } else {
      audioManager.play('incorrect-sound');
    }
    
    // Emit answer event for rule processing
    const payload: AnswerSelectedPayload = {
      questionId: questionId,
      selectedOptionId: optionId,
      isCorrect,
      teamId: String(activeTeamId),
      remainingTimeMs,
      scoreMultiplier
    };
    
    eventBus.emit(GAME_EVENTS.ANSWER_SELECTED, payload);
    
    // Wait for feedback delay then continue
    setTimeout(() => {
      timerManager.removeTimer(QUESTION_TIMER_ID);
      
      // Check if game is over
      if (dataManagerRef.current?.isSequenceFinished()) {
        triggerGameOver();
        return;
      }
      
      // Move to next team/question
      const nextTeamIndex = (gameState.activeTeamIndex + 1) % config.teams.length;
      const nextTeamId = config.teams[nextTeamIndex].id;
      
      // Update game state manager's active team
      gameStateManager.setActiveTeam(nextTeamId);
      
      setGameState(prev => ({
        ...prev,
        activeTeamIndex: nextTeamIndex,
        activeTeam: nextTeamId
      }));
      
      // Show a transition and then next question
      setTimeout(showNextQuestion, INTER_QUESTION_DELAY);
    }, ANSWER_FEEDBACK_DELAY);
  }, [question, answerOptions, answerButtonsEnabled, timerData, gameState.activeTeam, gameState.activeTeamIndex, config.teams, timerManager, powerUpManager, eventBus, gameStateManager, audioManager]);
  
  const handleTimeUp = useCallback(() => {
    if (!question) return;
    
    setAnswerButtonsEnabled(false);
    setShowAnswer(true);
    
    // Play sound for incorrect answer
    audioManager.play('incorrect-sound');
    
    // Emit answer event for rule processing (incorrect answer)
    const payload: AnswerSelectedPayload = {
      questionId: question.id,
      selectedOptionId: null,
      isCorrect: false,
      teamId: String(gameState.activeTeam),
      remainingTimeMs: 0,
      scoreMultiplier: 1
    };
    
    eventBus.emit(GAME_EVENTS.ANSWER_SELECTED, payload);
    
    // Wait for feedback delay then continue
    setTimeout(() => {
      timerManager.removeTimer(QUESTION_TIMER_ID);
      
      // Check if game is over
      if (dataManagerRef.current?.isSequenceFinished()) {
        triggerGameOver();
        return;
      }
      
      // Move to next team/question
      const nextTeamIndex = (gameState.activeTeamIndex + 1) % config.teams.length;
      const nextTeamId = config.teams[nextTeamIndex].id;
      
      // Update game state manager's active team
      gameStateManager.setActiveTeam(nextTeamId);
      
      setGameState(prev => ({
        ...prev,
        activeTeamIndex: nextTeamIndex,
        activeTeam: nextTeamId
      }));
      
      // Show a transition and then next question
      setTimeout(showNextQuestion, INTER_QUESTION_DELAY);
    }, ANSWER_FEEDBACK_DELAY);
  }, [question, gameState.activeTeam, gameState.activeTeamIndex, config.teams, eventBus, timerManager, gameStateManager, audioManager]);
  
  const triggerGameOver = useCallback(() => {
    if (gameState.hasTriggeredGameOver) return;
    
    // Play victory sound
    audioManager.play('victory-sound');
    
    // Update game state
    gameStateManager.setPhase(GamePhase.GAME_OVER);
    
    setGameState(prev => ({
      ...prev,
      hasTriggeredGameOver: true,
      phase: GamePhase.GAME_OVER
    }));
    
    // Emit game ended event
    eventBus.emit(GAME_STATE_EVENTS.GAME_ENDED);
    
    // Get final scores from scoring manager
    const teamScores: Record<string | number, number> = {};
    const scoreData = scoringManager.getAllTeamData();
    
    scoreData.forEach(team => {
      teamScores[team.teamId] = team.score;
    });
    
    // Determine winner (team with highest score)
    let winner = config.teams[0].id;
    let highestScore = teamScores[winner] || 0;
    
    Object.entries(teamScores).forEach(([teamId, score]) => {
      if (score > highestScore) {
        highestScore = score;
        winner = teamId;
      }
    });
    
    // Notify parent component
    onGameOver(teamScores, winner);
  }, [gameState.hasTriggeredGameOver, eventBus, scoringManager, config.teams, onGameOver, gameStateManager, audioManager]);
  
  // Get layout parameters
  const layoutParams = useMemo(() => {
    return layoutManagerRef.current?.getLayoutParams() || null;
  }, [layoutManagerRef.current]);
  
  if (gameState.phase === GamePhase.LOADING || !layoutParams) {
    return (
      <pixiContainer>
        <pixiText
          text="Loading..." 
          anchor={0.5}
          position={{ x: app.screen.width / 2, y: app.screen.height / 2 }}
          style={new TextStyle({
            fill: themeConfig.pixiConfig?.questionTextColor || 0xFFFFFF,
            fontSize: 36,
            fontFamily: 'Grandstander',
          })}
        />
      </pixiContainer>
    );
  }
  
  return (
    <pixiContainer>
      {/* Background */}
      <Background 
        themeConfig={themeConfig.pixiConfig} 
        width={app.screen.width}
        height={app.screen.height}
      />
      
      {/* Question and Media Display */}
      <QuestionDisplay 
        question={question}
        layoutParams={layoutParams}
        screenWidth={app.screen.width}
        screenHeight={app.screen.height}
        themeConfig={themeConfig.pixiConfig}
      />
      
      {/* Answer Options */}
      <AnswerButtonsGrid
        options={answerOptions}
        onSelect={handleAnswerSelected}
        layoutParams={layoutParams}
        screenWidth={app.screen.width}
        screenHeight={app.screen.height}
        themeConfig={themeConfig.pixiConfig}
        enabled={answerButtonsEnabled}
        showAnswer={showAnswer}
        selectedId={selectedAnswer}
        questionId={question?.id || ''}
      />
      
      {/* Timer */}
      <Timer
        remaining={timerData.remaining}
        duration={timerData.duration}
        position={[app.screen.width / 2, layoutParams.topPadding + 60]}
        themeConfig={themeConfig.pixiConfig}
      />
    </pixiContainer>
  );
};

// React component wrapper for the MultipleChoiceReact game
export const MultipleChoiceReactApp: React.FC<{ 
  config: GameConfig; 
  pixiEngine: PixiEngine; 
  onGameOver: (scores: Record<string | number, number>, winner: string | number) => void;
}> = ({ 
  config, 
  pixiEngine, 
  onGameOver 
}) => {
  return (
    <Application 
      width={window.innerWidth}
      height={window.innerHeight}
      resolution={window.devicePixelRatio || 1}
      autoDensity={true}
      backgroundColor={0x1099bb}
    >
      <MultipleChoiceReact 
        config={config} 
        managers={pixiEngine.getManagers()} 
        onGameOver={onGameOver} 
      />
    </Application>
  );
}; 