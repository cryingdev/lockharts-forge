import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { X, Scissors } from 'lucide-react';
import { getAssetUrl } from '../../../utils';
import WorkbenchScene from '../../../game/WorkbenchScene';

interface WorkbenchMinigameProps {
  onComplete: (score: number, bonus?: number) => void;
  onClose: () => void;
  difficulty?: number;
}

function getViewportSize() {
  const vv = window.visualViewport;
  const w = vv?.width ?? window.innerWidth;
  const h = vv?.height ?? window.innerHeight;
  return { w: Math.floor(w), h: Math.floor(h) };
}

const WorkbenchMinigame: React.FC<WorkbenchMinigameProps> = ({ onComplete, onClose, difficulty = 1 }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  const onCompleteRef = useRef(onComplete);
  const onCloseRef = useRef(onClose);
  
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ensureWrapperSize = () => {
      const { w, h } = getViewportSize();
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
    };

    const sync = () => {
      ensureWrapperSize();
      if (gameRef.current) gameRef.current.scale.resize(el.clientWidth, el.clientHeight);
    };

    if (!isReady) {
        ensureWrapperSize();
        if (el.clientWidth > 0) setIsReady(true);
        else requestAnimationFrame(sync);
        return;
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO, parent: el,
      width: el.clientWidth, height: el.clientHeight,
      backgroundColor: '#0c0a09', scene: [WorkbenchScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
    };
    const game = new Phaser.Game(config);
    gameRef.current = game;
    
    game.scene.start('WorkbenchScene', { 
      onComplete: (score: number, bonus?: number) => onCompleteRef.current(score, bonus), 
      difficulty 
    });

    const vv = window.visualViewport;
    vv?.addEventListener('resize', sync);
    window.addEventListener('orientationchange', () => {
        sync(); setTimeout(sync, 150);
    });

    return () => { 
        vv?.removeEventListener('resize', sync);
        if (gameRef.current) gameRef.current.destroy(true); 
    };
  }, [isReady, difficulty]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 overflow-hidden touch-none">
        <div className="w-full h-10 md:h-14 shrink-0 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-4 z-10 shadow-lg">
            <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-200 font-bold text-xs md:text-sm tracking-wide">Workbench</span>
            </div>
            <button onClick={() => onCloseRef.current()} className="flex items-center gap-1 px-3 py-1 bg-stone-800 hover:bg-red-900/20 text-stone-400 hover:text-red-400 rounded border border-stone-700 transition-all text-[10px] font-bold">
                <X className="w-3 h-3" /> CANCEL
            </button>
        </div>
        <div ref={containerRef} className="flex-1" />
    </div>
  );
};

export default WorkbenchMinigame;