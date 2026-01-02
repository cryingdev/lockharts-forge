
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainForgeScene, { MainForgeData } from '../game/MainForgeScene';
import { useGame } from '../context/GameContext';

const MainForgeCanvas = () => {
  const { state, actions } = useGame();
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // We need to restart the scene when game state critical to visualization changes
  // This is a simple way to sync React State -> Phaser
  useEffect(() => {
    if (!containerRef.current) return;

    const sceneData: MainForgeData = {
      rubbleCleared: state.forge.rubbleCleared,
      hasFurnace: state.forge.hasFurnace,
      onInteract: (type) => {
        switch(type) {
          case 'RUBBLE':
            actions.cleanRubble();
            break;
          case 'ANVIL':
            actions.repairItem();
            break;
          case 'EMPTY_SLOT':
            // Could trigger a tooltip or thought bubble
            break;
          case 'FURNACE':
            // Open furnace UI
            break;
        }
      }
    };

    if (gameRef.current) {
        // If game exists, just restart the scene with new data
        // Note: In a complex game, we'd use events. For this simple setup, restart is cleaner to ensure visuals match state.
        const scene = gameRef.current.scene.getScene('MainForgeScene');
        if (scene) {
            scene.scene.restart(sceneData);
        }
    } else {
        // Init Game
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: 800, // Internal resolution
            height: 450,
            backgroundColor: '#0c0a09',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            scene: [MainForgeScene],
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;
        game.scene.start('MainForgeScene', sceneData);
    }

    return () => {
        // We generally don't destroy the game on every render, 
        // but if the component unmounts (tab switch), we should.
        // However, since we want to persist updates, we might keep it alive or accept the destroy/create cost.
        // For this architecture, we will destroy to prevent memory leaks on tab switch.
    };

  }, [state.forge.rubbleCleared, state.forge.hasFurnace]); 
  
  // Separate cleanup effect
  useEffect(() => {
      return () => {
          if (gameRef.current) {
              gameRef.current.destroy(true);
              gameRef.current = null;
          }
      }
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950">
      <div 
        ref={containerRef} 
        className="w-full h-full max-w-4xl max-h-[60vh] rounded-xl overflow-hidden shadow-2xl border border-stone-800"
      />
      <div className="mt-4 text-stone-500 text-xs font-mono">
        Interact with objects to perform actions.
      </div>
    </div>
  );
};

export default MainForgeCanvas;
