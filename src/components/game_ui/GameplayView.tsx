'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PlayerScore from './PlayerScore';
import NavMenu, { NavMenuItemProps } from './NavMenu';
import GameControlDropdown from './GameControlDropdown';
import { PlayerScoreData, GameOverPayload } from '@/types/gameTypes';
import { GAME_STATE_EVENTS, SCORING_EVENTS, ScoringScoreUpdatedPayload, GameStateActiveTeamChangedPayload } from '@/lib/pixi-engine/core/EventTypes';
import { GameConfig } from '@/lib/pixi-engine/config/GameConfig';
import { Settings, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { SETTINGS_EVENTS } from '@/lib/pixi-engine/core/EventTypes';
import { useFullscreen } from '@/hooks/useFullscreen';
import type { GameSessionServices } from '@/lib/game-engine/core/GameSession';
import type { GameRuntime, GameRuntimeFactory } from '@/lib/game-engine/runtime/GameRuntime';
// import type { EventBus } from '@/lib/pixi-engine/core/EventBus';

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
  /** React ref pointing to the DOM element where the selected renderer mounts. */
  gameMountPointRef: React.RefObject<HTMLDivElement>;
  /** Lazily creates either the Pixi adapter or Three runtime. */
  runtimeFactory: GameRuntimeFactory;
}

/**
 * Renders the main gameplay interface, including the renderer canvas,
 * player scores, navigation menu, and overlay panels (settings, main menu).
 * Initializes and manages one GameRuntime lifecycle (Pixi or Three).
 */
