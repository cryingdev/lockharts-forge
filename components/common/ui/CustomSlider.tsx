import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CustomSliderProps {
  value: number; // 0 to 1
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // UI 표현용
  const [isDragging, setIsDragging] = useState(false);

  // 로직용(즉시 반영)
  const draggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('CustomSlider MOUNT');
    return () => console.log('CustomSlider UNMOUNT');
  }, []);

  const updateValueFromClientX = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el || disabled) return;

      const rect = el.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
      onChange(percentage);
    },
    [disabled, onChange]
  );

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;

    // 모바일 스크롤/제스처 방지
    e.preventDefault();

    draggingRef.current = true;
    activePointerIdRef.current = e.pointerId;
    setIsDragging(true);

    updateValueFromClientX(e.clientX);

    // 캡쳐는 반드시 currentTarget에 거는 게 안정적
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;

    // state 대신 ref 기준으로 판단 + pointerId 일치 확인
    if (!draggingRef.current) return;
    if (activePointerIdRef.current !== e.pointerId) return;

    updateValueFromClientX(e.clientX);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;

    draggingRef.current = false;
    activePointerIdRef.current = null;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`relative h-8 flex items-center cursor-pointer select-none group ${disabled ? 'cursor-not-allowed opacity-50 grayscale' : ''} ${className}`}
      style={{
        touchAction: 'none', // iOS에서 필수급
        userSelect: 'none',
      }}
    >
      {/* Track Background */}
      <div className="absolute w-full h-2.5 bg-stone-950 rounded-full border border-stone-800 shadow-inner overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r from-amber-800 via-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] ${isDragging ? 'transition-none' : 'transition-all duration-200'}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>

      {/* Handle (Thumb) */}
      <div
        className={`absolute w-6 h-6 bg-stone-100 rounded-full border-2 border-amber-600 shadow-xl flex items-center justify-center ${
          isDragging ? 'transition-none scale-110 bg-white ring-4 ring-amber-500/20'
                     : 'transition-all duration-200 group-hover:scale-105'
        }`}
        style={{
          left: `${value * 100}%`,
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        {isDragging && (
          <div className="absolute inset-[-8px] rounded-full bg-amber-500/10 animate-pulse" />
        )}
      </div>
    </div>
  );
};