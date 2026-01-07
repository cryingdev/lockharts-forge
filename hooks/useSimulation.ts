
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Mercenary } from '../models/Mercenary';
import { calculateDerivedStats, applyEquipmentBonuses, DerivedStats, mergePrimaryStats, PrimaryStats } from '../models/Stats';
import { Equipment } from '../models/Equipment';
import { calculateCombatResult, calculateExpectedDPS } from '../utils/combatLogic';

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
    runCounterBuildSearch: () => void;
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
    const [teamA, setTeamA] = useState<CombatantInstance[]>([createEmptyCombatant()]);
    const [teamB, setTeamB] = useState<CombatantInstance[]>([createEmptyCombatant()]);
    
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

    useEffect(() => { battleSpeedRef.current = battleSpeed; }, [battleSpeed]);

    const getDerivedStats = (mercId: string | null, level: number, alloc: PrimaryStats) => {
        const merc = state.knownMercenaries.find(m => m.id === mercId);
        if (!merc) return null;
        const primary = mergePrimaryStats(merc.stats, alloc);
        const base = calculateDerivedStats(primary, level);
        const eqStats = (Object.values(merc.equipment) as (Equipment | null)[]).map(e => e?.stats).filter(Boolean);
        return applyEquipmentBonuses(base, eqStats as any);
    };

    // 장비 변경 시 DPS 자동 동기화
    useEffect(() => {
        if (isBattleRunning) return;

        const refreshTeam = (team: CombatantInstance[]) => team.map(c => {
            if (!c.mercenaryId) return c;
            const derived = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats);
            if (!derived) return c;
            // 더 높은 공격력 타입을 자동으로 선택
            const isMage = derived.magicalAttack > derived.physicalAttack;
            return {
                ...c,
                dps: calculateExpectedDPS(derived, isMage ? 'MAGICAL' : 'PHYSICAL')
            };
        });

        setTeamA(prev => refreshTeam(prev));
        setTeamB(prev => refreshTeam(prev));
    }, [state.knownMercenaries]);

    const addSlot = (side: 'A' | 'B') => {
        const setter = side === 'A' ? setTeamA : setTeamB;
        setter(prev => prev.length < MAX_SQUAD_SIZE ? [...prev, createEmptyCombatant()] : prev);
    };

    const removeSlot = (side: 'A' | 'B', instanceId: string) => {
        const setter = side === 'A' ? setTeamA : setTeamB;
        // 최소 슬롯 개수 제한을 제거하여 모든 슬롯이 삭제 가능하도록 수정
        setter(prev => prev.filter(i => i.instanceId !== instanceId));
    };

    const updateSlot = (side: 'A' | 'B', instanceId: string, data: Partial<CombatantInstance>) => {
        const setter = side === 'A' ? setTeamA : setTeamB;
        setter(prev => prev.map(item => {
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
                    // 업데이트 시점에도 더 높은 수치를 기준으로 DPS 측정
                    const isMage = derived.magicalAttack > derived.physicalAttack;
                    updated.dps = calculateExpectedDPS(derived, isMage ? 'MAGICAL' : 'PHYSICAL');
                }
            }
            return updated;
        }));
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
        
        setTeamA(resetTeam);
        setTeamB(resetTeam);
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

        const teamAData = teamA.filter(c => c.mercenaryId).map(c => {
            const derived = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)!;
            return {
                derived,
                isMage: derived.magicalAttack > derived.physicalAttack
            };
        });
        const teamBData = teamB.filter(c => c.mercenaryId).map(c => {
            const derived = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)!;
            return {
                derived,
                isMage: derived.magicalAttack > derived.physicalAttack
            };
        });

        if (teamAData.length === 0 || teamBData.length === 0) return;

        for (let i = 0; i < rounds; i++) {
            let hpsA = teamAData.map(d => d.derived.maxHp);
            let hpsB = teamBData.map(d => d.derived.maxHp);
            let gaugesA = teamAData.map(() => 0);
            let gaugesB = teamBData.map(() => 0);

            while (hpsA.some(h => h > 0) && hpsB.some(h => h > 0)) {
                teamAData.forEach((d, idx) => { if (hpsA[idx] > 0) gaugesA[idx] += d.derived.speed; });
                teamBData.forEach((d, idx) => { if (hpsB[idx] > 0) gaugesB[idx] += d.derived.speed; });

                const processTurn = (side: 'A' | 'B', idx: number) => {
                    const attackerData = side === 'A' ? teamAData[idx] : teamBData[idx];
                    const enemyHps = side === 'A' ? hpsB : hpsA;
                    const enemyTeam = side === 'A' ? teamBData : teamAData;
                    
                    const livingEnemies = enemyHps.map((h, i) => h > 0 ? i : -1).filter(i => i !== -1);
                    if (livingEnemies.length === 0) return;

                    const targetIdx = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
                    const targetData = enemyTeam[targetIdx];
                    
                    if (side === 'A') totalAtksA++; else totalAtksB++;
                    
                    const res = calculateCombatResult(attackerData.derived, targetData.derived, attackerData.isMage ? 'MAGICAL' : 'PHYSICAL');
                    if (res.isHit) {
                        if (res.isCrit) { if (side === 'A') totalCritsA++; else totalCritsB++; }
                        enemyHps[targetIdx] = Math.max(0, enemyHps[targetIdx] - res.damage);
                    } else {
                        if (side === 'A') totalEvasionsB++; else totalEvasionsA++;
                    }
                };

                const readyA = gaugesA.map((g, i) => g >= ACTION_THRESHOLD ? i : -1).filter(i => i !== -1);
                const readyB = gaugesB.map((g, i) => g >= ACTION_THRESHOLD ? i : -1).filter(i => i !== -1);

                if (readyA.length > 0 || readyB.length > 0) {
                    readyA.forEach(idx => { gaugesA[idx] -= ACTION_THRESHOLD; processTurn('A', idx); });
                    readyB.forEach(idx => { gaugesB[idx] -= ACTION_THRESHOLD; processTurn('B', idx); });
                }
            }
            if (hpsA.some(h => h > 0)) winA++;
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
        
        const validA = teamA.filter(c => c.mercenaryId);
        const validB = teamB.filter(c => c.mercenaryId);
        if (validA.length === 0 || validB.length === 0) return;

        setIsBattleRunning(true); setSingleMatchReport(null); setBulkReport(null);
        matchStatsRef.current = { A: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 }, B: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 }, ticks: 0 };

        battleInterval.current = setInterval(() => {
            const speedMult = battleSpeedRef.current; 
            matchStatsRef.current.ticks++;

            setTeamA(prevA => {
                const nextA = prevA.map(c => {
                    if (c.mercenaryId && c.currentHp > 0) {
                        const derived = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats);
                        return { ...c, gauge: c.gauge + (derived!.speed * 0.1 * speedMult) };
                    }
                    return c;
                });

                setTeamB(prevB => {
                    const nextB = prevB.map(c => {
                        if (c.mercenaryId && c.currentHp > 0) {
                            const derived = getDerivedStats(c.mercenaryId, c.level, c.allocatedStats);
                            return { ...c, gauge: c.gauge + (derived!.speed * 0.1 * speedMult) };
                        }
                        return c;
                    });

                    const readyA = nextA.filter(c => c.gauge >= ACTION_THRESHOLD && c.currentHp > 0);
                    const readyB = nextB.filter(c => c.gauge >= ACTION_THRESHOLD && c.currentHp > 0);

                    const executeAttack = (att: CombatantInstance, side: 'A' | 'B', currentTeamA: CombatantInstance[], currentTeamB: CombatantInstance[]) => {
                        const targetSide = (side === 'A' ? currentTeamB : currentTeamA);
                        const targets = targetSide.filter(c => c.mercenaryId && c.currentHp > 0);
                        if (targets.length === 0) return;

                        const target = targets[Math.floor(Math.random() * targets.length)];
                        const attDerived = getDerivedStats(att.mercenaryId, att.level, att.allocatedStats)!;
                        const defDerived = getDerivedStats(target.mercenaryId, target.level, target.allocatedStats)!;
                        const merc = state.knownMercenaries.find(m => m.id === att.mercenaryId)!;
                        
                        // 물리/마법 중 더 높은 공격력을 자동 선택
                        const isMage = attDerived.magicalAttack > attDerived.physicalAttack;
                        
                        const stats = side === 'A' ? matchStatsRef.current.A : matchStatsRef.current.B;
                        const enemyStats = side === 'A' ? matchStatsRef.current.B : matchStatsRef.current.A;
                        
                        stats.attacks++;
                        att.gauge -= ACTION_THRESHOLD;
                        att.lastAttacker = true;
                        
                        setTimeout(() => {
                            setTeamA(curr => curr.map(c => c.instanceId === att.instanceId ? { ...c, lastAttacker: false } : c));
                            setTeamB(curr => curr.map(c => c.instanceId === att.instanceId ? { ...c, lastAttacker: false } : c));
                        }, 100);

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

                    readyA.forEach(c => executeAttack(c, 'A', nextA, nextB));
                    readyB.forEach(c => executeAttack(c, 'B', nextA, nextB));

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
                            analysis: ["Battle concluded. Team " + (currentAliveA > 0 ? "A" : "B") + " standing."] 
                        });
                    }

                    return [...nextB];
                });
                return [...nextA];
            });
        }, 40);
    };

    const runCounterBuildSearch = () => {
        if (!teamA[0].mercenaryId || !teamB[0].mercenaryId || isSearching) return;
        handleReset(); setIsSearching(true); stopSearchRef.current = false;
        
        const SIM_LEVEL = teamA[0].level;
        const SIM_POINTS = (SIM_LEVEL - 1) * 3;
        const targetD = getDerivedStats(teamA[0].mercenaryId, teamA[0].level, teamA[0].allocatedStats)!;
        
        const POP_SIZE = 50;
        const GENERATIONS = 30;
        const SEARCH_KEYS = ['str', 'vit', 'dex', 'luk'] as (keyof PrimaryStats)[];

        let population = Array.from({ length: POP_SIZE }, () => {
            const stats = { str: 0, vit: 0, dex: 0, int: 0, luk: 0 };
            for (let i = 0; i < SIM_POINTS; i++) stats[SEARCH_KEYS[Math.floor(Math.random() * SEARCH_KEYS.length)]]++;
            return { stats, fitness: 0 };
        });

        let currentGen = 0;
        addLog(`Analyzing Squad Slot 1 vulnerability...`, "text-indigo-400 font-bold");

        const runGeneration = () => {
            if (stopSearchRef.current || currentGen >= GENERATIONS) {
                setIsSearching(false);
                addLog(`Strategic scan complete.`, "text-white font-bold border-t border-stone-700 mt-1 pt-1");
                return;
            }

            population.forEach(ind => {
                const mercB = state.knownMercenaries.find(m => m.id === teamB[0].mercenaryId)!;
                const combined = mergePrimaryStats(mercB.stats, ind.stats);
                const dStats = applyEquipmentBonuses(calculateDerivedStats(combined, SIM_LEVEL), (Object.values(mercB.equipment) as (Equipment | null)[]).map(e => e?.stats).filter(Boolean) as any);
                
                let wins = 0;
                for(let r=0; r<100; r++){
                    let hA = targetD.maxHp, hB = dStats.maxHp, gA=0, gB=0;
                    while(hA>0 && hB>0){
                        gA += targetD.speed; gB += dStats.speed;
                        const isMageB = dStats.magicalAttack > dStats.physicalAttack;
                        const isMageA = targetD.magicalAttack > targetD.physicalAttack;
                        if(gB >= 1000) { gB-=1000; const res=calculateCombatResult(dStats, targetD, isMageB ? 'MAGICAL' : 'PHYSICAL'); if(res.isHit) hA-=res.damage; }
                        if(hA<=0) break;
                        if(gA >= 1000) { gA-=1000; const res=calculateCombatResult(targetD, dStats, isMageA ? 'MAGICAL' : 'PHYSICAL'); if(res.isHit) hB-=res.damage; }
                    }
                    if(hB > 0) wins++;
                }
                ind.fitness = wins / 100;
            });

            population.sort((a, b) => b.fitness - a.fitness);
            const newPop = population.slice(0, 10);
            while (newPop.length < POP_SIZE) {
                const stats = { str: 0, vit: 0, dex: 0, int: 0, luk: 0 };
                for (let i = 0; i < SIM_POINTS; i++) stats[SEARCH_KEYS[Math.floor(Math.random() * SEARCH_KEYS.length)]]++;
                newPop.push({ stats, fitness: 0 });
            }
            population = newPop;
            currentGen++;
            setTimeout(runGeneration, 10);
        };
        runGeneration();
    };

    return {
        teamA, teamB, addSlot, removeSlot, updateSlot,
        combatLog, isBattleRunning, battleSpeed, setBattleSpeed,
        singleMatchReport, bulkReport, isSearching,
        handleReset, runBulkSimulation, runAttackCycle, runCounterBuildSearch,
        getDerivedStats
    };
};
