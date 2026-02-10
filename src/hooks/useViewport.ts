import { useState, useEffect, useCallback } from 'react';

export type ViewportSize = 'mobile' | 'tablet' | 'desktop';

interface ViewportState {
  size: ViewportSize;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// Breakpoints matching CSS
const MOILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/**
 * Hook to detect viewport size for responsive layout
 * Returns current size category and dimensions
 */
export function useViewport(): ViewportState {
  const [state, setState] = useState<ViewportState>({
    size: 'desktop',
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  const updateViewport = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    let size: ViewportSize;
    if (width < MOILE_BREAKPOINT) {
      size = 'mobile';
    } else if (width < TABLET_BREAKPOINT) {
      size = 'tablet';
    } else {
      size = 'desktop';
    }

    setState({
      size,
      width,
      height,
      isMobile: size === 'mobile',
      isTablet: size === 'tablet',
      isDesktop: size === 'desktop',
    });
  }, []);

  useEffect(() => {
    // Initial check
    updateViewport();

    // Listen for resize
    window.addEventListener('resize', updateViewport);
    
    // Also listen for orientation change (mobile)
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, [updateViewport]);

  return state;
}
