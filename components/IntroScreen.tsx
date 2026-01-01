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
  // iOS Safari: visualViewport가 실제 usable area 반영 (주소창/툴바 포함 이슈 완화)
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

  // 1) Phaser Game 생성/파괴 (1회)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 이미 만들어져 있으면 패스
    if (gameRef.current) return;

    setWrapperSize(el);

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: el,
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

    return () => {
      game.events.off('intro-complete', onIntroComplete);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [onComplete]);

  // 2) Resize / Orientation 이벤트 처리 (항상)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;

    const sync = () => {
      setWrapperSize(el);

      const game = gameRef.current;
      if (!game) return;

      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w <= 0 || h <= 0) return;

      // 핵심: wrapper 기준으로 Phaser 캔버스를 실제로 리사이즈
      game.scale.resize(w, h);

      // iOS에서 한 프레임 늦게 반영되는 경우가 있어 refresh를 다음 프레임에 한 번 더
      requestAnimationFrame(() => {
        game.scale.refresh();
      });
    };

    const scheduleSync = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };

    const vv = window.visualViewport;

    const onVV = () => scheduleSync();

    const onWindowResize = () => scheduleSync();

    const onOrientationChange = () => {
      // 회전 직후 값이 튀거나 늦게 바뀌는 iOS 대응
      scheduleSync();
      setTimeout(scheduleSync, 60);
      setTimeout(scheduleSync, 180);
    };

    vv?.addEventListener('resize', onVV);
    vv?.addEventListener('scroll', onVV); // 주소창 show/hide 대응
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', onOrientationChange);

    const ro = new ResizeObserver(() => scheduleSync());
    ro.observe(el);

    // 초기 동기화 + iOS 안정화용 추가 동기화
    scheduleSync();
    setTimeout(scheduleSync, 60);
    setTimeout(scheduleSync, 180);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      vv?.removeEventListener('resize', onVV);
      vv?.removeEventListener('scroll', onVV);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* JS 실행 전에도 꽉 차게 */}
      <div ref={containerRef} className="w-screen h-[100dvh]" />
    </div>
  );
}