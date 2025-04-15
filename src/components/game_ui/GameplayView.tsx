'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import PlayerScore from './PlayerScore';
import NavMenu, { NavMenuItemProps } from './NavMenu';
import GameSettingsPanel from './GameSettingsPanel';
import MainMenuDropdown from './MainMenuDropdown';
import styles from '@/styles/themes/themes.module.css';
import { FullGameConfig, PlayerScoreData, TeamData, GameOverPayload, ScoreUpdatePayload } from '@/types/gameTypes';
import { MultipleChoiceGame, GameEventType } from '@/lib/pixi-games/multiple-choice/MultipleChoiceGame';

interface GameplayViewProps {
  config: FullGameConfig;
  themeClassName: string;
  onGameOver: (payload: GameOverPayload) => void;
  onExit: () => void;
}

// Example SVGs for NavMenu (replace with actual imports)
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/><path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;

const GameplayView: React.FC<GameplayViewProps> = ({
  config,
  themeClassName,
  onGameOver,
  onExit,
}) => {
  const [playerScores, setPlayerScores] = useState<PlayerScoreData[]>(() =>
    config.teams.map((team: TeamData) => ({ playerName: team.name, score: 0 }))
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);

  const pixiMountPoint = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<MultipleChoiceGame | null>(null);

  // --- PixiJS Event Handlers ---
  const handlePixiGameOver = useCallback((payload: GameOverPayload) => {
      console.log("React received GAME_OVER event:", payload);
      onGameOver(payload);
  }, [onGameOver]);

  const handlePixiScoreUpdate = useCallback((payload: ScoreUpdatePayload) => {
      console.log("React received SCORE_UPDATED event:", payload);
      setPlayerScores(payload.scores);
  }, []);

  // Effect to initialize and clean up PixiJS game
  useEffect(() => {
    let currentInstance: MultipleChoiceGame | null = null;
    if (pixiMountPoint.current) {
      console.log("Mount point available, initializing Pixi game...");
      if (config.gameSlug === 'multiple-choice') {
          currentInstance = new MultipleChoiceGame(pixiMountPoint.current, config);
          gameInstance.current = currentInstance;

          currentInstance.on(GameEventType.GAME_OVER, handlePixiGameOver);
          currentInstance.on(GameEventType.SCORE_UPDATED, handlePixiScoreUpdate);

          currentInstance.init().catch(error => {
              console.error("Failed to init MultipleChoiceGame instance:", error);
          });
      } else {
          console.error(`Unsupported game slug: ${config.gameSlug}`);
      }
    } else {
        console.error("Pixi mount point not found!");
    }
    return () => {
      console.log("GameplayView Unmounting - Destroying Pixi game instance...");
      if (currentInstance) { currentInstance.destroy(); }
      if (gameInstance.current === currentInstance) { gameInstance.current = null; }
    };
  }, [config, handlePixiGameOver, handlePixiScoreUpdate]);

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
            {playerScores.map((player: PlayerScoreData) => (
            <PlayerScore
                key={player.playerName}
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

      <div ref={pixiMountPoint} className={styles.pixiCanvasContainer}></div>

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