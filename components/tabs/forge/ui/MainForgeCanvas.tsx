
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import MainForgeScene, { MainForgeData } from '../../../../game/MainForgeScene';
import { useGame } from '../../../../context/GameContext';

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
          case 'ANVIL': actions.repairItem(); break;
          case 'EMPTY_SLOT': break;
          case 'FURNACE': break;
        }
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (gameRef.current) {
        try {
            const scene = gameRef.current.scene.getScene('MainForgeScene');
            if (scene && gameRef.current.isRunning) scene.scene.restart(sceneData);
            else { gameRef.current.destroy(true); gameRef.current = null; }
        } catch (e) {
            if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }
        }
    }

    if (!gameRef.current && containerRef.current) {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO, parent: containerRef.current, width: containerRef.current.clientWidth, height: containerRef.current.clientHeight, backgroundColor: '#0c0a09',
            scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
            render: { transparent: false, antialias: true, powerPreference: 'high-performance' },
            callbacks: { postBoot: (game) => { game.events.on('blur', () => {}); game.events.on('focus', () => {}); } },
            scene: [MainForgeScene],
        };
        const game = new Phaser.Game(config);
        gameRef.current = game;
        game.scene.start('MainForgeScene', sceneData);
        resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (game && game.scale && width > 0 && height > 0) game.scale.resize(width, height);
            }
        });
        resizeObserver.observe(containerRef.current);
    }
    return () => { if (resizeObserver) resizeObserver.disconnect(); }
  }, [isReady, state.forge.hasFurnace, actions]); 
  
  useEffect(() => {
      return () => { if (gameRef.current) { const game = gameRef.current; gameRef.current = null; game.destroy(true); } }
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 overflow-hidden">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} className="flex-1 rounded-xl overflow-hidden shadow-2xl border border-stone-800" />
      <div className="mt-2 md:mt-4 text-stone-500 text-[10px] md:text-xs font-mono text-center shrink-0 pb-2">Interact with objects to perform actions.</div>
    </div>
  );
};

export default MainForgeCanvas;
