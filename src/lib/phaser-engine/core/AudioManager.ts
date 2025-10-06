import { Scene } from 'phaser';
import { EventBus } from './EventBus';
import { StorageManager } from './StorageManager';

/** Type definition for sound categories */
export type SoundType = 'music' | 'sfx';

/**
 * Configuration for a sound effect or music track
 */
export interface AudioConfig {
  /** Unique identifier for the sound */
  id: string;
  /** Filename of the audio file (e.g., 'correct-sound.mp3') */
  filename: string;
  /** Type of the sound */
  type: SoundType;
  /** Whether the sound should loop (default: false) */
  loop?: boolean;
  /** Initial volume for this specific sound (0.0 to 1.0) */
  volume?: number;
  /** Whether to preload the sound (default: true) */
  preload?: boolean;
  /** Audio sprite configuration if using sprites */
  sprite?: Record<string, [number, number]>;
}

/**
 * Stored audio settings structure
 */
interface AudioSettings {
  volume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
}

/**
 * Manages audio playback using Phaser's audio system for the game engine.
 * This is a port from the PixiJS version that used Howler.js.
 */
export class AudioManager {
  /** Map of registered sounds with their types */
  private sounds: Map<string, { sound: Phaser.Sound.BaseSound; type: SoundType }> = new Map();
  /** Global volume setting (0.0 to 1.0) */
  private globalVolume: number = 1.0;
  /** Whether music is currently muted */
  private isMusicMuted: boolean = false;
  /** Whether sound effects are currently muted */
  private isSfxMuted: boolean = false;
  /** Storage key for audio settings */
  private static readonly STORAGE_KEY = 'audio_settings';
  /** Base path for audio files */
  private basePath: string;
  /** Event bus for audio events */
  private eventBus: EventBus;
  /** Storage manager for persisting settings */
  private storageManager: StorageManager;
  /** Phaser scene for audio context */
  private scene: Scene | null = null;

  /**
   * Creates an instance of AudioManager.
   * @param {EventBus} eventBus - The central event bus for emitting audio events.
   * @param {StorageManager} storageManager - Storage manager for persisting audio settings.
   * @param {string} basePath - Base path for audio files.
   * @param {boolean} initialMusicMuted - Initial music muted state.
   * @param {boolean} initialSfxMuted - Initial SFX muted state.
   */
  constructor(
    eventBus: EventBus,
    storageManager: StorageManager,
    basePath: string,
    initialMusicMuted: boolean = false,
    initialSfxMuted: boolean = false
  ) {
    this.eventBus = eventBus;
    this.storageManager = storageManager;
    this.basePath = basePath;
    this.isMusicMuted = initialMusicMuted;
    this.isSfxMuted = initialSfxMuted;
    
    // Load saved settings
    this.loadSettings();
    
    console.log('AudioManager initialized with base path:', basePath);
  }

  /**
   * Sets the Phaser scene for audio context.
   * @param {Scene} scene - The Phaser scene.
   */
  public setScene(scene: Scene): void {
    this.scene = scene;
    console.log('AudioManager: Scene set for audio context');
  }

  /**
   * Registers a sound with the audio manager.
   * @param {AudioConfig} config - The audio configuration.
   * @throws {Error} If the sound ID already exists or if scene is not set.
   */
  public registerSound(config: AudioConfig): void {
    if (this.sounds.has(config.id)) {
      throw new Error(`Sound with ID '${config.id}' is already registered`);
    }

    if (!this.scene) {
      throw new Error('Scene must be set before registering sounds');
    }

    const fullPath = `${this.basePath}${config.filename}`;
    
    try {
      // Load the sound using Phaser's audio system
      this.scene.load.audio(config.id, fullPath);
      
      // Create a placeholder sound object that will be replaced when loaded
      const sound = {
        id: config.id,
        type: config.type,
        volume: config.volume || 1.0,
        loop: config.loop || false,
        loaded: false
      } as any;

      this.sounds.set(config.id, { sound, type: config.type });
      
      console.log(`AudioManager: Registered sound '${config.id}' from '${fullPath}'`);
    } catch (error) {
      console.error(`AudioManager: Failed to register sound '${config.id}':`, error);
      throw error;
    }
  }

  /**
   * Plays a registered sound.
   * @param {string} soundId - The ID of the sound to play.
   * @param {number} [volume] - Optional volume override (0.0 to 1.0).
   * @returns {boolean} True if the sound was played successfully, false otherwise.
   */
  public playSound(soundId: string, volume?: number): boolean {
    const soundData = this.sounds.get(soundId);
    if (!soundData) {
      console.warn(`AudioManager: Sound '${soundId}' not found`);
      return false;
    }

    // Check if sound type is muted
    if ((soundData.type === 'music' && this.isMusicMuted) || 
        (soundData.type === 'sfx' && this.isSfxMuted)) {
      return false;
    }

    if (!this.scene) {
      console.warn('AudioManager: Scene not set, cannot play sound');
      return false;
    }

    try {
      // Get the actual Phaser sound object
      const phaserSound = this.scene.sound.get(soundId);
      if (!phaserSound) {
        console.warn(`AudioManager: Sound '${soundId}' not loaded in scene`);
        return false;
      }

      // Set volume
      const finalVolume = (volume !== undefined ? volume : soundData.sound.volume || 1.0) * this.globalVolume;
      phaserSound.setVolume(finalVolume);

      // Play the sound
      phaserSound.play();
      
      console.log(`AudioManager: Playing sound '${soundId}' at volume ${finalVolume}`);
      return true;
    } catch (error) {
      console.error(`AudioManager: Failed to play sound '${soundId}':`, error);
      return false;
    }
  }

