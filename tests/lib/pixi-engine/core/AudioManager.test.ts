import { AudioManager, AudioConfig } from '../../../../src/lib/pixi-engine/core/AudioManager';
import { EventBus } from '../../../../src/lib/pixi-engine/core/EventBus';
import { StorageManager } from '../../../../src/lib/pixi-engine/core/StorageManager';
import { Howl, Howler } from 'howler';

// Define a custom type for our extended mock instance
type MockHowlWithSources = jest.Mocked<Howl> & { _test_sources_: string[] };

// Keep track of mocked Howl instances using the custom type
let mockHowlInstances: MockHowlWithSources[] = [];

// Mock Howler.js
jest.mock('howler', () => {
	// Define a more complete mock for Howl instance properties/methods
	const mockHowlInstance = {
		play: jest.fn().mockReturnValue(1),
		stop: jest.fn(),
		volume: jest.fn(),
		unload: jest.fn(),
		mute: jest.fn(),
		playing: jest.fn().mockReturnValue(false),
		pause: jest.fn(),
		fade: jest.fn(),
		rate: jest.fn(),
		seek: jest.fn(),
		loop: jest.fn(),
		state: jest.fn().mockReturnValue('unloaded'),
		duration: jest.fn().mockReturnValue(0),
		on: jest.fn(),
		once: jest.fn(),
		off: jest.fn(),
		pannerAttr: jest.fn(),
		stereo: jest.fn(),
		pos: jest.fn(),
		orientation: jest.fn(),
		stereo_INTERNAL: jest.fn(),
		pos_INTERNAL: jest.fn(),
		orientation_INTERNAL: jest.fn(),
		volume_INTERNAL: jest.fn(),
		loop_INTERNAL: jest.fn(),
		rate_INTERNAL: jest.fn(),
		seek_INTERNAL: jest.fn(),
		_test_sources_: [] as string[],
	};

	// Mock the Howl constructor
	const MockHowl = jest.fn().mockImplementation((config) => {
		const newInstance = { ...mockHowlInstance };
		newInstance._test_sources_ = config?.src ?? [];
		mockHowlInstances.push(newInstance as unknown as MockHowlWithSources);
		return newInstance;
	});
	// Mock the global Howler object
	const MockHowler = {
		volume: jest.fn(),
		mute: jest.fn(),
		stop: jest.fn(), // Add the stop mock method
	};
	return {
		Howl: MockHowl,
		Howler: MockHowler,
	};
});

// Get typed references to the mocked global Howler object
const MockedHowler = Howler as jest.Mocked<typeof Howler>;

