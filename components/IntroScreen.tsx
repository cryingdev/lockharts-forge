import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import IntroScene from '../game/IntroScene';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // ✅ 모바일에서 "진짜 보이는 뷰포트" 기준으로 wrapper 높이를 px로 고정
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const applyViewportSize = () => {
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;

      // fixed inset(0) 부모 안에서 wrapper 크기 확정
      el.style.width = '100%';
      el.style.height = `${Math.floor(vh)}px`;

      el.style.overflow = 'hidden';
      el.style.touchAction = 'none';
    };

    applyViewportSize();

    const vv = window.visualViewport;
    vv?.addEventListener('resize', applyViewportSize);
    window.addEventListener('resize', applyViewportSize);
    window.addEventListener('orientationchange', applyViewportSize);

    return () => {
      vv?.removeEventListener('resize', applyViewportSize);
      window.removeEventListener('resize', applyViewportSize);
      window.removeEventListener('orientationchange', applyViewportSize);
    };
  }, []);

  // wrapper의 실제 크기가 잡힐 때까지 대기
  useEffect(() => {
    const check = () => {
      const el = containerRef.current;
      if (el && el.clientWidth > 0 && el.clientHeight > 0) setReady(true);
      else requestAnimationFrame(check);
    };
    check();
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      // ✅ 초기 좌표계 안정화용 기준 해상도 (실제 크기는 RESIZE로 맞춤)
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

    const resizeToWrapper = () => {
      const el = containerRef.current;
      const g = gameRef.current;
      if (!el || !g) return;

      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w <= 0 || h <= 0) return;

      // ✅ resize + 다음 프레임 refresh (모바일에서 레이아웃 랜덤 깨짐 완화)
      g.scale.resize(w, h);
      requestAnimationFrame(() => g.scale.refresh());
    };

    // 최초 1회 강제 동기화
    resizeToWrapper();

    // DOM 크기 변화 감지
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(resizeToWrapper);
    });
    ro.observe(containerRef.current);

    // visualViewport 변화도 같이 처리 (주소창/툴바 변화 대응)
    const vv = window.visualViewport;
    const onVV = () => resizeToWrapper();
    vv?.addEventListener('resize', onVV);

    // orientationchange도 한 번 더 (일부 브라우저에서 RO만으론 늦음)
    const onOC = () => {
      // 회전 후 값이 안정화되는 타이밍을 위해 약간 지연
      setTimeout(resizeToWrapper, 60);
      setTimeout(resizeToWrapper, 180);
    };
    window.addEventListener('orientationchange', onOC);

    return () => {
      vv?.removeEventListener('resize', onVV);
      window.removeEventListener('orientationchange', onOC);
      ro.disconnect();

      game.events.off('intro-complete', onIntroComplete);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [ready, onComplete]);

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
    </div>
  );
};

export default IntroScreen;