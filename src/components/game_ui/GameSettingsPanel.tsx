'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/styles/themes/themes.module.css';
import type { EventBus } from '@/lib/pixi-engine/core/EventBus'; // Import EventBus type
import { SETTINGS_EVENTS } from '@/lib/pixi-engine/core/EventTypes'; // Import settings events

// Import Shadcn UI components
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const AUDIO_SETTINGS_STORAGE_KEY = 'pixi-engine/audio_settings'; // Use the prefixed key

/** Structure of stored settings */
interface StoredAudioSettings {
  volume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
}

// Define props interface
interface GameSettingsPanelProps {
  /** Whether the settings panel is currently visible. */
  isOpen: boolean;
  /** Callback function to close the settings panel. */
  onClose: () => void;
  /** Optional additional CSS class names. */
  className?: string;
  /** The EventBus instance to emit settings changes. */
  eventBus: EventBus; // Use EventBus type
}

/**
 * A panel component for adjusting game settings like music and sound volume/toggles.
 * Typically displayed as an overlay during gameplay.
 */
const GameSettingsPanel = ({
  isOpen,
  onClose,
  className = '',
  eventBus,
}: GameSettingsPanelProps) => {
  // --- State Management ---
  // Initialize state from localStorage or defaults
  const [globalVolume, setGlobalVolume] = useState(1.0);
  // Separate mute states
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to load initial state from localStorage once on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings) as StoredAudioSettings;
        setGlobalVolume(settings.volume ?? 1.0);
        // Load separate states
        setMusicMuted(settings.musicMuted ?? false);
        setSfxMuted(settings.sfxMuted ?? false);
      }
    } catch (error) {
      console.error("Error reading audio settings from localStorage:", error);
      // Use defaults if parsing fails
      setGlobalVolume(1.0);
      // Set separate defaults
      setMusicMuted(false);
      setSfxMuted(false);
    }
    setIsInitialized(true); // Mark as initialized after attempting to load
  }, [eventBus]); // Include eventBus in dependency array if used inside effect

  // --- Event Handlers ---
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setGlobalVolume(newVolume);
    eventBus?.emit(SETTINGS_EVENTS.SET_GLOBAL_VOLUME, newVolume);
    console.log(`Settings: Global Volume Changed - Volume: ${newVolume.toFixed(2)}`);
  };

  const handleMusicMuteToggle = (checked: boolean) => {
    const newMuted = !checked;
    setMusicMuted(newMuted);
    eventBus?.emit(SETTINGS_EVENTS.SET_MUSIC_MUTED, newMuted);
    console.log(`Settings: Music Mute Toggled - Music Muted: ${newMuted}`);
  };
  
  const handleSfxMuteToggle = (checked: boolean) => {
    const newMuted = !checked;
    setSfxMuted(newMuted);
    eventBus?.emit(SETTINGS_EVENTS.SET_SFX_MUTED, newMuted);
    console.log(`Settings: SFX Mute Toggled - SFX Muted: ${newMuted}`);
  };

  // --- Local Storage Sync ---
  useEffect(() => {
    if (isInitialized) {
      try {
        const settings: StoredAudioSettings = {
          volume: globalVolume,
          musicMuted,
          sfxMuted,
        };
        localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error("Error saving audio settings to localStorage:", error);
      }
    }
  }, [globalVolume, musicMuted, sfxMuted, isInitialized]);

  // --- Rendering --- 
  if (!isOpen || !isInitialized) { // Don't render until initialized
    return null;
  }

  // Simplified: Using one volume slider and one mute toggle for global settings
  // TODO: Split into Music/Sound FX later if AudioManager supports it

  return (
    <div className={`${styles.settingsPanel} ${className}`} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <h3 id="settings-title" className={styles.settingsPanelTitle}>Audio Settings</h3>

      {/* Global Volume Slider - Using Shadcn Slider and Label */}
      <div className={styles.settingsSliderContainer}>
        <Label htmlFor="global-volume" className={styles.settingsSliderLabel}>
          Volume: {Math.round(globalVolume * 100)}%
        </Label>
        <Slider
          id="global-volume"
          min={0}
          max={1}
          step={0.01}
          value={[globalVolume]} // Slider expects an array
          onValueChange={handleVolumeChange} // Use onValueChange
          className={styles.settingsSlider} // Keep theme slider style for now
          disabled={musicMuted && sfxMuted}
        />
      </div>

       {/* Music Mute Toggle - Using Shadcn Switch and Label */}
       <div className={`${styles.settingsToggleContainer} flex items-center justify-between`}>
           <Label htmlFor="music-mute" className="flex-grow mr-2">Music</Label>
           <Switch
               id="music-mute"
               checked={!musicMuted}
               onCheckedChange={handleMusicMuteToggle}
           />
       </div>

       {/* SFX Mute Toggle - Using Shadcn Switch and Label */}
       <div className={`${styles.settingsToggleContainer} flex items-center justify-between`}>
           <Label htmlFor="sfx-mute" className="flex-grow mr-2">Sound Effects</Label>
           <Switch
               id="sfx-mute"
               checked={!sfxMuted}
               onCheckedChange={handleSfxMuteToggle}
           />
       </div>

       {/* Add a close button */}
       <button
         onClick={onClose}
         className={`${styles.button} ${styles.buttonSecondary} mt-4`} // Reuse existing theme button styles
         aria-label="Close settings"
       >
         Close
       </button>

    </div>
  );
};

export default GameSettingsPanel; 