import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatDiffProps {
  current: number;
  next: number;
  isPercent?: boolean;
}

export const StatDiff: React.FC<StatDiffProps> = ({ current, next, isPercent = false }) => {
  const diff = next - current;
  if (Math.abs(diff) < 0.01) return null;
  const isPositive = diff > 0;
  const color = isPositive ? 'text-emerald-400' : 'text-red-400';
  const Icon = isPositive ? ArrowUp : ArrowDown;
  return (
    <div
      className={`flex items-center gap-0.5 font-mono text-[10px] font-bold ${color} animate-in fade-in slide-in-from-left-1`}
    >
      <Icon className="w-2.5 h-2.5" />
      <span>{isPercent ? Math.abs(diff).toFixed(1) : Math.abs(Math.round(diff))}</span>
    </div>
  );
};
