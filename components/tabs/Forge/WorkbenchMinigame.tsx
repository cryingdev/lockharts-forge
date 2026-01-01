
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { X, Scissors } from 'lucide-react';
import { getAssetUrl } from '../../../utils';

interface WorkbenchMinigameProps {
  onComplete: (score: number, bonus?: number) => void;
  onClose: () => void;
  difficulty?: number;
}

// Fix: Implemented the missing WorkbenchScene class to handle the workbench crafting minigame
class WorkbenchScene extends Phaser.Scene {
  private onComplete?: (score: number, bonus?: number) => void;
  private difficulty: number = 1;

  constructor() {
    super('WorkbenchScene');
  }

  init(data: { onComplete: (score: number, bonus?: number) => void; difficulty: number }) {
    this.onComplete = data.onComplete;
    this.difficulty = data.difficulty;
  }

  create() {
    const { width, height } = this.scale;
    
    // Simple visual layout
    this.add.rectangle(0, 0, width, height, 0x1c1917).setOrigin(0);
    
    this.add.text(width / 2, height / 2 - 60, 'WORKBENCH', {
      fontFamily: 'serif',
      fontSize: '42px',
      color: '#10b981',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, 'Assembling delicate components...', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Interactive button to complete the minigame
    const btn = this.add.container(width / 2, height / 2 + 80);
    const bg = this.add.rectangle(0, 0, 260, 60, 0x065f46).setInteractive({ cursor: 'pointer' }).setStrokeStyle(2, 0x10b981);
    const txt = this.add.text(0, 0, 'FINISH ASSEMBLY', { fontSize: '18px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    btn.add([bg, txt]);

    bg.on('pointerdown', () => {
      // Calculate a randomized score based on difficulty (placeholder logic)
      const baseScore = 95 - (this.difficulty * 2);
      const variance = Math.floor(Math.random() * 15);
      const finalScore = Math.min(115, baseScore + variance);
      
      this.onComplete?.(finalScore, this.difficulty > 2 ? 5 : 0); 
    });

    bg.on('pointerover', () => bg.setFillStyle(0x059669));
    bg.on('pointerout', () => bg.setFillStyle(0x065f46));
  }
}

const WorkbenchMinigame: React.FC<WorkbenchMinigameProps> = ({ onComplete, onClose, difficulty = 1 }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const checkSize = () => {
        if (containerRef.current && containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) setIsReady(true);
        else requestAnimationFrame(checkSize);
    };
    checkSize();
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current) return;
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO, parent: containerRef.current,
      width: containerRef.current.clientWidth, height: containerRef.current.clientHeight,
      backgroundColor: '#0c0a09', scene: [WorkbenchScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
    };
    const game = new Phaser.Game(config);
    gameRef.current = game;
    
    // onCompleteRef.current를 호출하는 래퍼 함수 전달
    game.scene.start('WorkbenchScene', { 
        onComplete: (score: number, bonus?: number) => onCompleteRef.current(score, bonus), 
        difficulty 
    });

    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            if (game && game.scale && width > 0 && height > 0) {
                game.scale.resize(width, height);
            }
        }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => { 
        resizeObserver.disconnect();
        if (gameRef.current) gameRef.current.destroy(true); 
    };
  }, [isReady, difficulty]); 

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-stone-950 animate-in fade-in duration-300 overflow-hidden">
        <div className="w-full h-10 md:h-14 shrink-0 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-4 z-10 shadow-lg">
            <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-200 font-bold text-xs md:text-sm tracking-wide">Workbench</span>
            </div>
            <button onClick={onClose} className="flex items-center gap-1 px-3 py-1 bg-stone-800 hover:bg-red-900/20 text-stone-400 hover:text-red-400 rounded border border-stone-700 transition-all text-[10px] font-bold">
                <X className="w-3 h-3" /> CANCEL
            </button>
        </div>
        <div className="flex-1 w-full relative flex items-center justify-center bg-[#1c1917] overflow-hidden">
            <div 
              ref={containerRef} 
              style={{ width: '100%', height: '100dvh' }}
              className="overflow-hidden" 
            />
        </div>
    </div>
  );
};

export default WorkbenchMinigame;
