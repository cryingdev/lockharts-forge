
import React, { useEffect, useRef, useCallback, useState } from 'react';
import Phaser from 'phaser';
import { X } from 'lucide-react';
import { useGame } from '../../../context/GameContext';
import { MATERIALS } from '../../../data/materials';
import SmithingScene from '../../../game/SmithingScene';

interface SmithingMinigameProps {
  // Fix: Updated onComplete signature to support optional bonus parameter
  onComplete: (score: number, bonus?: number) => void;
  onClose: () => void;
  difficulty?: number;
}

const SmithingMinigame: React.FC<SmithingMinigameProps> = ({ onComplete, onClose, difficulty = 1 }) => {
  const { state, actions } = useGame();
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const charcoalCount = state.inventory.find((i) => i.id === MATERIALS.CHARCOAL.id || i.id === 'charcoal')?.quantity || 0;

  // 콜백들을 최신으로 유지하기 위한 Refs
  const onCompleteRef = useRef(onComplete);
  const actionsRef = useRef(actions);
  
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { actionsRef.current = actions; }, [actions]);

  const handleCancel = useCallback(() => {
    if (gameRef.current) {
      const s = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
      if (s) actionsRef.current.updateForgeStatus(s.getTemperature());
    }
    onClose();
  }, [onClose]);

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
    
    // 이펙트 내에서 state를 직접 참조하는 대신 초기 값만 사용
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
      actionsRef.current.consumeItem(MATERIALS.CHARCOAL.id, 1);
      const scene = game.scene.getScene('SmithingScene') as SmithingScene;
      if (scene) scene.heatUp();
    };

    // 씬 시작 시 Refs를 사용하여 콜백 연결
    // Fix: Updated scene start configuration to handle optional bonus argument
    game.scene.start('SmithingScene', { 
      onComplete: (score: number, bonus?: number) => onCompleteRef.current(score, bonus), 
      difficulty, 
      initialTemp, 
      charcoalCount, 
      onStatusUpdate: (t: number) => actionsRef.current.updateForgeStatus(t), 
      onHeatUpRequest: handleHeatUp 
    });

    return () => { 
      resizeObserver.disconnect();
      if (gameRef.current) {
        gameRef.current.destroy(true); 
        gameRef.current = null; 
      }
    };
    // onComplete와 actions를 의존성에서 제거하여 불필요한 재시작 방지
  }, [isReady, difficulty]); 

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
