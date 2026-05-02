import React, { useEffect, useMemo, useRef } from 'react';
import { Pause, Play, ScrollText, Shield, Swords } from 'lucide-react';
import { UI_MODAL_LAYOUT } from '../../../../config/ui-config';
import { useSimulation, type CombatantInstance, type SingleMatchReport } from '../../../../hooks/useSimulation';
import type { Mercenary } from '../../../../models/Mercenary';
import type { DerivedStats } from '../../../../models/Stats';
import type { Language } from '../../../../types';
import { t } from '../../../../utils/i18n';
import { SfxButton } from '../../../common/ui/SfxButton';
import { MercenaryPortrait } from '../../../common/ui/MercenaryPortrait';
import type { ArenaOpponentViewModel } from '../types';

const DEFAULT_ARENA_BATTLE_SPEED: 1 | 2 | 5 | 10 = 2;

interface ArenaCombatOverlayProps {
    isOpen: boolean;
    language: Language;
    playerParty: Mercenary[];
    opponent: ArenaOpponentViewModel | null;
    onFinish: (
        winner: 'A' | 'B',
        report: SingleMatchReport,
        playerMvp: {
            mercenary: Mercenary;
            kills: number;
            damageDealt: number;
            damageTaken: number;
        } | null
    ) => void;
}

interface CombatantRowProps {
    combatant: CombatantInstance;
    mercenary: Mercenary | null;
    derived: DerivedStats | null;
}

