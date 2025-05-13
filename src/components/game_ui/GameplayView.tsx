'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PlayerScore from './PlayerScore';
import NavMenu, { NavMenuItemProps } from './NavMenu';
import GameControlDropdown from './GameControlDropdown';
import { PlayerScoreData, GameOverPayload } from '@/types/gameTypes';
import { GAME_STATE_EVENTS, SCORING_EVENTS, ScoringScoreUpdatedPayload, GameStateActiveTeamChangedPayload } from '@/lib/pixi-engine/core/EventTypes';
import { PixiEngine, PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine';
import { GameConfig } from '@/lib/pixi-engine/config/GameConfig';
import { BaseGame } from '@/lib/pixi-engine/game/BaseGame';
import { Settings, ArrowLeft } from 'lucide-react';
import { SETTINGS_EVENTS } from '@/lib/pixi-engine/core/EventTypes';
// import type { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { 
  Application, 
  useApplication, 
  extend, 
  useTick ,
  
} from '@pixi/react';
import { TextStyle, Text, Container, Graphics as PixiGraphics, Sprite as PixiSprite } from 'pixi.js';
// --- @pixi/react and PIXI imports ---
import * as PIXI from 'pixi.js';

// --- Zustand Store Imports ---
import { useGameConfigStore } from '@/lib/stores/useGameConfigStore';
import { useManagersStore } from '@/lib/stores/useManagersStore';
import { useGameDisplayStateStore } from '@/lib/stores/useGameDisplayStateStore'; // Removed PlayerScoreState alias, it's exported directly
import { usePixiAppStore } from '@/lib/stores/usePixiAppStore'; // Import the new store

// --- Custom React-Pixi Component Imports ---
import { GameBackground } from '@/lib/pixi-games/multiple-choice/react-components/GameBackground';
import { TimerDisplay } from '@/lib/pixi-games/multiple-choice/react-components/TimerDisplay';
import { CurrentQuestionDisplayScene } from '@/lib/pixi-games/multiple-choice/react-components/CurrentQuestionDisplayScene';
import PixiDevtoolsInitializer from './PixiDevtoolsInitializer'; // Import the devtools initializer

// Extend specific PIXI classes for JSX usage
// These will be available as <Container />, <Sprite />, <Graphics />, <Text /> in JSX
extend({ Text, Container, Graphics: PixiGraphics, Sprite: PixiSprite });
// --- End @pixi/react imports ---

// Update state structure to include teamId
interface PlayerScoreState extends PlayerScoreData {
  teamId: string | number;
}

/**
 * Props for the GameplayView component.
 */
interface GameplayViewProps {
  /** The full configuration object for the PixiEngine. */
  config: GameConfig;
  /** CSS class name defining the visual theme. */
  themeClassName: string;
  /** Callback function invoked when the game ends. */
  onGameOver: (payload: GameOverPayload) => void;
  /** Callback function invoked when the user requests to exit the game. */
  onExit: () => void;
  /** React ref pointing to the DOM element where the PixiJS canvas should be mounted. */
  pixiMountPointRef: React.RefObject<HTMLDivElement>;
  /** Factory function to create the specific game instance. */
  gameFactory: (config: GameConfig, managers: PixiEngineManagers, initialDimensions?: { initialWidth: number; initialHeight: number }) => BaseGame;
}

/**
 * Renders the main gameplay interface, including the PixiJS canvas,
 * player scores, navigation menu, and overlay panels (settings, main menu).
 * Initializes and manages the PixiEngine lifecycle.
 */
