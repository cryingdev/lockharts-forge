import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const TestGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Define the Scene inline for simplicity in this test component
    class MainScene extends Phaser.Scene {
      private rect!: Phaser.GameObjects.Rectangle;

      constructor() {
        super({ key: 'MainScene' });
      }

      create() {
        const { width, height } = this.scale;

        // Create a green rectangle in the center
        this.rect = this.add.rectangle(width / 2, height / 2, 100, 100, 0x00ff00);

        // Add some text to confirm it's running
        this.add.text(width / 2, height / 2 + 80, 'Phaser 3 + React', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffffff'
        }).setOrigin(0.5);
      }

      update() {
        // Rotate the rectangle every frame to prove the game loop is active
        if (this.rect) {
          this.rect.rotation += 0.02;
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current, // Mount to the ref div
      width: 800,
      height: 600,
      backgroundColor: '#000000',
      scene: MainScene,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0, x: 0 },
        },
      },
    };

    // Initialize the game
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Cleanup when component unmounts
    return () => {
      game.destroy(true); // true = remove canvas from DOM
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="flex justify-center items-center p-4">
      <div 
        ref={containerRef} 
        className="rounded-lg overflow-hidden shadow-2xl border-4 border-slate-700"
      />
    </div>
  );
};

export default TestGame;