import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import IntroScene from '../game/IntroScene';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current && containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) {
        setIsReady(true);
      } else {
        requestAnimationFrame(checkSize);
      }
    };
    checkSize();
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      // 기준 해상도(초기 좌표계 안정화용)
      width: 1280,
      height: 720,
      backgroundColor: '#000000',
      scene: [IntroScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      }
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const onIntroComplete = () => onComplete();
    game.events.on('intro-complete', onIntroComplete);

    const resizeObserver = new ResizeObserver(() => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) game.scale.resize(w, h);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      game.events.off('intro-complete', onIntroComplete);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [isReady, onComplete]);

  return (
    <div className="absolute inset-0 bg-black z-50 overflow-hidden">
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100dvh', touchAction: 'none' }}
        className="overflow-hidden"
      />
    </div>
  );
};

export default IntroScreen;