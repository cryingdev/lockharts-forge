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
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#000000',
      scene: [IntroScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.on('intro-complete', () => {
        onComplete();
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [isReady, onComplete]);

  return (
    <div className="absolute inset-0 bg-black z-50 overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default IntroScreen;