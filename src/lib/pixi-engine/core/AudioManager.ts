import { Howl, Howler } from 'howler';
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
 * Manages audio playback using Howler.js for the game engine
 */
export class AudioManager {
  /** Map of registered sounds with their types */
  private sounds: Map<string, { sound: Howl; type: SoundType }> = new Map();
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
  /** The specific playback instance ID returned by Howler for the current music */
  private currentMusicPlayingId: number | null = null;

  constructor(
    private eventBus: EventBus,
    private storageManager: StorageManager,
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

    // Apply initial global volume
    Howler.volume(this.globalVolume);
    // Muting is handled internally now

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
   * @returns The created Howl instance
   */
  public registerSound(config: AudioConfig): Howl {
    if (this.sounds.has(config.id)) {
      console.warn(`Sound with id ${config.id} already registered. Returning existing instance.`);
      // Ensure we return the Howl instance, not the stored object
      return this.sounds.get(config.id)!.sound; 
    }

    // Construct the full path using the base path and filename
    // Ensure paths are joined correctly (e.g., handle leading/trailing slashes)
    const fullSrc = `${this.soundsBasePath.replace(/\/$/, '')}/${config.filename.replace(/^\//, '')}`;
    console.log(`Registering sound ${config.id} with path: ${fullSrc}`);

    const sound = new Howl({
      src: [fullSrc], // Use the constructed full path
      loop: config.loop ?? false,
      volume: (config.volume ?? 1.0) * this.globalVolume,
      preload: config.preload ?? true,
      sprite: config.sprite
    });

    // Store the Howl instance and its type
    this.sounds.set(config.id, { sound: sound, type: config.type }); 
    return sound;
  }

  /**
   * Play a registered sound
   * @param id The ID of the sound to play
   * @param sprite Optional sprite name if using audio sprites
   * @returns The sound ID for controlling playback, or null if sound not found or muted
   */
  public play(id: string, sprite?: string): number | null {
    const soundData = this.sounds.get(id);
    if (!soundData) {
      console.warn(`No sound registered with id: ${id}`);
      return null;
    }

    // Handle Music Playback
    if (soundData.type === 'music') {
      // Stop previous music if different or restarting
      if (this.currentMusicId && (this.currentMusicId !== id || !soundData.sound.playing(this.currentMusicPlayingId ?? undefined))) {
           this.stop(this.currentMusicId, this.currentMusicPlayingId ?? undefined);
      }
      
      // Check if already playing this exact instance
      if (this.currentMusicId === id && this.currentMusicPlayingId !== null && soundData.sound.playing(this.currentMusicPlayingId)) {
          console.log(`Music sound '${id}' is already playing (instance: ${this.currentMusicPlayingId}).`);
          return this.currentMusicPlayingId; // Return existing playing ID
      }

      // If globally muted, don't start new music
      if (this.isMusicMuted) {
          console.log(`Cannot play music sound '${id}' - Music is globally muted.`);
          this.currentMusicId = id; // Still track it as the intended music
          this.currentMusicPlayingId = null; // But no active playing instance
          return null;
      }

      console.log(`Playing music sound: ${id}`);
      const playingId = soundData.sound.play(sprite);
      
      // Track the new music
      this.currentMusicId = id;
      this.currentMusicPlayingId = playingId;

      // Apply the current mute state *immediately* to this instance
      // This shouldn't be needed if we checked isMusicMuted above, but belt-and-suspenders
      soundData.sound.mute(this.isMusicMuted, playingId);
      
      return playingId;

    // Handle SFX Playback
    } else { 
      if (this.isSfxMuted) {
        console.log(`SFX sound '${id}' muted.`);
        return null;
      }
      console.log(`Playing SFX sound: ${id}`);
      return soundData.sound.play(sprite);
    }
  }

  /**
   * Stop a specific sound or sprite
   * @param id The ID of the sound to stop
   * @param soundId Optional specific sound instance ID to stop
   */
  public stop(id: string, soundId?: number): void {
    const soundData = this.sounds.get(id);
    if (soundData) {
      console.log(`Stopping sound: ${id}${soundId !== undefined ? ` (instance: ${soundId})` : ''}`);
      
      // If stopping the currently tracked music instance
      if (id === this.currentMusicId && (soundId === undefined || soundId === this.currentMusicPlayingId)) {
          console.log(`   -> Clearing tracked music ID: ${this.currentMusicId} / ${this.currentMusicPlayingId}`);
          this.currentMusicId = null;
          this.currentMusicPlayingId = null;
      }
      
      // Stop the actual sound instance(s)
      if (soundId !== undefined) {
        soundData.sound.stop(soundId);
      } else {
        soundData.sound.stop(); // Stops all instances of this sound ID
         // If stopping all instances, ensure tracked ID is cleared if it matches
         if (id === this.currentMusicId) {
            this.currentMusicId = null;
            this.currentMusicPlayingId = null;
        }
      }
    } else {
        console.warn(`Cannot stop sound: ID '${id}' not found.`);
    }
  }

  /**
   * Stop all currently playing sounds
   */
  public stopAll(): void {
    console.log("Stopping all sounds via Howler.stop()");
    // Use Howler's global stop, which should trigger stop events if needed
    Howler.stop(); 
    // Clear tracked music state
    this.currentMusicId = null; 
    this.currentMusicPlayingId = null;
    // Note: Howler.stop() stops everything. We might need more granular control
    // if we only want to stop *our* managed sounds, but this is simpler for now.
    // Alternative: Iterate this.sounds and call stop() on each.
    // this.sounds.forEach((soundData, id) => {
    //     console.log(`Stopping sound: ${id}`);
    //     soundData.sound.stop();
    // });
    // this.currentMusicId = null;
    // this.currentMusicPlayingId = null;
  }

  /**
   * Set the volume for a specific sound
   * @param id The ID of the sound
   * @param volume Volume level (0.0 to 1.0)
   */
  public setVolume(id: string, volume: number): void {
    const soundData = this.sounds.get(id);
    if (soundData) {
      soundData.sound.volume(volume * this.globalVolume);
    }
  }

  /**
   * Set the global volume level for all sounds
   * @param volume Volume level (0.0 to 1.0)
   */
  public setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.globalVolume);
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
      if (this.currentMusicId && this.currentMusicPlayingId !== null) {
        const soundData = this.sounds.get(this.currentMusicId);
        if (soundData) {
            console.log(`   -> Applying mute(${muted}) to music instance: ${this.currentMusicId} / ${this.currentMusicPlayingId}`);
            soundData.sound.mute(muted, this.currentMusicPlayingId);
        } else {
             console.warn(`   -> Could not find Howl instance for tracked music ID ${this.currentMusicId} to apply mute state.`);
        }
      } else {
         console.log(`   -> No tracked music instance (${this.currentMusicId} / ${this.currentMusicPlayingId}) to apply mute state to.`);
      }
      
      // If unmuting, and we *have* a currentMusicId but *no* playing instance
      // (meaning play() was called while muted), try to start it now.
      if (!muted && this.currentMusicId && this.currentMusicPlayingId === null) {
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
      soundData.sound.unload();
      this.sounds.delete(id);
    }
  }

  /**
   * Clean up all sounds and reset the manager
   */
  public destroy(): void {
    console.log('Destroying AudioManager...');
    // Use stopAll to clear Howler state and our tracked state
    this.stopAll(); 
    // Unload all sounds
    this.sounds.forEach((soundData, id) => {
         console.log(`   -> Unloading sound: ${id}`);
         soundData.sound.unload();
    });
    this.sounds.clear();
    this.currentMusicId = null;
    this.currentMusicPlayingId = null;
    console.log('AudioManager destroyed.');
    // No need to reset Howler global volume here, as it persists across instances
  }
} 