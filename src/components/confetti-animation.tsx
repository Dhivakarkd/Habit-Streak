'use client';

import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConfettiAnimationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function ConfettiAnimation({ trigger, onComplete }: ConfettiAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!trigger) return;
    if (prefersReducedMotion) return;

    setIsVisible(true);

    // Duration: 2 seconds for mobile, 2.5 seconds for desktop
    const duration = isMobile ? 2000 : 2500;
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [trigger, isMobile, prefersReducedMotion, onComplete]);

  if (!isVisible || prefersReducedMotion) {
    return null;
  }

  // Confetti particles count: 30 mobile, 100 desktop
  const particleCount = isMobile ? 30 : 100;
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((i) => {
        // Random starting position (top of screen)
        const startX = Math.random() * 100;
        
        // Random falling speed (slower on mobile)
        const duration = isMobile ? 1.5 + Math.random() * 0.5 : 2 + Math.random() * 0.5;
        
        // Random horizontal drift
        const drift = (Math.random() - 0.5) * 100;
        
        // Random rotation
        const rotation = Math.random() * 360;
        
        // Random emoji from celebration set
        const emojis = ['🎉', '🎊', '✨', '⭐', '🔥', '💫', '🌟'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];

        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${startX}%`,
              top: '-10px',
              animation: `confetti-fall ${duration}s linear forwards`,
              '--drift': `${drift}px`,
              '--rotation': `${rotation}deg`,
            } as React.CSSProperties & { '--drift': string; '--rotation': string }}
          >
            <style>{`
              @keyframes confetti-fall {
                0% {
                  opacity: 1;
                  transform: translateY(0) translateX(0) rotate(0deg);
                }
                100% {
                  opacity: 0;
                  transform: translateY(100vh) translateX(var(--drift)) rotate(var(--rotation));
                }
              }
            `}</style>
            <div className="text-2xl md:text-3xl select-none">{emoji}</div>
          </div>
        );
      })}
    </div>
  );
}
