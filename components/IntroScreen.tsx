import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import IntroScene from '../game/IntroScene';

interface IntroScreenProps {
  onComplete: () => void;
}

type Orientation = 'portrait' | 'landscape';

function getViewportSize() {
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  return { vw: Math.floor(vw), vh: Math.floor(vh) };
}

function getOrientation(): Orientation {
  const { vw, vh } = getViewportSize();
  return vh > vw ? 'portrait' : 'landscape';
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [orientation, setOrientation] = useState<Orientation>(() => getOrientation());
  const [debug, setDebug] = useState('');

  // ✅ 1) 뷰포트 변화 감지(회전/주소창 변화 포함) -> orientation 상태 갱신
  useEffect(() => {
    const update = () => {
      const { vw, vh } = getViewportSize();
      setOrientation(vh > vw ? 'portrait' : 'landscape');
      setDebug(`viewport=${vw}x${vh} (${vh > vw ? 'portrait' : 'landscape'}) dpr=${window.devicePixelRatio ?? 1}`);
    };

    update();

    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      vv?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // ✅ 2) Phaser 최초 생성 (한 번만)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (gameRef.current) return;

    // wrapper를 항상 "보이는 높이"로 맞춤 (아래 잘림 방지)
    const applyWrapper = () => {
      const { vh } = getViewportSize();
      el.style.width = '100%';
      el.style.height = `${vh}px`;
      el.style.overflow = 'hidden';
      el.style.touchAction = 'none';
    };

    applyWrapper();

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

    // wrapper 사이즈 변화도 감지해서 즉시 resize
    const syncSize = () => {
      applyWrapper();
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w > 0 && h > 0) {
        game.scale.resize(w, h);
        requestAnimationFrame(() => game.scale.refresh());
      }
    };

    // 첫 동기화
    syncSize();

    const ro = new ResizeObserver(() => requestAnimationFrame(syncSize));
    ro.observe(el);

    // 회전/viewport 변화에도 동기화
    const vv = window.visualViewport;
    vv?.addEventListener('resize', syncSize);
    const onOC = () => {
      syncSize();
      setTimeout(syncSize, 60);
      setTimeout(syncSize, 180);
    };
    window.addEventListener('orientationchange', onOC);
    window.addEventListener('resize', syncSize);

    return () => {
      ro.disconnect();
      vv?.removeEventListener('resize', syncSize);
      window.removeEventListener('orientationchange', onOC);
      window.removeEventListener('resize', syncSize);

      game.events.off('intro-complete', onIntroComplete);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [onComplete]);

  // ✅ 3) orientation 상태 변화가 감지되면 Scene에 알려주고(선택), 다시 resize 한 번 더
  useEffect(() => {
    const game = gameRef.current;
    const el = containerRef.current;
    if (!game || !el) return;

    // orientation 정보 전달 (선택)
    game.registry.set('orientation', orientation);
    game.events.emit('ui-orientation-changed', orientation);

    // 안정화를 위해 resize 한번 더
    const sync = () => {
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w > 0 && h > 0) {
        game.scale.resize(w, h);
        requestAnimationFrame(() => game.scale.refresh());
      }
    };

    sync();
    setTimeout(sync, 60);
    setTimeout(sync, 180);
  }, [orientation]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'black', overflow: 'hidden', zIndex: 9999 }}>
      <div ref={containerRef} />
      {/* 상단 디버그 텍스트(너가 원한 방식) */}
      <div
        style={{
          position: 'fixed',
          left: 8,
          top: 8,
          padding: '6px 8px',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.55)',
          color: 'white',
          fontSize: 12,
          fontFamily: 'monospace',
          zIndex: 10000,
          pointerEvents: 'none',
          whiteSpace: 'pre',
        }}
      >
        {debug}
      </div>
    </div>
  );
};

export default IntroScreen;