'use client';

import React, { useState } from 'react';
import styles from '@/styles/themes/themes.module.css';

/**
 * Props for the GameSettingsPanel component.
 */
interface GameSettingsPanelProps {
  /** Whether the settings panel is currently visible. */
  isOpen: boolean;
  /** Callback function to close the settings panel. */
  onClose: () => void;
  /** Optional additional CSS class names. */
  className?: string;
  // Add props for initial settings values and callbacks if managed outside
  // e.g., initialMusicVolume: number; onMusicVolumeChange: (volume: number) => void;
}

/**
 * A panel component for adjusting game settings like music and sound volume/toggles.
 * Typically displayed as an overlay during gameplay.
 */
const GameSettingsPanel: React.FC<GameSettingsPanelProps> = ({
  isOpen,
  // onClose,
  className = '',
}) => {
  // Internal state for demo purposes - ideally, pass state down/use context
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [soundVolume, setSoundVolume] = useState(0.7);
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  if (!isOpen) {
    return null; // Don't render anything if the panel is closed
  }

  // Handler to close the panel if clicked outside (basic implementation)
  // A more robust solution would use portals and event listeners on document
  // const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
  //   if (event.target === event.currentTarget) {
  //     onClose();
  //   }
  // };

  return (
    // Combine base style with passed className
    <div className={`${styles.settingsPanel} ${className}`} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <h3 id="settings-title" className={styles.settingsPanelTitle}>Settings</h3>

      {/* Music Volume */}
      <div className={styles.settingsSliderContainer}>
        <label htmlFor="music-volume" className={styles.settingsSliderLabel}>
          Music Volume: {Math.round(musicVolume * 100)}%
        </label>
        <input
          type="range"
          id="music-volume"
          min="0"
          max="1"
          step="0.01"
          value={musicVolume}
          onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
          className={styles.settingsSlider}
          disabled={!musicOn} // Disable slider if music is off
        />
      </div>

      {/* Sound Volume */}
      <div className={styles.settingsSliderContainer}>
        <label htmlFor="sound-volume" className={styles.settingsSliderLabel}>
          Sound Volume: {Math.round(soundVolume * 100)}%
        </label>
        <input
          type="range"
          id="sound-volume"
          min="0"
          max="1"
          step="0.01"
          value={soundVolume}
          onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
          className={styles.settingsSlider}
          disabled={!soundOn} // Disable slider if sound is off
        />
      </div>

       {/* Music On/Off Toggle */}
       <div className={styles.settingsToggleContainer}>
           <span className={styles.textLabel}>Music On</span>
           <label className={styles.toggleSwitch}>
               <input
                 type="checkbox"
                 checked={musicOn}
                 onChange={() => setMusicOn(!musicOn)}
               />
               <span className={styles.toggleSlider}></span>
           </label>
       </div>

       {/* Sound On/Off Toggle */}
       <div className={styles.settingsToggleContainer}>
           <span className={styles.textLabel}>Sound On</span>
           <label className={styles.toggleSwitch}>
               <input
                 type="checkbox"
                 checked={soundOn}
                 onChange={() => setSoundOn(!soundOn)}
               />
               <span className={styles.toggleSlider}></span>
           </label>
       </div>

      {/* Optional: Close button within the panel */}
      {/* <button onClick={onClose} className="...">Close</button> */}

    </div>
  );
};

export default GameSettingsPanel; 