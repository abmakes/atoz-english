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
 * 
 * This is a port from the PixiJS version that used Howler.js, now using
 * Phaser's native audio capabilities while maintaining the same interface.
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
  /** Base path for sound assets, relative to /public */
  private soundsBasePath: string = '/audio/default/'; // Default path
  
  /** The ID of the sound definition currently playing as music */
  private currentMusicId: string | null = null;
  /** The specific playback instance for the current music */
  private currentMusicSound: Phaser.Sound.BaseSound | null = null;

  constructor(
    private eventBus: EventBus,
    private storageManager: StorageManager,
    private scene: Phaser.Scene, // Phaser scene for audio context
    soundsBasePath?: string, // Make optional for backward compatibility or default theme
    initialMusicMuted?: boolean, // <-- Add optional initial state param
    initialSfxMuted?: boolean    // <-- Add optional initial state param
  ) {
    // Load settings *first* as a fallback
    this.loadSettings();

    // Override with initial states if provided
    if (initialMusicMuted !== undefined) {
      this.isMusicMuted = initialMusicMuted;
    }
    if (initialSfxMuted !== undefined) {
      this.isSfxMuted = initialSfxMuted;
    }

    // Use provided base path or default
    if (soundsBasePath) {
        this.soundsBasePath = soundsBasePath;
    }
    
    console.log(`AudioManager initialized with sounds base path: ${this.soundsBasePath}`);
    console.log('AudioManager initial state:', { 
      volume: this.globalVolume, 
      musicMuted: this.isMusicMuted, 
      sfxMuted: this.isSfxMuted 
    });

    // Save the potentially overridden initial state back to storage
    this.saveSettings(); 
  }

  /**
   * Load audio settings from storage
   */
  private loadSettings(): void {
    const settings = this.storageManager.get<AudioSettings>(AudioManager.STORAGE_KEY);
    if (settings) {
      this.globalVolume = settings.volume ?? 1.0;
      this.isMusicMuted = settings.musicMuted ?? false;
      this.isSfxMuted = settings.sfxMuted ?? false;
    } else {
      // If no settings found, initialize with defaults
      this.globalVolume = 1.0;
      this.isMusicMuted = false;
      this.isSfxMuted = false;
    }
    console.log('Loaded audio settings:', { 
      volume: this.globalVolume, 
      musicMuted: this.isMusicMuted, 
      sfxMuted: this.isSfxMuted 
    });
  }

  /**
   * Save current audio settings to storage
   */
  private saveSettings(): void {
    this.storageManager.set(AudioManager.STORAGE_KEY, {
      volume: this.globalVolume,
      musicMuted: this.isMusicMuted,
      sfxMuted: this.isSfxMuted
    });
    console.log('Saved audio settings:', { 
      volume: this.globalVolume, 
      musicMuted: this.isMusicMuted, 
      sfxMuted: this.isSfxMuted 
    });
  }

  /**
   * Register a new sound with the audio manager
   * @param config Configuration for the sound to register
   * @returns The created Phaser sound instance
   */
  public registerSound(config: AudioConfig): Phaser.Sound.BaseSound {
    if (this.sounds.has(config.id)) {
      console.warn(`Sound with id ${config.id} already registered. Returning existing instance.`);
      // Ensure we return the Phaser sound instance, not the stored object
      return this.sounds.get(config.id)!.sound; 
    }

    // Construct the full path using the base path and filename
    // Ensure paths are joined correctly (e.g., handle leading/trailing slashes)
    const fullSrc = `${this.soundsBasePath.replace(/\/$/, '')}/${config.filename.replace(/^\//, '')}`;
    console.log(`Registering sound ${config.id} with path: ${fullSrc}`);

    // Create Phaser sound based on type
    let sound: Phaser.Sound.BaseSound;
    
    if (config.type === 'music') {
      sound = this.scene.sound.add(config.id, {
        url: fullSrc,
        loop: config.loop ?? false,
        volume: (config.volume ?? 1.0) * this.globalVolume,
        preload: config.preload ?? true
      });
    } else {
      // SFX
      sound = this.scene.sound.add(config.id, {
        url: fullSrc,
        loop: config.loop ?? false,
        volume: (config.volume ?? 1.0) * this.globalVolume,
        preload: config.preload ?? true
      });
    }

    // Store the Phaser sound instance and its type
    this.sounds.set(config.id, { sound: sound, type: config.type }); 
    return sound;
  }

  /**
   * Play a registered sound
   * @param id The ID of the sound to play
   * @param sprite Optional sprite name if using audio sprites
   * @returns The sound instance for controlling playback, or null if sound not found or muted
   */
  public play(id: string, sprite?: string): Phaser.Sound.BaseSound | null {
    const soundData = this.sounds.get(id);
    if (!soundData) {
      console.warn(`No sound registered with id: ${id}`);
      return null;
    }

    // Handle Music Playback
    if (soundData.type === 'music') {
      // Stop previous music if different
      if (this.currentMusicId && this.currentMusicId !== id) {
           this.stop(this.currentMusicId);
      }
      
      // Check if already playing this exact instance
      if (this.currentMusicId === id && this.currentMusicSound && this.currentMusicSound.isPlaying) {
          console.log(`Music sound '${id}' is already playing.`);
          return this.currentMusicSound; // Return existing playing instance
      }

      // If globally muted, don't start new music
      if (this.isMusicMuted) {
          console.log(`Cannot play music sound '${id}' - Music is globally muted.`);
          this.currentMusicId = id; // Still track it as the intended music
          this.currentMusicSound = null; // But no active playing instance
          return null;
      }

      console.log(`Playing music sound: ${id}`);
      soundData.sound.play();
      
      // Track the new music
      this.currentMusicId = id;
      this.currentMusicSound = soundData.sound;

      // Apply the current mute state *immediately* to this instance
      soundData.sound.setMute(this.isMusicMuted);
      
      return soundData.sound;

    // Handle SFX Playback
    } else { 
      if (this.isSfxMuted) {
        console.log(`SFX sound '${id}' muted.`);
        return null;
      }
      console.log(`Playing SFX sound: ${id}`);
      soundData.sound.play();
      return soundData.sound;
    }
  }

  /**
   * Stop a specific sound
   * @param id The ID of the sound to stop
   */
  public stop(id: string): void {
    const soundData = this.sounds.get(id);
    if (soundData) {
      console.log(`Stopping sound: ${id}`);
      
      // If stopping the currently tracked music instance
      if (id === this.currentMusicId) {
          console.log(`   -> Clearing tracked music ID: ${this.currentMusicId}`);
          this.currentMusicId = null;
          this.currentMusicSound = null;
      }
      
      // Stop the actual sound
      soundData.sound.stop();
    } else {
        console.warn(`Cannot stop sound: ID '${id}' not found.`);
    }
  }

  /**
   * Stop all currently playing sounds
   */
  public stopAll(): void {
    console.log("Stopping all sounds");
    // Stop all registered sounds
    this.sounds.forEach((soundData, id) => {
        console.log(`Stopping sound: ${id}`);
        soundData.sound.stop();
    });
    // Clear tracked music state
    this.currentMusicId = null; 
    this.currentMusicSound = null;
  }

  /**
   * Set the volume for a specific sound
   * @param id The ID of the sound
   * @param volume Volume level (0.0 to 1.0)
   */
  public setVolume(id: string, volume: number): void {
    const soundData = this.sounds.get(id);
    if (soundData) {
      soundData.sound.setVolume(volume * this.globalVolume);
    }
  }

  /**
   * Set the global volume level for all sounds
   * @param volume Volume level (0.0 to 1.0)
   */
  public setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    // Update all registered sounds with new global volume
    this.sounds.forEach((soundData) => {
      const originalVolume = soundData.sound.volume / (this.globalVolume || 1); // Get original volume
      soundData.sound.setVolume(originalVolume * this.globalVolume);
    });
    this.saveSettings();
  }

  /**
   * Get the current global volume level
   * @returns The current global volume (0.0 to 1.0)
   */
  public getGlobalVolume(): number {
    return this.globalVolume;
  }

  /**
   * Mute/unmute music tracks.
   * @param muted Whether music should be muted.
   */
  public setMusicMuted(muted: boolean): void {
    if (this.isMusicMuted !== muted) {
      this.isMusicMuted = muted;
      console.log(`Setting global Music Mute: ${muted}.`);

      // Apply mute state to the currently playing music instance, if any
      if (this.currentMusicId && this.currentMusicSound) {
        console.log(`   -> Applying mute(${muted}) to music instance: ${this.currentMusicId}`);
        this.currentMusicSound.setMute(muted);
      } else {
         console.log(`   -> No tracked music instance (${this.currentMusicId}) to apply mute state to.`);
      }
      
      // If unmuting, and we *have* a currentMusicId but *no* playing instance
      // (meaning play() was called while muted), try to start it now.
      if (!muted && this.currentMusicId && (!this.currentMusicSound || !this.currentMusicSound.isPlaying)) {
         console.log(`   -> Music was unmuted, attempting to play intended music: ${this.currentMusicId}`);
         this.play(this.currentMusicId); // This will handle checks and potentially start playback
      }

      this.saveSettings();
    } else {
        console.log(`Global Music Mute already set to: ${muted}. No change.`);
    }
  }

  /**
   * Check if music is currently muted.
   * @returns Whether music is muted.
   */
  public getIsMusicMuted(): boolean {
    return this.isMusicMuted;
  }

  /**
   * Mute/unmute sound effects.
   * @param muted Whether SFX should be muted.
   */
  public setSfxMuted(muted: boolean): void {
    if (this.isSfxMuted !== muted) {
      this.isSfxMuted = muted;
      console.log(`SFX ${muted ? 'muted' : 'unmuted'}.`);
      // Stop currently playing SFX if muted
      if (muted) {
        this.sounds.forEach((soundData) => {
          if (soundData.type === 'sfx') {
            soundData.sound.stop();
          }
        });
      }
      this.saveSettings();
    }
  }

  /**
   * Check if sound effects are currently muted.
   * @returns Whether SFX are muted.
   */
  public getIsSfxMuted(): boolean {
    return this.isSfxMuted;
  }

  /**
   * Unload and destroy a registered sound
   * @param id The ID of the sound to unload
   */
  public unregisterSound(id: string): void {
    const soundData = this.sounds.get(id);
    if (soundData) {
      soundData.sound.destroy();
      this.sounds.delete(id);
    }
  }

  /**
   * Clean up all sounds and reset the manager
   */
  public destroy(): void {
    console.log('Destroying AudioManager...');
    // Use stopAll to clear state
    this.stopAll(); 
    // Unload all sounds
    this.sounds.forEach((soundData, id) => {
         console.log(`   -> Destroying sound: ${id}`);
         soundData.sound.destroy();
    });
    this.sounds.clear();
    this.currentMusicId = null;
    this.currentMusicSound = null;
    console.log('AudioManager destroyed.');
  }
}
