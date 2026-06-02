import React from 'react';
import { ChevronRight, Swords, Trophy } from 'lucide-react';
import { t } from '../../../../utils/i18n';
import { MercenaryPortrait } from '../../../common/ui/MercenaryPortrait';
import type { Language } from '../../../../types';
import type { ArenaOpponentViewModel } from '../types';

interface ArenaOpponentCardProps {
    opponent: ArenaOpponentViewModel;
    language: Language;
    rankNumber: number;
    isSelected?: boolean;
    onSelect: () => void;
    onChallenge: () => void;
}

const getDifficultyTone = (difficulty: ArenaOpponentViewModel['difficultyTag']) => {
    switch (difficulty) {
        case 'LOW':
            return 'border-emerald-700/70 bg-emerald-950/30 text-emerald-300';
        case 'HIGH':
            return 'border-amber-700/70 bg-amber-950/30 text-amber-300';
        case 'ELITE':
            return 'border-rose-700/70 bg-rose-950/30 text-rose-300';
        default:
            return 'border-stone-700 bg-stone-900/70 text-stone-300';
    }
};

export const ArenaOpponentCard: React.FC<ArenaOpponentCardProps> = ({
    opponent,
    language,
    rankNumber,
    isSelected = false,
    onSelect,
    onChallenge,
}) => {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect();
                }
            }}
            className={`grid w-full cursor-pointer grid-cols-[54px_minmax(0,1fr)] gap-2 rounded-lg border bg-stone-950/78 p-2 text-left shadow-xl transition-all active:scale-[0.992] md:grid-cols-[68px_minmax(0,1fr)_104px_104px_132px] md:items-stretch md:gap-3 md:p-3 ${
                isSelected
                    ? 'border-amber-500/70 ring-1 ring-amber-500/35'
                    : 'border-stone-800 hover:border-stone-700'
            }`}
        >
            <div className={`flex min-h-[104px] flex-col items-center justify-center rounded-md border bg-black/34 ${isSelected ? 'border-amber-600/70 text-amber-300' : 'border-stone-800 text-stone-500'}`}>
                <Trophy className="h-4 w-4" />
                <span className="mt-1 text-2xl font-black leading-none">{rankNumber}</span>
            </div>

            <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate text-base font-black text-stone-100">{opponent.displayName}</p>
                        <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                            {opponent.rankLabel} • {opponent.rating.toLocaleString()}
                        </p>
                    </div>
                    <span className={`shrink-0 rounded-md border px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${getDifficultyTone(opponent.difficultyTag)}`}>
                        {t(language, `arena.difficulty_${opponent.difficultyTag.toLowerCase()}`)}
                    </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
                    {opponent.party.slice(0, 4).map((mercenary) => (
                        <div
                            key={mercenary.id}
                            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-stone-700 bg-stone-950 md:h-11 md:w-11"
                            title={`${mercenary.name} • Lv.${mercenary.level}`}
                        >
                            <MercenaryPortrait
                                mercenary={mercenary}
                                className="h-full w-full rounded-md"
                            />
                            <span className="absolute bottom-0 right-0 rounded-tl bg-stone-950/90 px-1 py-0.5 text-[7px] font-black leading-none text-stone-100">
                                {mercenary.level}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 md:hidden">
                    <div className="rounded-md border border-stone-800 bg-black/30 px-2.5 py-2">
                        <p className="text-[8px] font-black uppercase tracking-[0.13em] text-stone-500">{t(language, 'arena.reward')}</p>
                        <p className="mt-1 text-sm font-black text-emerald-400">+{opponent.winPoints}</p>
                    </div>
                    <div className="rounded-md border border-stone-800 bg-black/30 px-2.5 py-2">
                        <p className="text-[8px] font-black uppercase tracking-[0.13em] text-stone-500">{t(language, 'arena.risk')}</p>
                        <p className="mt-1 text-sm font-black text-rose-400">-{opponent.lossPoints}</p>
                    </div>
                </div>
            </div>

            <div className="hidden rounded-md border border-stone-800 bg-black/30 px-3 py-2 md:block">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-stone-500">{t(language, 'arena.reward')}</p>
                <div className="mt-3 flex items-center gap-2 text-base font-black text-emerald-400">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    +{opponent.winPoints}
                </div>
            </div>

            <div className="hidden rounded-md border border-stone-800 bg-black/30 px-3 py-2 md:block">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-stone-500">{t(language, 'arena.risk')}</p>
                <div className="mt-3 flex items-center gap-2 text-base font-black text-rose-400">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    -{opponent.lossPoints}
                </div>
            </div>

            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onChallenge();
                }}
                className="col-span-2 flex min-h-[38px] items-center justify-center gap-2 rounded-md border border-red-700/60 bg-red-950/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.13em] text-red-100 transition-all hover:bg-red-900 active:scale-95 md:col-span-1 md:min-h-full"
            >
                <Swords className="h-3.5 w-3.5" />
                {t(language, 'arena.challenge')}
                <ChevronRight className="h-3.5 w-3.5" />
            </button>
        </div>
    );
};
