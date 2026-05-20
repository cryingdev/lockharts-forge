import React from 'react';
import { Shield, Sparkles, Swords, Trophy } from 'lucide-react';
import { SfxButton } from '../../../common/ui/SfxButton';
import { t } from '../../../../utils/i18n';
import type { Mercenary } from '../../../../models/Mercenary';
import type { Language } from '../../../../types';
import type { ArenaMilestoneViewModel, ArenaOpponentViewModel } from '../types';
import { ArenaOpponentCard } from './ArenaOpponentCard';

interface ArenaLobbyViewProps {
    language: Language;
    rating: number;
    peakRating: number;
    rankLabel: string;
    selectedParty: Mercenary[];
    milestones: ArenaMilestoneViewModel[];
    opponents: ArenaOpponentViewModel[];
    averagePartyLevel: number;
    claimableMilestoneCount: number;
    nextMilestone?: ArenaMilestoneViewModel;
    nextMilestoneProgress: number;
    nextMilestoneRemaining: number;
    rankProgress: number;
    nextRankLabel: string | null;
    nextRankThreshold: number | null;
    nextRankRemaining: number;
    onOpenParty: () => void;
    onSelectOpponent: (opponent: ArenaOpponentViewModel) => void;
    onClaimMilestone: (threshold: number) => void;
}

