import React, { useEffect, useRef, useCallback, useState } from 'react';
import Phaser from 'phaser';
import { X, Pointer } from 'lucide-react';
import { useGame } from '../../../../context/GameContext';
import { materials } from '../../../../data/materials';
import SmithingScene from '../../../../game/SmithingScene';
import { SmithingTutorialOverlay } from './SmithingTutorialOverlay';
import { t } from '../../../../utils/i18n';

interface SmithingMinigameProps {
  onComplete: (score: number, bonus?: number) => void;
  onClose: () => void;
  difficulty?: number;
  masteryCount?: number;
  isTutorial?: boolean;
}

function getViewport() {
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  return { vw: Math.floor(vw), vh: Math.floor(vh) };
}

const SmithingMinigame: React.FC<SmithingMinigameProps> = ({ onComplete, onClose, difficulty = 1, masteryCount = 0, isTutorial = false }) => {
  const { state, actions } = useGame();
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [tutorialTarget, setTutorialTarget] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [heatBtnRect, setHeatBtnRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [currentTemp, setCurrentTemp] = useState(0);
  const [tutorialStrikeReady, setTutorialStrikeReady] = useState(false);
  const [firstHitTutorialConsumed, setFirstHitTutorialConsumed] = useState(false);

  const charcoalCount = state.inventory.find((i) => i.id === materials.charcoal.id || i.id === 'charcoal')?.quantity || 0;
  const language = state.settings.language;

  const onCompleteRef = useRef(onComplete);
  const actionsRef = useRef(actions);
  const stateRef = useRef(state);
  
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { actionsRef.current = actions; }, [actions]);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
      if (isTutorial && state.tutorialStep === 'SMITHING_TOUCH_TO_START_GUIDE') {
          setFirstHitTutorialConsumed(false);
          setTutorialTarget(null);
          setTutorialStrikeReady(false);
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
          if (scene) {
            if (stateRef.current.tutorialStep === 'SMITHING_INTRO_DIALOG_GUIDE') {
              scene.startTutorialHitGuide();
            } else if (stateRef.current.tutorialStep === 'FIRST_HIT_DIALOG_GUIDE') {
              scene.resumeTutorialStrike();
            } else {
              scene.resumeTutorialCrafting();
            }
          }
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

    const isTutorialHotStart =
      isTutorial &&
      [
        'SMITHING_TOUCH_TO_START_GUIDE',
        'SMITHING_INTRO_DIALOG_GUIDE',
        'FIRST_HIT_DIALOG_GUIDE',
        'SMITHING_MINIGAME_HIT_GUIDE',
      ].includes(state.tutorialStep || '');

    const initialTemp = isTutorialHotStart
      ? 1500
      : Math.max(
          0,
          (state.forgeTemperature || 0) - ((Date.now() - (state.lastForgeTime || 0)) / 1000) * 30
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
      render: {
        pixelArt: false,
        antialias: true,
        antialiasGL: true,
        roundPixels: false,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;
    (game as any).tutorialStep = state.tutorialStep;

    const handleHeatUp = () => {
      if (!isTutorial) {
        actionsRef.current.consumeItem(materials.charcoal.id, 1);
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
      masteryCount,
      initialTemp,
      charcoalCount: isTutorial ? '∞' : charcoalCount,
      isTutorial,
      touchToStartLabel: t(language, 'smithingTutorial.ui.touch_to_start'),
      forgeColdLabel: t(language, 'smithingTutorial.ui.forge_cold'),
      onStatusUpdate: (t: number) => {
          setCurrentTemp(t);
      },
      onHeatUpRequest: handleHeatUp,
      onHeatBtnUpdate: (rect: any) => setHeatBtnRect(rect),
      onTutorialTargetUpdate: (rect: any) => setTutorialTarget(rect),
      onTutorialStrikeReadyChange: (ready: boolean) => setTutorialStrikeReady(ready),
      onTutorialAction: (action: 'FIRST_HIT_DONE' | 'CRAFT_FINISHED' | 'START_FIRST_HIT_DIALOG' | 'START_PRE_FIRST_HIT_DIALOG') => {
          if (action === 'START_PRE_FIRST_HIT_DIALOG') {
              actionsRef.current.setTutorialStep('SMITHING_INTRO_DIALOG_GUIDE');
          } else if (action === 'START_FIRST_HIT_DIALOG') {
              actionsRef.current.setTutorialStep('FIRST_HIT_DIALOG_GUIDE');
          } else if (action === 'FIRST_HIT_DONE') {
              setFirstHitTutorialConsumed(true);
              setTutorialTarget(null);
              setTutorialStrikeReady(false);
          } else if (action === 'CRAFT_FINISHED') {
              actionsRef.current.setTutorialStep('CRAFT_RESULT_DIALOG_GUIDE');
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
  }, [isReady, language]);

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

  const isFirstHitMinigameGuide = state.tutorialStep === 'SMITHING_MINIGAME_HIT_GUIDE' && !firstHitTutorialConsumed;
  const showOverlay = isTutorial && (
    isFirstHitMinigameGuide ||
    state.tutorialStep === 'SMITHING_INTRO_DIALOG_GUIDE' ||
    state.tutorialStep === 'FIRST_HIT_DIALOG_GUIDE'
  );

  const showPointer = currentTemp < 26.2 && !isTutorial;

  return (
    <div className="absolute inset-0 z-50 bg-stone-950 animate-in fade-in duration-300 overflow-hidden">
      <style>{`
        @keyframes bounce-x-right {
          0%, 100% { transform: translate(-100%, -50%) translateX(0); }
          50% { transform: translate(-100%, -50%) translateX(12px); }
        }
        .animate-bounce-x-right { animation: bounce-x-right 0.8s infinite ease-in-out; }
      `}</style>

      {showOverlay ? (
          <SmithingTutorialOverlay 
            step={state.tutorialStep || ''} 
            targetCoord={tutorialTarget} 
            strikePromptVisible={tutorialStrikeReady}
            onResume={handleResumeTutorialFromReact}
          />
      ) : null}

      {showPointer && heatBtnRect && (
        <div 
          className="absolute z-[120] pointer-events-none animate-bounce-x-right"
          style={{ 
            left: heatBtnRect.x - (heatBtnRect.w / 2) - 10,
            top: heatBtnRect.y,
            transform: 'translate(-100%, -50%)'
          }}
        >
          <div className="flex items-center gap-2">
            <div className="bg-amber-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-2xl border-2 border-amber-400 whitespace-nowrap">
              Forge is Cold!
            </div>
            <Pointer className="w-8 h-8 md:w-10 md:h-10 text-amber-400 fill-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] rotate-90" />
          </div>
        </div>
      )}
      
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