const GameplayView: React.FC<GameplayViewProps> = ({
  config,
  themeClassName,
  onGameOver,
  onExit,
  pixiMountPointRef,
  gameFactory,
}) => {
  // Initialize state with teamId
  const [playerScores, setPlayerScores] = useState<PlayerScoreState[]>(() =>
    config.teams.map((team) => ({
      teamId: team.id,
      playerName: team.name,
      score: team.startingResources?.score ?? 0,
    }))
  );
  const [activeTeamId, setActiveTeamId] = useState<string | number | null>(
    config.teams.length > 0 ? config.teams[0].id : null
  );
  const [volume, setVolume] = useState(80);
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);

  // --- Refs for internal engine/managers ---
  const engineInstanceRef = useRef<PixiEngine | null>(null);
  const managersRef = useRef<PixiEngineManagers | null>(null);
  // Store initial dimensions from the mount point
  const initialDimensionsRef = useRef<{width: number, height: number} | null>(null);

  // --- @pixi/react Application options ---
  // appWidth and appHeight are now managed by resizeTo
  const appResolution = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const appBackgroundColor = 0x1099bb; // Placeholder color
  // --- End @pixi/react Application options ---

  // --- Get Pixi App from Store ---
  const pixiAppFromStore = usePixiAppStore(state => state.app);
  // --- End Get Pixi App from Store ---

  // Effect to capture initial dimensions from mount point
  useEffect(() => {
    if (pixiMountPointRef.current && !initialDimensionsRef.current) {
      const width = pixiMountPointRef.current.clientWidth || 1280;
      const height = pixiMountPointRef.current.clientHeight || 720;
      initialDimensionsRef.current = { width, height };
      console.log(`GameplayView: Captured initial dimensions from mount point: ${width}x${height}`);
    }
  }, [pixiMountPointRef]);

  // Component to update the Zustand stores with React state and instances
  const StoreUpdater = () => {
    const app = useApplication();
    const setPixiApp = usePixiAppStore(state => state.setApp);
    const setGameConfig = useGameConfigStore(state => state.setConfig);
    const setManagers = useManagersStore(state => state.setAllEngineManagers);
    const setEventBus = useGameDisplayStateStore(state => state.setEventBus);
    const initScores = useGameDisplayStateStore(state => state.initScores);

    useEffect(() => {
      if (app?.app) {
        console.log("GameplayView: Setting PIXI.Application instance in store:", app.app);
        setPixiApp(app.app);
      }
    }, [app, setPixiApp]);

    useEffect(() => {
      if (config) {
        console.log("GameplayView: Setting GameConfig in store:", config);
        setGameConfig(config);
        // Initialize scores based on team config
        initScores(config.teams);
      }
    }, [config, setGameConfig, initScores]);

    useEffect(() => {
      if (managersRef.current) {
        console.log("GameplayView: Setting managers in store:", managersRef.current);
        setManagers(managersRef.current);
        // Set the EventBus instance in the display state store
        if (managersRef.current.eventBus) {
          setEventBus(managersRef.current.eventBus);
        }
      }
    }, [managersRef.current, setManagers, setEventBus]);

    return null; // This component doesn't render anything
  };

  console.log(config, 'AS GAME Confing form container !!!!!!!!!!!')

  // --- PixiJS Event Handlers (using managersRef) ---
  /**
   * Handles the GAME_ENDED event from the PixiEngine.
   * Retrieves final scores and determines the winner, then calls the onGameOver prop.
   */
  const handlePixiGameOver = useCallback(() => {
      console.log("React received GAME_ENDED event");
      const currentManagers = managersRef.current;
      const finalScoreData = currentManagers?.scoringManager?.getAllTeamData() ?? [];
      const formattedScores: PlayerScoreData[] = finalScoreData.map(t => ({
          playerName: t.displayName ?? String(t.teamId),
          score: t.score
      }));
      let winner: PlayerScoreData | undefined;
      if (formattedScores.length > 0) {
          winner = formattedScores.reduce((prev: PlayerScoreData, current: PlayerScoreData) => (prev.score > current.score) ? prev : current);
          if (winner) { 
            const maxScore = winner.score;
            const winners = formattedScores.filter((s: PlayerScoreData) => s.score === maxScore); 
            if (winners.length > 1) {
                winner = undefined;
            }
          }
      }
      const payload: GameOverPayload = { scores: formattedScores, winner: winner?.playerName };
      onGameOver(payload);
  }, [onGameOver]);

  /**
   * Handles the SCORE_UPDATED event from the PixiEngine's ScoringManager.
   * Updates the displayed score for the relevant player.
   * @param payload - Data containing the updated team ID and score.
   */
  const handlePixiScoreUpdate = useCallback((payload: ScoringScoreUpdatedPayload) => {
      console.log("React received SCORE_UPDATED event:", payload);
      setPlayerScores(prevScores =>
          prevScores.map(p =>
              p.teamId === payload.teamId
                  ? { ...p, score: payload.currentScore }
                  : p
          )
      );
  }, []);

  // <<< ADD Handler for Active Team Change >>>
  const handlePixiActiveTeamChanged = useCallback((payload: GameStateActiveTeamChangedPayload) => {
    console.log("React received ACTIVE_TEAM_CHANGED event. Payload:", payload);
    setActiveTeamId(payload.currentTeamId);
    console.log("React state activeTeamId SET TO:", payload.currentTeamId);
  }, []);
  // -------------------------------------

  // Optional: Add effect to log state whenever it changes
  useEffect(() => {
    console.log("React activeTeamId state CHANGED TO:", activeTeamId);
  }, [activeTeamId]);

  // --- Engine Initialization Effect --- 
  /**
   * Initializes the PixiEngine when the component mounts or config/factory changes.
   * Attaches necessary event listeners and handles cleanup on unmount.
   */
  useEffect(() => {
      let engine: PixiEngine | null = null;
      
      // Ensure PixiApp is available in the store before initializing the engine
      if (config && gameFactory && pixiMountPointRef.current && !engineInstanceRef.current && pixiAppFromStore) {
          console.log("GameplayView: Initializing PixiEngine (PixiApp is available in store)...");
          
          // Pass initial dimensions to PixiEngine
          const initialOptions = {
            debug: process.env.NODE_ENV === 'development',
            width: initialDimensionsRef.current?.width,
            height: initialDimensionsRef.current?.height,
          };
          
          engine = new PixiEngine(initialOptions);
          engineInstanceRef.current = engine;

          engine.init(config, gameFactory)
              .then(() => {
                  console.log("GameplayView: PixiEngine initialized successfully.");
                  const currentManagers = engine?.getManagers();
                  managersRef.current = currentManagers ?? null;

                  if (currentManagers) {
                       // --- Populate Zustand Stores ---
                       useGameConfigStore.getState().setConfig(config);
                       useManagersStore.getState().setAllEngineManagers(currentManagers);
                       useGameDisplayStateStore.getState().setEventBus(currentManagers.eventBus);
                       useGameDisplayStateStore.getState().initScores(config.teams);
                       console.log("GameplayView: Zustand stores populated.");
                       // --- End Zustand Population ---

                       console.log("GameplayView: Attaching event listeners post-init...");
                      currentManagers.eventBus.on(GAME_STATE_EVENTS.GAME_ENDED, handlePixiGameOver);
                      currentManagers.eventBus.on(SCORING_EVENTS.SCORE_UPDATED, handlePixiScoreUpdate);
                      currentManagers.eventBus.on(GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED, handlePixiActiveTeamChanged);
                  } else {
                      console.error("GameplayView: Managers are null after engine init!");
                  }
              })
              .catch(error => {
                  console.error("GameplayView: Failed to initialize PixiEngine:", error);
                  // Handle initialization error (e.g., show message, call onExit?)
                  engineInstanceRef.current = null; // Clear ref on error
                  managersRef.current = null;
              });
      }
      else if (pixiAppFromStore === null && config && gameFactory && pixiMountPointRef.current && !engineInstanceRef.current) {
        console.log("GameplayView: Waiting for PixiApplication to be available in store before initializing PixiEngine...");
      }

      // --- Cleanup function ---
      return () => {
          console.log("GameplayView: Cleanup effect running...");
          const engineToDestroy = engineInstanceRef.current;
          if (engineToDestroy) {
              console.log("GameplayView: Destroying PixiEngine instance.");
              const currentManagers = managersRef.current;
              // Detach listeners before destroying
              if (currentManagers) {
                  console.log("GameplayView: Detaching listeners during cleanup...");
                  currentManagers.eventBus.off(GAME_STATE_EVENTS.GAME_ENDED, handlePixiGameOver);
                  currentManagers.eventBus.off(SCORING_EVENTS.SCORE_UPDATED, handlePixiScoreUpdate);
                  currentManagers.eventBus.off(GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED, handlePixiActiveTeamChanged);
              }
              // --- Cleanup Zustand Store Listeners ---
              useGameDisplayStateStore.getState().cleanupListeners();
              console.log("GameplayView: Zustand store listeners cleaned up.");
              // --- End Store Cleanup ---

              engineToDestroy.destroy();
              engineInstanceRef.current = null;
              managersRef.current = null;
          } else {
              console.log("GameplayView Cleanup: No engine instance found to destroy.");
          }
      };
      // Dependencies: config and factory trigger re-init if they change.
      // Ref changes don't trigger effects, but we check .current inside.
  }, [config, gameFactory, pixiMountPointRef, handlePixiGameOver, handlePixiScoreUpdate, handlePixiActiveTeamChanged, pixiAppFromStore]);
  // ------------------------------------------------------

  // --- Settings/Audio Handlers (Connect to EventBus/AudioManager) ---
  const handleMusicToggle = useCallback(() => {
    const newMutedState = !musicMuted;
    console.log('Music toggled to:', newMutedState ? 'Muted' : 'Unmuted');
    setMusicMuted(newMutedState);
    managersRef.current?.eventBus.emit(SETTINGS_EVENTS.SET_MUSIC_MUTED, newMutedState);
  }, [musicMuted]);

  const handleSfxToggle = useCallback(() => {
    const newMutedState = !sfxMuted;
    console.log('SFX toggled to:', newMutedState ? 'Muted' : 'Unmuted');
    setSfxMuted(newMutedState);
    managersRef.current?.eventBus.emit(SETTINGS_EVENTS.SET_SFX_MUTED, newMutedState);
  }, [sfxMuted]);
  // --- End Settings/Audio Handlers ---

  // --- Main Menu Action Handlers ---
  const handleRestartGame = useCallback(() => {
    console.log('Restart requested');
    onExit();
  }, [onExit]);

  // --- Nav Menu Items definition ---
  const navMenuItems: NavMenuItemProps[] = managersRef.current?.eventBus ? [
      {
        id: 'game-controls',
        label: 'Audio Settings & Menu',
        customInteraction: true,
        icon: (
          <GameControlDropdown
            eventBus={managersRef.current.eventBus}
            musicMuted={musicMuted}
            sfxMuted={sfxMuted}
            volume={volume}
            onMusicToggle={handleMusicToggle}
            onSfxToggle={handleSfxToggle}
            onRestartGame={handleRestartGame}
            onQuitGame={onExit}
            className={``}
          />
        )
      },
      { id: 'back', label: 'Exit Game', icon: <ArrowLeft />, onClick: onExit },
  ] : [
      { id: 'game-controls', label: 'Audio Settings (Loading...)', icon: <Settings className="opacity-50"/>,},
      { id: 'back', label: 'Exit Game', icon: <ArrowLeft />, onClick: onExit },
  ];

  // Effect to listen for volume changes from AudioManager/Storage to update local state for display
  useEffect(() => {
    const handleExternalVolumeChange = (newVolume: number) => {
      const newVolumePercent = Math.round(newVolume * 100);
      console.log(`GameplayView: Received SET_GLOBAL_VOLUME event (${newVolume}), updating state volume to ${newVolumePercent}`);
      setVolume(newVolumePercent);
    };
    const handleExternalMusicMute = (muted: boolean) => setMusicMuted(muted);
    const handleExternalSfxMute = (muted: boolean) => setSfxMuted(muted);

    const bus = managersRef.current?.eventBus;
    if (bus) {
       // Get initial values on mount AFTER bus is ready
        const initialVol = managersRef.current?.audioManager?.getGlobalVolume() ?? 0.8;
        const initialMusicMuted = managersRef.current?.audioManager?.getIsMusicMuted() ?? false;
        const initialSfxMuted = managersRef.current?.audioManager?.getIsSfxMuted() ?? false;
        const initialVolumePercent = Math.round(initialVol * 100);
        console.log(`GameplayView: Initializing volume state to ${initialVolumePercent}`);
        setVolume(initialVolumePercent);
        setMusicMuted(initialMusicMuted);
        setSfxMuted(initialSfxMuted);

        // Listen for future changes
       bus.on(SETTINGS_EVENTS.SET_GLOBAL_VOLUME, handleExternalVolumeChange);
       bus.on(SETTINGS_EVENTS.SET_MUSIC_MUTED, handleExternalMusicMute);
       bus.on(SETTINGS_EVENTS.SET_SFX_MUTED, handleExternalSfxMute);
    }

    return () => {
       if (bus) {
         bus.off(SETTINGS_EVENTS.SET_GLOBAL_VOLUME, handleExternalVolumeChange);
         bus.off(SETTINGS_EVENTS.SET_MUSIC_MUTED, handleExternalMusicMute);
         bus.off(SETTINGS_EVENTS.SET_SFX_MUTED, handleExternalSfxMute);
       }
    }
  }, []);

  return (
    <div className={`${themeClassName} relative min-h-screen w-full overflow-hidden`}>
        {/* Overlays */}
        <div className={`absolute flex flex-col gap-2 top-4 left-4 z-10`}>
            {playerScores.map((player: PlayerScoreState) => {
                console.log(`Rendering PlayerScore for teamId: ${player.teamId}. Current activeTeamId: ${activeTeamId}. Will set isActive to: ${player.teamId === activeTeamId}`);
                return (
            <PlayerScore
                key={player.teamId} 
                playerName={player.playerName}
                score={player.score}
                isActive={player.teamId === activeTeamId}
                className={`${themeClassName}`}
            />
                );
            })}
        </div>

        <div className={`absolute top-6 right-6 z-10`}>
             <NavMenu items={navMenuItems}/>
        </div>

      {/* Render the mount point div for PixiJS canvas */}
      <div ref={pixiMountPointRef} className={`${themeClassName} pixiCanvasContainer`}>
        {/* @pixi/react Application component will render its canvas here */}
        <Application
          resizeTo={pixiMountPointRef}
          resolution={appResolution}
          background={appBackgroundColor}
        >
          {/* Helper to set app instance in Zustand store */}
          <StoreUpdater /> 

          {/* GameBackground will be the first thing rendered in the Pixi app */}
          <GameBackground />
          {/* <TimerDisplay /> // Removed: Timer is now part of CurrentQuestionDisplayScene */}
          {/* Add CurrentQuestionDisplayScene component */}
          <CurrentQuestionDisplayScene />

          {/* Basic Container component as a root child. */}
          <pixiContainer>
            {/* Example: A placeholder text to verify @pixi/react is working */}
            <pixiText text="Hello @pixi/react!" x={50} y={50} />
          </pixiContainer>

          {/* Add PixiDevtoolsInitializer component only in development mode */}
          {process.env.NODE_ENV === 'development' && (
            <PixiDevtoolsInitializer />
          )}
        </Application>
      </div>

    </div>
  );
};

export default GameplayView; 