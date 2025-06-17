import { useEffect, useState } from 'react';

export function useMobileGame() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      );
    };

    const updateViewportHeight = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight);
    };

    updateOrientation();
    updateViewportHeight();

    window.addEventListener('resize', updateOrientation);
    window.addEventListener('resize', updateViewportHeight);
    window.visualViewport?.addEventListener('resize', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('resize', updateViewportHeight);
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (error) {
      console.error('Fullscreen request failed:', error);
    }
  };

  return {
    orientation,
    isFullscreen,
    viewportHeight,
    requestFullscreen
  };
}