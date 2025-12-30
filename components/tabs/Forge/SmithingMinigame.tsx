import React, { useEffect, useRef, useCallback, useState } from 'react';
import Phaser from 'phaser';
import { X } from 'lucide-react';
import { useGame } from '../../../context/GameContext';
import { MATERIALS } from '../../../data/materials';
import SmithingScene from '../../../game/SmithingScene';

interface SmithingMinigameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  difficulty?: number;
}

const SmithingMinigame: React.FC<SmithingMinigameProps> = ({ onComplete, onClose, difficulty = 1 }) => {
  const { state, actions } = useGame();
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const charcoalCount = state.inventory.find((i) => i.id === MATERIALS.CHARCOAL.id || i.id === 'charcoal')?.quantity || 0;

  const handleCancel = useCallback(() => {
    if (gameRef.current) {
      const s = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
      if (s) actions.updateForgeStatus(s.getTemperature());
    }
    onClose();
  }, [actions, onClose]);

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
    
    const initialTemp = Math.max(0, (state.forgeTemperature || 0) - ((Date.now() - (state.lastForgeTime || 0)) / 1000) * 5);
    
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#0c0a09',
      scene: [SmithingScene],
      scale: { 
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH 
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // ResizeObserver for perfect scaling even with dynamic browser UI components
    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            if (game && game.scale && width > 0 && height > 0) {
                game.scale.resize(width, height);
            }
        }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    const handleHeatUp = () => {
      actions.consumeItem(MATERIALS.CHARCOAL.id, 1);
      const scene = game.scene.getScene('SmithingScene') as SmithingScene;
      if (scene) scene.heatUp();
    };

    game.scene.start('SmithingScene', { 
      onComplete, 
      difficulty, 
      initialTemp, 
      charcoalCount, 
      onStatusUpdate: (t: number) => actions.updateForgeStatus(t), 
      onHeatUpRequest: handleHeatUp 
    });

    return () => { 
      resizeObserver.disconnect();
      if (gameRef.current) {
        gameRef.current.destroy(true); 
        gameRef.current = null; 
      }
    };
  }, [isReady, onComplete, difficulty]);

  useEffect(() => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
      if (scene) scene.updateCharcoalCount(charcoalCount);
    }
  }, [charcoalCount]);

  return (
    <div className="absolute inset-0 z-50 bg-stone-950 animate-in fade-in duration-300 overflow-hidden">
      <button 
        onClick={handleCancel}
        className="absolute top-2 left-2 md:top-4 md:left-4 z-50 p-2 md:p-3 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 hover:text-red-100 rounded-full border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90"
        title="Cancel Forging"
      >
        <X className="w-5 h-5" />
      </button>
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100dvh' }} 
        className="overflow-hidden"
      />
    </div>
  );
};

export default SmithingMinigame;