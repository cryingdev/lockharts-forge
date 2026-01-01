import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import IntroScene from '../game/IntroScene';

interface IntroScreenProps {
  onComplete: () => void;
}

function getViewport() {
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  return { vw: Math.floor(vw), vh: Math.floor(vh) };
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // --- Effect 1: Phaser Game Lifecycle ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: el,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#000000',
      scene: [IntroScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const onIntroComplete = () => onComplete();
    game.events.on('intro-complete', onIntroComplete);

    return () => {
      game.events.off('intro-complete', onIntroComplete);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [onComplete]);

  // --- Effect 2: Resize & Orientation Handling ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ensureWrapperSize = () => {
      const { vh } = getViewport();
      el.style.width = '100%';
      el.style.height = `${vh}px`;
      el.style.overflow = 'hidden';
      el.style.touchAction = 'none';
    };

    const resizePhaserToWrapper = () => {
      const game = gameRef.current;
      if (!game) return;

      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w <= 0 || h <= 0) return;

      game.scale.resize(w, h);
      // Small delay to let browser finish internal layout shifts
      requestAnimationFrame(() => {
        game.scale.refresh();
      });
    };

    const sync = () => {
      ensureWrapperSize();
      resizePhaserToWrapper();
    };

    const vv = window.visualViewport;
    const onDelayedSync = () => {
      sync();
      // Multiple attempts to capture layout after UI bars (address bar, etc.) settle
      setTimeout(sync, 100);
      setTimeout(sync, 300);
    };

    // Initial sync
    sync();

    // Event listeners
    vv?.addEventListener('resize', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', onDelayedSync);

    // Observer for DOM-level changes
    const ro = new ResizeObserver(() => requestAnimationFrame(sync));
    ro.observe(el);

    return () => {
      ro.disconnect();
      vv?.removeEventListener('resize', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', onDelayedSync);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden touch-none">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}