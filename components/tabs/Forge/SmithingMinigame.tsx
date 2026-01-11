
import React, { useEffect, useRef, useCallback, useState } from 'react';
import Phaser from 'phaser';
import { X } from 'lucide-react';
import { useGame } from '../../../context/GameContext';
import { MATERIALS } from '../../../data/materials';
import SmithingScene from '../../../game/SmithingScene';

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

  const charcoalCount = state.inventory.find((i) => i.id === MATERIALS.CHARCOAL.id || i.id === 'charcoal')?.quantity || 0;

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

  useEffect(() => {
    if (!isReady) return;
    const el = containerRef.current;
    if (!el) return;

    const ensureWrapperSize = () => {
      const { vh } = getViewport();
      el.style.width = '100%';
      el.style.height = `${vh}px`;
      el.style.overflow = 'hidden';
      el.style.touchAction = 'none';
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
        // Fix: Removed 'pauseOnBlur' as it is not a recognized property in some GameConfig type definitions
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
            actionsRef.current.consumeItem(MATERIALS.CHARCOAL.id, 1);
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

      sync();
    }

    const vv = window.visualViewport;
    const onOrientationChange = () => {
      sync();
      setTimeout(sync, 80);
      setTimeout(sync, 180);
    };

    vv?.addEventListener('resize', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', onOrientationChange);

    const ro = new ResizeObserver(() => requestAnimationFrame(sync));
    ro.observe(el);

    return () => {
      ro.disconnect();
      vv?.removeEventListener('resize', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, [isReady, difficulty, isTutorial, state.forgeTemperature, state.lastForgeTime, charcoalCount, actionsRef]);

  useEffect(() => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene('SmithingScene') as SmithingScene;
    if (scene) scene.updateCharcoalCount(isTutorial ? '∞' : charcoalCount);
  }, [charcoalCount, isTutorial]);

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
