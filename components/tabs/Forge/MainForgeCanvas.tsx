
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import MainForgeScene, { MainForgeData } from '../../../game/MainForgeScene';
import { useGame } from '../../../context/GameContext';

const MainForgeCanvas = () => {
  const { state, actions } = useGame();
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

    const sceneData: MainForgeData = {
      hasFurnace: state.forge.hasFurnace,
      onInteract: (type) => {
        switch(type) {
          case 'ANVIL':
            actions.repairItem();
            break;
          case 'EMPTY_SLOT':
            break;
          case 'FURNACE':
            break;
        }
      }
    };

    if (gameRef.current) {
        const scene = gameRef.current.scene.getScene('MainForgeScene');
        if (scene) {
            scene.scene.restart(sceneData);
        }
    } else {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
            backgroundColor: '#0c0a09',
            scale: {
                mode: Phaser.Scale.RESIZE, // FIT에서 RESIZE로 변경
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            scene: [MainForgeScene],
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;
        game.scene.start('MainForgeScene', sceneData);
    }
  }, [isReady, state.forge.hasFurnace]); 
  
  useEffect(() => {
      return () => {
          if (gameRef.current) {
              gameRef.current.destroy(true);
              gameRef.current = null;
          }
      }
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 overflow-hidden">
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-stone-800"
      />
      <div className="mt-2 md:mt-4 text-stone-500 text-[10px] md:text-xs font-mono">
        Interact with objects to perform actions.
      </div>
    </div>
  );
};

export default MainForgeCanvas;
