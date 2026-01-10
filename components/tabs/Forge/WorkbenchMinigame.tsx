
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { X, Scissors } from 'lucide-react';
import { useGame } from '../../../context/GameContext';
import WorkbenchScene from '../../../game/WorkbenchScene';

interface WorkbenchMinigameProps {
  onComplete: (score: number, bonus?: number) => void;
  onClose: () => void;
  difficulty?: number;
  subCategoryId?: string;
  itemImage?: string;
}

function getViewport() {
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  return { vw: Math.floor(vw), vh: Math.floor(vh) };
}

const WorkbenchMinigame: React.FC<WorkbenchMinigameProps> = ({ onComplete, onClose, difficulty = 1, subCategoryId, itemImage }) => {
  const { state } = useGame();
  const gameRef = useRef<Phaser.Game | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const checkSize = () => {
      const el = containerRef.current;
      if (el && el.clientWidth > 0 && el.clientHeight > 0) setIsReady(true);
      else requestAnimationFrame(checkSize);
    };
    checkSize();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const viewportEl = viewportRef.current;
    const el = containerRef.current;
    if (!viewportEl || !el) return;

    const ensureWrapperSize = () => {
      const { vh } = getViewport();
      viewportEl.style.width = '100%';
      viewportEl.style.height = `${vh}px`;
      viewportEl.style.overflow = 'hidden';
      viewportEl.style.touchAction = 'none';

      el.style.width = '100%';
      el.style.height = '100%';
    };

    const resizePhaserToWrapper = () => {
      const game = gameRef.current;
      if (!game) return;
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w <= 0 || h <= 0) return;
      game.scale.resize(w, h);
      requestAnimationFrame(() => game.scale.refresh());
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
        width: Math.floor(el.clientWidth) || 1,
        height: Math.floor(el.clientHeight) || 1,
        backgroundColor: '#0c0a09',
        scene: [WorkbenchScene],
        pauseOnBlur: false,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        callbacks: {
            postBoot: (game) => {
                game.events.on('blur', () => {});
                game.events.on('focus', () => {});
            }
        }
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;
      
      game.scene.start('WorkbenchScene', {
        onComplete: (score: number, bonus?: number) => onCompleteRef.current(score, bonus),
        difficulty,
        subCategoryId,
        itemImage,
      });

      sync();
    } else {
      sync();
    }

    const vv = window.visualViewport;
    const onOrientationChange = () => {
      sync();
      setTimeout(sync, 100);
      setTimeout(sync, 300);
    };

    vv?.addEventListener('resize', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', onOrientationChange);

    const ro = new ResizeObserver(() => requestAnimationFrame(sync));
    ro.observe(el);

    sync();
    setTimeout(sync, 80);

    return () => {
      ro.disconnect();
      vv?.removeEventListener('resize', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, [isReady, difficulty, subCategoryId, itemImage]);

  useEffect(() => {
    return () => {
      if (gameRef.current) {
        const game = gameRef.current;
        gameRef.current = null;
        game.destroy(true, false);
      }
    };
  }, []);

  return (
    <div
      ref={viewportRef}
      className="fixed inset-0 z-[100] flex flex-col bg-stone-950 animate-in fade-in duration-300 overflow-hidden"
    >
      <div className="w-full h-12 md:h-16 shrink-0 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-4 z-10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-900/30 rounded-lg border border-emerald-800/50">
            <Scissors className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
          </div>
          <span className="text-stone-200 font-bold text-xs md:text-base tracking-widest uppercase font-serif">Workbench</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-1.5 bg-stone-800 hover:bg-red-900/40 text-stone-400 hover:text-red-300 rounded-lg border border-stone-700 transition-all text-[10px] md:text-xs font-black uppercase tracking-tighter"
        >
          <X className="w-3 h-3 md:w-4 md:h-4" /> Cancel
        </button>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center bg-[#1c1917] overflow-hidden">
        <div ref={containerRef} className="w-full h-full overflow-hidden" />
      </div>
    </div>
  );
};

export default WorkbenchMinigame;