describe('AudioManager', () => {
	let audioManager: AudioManager;
	let eventBus: EventBus;
	let storageManager: StorageManager;
	let mockStorage: Record<string, unknown> = {};

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();
		mockHowlInstances = []; // Clear tracked instances
		mockStorage = {};

		// Create fresh instances
		eventBus = new EventBus();
		storageManager = new StorageManager();

		// Mock StorageManager methods
		jest.spyOn(storageManager, 'get').mockImplementation((key) => mockStorage[key]);
		jest.spyOn(storageManager, 'set').mockImplementation((key, value) => {
			mockStorage[key] = value;
		});

		// Initialize AudioManager without initial mute states for most tests
		audioManager = new AudioManager(eventBus, storageManager);
	});

	describe('Sound Registration', () => {
		it('should register a new sound', () => {
			const config: AudioConfig = {
				id: 'test-sound',
				filename: 'test.mp3',
				type: 'sfx'
			};

			const sound = audioManager.registerSound(config);
			expect(sound).toBeDefined();
			expect(Howl).toHaveBeenCalledWith(expect.objectContaining({
				src: expect.arrayContaining(['/audio/default/test.mp3']),
				loop: false,
				preload: true
			}));
		});

		it('should return existing sound if ID already registered', () => {
			const config: AudioConfig = {
				id: 'test-sound',
				filename: 'test.mp3',
				type: 'sfx'
			};

			const sound1 = audioManager.registerSound(config);
			const sound2 = audioManager.registerSound(config);

			expect(sound1).toBe(sound2);
			expect(Howl).toHaveBeenCalledTimes(1);
		});
	});

	describe('Playback Control', () => {
		let testSfxSound: MockHowlWithSources;
		let testMusicSound: MockHowlWithSources;

		beforeEach(() => {
			const sfxConfig: AudioConfig = { id: 'test-sfx', filename: 'sfx.mp3', type: 'sfx' };
			const musicConfig: AudioConfig = { id: 'test-music', filename: 'music.mp3', type: 'music' };
			audioManager.registerSound(sfxConfig);
			audioManager.registerSound(musicConfig);
			testSfxSound = mockHowlInstances.find(h => h._test_sources_.some((src: string) => src.includes('sfx.mp3')))!;
			testMusicSound = mockHowlInstances.find(h => h._test_sources_.some((src: string) => src.includes('music.mp3')))!;
			testSfxSound.play.mockClear();
			testMusicSound.play.mockClear();
			testSfxSound.stop.mockClear();
			testMusicSound.stop.mockClear();
			testMusicSound.mute.mockClear();
		});

		it('should play a registered SFX sound when SFX not muted', () => {
			audioManager.setSfxMuted(false);
			const soundId = audioManager.play('test-sfx');
			expect(testSfxSound.play).toHaveBeenCalled();
			expect(soundId).toBe(1);
		});

		it('should NOT play a registered SFX sound when SFX muted', () => {
			audioManager.setSfxMuted(true);
			const soundId = audioManager.play('test-sfx');
			expect(soundId).toBeNull();
			expect(testSfxSound.play).not.toHaveBeenCalled();
		});

		it('should play registered Music sound when Music not muted', () => {
			audioManager.setMusicMuted(false);
			const soundId = audioManager.play('test-music');
			expect(soundId).toBe(1);
			expect(testMusicSound.play).toHaveBeenCalled();
			expect(testMusicSound.mute).not.toHaveBeenCalledWith(true, 1);
		});

		it('should NOT play registered Music sound when Music muted', () => {
			audioManager.setMusicMuted(true);
			const soundId = audioManager.play('test-music');
			expect(soundId).toBeNull();
			expect(testMusicSound.play).not.toHaveBeenCalled();
		});

		it('should return null when playing unregistered sound', () => {
			const soundId = audioManager.play('non-existent');
			expect(soundId).toBeNull();
		});

		it('should stop a specific sound', () => {
			audioManager.stop('test-sfx');
			expect(testSfxSound.stop).toHaveBeenCalled();
		});

		it('should stop all sounds via Howler.stop', () => {
			audioManager.stopAll();
			expect(MockedHowler.stop).toHaveBeenCalled();
		});
	});

	describe('Volume Control', () => {
		it('should set global volume and save settings', () => {
			audioManager.setGlobalVolume(0.5);
			expect(audioManager.getGlobalVolume()).toBe(0.5);
			expect(MockedHowler.volume).toHaveBeenCalledWith(0.5);
			expect(storageManager.set).toHaveBeenCalledWith('audio_settings', expect.objectContaining({ volume: 0.5 }));
		});

		it('should clamp global volume between 0 and 1', () => {
			audioManager.setGlobalVolume(1.5);
			expect(audioManager.getGlobalVolume()).toBe(1);
			expect(MockedHowler.volume).toHaveBeenCalledWith(1);
			expect(storageManager.set).toHaveBeenCalledWith('audio_settings', expect.objectContaining({ volume: 1 }));

			audioManager.setGlobalVolume(-0.5);
			expect(audioManager.getGlobalVolume()).toBe(0);
			expect(MockedHowler.volume).toHaveBeenCalledWith(0);
			expect(storageManager.set).toHaveBeenCalledWith('audio_settings', expect.objectContaining({ volume: 0 }));
		});

		it('should set individual sound volume considering global volume', () => {
			const config: AudioConfig = { id: 'test-vol', filename: 'vol.mp3', type: 'sfx' };
			audioManager.registerSound(config);
			const sound = mockHowlInstances.find(h => h._test_sources_.some((src: string) => src.includes('vol.mp3')))!;
			audioManager.setGlobalVolume(0.5);

			audioManager.setVolume('test-vol', 0.8);
			expect(sound.volume).toHaveBeenCalledWith(0.4);
		});
	});

	describe('Mute Control', () => {
		it('should set music mute state and save', () => {
			audioManager.setMusicMuted(true);
			expect(audioManager.getIsMusicMuted()).toBe(true);
			expect(storageManager.set).toHaveBeenCalledWith('audio_settings', expect.objectContaining({ musicMuted: true }));

			audioManager.setMusicMuted(false);
			expect(audioManager.getIsMusicMuted()).toBe(false);
			expect(storageManager.set).toHaveBeenCalledWith('audio_settings', expect.objectContaining({ musicMuted: false }));
		});

		it('should set SFX mute state and save', () => {
			audioManager.setSfxMuted(true);
			expect(audioManager.getIsSfxMuted()).toBe(true);
			expect(storageManager.set).toHaveBeenCalledWith('audio_settings', expect.objectContaining({ sfxMuted: true }));

			audioManager.setSfxMuted(false);
			expect(audioManager.getIsSfxMuted()).toBe(false);
			expect(storageManager.set).toHaveBeenCalledWith('audio_settings', expect.objectContaining({ sfxMuted: false }));
		});

		it('should respect initial mute states from constructor', () => {
			const initialAudioManager = new AudioManager(eventBus, storageManager, undefined, true, false);
			expect(initialAudioManager.getIsMusicMuted()).toBe(true);
			expect(initialAudioManager.getIsSfxMuted()).toBe(false);
			expect(storageManager.set).toHaveBeenCalledWith('audio_settings', { volume: 1.0, musicMuted: true, sfxMuted: false });
		});

		it('should load initial mute state from storage if not provided in constructor', () => {
			mockStorage['audio_settings'] = { volume: 0.8, musicMuted: false, sfxMuted: true };
			const loadedAudioManager = new AudioManager(eventBus, storageManager);

			expect(loadedAudioManager.getGlobalVolume()).toBe(0.8);
			expect(loadedAudioManager.getIsMusicMuted()).toBe(false);
			expect(loadedAudioManager.getIsSfxMuted()).toBe(true);
		});

		it('should apply mute state when music is played', () => {
			const musicConfig: AudioConfig = { id: 'music-mute-test', filename: 'music-mute.mp3', type: 'music' };
			audioManager.registerSound(musicConfig);
			const musicSound = mockHowlInstances.find(h => h._test_sources_.some((src: string) => src.includes('music-mute.mp3')))!;

			audioManager.setMusicMuted(true);
			audioManager.play('music-mute-test');
			expect(musicSound.play).not.toHaveBeenCalled();

			audioManager.setMusicMuted(false);
			expect(musicSound.play).toHaveBeenCalled();
		});
	});

	describe('Cleanup', () => {
		it('should unload all sounds on destroy', () => {
			const configs: AudioConfig[] = [
				{ id: 'sound1', filename: 'test1.mp3', type: 'sfx' },
				{ id: 'sound2', filename: 'test2.mp3', type: 'music' }
			];
			configs.forEach(config => audioManager.registerSound(config));
			const initialInstances = [...mockHowlInstances];

			audioManager.destroy();

			expect(MockedHowler.stop).toHaveBeenCalled();
			expect(initialInstances).toHaveLength(2);
			initialInstances.forEach(soundMock => {
				expect(soundMock.unload).toHaveBeenCalled();
			});
		});

		it('should unload specific sound when unregistering', () => {
			const config: AudioConfig = { id: 'unregister-test', filename: 'unregister.mp3', type: 'sfx' };
			audioManager.registerSound(config);
			const sound = mockHowlInstances.find(h => h._test_sources_.some((src: string) => src.includes('unregister.mp3')))!;

			audioManager.unregisterSound('unregister-test');
			expect(sound.unload).toHaveBeenCalled();

			expect(audioManager.play('unregister-test')).toBeNull();
		});
	});
}); 