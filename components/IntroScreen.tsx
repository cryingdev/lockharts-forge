import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import IntroScene from '../game/IntroScene';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // ✅ 모바일에서 "진짜 화면 높이"를 컨테이너에 강제로 적용
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const applyViewportSize = () => {
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;

      el.style.width = '100%';
      el.style.height = `${Math.floor(vh)}px`;
      // 혹시 상위가 영향 주면 대비
      el.style.overflow = 'hidden';
      el.style.touchAction = 'none';
    };

    applyViewportSize();

    const vv = window.visualViewport;
    vv?.addEventListener('resize', applyViewportSize);
    window.addEventListener('orientationchange', applyViewportSize);
    window.addEventListener('resize', applyViewportSize);

    return () => {
      vv?.removeEventListener('resize', applyViewportSize);
      window.removeEventListener('orientationchange', applyViewportSize);
      window.removeEventListener('resize', applyViewportSize);
    };
  }, []);

  useEffect(() => {
    const checkSize = () => {
      const el = containerRef.current;
      if (el && el.clientWidth > 0 && el.clientHeight > 0) setIsReady(true);
      else requestAnimationFrame(checkSize);
    };
    checkSize();
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 1280,   // ✅ 기준값 고정
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

    const resizeToContainer = () => {
      const el = containerRef.current;
      if (!el || !gameRef.current) return;
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w > 0 && h > 0) gameRef.current.scale.resize(w, h);
    };

    // ✅ 생성 직후 한 번 강제 resize
    resizeToContainer();

    const ro = new ResizeObserver(() => {
      // ✅ DOM 갱신 후 적용되게 한 프레임 미룸 (모바일에서 효과 큼)
      requestAnimationFrame(resizeToContainer);
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      game.events.off('intro-complete', onIntroComplete);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [isReady, onComplete]);

  return (
    <div className="absolute inset-0 bg-black z-50 overflow-hidden">
      <div ref={containerRef} />
    </div>
  );
};

export default IntroScreen;