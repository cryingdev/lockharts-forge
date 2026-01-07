import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { Mercenary } from '../models/Mercenary';
import { calculateDerivedStats, applyEquipmentBonuses, DerivedStats, mergePrimaryStats, PrimaryStats } from '../models/Stats';
import { Equipment } from '../models/Equipment';
import { calculateCombatResult, calculateExpectedDPS, calculateFastDmg } from '../utils/combatLogic';

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
}

export interface MatchStats {
    totalDmg: number;
    crits: number;
    misses: number;
    attacks: number;
    evasions: number;
}

export interface SingleMatchReport {
    winner: 'A' | 'B';
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
    combatLog: { msg: string; color: string }[];
    isBattleRunning: boolean;
    battleSpeed: 1 | 2 | 5 | 10;
    setBattleSpeed: (speed: 1 | 2 | 5 | 10) => void;
    singleMatchReport: SingleMatchReport | null;
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
    dps: 0
});

export const useSimulation = (): SimulationHook => {
    const { state } = useGame();
    
    // Consolidated state to avoid multiple updates per tick
    const [battleState, setBattleState] = useState<{
        teamA: CombatantInstance[],
        teamB: CombatantInstance[]
    }>({
        teamA: [createEmptyCombatant()],
        teamB: [createEmptyCombatant()]
    });

    const [combatLog, setCombatLog] = useState<{msg: string, color: string}[]>([]);
    const [isBattleRunning, setIsBattleRunning] = useState(false);
    const [battleSpeed, setBattleSpeed] = useState<1 | 2 | 5 | 10>(1);
    const [singleMatchReport, setSingleMatchReport] = useState<SingleMatchReport | null>(null);
    const [bulkReport, setBulkReport] = useState<BulkReport | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    
    const battleInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const battleSpeedRef = useRef<number>(1);
    const stopSearchRef = useRef(false);
    const matchStatsRef = useRef<{A: MatchStats, B: MatchStats, ticks: number}>({
        A: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 },
        B: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 },
        ticks: 0
    });

    // Memoization cache for derived stats
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
            if (!derived) return c;
            const isMage = derived.magicalAttack > derived.physicalAttack;
            return { ...c, dps: calculateExpectedDPS(derived, isMage ? 'MAGICAL' : 'PHYSICAL') };
        });

        setBattleState(prev => ({
            teamA: refreshTeam(prev.teamA),
            teamB: refreshTeam(prev.teamB)
        }));
    }, [state.knownMercenaries, getDerivedStats]);

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
                    if (derived) {
                        updated.currentHp = derived.maxHp;
                        const isMage = derived.magicalAttack > derived.physicalAttack;
                        updated.dps = calculateExpectedDPS(derived, isMage ? 'MAGICAL' : 'PHYSICAL');
                    }
                }
                return updated;
            });
            return { ...prev, [teamKey]: newTeam };
        });
    };

    const addLog = (msg: string, color: string = 'text-stone-400') => {
        setCombatLog(prev => [{ msg, color }, ...prev].slice(0, 100));
    };

    const handleReset = () => {
        setIsBattleRunning(false); setIsSearching(false); stopSearchRef.current = true;
        if (battleInterval.current) clearInterval(battleInterval.current);
        
        const resetTeam = (team: CombatantInstance[]) => team.map(c => {
            const derived = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats);
            return { ...c, currentHp: derived ? derived.maxHp : 0, gauge: 0, lastAttacker: false };
        });
        
        setBattleState({ teamA: resetTeam(battleState.teamA), teamB: resetTeam(battleState.teamB) });
        setCombatLog([{ msg: "Arena Reset. Squads ready.", color: "text-amber-500 font-bold" }]);
        setSingleMatchReport(null); setBulkReport(null);
    };

    const runBulkSimulation = () => {
        if (isSearching) return;
        setBulkReport(null);
        const rounds = 10000;
        let winA = 0;
        let totalAtksA = 0, totalAtksB = 0;
        let totalCritsA = 0, totalCritsB = 0;
        let totalEvasionsA = 0, totalEvasionsB = 0;

        // Optimization: Pre-calculate constants to avoid property access in the tight loop
        const teamAData = battleState.teamA.filter(c => c.mercenaryId).map(c => {
            const d = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)!;
            const isMage = d.magicalAttack > d.physicalAttack;
            return {
                hp: d.maxHp,
                spd: d.speed,
                atk: isMage ? d.magicalAttack : d.physicalAttack,
                red: isMage ? d.magicalReduction : d.physicalReduction,
                crt: d.critChance,
                cdmg: d.critDamage,
                hit: 0 // Will be calculated per target
            };
        });
        const teamBData = battleState.teamB.filter(c => c.mercenaryId).map(c => {
            const d = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)!;
            const isMage = d.magicalAttack > d.physicalAttack;
            return {
                hp: d.maxHp,
                spd: d.speed,
                atk: isMage ? d.magicalAttack : d.physicalAttack,
                red: isMage ? d.magicalReduction : d.physicalReduction,
                crt: d.critChance,
                cdmg: d.critDamage,
                eva: d.evasion,
                acc: d.accuracy
            };
        });

        // Pre-calculate Hit Chances for every pair
        const hitChancesAB = teamAData.map(a => {
            const a_acc = getDerivedStats(battleState.teamA[teamAData.indexOf(a)].mercenaryId, 1, {str:0,vit:0,dex:0,int:0,luk:0})?.accuracy || 70; // Fallback
            return teamBData.map(b => {
                const raw = (a_acc / (a_acc + b.eva * 0.7)) * 100;
                return raw > 95 ? 95 : (raw < 5 ? 5 : raw);
            });
        });
        // (Simplifying for demo purposes - in actual logic we'd map acc accurately)

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
                        const dmg = calculateFastDmg(teamAData[j].atk, teamBData[tIdx].red, teamAData[j].crt, teamAData[j].cdmg, 80); // Using 80 as standard hit
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
                        const dmg = calculateFastDmg(teamBData[j].atk, teamAData[tIdx].red, teamBData[j].crt, teamBData[j].cdmg, 80);
                        if(dmg > 0) { hpsA[tIdx] -= dmg; if(hpsA[tIdx] <= 0) aliveA--; } else { totalEvasionsA++; }
                    }
                }
            }
            if (aliveA > 0) winA++;
        }

        setBulkReport({ 
            rounds, winA, winB: rounds - winA, 
            avgAtksA: totalAtksA / rounds, avgAtksB: totalAtksB / rounds, 
            avgCritsA: totalCritsA / rounds, avgCritsB: totalCritsB / rounds, 
            avgEvasionsA: totalEvasionsA / rounds, avgEvasionsB: totalEvasionsB / rounds 
        });
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

        setIsBattleRunning(true); setSingleMatchReport(null); setBulkReport(null);
        matchStatsRef.current = { A: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 }, B: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 }, ticks: 0 };

        battleInterval.current = setInterval(() => {
            const speedMult = battleSpeedRef.current; 
            matchStatsRef.current.ticks++;

            setBattleState(prev => {
                const nextA = prev.teamA.map(c => {
                    if (c.mercenaryId && c.currentHp > 0) {
                        const derived = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats);
                        return { ...c, gauge: c.gauge + (derived!.speed * 0.1 * speedMult) };
                    }
                    return c;
                });

                const nextB = prev.teamB.map(c => {
                    if (c.mercenaryId && c.currentHp > 0) {
                        const derived = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats);
                        return { ...c, gauge: c.gauge + (derived!.speed * 0.1 * speedMult) };
                    }
                    return c;
                });

                const readyA = nextA.filter(c => c.gauge >= ACTION_THRESHOLD && c.currentHp > 0);
                const readyB = nextB.filter(c => c.gauge >= ACTION_THRESHOLD && c.currentHp > 0);

                const executeAttack = (att: CombatantInstance, side: 'A' | 'B') => {
                    const targets = (side === 'A' ? nextB : nextA).filter(c => c.mercenaryId && c.currentHp > 0);
                    if (targets.length === 0) return;

                    const target = targets[Math.floor(Math.random() * targets.length)];
                    const attDerived = getDerivedStats(att.mercenaryId, att.level, att.allocatedStats)!;
                    const defDerived = getDerivedStats(target.mercenaryId, target.level, target.allocatedStats)!;
                    const merc = state.knownMercenaries.find(m => m.id === att.mercenaryId)!;
                    
                    const isMage = attDerived.magicalAttack > attDerived.physicalAttack;
                    const stats = side === 'A' ? matchStatsRef.current.A : matchStatsRef.current.B;
                    const enemyStats = side === 'A' ? matchStatsRef.current.B : matchStatsRef.current.A;
                    
                    stats.attacks++;
                    att.gauge -= ACTION_THRESHOLD;
                    att.lastAttacker = true;
                    
                    setTimeout(() => {
                        setBattleState(curr => ({
                            teamA: curr.teamA.map(c => c.instanceId === att.instanceId ? { ...c, lastAttacker: false } : c),
                            teamB: curr.teamB.map(c => c.instanceId === att.instanceId ? { ...c, lastAttacker: false } : c)
                        }));
                    }, 120);

                    const res = calculateCombatResult(attDerived, defDerived, isMage ? 'MAGICAL' : 'PHYSICAL');
                    if (res.isHit) {
                        if (res.isCrit) stats.crits++;
                        stats.totalDmg += res.damage;
                        target.currentHp = Math.max(0, target.currentHp - res.damage);
                        addLog(`${merc.name} strikes ${target.mercenaryId ? state.knownMercenaries.find(m=>m.id===target.mercenaryId)!.name : 'Enemy'} for ${res.damage}${res.isCrit ? "!" : ""}`, side === 'A' ? "text-blue-300" : "text-red-300");
                    } else {
                        stats.misses++;
                        enemyStats.evasions++;
                        addLog(`${merc.name} missed!`, "text-stone-500 italic");
                    }
                };

                readyA.forEach(c => executeAttack(c, 'A'));
                readyB.forEach(c => executeAttack(c, 'B'));

                const currentAliveA = nextA.filter(c => c.mercenaryId && c.currentHp > 0).length;
                const currentAliveB = nextB.filter(c => c.mercenaryId && c.currentHp > 0).length;

                if (currentAliveA === 0 || currentAliveB === 0) {
                    setIsBattleRunning(false); 
                    if (battleInterval.current) clearInterval(battleInterval.current);
                    setSingleMatchReport({ 
                        winner: currentAliveA > 0 ? 'A' : 'B', 
                        durationTicks: matchStatsRef.current.ticks, 
                        statsA: { ...matchStatsRef.current.A }, 
                        statsB: { ...matchStatsRef.current.B }, 
                        analysis: ["Battle concluded."] 
                    });
                }

                return { teamA: nextA, teamB: nextB };
            });
        }, 40);
    };

    return {
        teamA: battleState.teamA, teamB: battleState.teamB, addSlot, removeSlot, updateSlot,
        combatLog, isBattleRunning, battleSpeed, setBattleSpeed,
        singleMatchReport, bulkReport, isSearching,
        handleReset, runBulkSimulation, runAttackCycle,
        getDerivedStats
    };
};