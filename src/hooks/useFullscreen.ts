import { useState, useEffect, useCallback } from 'react';

export interface UseFullscreenReturn {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  isSupported: boolean;
}

/**
 * Custom hook for managing fullscreen functionality
 * @param elementRef - Reference to the element to make fullscreen (optional, defaults to document.documentElement)
 * @returns Fullscreen state and control functions
 */
export const useFullscreen = (elementRef?: React.RefObject<HTMLElement | HTMLDivElement | null>): UseFullscreenReturn => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Check if fullscreen API is supported
  useEffect(() => {
    const supported = !!(
      document.fullscreenEnabled ||
      (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
      (document as Document & { mozFullScreenEnabled?: boolean }).mozFullScreenEnabled ||
      (document as Document & { msFullscreenEnabled?: boolean }).msFullscreenEnabled
    );
    setIsSupported(supported);
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    if (!isSupported) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
        (document as Document & { mozFullScreenElement?: Element }).mozFullScreenElement ||
        (document as Document & { msFullscreenElement?: Element }).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    // Add event listeners for different browsers
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isSupported]);

  // Enter fullscreen
  const enterFullscreen = useCallback(async () => {
    if (!isSupported) {
      console.warn('Fullscreen API is not supported');
      return;
    }

    try {
      const element = elementRef?.current || document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (element as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      } else if ((element as HTMLElement & { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen) {
        await (element as HTMLElement & { mozRequestFullScreen: () => Promise<void> }).mozRequestFullScreen();
      } else if ((element as HTMLElement & { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
        await (element as HTMLElement & { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  }, [isSupported, elementRef]);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    if (!isSupported) {
      console.warn('Fullscreen API is not supported');
      return;
    }

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as Document & { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
        await (document as Document & { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
      } else if ((document as Document & { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen) {
        await (document as Document & { mozCancelFullScreen: () => Promise<void> }).mozCancelFullScreen();
      } else if ((document as Document & { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
        await (document as Document & { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  }, [isSupported]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
    isSupported,
  };
};
