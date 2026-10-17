import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function fireGoldenCelebration(originX: number = 0.5, originY: number = 0.6) {
  try {
    // Elegant warm Persian palette: gold, sapphire, emerald, ruby
    const colors = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#EC4899', '#6366F1'];

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: originX, y: originY },
      colors,
      disableForReducedMotion: true,
      scalar: 0.9,
    });
  } catch {
    // fallback if canvas not available
  }
}

export function fireTrophyCelebration() {
  try {
    const end = Date.now() + 1.2 * 1000;
    const colors = ['#F59E0B', '#FBBF24', '#3B82F6', '#60A5FA', '#10B981'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch {
    // fallback
  }
}

interface ConfettiProps {
  trigger?: boolean;
}

export const ConfettiEffect: React.FC<ConfettiProps> = ({ trigger }) => {
  useEffect(() => {
    if (trigger) {
      fireGoldenCelebration();
    }
  }, [trigger]);

  return null;
};
