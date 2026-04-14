import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface AutoFitTextProps {
  children: React.ReactNode;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
  step?: number;
  as?: keyof JSX.IntrinsicElements;
  letterSpacingEm?: number;
  title?: string;
}

export const AutoFitText: React.FC<AutoFitTextProps> = ({
  children,
  className = '',
  minFontSize = 8,
  maxFontSize = 12,
  step = 0.5,
  as = 'span',
  letterSpacingEm,
  title
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  const fit = () => {
    const el = ref.current;
    if (!el) return;

    let nextSize = maxFontSize;
    el.style.fontSize = `${nextSize}px`;

    while (nextSize > minFontSize && el.scrollWidth > el.clientWidth) {
      nextSize = Math.max(minFontSize, nextSize - step);
      el.style.fontSize = `${nextSize}px`;
      if (nextSize === minFontSize) break;
    }

    setFontSize(nextSize);
  };

  useLayoutEffect(() => {
    fit();
  }, [children, minFontSize, maxFontSize, step]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => fit());
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, minFontSize, maxFontSize, step]);

  return React.createElement(
    as,
    {
      ref,
      className,
      title,
      style: {
        fontSize: `${fontSize}px`,
        letterSpacing: letterSpacingEm !== undefined ? `${letterSpacingEm}em` : undefined
      }
    },
    children
  );
};