const GameplayView: React.FC<GameplayViewProps> = ({
  config,
  themeClassName,
  onGameOver,
  onExit,
  gameMountPointRef,
  runtimeFactory,
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
  const [volume, setVolume] = useState(30);
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(false);

  // --- Refs for internal engine/managers ---
  const runtimeRef = useRef<GameRuntime | null>(null);
  const servicesRef = useRef<GameSessionServices | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // --- Fullscreen functionality ---
  const { isFullscreen, toggleFullscreen, isSupported } = useFullscreen(gameContainerRef);

  // Deep-compare key so parent re-renders with an equivalent config don't remount the engine
  const configKey = JSON.stringify(config);
  const stableConfig = useMemo(
    () => JSON.parse(configKey) as GameConfig,
    [configKey]
  );

  // Keep factory stable across parent re-renders so init isn't torn down mid-flight.
  const runtimeFactoryRef = useRef(runtimeFactory);
  runtimeFactoryRef.current = runtimeFactory;

  // --- PixiJS Event Handlers (using managersRef) ---
  /**
   * Handles the GAME_ENDED event from the PixiEngine.
   * Retrieves final scores and determines the winner, then calls the onGameOver prop.
   */
  const handlePixiGameOver = useCallback(() => {
      console.log("React received GAME_ENDED event");
      const services = servicesRef.current;
      const finalScoreData = services?.scoringManager?.getAllTeamData() ?? [];
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

  // Screen size detection for mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerHeight < 600);
    };
    
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Renderer-neutral runtime initialization effect ---
  useEffect(() => {
    if (!stableConfig || !gameMountPointRef.current || runtimeRef.current) {
      return;
    }

    // Validate config structure before initialization
    if (!stableConfig.gameMode || !stableConfig.teams || !Array.isArray(stableConfig.teams) || stableConfig.teams.length === 0) {
      console.error("GameplayView: Invalid config structure - missing required fields");
      return;
    }

    let cancelled = false;
    let runtime: GameRuntime | null = null;

    void runtimeFactoryRef.current()
      .then(async (createdRuntime) => {
        runtime = createdRuntime;
        runtimeRef.current = createdRuntime;
        await createdRuntime.init({
          target: gameMountPointRef.current!,
          config: stableConfig,
        });
        if (cancelled) {
          await createdRuntime.destroy();
          return;
        }

        const services = createdRuntime.getServices();
        servicesRef.current = services;
        services.eventBus.on(GAME_STATE_EVENTS.GAME_ENDED, handlePixiGameOver);
        services.eventBus.on(SCORING_EVENTS.SCORE_UPDATED, handlePixiScoreUpdate);
        services.eventBus.on(
          GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED,
          handlePixiActiveTeamChanged
        );
        setRuntimeReady(true);
        createdRuntime.start();
      })
      .catch(error => {
        if (cancelled) return;
        console.error("GameplayView: Failed to initialize game runtime:", error);
        runtimeRef.current = null;
        servicesRef.current = null;
        setRuntimeReady(false);
      });

    return () => {
      cancelled = true;
      setRuntimeReady(false);
      const services = servicesRef.current;
      if (services) {
        services.eventBus.off(GAME_STATE_EVENTS.GAME_ENDED, handlePixiGameOver);
        services.eventBus.off(SCORING_EVENTS.SCORE_UPDATED, handlePixiScoreUpdate);
        services.eventBus.off(
          GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED,
          handlePixiActiveTeamChanged
        );
      }

      const activeRuntime = runtimeRef.current ?? runtime;
      runtimeRef.current = null;
      servicesRef.current = null;
      void activeRuntime?.destroy();
    };
  }, [
    stableConfig,
    gameMountPointRef,
    handlePixiGameOver,
    handlePixiScoreUpdate,
    handlePixiActiveTeamChanged,
  ]);
  // ------------------------------------------------------

  // --- Settings/Audio Handlers (Connect to EventBus/AudioManager) ---
  const handleMusicToggle = useCallback(() => {
    const newMutedState = !musicMuted;
    console.log('Music toggled to:', newMutedState ? 'Muted' : 'Unmuted');
    setMusicMuted(newMutedState);
    servicesRef.current?.eventBus.emit(SETTINGS_EVENTS.SET_MUSIC_MUTED, newMutedState);
  }, [musicMuted]);

  const handleSfxToggle = useCallback(() => {
    const newMutedState = !sfxMuted;
    console.log('SFX toggled to:', newMutedState ? 'Muted' : 'Unmuted');
    setSfxMuted(newMutedState);
    servicesRef.current?.eventBus.emit(SETTINGS_EVENTS.SET_SFX_MUTED, newMutedState);
  }, [sfxMuted]);
  // --- End Settings/Audio Handlers ---

  // --- Main Menu Action Handlers ---
  const handleRestartGame = useCallback(() => {
    console.log('Restart requested');
    onExit();
  }, [onExit]);

  // --- Nav Menu Items definition ---
  const navMenuItems: NavMenuItemProps[] = runtimeReady && servicesRef.current?.eventBus ? [
      {
        id: 'game-controls',
        label: 'Audio Settings & Menu',
        customInteraction: true,
        icon: (
          <GameControlDropdown
            eventBus={servicesRef.current.eventBus}
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
      ...(isSupported ? [{
        id: 'fullscreen',
        label: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
        icon: isFullscreen ? <Minimize2 /> : <Maximize2 />,
        onClick: toggleFullscreen,
      }] : []),
      { id: 'back', label: 'Exit Game', icon: <ArrowLeft />, onClick: onExit },
  ] : [
      { id: 'game-controls', label: 'Audio Settings (Loading...)', icon: <Settings className="opacity-50"/>,},
      ...(isSupported ? [{
        id: 'fullscreen',
        label: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
        icon: isFullscreen ? <Minimize2 /> : <Maximize2 />,
        onClick: toggleFullscreen,
      }] : []),
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

    const bus = servicesRef.current?.eventBus;
    if (bus) {
       // Get initial values on mount AFTER bus is ready
        const initialVol = servicesRef.current?.audioManager?.getGlobalVolume() ?? 0.3;
        const initialMusicMuted = servicesRef.current?.audioManager?.getIsMusicMuted() ?? false;
        const initialSfxMuted = servicesRef.current?.audioManager?.getIsSfxMuted() ?? false;
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
  }, [runtimeReady]);

  // Handle fullscreen changes through the selected runtime.
  useEffect(() => {
    if (runtimeRef.current && gameContainerRef.current) {
      // Small delay to ensure the fullscreen transition is complete
      const timeoutId = setTimeout(() => {
        const container = gameContainerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const width = rect.width || window.innerWidth;
          const height = rect.height || window.innerHeight;
          
          runtimeRef.current?.resize(width, height);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isFullscreen]);

  return (
    <div ref={gameContainerRef} className={`${themeClassName} relative min-h-screen w-full overflow-hidden`}>
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
                isMobile={isMobileView}
                isCompact={config.gameSlug === 'splash-dash'} // Make smaller for splash-dash
                className={`${themeClassName}`}
            />
                );
            })}
        </div>

        <div className={`absolute top-6 right-6 z-10`}>
             <NavMenu items={navMenuItems}/>
        </div>

      {/* Selected runtime mounts exactly one renderer canvas here. */}
      <div ref={gameMountPointRef} className={`${themeClassName} pixiCanvasContainer`}></div>

    </div>
  );
};

export default GameplayView; 