import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // --- wrapper size를 "실제 viewport"에 맞춤 (iOS 주소창/툴바 변화 대응) ---
    const ensureWrapperSize = () => {
      const { w, h } = getViewportSize();
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.overflow = 'hidden';
      el.style.touchAction = 'none';
      el.style.position = 'relative';
    };

    // --- Phaser를 wrapper 크기에 맞춰 리사이즈 ---
    const resizePhaserToWrapper = () => {
      const game = gameRef.current;
      if (!game) return;

      const rect = el.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w <= 0 || h <= 0) return;

      game.scale.resize(w, h);

      // iOS에서 내부 레이아웃이 한 템포 늦게 정리되는 경우가 있어 refresh를 다음 프레임에
      requestAnimationFrame(() => {
        game.scale.refresh();
      });
    };

    // --- rAF로 과도한 resize 호출 방지 ---
    let rafId = 0;
    const sync = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        ensureWrapperSize();
        resizePhaserToWrapper();
      });
    };

    // --- Phaser Game 생성: 반드시 wrapper가 실제 사이즈를 가진 뒤에 생성 ---
    const createGameOnce = () => {
      if (gameRef.current) return;

      ensureWrapperSize();

      const rect = el.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO, // 필요하면 WEBGL로 고정해도 됨
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

      const game = new Phaser.Game(config);
      gameRef.current = game;

      const onIntroComplete = () => onComplete();
      game.events.on('intro-complete', onIntroComplete);

      // 생성 직후 1회 동기화 + 지연 동기화 (iOS 안정화용)
      sync();
      setTimeout(sync, 80);
      setTimeout(sync, 180);

      // cleanup
      return () => {
        game.events.off('intro-complete', onIntroComplete);
        game.destroy(true);
        gameRef.current = null;
      };
    };

    // wrapper가 0px로 잡히는 순간이 있어서 “사이즈 확보될 때까지” 기다렸다가 생성
    let cancelled = false;
    const waitForSizeAndCreate = () => {
      if (cancelled) return;
      ensureWrapperSize();
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const cleanup = createGameOnce();
        // 리스너 등록은 아래에서 하고, 언마운트 시 cleanup 같이 수행
        return cleanup;
      }
      requestAnimationFrame(waitForSizeAndCreate);
    };

    const gameCleanup = waitForSizeAndCreate();

    // --- 리사이즈 / 오리엔테이션 이벤트들 ---
    const vv = window.visualViewport;

    const onOrientationChange = () => {
      // orientationchange 직후 중간값이 들어오는 경우가 많아서 여러 번 sync
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

    // 최초 1회
    sync();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);

      ro.disconnect();
      vv?.removeEventListener('resize', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', onOrientationChange);

      // Phaser cleanup
      if (typeof gameCleanup === 'function') gameCleanup();
      else if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden touch-none">
      <div ref={containerRef} />
    </div>
  );
}