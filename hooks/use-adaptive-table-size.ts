import { useState, useEffect } from 'react';

interface TableDimensions {
  viewBox: string;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export function useAdaptiveTableSize() {
  const [dimensions, setDimensions] = useState<TableDimensions>({
    viewBox: '0 0 400 500',
    width: 400,
    height: 500,
    centerX: 200,
    centerY: 250,
  });

  useEffect(() => {
    const calculateDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Base dimensions
      let width = 400;
      let height = 500;
      
      // Adjust based on viewport
      if (viewportWidth < 768) { // Mobile
        // Use more vertical space on mobile
        const availableHeight = viewportHeight - 200; // Account for header and cards
        const availableWidth = viewportWidth - 40; // Account for padding
        
        // Calculate optimal dimensions maintaining aspect ratio
        const aspectRatio = 0.8; // width/height ratio
        
        if (availableHeight * aspectRatio <= availableWidth) {
          height = Math.max(400, Math.min(availableHeight, 600));
          width = height * aspectRatio;
        } else {
          width = Math.max(320, Math.min(availableWidth, 480));
          height = width / aspectRatio;
        }
      } else if (viewportWidth < 1024) { // Tablet
        width = 450;
        height = 550;
      } else { // Desktop
        width = 400;
        height = 500;
      }
      
      // Ensure minimum dimensions
      width = Math.max(width, 320);
      height = Math.max(height, 400);
      
      setDimensions({
        viewBox: `0 0 ${width} ${height}`,
        width,
        height,
        centerX: width / 2,
        centerY: height / 2,
      });
    };

    // Calculate on mount
    calculateDimensions();

    // Recalculate on resize
    window.addEventListener('resize', calculateDimensions);
    
    // Cleanup
    return () => window.removeEventListener('resize', calculateDimensions);
  }, []);

  return dimensions;
} 