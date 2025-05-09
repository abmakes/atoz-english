'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/styles/themes/themes.module.css'; // Assuming '@/' alias is set up for src
// Remove Zustand import
import { useGameStore } from '@/stores/useGameStore';
// Import only necessary types from central location
import { TeamData, GameSettingsData, PowerupsData, GameSetupData } from '@/types/gameTypes';
import { Switch } from "@/components/ui/switch"; // Import Switch
import { Button } from '@/components/ui/button';

// Define props explicitly, using imported types
/**
 * Props for the GameSetupPanel component.
 */
interface GameSetupPanelProps {
    /** Callback function invoked when the user clicks the 'Play' button with the selected configuration. */
    onStartGame: (config: Omit<GameSetupData, 'quizId' | 'gameSlug'>) => void;
    /** Callback function invoked when the user clicks the 'Back' button. */
    onGoBack: () => void;
    /** The URL slug for the game type, passed from the parent. */
    initialGameSlug: string; // Already receives initial slug
}

// Rename internal interfaces to avoid conflicts if needed, though not strictly necessary now
// Replace empty interfaces with type aliases
type LocalTeam = TeamData;
type LocalGameSettings = GameSettingsData;
type LocalPowerups = PowerupsData;

// Define the type for the config object created locally
type LocalConfig = Omit<GameSetupData, 'quizId' | 'gameSlug'>;

// --- Component ---
/**
 * Allows users to configure game settings before starting,
 * including teams, theme, intensity, and powerups.
 */
