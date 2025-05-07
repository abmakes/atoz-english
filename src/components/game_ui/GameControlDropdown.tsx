import React, { useState, useEffect } from 'react';
import { Settings, Volume2, Music, X, RefreshCw } from 'lucide-react'; // Import icons
import type { EventBus } from '@/lib/pixi-engine/core/EventBus'; // Import EventBus type
import { SETTINGS_EVENTS, GAME_STATE_EVENTS } from '@/lib/pixi-engine/core/EventTypes'; // Import events


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"; // Assuming this path is correct
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import { Slider } from "@/components/ui/slider"; // Added import for Slider component
import { Label } from "@/components/ui/label"; // Import Label
// import { ExtensionPriority } from '@pixi/devtools';

// --- Local Storage Setup  ---
const AUDIO_SETTINGS_STORAGE_KEY = 'pixi-engine/audio_settings';
interface StoredAudioSettings {
  volume?: number; // Make optional to handle missing key
  musicMuted?: boolean;
  sfxMuted?: boolean;
}
// --- End Local Storage Setup ---

interface GameControlDropdownProps {
  eventBus: EventBus; // Added prop for EventBus
  musicMuted: boolean; // Keep these for display/control
  sfxMuted: boolean;
  volume: number;
  onMusicToggle: () => void;
  onSfxToggle: () => void;
  onRestartGame: () => void; // Added prop
  onQuitGame: () => void;    // Added prop
  className?: string; // Allow passing additional classes for positioning/styling the trigger
}