export const ArenaLobbyView: React.FC<ArenaLobbyViewProps> = ({
    language,
    rating,
    peakRating,
    rankLabel,
    selectedParty,
    milestones,
    opponents,
    averagePartyLevel,
    claimableMilestoneCount,
    nextMilestone,
    nextMilestoneProgress,
    nextMilestoneRemaining,
    rankProgress,
    nextRankLabel,
    nextRankThreshold,
    nextRankRemaining,
    onOpenParty,
    onSelectOpponent,
    onClaimMilestone,
}) => {
    return (
        <div className="relative z-10 flex h-full flex-col px-4 pb-6 pt-24 md:px-6">
            <div className="mx-auto w-full max-w-5xl">
                <div className="rounded-[28px] border border-stone-700/80 bg-stone-950/72 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-rose-300/90">
                                    {t(language, 'arena.title')}
                                </p>
                                <h2 className="mt-2 text-3xl font-black text-stone-100 md:text-4xl">
                                    {rankLabel}
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400 md:text-[15px]">
                                    {t(language, 'arena.subtitle')}
                                </p>
                            </div>

                            <SfxButton
                                sfx="switch"
                                onClick={onOpenParty}
                                className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-amber-700/60 bg-amber-600/90 px-5 py-3 text-[13px] font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-amber-500 active:scale-95"
                            >
                                {t(language, 'arena.edit_party')}
                            </SfxButton>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-stone-800 bg-black/32 px-4 py-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                                        {t(language, 'arena.current_points')}
                                    </p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-600">
                                        {t(language, 'arena.peak_points')}
                                    </p>
                                </div>
                                <div className="mt-2 flex items-end justify-between gap-3">
                                    <p className="text-3xl font-black text-stone-100">{rating.toLocaleString()}</p>
                                    <p className="text-sm font-black text-stone-400">{peakRating.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-stone-800 bg-black/32 px-4 py-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                                        {t(language, 'arena.rank_progress')}
                                    </p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
                                        {nextRankLabel ?? t(language, 'arena.max_rank')}
                                    </p>
                                </div>
                                <p className="mt-2 text-lg font-black text-stone-100">
                                    {nextRankThreshold ? nextRankThreshold.toLocaleString() : rankLabel}
                                </p>
                                <div className="mt-3 overflow-hidden rounded-full border border-stone-800 bg-stone-950">
                                    <div
                                        className="h-2.5 bg-gradient-to-r from-amber-500 to-orange-400"
                                        style={{ width: `${rankProgress}%` }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-stone-500">
                                    {nextRankThreshold
                                        ? t(language, 'arena.points_remaining', { value: nextRankRemaining.toLocaleString() })
                                        : t(language, 'arena.max_rank')}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-stone-800 bg-black/32 px-4 py-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                                        {t(language, 'arena.next_milestone')}
                                    </p>
                                    <div className="inline-flex items-center gap-1 rounded-full border border-emerald-800/70 bg-emerald-950/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                                        <Sparkles className="h-3 w-3" />
                                        {claimableMilestoneCount} {t(language, 'arena.claimable_rewards')}
                                    </div>
                                </div>
                                <p className="mt-2 text-lg font-black text-amber-300">
                                    {nextMilestone ? nextMilestone.threshold.toLocaleString() : t(language, 'arena.milestone_claimed')}
                                </p>
                                <div className="mt-3 overflow-hidden rounded-full border border-stone-800 bg-stone-950">
                                    <div
                                        className="h-2.5 bg-gradient-to-r from-sky-500 to-indigo-400"
                                        style={{ width: `${nextMilestoneProgress}%` }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-stone-500">
                                    {nextMilestone
                                        ? t(language, 'arena.points_remaining', { value: nextMilestoneRemaining.toLocaleString() })
                                        : t(language, 'arena.peak_updated')}
                                </p>
                                <p className="mt-1 text-xs text-stone-600">
                                    {nextMilestone?.rewardLabel ?? t(language, 'arena.milestone_claimed')}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-stone-800 bg-black/32 px-4 py-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                                        {t(language, 'arena.party_readiness')}
                                    </p>
                                    <div className="inline-flex items-center gap-1 rounded-full border border-stone-700 bg-stone-900/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-stone-300">
                                        <Swords className="h-3 w-3 text-amber-400" />
                                        {t(language, 'arena.selected_count', { count: selectedParty.length })}
                                    </div>
                                </div>
                                <p className="mt-2 text-lg font-black text-stone-100">
                                    {averagePartyLevel > 0
                                        ? t(language, 'arena.average_level', { value: averagePartyLevel.toString() })
                                        : t(language, 'arena.no_party')}
                                </p>
                                <p className="mt-2 text-xs text-stone-500">
                                    {selectedParty.length > 0 ? t(language, 'arena.player_party') : t(language, 'arena.edit_party')}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-stone-800 bg-black/24 p-4">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-amber-400" />
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
                                    {t(language, 'arena.selected_party')}
                                </p>
                                <div className="ml-auto rounded-full border border-stone-700 bg-stone-900/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-stone-300">
                                    {rankLabel}
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, index) => {
                                    const mercenary = selectedParty[index];
                                    return (
                                        <div
                                            key={mercenary?.id ?? `slot-${index}`}
                                            className="rounded-2xl border border-stone-800 bg-stone-900/80 px-3 py-3"
                                        >
                                            {mercenary ? (
                                                <>
                                                    <p className="truncate text-sm font-black text-stone-100">{mercenary.name}</p>
                                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                                                        {mercenary.job} • Lv.{mercenary.level}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-black text-stone-500">{t(language, 'arena.party_empty_slot')}</p>
                                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-700">
                                                        {t(language, 'common.empty')}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {selectedParty.length === 0 && (
                                <p className="mt-3 text-sm text-stone-500">{t(language, 'arena.no_party')}</p>
                            )}
                        </div>

                        <div className="rounded-2xl border border-stone-800 bg-black/24 p-4">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-amber-400" />
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
                                    {t(language, 'arena.next_milestone')}
                                </p>
                            </div>
                            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                                {milestones.map((milestone) => (
                                    <div
                                        key={milestone.threshold}
                                        className="min-w-[160px] rounded-2xl border border-stone-800 bg-stone-900/72 px-4 py-3"
                                    >
                                        <p className="text-lg font-black text-stone-100">{milestone.threshold.toLocaleString()}</p>
                                        <p className="mt-1 text-xs text-stone-500">{milestone.rewardLabel}</p>
                                        {milestone.claimed ? (
                                            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">
                                                {t(language, 'arena.milestone_claimed')}
                                            </p>
                                        ) : milestone.claimable ? (
                                            <SfxButton
                                                sfx="click"
                                                onClick={() => onClaimMilestone(milestone.threshold)}
                                                className="mt-3 inline-flex rounded-xl border border-amber-700/60 bg-amber-600/90 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-amber-500 active:scale-95"
                                            >
                                                {t(language, 'arena.claim_reward')}
                                            </SfxButton>
                                        ) : (
                                            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-stone-600">
                                                {t(language, 'arena.milestone_locked')}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
                                    {t(language, 'arena.opponents')}
                                </p>
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-600">
                                    {opponents.length}
                                </p>
                            </div>

                            <div className="grid gap-3 lg:grid-cols-2">
                                {opponents.map((opponent) => (
                                    <ArenaOpponentCard
                                        key={opponent.id}
                                        opponent={opponent}
                                        language={language}
                                        onClick={() => onSelectOpponent(opponent)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
