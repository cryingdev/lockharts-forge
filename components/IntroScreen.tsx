
import React, { useEffect, useRef, useState } from 'react';
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
      requestAnimationFrame(() => {
        game.scale.refresh();
      });
    };

    const sync = () => {
      ensureWrapperSize();
      resizePhaserToWrapper();
    };

    if (!gameRef.current) {
      ensureWrapperSize();

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: el,
        width: 1280,
        height: 720,
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

      sync();

      // Lifecycle cleanup
      return () => {
        game.events.off('intro-complete', onIntroComplete);
        game.destroy(true);
        gameRef.current = null;
      };
    }

    const vv = window.visualViewport;
    const onOrientationChange = () => {
      sync();
      setTimeout(sync, 60);
      setTimeout(sync, 180);
    };

    vv?.addEventListener('resize', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', onOrientationChange);

    const ro = new ResizeObserver(() => requestAnimationFrame(sync));
    ro.observe(el);

    sync();

    return () => {
      ro.disconnect();
      vv?.removeEventListener('resize', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      <div ref={containerRef} />
    </div>
  );
}
