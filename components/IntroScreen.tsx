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
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // ResizeObserver implementation to sync Phaser scale with dynamic container size
    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            if (game && game.scale && width > 0 && height > 0) {
                game.scale.resize(width, height);
            }
        }
    });
    
    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }

    game.events.on('intro-complete', () => {
        onComplete();
    });

    return () => {
      resizeObserver.disconnect();
      if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
      }
    };
  }, [isReady, onComplete]);

  return (
    <div className="absolute inset-0 bg-black z-50 overflow-hidden">
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100dvh' }} 
        className="overflow-hidden"
      />
    </div>
  );
};

export default IntroScreen;