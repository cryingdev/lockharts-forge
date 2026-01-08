import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { Mercenary } from '../models/Mercenary';
import { calculateDerivedStats, applyEquipmentBonuses, DerivedStats, mergePrimaryStats, PrimaryStats } from '../models/Stats';
import { Equipment } from '../models/Equipment';
import { calculateCombatResult, calculateExpectedDPS, calculateFastDmg } from '../utils/combatLogic';
import { JobClass, JOB_EFFICIENCY } from '../models/JobClass';

const ACTION_THRESHOLD = 1000;
const MAX_SQUAD_SIZE = 4;

export interface CombatantInstance {
    instanceId: string;
    mercenaryId: string | null;
    level: number;
    allocatedStats: PrimaryStats;
    currentHp: number;
    gauge: number;
    dps: number;
    lastAttacker?: boolean;
    lastDamaged?: boolean;
    // Stats for MVP and performance tracking
    kills: number;
    damageDealt: number;
    damageTaken: number;
}

export interface MatchStats {
    totalDmg: number;
    crits: number;
    misses: number;
    attacks: number;
    evasions: number;
    maxDmg: number;
    minDmg: number;
}

export interface CombatLogEntry {
    msg: string;
    team: 'A' | 'B' | 'SYSTEM';
    isCrit?: boolean;
    isMiss?: boolean;
}

export interface SingleMatchReport {
    winner: 'A' | 'B' | null;
    durationTicks: number;
    statsA: MatchStats;
    statsB: MatchStats;
    analysis: string[];
}

export interface BulkReport {
    rounds: number;
    winA: number;
    winB: number;
    avgAtksA: number;
    avgAtksB: number;
    avgCritsA: number;
    avgCritsB: number;
    avgEvasionsA: number;
    avgEvasionsB: number;
}

export interface SimulationHook {
    teamA: CombatantInstance[];
    teamB: CombatantInstance[];
    addSlot: (side: 'A' | 'B') => void;
    removeSlot: (side: 'A' | 'B', instanceId: string) => void;
    updateSlot: (side: 'A' | 'B', instanceId: string, data: Partial<CombatantInstance>) => void;
    combatLog: CombatLogEntry[];
    clearLogs: () => void;
    isBattleRunning: boolean;
    battleSpeed: 1 | 2 | 5 | 10;
    setBattleSpeed: (speed: 1 | 2 | 5 | 10) => void;
    singleMatchReport: SingleMatchReport | null;
    liveStats: { A: MatchStats, B: MatchStats } | null;
    bulkReport: BulkReport | null;
    isSearching: boolean;
    handleReset: () => void;
    runBulkSimulation: () => void;
    runAttackCycle: () => void;
    getDerivedStats: (mercId: string | null, level: number, alloc: PrimaryStats) => DerivedStats | null;
}

const createEmptyCombatant = (): CombatantInstance => ({
    instanceId: `inst_${Math.random().toString(36).substr(2, 9)}`,
    mercenaryId: null,
    level: 1,
    allocatedStats: { str: 0, vit: 0, dex: 0, int: 0, luk: 0 },
    currentHp: 0,
    gauge: 0,
    dps: 0,
    kills: 0,
    damageDealt: 0,
    damageTaken: 0
});

const createInitialStats = (): MatchStats => ({
    totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0, maxDmg: 0, minDmg: 0
});