  /**
   * Stops a playing sound.
   * @param {string} soundId - The ID of the sound to stop.
   * @returns {boolean} True if the sound was stopped successfully, false otherwise.
   */
  public stopSound(soundId: string): boolean {
    if (!this.scene) {
      console.warn('AudioManager: Scene not set, cannot stop sound');
      return false;
    }

    try {
      const phaserSound = this.scene.sound.get(soundId);
      if (phaserSound && phaserSound.isPlaying) {
        phaserSound.stop();
        console.log(`AudioManager: Stopped sound '${soundId}'`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`AudioManager: Failed to stop sound '${soundId}':`, error);
      return false;
    }
  }

  /**
   * Stops all sounds of a specific type.
   * @param {SoundType} type - The type of sounds to stop.
   */
  public stopAllSounds(type?: SoundType): void {
    if (!this.scene) {
      console.warn('AudioManager: Scene not set, cannot stop sounds');
      return;
    }

    try {
      if (type) {
        // Stop sounds of specific type
        this.sounds.forEach((soundData, soundId) => {
          if (soundData.type === type) {
            const phaserSound = this.scene!.sound.get(soundId);
            if (phaserSound && phaserSound.isPlaying) {
              phaserSound.stop();
            }
          }
        });
        console.log(`AudioManager: Stopped all ${type} sounds`);
      } else {
        // Stop all sounds
        this.scene.sound.stopAll();
        console.log('AudioManager: Stopped all sounds');
      }
    } catch (error) {
      console.error('AudioManager: Failed to stop sounds:', error);
    }
  }

  /**
   * Sets the global volume for all sounds.
   * @param {number} volume - Volume level (0.0 to 1.0).
   */
  public setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
    console.log(`AudioManager: Global volume set to ${this.globalVolume}`);
  }

  /**
   * Gets the current global volume.
   * @returns {number} The current global volume (0.0 to 1.0).
   */
  public getGlobalVolume(): number {
    return this.globalVolume;
  }

  /**
   * Sets whether music is muted.
   * @param {boolean} muted - True to mute music, false to unmute.
   */
  public setMusicMuted(muted: boolean): void {
    this.isMusicMuted = muted;
    this.saveSettings();
    
    if (muted) {
      this.stopAllSounds('music');
    }
    
    console.log(`AudioManager: Music ${muted ? 'muted' : 'unmuted'}`);
  }

  /**
   * Gets whether music is muted.
   * @returns {boolean} True if music is muted, false otherwise.
   */
  public isMusicMuted(): boolean {
    return this.isMusicMuted;
  }

  /**
   * Sets whether sound effects are muted.
   * @param {boolean} muted - True to mute SFX, false to unmute.
   */
  public setSfxMuted(muted: boolean): void {
    this.isSfxMuted = muted;
    this.saveSettings();
    
    if (muted) {
      this.stopAllSounds('sfx');
    }
    
    console.log(`AudioManager: SFX ${muted ? 'muted' : 'unmuted'}`);
  }

  /**
   * Gets whether sound effects are muted.
   * @returns {boolean} True if SFX are muted, false otherwise.
   */
  public isSfxMuted(): boolean {
    return this.isSfxMuted;
  }

  /**
   * Loads audio settings from storage.
   */
  private loadSettings(): void {
    try {
      const settings = this.storageManager.getItem<AudioSettings>(AudioManager.STORAGE_KEY);
      if (settings) {
        this.globalVolume = settings.volume;
        this.isMusicMuted = settings.musicMuted;
        this.isSfxMuted = settings.sfxMuted;
        console.log('AudioManager: Settings loaded from storage');
      }
    } catch (error) {
      console.warn('AudioManager: Failed to load settings from storage:', error);
    }
  }

  /**
   * Saves audio settings to storage.
   */
  private saveSettings(): void {
    try {
      const settings: AudioSettings = {
        volume: this.globalVolume,
        musicMuted: this.isMusicMuted,
        sfxMuted: this.isSfxMuted
      };
      this.storageManager.setItem(AudioManager.STORAGE_KEY, settings);
    } catch (error) {
      console.warn('AudioManager: Failed to save settings to storage:', error);
    }
  }

  /**
   * Gets information about a registered sound.
   * @param {string} soundId - The ID of the sound.
   * @returns {AudioConfig | null} The sound configuration or null if not found.
   */
  public getSoundInfo(soundId: string): AudioConfig | null {
    const soundData = this.sounds.get(soundId);
    if (!soundData) {
      return null;
    }

    return {
      id: soundId,
      filename: '', // We don't store the filename in the sound data
      type: soundData.type,
      volume: soundData.sound.volume || 1.0,
      loop: soundData.sound.loop || false
    };
  }

  /**
   * Gets all registered sound IDs.
   * @returns {string[]} Array of registered sound IDs.
   */
  public getRegisteredSounds(): string[] {
    return Array.from(this.sounds.keys());
  }

  /**
   * Cleans up resources used by the AudioManager.
   */
  public destroy(): void {
    console.log('AudioManager: Destroying...');
    
    // Stop all sounds
    this.stopAllSounds();
    
    // Clear sounds map
    this.sounds.clear();
    
    // Clear scene reference
    this.scene = null;
    
    console.log('AudioManager: Destroyed');
  }
}