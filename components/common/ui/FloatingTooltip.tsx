import React from 'react';
import { createPortal } from 'react-dom';
import { TimedTooltipState } from '../../../hooks/useTimedTooltip';

interface FloatingTooltipProps<T = unknown> {
  tooltip: TimedTooltipState<T> | null;
  onClose: () => void;
  widthClassName?: string;
  className?: string;
  children: (data: T) => React.ReactNode;
}

export function FloatingTooltip<T = unknown>({
  tooltip,
  onClose,
  widthClassName = 'w-[13rem] md:w-[14rem]',
  className = '',
  children,
}: FloatingTooltipProps<T>) {
  if (!tooltip || typeof document === 'undefined') return null;

  return createPortal(
    <button
      type="button"
      onClick={onClose}
      className={`fixed z-[2500] ${widthClassName} rounded-xl border border-stone-600/55 bg-stone-900/72 px-2.5 py-2 text-left text-[14px] italic leading-snug text-stone-200 shadow-[0_14px_30px_rgba(0,0,0,0.28)] backdrop-blur-[2px] md:text-[12px] ${className}`}
      style={{
        left: `${tooltip.left}px`,
        top: `${tooltip.top}px`,
        transform: tooltip.placement === 'above' ? 'translateY(-100%)' : 'translateY(0)',
      }}
    >
      {children(tooltip.data)}
    </button>,
    document.body
  );
}

export default FloatingTooltip;
