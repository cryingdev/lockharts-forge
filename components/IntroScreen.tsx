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

      // ✅ wrapper는 "보이는 높이" 기준으로 고정 (iOS 주소창/툴바 변화 대응)
      el.style.width = '100%';
      el.style.height = `${vh}px`;
      el.style.overflow = 'hidden';
      el.style.touchAction = 'none';

      // debug
      const mmPortrait = window.matchMedia?.('(orientation: portrait)')?.matches;
      const mmLandscape = window.matchMedia?.('(orientation: landscape)')?.matches;
      const scrOri =
        (screen.orientation && (screen.orientation as any).type)
          ? (screen.orientation as any).type
          : 'n/a';
      const wOri = (window as any).orientation ?? 'n/a';

      const cw = Math.floor(el.clientWidth);
      const ch = Math.floor(el.clientHeight);

      setDebug(
        [
          `wrapper=${cw}x${ch}`,
          `window=${Math.floor(window.innerWidth)}x${Math.floor(window.innerHeight)}`,
          `visualViewport=${vw}x${vh}`,
          `matchMedia portrait=${mmPortrait} landscape=${mmLandscape}`,
          `screen.orientation=${scrOri}`,
          `window.orientation=${wOri}`,
          `dpr=${window.devicePixelRatio ?? 1}`,
        ].join('\n')
      );
    };

    const resizePhaserToWrapper = () => {
      const game = gameRef.current;
      if (!game) return;

      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w <= 0 || h <= 0) return;

      game.scale.resize(w, h);

      // iOS에서 리사이즈 직후 1프레임 늦게 반영되는 경우가 있어 refresh 호출
      requestAnimationFrame(() => {
        game.scale.refresh();
      });
    };

    const sync = () => {
      ensureWrapperSize();
      resizePhaserToWrapper();
    };

    // ✅ Phaser 생성 (1회)
    if (!gameRef.current) {
      ensureWrapperSize();

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: el,
        // 기준 해상도(초기 좌표계 안정화용)
        width: 1280,
        height: 720,
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

      // 첫 동기화 (Phaser 생성 직후)
      sync();

      // cleanup
      return () => {
        game.events.off('intro-complete', onIntroComplete);
        game.destroy(true);
        gameRef.current = null;
      };
    }

    // ✅ 회전/주소창 변화/레이아웃 변화 감지 → 다시 계산 + resize
    const vv = window.visualViewport;

    const onOrientationChange = () => {
      // iOS에서 orientationchange 직후 값이 늦게 안정화될 수 있어 지연 호출까지
      sync();
      setTimeout(sync, 60);
      setTimeout(sync, 180);
    };

    vv?.addEventListener('resize', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', onOrientationChange);

    // wrapper 자체 크기 변화를 감지 (루트 레이아웃이 바뀌는 경우)
    const ro = new ResizeObserver(() => requestAnimationFrame(sync));
    ro.observe(el);

    // 최초 1회
    sync();

    return () => {
      ro.disconnect();
      vv?.removeEventListener('resize', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'black',
        overflow: 'hidden',
        zIndex: 9999,
      }}
    >
      <div ref={containerRef} />

      {/* ✅ 상단 디버그 텍스트 */}
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
          maxWidth: '95vw',
        }}
      >
        {debug}
      </div>
    </div>
  );
}