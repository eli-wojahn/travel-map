'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface CanvasPreviewProps {
  children: ReactNode;
  canvasWidth: number;
  canvasHeight: number;
  className?: string;
}

/**
 * Professional canvas preview component that scales content to fit
 * while maintaining aspect ratio and reserving proper layout space.
 * 
 * Similar to Canva/Figma preview behavior:
 * - Dynamically calculates scale based on available space
 * - No cropping or scrollbars
 * - Responsive to viewport changes
 * - Reserves exact visual space with spacer
 * - Export-ready (children render at full size)
 */
export default function CanvasPreview({ 
  children, 
  canvasWidth, 
  canvasHeight,
  className = ''
}: CanvasPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateScale = () => {
      const containerRect = container.getBoundingClientRect();
      const availableWidth = containerRect.width;
      const availableHeight = containerRect.height;

      // Calculate scale to fit both dimensions with padding
      const padding = 0; // No padding, use full container
      const scaleX = (availableWidth - padding * 2) / canvasWidth;
      const scaleY = (availableHeight - padding * 2) / canvasHeight;
      
      // Use the smaller scale to ensure everything fits
      const newScale = Math.min(scaleX, scaleY, 1); // Never scale up beyond 100%
      
      setScale(newScale);
      setContainerSize({
        width: canvasWidth * newScale,
        height: canvasHeight * newScale,
      });
    };

    // Initial calculation
    calculateScale();

    // Observe container size changes
    const resizeObserver = new ResizeObserver(() => {
      calculateScale();
    });

    resizeObserver.observe(container);

    // Also listen to window resize for orientation changes
    window.addEventListener('resize', calculateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [canvasWidth, canvasHeight]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center ${className}`}
      style={{ minHeight: '200px' }} // Prevent collapse
    >
      {/* Spacer: reserves the exact space the scaled content will occupy */}
      <div
        style={{
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />

      {/* Scaled content: positioned absolutely to overlay the spacer */}
      <div
        className="absolute"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
