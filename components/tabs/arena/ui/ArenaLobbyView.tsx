import React from 'react';
import { ChevronRight, CircleDot, Crown, Medal, ScrollText, Shield, Sparkles, Sword, Swords, Trophy, Users } from 'lucide-react';
import { SfxButton } from '../../../common/ui/SfxButton';
import { CommonBackButton } from '../../../common/ui/CommonBackButton';
import { MercenaryPortrait } from '../../../common/ui/MercenaryPortrait';
import { t } from '../../../../utils/i18n';
import { calculateMercenaryPower } from '../../../../utils/combatLogic';
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
    selectedOpponentId: string | null;
    onBack?: () => void;
    onOpenParty: () => void;
    onSelectOpponent: (opponent: ArenaOpponentViewModel) => void;
    onChallengeOpponent: (opponent: ArenaOpponentViewModel) => void;
    onClaimMilestone: (threshold: number) => void;
}

const panelClass = 'rounded-lg border border-stone-800/90 bg-stone-950/78 shadow-[0_18px_55px_rgba(0,0,0,0.36)] backdrop-blur-sm';

const SectionHeader: React.FC<{
    icon: React.ReactNode;
    label: string;
    action?: React.ReactNode;
}> = ({ icon, label, action }) => (
    <div className="flex min-h-[24px] items-center gap-2 md:min-h-[28px]">
        <div className="shrink-0 text-amber-400">{icon}</div>
        <p className="min-w-0 truncate text-[9px] font-black uppercase tracking-[0.16em] text-stone-400 md:text-[10px] md:tracking-[0.18em]">{label}</p>
        {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
);

const PartySlot: React.FC<{
    mercenary?: Mercenary;
    language: Language;
    slotNumber: number;
}> = ({ mercenary, language, slotNumber }) => {
    const hpPercent = mercenary ? Math.max(0, Math.min(100, (mercenary.currentHp / Math.max(1, mercenary.maxHp)) * 100)) : 0;
    const mpPercent = mercenary ? Math.max(0, Math.min(100, (mercenary.currentMp / Math.max(1, mercenary.maxMp)) * 100)) : 0;
    const xpPercent = mercenary ? Math.max(0, Math.min(100, (mercenary.currentXp / Math.max(1, mercenary.xpToNextLevel)) * 100)) : 0;
    const combatPower = mercenary ? calculateMercenaryPower(mercenary) : 0;
    const portraitBorderClass = (() => {
        if (!mercenary) return 'border-stone-800';
        if (mercenary.status === 'ON_EXPEDITION') return 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.22)]';
        if (mercenary.status === 'INJURED') return 'border-red-600/70 shadow-[0_0_10px_rgba(220,38,38,0.18)]';
        return 'border-amber-600/45';
    })();

    return (
        <div className={`min-h-[116px] rounded-lg border p-2.5 md:min-h-[132px] md:p-3 ${
            mercenary
                ? 'border-stone-700/90 bg-[linear-gradient(135deg,rgba(28,25,23,0.92),rgba(12,10,9,0.84))]'
                : 'border-dashed border-stone-800 bg-stone-950/58'
        }`}>
            {mercenary ? (
                <div className="grid h-full min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-3 md:grid-cols-[84px_minmax(0,1fr)]">
                    <div className="relative h-[72px] w-[72px] shrink-0 md:h-[84px] md:w-[84px]">
                        <MercenaryPortrait
                            mercenary={mercenary}
                            className={`h-full w-full rounded-xl border-2 bg-stone-950 transition-transform ${portraitBorderClass}`}
                        />
                        <div className="absolute -right-1 -top-1 rounded-md border border-amber-700/50 bg-stone-950 px-1.5 py-0.5 text-[8px] font-black text-amber-300 shadow-lg">
                            LV.{mercenary.level}
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-col justify-center">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black text-stone-100 md:text-base">{mercenary.name}</p>
                                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1">
                                    <span className="rounded border border-white/5 bg-stone-950/80 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] text-stone-500 md:text-[9px]">
                                        {mercenary.job}
                                    </span>
                                    <span className={`rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] md:text-[9px] ${
                                        mercenary.status === 'ON_EXPEDITION'
                                            ? 'border-blue-700 bg-blue-900/40 text-blue-300'
                                            : mercenary.status === 'INJURED'
                                                ? 'border-red-700 bg-red-900/40 text-red-300'
                                                : 'border-amber-700/30 bg-amber-900/30 text-amber-400/80'
                                    }`}>
                                        {mercenary.status}
                                    </span>
                                </div>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-900/35 bg-amber-950/24 px-1.5 py-1 text-[9px] font-black text-amber-300 md:text-[10px]">
                                <Sword className="h-3 w-3" />
                                {combatPower.toLocaleString()}
                            </span>
                        </div>
                        <div className="mt-3 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-stone-500">
                                <span>HP</span>
                                <span>{mercenary.currentHp.toLocaleString()} / {mercenary.maxHp.toLocaleString()}</span>
                            </div>
                            <div className="overflow-hidden rounded-full border border-stone-800 bg-stone-950">
                                <div className="h-2 bg-gradient-to-r from-red-700 to-red-500" style={{ width: `${hpPercent}%` }} />
                            </div>
                            <div className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-stone-500">
                                <span>MP</span>
                                <span>{mercenary.currentMp.toLocaleString()} / {mercenary.maxMp.toLocaleString()}</span>
                            </div>
                            <div className="overflow-hidden rounded-full border border-stone-800 bg-stone-950">
                                <div className="h-1.5 bg-gradient-to-r from-blue-800 to-blue-500" style={{ width: `${mpPercent}%` }} />
                            </div>
                            <div className="flex items-center gap-1 pt-0.5">
                                <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.1em] text-stone-600">EXP</span>
                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-stone-950">
                                    <div className="h-full bg-indigo-500/55" style={{ width: `${xpPercent}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex h-full items-center gap-3 text-stone-600">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-stone-800 bg-stone-950/70 md:h-16 md:w-16">
                        <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-stone-700 md:text-[10px]">
                            Slot {slotNumber.toString().padStart(2, '0')}
                        </p>
                        <p className="mt-1 truncate text-sm font-black text-stone-500 md:text-base">{t(language, 'arena.party_empty_slot')}</p>
                        <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.12em] text-stone-700 md:text-[10px] md:tracking-[0.14em]">
                            {t(language, 'common.empty')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const MilestoneStrip: React.FC<{
    language: Language;
    milestones: ArenaMilestoneViewModel[];
    onClaimMilestone: (threshold: number) => void;
}> = ({ language, milestones, onClaimMilestone }) => (
    <div className="grid grid-cols-2 gap-2 md:flex md:overflow-x-auto md:pb-1">
        {milestones.map((milestone) => (
            <div
                key={milestone.threshold}
                className={`min-w-0 rounded-lg border px-2.5 py-2 md:min-w-[132px] md:px-3 md:py-2.5 ${
                    milestone.claimable
                        ? 'border-amber-600/70 bg-amber-950/24'
                        : milestone.claimed
                            ? 'border-emerald-800/70 bg-emerald-950/18'
                            : 'border-stone-800 bg-stone-900/72'
                }`}
            >
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-stone-100 md:text-base">{milestone.threshold.toLocaleString()}</p>
                    <CircleDot className={`h-3.5 w-3.5 ${milestone.claimable ? 'text-amber-300' : milestone.claimed ? 'text-emerald-400' : 'text-stone-700'}`} />
                </div>
                <p className="mt-1 truncate text-[9px] font-bold text-stone-500 md:text-[10px]">{milestone.rewardLabel}</p>
                {milestone.claimable ? (
                    <SfxButton
                        sfx="click"
                        onClick={() => onClaimMilestone(milestone.threshold)}
                        className="mt-2 inline-flex rounded-md border border-amber-600/70 bg-amber-600/90 px-2 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-white transition-all hover:bg-amber-500 active:scale-95 md:px-2.5 md:text-[9px]"
                    >
                        {t(language, 'arena.claim_reward')}
                    </SfxButton>
                ) : (
                    <p className={`mt-2 text-[8px] font-black uppercase tracking-[0.12em] md:text-[9px] md:tracking-[0.14em] ${milestone.claimed ? 'text-emerald-400' : 'text-stone-600'}`}>
                        {milestone.claimed ? t(language, 'arena.milestone_claimed') : t(language, 'arena.milestone_locked')}
                    </p>
                )}
            </div>
        ))}
    </div>
);

export const ArenaLobbyView: React.FC<ArenaLobbyViewProps> = ({
    language,
    rating,
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
    selectedOpponentId,
    onBack,
    onOpenParty,
    onSelectOpponent,
    onChallengeOpponent,
    onClaimMilestone,
}) => {
    const selectedOpponent = opponents.find((opponent) => opponent.id === selectedOpponentId) ?? null;
    const claimableMilestone = milestones.find((milestone) => milestone.claimable);

    return (
        <div className="relative z-10 h-full overflow-x-hidden overflow-y-auto px-3 pb-32 pt-3 md:px-6 md:pb-8 md:pt-5 xl:overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(15,12,9,0.25),transparent),radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.16),transparent_42%)]" />

            <div className="relative mx-auto flex min-h-full w-full max-w-[1520px] min-w-0 flex-col gap-3 xl:h-full xl:min-h-0">
                <div className="relative h-[56px] md:h-[78px]">
                    <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2">
                        {onBack && (
                            <CommonBackButton
                                onClick={onBack}
                                label={t(language, 'common.back')}
                                widthClassName="w-[108px] md:w-[162px]"
                                heightClassName="h-[44px] md:h-[66px]"
                                textClassName="text-[12px] md:text-[16px]"
                            />
                        )}
                    </div>
                    <div className="pointer-events-none absolute inset-0 flex min-w-0 items-center justify-center gap-2 px-[116px] md:gap-3 md:px-[220px]">
                        <Swords className="h-4 w-4 shrink-0 text-amber-300 md:h-6 md:w-6" />
                        <h1 className="truncate text-center text-2xl font-black uppercase tracking-[0.16em] text-stone-100 drop-shadow-[0_2px_16px_rgba(0,0,0,0.65)] md:text-5xl md:tracking-[0.24em]">
                            {t(language, 'arena.title')}
                        </h1>
                    </div>
                    <div className="absolute right-0 top-1/2 hidden min-w-0 -translate-y-1/2 items-center gap-2 rounded-lg border border-stone-800 bg-stone-950/78 px-3 py-2 shadow-xl md:flex">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-700/55 bg-black/35 text-amber-300">
                            <Crown className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-amber-200">{rankLabel}</p>
                            <p className="mt-0.5 flex items-center gap-1 text-sm font-black text-stone-100">
                                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                                {rating.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`${panelClass} overflow-hidden p-2.5 md:p-4`}>
                    <div className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-2 md:grid-cols-[136px_minmax(0,1fr)_236px] md:items-stretch md:gap-3">
                        <div className="relative flex min-h-[94px] items-center justify-center rounded-lg border border-amber-800/50 bg-[radial-gradient(circle_at_50%_30%,rgba(245,158,11,0.22),transparent_58%),rgba(0,0,0,0.38)] md:min-h-[150px]">
                            <div className="absolute inset-1.5 rounded-md border border-stone-800/75 md:inset-2" />
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-amber-700/65 bg-stone-900/84 text-amber-300 shadow-[0_0_34px_rgba(245,158,11,0.2)] md:h-28 md:w-28">
                                <Crown className="h-6 w-6 md:h-14 md:w-14" />
                            </div>
                            <div className="absolute bottom-2 max-w-[66px] truncate rounded-md border border-amber-700/45 bg-black/55 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] text-amber-200 md:bottom-3 md:max-w-none md:px-2 md:text-[10px] md:tracking-[0.12em]">
                                {rankLabel}
                            </div>
                        </div>

                        <div className="min-w-0 rounded-lg border border-stone-800 bg-black/24 p-2.5 md:p-4">
                            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_96px] gap-2 md:grid-cols-[minmax(0,1fr)_180px] md:gap-3">
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-stone-500 md:text-xs md:tracking-[0.16em]">
                                        {t(language, 'arena.current_points')}
                                    </p>
                                    <div className="mt-1 flex min-w-0 items-center gap-1.5 md:gap-2">
                                        <p className="truncate text-3xl font-black leading-none text-stone-100 md:text-6xl">
                                            {rating.toLocaleString()}
                                        </p>
                                        <Trophy className="h-5 w-5 shrink-0 text-amber-400 md:h-7 md:w-7" />
                                    </div>
                                </div>
                                <div className="min-w-0 rounded-md border border-stone-800 bg-black/30 px-2 py-1.5 md:hidden">
                                    <p className={`truncate text-[8px] font-black uppercase tracking-[0.11em] ${claimableMilestone ? 'text-emerald-300' : 'text-stone-500'}`}>
                                        {t(language, 'arena.claimable_rewards')}
                                    </p>
                                    <p className={`mt-1 truncate text-lg font-black leading-none ${claimableMilestone ? 'text-emerald-200' : 'text-stone-100'}`}>
                                        {claimableMilestone ? claimableMilestone.rewardLabel : claimableMilestoneCount.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-2 min-w-0 border-t border-stone-800 pt-2 md:mt-4 md:pt-3">
                                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                    <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-stone-500 md:text-xs md:tracking-[0.14em]">
                                        {t(language, 'arena.next_rank')} {nextRankLabel ?? t(language, 'arena.max_rank')}
                                    </p>
                                    <p className="shrink-0 text-[9px] font-black text-amber-200 md:text-xs">
                                        {nextRankThreshold ? `${rating.toLocaleString()} / ${nextRankThreshold.toLocaleString()}` : rankLabel}
                                    </p>
                                </div>
                                <div className="mt-1.5 overflow-hidden rounded-full border border-stone-800 bg-stone-950 md:mt-2">
                                    <div className="h-2 bg-gradient-to-r from-amber-500 to-red-500 md:h-2.5" style={{ width: `${rankProgress}%` }} />
                                </div>
                                <p className="mt-1.5 text-[10px] font-bold text-stone-500 md:mt-2 md:text-xs">
                                    {nextRankThreshold
                                        ? t(language, 'arena.points_remaining', { value: nextRankRemaining.toLocaleString() })
                                        : t(language, 'arena.max_rank')}
                                </p>
                            </div>
                        </div>

                        <div className="hidden rounded-lg border border-stone-800 bg-black/32 p-3 md:col-span-1 md:block md:p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className={`text-[10px] font-black uppercase tracking-[0.15em] md:text-xs ${claimableMilestone ? 'text-emerald-300' : 'text-stone-500'}`}>
                                    {t(language, 'arena.claimable_rewards')}
                                </p>
                                <Sparkles className={`h-4 w-4 ${claimableMilestone ? 'text-emerald-300' : 'text-stone-700'}`} />
                            </div>
                            <p className={`mt-3 text-2xl font-black md:text-3xl ${claimableMilestone ? 'text-emerald-200' : 'text-stone-100'}`}>
                                {claimableMilestone ? claimableMilestone.rewardLabel : claimableMilestoneCount.toLocaleString()}
                            </p>
                            <p className="mt-1 text-[11px] font-bold text-stone-500 md:text-xs">
                                {claimableMilestone
                                    ? claimableMilestone.threshold.toLocaleString()
                                    : nextMilestone
                                        ? nextMilestone.rewardLabel
                                        : t(language, 'arena.milestone_claimed')}
                            </p>
                            {claimableMilestone && (
                                <SfxButton
                                    sfx="click"
                                    onClick={() => onClaimMilestone(claimableMilestone.threshold)}
                                    className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-amber-700/70 bg-amber-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-all hover:bg-amber-500 active:scale-95"
                                >
                                    {t(language, 'arena.claim_reward')}
                                </SfxButton>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid min-w-0 flex-1 gap-3 xl:min-h-0 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
                    <aside className="flex min-w-0 flex-col gap-3 xl:min-h-0">
                        <section className={`${panelClass} p-3 md:p-4`}>
                            <SectionHeader
                                icon={<Shield className="h-4 w-4" />}
                                label={t(language, 'arena.selected_party')}
                                action={
                                    <SfxButton
                                        sfx="switch"
                                        onClick={onOpenParty}
                                        className="rounded-md border border-amber-700/70 bg-amber-600/90 px-2 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-white transition-all hover:bg-amber-500 active:scale-95 md:px-2.5 md:text-[9px] md:tracking-[0.12em]"
                                    >
                                        {t(language, 'arena.edit_party')}
                                    </SfxButton>
                                }
                            />
                            <div className="mt-2 grid grid-cols-2 gap-2 md:mt-3 xl:grid-cols-1">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <PartySlot
                                        key={selectedParty[index]?.id ?? `slot-${index}`}
                                        mercenary={selectedParty[index]}
                                        language={language}
                                        slotNumber={index + 1}
                                    />
                                ))}
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-stone-800 bg-black/28 px-3 py-2 md:mt-3">
                                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-stone-500 md:text-[10px] md:tracking-[0.14em]">
                                    {t(language, 'arena.party_readiness')}
                                </p>
                                <p className="text-[11px] font-black text-stone-200 md:text-xs">
                                    {averagePartyLevel > 0
                                        ? t(language, 'arena.average_level', { value: averagePartyLevel.toString() })
                                        : t(language, 'arena.no_party')}
                                </p>
                            </div>
                        </section>
                    </aside>

                    <main className={`${panelClass} flex min-h-[360px] min-w-0 flex-col p-3 md:min-h-[420px] md:p-4 xl:min-h-0`}>
                        <SectionHeader
                            icon={<Swords className="h-4 w-4" />}
                            label={t(language, 'arena.opponents')}
                            action={<span className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-600">{opponents.length}</span>}
                        />
                        <div className="mt-2 grid flex-1 gap-2 overflow-visible md:mt-3 md:gap-3 lg:grid-cols-2 xl:min-h-0 xl:grid-cols-1 xl:overflow-y-auto xl:pr-1">
                            {opponents.map((opponent, index) => (
                                <ArenaOpponentCard
                                    key={opponent.id}
                                    opponent={opponent}
                                    language={language}
                                    rankNumber={index + 1}
                                    isSelected={selectedOpponentId === opponent.id}
                                    onSelect={() => onSelectOpponent(opponent)}
                                    onChallenge={() => onChallengeOpponent(opponent)}
                                />
                            ))}
                        </div>
                    </main>

                    <aside className="flex min-w-0 flex-col gap-3 xl:min-h-0">
                        <section className={`${panelClass} p-3 md:p-4`}>
                            <SectionHeader
                                icon={<Trophy className="h-4 w-4" />}
                                label={t(language, 'arena.next_milestone')}
                                action={
                                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-800/70 bg-emerald-950/30 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300">
                                        <Sparkles className="h-3 w-3" />
                                        {claimableMilestoneCount}
                                    </span>
                                }
                            />
                            <div className="mt-2 rounded-lg border border-stone-800 bg-black/32 p-3 md:mt-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xl font-black text-amber-300 md:text-2xl">
                                            {nextMilestone ? nextMilestone.threshold.toLocaleString() : t(language, 'arena.milestone_claimed')}
                                        </p>
                                        <p className="mt-1 truncate text-[11px] font-bold text-stone-500 md:text-xs">
                                            {nextMilestone?.rewardLabel ?? t(language, 'arena.peak_updated')}
                                        </p>
                                    </div>
                                    <Medal className="h-6 w-6 shrink-0 text-amber-500/80" />
                                </div>
                                <div className="mt-3 overflow-hidden rounded-full border border-stone-800 bg-stone-950">
                                    <div className="h-2.5 bg-gradient-to-r from-emerald-500 to-amber-400" style={{ width: `${nextMilestoneProgress}%` }} />
                                </div>
                                <p className="mt-2 text-xs text-stone-500">
                                    {nextMilestone
                                        ? t(language, 'arena.points_remaining', { value: nextMilestoneRemaining.toLocaleString() })
                                        : t(language, 'arena.milestone_claimed')}
                                </p>
                            </div>
                            <div className="mt-2 md:mt-3">
                                <MilestoneStrip language={language} milestones={milestones} onClaimMilestone={onClaimMilestone} />
                            </div>
                        </section>

                        <section className={`${panelClass} hidden p-3 md:p-4 xl:block`}>
                            <SectionHeader icon={<ScrollText className="h-4 w-4" />} label={t(language, 'arena.point_preview')} />
                            <div className="mt-3 space-y-2 rounded-lg border border-stone-800 bg-black/32 p-3">
                                <div className="flex items-center justify-between gap-3 text-xs">
                                    <span className="font-black uppercase tracking-[0.14em] text-stone-500">{t(language, 'arena.player_party')}</span>
                                    <span className="font-black text-stone-200">{selectedParty.length}/4</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-xs">
                                    <span className="font-black uppercase tracking-[0.14em] text-stone-500">{t(language, 'arena.opponents')}</span>
                                    <span className="font-black text-stone-200">{opponents.length}</span>
                                </div>
                                <p className="pt-2 text-xs leading-relaxed text-stone-500">
                                    {selectedOpponent
                                        ? `${selectedOpponent.displayName}: +${selectedOpponent.winPoints} / -${selectedOpponent.lossPoints}`
                                        : t(language, 'arena.no_party')}
                                </p>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>

            <div className="fixed inset-x-3 bottom-3 z-[80] xl:hidden">
                <div className="mx-auto flex max-w-[720px] min-w-0 items-center gap-2 rounded-lg border border-stone-700 bg-stone-950/92 p-2 shadow-2xl backdrop-blur-md">
                    <div className="min-w-0 flex-1 px-2">
                        <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                            {t(language, 'arena.opponents')}
                        </p>
                        <p className="truncate text-sm font-black text-stone-100">
                            {selectedOpponent ? selectedOpponent.displayName : t(language, 'arena.no_party')}
                        </p>
                    </div>
                    <SfxButton
                        sfx="click"
                        disabled={!selectedOpponent || selectedParty.length === 0}
                        onClick={() => selectedOpponent && onChallengeOpponent(selectedOpponent)}
                        className="inline-flex min-h-[46px] items-center gap-2 rounded-md border border-amber-700/70 bg-amber-600 px-4 py-2 text-[11px] font-black uppercase tracking-[0.13em] text-white transition-all hover:bg-amber-500 active:scale-95 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-800 disabled:text-stone-500"
                    >
                        {t(language, 'arena.challenge')}
                        <ChevronRight className="h-4 w-4" />
                    </SfxButton>
                </div>
            </div>
        </div>
    );
};
