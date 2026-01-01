import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import IntroScene from '../game/IntroScene';

interface IntroScreenProps {
  onComplete: () => void;
}

function getViewport() {
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  return { vw: Math.floor(vw), vh: Math.floor(vh) };
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [debug, setDebug] = useState('');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ensureWrapperSize = () => {
      const { vw, vh } = getViewport();
      el.style.width = '100%';
      el.style.height = `${vh}px`; // ✅ “보이는 높이”로 고정
      el.style.overflow = 'hidden';
      el.style.touchAction = 'none';
      setDebug(`viewport=${vw}x${vh} dpr=${window.devicePixelRatio ?? 1}`);
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

    // ✅ Phaser 최초 생성
    if (!gameRef.current) {
      ensureWrapperSize();

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: el,
        width: 1280,
        height: 720,
        backgroundColor: '#000000',
        scene: [IntroScene],
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;

      const onIntroComplete = () => onComplete();
      game.events.on('intro-complete', onIntroComplete);

      // cleanup
      const cleanup = () => {
        game.events.off('intro-complete', onIntroComplete);
        game.destroy(true);
        gameRef.current = null;
      };

      // 컴포넌트 언마운트 시 정리
      return () => cleanup();
    }

    // ✅ “회전/뷰포트 변화” 감지 → sync(재계산 + 업데이트)
    const vv = window.visualViewport;

    const onOC = () => {
      // iOS 등에서 값이 늦게 안정화되므로 지연 호출까지
      sync();
      setTimeout(sync, 60);
      setTimeout(sync, 180);
    };

    vv?.addEventListener('resize', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', onOC);

    // wrapper 자체 크기 변화도 감지(레이아웃 변화 대응)
    const ro = new ResizeObserver(() => requestAnimationFrame(sync));
    ro.observe(el);

    // 최초 1회 동기화
    sync();

    return () => {
      ro.disconnect();
      vv?.removeEventListener('resize', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', onOC);
    };
  }, [onComplete]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'black', overflow: 'hidden', zIndex: 9999 }}>
      <div ref={containerRef} />

      {/* 상단 디버그 텍스트 */}
      <div
        style={{
          position: 'fixed',
          left: 8,
          top: 8,
          padding: '6px 8px',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.65)',
          color: 'white',
          fontSize: 12,
          fontFamily: 'monospace',
          zIndex: 2147483647,
          pointerEvents: 'none',
          whiteSpace: 'pre',
        }}
      >
        {debug}
      </div>
    </div>
  );
}