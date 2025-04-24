'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PlayerScore from './PlayerScore';
import NavMenu, { NavMenuItemProps } from './NavMenu';
import GameSettingsPanel from './GameSettingsPanel';
import MainMenuDropdown from './MainMenuDropdown';
import styles from '@/styles/themes/themes.module.css';
import { PlayerScoreData, GameOverPayload } from '@/types/gameTypes';
import { GAME_STATE_EVENTS, SCORING_EVENTS, ScoringScoreUpdatedPayload } from '@/lib/pixi-engine/core/EventTypes';
import { PixiEngine, PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine';
import { GameConfig } from '@/lib/pixi-engine/config/GameConfig';
import { BaseGame } from '@/lib/pixi-engine/game/BaseGame';

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
  gameFactory: (config: GameConfig, managers: PixiEngineManagers) => BaseGame;
}

// Example SVGs for NavMenu (replace with actual imports)
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/><path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);

  // --- Refs for internal engine/managers ---
  const engineInstanceRef = useRef<PixiEngine | null>(null);
  const managersRef = useRef<PixiEngineManagers | null>(null);

  // --- PixiJS Event Handlers (using managersRef) ---
  /**
   * Handles the GAME_ENDED event from the PixiEngine.
   * Retrieves final scores and determines the winner, then calls the onGameOver prop.
   */
  const handlePixiGameOver = useCallback(() => {
      console.log("React received GAME_ENDED event");
      const currentManagers = managersRef.current; // Access via ref
      // Use ScoringManager to get final data including teamId and displayName
      const finalScoreData = currentManagers?.scoringManager?.getAllTeamData() ?? [];

      const formattedScores: PlayerScoreData[] = finalScoreData.map(t => ({
          playerName: t.displayName ?? String(t.teamId), // Use displayName as playerName for UI
          score: t.score
      }));

      // Calculate winner from formatted scores
      let winner: PlayerScoreData | undefined;
      if (formattedScores.length > 0) {
          winner = formattedScores.reduce((prev: PlayerScoreData, current: PlayerScoreData) => (prev.score > current.score) ? prev : current);
          if (winner) { 
            const maxScore = winner.score;
            const winners = formattedScores.filter((s: PlayerScoreData) => s.score === maxScore); 
            if (winners.length > 1) {
                winner = undefined; // It's a tie
            }
          }
      }
      // Pass playerName from the winner object to GameOverPayload
      const payload: GameOverPayload = { scores: formattedScores, winner: winner?.playerName };
      onGameOver(payload);
  }, [onGameOver]); // Removed playerScores dependency as it's derived now

  // --- Update score handler type --- 

  /**
   * Handles the SCORE_UPDATED event from the PixiEngine's ScoringManager.
   * Updates the displayed score for the relevant player.
   * @param payload - Data containing the updated team ID and score.
   */
  const handlePixiScoreUpdate = useCallback((payload: ScoringScoreUpdatedPayload) => {
      console.log("React received SCORE_UPDATED event:", payload);
      // Update player score based on teamId
      setPlayerScores(prevScores =>
          prevScores.map(p =>
              p.teamId === payload.teamId
                  ? { ...p, score: payload.currentScore }
                  : p
          )
      );
  }, []); // No dependency on managers needed here
  // -------------------------------

  // --- Engine Initialization Effect --- 
  /**
   * Initializes the PixiEngine when the component mounts or config/factory changes.
   * Attaches necessary event listeners and handles cleanup on unmount.
   */
  useEffect(() => {
      let engine: PixiEngine | null = null; // Temporary variable for cleanup scope
      
      if (config && gameFactory && pixiMountPointRef.current && !engineInstanceRef.current) {
          console.log("GameplayView: Initializing PixiEngine...");
          engine = new PixiEngine({ targetElement: pixiMountPointRef.current });
          engineInstanceRef.current = engine;

          engine.init(config, gameFactory)
              .then(() => {
                  console.log("GameplayView: PixiEngine initialized successfully.");
                  const currentManagers = engine?.getManagers(); // Use local engine var
                  managersRef.current = currentManagers ?? null;

                  // Attach listeners ONLY after managers are confirmed
                  if (currentManagers) {
                       console.log("GameplayView: Attaching event listeners post-init...");
                      currentManagers.eventBus.on(GAME_STATE_EVENTS.GAME_ENDED, handlePixiGameOver);
                      currentManagers.eventBus.on(SCORING_EVENTS.SCORE_UPDATED, handlePixiScoreUpdate);
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

      // --- Cleanup function ---
      return () => {
          console.log("GameplayView: Cleanup effect running...");
          const engineToDestroy = engineInstanceRef.current; // Use ref for cleanup
          if (engineToDestroy) {
              console.log("GameplayView: Destroying PixiEngine instance.");
              const currentManagers = managersRef.current;
              // Detach listeners before destroying
              if (currentManagers) {
                  console.log("GameplayView: Detaching listeners during cleanup...");
                  currentManagers.eventBus.off(GAME_STATE_EVENTS.GAME_ENDED, handlePixiGameOver);
                  currentManagers.eventBus.off(SCORING_EVENTS.SCORE_UPDATED, handlePixiScoreUpdate);
              }
              engineToDestroy.destroy();
              engineInstanceRef.current = null;
              managersRef.current = null;
          } else {
              console.log("GameplayView Cleanup: No engine instance found to destroy.");
          }
      };
      // Dependencies: config and factory trigger re-init if they change.
      // Ref changes don't trigger effects, but we check .current inside.
  }, [config, gameFactory, pixiMountPointRef, handlePixiGameOver, handlePixiScoreUpdate]); // Added callbacks to dependency array
  // ------------------------------------------------------

  // --- Dropdown Handlers ---
  const toggleSettings = useCallback(() => setIsSettingsOpen(prev => !prev), []);
  const toggleMainMenu = useCallback(() => setIsMainMenuOpen(prev => !prev), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const closeMainMenu = useCallback(() => setIsMainMenuOpen(false), []);

  // --- Main Menu Action Handlers ---
  const handleRestartGame = useCallback(() => {
    console.log('Restart requested');
    onExit();
    closeMainMenu();
  }, [onExit, closeMainMenu]);

  const handleGoHome = useCallback(() => {
    console.log('Go Home requested');
    onExit();
    closeMainMenu();
  }, [onExit, closeMainMenu]);

  // Nav Menu Items definition
  const navMenuItems: NavMenuItemProps[] = [
      { id: 'settings', label: 'Settings', icon: <SettingsIcon />, onClick: toggleSettings },
      { id: 'menu', label: 'Menu', icon: <MenuIcon />, onClick: toggleMainMenu },
      { id: 'back', label: 'Exit Game', icon: <BackIcon />, onClick: onExit },
  ];

  return (
    <div className={`${styles.gameplayViewContainer} ${themeClassName}`}>
        {/* Overlays */}
        <div className={styles.gameplayPlayerScoresOverlay}>
            {/* Use teamId as the key */} 
            {playerScores.map((player: PlayerScoreState) => (
            <PlayerScore
                key={player.teamId} 
                playerName={player.playerName}
                score={player.score}
                isActive={false}
            />
            ))}
        </div>

        <div className={styles.gameplayNavMenuOverlay}>
             <NavMenu items={navMenuItems} orientation="horizontal" />
              <GameSettingsPanel
                isOpen={isSettingsOpen}
                onClose={closeSettings}
                className={styles.settingsPanelGameplay}
                eventBus={managersRef.current?.eventBus ?? null}
              />
              <MainMenuDropdown
                isOpen={isMainMenuOpen}
                onClose={closeMainMenu}
                onRestartGame={handleRestartGame}
                onGoHome={handleGoHome}
                onQuitGame={onExit}
                className={styles.mainMenuDropdownGameplay}
              />
        </div>

      {/* Render the mount point div for PixiJS canvas */}
      <div ref={pixiMountPointRef} className={styles.pixiCanvasContainer}></div>

    </div>
  );
};

// // --- Prop Type Definitions for Child Components ---
// interface GameSettingsPanelPropsForGameplay {
//   isOpen: boolean;
//   onClose: () => void;
//   className?: string;
// }
// interface MainMenuDropdownPropsForGameplay {
//   isOpen: boolean;
//   onClose: () => void;
//   className?: string;
//   onRestartGame: () => void;
//   onGoHome: () => void;
//   onQuitGame: () => void;
// }

export default GameplayView; 