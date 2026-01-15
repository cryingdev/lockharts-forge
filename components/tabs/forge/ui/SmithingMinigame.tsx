
import React, { useEffect, useRef, useCallback, useState } from 'react';
import Phaser from 'phaser';
import { X } from 'lucide-react';
import { useGame } from '../../../../context/GameContext';
import { materials } from '../../../../data/materials';
import SmithingScene from '../../../../game/SmithingScene';

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

  const charcoalCount = state.inventory.find((i) => i.id === materials.charcoal.id || i.id === 'charcoal')?.quantity || 0;

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
      const el = containerRef.current;
      if (el && el.clientWidth > 0 && el.clientHeight > 0) setIsReady(true);
      else requestAnimationFrame(checkSize);
    };
    checkSize();
  }, []);

  // Phaser 게임 인스턴스 생성 (최소한의 의존성)
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
      render: {
          pixelArt: true,
          antialias: false
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

    const handleHeatUp = () => {
      if (!isTutorial) {
          actionsRef.current.consumeItem(materials.charcoal.id, 1);
      }
      const scene = game.scene.getScene('SmithingScene') as SmithingScene;
      if (scene) scene.heatUp();
    };

    game.scene.start('SmithingScene', {
      onComplete: (score: number, bonus?: number) => onCompleteRef.current(score, bonus),
      difficulty,
      initialTemp,
      charcoalCount: isTutorial ? '∞' : charcoalCount,
      onStatusUpdate: (t: number) => actionsRef.current.updateForgeStatus(t),
      onHeatUpRequest: handleHeatUp,
    });

    const sync = () => {
      ensureWrapperSize();
      if (gameRef.current) {
        gameRef.current.scale.resize(Math.floor(el.clientWidth), Math.floor(el.clientHeight));
        gameRef.current.scale.refresh();
      }
    };

    const vv = window.visualViewport;
    vv?.addEventListener('resize', sync);
    window.addEventListener('resize', sync);
    const ro = new ResizeObserver(() => requestAnimationFrame(sync));
    ro.observe(el);

    return () => {
      ro.disconnect();
      vv?.removeEventListener('resize', sync);
      window.removeEventListener('resize', sync);
      if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]); // difficulty나 charcoalCount 등 자주 변하는 값은 별도 Effect로 처리

  // 데이터 갱신을 위한 별도 Effect
  useEffect(() => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
    if (scene) scene.updateCharcoalCount(isTutorial ? '∞' : charcoalCount);
  }, [charcoalCount, isTutorial]);

  return (
    <div className="absolute inset-0 z-50 bg-stone-950 animate-in fade-in duration-300 overflow-hidden">
      <button
        onClick={handleCancel}
        className="absolute top-2 left-2 md:top-4 md:left-4 z-50 p-2 md:p-3 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 hover:text-red-100 rounded-full border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90"
        title="Cancel Forging"
      >
        <X className="w-5 h-5" />
      </button>

      <div ref={containerRef} className="w-full h-full overflow-hidden" />
    </div>
  );
};

export default SmithingMinigame;