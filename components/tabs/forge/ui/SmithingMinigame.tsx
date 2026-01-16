
import React, { useEffect, useRef, useCallback, useState } from 'react';
import Phaser from 'phaser';
import { X } from 'lucide-react';
import { useGame } from '../../../../context/GameContext';
import { materials } from '../../../../data/materials';
import SmithingScene from '../../../../game/SmithingScene';
import { SmithingTutorialOverlay } from './SmithingTutorialOverlay';

interface SmithingMinigameProps {
  onComplete: (score: number, bonus?: number) => void;
  onClose: () => void;
  difficulty?: number;
  isTutorial?: boolean;
}

function getViewport() {
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  return { vw: Math.floor(vw), vh: Math.floor(vh) };
}

const SmithingMinigame: React.FC<SmithingMinigameProps> = ({ onComplete, onClose, difficulty = 1, isTutorial = false }) => {
  const { state, actions } = useGame();
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [tutorialTarget, setTutorialTarget] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  const charcoalCount = state.inventory.find((i) => i.id === materials.charcoal.id || i.id === 'charcoal')?.quantity || 0;

  const onCompleteRef = useRef(onComplete);
  const actionsRef = useRef(actions);
  const stateRef = useRef(state);
  
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { actionsRef.current = actions; }, [actions]);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Set initial step of the forge tutorial when entering from START_FORGING_GUIDE to PRE_IGNITE_DIALOG_1
  useEffect(() => {
      if (isTutorial && state.tutorialStep === 'START_FORGING_GUIDE') {
          actionsRef.current.setTutorialStep('PRE_IGNITE_DIALOG_1');
      }
  }, [isTutorial, state.tutorialStep]);

  const handleCancel = useCallback(() => {
    if (gameRef.current) {
      const s = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
      if (s) actionsRef.current.updateForgeStatus(s.getTemperature());
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    const checkSize = () => {
      const el = containerRef.current;
      if (el && el.clientWidth > 0 && el.clientHeight > 0) setIsReady(true);
      else requestAnimationFrame(checkSize);
    };
    checkSize();
  }, []);

  const handleResumeTutorialFromReact = useCallback(() => {
      if (gameRef.current) {
          const scene = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
          if (scene) scene.resumeTutorialCrafting();
      }
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current || gameRef.current) return;
    
    const el = containerRef.current;
    const ensureWrapperSize = () => {
      const { vh } = getViewport();
      el.style.width = '100%';
      el.style.height = `${vh}px`;
      el.style.overflow = 'hidden';
      el.style.touchAction = 'none';
    };

    const initialTemp = Math.max(
      0,
      (state.forgeTemperature || 0) - ((Date.now() - (state.lastForgeTime || 0)) / 1000) * 5
    );

    ensureWrapperSize();

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: el,
      width: Math.floor(el.clientWidth) || 1,
      height: Math.floor(el.clientHeight) || 1,
      backgroundColor: '#0c0a09',
      scene: [SmithingScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: { pixelArt: true, antialias: false },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;
    (game as any).tutorialStep = state.tutorialStep;

    const handleHeatUp = () => {
      if (!isTutorial) {
          actionsRef.current.consumeItem(materials.charcoal.id, 1);
      } else {
          // 지시 단계(INDICATE) 혹은 실제 미니게임 단계에서 클릭 시 다음 설명으로 전환
          const step = stateRef.current.tutorialStep;
          if (step === 'SMITHING_MINIGAME_IGNITE' || step === 'PRE_IGNITE_INDICATE') {
              actionsRef.current.setTutorialStep('PRE_PUMP_DIALOG');
              (game as any).tutorialStep = 'PRE_PUMP_DIALOG';
          }
      }
      
      const scene = game.scene.getScene('SmithingScene') as SmithingScene;
      if (scene) scene.heatUp();
    };

    game.scene.start('SmithingScene', {
      onComplete: (score: number, bonus?: number) => {
          const scene = game.scene.getScene('SmithingScene') as SmithingScene;
          if (scene) actionsRef.current.updateForgeStatus(scene.getTemperature());
          onCompleteRef.current(score, bonus);
      },
      difficulty,
      initialTemp,
      charcoalCount: isTutorial ? '∞' : charcoalCount,
      isTutorial,
      onStatusUpdate: (t: number) => {
          // 풀무질 지시 단계에서 99% 달성 시 중간 다이얼로그로 전환
          const step = stateRef.current.tutorialStep;
          if (isTutorial && (step === 'SMITHING_MINIGAME_PUMP' || step === 'PRE_PUMP_INDICATE') && t >= 99) {
              actionsRef.current.setTutorialStep('POST_PUMP_DIALOG');
              (game as any).tutorialStep = 'POST_PUMP_DIALOG';
          }
      },
      onHeatUpRequest: handleHeatUp,
      onTutorialTargetUpdate: (rect: any) => setTutorialTarget(rect),
      onTutorialAction: (action: 'FIRST_HIT_DONE' | 'CRAFT_FINISHED') => {
          if (action === 'FIRST_HIT_DONE') {
              actionsRef.current.setTutorialStep('FIRST_HIT_DIALOG');
          } else if (action === 'CRAFT_FINISHED') {
              actionsRef.current.setTutorialStep('CRAFT_RESULT_DIALOG');
          }
      }
    });

    const sync = () => {
      ensureWrapperSize();
      if (gameRef.current) {
        gameRef.current.scale.resize(Math.floor(el.clientWidth), Math.floor(el.clientHeight));
        gameRef.current.scale.refresh();
      }
    };

    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('resize', sync);
      if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
      }
    };
  }, [isReady]);

  useEffect(() => {
      if (gameRef.current) {
          (gameRef.current as any).tutorialStep = state.tutorialStep;
      }
  }, [state.tutorialStep]);

  useEffect(() => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
    if (scene) scene.updateCharcoalCount(isTutorial ? '∞' : charcoalCount);
  }, [charcoalCount, isTutorial]);

  const showOverlay = isTutorial && (
    state.tutorialStep?.startsWith('SMITHING_MINIGAME') || 
    state.tutorialStep?.includes('_DIALOG') || 
    state.tutorialStep?.includes('_INDICATE') || 
    state.tutorialStep === 'START_FORGING_GUIDE' || 
    state.tutorialStep === 'FIRST_HIT_DIALOG'
  );

  return (
    <div className="absolute inset-0 z-50 bg-stone-950 animate-in fade-in duration-300 overflow-hidden">
      {showOverlay ? (
          <SmithingTutorialOverlay 
            step={state.tutorialStep || ''} 
            targetCoord={tutorialTarget} 
            onResume={handleResumeTutorialFromReact}
          />
      ) : null}
      
      <button
        onClick={handleCancel}
        className="absolute top-2 left-2 md:top-4 md:left-4 z-[110] p-2 md:p-3 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 hover:text-red-100 rounded-full border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90"
      >
        <X className="w-5 h-5" />
      </button>

      <div ref={containerRef} className="w-full h-full overflow-hidden" />
    </div>
  );
};

export default SmithingMinigame;
