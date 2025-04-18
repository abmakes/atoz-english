'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/styles/themes/themes.module.css'; // Assuming '@/' alias is set up for src
// Remove Zustand import
// import { useGameStore } from '@/stores/useGameStore';
// Import only necessary types from central location
import { FullGameConfig, TeamData, GameSettingsData, PowerupsData } from '@/types/gameTypes';

// Define props explicitly, using imported types
interface GameSetupPanelProps {
    onStartGame: (config: Omit<FullGameConfig, 'quizId' | 'gameSlug'>) => void;
    onGoBack: () => void;
    initialGameSlug: string; // Already receives initial slug
}

// Rename internal interfaces to avoid conflicts if needed, though not strictly necessary now
// Replace empty interfaces with type aliases
type LocalTeam = TeamData;
type LocalGameSettings = GameSettingsData;
type LocalPowerups = PowerupsData;

// Define the type for the config object created locally
type LocalConfig = Omit<FullGameConfig, 'quizId' | 'gameSlug'>;

// --- Component ---
const GameSetupPanel: React.FC<GameSetupPanelProps> = ({ onStartGame, onGoBack }) => {
  // Remove Zustand usage
  // const selectedQuizTitle = useGameStore((state) => state.selectedQuizTitle);

  // --- State ---
  const [teams, setTeams] = useState<LocalTeam[]>([
    { id: 't1', name: 'Dolphin' },
    { id: 't2', name: 'Capybara' },
  ]);
  const [newTeamName, setNewTeamName] = useState(''); // For adding new teams
  const [settings, setSettings] = useState<LocalGameSettings>({
    music: true,
    sounds: true,
    animation: true,
  });
  const [selectedTheme, setSelectedTheme] = useState<string>('basic'); // 'basic', 'dark', 'forest'
  const [selectedGameFeatures, setSelectedGameFeatures] = useState<string>('boosted');
  const [intensityTimeLimit, setIntensityTimeLimit] = useState<number>(15);
  const [limitedGuesses, setLimitedGuesses] = useState<number | null>(3);
  const [powerups, setPowerups] = useState<LocalPowerups>({
    fiftyFifty: false,
    doublePoints: false,
    comeback: true,
  });

  // State to hold the theme class name
  const [themeClassName, setThemeClassName] = useState<string>(styles.themeBasic);


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
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
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

  const handlePlayGame = () => {
    // Construct the config object matching the Omit type expected by onStartGame
    const config: LocalConfig = {
      teams,
      settings,
      theme: selectedTheme, // Ensure property name matches FullGameConfig
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

  const handleBackClick = () => {
      console.log("Back button clicked - calling onGoBack");
      onGoBack();
  }

  // --- Render ---
  return (
    // Apply themeWrapper and the *local* dynamic theme class for preview
    <div className={`${styles.panelWrapper} ${styles.themeWrapper} ${themeClassName}`}>
      {/* Background Elements (like clouds - placeholder) */}
      <div className={styles.backgroundOverlay}>
        {/* Placeholder for cloud/theme background image/element */}
      </div>

      {/* Back Button */}
       <button
        onClick={handleBackClick}
        className={styles.buttonIcon}
        aria-label="Back to Quiz Selection"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>

      <div className={styles.panel}>
        {/* Remove display of selected quiz title */}
        {/* {selectedQuizTitle && (
            <h2 className={`${styles.textHeading2} ${styles.textCenter} mb-4`}>
                Configure: {selectedQuizTitle}
            </h2>
        )} */}

        {/* Play Button */}
        <div className={`${styles.textCenter} ${styles.sectionSpacing}`}>
          <button onClick={handlePlayGame} className={styles.buttonPlay}>
            Play
          </button>
        </div>

        {/* Teams Section */}
        <div className={styles.sectionSpacing}>
          <h2 className={styles.textHeading2}>Teams:</h2>
          <ul className={styles.teamList}>
            {teams.map((team, index) => (
              <li key={team.id} className={styles.teamListItem}>
                <span className={styles.teamListIndex}>{index + 1}</span>
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                  className={styles.teamListInput}
                  aria-label={`Team ${index + 1} name`}
                />
                 <button onClick={() => handleRemoveTeam(team.id)} className={styles.buttonRemoveTeam} aria-label={`Remove team ${team.name}`}>&times;</button>
              </li>
            ))}
          </ul>
          <div className={styles.addTeamContainer}>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="New team name"
              className={styles.inputField}
            />
            <button
              onClick={handleAddTeam}
              className={styles.buttonAddTeam}
            >
              + Add team
            </button>
          </div>
        </div>

        {/* Settings Section */}
        <div className={styles.sectionSpacing}>
          <h2 className={styles.textHeading2}>Settings:</h2>
          <div className={styles.settingsContainer}>
            <span className={styles.textLabel}>Turn ON:</span>
            {(Object.keys(settings) as Array<keyof LocalGameSettings>).map((key) => (
              <label key={key} className={styles.label}>
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={() => handleSettingToggle(key)}
                  className={styles.checkbox}
                />
                <span className={styles.textInputLabel}>{key}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Theme Selection */}
        <div className={`${styles.selectionContainer} ${styles.sectionSpacing}`}>
          <label htmlFor="theme-select" className={styles.textLabel}>Select Theme:</label>
          <select
            id="theme-select"
            value={selectedTheme}
            onChange={handleThemeChange}
            className={styles.selectField}
          >
            <option value="basic">Basic (clouds)</option>
            <option value="dark">Dark Mode</option>
            <option value="forest">Forest</option>
            {/* Add other theme options here */}
          </select>
        </div>

        {/* Game Features Selection */}
        <div className={`${styles.selectionContainer} ${styles.sectionSpacing}`}>
          <label htmlFor="features-select" className={styles.textLabel}>Select Game Features:</label>
          <select
            id="features-select"
            value={selectedGameFeatures}
            onChange={handleGameFeaturesChange}
            className={styles.selectField}
          >
            <option value="basic">Basic</option>
            <option value="boosted">Boosted mode</option>
            {/* Add other feature set options here */}
          </select>
        </div>

        {/* Power-up/Options Boxes Section */}
        <div className={styles.optionsGrid}>
          {/* Box 1: Intensity */}
          <div className={styles.optionBox}>
            <div className={styles.optionBoxIcon}>⏱️</div>
            <h3 className={styles.textHeading3}>Increase intensity with a time limit</h3>
            <div className={styles.buttonGroup}>
              {[10, 15, 20].map(time => (
                <button
                  key={time}
                  onClick={() => handleIntensityClick(time)}
                  // Conditionally apply active class
                  className={`${styles.buttonChoice} ${intensityTimeLimit === time ? styles.buttonChoiceActive : ''}`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Box 2: Limited Guesses */}
          <div className={styles.optionBox}>
            <div className={styles.optionBoxIcon}>❤️</div>
            <h3 className={styles.textHeading3}>Raise the stakes with limited guesses</h3>
            <div className={styles.buttonGroup}>
              {[1, 3, 5].map(guess => (
                <button
                  key={guess}
                  onClick={() => handleGuessesClick(guess)}
                  // Conditionally apply active class
                  className={`${styles.buttonChoice} ${limitedGuesses === guess ? styles.buttonChoiceActive : ''}`}
                >
                  {guess}
                </button>
              ))}
            </div>
          </div>

          {/* Box 3: Powerups */}
          <div className={styles.optionBox}>
            <div className={styles.optionBoxIcon}>✨</div>
            <h3 className={`${styles.textHeading3} ${styles.textCenter}`}>Keep games unpredictable with different boosts</h3>
            <div className={styles.checkboxGroup}>
              {Object.keys(powerups).map(key => (
                <label key={key} className={styles.labelInline}>
                  <input
                    type="checkbox"
                    checked={powerups[key as keyof LocalPowerups]}
                    onChange={() => handlePowerupToggle(key as keyof LocalPowerups)}
                    className={styles.checkbox}
                  />
                  <span className={styles.textDefault}>
                    {key === 'fiftyFifty' ? '50/50' : key === 'doublePoints' ? 'Double points' : 'Comeback'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSetupPanel;