const GameControlDropdown: React.FC<GameControlDropdownProps> = ({
  eventBus, // Use eventBus from props
  musicMuted,
  sfxMuted,
  volume,
  onMusicToggle,
  onSfxToggle,
  onRestartGame, // Use onRestartGame from props
  onQuitGame,    // Use onQuitGame from props
  className,
}) => {
  // --- State Management  ---
  const [globalVolume, setGlobalVolume] = useState(volume); // Volume state (0.0 to 1.0)
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to load initial state from localStorage once on mount
  useEffect(() => {
    try {
      const storedSettingsRaw = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
      if (storedSettingsRaw) {
        const settings = JSON.parse(storedSettingsRaw) as StoredAudioSettings;
        setGlobalVolume(settings.volume ?? 1.0); // Load volume or default to 1.0
        // Note: We don't load music/sfx mute here, they are controlled by props from parent
      } else {
        setGlobalVolume(1.0); // Default if no settings found
      }
    } catch (error) {
      console.error("Error reading audio settings from localStorage in Dropdown:", error);
      setGlobalVolume(1.0); // Default on error
    }
    setIsInitialized(true);
  }, []); // Empty dependency array runs once on mount

  // Effect to save volume to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        // Read existing settings first to avoid overwriting mute states
        const storedSettingsRaw = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
        const currentSettings = storedSettingsRaw ? JSON.parse(storedSettingsRaw) : {};

        const newSettings: StoredAudioSettings = {
          ...currentSettings, // Preserve existing mute states
          volume: globalVolume, // Update volume
        };
        localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error("Error saving audio volume to localStorage from Dropdown:", error);
      }
    }
  }, [globalVolume, isInitialized]); // Run when volume or initialization state changes
  // --- End State Management ---

  // Prevent dropdown from closing when interacting with checkbox/slider inside
  const handleSelect = (event: Event) => {
    event.preventDefault();
  };

  // Handle slider value change (now receives [0.0-1.0])
  const handleSliderChange = (value: number[]) => {
    const newVolume = value[0]; // Directly use the 0.0-1.0 value
    setGlobalVolume(newVolume); // Update local state
    eventBus.emit(SETTINGS_EVENTS.SET_GLOBAL_VOLUME, newVolume); // Emit the 0.0-1.0 value
    console.log(`GameControlDropdown: Volume Changed -> State: ${newVolume.toFixed(2)}, Emitting SET_GLOBAL_VOLUME: ${newVolume.toFixed(2)}`);
  };

  // +++ Add handler for Dropdown Open/Close +++
  const handleOpenChange = (open: boolean) => {
      console.log("GameControlDropdown: Visibility changed ->", open);
      if (open) {
          // Dropdown is opening, PAUSE the game
          console.log("GameControlDropdown: Emitting GAME_PAUSED");
          eventBus.emit(GAME_STATE_EVENTS.GAME_PAUSED);
      } else {
          // Dropdown is closing, RESUME the game
          console.log("GameControlDropdown: Emitting GAME_RESUMED");
          eventBus.emit(GAME_STATE_EVENTS.GAME_RESUMED);
      }
  };
  // +++ End Add handler +++

  console.log(`GameControlDropdown: Rendering with internal volume state = ${globalVolume.toFixed(2)}`);

  // if (!isInitialized) {
  //     // Optional: Render a loading state or disabled state while loading from storage
  //     return (
  //         <Button variant="default" size="icon" aria-label="Game Settings (Loading)" disabled className={className}>
  //             <Settings className="h-5 w-5 opacity-50" />
  //         </Button>
  //     );
  // }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild className={className}>
        {/* Use a simple Button or just the icon as the trigger */}
        <Button variant="navIcon" className={`border-2 border-primary-accent hover:bg-transparent hover:border-2 hover:border-primary-accent rounded-full`} aria-label="Game Settings">
           <Settings className="" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={`${className} font-[var(--font-theme)] w-60 p-2 bg-white border-2 border-[var(--primary-accent)] text-[var(--text-color)]`}
      >
        <DropdownMenuLabel className="px-2 text-[var(--heading-color)]"> {/* Apply text color here too */}
            Audio Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[var(--border-color)]" /> {/* Apply border color */}

        {/* Music Toggle */}
        <DropdownMenuCheckboxItem
          checked={!musicMuted}
          onCheckedChange={onMusicToggle}
          onSelect={handleSelect}
          className="" // Explicit hover background
        >
          <Music className="mr-2 h-4 w-4" />
          <span>Music</span>
          {/* Optional indicator - useful if label is short */}
          {/* {!musicMuted ? <Check className="ml-auto h-4 w-4" /> : <X className="ml-auto h-4 w-4 opacity-50" />} */}
        </DropdownMenuCheckboxItem>

        {/* SFX Toggle */}
        <DropdownMenuCheckboxItem
          checked={!sfxMuted}
          onCheckedChange={onSfxToggle}
          onSelect={handleSelect}
          className="focus:bg-[var(--hover-bg)]" // Explicit hover background
        >
           <Volume2 className="mr-2 h-4 w-4" />
           <span>Sound FX</span>
           {/* Optional indicator */}
           {/* {!sfxMuted ? <Check className="ml-auto h-4 w-4" /> : <X className="ml-auto h-4 w-4 opacity-50" />} */}
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator className="bg-[--primary-accent]" />
        
        <div className="px-2 py-1.5"> {/* Add padding similar to label */}
            <Label htmlFor="dropdown-volume" className="text-sm font-medium text-[color:var(--text-color)] mb-1 block">
              Volume: {Math.round(globalVolume * 100)}%
            </Label>
            <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 flex-shrink-0 text-[color:var(--text-color)]" />
                <Slider
                  id="dropdown-volume" // Unique ID
                  min={0}
                  max={1} // Use 0-1 scale
                  step={0.01} // Use smaller step
                  value={[globalVolume]} // Use internal state (0.0-1.0)
                  onValueChange={handleSliderChange} // Use updated handler
                  className="w-full [&>span>span]:bg-[var(--primary-accent)] [&>span]:bg-[color:var(--slider-track-bg)] [&>span>span+span>span]:bg-[color:var(--input-bg)] [&>span>span+span>span]:border-[color:var(--primary-accent)]" // Example: Target track, range, and thumb
                  aria-label="Volume control"
                  disabled={musicMuted && sfxMuted} // Disable if both sources are muted
                  // Prevent dropdown closing on slider interaction by stopping propagation
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()} // Also stop click propagation
                />
            </div>
        </div>
        {/* --- End Volume Control Section --- */}

        <DropdownMenuSeparator className="bg-[color:var(--border-color)]" />
        <DropdownMenuLabel className="px-2 text-[color:var(--heading-color)]">
            Game Controls
        </DropdownMenuLabel>
        
        {/* Restart Game Button */}
        <DropdownMenuItem
            onSelect={onRestartGame} // Calls the prop passed from GameplayView
            className="focus:bg-[color:var(--hover-bg)] cursor-pointer" // Explicit hover background
        >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Restart Game</span>
        </DropdownMenuItem>

        {/* Quit Game Button */}
         <DropdownMenuItem
            onSelect={onQuitGame} // Calls the prop passed from GameplayView
            className="focus:bg-[color:var(--hover-bg)] cursor-pointer" // Explicit hover background
        >
            <X className="mr-2 h-4 w-4" />
            <span>Quit Game</span>
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GameControlDropdown;
