


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

    let resizeObserver: ResizeObserver | null = null;

    // 만약 이미 게임이 존재한다면, 장면만 재시작하되 컨텍스트가 닫혔는지 확인
    if (gameRef.current) {
        try {
            const scene = gameRef.current.scene.getScene('MainForgeScene');
            // isRunning이 true이고 renderer 컨텍스트가 유효할 때만 진행
            if (scene && gameRef.current.isRunning) {
                scene.scene.restart(sceneData);
            } else {
                throw new Error("Context closed or game not running");
            }
        } catch (e) {
            console.warn("Phaser context invalid, recreating game instance.");
            gameRef.current.destroy(true);
            gameRef.current = null;
        }
    }

    if (!gameRef.current) {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
            backgroundColor: '#0c0a09',
            // Fix: Removed 'pauseOnBlur' as it is not a recognized property in some GameConfig type definitions
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            render: {
                transparent: false,
                antialias: true
            },
            callbacks: {
                postBoot: (game) => {
                    game.events.on('blur', () => {});
                    game.events.on('focus', () => {});
                }
            },
            scene: [MainForgeScene],
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;
        game.scene.start('MainForgeScene', sceneData);

        resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (game && game.scale && width > 0 && height > 0) {
                    game.scale.resize(width, height);
                }
            }
        });
        if (containerRef.current) resizeObserver.observe(containerRef.current);
    }
    
    return () => {
        if (resizeObserver) resizeObserver.disconnect();
    }
  }, [isReady, state.forge.hasFurnace]); 
  
  useEffect(() => {
      return () => {
          if (gameRef.current) {
              const game = gameRef.current;
              gameRef.current = null;
              game.destroy(true, false); // true: 캔버스 제거, false: 즉시 가비지 컬렉션 허용 시도
          }
      }
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 overflow-hidden">
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%' }}
        className="flex-1 rounded-xl overflow-hidden shadow-2xl border border-stone-800"
      />
      <div className="mt-2 md:mt-4 text-stone-500 text-[10px] md:text-xs font-mono text-center shrink-0 pb-2">
        Interact with objects to perform actions.
      </div>
    </div>
  );
};

export default MainForgeCanvas;