export const useSimulation = (): SimulationHook => {
    const { state } = useGame();
    
    const [battleState, setBattleState] = useState<{
        teamA: CombatantInstance[],
        teamB: CombatantInstance[]
    }>({
        teamA: [createEmptyCombatant()],
        teamB: [createEmptyCombatant()]
    });

    const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
    const [isBattleRunning, setIsBattleRunning] = useState(false);
    const [battleSpeed, setBattleSpeed] = useState<1 | 2 | 5 | 10>(1);
    const [singleMatchReport, setSingleMatchReport] = useState<SingleMatchReport | null>(null);
    const [liveStats, setLiveStats] = useState<{ A: MatchStats, B: MatchStats } | null>(null);
    const [bulkReport, setBulkReport] = useState<BulkReport | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    
    const battleInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const battleSpeedRef = useRef<number>(1);
    const stopSearchRef = useRef(false);

    const matchStatsRef = useRef<{A: MatchStats, B: MatchStats, ticks: number}>({
        A: createInitialStats(),
        B: createInitialStats(),
        ticks: 0
    });

    const statsCache = useRef<Map<string, { key: string, stats: DerivedStats }>>(new Map());

    useEffect(() => { battleSpeedRef.current = battleSpeed; }, [battleSpeed]);

    const getDerivedStats = useCallback((mercId: string | null, level: number, alloc: PrimaryStats) => {
        if (!mercId) return null;
        
        const merc = state.knownMercenaries.find(m => m.id === mercId);
        if (!merc) return null;

        const cacheKey = `${mercId}_${level}_${alloc.str}_${alloc.vit}_${alloc.dex}_${alloc.int}_${alloc.luk}`;
        const cached = statsCache.current.get(mercId);
        if (cached && cached.key === cacheKey) return cached.stats;

        const primary = mergePrimaryStats(merc.stats, alloc);
        const base = calculateDerivedStats(primary, level);
        const eqStats = (Object.values(merc.equipment) as (Equipment | null)[]).map(e => e?.stats).filter(Boolean);
        const stats = applyEquipmentBonuses(base, eqStats as any);

        statsCache.current.set(mercId, { key: cacheKey, stats });
        return stats;
    }, [state.knownMercenaries]);

    useEffect(() => {
        if (isBattleRunning) return;
        const refreshTeam = (team: CombatantInstance[]) => team.map(c => {
            if (!c.mercenaryId) return c;
            const derived = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats);
            const merc = state.knownMercenaries.find(m => m.id === c.mercenaryId);
            if (!derived || !merc) return c;
            const isMage = derived.magicalAttack > derived.physicalAttack;
            return { ...c, dps: calculateExpectedDPS(derived, merc.job, isMage ? 'MAGICAL' : 'PHYSICAL') };
        });

        setBattleState(prev => ({
            teamA: refreshTeam(prev.teamA),
            teamB: refreshTeam(prev.teamB)
        }));
    }, [state.knownMercenaries, getDerivedStats, isBattleRunning]);

    const addSlot = (side: 'A' | 'B') => {
        setBattleState(prev => {
            const teamKey = side === 'A' ? 'teamA' : 'teamB';
            if (prev[teamKey].length >= MAX_SQUAD_SIZE) return prev;
            return { ...prev, [teamKey]: [...prev[teamKey], createEmptyCombatant()] };
        });
    };

    const removeSlot = (side: 'A' | 'B', instanceId: string) => {
        setBattleState(prev => {
            const teamKey = side === 'A' ? 'teamA' : 'teamB';
            return { ...prev, [teamKey]: prev[teamKey].filter(i => i.instanceId !== instanceId) };
        });
    };

    const updateSlot = (side: 'A' | 'B', instanceId: string, data: Partial<CombatantInstance>) => {
        setBattleState(prev => {
            const teamKey = side === 'A' ? 'teamA' : 'teamB';
            const newTeam = prev[teamKey].map(item => {
                if (item.instanceId !== instanceId) return item;
                let updated = { ...item, ...data };
                
                if (data.mercenaryId !== undefined && data.mercenaryId !== null) {
                    const merc = state.knownMercenaries.find(m => m.id === data.mercenaryId);
                    if (merc) {
                        updated.level = merc.level;
                        updated.allocatedStats = { ...merc.allocatedStats };
                    }
                }

                if (data.mercenaryId !== undefined || data.level !== undefined || data.allocatedStats !== undefined) {
                    const derived = getDerivedStats(updated.mercenaryId, updated.level, updated.allocatedStats);
                    const merc = state.knownMercenaries.find(m => m.id === updated.mercenaryId);
                    if (derived && merc) {
                        updated.currentHp = derived.maxHp;
                        const isMage = derived.magicalAttack > derived.physicalAttack;
                        updated.dps = calculateExpectedDPS(derived, merc.job, isMage ? 'MAGICAL' : 'PHYSICAL');
                    }
                }
                return updated;
            });
            return { ...prev, [teamKey]: newTeam };
        });
    };

    const addLog = (msg: string, team: 'A' | 'B' | 'SYSTEM' = 'SYSTEM', isCrit = false, isMiss = false) => {
        setCombatLog(prev => [...prev, { msg, team, isCrit, isMiss }].slice(-100));
    };

    const clearLogs = useCallback(() => {
        setCombatLog([]);
    }, []);

    const handleReset = useCallback(() => {
        setIsBattleRunning(false); setIsSearching(false); stopSearchRef.current = true;
        if (battleInterval.current) clearInterval(battleInterval.current);
        
        const resetTeam = (team: CombatantInstance[]) => team.map(c => {
            if (!c.mercenaryId) return c;
            const derived = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats);
            return { ...c, currentHp: derived ? derived.maxHp : 0, gauge: 0, lastAttacker: false, lastDamaged: false, kills: 0, damageDealt: 0, damageTaken: 0 };
        });
        
        setBattleState(prev => ({ teamA: resetTeam(prev.teamA), teamB: resetTeam(prev.teamB) }));
        setCombatLog([]);
        setSingleMatchReport(null); setBulkReport(null); setLiveStats(null);
        matchStatsRef.current = { A: createInitialStats(), B: createInitialStats(), ticks: 0 };
    }, [getDerivedStats]);

    const runBulkSimulation = () => {
        if (isSearching) return;
        setBulkReport(null);
        const rounds = 10000;
        let winA = 0;
        let totalAtksA = 0, totalAtksB = 0;
        let totalCritsA = 0, totalCritsB = 0;
        let totalEvasionsA = 0, totalEvasionsB = 0;

        const teamAData = battleState.teamA.filter(c => c.mercenaryId).map(c => {
            const d = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)!;
            const merc = state.knownMercenaries.find(m => m.id === c.mercenaryId)!;
            const isMage = d.magicalAttack > d.physicalAttack;
            const baseEff = isMage ? JOB_EFFICIENCY[merc.job].magical : JOB_EFFICIENCY[merc.job].physical;
            return { hp: d.maxHp, spd: d.speed, atk: isMage ? d.magicalAttack : d.physicalAttack, red: isMage ? d.magicalReduction : d.physicalReduction, crt: d.critChance, cdmg: d.critDamage, baseEff };
        });
        const teamBData = battleState.teamB.filter(c => c.mercenaryId).map(c => {
            const d = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)!;
            const merc = state.knownMercenaries.find(m => m.id === c.mercenaryId)!;
            const isMage = d.magicalAttack > d.physicalAttack;
            const baseEff = isMage ? JOB_EFFICIENCY[merc.job].magical : JOB_EFFICIENCY[merc.job].physical;
            return { hp: d.maxHp, spd: d.speed, atk: isMage ? d.magicalAttack : d.physicalAttack, red: isMage ? d.magicalReduction : d.physicalReduction, crt: d.critChance, cdmg: d.critDamage, baseEff };
        });

        if (teamAData.length === 0 || teamBData.length === 0) return;

        for (let i = 0; i < rounds; i++) {
            const hpsA = new Float32Array(teamAData.map(d => d.hp));
            const hpsB = new Float32Array(teamBData.map(d => d.hp));
            const gaugesA = new Float32Array(teamAData.length);
            const gaugesB = new Float32Array(teamBData.length);
            let aliveA = teamAData.length;
            let aliveB = teamBData.length;

            while (aliveA > 0 && aliveB > 0) {
                for (let j = 0; j < teamAData.length; j++) if (hpsA[j] > 0) gaugesA[j] += teamAData[j].spd;
                for (let j = 0; j < teamBData.length; j++) if (hpsB[j] > 0) gaugesB[j] += teamBData[j].spd;

                for (let j = 0; j < teamAData.length; j++) {
                    if (gaugesA[j] >= ACTION_THRESHOLD && hpsA[j] > 0) {
                        gaugesA[j] -= ACTION_THRESHOLD;
                        const targets = [];
                        for(let k=0; k<hpsB.length; k++) if(hpsB[k]>0) targets.push(k);
                        if(targets.length === 0) break;
                        const tIdx = targets[Math.floor(Math.random()*targets.length)];
                        totalAtksA++;
                        const dmg = calculateFastDmg(teamAData[j].atk, teamBData[tIdx].red, teamAData[j].crt, teamAData[j].cdmg, 95, teamAData[j].baseEff); 
                        if(dmg > 0) { hpsB[tIdx] -= dmg; if(hpsB[tIdx] <= 0) aliveB--; } else { totalEvasionsB++; }
                    }
                }
                if (aliveB <= 0) break;
                for (let j = 0; j < teamBData.length; j++) {
                    if (gaugesB[j] >= ACTION_THRESHOLD && hpsB[j] > 0) {
                        gaugesB[j] -= ACTION_THRESHOLD;
                        const targets = [];
                        for(let k=0; k<hpsA.length; k++) if(hpsA[k]>0) targets.push(k);
                        if(targets.length === 0) break;
                        const tIdx = targets[Math.floor(Math.random()*targets.length)];
                        totalAtksB++;
                        const dmg = calculateFastDmg(teamBData[j].atk, teamAData[tIdx].red, teamBData[j].crt, teamBData[j].cdmg, 95, teamBData[j].baseEff);
                        if(dmg > 0) { hpsA[tIdx] -= dmg; if(hpsA[tIdx] <= 0) aliveA--; } else { totalEvasionsA++; }
                    }
                }
            }
            if (aliveA > 0) winA++;
        }
        setBulkReport({ rounds, winA, winB: rounds - winA, avgAtksA: totalAtksA / rounds, avgAtksB: totalAtksB / rounds, avgCritsA: totalCritsA / rounds, avgCritsB: totalCritsB / rounds, avgEvasionsA: totalEvasionsA / rounds, avgEvasionsB: totalEvasionsB / rounds });
    };

    const runAttackCycle = () => {
        if (isBattleRunning) { 
            setIsBattleRunning(false); 
            if (battleInterval.current) clearInterval(battleInterval.current); 
            return; 
        }

        const validA = battleState.teamA.filter(c => c.mercenaryId);
        const validB = battleState.teamB.filter(c => c.mercenaryId);
        if (validA.length === 0 || validB.length === 0) return;

        setSingleMatchReport(null); 
        setBulkReport(null);
        setCombatLog([]); 
        matchStatsRef.current = { A: createInitialStats(), B: createInitialStats(), ticks: 0 };
        setLiveStats({ A: createInitialStats(), B: createInitialStats() });

        setBattleState(prev => {
            const resetTeam = (team: CombatantInstance[]) => team.map(c => {
                if (!c.mercenaryId) return c;
                const derived = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats);
                return { ...c, currentHp: derived ? derived.maxHp : 0, gauge: 0, lastAttacker: false, lastDamaged: false, kills: 0, damageDealt: 0, damageTaken: 0 };
            });
            return { teamA: resetTeam(prev.teamA), teamB: resetTeam(prev.teamB) };
        });

        setIsBattleRunning(true);

        battleInterval.current = setInterval(() => {
            const speedMult = battleSpeedRef.current; 
            matchStatsRef.current.ticks++;

            setBattleState(prev => {
                const nextA = prev.teamA.map(c => {
                    return (c.mercenaryId && c.currentHp > 0) ? { ...c, gauge: c.gauge + (getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)!.speed * 0.1 * speedMult) } : c;
                });
                const nextB = prev.teamB.map(c => {
                    return (c.mercenaryId && c.currentHp > 0) ? { ...c, gauge: c.gauge + (getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)!.speed * 0.1 * speedMult) } : c;
                });

                const executeAttack = (att: CombatantInstance, side: 'A' | 'B') => {
                    const targets = (side === 'A' ? nextB : nextA).filter(c => c.mercenaryId && c.currentHp > 0);
                    if (targets.length === 0) return;
                    const target = targets[Math.floor(Math.random() * targets.length)];
                    const attD = getDerivedStats(att.mercenaryId, att.level, att.allocatedStats)!;
                    const defD = getDerivedStats(target.mercenaryId, target.level, target.allocatedStats)!;
                    const attMerc = state.knownMercenaries.find(m => m.id === att.mercenaryId)!;
                    const stats = side === 'A' ? matchStatsRef.current.A : matchStatsRef.current.B;
                    const enemyStats = side === 'A' ? matchStatsRef.current.B : matchStatsRef.current.A;
                    
                    stats.attacks++;
                    att.gauge -= ACTION_THRESHOLD;
                    att.lastAttacker = true;
                    
                    setTimeout(() => setBattleState(curr => ({ teamA: curr.teamA.map(c => c.instanceId === att.instanceId ? { ...c, lastAttacker: false } : c), teamB: curr.teamB.map(c => c.instanceId === att.instanceId ? { ...c, lastAttacker: false } : c) })), 120);

                    const res = calculateCombatResult(attD, defD, attMerc.job, attD.magicalAttack > attD.physicalAttack ? 'MAGICAL' : 'PHYSICAL');
                    if (res.isHit) {
                        if (res.isCrit) stats.crits++;
                        stats.totalDmg += res.damage;
                        if (res.damage > stats.maxDmg) stats.maxDmg = res.damage;
                        if (stats.minDmg === 0 || res.damage < stats.minDmg) stats.minDmg = res.damage;
                        
                        // Performance Stats
                        att.damageDealt += res.damage;
                        target.damageTaken += res.damage;
                        target.currentHp = Math.max(0, target.currentHp - res.damage);
                        
                        // Kill Logic
                        if (target.currentHp <= 0) {
                            att.kills += 1;
                        }

                        // Trigger Damaged Animation
                        target.lastDamaged = true;
                        setTimeout(() => setBattleState(curr => ({ teamA: curr.teamA.map(c => c.instanceId === target.instanceId ? { ...c, lastDamaged: false } : c), teamB: curr.teamB.map(c => c.instanceId === target.instanceId ? { ...c, lastDamaged: false } : c) })), 200);

                        addLog(`${state.knownMercenaries.find(m=>m.id===att.mercenaryId)!.name} hits for ${res.damage}${res.isCrit ? "!" : ""}`, side, res.isCrit);
                    } else {
                        stats.misses++; enemyStats.evasions++;
                        addLog(`${state.knownMercenaries.find(m=>m.id===att.mercenaryId)!.name} missed!`, side, false, true);
                    }
                };

                nextA.filter(c => c.gauge >= ACTION_THRESHOLD && c.currentHp > 0).forEach(c => executeAttack(c, 'A'));
                nextB.filter(c => c.gauge >= ACTION_THRESHOLD && c.currentHp > 0).forEach(c => executeAttack(c, 'B'));

                const curA = nextA.filter(c => c.mercenaryId && c.currentHp > 0).length;
                const curB = nextB.filter(c => c.mercenaryId && c.currentHp > 0).length;

                setLiveStats({ A: { ...matchStatsRef.current.A }, B: { ...matchStatsRef.current.B } });

                if (curA === 0 || curB === 0) {
                    setIsBattleRunning(false); 
                    if (battleInterval.current) clearInterval(battleInterval.current);
                    setSingleMatchReport({ 
                        winner: curA > 0 ? 'A' : 'B', 
                        durationTicks: matchStatsRef.current.ticks, 
                        statsA: { ...matchStatsRef.current.A }, 
                        statsB: { ...matchStatsRef.current.B }, 
                        analysis: ["Battle Concluded."] 
                    });
                }
                return { teamA: nextA, teamB: nextB };
            });
        }, 40);
    };

    return {
        teamA: battleState.teamA, teamB: battleState.teamB, addSlot, removeSlot, updateSlot,
        combatLog, clearLogs, isBattleRunning, battleSpeed, setBattleSpeed,
        singleMatchReport, liveStats, bulkReport, isSearching,
        handleReset, runBulkSimulation, runAttackCycle, getDerivedStats
    };
};