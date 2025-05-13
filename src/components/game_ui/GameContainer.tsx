'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import GameSetupPanel from './GameSetupPanel';
import GameOverScreen from './GameOverScreen';
import styles from '@/styles/themes/themes.module.css';
import { GameSetupData, PlayerScoreData, GameOverPayload } from '@/types/gameTypes';
import {
    GameConfig,
    ScoreModeConfig,
    DEFAULT_GAME_CONFIG,
    RuleDefinition,
    RuleConfig,
    ControlsConfig,
    AudioConfiguration,
} from '@/lib/pixi-engine/config/GameConfig';
import { PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine';
import { MultipleChoiceGame } from '@/lib/pixi-games/multiple-choice/MultipleChoiceGame';
import type { NavMenuItemProps } from './NavMenu';
import { GAME_EVENTS, ENGINE_EVENTS } from '@/lib/pixi-engine/core/EventTypes';
import { PowerupConfig, STANDARD_SCORE_MODE_POWERUPS } from '@/lib/pixi-engine/config/PowerupConfig';
import LoadingSpinner from '../loading_spinner';

const GameplayView = dynamic(() => import('./GameplayView'), {
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
});

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;

type GameView = 'setup' | 'playing' | 'gameover';

/**
 * Props for the GameContainer component.
 */
interface GameContainerProps {
  /** The unique identifier for the quiz to be played. */
  quizId: string;
  /** The URL slug for the game type (e.g., 'multiple-choice'). */
  gameSlug: string;
}

/**
 * Factory function to create a specific game instance.
 * @param config - The game configuration object.
 * @param managers - The core PixiEngine managers.
 * @param initialDimensions - Optional initial dimensions that can be used when app.screen isn't available yet.
 * @returns An instance of the game controller (e.g., MultipleChoiceGame).
 */
const gameFactory = (
  config: GameConfig, 
  managers: PixiEngineManagers,
  initialDimensions?: { initialWidth: number; initialHeight: number }
): MultipleChoiceGame => {
    console.log(`GameContainer: Creating game instance${initialDimensions ? ` with initial dimensions ${initialDimensions.initialWidth}x${initialDimensions.initialHeight}` : ''}`);
    return new MultipleChoiceGame(config, managers, initialDimensions);
};

/**
 * Main container component responsible for managing the game lifecycle,
 * switching between setup, gameplay, and game over views.
 */
const GameContainer: React.FC<GameContainerProps> = ({ quizId, gameSlug }) => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<GameView>('setup');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [finalScores, setFinalScores] = useState<PlayerScoreData[]>([]);
  const [winnerName, setWinnerName] = useState<string | undefined>(undefined);
  const [themeClassName, setThemeClassName] = useState<string>(styles.themeBasic);
  // const [isPaused, setIsPaused] = useState(false);

  const pixiMountPointRef = useRef<HTMLDivElement>(null);

  /**
   * Callback triggered when the user confirms settings and starts the game.
   * Assembles the full GameConfig and transitions the view to 'playing'.
   * @param setupConfig - Configuration options selected in the setup panel.
   */
  const handleStartGame = useCallback((setupData: Omit<GameSetupData, 'quizId' | 'gameSlug'>) => {
      if (!quizId) {
          console.error("Cannot start game: No Quiz ID available! Navigating back.");
          router.push('/games');
          return;
      }

      const gameMode: ScoreModeConfig = {
          type: 'score',
          name: 'Score Attack',
      };
      // --- Define Powerup Config --- 
      const powerupConfig: PowerupConfig = {
          // Check if any powerup is enabled in UI selections
          powerupsEnabled: Object.values(setupData.powerups).some(enabled => enabled),
          // Filter STANDARD_SCORE_MODE_POWERUPS based on UI selections
          availablePowerups: STANDARD_SCORE_MODE_POWERUPS.filter(powerup => {
              // Match powerup.id to corresponding key in setupData.powerups
              switch (powerup.id) {
                  case 'fifty_fifty': return setupData.powerups.fiftyFifty;
                  case 'double_points': return setupData.powerups.doublePoints;
                  case 'time_extension': return setupData.powerups.timeExtension;
                  case 'comeback': return setupData.powerups.comeback;
                  default: return false;
              }
          }),
          spawnMechanic: {}, // Keep empty for now, activation is via transition/rules
      };
      
      console.log("GameContainer: Enabled powerups:", powerupConfig.availablePowerups.map(p => p.id));

      // --- Define Scoring Rule (using RuleDefinition) ---
      const scoringRule: RuleDefinition = {
          id: 'score-correct-answer',
          description: 'Award points for correct multiple choice answer',
          triggerEvent: GAME_EVENTS.ANSWER_SELECTED, // Use imported constant
          conditions: [
              {
                  type: 'compareState', // Correct type
                  property: 'isCorrect', // Correct property from payload
                  operator: 'eq', // Correct operator
                  value: true // Correct value to compare against
              }
          ],
          actions: [
              {
                  type: 'modifyScore', // Correct action type
                  params: {
                      target: 'payload.teamId' // Target team from event payload
                  }
              }
          ]
      };
      
      // --- Dynamically Set Scoring Params ---
      const modifyScoreAction = scoringRule.actions.find(action => action.type === 'modifyScore');
      if (modifyScoreAction && modifyScoreAction.params) {
           if (setupData.gameFeatures === 'boosted') {
               console.log("GameContainer: Applying BOOSTED scoring rules.");
               modifyScoreAction.params.mode = 'progressive';
               modifyScoreAction.params.timerId = 'multipleChoiceQuestionTimer'; // Make sure this ID matches game timer
               modifyScoreAction.params.pointsPerSecond = 5; // Set progressive points
               delete modifyScoreAction.params.points; // Clean up fixed points param
           } else { // 'basic' or default
               console.log("GameContainer: Applying BASIC (fixed) scoring rules.");
               modifyScoreAction.params.mode = 'fixed';
               modifyScoreAction.params.points = 10; // Set fixed points
               delete modifyScoreAction.params.timerId; // Clean up progressive params
               delete modifyScoreAction.params.pointsPerSecond;
           }
      } else {
          console.error("GameContainer: Could not find 'modifyScore' action in scoringRule to set parameters.");
      }
      // --- End Dynamic Scoring Params ---
      
      // --- Define Rule Config Object ---
      const ruleConfig: RuleConfig = {
          rules: [
              scoringRule,
              {
                  id: 'play-correct-sound',
                  description: 'Play correct answer sound when answer is correct',
                  triggerEvent: GAME_EVENTS.ANSWER_SELECTED,
                  conditions: [
                      {
                          type: 'compareState',
                          property: 'isCorrect',
                          operator: 'eq',
                          value: true
                      }
                  ],
                  actions: [
                      {
                          type: 'playSound',
                          params: {
                              soundId: 'correct-sound'
                          }
                      }
                  ]
              },
              {
                  id: 'play-incorrect-sound',
                  description: 'Play incorrect answer sound when answer is wrong',
                  triggerEvent: GAME_EVENTS.ANSWER_SELECTED,
                  conditions: [
                      {
                          type: 'compareState',
                          property: 'isCorrect',
                          operator: 'eq',
                          value: false
                      }
                  ],
                  actions: [
                      {
                          type: 'playSound',
                          params: {
                              soundId: 'incorrect-sound'
                          }
                      }
                  ]
              },
              {
                  id: 'play-background-music',
                  description: 'Play background music when engine is ready',
                  triggerEvent: ENGINE_EVENTS.ENGINE_READY_FOR_GAME,
                  conditions: [],
                  actions: [
                      {
                          type: 'playSound',
                          params: {
                              soundId: 'background-music'
                          }
                      }
                  ]
              }
          ]
      };

      // --- Define Controls Config (using ControlsConfig) ---
      const controlConfig: ControlsConfig = {
          actionMap: { // Use action names consistent with DEFAULT_CONTROLS_CONFIG
              UP: { keyboard: 'ArrowUp' },
              DOWN: { keyboard: 'ArrowDown' },
              LEFT: { keyboard: 'ArrowLeft' },
              RIGHT: { keyboard: 'ArrowRight' },
              ACTION_A: { keyboard: 'Space' }, // Map Space to ACTION_A
              ACTION_B: { keyboard: 'Enter' }, // Map Enter to ACTION_B
          },
          playerMappings: [ // Need at least one player mapping usually
                { playerId: 'player1', deviceType: 'keyboard' } 
          ],
          gamepadDeadzone: DEFAULT_GAME_CONFIG.controls.gamepadDeadzone,
      };
      
      // --- Define Basic Assets (Example - Adapt/Make Dynamic Later) ---
      const assetConfig = DEFAULT_GAME_CONFIG.assets; // Use default for now

      // --- Define Audio Configuration ---
      const audioConfig: AudioConfiguration = {
          defaultVolume: 0.7,
          startMuted: false,
          sounds: [
              {
                  id: 'correct-sound',
                  filename: '/audio/default/correct-sound.mp3',
                  type: 'sfx'
              },
              {
                  id: 'incorrect-sound',
                  filename: '/audio/default/incorrect-sound.mp3',
                  type: 'sfx'
              },
              {
                  id: 'victory-sound',
                  filename: '/audio/default/crowd-cheering.mp3',
                  type: 'sfx'
              },
              {
                  id: 'background-music',
                  filename: '/audio/default/background-music.mp3',
                  loop: true,
                  volume: 0.7,
                  type: 'music'
              }
          ]
      };

      // --- Assemble Full Config ---
      const fullEngineConfig: GameConfig = {
          ...DEFAULT_GAME_CONFIG, // Start with defaults
          quizId: quizId,
          gameSlug: gameSlug,
          teams: setupData.teams,
          gameMode: gameMode,
          powerups: powerupConfig,
          intensityTimeLimit: setupData.intensityTimeLimit,
          rules: ruleConfig, // Assign the RuleConfig object
          controls: controlConfig, // Assign the ControlsConfig object
          assets: assetConfig,
          audio: audioConfig, // Add the audio configuration
          // Pass initial mute states (inverted from settings toggles)
          initialMusicMuted: !setupData.settings.music,
          initialSfxMuted: !setupData.settings.sounds,
          theme: setupData.theme, // Pass the theme fo pixiUI
      };


      console.log('Prepared full engine config:', fullEngineConfig);
      setGameConfig(fullEngineConfig);

      // --- UPDATE THEME FOR  REACT COMPONENTS ---
      let simpleThemeClass = ''; // Default: rely on :root styles
      switch (setupData.theme) {
          case 'dark':
              simpleThemeClass = 'dark'; // Use the global .dark class
              break;
          case 'forest':
              simpleThemeClass = 'themeForest'; // Use the global .themeForest class
              break;
          case 'basic':
          default:
              simpleThemeClass = ''; // No extra class needed for default theme
              break;
      }
      console.log(`GameContainer: Setting theme class to: "${simpleThemeClass || '(default)'}"`);
      setThemeClassName(simpleThemeClass); // Set state to the simple class name
      // --- END UPDATE ---

      setCurrentView('playing');
  }, [quizId, gameSlug, router]);

  /**
   * Callback triggered when the PixiEngine emits a game over event.
   * Sets the final scores and winner, then transitions the view to 'gameover'.
   * @param payload - Data containing final scores and winner information.
   */
  const handleGameOver = useCallback((payload: GameOverPayload) => {
    console.log("GameContainer: Received GAME_OVER event. Payload:", payload);
    setFinalScores(payload.scores);
    setWinnerName(payload.winner);
    setCurrentView('gameover');
  }, []);

  /**
   * Callback triggered when the user chooses to play again from the game over screen.
   * Resets state and navigates back to the game selection or setup.
   */
  const handlePlayAgain = useCallback(() => {
    setGameConfig(null);
    setFinalScores([]);
    setWinnerName(undefined);
    router.push('/games');
    setThemeClassName(''); // Reset theme class name to default (empty string)
  }, [router]);

  /**
   * Callback triggered when the user chooses to exit the game (from game over or during play).
   */
  const handleExit = useCallback(() => {
    console.log("GameContainer: Exiting game.");
    handlePlayAgain();
  }, [handlePlayAgain]);

  const handleBackFromSetup = useCallback(() => {
      router.push('/games');
  }, [router]);

  const renderView = () => {
    switch (currentView) {
      case 'setup':
        return <GameSetupPanel
                    onStartGame={handleStartGame}
                    onGoBack={handleBackFromSetup}
                    initialGameSlug={gameSlug}
                />;
      case 'playing':
        if (!gameConfig) {
             return <div className="min-h-screen w-screen flex items-center justify-center"><LoadingSpinner /></div>;
        }
        // When playing, render GameplayView and pass the ref for Pixi to mount into
        return (
          <>
            <GameplayView
                config={gameConfig}
                themeClassName={themeClassName}
                onGameOver={handleGameOver}
                onExit={handleExit}
                pixiMountPointRef={pixiMountPointRef as React.RefObject<HTMLDivElement>}
                gameFactory={gameFactory}
            />
          </>
        );
      case 'gameover':
        const gameOverNavItems: NavMenuItemProps[] = [
            { id: 'back', label: 'Exit Game', icon: <BackIcon />, onClick: handleExit },
        ];
        return <GameOverScreen
                    finalScores={finalScores}
                    winnerName={winnerName}
                    themeClassName={themeClassName}
                    onPlayAgain={handlePlayAgain}
                    onExit={handleExit}
                    navMenuItems={gameOverNavItems}
                />;
      default:
        console.error("Reached unknown game state:", currentView);
        return <div>Error: Unknown game state!</div>;
    }
  };

  return <>{renderView()}</>;
};

export default GameContainer; 