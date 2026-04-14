import { useEffect, useRef, useState } from 'react';

export type TimedTooltipPlacement = 'above' | 'below';
export type TimedTooltipAlign = 'start' | 'center' | 'end';

export interface TimedTooltipState<T = unknown> {
  id: string;
  left: number;
  top: number;
  placement: TimedTooltipPlacement;
  data: T;
}

interface OpenTimedTooltipArgs<T> {
  id: string;
  anchorRect: DOMRect;
  data: T;
  width: number;
  placement?: TimedTooltipPlacement;
  align?: TimedTooltipAlign;
  offset?: number;
  viewportPadding?: number;
}

export function useTimedTooltip<T = unknown>(autoHideMs = 1000) {
  const [tooltip, setTooltip] = useState<TimedTooltipState<T> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTooltipTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const closeTooltip = () => {
    clearTooltipTimer();
    setTooltip(null);
  };

  const openTooltip = ({
    id,
    anchorRect,
    data,
    width,
    placement = 'above',
    align = 'end',
    offset = 12,
    viewportPadding = 12,
  }: OpenTimedTooltipArgs<T>) => {
    clearTooltipTimer();

    if (tooltip?.id === id) {
      setTooltip(null);
      return;
    }

    let left = anchorRect.left;
    if (align === 'center') {
      left = anchorRect.left + anchorRect.width / 2 - width / 2;
    } else if (align === 'end') {
      left = anchorRect.right - width;
    }

    const maxLeft = window.innerWidth - width - viewportPadding;
    left = Math.min(Math.max(left, viewportPadding), maxLeft);

    const top =
      placement === 'above'
        ? Math.max(anchorRect.top - offset, viewportPadding)
        : Math.min(anchorRect.bottom + offset, window.innerHeight - viewportPadding);

    setTooltip({ id, left, top, placement, data });

    timerRef.current = setTimeout(() => {
      setTooltip(current => (current?.id === id ? null : current));
      timerRef.current = null;
    }, autoHideMs);
  };

  useEffect(() => () => clearTooltipTimer(), []);

  return {
    tooltip,
    openTooltip,
    closeTooltip,
    isTooltipOpen: (id: string) => tooltip?.id === id,
  };
}
