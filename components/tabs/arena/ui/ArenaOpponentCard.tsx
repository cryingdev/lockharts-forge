import React from 'react';
import { Swords } from 'lucide-react';
import { t } from '../../../../utils/i18n';
import type { Language } from '../../../../types';
import type { ArenaOpponentViewModel } from '../types';

interface ArenaOpponentCardProps {
    opponent: ArenaOpponentViewModel;
    language: Language;
    isSelected?: boolean;
    onClick: () => void;
}

const getDifficultyTone = (difficulty: ArenaOpponentViewModel['difficultyTag']) => {
    switch (difficulty) {
        case 'LOW':
            return 'border-emerald-700/70 text-emerald-300';
        case 'HIGH':
            return 'border-amber-700/70 text-amber-300';
        case 'ELITE':
            return 'border-rose-700/70 text-rose-300';
        default:
            return 'border-stone-700 text-stone-300';
    }
};

export const ArenaOpponentCard: React.FC<ArenaOpponentCardProps> = ({
    opponent,
    language,
    isSelected = false,
    onClick,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-2xl border bg-stone-950/72 px-4 py-4 text-left shadow-xl transition-all active:scale-[0.985] ${
                isSelected
                    ? 'border-stone-500 ring-1 ring-amber-500/40 scale-[1.01]'
                    : 'border-stone-800 hover:border-stone-700'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-[15px] font-black text-stone-100">{opponent.displayName}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                        {opponent.rankLabel} • {opponent.rating.toLocaleString()}
                    </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${getDifficultyTone(opponent.difficultyTag)}`}>
                    {t(language, `arena.difficulty_${opponent.difficultyTag.toLowerCase()}`)}
                </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
                {opponent.party.slice(0, 4).map((mercenary) => (
                    <div
                        key={mercenary.id}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-700 bg-stone-900 text-sm font-black text-stone-200"
                        title={`${mercenary.name} • Lv.${mercenary.level}`}
                    >
                        {mercenary.name.slice(0, 1).toUpperCase()}
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-stone-800 bg-black/30 px-3 py-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-stone-400">
                    <Swords className="h-3.5 w-3.5 text-amber-400" />
                    {t(language, 'arena.point_preview')}
                </div>
                <div className="flex items-center gap-3 text-sm font-black">
                    <span className="text-emerald-400">+{opponent.winPoints}</span>
                    <span className="text-stone-600">/</span>
                    <span className="text-rose-400">-{opponent.lossPoints}</span>
                </div>
            </div>
        </button>
    );
};
