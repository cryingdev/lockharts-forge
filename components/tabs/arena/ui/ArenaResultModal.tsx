import React from 'react';
import { Trophy, XCircle } from 'lucide-react';
import { UI_MODAL_LAYOUT } from '../../../../config/ui-config';
import { MercenaryPortrait } from '../../../common/ui/MercenaryPortrait';
import { SfxButton } from '../../../common/ui/SfxButton';
import { t } from '../../../../utils/i18n';
import type { Language } from '../../../../types';
import type { ArenaBattleResultViewModel } from '../types';

interface ArenaResultModalProps {
    isOpen: boolean;
    language: Language;
    result: ArenaBattleResultViewModel | null;
    onClose: () => void;
    onClaimMilestone?: () => void;
}

export const ArenaResultModal: React.FC<ArenaResultModalProps> = ({
    isOpen,
    language,
    result,
    onClose,
    onClaimMilestone,
}) => {
    if (!isOpen || !result) return null;

    const isWin = result.outcome === 'WIN';
    const mvpHighlightText =
        result.playerMvp && result.playerMvp.kills > 0
            ? t(language, 'arena.mvp_finisher', { count: result.playerMvp.kills.toLocaleString() })
            : result.battleSummary
              ? t(language, 'arena.mvp_max_hit', { value: result.battleSummary.maxHitFor.toLocaleString() })
              : null;

    return (
        <div className={`${UI_MODAL_LAYOUT.OVERLAY} z-[2400]`} onClick={onClose}>
            <div
                className="relative mx-auto flex h-fit max-h-[90vh] w-[92%] max-w-[520px] flex-col overflow-hidden rounded-[28px] border-2 border-stone-700 bg-stone-900"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex flex-col items-center border-b border-stone-800 bg-stone-900/95 px-5 py-6 text-center">
                    <div
                        className={`flex h-16 w-16 items-center justify-center rounded-full border ${
                            isWin
                                ? 'border-amber-700 bg-amber-950/50 text-amber-400'
                                : 'border-rose-800 bg-rose-950/40 text-rose-400'
                        }`}
                    >
                        {isWin ? <Trophy className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                    </div>
                    <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-stone-500">
                        {result.opponentName}
                    </p>
                    <h3 className={`mt-2 text-3xl font-black ${isWin ? 'text-amber-300' : 'text-stone-100'}`}>
                        {t(language, isWin ? 'arena.result_win' : 'arena.result_loss')}
                    </h3>
                    <p className={`mt-3 text-4xl font-black ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {result.pointsDelta > 0 ? '+' : ''}
                        {result.pointsDelta}
                    </p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                    <div className="rounded-2xl border border-stone-800 bg-black/24 px-4 py-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
                            {t(language, 'arena.rating_after')}
                        </p>
                        <p className="mt-2 text-2xl font-black text-stone-100">
                            {result.ratingAfter.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                            {t(language, 'arena.peak_points')}: {result.peakRating.toLocaleString()}
                        </p>
                    </div>

                    {result.playerMvp && (
                        <div className="relative overflow-hidden rounded-2xl border border-amber-700/80 bg-[linear-gradient(180deg,rgba(120,53,15,0.28)_0%,rgba(17,24,39,0.82)_100%)] px-4 py-4 shadow-[0_0_28px_rgba(245,158,11,0.16)]">
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.24),transparent_70%)]" />
                            <div className="relative flex items-center justify-between gap-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
                                    {t(language, 'arena.mvp_title')}
                                </p>
                                <div className="rounded-full border border-amber-500/60 bg-amber-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.12)]">
                                    MVP
                                </div>
                            </div>

                            <div className="relative mt-3 flex items-center gap-3">
                                <MercenaryPortrait mercenary={result.playerMvp.mercenary} className="h-14 w-14 shrink-0 md:h-16 md:w-16" />

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-lg font-black text-stone-100">
                                        {result.playerMvp.mercenary.name}
                                    </p>
                                    <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-stone-500">
                                        {result.playerMvp.mercenary.job} • Lv.{result.playerMvp.mercenary.level}
                                    </p>
                                </div>
                            </div>

                            {mvpHighlightText && (
                                <div className="relative mt-3 rounded-xl border border-amber-700/50 bg-amber-950/18 px-3 py-2">
                                    <p className="text-[11px] font-black tracking-[0.06em] text-amber-200">
                                        {mvpHighlightText}
                                    </p>
                                </div>
                            )}

                            <div className="relative mt-3 grid grid-cols-3 gap-2">
                                <div className="rounded-xl border border-stone-800 bg-stone-950/70 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                                        {t(language, 'arena.mvp_kills')}
                                    </p>
                                    <p className="mt-1 text-lg font-black text-stone-100">
                                        {result.playerMvp.kills}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-stone-800 bg-stone-950/70 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                                        {t(language, 'arena.damage_dealt')}
                                    </p>
                                    <p className="mt-1 text-lg font-black text-stone-100">
                                        {result.playerMvp.damageDealt.toLocaleString()}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-stone-800 bg-stone-950/70 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                                        {t(language, 'arena.damage_taken')}
                                    </p>
                                    <p className="mt-1 text-lg font-black text-stone-100">
                                        {result.playerMvp.damageTaken.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {result.battleSummary && (
                        <div className="rounded-2xl border border-stone-800 bg-black/24 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
                                    {t(language, 'arena.battle_summary')}
                                </p>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                                    {t(language, 'arena.player_party')} / {t(language, 'arena.enemy_party')}
                                </p>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/14 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                                        {t(language, 'arena.damage_dealt')}
                                    </p>
                                    <p className="mt-2 text-xl font-black text-stone-100">
                                        {result.battleSummary.damageFor.toLocaleString()}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-rose-900/60 bg-rose-950/14 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-300">
                                        {t(language, 'arena.damage_taken')}
                                    </p>
                                    <p className="mt-2 text-xl font-black text-stone-100">
                                        {result.battleSummary.damageAgainst.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-stone-300">
                                <div className="rounded-xl border border-stone-800 bg-stone-950/70 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                                        {t(language, 'arena.attack_count')}
                                    </p>
                                    <p className="mt-1 font-black text-stone-100">
                                        {result.battleSummary.attacksFor} / {result.battleSummary.attacksAgainst}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-stone-800 bg-stone-950/70 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                                        {t(language, 'arena.crit_count')}
                                    </p>
                                    <p className="mt-1 font-black text-stone-100">
                                        {result.battleSummary.critsFor} / {result.battleSummary.critsAgainst}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-stone-800 bg-stone-950/70 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                                        {t(language, 'arena.evasion_count')}
                                    </p>
                                    <p className="mt-1 font-black text-stone-100">
                                        {result.battleSummary.evasionsFor} / {result.battleSummary.evasionsAgainst}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-stone-800 bg-stone-950/70 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                                        {t(language, 'arena.duration_ticks')}
                                    </p>
                                    <p className="mt-1 font-black text-stone-100">
                                        {result.battleSummary.durationTicks.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {result.unlockedMilestone && (
                        <div className="rounded-2xl border border-amber-800/60 bg-amber-950/20 px-4 py-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
                                {t(language, 'arena.milestone_unlocked')}
                            </p>
                            <p className="mt-2 text-xl font-black text-stone-100">
                                {result.unlockedMilestone.threshold.toLocaleString()}
                            </p>
                            <p className="mt-1 text-sm text-stone-400">{result.unlockedMilestone.rewardLabel}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 border-t border-stone-800 bg-stone-900 px-5 py-4">
                    {result.unlockedMilestone && onClaimMilestone && (
                        <SfxButton
                            sfx="switch"
                            onClick={onClaimMilestone}
                            className="w-full rounded-2xl border-b-4 border-amber-800 bg-amber-600 px-5 py-4 text-[14px] font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-amber-500 active:scale-[0.985]"
                        >
                            {t(language, 'arena.claim_reward')}
                        </SfxButton>
                    )}
                    <SfxButton
                        sfx="click"
                        onClick={onClose}
                        className="w-full rounded-2xl bg-stone-800 px-5 py-4 text-[13px] font-black uppercase tracking-[0.14em] text-stone-300 transition-all hover:bg-stone-700 active:scale-[0.985]"
                    >
                        {t(language, 'arena.return_lobby')}
                    </SfxButton>
                </div>
            </div>
        </div>
    );
};