const CombatantRow: React.FC<CombatantRowProps> = ({ combatant, mercenary, derived }) => {
    if (!mercenary || !derived) return null;

    const hpPercent = Math.max(0, Math.min(100, (combatant.currentHp / derived.maxHp) * 100));
    const gaugePercent = Math.max(0, Math.min(100, (combatant.gauge / 1000) * 100));

    return (
        <div
            className={`rounded-2xl border px-3 py-3 transition-all ${
                combatant.currentHp <= 0
                    ? 'border-stone-800 bg-stone-950/60 opacity-45 grayscale'
                    : combatant.lastAttacker
                      ? 'border-amber-600 bg-amber-950/18 shadow-[0_0_24px_rgba(245,158,11,0.18)]'
                      : 'border-stone-800 bg-black/26'
            }`}
        >
            <div className="flex items-center gap-3">
                <MercenaryPortrait mercenary={mercenary} className="h-11 w-11 shrink-0 md:h-12 md:w-12" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="truncate text-[13px] font-black text-stone-100 md:text-sm">{mercenary.name}</p>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                                {mercenary.job} • Lv.{mercenary.level}
                            </p>
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="text-[11px] font-black text-stone-300">{Math.round(combatant.currentHp)}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-stone-600">/ {derived.maxHp}</p>
                        </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                        <div className="overflow-hidden rounded-full border border-stone-800 bg-stone-950">
                            <div className="h-2 bg-red-500 transition-all duration-300" style={{ width: `${hpPercent}%` }} />
                        </div>
                        <div className="overflow-hidden rounded-full border border-stone-800 bg-stone-950">
                            <div
                                className={`h-1.5 transition-all duration-100 ${gaugePercent >= 100 ? 'bg-amber-200' : 'bg-amber-500'}`}
                                style={{ width: `${gaugePercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface TeamPanelProps {
    title: string;
    accent: 'blue' | 'rose';
    team: CombatantInstance[];
    mercenaryMap: Map<string, Mercenary>;
    getDerivedStats: (mercId: string | null, level: number, alloc: Mercenary['allocatedStats']) => DerivedStats | null;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ title, accent, team, mercenaryMap, getDerivedStats }) => {
    const activeCount = team.filter((combatant) => combatant.mercenaryId && combatant.currentHp > 0).length;
    const accentClasses =
        accent === 'blue'
            ? 'border-sky-900/60 bg-sky-950/10 text-sky-300'
            : 'border-rose-900/60 bg-rose-950/10 text-rose-300';

    return (
        <div className="flex min-h-0 flex-col rounded-[24px] border border-stone-800 bg-stone-900/84 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400 md:text-[11px]">{title}</p>
                <div className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${accentClasses}`}>
                    {activeCount}
                </div>
            </div>

            <div className="min-h-0 space-y-2 overflow-y-auto pr-1 md:space-y-2.5">
                {team.map((combatant) => {
                    const mercenary = combatant.mercenaryId ? mercenaryMap.get(combatant.mercenaryId) ?? null : null;
                    const derived = getDerivedStats(combatant.mercenaryId, combatant.level, combatant.allocatedStats);
                    return (
                        <CombatantRow
                            key={combatant.instanceId}
                            combatant={combatant}
                            mercenary={mercenary}
                            derived={derived}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export const ArenaCombatOverlay: React.FC<ArenaCombatOverlayProps> = ({
    isOpen,
    language,
    playerParty,
    opponent,
    onFinish,
}) => {
    const sim = useSimulation({ externalMercenaries: opponent?.party ?? [] });
    const simulationRef = useRef(sim);
    const hasSettledRef = useRef(false);

    useEffect(() => {
        simulationRef.current = sim;
    }, [sim]);

    const playerSignature = useMemo(() => playerParty.map((mercenary) => mercenary.id).join('|'), [playerParty]);
    const playerMercenaryMap = useMemo(
        () => new Map(playerParty.map((mercenary) => [mercenary.id, mercenary])),
        [playerParty]
    );
    const opponentMercenaryMap = useMemo(
        () => new Map((opponent?.party ?? []).map((mercenary) => [mercenary.id, mercenary])),
        [opponent]
    );
    const playerMvp = useMemo(() => {
        const candidates = sim.teamA
            .filter((combatant) => combatant.mercenaryId)
            .map((combatant) => ({
                combatant,
                mercenary: combatant.mercenaryId
                    ? playerMercenaryMap.get(combatant.mercenaryId) ?? null
                    : null,
            }))
            .filter(
                (
                    candidate
                ): candidate is {
                    combatant: CombatantInstance;
                    mercenary: Mercenary;
                } => Boolean(candidate.mercenary)
            );

        if (candidates.length === 0) return null;

        const top = [...candidates].sort((left, right) => {
            if (right.combatant.kills !== left.combatant.kills) {
                return right.combatant.kills - left.combatant.kills;
            }

            const leftScore = left.combatant.damageDealt + left.combatant.damageTaken;
            const rightScore = right.combatant.damageDealt + right.combatant.damageTaken;
            return rightScore - leftScore;
        })[0];

        return {
            mercenary: top.mercenary,
            kills: top.combatant.kills,
            damageDealt: Math.round(top.combatant.damageDealt),
            damageTaken: Math.round(top.combatant.damageTaken),
        };
    }, [playerMercenaryMap, sim.teamA]);
    const recentLogs = useMemo(() => sim.combatLog.slice(-8), [sim.combatLog]);

    useEffect(() => {
        if (!isOpen) {
            sim.handleReset();
        }
    }, [isOpen, sim.handleReset]);

    useEffect(() => {
        if (!isOpen || !opponent || playerParty.length === 0) return;

        hasSettledRef.current = false;
        simulationRef.current.setBattleSpeed(DEFAULT_ARENA_BATTLE_SPEED);
        simulationRef.current.loadPresetMatch(playerParty, opponent.party);

        const startTimer = window.setTimeout(() => {
            simulationRef.current.runAttackCycle();
        }, 120);

        return () => window.clearTimeout(startTimer);
    }, [isOpen, opponent, playerParty, playerSignature]);

    useEffect(() => {
        if (!isOpen || !sim.singleMatchReport || hasSettledRef.current) return;

        hasSettledRef.current = true;
        const report = sim.singleMatchReport;
        const mvp = playerMvp;
        const finishTimer = window.setTimeout(() => {
            onFinish(report.winner === 'A' ? 'A' : 'B', report, mvp);
        }, 1100);

        return () => window.clearTimeout(finishTimer);
    }, [isOpen, onFinish, playerMvp, sim.singleMatchReport]);

    if (!isOpen || !opponent) return null;

    const winner = sim.singleMatchReport?.winner ?? null;
    const statusLabel = winner
        ? t(language, 'arena.battle_resolving')
        : sim.isBattleRunning
          ? t(language, 'arena.battle_in_progress')
          : t(language, 'arena.battle_preparing');

    return (
        <div className={`${UI_MODAL_LAYOUT.OVERLAY} z-[2350]`}>
            <div className="relative mx-auto flex max-h-[94vh] w-[96%] max-w-6xl flex-col overflow-hidden rounded-[28px] border-2 border-stone-700 bg-stone-950 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
                <div className="border-b border-stone-800 bg-stone-900/96 px-4 py-4 md:px-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-300/90">
                                {t(language, 'arena.battle_title')}
                            </p>
                            <h3 className="mt-2 text-xl font-black text-stone-100 md:text-2xl">{opponent.displayName}</h3>
                            <p className="mt-1 text-[13px] text-stone-500 md:text-sm">{t(language, 'arena.battle_subtitle')}</p>
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                            <div className="flex flex-wrap items-center gap-2">
                                {[1, 2, 5, 10].map((speed) => (
                                    <SfxButton
                                        key={speed}
                                        sfx="switch"
                                        onClick={() => sim.setBattleSpeed(speed as 1 | 2 | 5 | 10)}
                                        className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
                                            sim.battleSpeed === speed
                                                ? 'border-amber-700 bg-amber-600 text-white shadow-[0_0_18px_rgba(245,158,11,0.2)]'
                                                : 'border-stone-800 bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                                        }`}
                                    >
                                        {speed}x
                                    </SfxButton>
                                ))}

                                <SfxButton
                                    sfx="click"
                                    onClick={sim.runAttackCycle}
                                    disabled={!sim.isBattleRunning && !!winner}
                                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
                                        sim.isBattleRunning
                                            ? 'border-rose-800 bg-rose-900/60 text-rose-200 hover:bg-rose-900/80'
                                            : 'border-emerald-800 bg-emerald-900/60 text-emerald-200 hover:bg-emerald-900/80 disabled:cursor-not-allowed disabled:opacity-40'
                                    }`}
                                >
                                    {sim.isBattleRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                    {t(language, sim.isBattleRunning ? 'arena.pause_battle' : 'arena.resume_battle')}
                                </SfxButton>
                            </div>

                            <div className="inline-flex items-center gap-2 self-start rounded-full border border-stone-800 bg-black/28 px-3 py-2 sm:self-auto">
                                <Swords className="h-3.5 w-3.5 text-amber-400" />
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                                    {statusLabel}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-3 p-3 md:gap-4 md:p-4 lg:grid lg:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] lg:items-stretch">
                        <TeamPanel
                            title={t(language, 'arena.player_party')}
                            accent="blue"
                            team={sim.teamA}
                            mercenaryMap={playerMercenaryMap}
                            getDerivedStats={sim.getDerivedStats}
                        />

                        <div className="hidden flex-col items-center justify-center gap-3 lg:flex">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-700/50 bg-amber-950/20 text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.15)]">
                                <Swords className="h-8 w-8" />
                            </div>
                            <p className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                                {statusLabel}
                            </p>
                        </div>

                        <TeamPanel
                            title={t(language, 'arena.enemy_party')}
                            accent="rose"
                            team={sim.teamB}
                            mercenaryMap={opponentMercenaryMap}
                            getDerivedStats={sim.getDerivedStats}
                        />
                    </div>
                </div>

                <div className="border-t border-stone-800 bg-stone-900/96 px-4 py-4 md:px-5">
                    <div className="mb-3 flex items-center gap-2">
                        <ScrollText className="h-4 w-4 text-stone-400" />
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
                            {t(language, 'arena.battle_log')}
                        </p>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="h-[108px] overflow-y-auto rounded-2xl border border-stone-800 bg-black/24 px-4 py-3 md:h-[132px]">
                            <div className="space-y-1.5">
                                {recentLogs.length > 0 ? (
                                    recentLogs.map((entry, index) => (
                                        <p
                                            key={`${entry.msg}-${index}`}
                                            className={`text-[13px] leading-relaxed md:text-sm ${
                                                entry.team === 'A'
                                                    ? 'text-blue-200'
                                                    : entry.team === 'B'
                                                      ? 'text-rose-200'
                                                      : 'text-stone-400'
                                            }`}
                                        >
                                            {entry.msg}
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-[13px] text-stone-500 md:text-sm">{t(language, 'arena.battle_preparing')}</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-stone-800 bg-black/24 px-4 py-4">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-amber-400" />
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
                                    {t(language, 'arena.point_preview')}
                                </p>
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-lg font-black">
                                <span className="text-emerald-400">+{opponent.winPoints}</span>
                                <span className="text-stone-600">/</span>
                                <span className="text-rose-400">-{opponent.lossPoints}</span>
                            </div>
                            {winner && (
                                <p className="mt-4 text-sm font-black text-amber-300">
                                    {t(language, winner === 'A' ? 'arena.result_win' : 'arena.result_loss')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
