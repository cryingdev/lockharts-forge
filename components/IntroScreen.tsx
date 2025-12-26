
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import IntroScene from '../game/IntroScene';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#000000',
      scene: [IntroScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Listen for scene completion
    game.events.on('intro-complete', () => {
        onComplete();
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default IntroScreen;