const GameSetupPanel: React.FC<GameSetupPanelProps> = ({ onStartGame, onGoBack }) => {
  // Remove Zustand usage
  const selectedQuizTitle = useGameStore((state) => state.selectedQuizTitle);

  // --- State ---
  const [teams, setTeams] = useState<LocalTeam[]>([
    { id: 't1', name: 'Team 1' },
    { id: 't2', name: 'Team 2' },
  ]);
  const [newTeamName, setNewTeamName] = useState(''); // For adding new teams
  const [settings, setSettings] = useState<LocalGameSettings>({
    music: true,
    sounds: true,
    animation: false,
  });
  const [selectedTheme, setSelectedTheme] = useState<string>('basic'); // 'basic', 'dark', 'forest'
  const [selectedGameFeatures, setSelectedGameFeatures] = useState<string>('basic');
  const [intensityTimeLimit, setIntensityTimeLimit] = useState<number>(15);
  const [limitedGuesses, setLimitedGuesses] = useState<number | null>(3);
  const [powerups, setPowerups] = useState<LocalPowerups>({
    fiftyFifty: false,
    doublePoints: false,
    timeExtension: false,
    comeback: false,
  });

  // State to hold the theme class name
  const [themeClassName, setThemeClassName] = useState<string>('');


  // Effect to update the theme class name when selectedTheme changes
  useEffect(() => {
    switch (selectedTheme) {
      case 'dark':
        setThemeClassName(styles.themeDark);
        break;
      case 'forest':
        setThemeClassName(styles.themeForest);
        break;
      case 'basic':
      default:
        setThemeClassName(styles.themeBasic);
        break;
    }
    // Optionally: Add class to body or html element for global styles if needed
    // document.body.className = themeClassName; // Be careful with this approach
  }, [selectedTheme]);

  // Effect to load initial audio settings from localStorage on mount
  useEffect(() => {
    try {
        const STORAGE_KEY = 'pixi-engine/audio_settings';
        const storedSettingsRaw = localStorage.getItem(STORAGE_KEY);
        if (storedSettingsRaw) {
            const storedSettings = JSON.parse(storedSettingsRaw);
            console.log("GameSetupPanel: Found stored audio settings:", storedSettings);
            // Update local state based on stored muted values (inverted logic)
            setSettings(prev => ({
                ...prev,
                music: !(storedSettings.musicMuted ?? false), // If muted is true, setting is false (off)
                sounds: !(storedSettings.sfxMuted ?? false)   // If muted is true, setting is false (off)
            }));
        } else {
            console.log("GameSetupPanel: No stored audio settings found, using defaults.");
        }
    } catch (error) {
        console.error("Error reading audio settings from localStorage in GameSetupPanel:", error);
        // Keep default settings if error occurs
    }
  }, []); // Empty dependency array ensures this runs only once on mount


  // --- Handlers (Placeholders) ---
  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      setTeams([
        ...teams,
        { id: `t${Date.now()}`, name: newTeamName.trim() },
      ]);
      setNewTeamName('');
    }
  };

  const handleTeamNameChange = (id: string, newName: string) => {
    setTeams(teams.map(team => (team.id === id ? { ...team, name: newName } : team)));
  };

  const handleRemoveTeam = (id: string) => {
    setTeams(teams.filter(team => team.id !== id));
  };

  const handleSettingToggle = (setting: keyof LocalGameSettings) => {
    setSettings(prev => {
        const newState = !prev[setting];
        // Also update localStorage to persist this choice for next session's initial state
        try {
            const STORAGE_KEY = 'pixi-engine/audio_settings';
            const storedSettingsRaw = localStorage.getItem(STORAGE_KEY);
            const storedSettings = storedSettingsRaw ? JSON.parse(storedSettingsRaw) : {};
            
            // Update the corresponding MUTE state (inverted logic)
            if (setting === 'music') {
                storedSettings.musicMuted = !newState; 
                console.log(`GameSetupPanel: Setting persisted musicMuted to ${!newState}`);
            } else if (setting === 'sounds') {
                storedSettings.sfxMuted = !newState;
                 console.log(`GameSetupPanel: Setting persisted sfxMuted to ${!newState}`);
            }
            
            // Ensure volume exists if creating settings for the first time
            if (storedSettings.volume === undefined) {
                storedSettings.volume = 1.0; // Default volume
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(storedSettings));

        } catch (error) {
            console.error("Error saving setting to localStorage from GameSetupPanel:", error);
        }

        return { ...prev, [setting]: newState }; 
    });
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTheme(event.target.value);
  };

  const handleGameFeaturesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGameFeatures(event.target.value);
  };

  const handleIntensityClick = (value: number) => {
    setIntensityTimeLimit(value);
  };

  const handleGuessesClick = (value: number) => {
    setLimitedGuesses(prev => (prev === value ? null : value));
  };

  const handlePowerupToggle = (powerup: keyof LocalPowerups) => {
    setPowerups(prev => ({ ...prev, [powerup]: !prev[powerup] }));
  };

  /**
   * Constructs the game configuration object from the current state
   * and calls the onStartGame prop.
   */
  const handlePlayGame = () => {
    // Construct the config object matching the Omit type expected by onStartGame
    const config: LocalConfig = {
      teams,
      settings,
      theme: selectedTheme, // Ensure property name matches GameSetupData
      gameFeatures: selectedGameFeatures,
      intensityTimeLimit,
      limitedGuesses,
      powerups,
      // Include selected game slug if it becomes changeable
      // gameSlug: currentGameSlug
    };
    console.log('Calling onStartGame with setup config:', config);
    onStartGame(config); // Pass the correctly typed object
  };

  /**
   * Calls the onGoBack prop when the back button is clicked.
   */
  const handleBackClick = () => {
      console.log("Back button clicked - calling onGoBack");
      onGoBack();
  }

  // --- Render ---
  return (
    // Apply themeWrapper and the *local* dynamic theme class for preview
    <div className={`${themeClassName} relative min-h-screen p-4 grandstander`}>
      {/* Background Elements (like clouds - placeholder) */}
      <div className={`backgroundOverlay`}>
        {/* Placeholder for cloud/theme background image/element */}
      </div>
      {/* Back Button */}
      <button
       onClick={handleBackClick}
       className={`buttonIcon`}
       aria-label="Back to Quiz Selection"
     >
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
     </button>
      <div className={`relative max-w-4xl mx-auto bg-[var(--panel-bg)] filter-blur-sm rounded-[32px] p-8 border-2 border-[var(--border-dark)] shadow-solid z-10`}>
        {/* Remove display of selected quiz title */}
        {selectedQuizTitle && (
            <h2 className={`text-center mb-4`}>
                Configure: {selectedQuizTitle}
            </h2>
        )}

        {/* Play Button */}
        <div className={`text-center mb-4 flex flex-col justify-center items-center`}>
          <button onClick={handlePlayGame} className={`grandstander buttonXLarge w-72`}>
            Play
          </button>
        </div>

        {/* Teams Section */}

        <div className={"mb-4 flex flex-col justify-center items-center"}>
          <h2 className={`grandstander text-2xl font-semibold text-[var(--text-color)] mb-2 pt-2`}>Teams:</h2>
          <ul className={`flex flex-row flex-wrap gap-2 justify-center items-center mb-3 text-3xl`}>
            {teams.map((team, index) => (
              <li key={team.id} className={`flex flex-row justify-center items-center`}>
                <span className={`relative text-center -right-6 text-[var(--text-light)] p-2 w-10 bg-[var(--input-label-grey)] border-2 border-[var(--input-border)] rounded-[12px] font-bold`}>{index + 1}</span>                
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                  className={`py-2 px-6 ml-3 mr-1 rounded-[12px] text-lg border-2 border-[var(--input-border)] inputfield`}
                  aria-label={`Team ${index + 1} name`}
                />
                 <button onClick={() => handleRemoveTeam(team.id)} className={`buttonRemoveTeam`} aria-label={`Remove team ${team.name}`}>&times;</button>
              </li>
            ))}
          </ul>
          <div className={`flex items-center`}>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="New team name"
              className={`inputField grandstander`}
            />
            <Button
              variant="solidAccent"
              onClick={handleAddTeam}
              className="grandstander relative -top-0.5 ml-2 border-[3px] h-8 pt-2 text-md "
            >
              add
            </Button>
          </div>
        </div>

        {/* Settings Section */}
        <div className={`mb-4 flex flex-col justify-center items-center`}>
          <h2 className={`grandstander text-2xl font-semibold text-[var(--text-color)] mb-2 pt-2`}>Settings:</h2>
          <div className={`flex flex-row gap-4 items-center`}>
            {(Object.keys(settings) as Array<keyof LocalGameSettings>)
              .filter(key => key === 'music' || key === 'sounds') // Only show music/sounds
              .map((key) => (
              <label key={key} className={`label flex space-between items-center mb-2`}> {/* Add flex styles */} 
                 <span className={`text-[var(--text-color)] capitalize`}> {/* Text first */} 
                   {key === 'music' ? 'Music' : key === 'sounds' ? 'Sound Effects' : key}
                 </span>
                 <Switch
                    checked={settings[key]} // Checked state from local component state
                    onCheckedChange={() => handleSettingToggle(key)} // Call handler on change
                    className={`relative inline-block w-12 h-6 rounded-full`}
                    aria-label={key === 'music' ? 'Toggle Music' : 'Toggle Sound Effects'}
                 />
               </label>
            ))}
          </div>

          <div className={"flex flex-row gap-4 items-center"}>
          {/* Theme Selection */}
            <div className={`flex flex-row gap-4 items-center mb-4 justify-center`}>
              <label htmlFor="theme-select" className={`textLabel`}>Theme:</label>
              <select
                id="theme-select"
                value={selectedTheme}
                onChange={handleThemeChange}
                className={`selectField`}
              >
                <option value="basic">Basic (clouds)</option>
                <option value="dark">Dark Mode</option>
                <option value="forest">Forest</option>
                {/* Add other theme options here */}
              </select>
            </div>

            {/* Game Features Selection */}
            <div className={`flex flex-row gap-4 items-center mb-4 justify-center`}>
              <label htmlFor="features-select" className={`textLabel`}>Game Mode:</label>
              <select
                id="features-select"
                value={selectedGameFeatures}
                onChange={handleGameFeaturesChange}
                className={`selectField`}
              >
                <option value="basic" >Basic</option>
                <option value="boosted">Boosted mode</option>
                {/* Add other feature set options here */}
              </select>
            </div>
          </div>
        </div>


        {/* Power-up/Options Boxes Section */}
        <div className={`optionsGrid`}>
          {/* Box 1: Intensity */}
          <div className={'optionBox'}>
            {/* Make container relative */}
            <div className={`relative mb-2 text-lg`}> 
              <svg className={`w-12 h-12`} xmlns="http://www.w3.org/2000/svg" width="75" height="78" viewBox="0 0 75 78" fill="none">
                <path d="M0 38C0 17.5655 16.5655 1 37 1C57.4345 1 74 17.5655 74 38V41C74 61.4345 57.4345 78 37 78C16.5655 78 0 61.4345 0 41V38Z" fill="var(--primary-accent)"/>
                <path d="M8 39.5C8 23.7599 20.7599 11 36.5 11H37.5C53.2401 11 66 23.7599 66 39.5C66 55.2401 53.2401 68 37.5 68H36.5C20.7599 68 8 55.2401 8 39.5Z" fill="white"/>
                <path d="M75 38.5C75 33.4441 74.0559 28.4377 72.2216 23.7667C70.3873 19.0957 67.6987 14.8514 64.3094 11.2764C60.9201 7.70133 56.8963 4.86544 52.4679 2.93064C48.0396 0.995831 43.2932 -2.21e-07 38.5 0V38.5H75Z" fill="white"/>
              </svg>
              {/* Center span using absolute, top/left 50%, and translate */}
              <span className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-gray-700'> 
                {intensityTimeLimit}
              </span>
            </div>
            <h3 className={`font-semibold mb-2 text-md text-[var(--text-color)]`}>Increase intensity with a time limit</h3>
            <div className={`buttonGroup`}>
              {[10, 15, 20].map(time => (
                <button
                  key={time}
                  onClick={() => handleIntensityClick(time)}
                  // Conditionally apply active class
                  className={`buttonChoice ${intensityTimeLimit === time ? 'buttonChoiceActive' : ''}`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Box 2: Limited Guesses */}
          <div className={'optionBox'}>
            <div className={`flex flex-row text-lg justify-center items-center gap-1 mb-2 min-h-[24px]`}> 
              {/* Dynamically render hearts based on limitedGuesses state */}
              {limitedGuesses !== null && limitedGuesses > 0 ? (
                Array.from({ length: limitedGuesses }).map((_, index) => (
                  <svg className={`w-8 h-8`} key={`heart-${index}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="var(--primary-accent)"> {/* Added explicit color */}
                    <path d="M21.19 12.683c-2.5 5.41-8.62 8.2-8.88 8.32a.85.85 0 0 1-.62 0c-.25-.12-6.38-2.91-8.88-8.32c-1.55-3.37-.69-7 1-8.56a4.93 4.93 0 0 1 4.36-1.05a6.16 6.16 0 0 1 3.78 2.62a6.15 6.15 0 0 1 3.79-2.62a4.93 4.93 0 0 1 4.36 1.05c1.78 1.56 2.65 5.19 1.09 8.56"/>
                  </svg>
                ))
              ) : null }
            </div>
            <h3 className={`font-semibold mb-2 text-md text-[var(--text-color)]`}>Raise the stakes with limited guesses</h3>
            <div className={`buttonGroup`}>
              {[1, 3, 5].map(guess => (
                <button
                  key={guess}
                  onClick={() => handleGuessesClick(guess)}
                  // Conditionally apply active class
                  className={`buttonChoice ${limitedGuesses === guess ? 'buttonChoiceActive' : ''}`}
                >
                  {guess}
                </button>
              ))}
            </div>
          </div>

          {/* Box 3: Powerups */}
          <div className={'optionBox'}>
            <div className={`mb-2 text-lg`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 512 512" fill="var(--primary-accent)"><path d="M218.4 24.72c-14.2 0-30.5 3.56-49.5 11.88c77.2 8.6 65.9 91.4 14.1 106.2c-65.4 18.7-131.31-23.7-98.34-99.2c-39.67 18.95-42.17 80.8-12.93 111.5C141.3 227.9 56.9 279 37.25 200.7C-1.929 326.2 60.34 489.5 258.7 489.5c250.7 0 282-374.7 129.2-415.04c26.5 43.04-13.1 70.94-24.9 73.14c-51.3 9.9-58.1-122.89-144.6-122.88m37.5 118.08c4.5 0 9.4 1.1 12.8 2.9l115.9 67.1c7.4 4.1 7.4 10.9 0 15.2l-115.9 66.9c-7.2 4.3-18.5 4.3-25.7 0L126.8 228c-7.3-4.3-7.3-11.1 0-15.2L243 145.7c3.4-1.8 7.9-2.9 12.9-2.9m-89 62.6c-21.6-.4-33.1 15-18.2 24.3c9.6 4.8 23.7 4.4 32.7-.8c8.8-5.3 9.5-13.7 1.5-19.4c-4.3-2.5-10-4-16-4.1m178.6.1c-20.8.4-31.3 15.5-16.3 24.5c9.6 4.9 23.9 4.6 33-.7c8.9-5.3 9.5-13.9 1.2-19.6c-4.2-2.4-9.9-4-15.9-4.2zm-89 0c-6.6-.1-13 1.5-17.7 4.2c-10.2 5.6-10.4 15.1-.6 20.9c9.9 5.8 25.8 5.6 35.1-.6c15-9 4.6-24.3-16.8-24.5m-141 41c1.5.1 3.4.5 5.6 1.6l111.5 64.5c7.2 4.1 12.9 14.2 12.9 22.5v119.7c0 8.3-5.7 11.7-12.9 7.6L121.2 398c-7.4-4.3-13.2-14.2-13.2-22.6V255.7c0-6.2 3-9.2 7.5-9.2m281.3 0c4.2 0 7.2 3 7.2 9.2v119.7c0 8.4-6 18.3-13 22.6l-111.5 64.4c-7.2 4.1-12.9.7-12.9-7.6V335.1c0-8.3 5.7-18.4 12.9-22.5L391 248.1c2.1-1.1 4.2-1.5 5.8-1.6m-185 65.5h-1.1c-5.3.4-8.5 4.8-8.5 11.6c-.6 10.4 7.2 24.1 16.9 29.8c9.8 5.6 17.6 1.1 17.2-9.9c.2-14.2-13.3-31.1-24.5-31.5m130.9 21.8c-11.2.1-24.8 17.2-24.7 31.4c.1 10.4 7.7 14.4 17.2 8.9c9.4-5.5 17-18.3 17.1-28.8c0-6.7-3.3-11.1-8.5-11.5zm-216.9 22.5c-5.4.3-8.7 4.7-8.7 11.6c-.5 10.5 7.3 24.1 17 29.8c9.8 5.5 17.6 1 17.2-10.1c0-14.5-14.1-31.8-25.5-31.3"/></svg> 
            </div>
            <h3 className={`font-semibold mb-2 text-md text-[var(--text-color)]`}>Activate power-ups</h3>
            <div className={`buttonGroup`}>
              {Object.keys(powerups).map(key => {
                // Map key to display name
                let displayName = '';
                switch (key) {
                  case 'fiftyFifty': displayName = '50/50'; break;
                  case 'doublePoints': displayName = 'Double Points'; break;
                  case 'timeExtension': displayName = 'Extra time'; break;
                  case 'comeback': displayName = 'Comeback'; break;
                  default: displayName = key; // Fallback
                }
                
                return (
                  <button
                    key={key}
                    onClick={() => handlePowerupToggle(key as keyof LocalPowerups)}
                    className={`buttonChoice ${powerups[key as keyof LocalPowerups] ? 'buttonChoiceActive' : ''}`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSetupPanel;
