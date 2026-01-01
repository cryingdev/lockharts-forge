import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import IntroScene from '../game/IntroScene';

interface IntroScreenProps {
  onComplete: () => void;
}

function getViewportSize() {
  const vv = window.visualViewport;
  const vw = vv?.width ?? window.innerWidth;
  const vh = vv?.height ?? window.innerHeight;
  return { vw: Math.floor(vw), vh: Math.floor(vh) };
}

function setWrapperSize(el: HTMLDivElement) {
  // iOS Safari: visualViewport height = 실제 표시 가능한 영역(주소창/툴바 변화 반영)
  const { vw, vh } = getViewportSize();
  el.style.width = `${vw}px`;
  el.style.height = `${vh}px`;
  el.style.overflow = 'hidden';
  el.style.touchAction = 'none';
  el.style.position = 'relative';
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;

    const sync = () => {
      if (!el) return;

      setWrapperSize(el);

      const game = gameRef.current;
      if (!game) return;

      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w <= 0 || h <= 0) return;

      game.scale.resize(w, h);

      // iOS에서 resize 직후 canvas/layout이 한 프레임 늦는 경우가 있어서 refresh를 다음 프레임에 한 번 더
      requestAnimationFrame(() => {
        game.scale.refresh();
      });
    };

    const scheduleSync = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };

    // ✅ Phaser game은 최초 1회만 생성
    if (!gameRef.current) {
      setWrapperSize(el);

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: el,
        // 최초 값은 의미 거의 없음. 바로 wrapper 기준으로 resize 할거라 1,1로 둠
        width: 1,
        height: 1,
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

      // 첫 동기화 + iOS 안정화용 추가 동기화
      scheduleSync();
      setTimeout(scheduleSync, 60);
      setTimeout(scheduleSync, 180);

      return () => {
        if (raf) cancelAnimationFrame(raf);
        game.events.off('intro-complete', onIntroComplete);
        game.destroy(true);
        gameRef.current = null;
      };
    }

    // ✅ 이벤트: visualViewport / window / orientation / ResizeObserver
    const vv = window.visualViewport;

    const onVV = () => scheduleSync();

    const onWindowResize = () => scheduleSync();

    const onOrientationChange = () => {
      scheduleSync();
      setTimeout(scheduleSync, 60);
      setTimeout(scheduleSync, 180);
    };

    vv?.addEventListener('resize', onVV);
    vv?.addEventListener('scroll', onVV); // iOS 주소창 show/hide 때 scroll 이벤트도 같이 오는 경우가 많음
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', onOrientationChange);

    const ro = new ResizeObserver(() => scheduleSync());
    ro.observe(el);

    scheduleSync();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      vv?.removeEventListener('resize', onVV);
      vv?.removeEventListener('scroll', onVV);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* JS 실행 전에도 화면 꽉 차게 */}
      <div ref={containerRef} className="w-screen h-[100dvh]" />
    </div>
  );
}