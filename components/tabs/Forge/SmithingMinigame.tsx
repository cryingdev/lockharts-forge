
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

  // Wait for container to have actual dimensions before starting Phaser
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
    
    // Calculate initial temperature based on time since last forge
    const initialTemp = Math.max(0, (state.forgeTemperature || 0) - ((Date.now() - (state.lastForgeTime || 0)) / 1000) * 5);
    
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#0c0a09',
      scene: [SmithingScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

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
      if (gameRef.current) {
        gameRef.current.destroy(true); 
        gameRef.current = null; 
      }
    };
  }, [isReady, onComplete, difficulty]);

  // Sync charcoal count changes to the active Phaser scene
  useEffect(() => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
      if (scene) scene.updateCharcoalCount(charcoalCount);
    }
  }, [charcoalCount]);

  return (
    <div className="w-full h-full relative bg-stone-950 animate-in fade-in duration-300 overflow-hidden">
      {/* Floating Close Button */}
      <button 
        onClick={handleCancel}
        className="absolute top-4 right-4 z-50 p-2 bg-stone-900/60 hover:bg-red-900/40 text-stone-400 hover:text-red-200 rounded-full border border-stone-700/50 backdrop-blur-md transition-all shadow-xl"
        title="Cancel Forging"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Game Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default SmithingMinigame;
