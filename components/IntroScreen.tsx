import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import IntroScene from '../game/IntroScene';

interface IntroScreenProps {
  onComplete: () => void;
}

function getViewportSize() {
  const vv = window.visualViewport;
  const w = vv?.width ?? window.innerWidth;
  const h = vv?.height ?? window.innerHeight;
  return { w: Math.floor(w), h: Math.floor(h) };
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const handleProgress = (e: any) => {
        if (typeof e.detail?.progress === 'number') {
            const progress = e.detail.progress;
            const assetName = e.detail.assetName || 'Unknown';
            const assetType = e.detail.assetType || 'Asset';
            setLoadingProgress(progress);
            
            // 상세 진행률 로그 출력
            console.log(
                `%c[AssetLoader] ${progress}% %c| ${assetType}: ${assetName}`, 
                "color: #fbbf24; font-weight: bold; background: #1c1917; padding: 2px 4px; border-radius: 2px;",
                "color: #78716c; font-weight: normal;"
            );
            
            if (progress >= 100) {
                console.log(
                    "%c[AssetLoader] INTERNALIZED | All resources mapped to memory. Readiness confirmed.", 
                    "color: #10b981; font-weight: 900; background: #064e3b; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; border: 1px solid #10b981;"
                );
            }
        }
    };
    window.addEventListener('asset-loading-progress', handleProgress);
    return () => window.removeEventListener('asset-loading-progress', handleProgress);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ensureWrapperSize = () => {
      const { w, h } = getViewportSize();
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.overflow = 'hidden';
      el.style.touchAction = 'none';
      el.style.position = 'relative';
    };

    const resizePhaserToWrapper = () => {
      const game = gameRef.current;
      if (!game) return;
      const rect = el.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w <= 0 || h <= 0) return;
      game.scale.resize(w, h);
      requestAnimationFrame(() => {
        game.scale.refresh();
      });
    };

    let rafId = 0;
    const sync = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        ensureWrapperSize();
        resizePhaserToWrapper();
      });
    };

    const createGameOnce = () => {
      if (gameRef.current) return;
      ensureWrapperSize();
      const rect = el.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: el,
        width: w,
        height: h,
        backgroundColor: '#000000',
        scene: [IntroScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      };

      console.log("[Intro] Initializing cinematic engine...");
      const game = new Phaser.Game(config);
      gameRef.current = game;

      const onIntroComplete = () => {
          console.log("%c[Intro] Sequence concluded. Navigating to title.", "color: #8b5cf6; font-weight: bold;");
          onComplete();
      };
      game.events.on('intro-complete', onIntroComplete);

      sync();
      setTimeout(sync, 80);
      setTimeout(sync, 180);

      return () => {
        game.events.off('intro-complete', onIntroComplete);
        game.destroy(true);
        gameRef.current = null;
      };
    };

    let cancelled = false;
    const waitForSizeAndCreate = () => {
      if (cancelled) return;
      ensureWrapperSize();
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return createGameOnce();
      }
      requestAnimationFrame(waitForSizeAndCreate);
    };

    const gameCleanup = waitForSizeAndCreate();

    const vv = window.visualViewport;
    const onOrientationChange = () => {
      sync();
      setTimeout(sync, 100);
      setTimeout(sync, 250);
      setTimeout(sync, 450);
    };

    vv?.addEventListener('resize', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', onOrientationChange);

    const ro = new ResizeObserver(() => sync());
    ro.observe(el);

    sync();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      vv?.removeEventListener('resize', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', onOrientationChange);
      if (typeof gameCleanup === 'function') gameCleanup();
    };
  }, [onComplete]);

  const isComplete = loadingProgress >= 100;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden touch-none">
      <div ref={containerRef} />
      
      {/* Asset Loading Progress Bar Overlay */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-48 md:w-64 flex flex-col items-center gap-2 transition-opacity duration-1000 ${isComplete ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex justify-between w-full px-1">
            <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest">Internalizing Assets</span>
            <span className="text-[8px] font-mono font-bold text-amber-500/80">{loadingProgress}%</span>
        </div>
        <div className="w-full h-1 bg-stone-900 rounded-full border border-white/5 overflow-hidden shadow-inner">
            <div 
                className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                style={{ width: `${loadingProgress}%` }}
            />
        </div>
      </div>
    </div>
  );
}