
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Mercenary } from '../models/Mercenary';
import { calculateDerivedStats, applyEquipmentBonuses, DerivedStats, mergePrimaryStats, PrimaryStats } from '../models/Stats';
import { Equipment } from '../models/Equipment';
import { calculateCombatResult, calculateExpectedDPS } from '../utils/combatLogic';

const ACTION_THRESHOLD = 1000;

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

export interface CounterStrategy {
    name: string;
    stats: PrimaryStats;
    winRate: number;
    description: string;
    focus: 'STR' | 'VIT' | 'DEX' | 'GENERAL';
}

export interface SimulationHook {
    leftSlotId: string | null;
    setLeftSlotId: (id: string | null) => void;
    rightSlotId: string | null;
    setRightSlotId: (id: string | null) => void;
    mercA: Mercenary | null;
    derivedA: DerivedStats | null;
    levelA: number;
    setLevelA: React.Dispatch<React.SetStateAction<number>>;
    allocA: PrimaryStats;
    setAllocA: React.Dispatch<React.SetStateAction<PrimaryStats>>;
    hpA: number;
    gaugeA: number;
    dpsA: number;
    mercB: Mercenary | null;
    derivedB: DerivedStats | null;
    levelB: number;
    setLevelB: React.Dispatch<React.SetStateAction<number>>;
    allocB: PrimaryStats;
    setAllocB: React.Dispatch<React.SetStateAction<PrimaryStats>>;
    hpB: number;
    gaugeB: number;
    dpsB: number;
    combatLog: { msg: string; color: string }[];
    attacker: 'LEFT' | 'RIGHT' | null;
    isBattleRunning: boolean;
    battleSpeed: 1 | 2 | 4 | 8;
    setBattleSpeed: (speed: 1 | 2 | 4 | 8) => void;
    singleMatchReport: SingleMatchReport | null;
    bulkReport: BulkReport | null;
    isSearching: boolean;
    handleReset: () => void;
    runBulkSimulation: () => void;
    runAttackCycle: () => void;
    runCounterBuildSearch: () => void;
}

export const useSimulation = (): SimulationHook => {
    const { state } = useGame();
    const [leftSlotId, setLeftSlotId] = useState<string | null>(null);
    const [rightSlotId, setRightSlotId] = useState<string | null>(null);
    const [levelA, setLevelA] = useState(25);
    const [allocA, setAllocA] = useState<PrimaryStats>({ str: 0, vit: 0, dex: 0, int: 0, luk: 0 });
    const [hpA, setHpA] = useState(0);
    const [gaugeA, setGaugeA] = useState(0);
    const [levelB, setLevelB] = useState(25);
    const [allocB, setAllocB] = useState<PrimaryStats>({ str: 0, vit: 0, dex: 0, int: 0, luk: 0 });
    const [hpB, setHpB] = useState(0);
    const [gaugeB, setGaugeB] = useState(0);
    const [combatLog, setCombatLog] = useState<{msg: string, color: string}[]>([]);
    const [attacker, setAttacker] = useState<'LEFT' | 'RIGHT' | null>(null);
    const [isBattleRunning, setIsBattleRunning] = useState(false);
    const [battleSpeed, setBattleSpeed] = useState<1 | 2 | 4 | 8>(1);
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

    const mercA = useMemo(() => state.knownMercenaries.find(m => m.id === leftSlotId) || null, [leftSlotId, state.knownMercenaries]);
    const mercB = useMemo(() => state.knownMercenaries.find(m => m.id === rightSlotId) || null, [rightSlotId, state.knownMercenaries]);

    useEffect(() => { if (mercA) { setLevelA(mercA.level); setAllocA(mercA.allocatedStats); } }, [leftSlotId, mercA]);
    useEffect(() => { if (mercB) { setLevelB(mercB.level); setAllocB(mercB.allocatedStats); } }, [rightSlotId, mercB]);

    const derivedA = useMemo(() => {
        if (!mercA) return null;
        const primary = mergePrimaryStats(mercA.stats, allocA);
        const base = calculateDerivedStats(primary, levelA);
        /* Fix: Cast Object.values to fix TS errors where it defaults to unknown[] */
        const eqStats = (Object.values(mercA.equipment) as (Equipment | null)[]).map(e => e?.stats).filter(Boolean);
        return applyEquipmentBonuses(base, eqStats as any);
    }, [mercA, levelA, allocA]);

    const dpsA = useMemo(() => derivedA ? calculateExpectedDPS(derivedA, (mercA!.stats.int + allocA.int) > (mercA!.stats.str + allocA.str) ? 'MAGICAL' : 'PHYSICAL') : 0, [derivedA, allocA, mercA]);

    const derivedB = useMemo(() => {
        if (!mercB) return null;
        const primary = mergePrimaryStats(mercB.stats, allocB);
        const base = calculateDerivedStats(primary, levelB);
        /* Fix: Cast Object.values to fix TS errors where it defaults to unknown[] */
        const eqStats = (Object.values(mercB.equipment) as (Equipment | null)[]).map(e => e?.stats).filter(Boolean);
        return applyEquipmentBonuses(base, eqStats as any);
    }, [mercB, levelB, allocB]);

    const dpsB = useMemo(() => derivedB ? calculateExpectedDPS(derivedB, (mercB!.stats.int + allocB.int) > (mercB!.stats.str + allocB.str) ? 'MAGICAL' : 'PHYSICAL') : 0, [derivedB, allocB, mercB]);

    useEffect(() => { if (derivedA) setHpA(derivedA.maxHp); }, [derivedA]);
    useEffect(() => { if (derivedB) setHpB(derivedB.maxHp); }, [derivedB]);

    const addLog = (msg: string, color: string = 'text-stone-400') => {
        setCombatLog(prev => [{ msg, color }, ...prev].slice(0, 100));
    };

    const handleReset = () => {
        setIsBattleRunning(false); setIsSearching(false); stopSearchRef.current = true;
        if (battleInterval.current) clearInterval(battleInterval.current);
        if (derivedA) { setHpA(derivedA.maxHp); setGaugeA(0); }
        if (derivedB) { setHpB(derivedB.maxHp); setGaugeB(0); }
        setCombatLog([{ msg: "Arena Ready.", color: "text-amber-500 font-bold" }]);
        setSingleMatchReport(null); setBulkReport(null);
    };

    const simulateMatch = (attD: DerivedStats, defD: DerivedStats, attP: PrimaryStats, defP: PrimaryStats, rounds = 200): number => {
        let wins = 0;
        const isMageA = attP.int > attP.str;
        const isMageB = defP.int > defP.str;

        for (let r = 0; r < rounds; r++) {
            let chpA = attD.maxHp; let chpB = defD.maxHp; let gA = 0; let gB = 0;
            while (chpA > 0 && chpB > 0) {
                gA += attD.speed; gB += defD.speed;
                if (gA >= ACTION_THRESHOLD && gB >= ACTION_THRESHOLD) {
                    if (Math.random() > 0.5) {
                        gA -= ACTION_THRESHOLD; const rs = calculateCombatResult(attD, defD, isMageA ? 'MAGICAL' : 'PHYSICAL'); if (rs.isHit) chpB -= rs.damage;
                        if (chpB > 0) { gB -= ACTION_THRESHOLD; const rs2 = calculateCombatResult(defD, attD, isMageB ? 'MAGICAL' : 'PHYSICAL'); if (rs2.isHit) chpA -= rs2.damage; }
                    } else {
                        gB -= ACTION_THRESHOLD; const rs = calculateCombatResult(defD, attD, isMageB ? 'MAGICAL' : 'PHYSICAL'); if (rs.isHit) chpA -= rs.damage;
                        if (chpA > 0) { gA -= ACTION_THRESHOLD; const rs2 = calculateCombatResult(attD, defD, isMageA ? 'MAGICAL' : 'PHYSICAL'); if (rs2.isHit) chpB -= rs2.damage; }
                    }
                } else if (gA >= ACTION_THRESHOLD) {
                    gA -= ACTION_THRESHOLD; const rs = calculateCombatResult(attD, defD, isMageA ? 'MAGICAL' : 'PHYSICAL'); if (rs.isHit) chpB -= rs.damage;
                } else if (gB >= ACTION_THRESHOLD) {
                    gB -= ACTION_THRESHOLD; const rs = calculateCombatResult(defD, attD, isMageB ? 'MAGICAL' : 'PHYSICAL'); if (rs.isHit) chpA -= rs.damage;
                }
            }
            if (chpB > 0) wins++;
        }
        return wins / rounds;
    };

    const runBulkSimulation = () => {
        if (!mercA || !mercB || !derivedA || !derivedB) return;
        setBulkReport(null);
        const rounds = 10000;
        const isMageA = (mercA.stats.int + allocA.int) > (mercA.stats.str + allocA.str);
        const isMageB = (mercB.stats.int + allocB.int) > (mercB.stats.str + allocB.str);
        
        let winA = 0; let totalAtksA = 0; let totalAtksB = 0;
        let totalCritsA = 0; let totalCritsB = 0;
        let totalEvasionsA = 0; let totalEvasionsB = 0;
        
        for (let i = 0; i < rounds; i++) {
            let chpA = derivedA.maxHp; let chpB = derivedB.maxHp; let gA = 0; let gB = 0;
            while (chpA > 0 && chpB > 0) {
                gA += derivedA.speed; gB += derivedB.speed;
                if (gA >= ACTION_THRESHOLD && gB >= ACTION_THRESHOLD) {
                    if (Math.random() > 0.5) { gA -= ACTION_THRESHOLD; totalAtksA++; const res = calculateCombatResult(derivedA, derivedB, isMageA ? 'MAGICAL' : 'PHYSICAL'); if (res.isHit) { if (res.isCrit) totalCritsA++; chpB -= res.damage; } else totalEvasionsB++; if (chpB > 0) { gB -= ACTION_THRESHOLD; totalAtksB++; const res2 = calculateCombatResult(derivedB, derivedA, isMageB ? 'MAGICAL' : 'PHYSICAL'); if (res2.isHit) { if (res2.isCrit) totalCritsB++; chpA -= res2.damage; } else totalEvasionsA++; } }
                    else { gB -= ACTION_THRESHOLD; totalAtksB++; const res = calculateCombatResult(derivedB, derivedA, isMageB ? 'MAGICAL' : 'PHYSICAL'); if (res.isHit) { if (res.isCrit) totalCritsB++; chpA -= res.damage; } else totalEvasionsA++; if (chpA > 0) { gA -= ACTION_THRESHOLD; totalAtksA++; const res2 = calculateCombatResult(derivedA, derivedB, isMageA ? 'MAGICAL' : 'PHYSICAL'); if (res2.isHit) { if (res2.isCrit) totalCritsA++; chpB -= res2.damage; } else totalEvasionsB++; } }
                } else if (gA >= ACTION_THRESHOLD) { gA -= ACTION_THRESHOLD; totalAtksA++; const res = calculateCombatResult(derivedA, derivedB, isMageA ? 'MAGICAL' : 'PHYSICAL'); if (res.isHit) { if (res.isCrit) totalCritsA++; chpB -= res.damage; } else totalEvasionsB++; }
                else if (gB >= ACTION_THRESHOLD) { gB -= ACTION_THRESHOLD; totalAtksB++; const res = calculateCombatResult(derivedB, derivedA, isMageB ? 'MAGICAL' : 'PHYSICAL'); if (res.isHit) { if (res.isCrit) totalCritsB++; chpA -= res.damage; } else totalEvasionsA++; }
            }
            if (chpA > 0) winA++;
        }
        setBulkReport({ rounds, winA, winB: rounds - winA, avgAtksA: totalAtksA / rounds, avgAtksB: totalAtksB / rounds, avgCritsA: totalCritsA / rounds, avgCritsB: totalCritsB / rounds, avgEvasionsA: totalEvasionsA / rounds, avgEvasionsB: totalEvasionsB / rounds });
    };

    const runAttackCycle = () => {
        if (!mercA || !mercB || !derivedA || !derivedB) return;
        if (isBattleRunning) { setIsBattleRunning(false); if (battleInterval.current) clearInterval(battleInterval.current); return; }
        setIsBattleRunning(true); setSingleMatchReport(null); setBulkReport(null);
        let curHpA = hpA; let curHpB = hpB; let curGA = gaugeA; let curGB = gaugeB;
        const isMageA = (mercA.stats.int + allocA.int) > (mercA.stats.str + allocA.str);
        const isMageB = (mercB.stats.int + allocB.int) > (mercB.stats.str + allocB.str);

        matchStatsRef.current = { A: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 }, B: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 }, ticks: 0 };
        battleInterval.current = setInterval(() => {
            const speedMult = battleSpeedRef.current; matchStatsRef.current.ticks++;
            curGA += (derivedA.speed * 0.1 * speedMult); curGB += (derivedB.speed * 0.1 * speedMult);
            const attack = (side: 'L' | 'R') => {
                const att = side === 'L' ? derivedA : derivedB; const def = side === 'L' ? derivedB : derivedA;
                const sStats = side === 'L' ? matchStatsRef.current.A : matchStatsRef.current.B; const oStats = side === 'L' ? matchStatsRef.current.B : matchStatsRef.current.A;
                const type = side === 'L' ? (isMageA ? 'MAGICAL' : 'PHYSICAL') : (isMageB ? 'MAGICAL' : 'PHYSICAL');
                setAttacker(side === 'L' ? 'LEFT' : 'RIGHT'); sStats.attacks++;
                const res = calculateCombatResult(att, def, type);
                if (!res.isHit) { sStats.misses++; oStats.evasions++; addLog(`${side === 'L' ? mercA.name : mercB.name} MISSES!`, "text-stone-500 text-[9px]"); }
                else { if (res.isCrit) sStats.crits++; sStats.totalDmg += res.damage; if (side === 'L') { curHpB = Math.max(0, curHpB - res.damage); setHpB(curHpB); } else { curHpA = Math.max(0, curHpA - res.damage); setHpA(curHpA); } addLog(`${side === 'L' ? mercA.name : mercB.name} hits ${res.damage}${res.isCrit ? " CRIT!" : ""}`, res.isCrit ? "text-amber-400 font-bold" : (side === 'L' ? "text-blue-300" : "text-red-300")); }
                setTimeout(() => setAttacker(null), 100);
            };
            if (curGA >= ACTION_THRESHOLD && curGB >= ACTION_THRESHOLD) { if (Math.random() > 0.5) { curGA -= ACTION_THRESHOLD; attack('L'); if (curHpB > 0) { curGB -= ACTION_THRESHOLD; attack('R'); } } else { curGB -= ACTION_THRESHOLD; attack('R'); if (curHpA > 0) { curGA -= ACTION_THRESHOLD; attack('L'); } } }
            else if (curGA >= ACTION_THRESHOLD) { curGA -= ACTION_THRESHOLD; attack('L'); } else if (curGB >= ACTION_THRESHOLD) { curGB -= ACTION_THRESHOLD; attack('R'); }
            setGaugeA(curGA); setGaugeB(curGB);
            if (curHpA <= 0 || curHpB <= 0) { setIsBattleRunning(false); clearInterval(battleInterval.current!); setSingleMatchReport({ winner: curHpA > 0 ? 'A' : 'B', durationTicks: matchStatsRef.current.ticks, statsA: { ...matchStatsRef.current.A }, statsB: { ...matchStatsRef.current.B }, analysis: ["Simulation concluded."] }); }
        }, 40);
    };

    const runCounterBuildSearch = () => {
        if (!mercA || !mercB || isSearching) return;
        handleReset(); setIsSearching(true); stopSearchRef.current = false;
        
        const SIM_LEVEL = levelA;
        const SIM_POINTS = (SIM_LEVEL - 1) * 3;
        const targetPrimary = mergePrimaryStats(mercA.stats, allocA);
        const targetDerived = derivedA!;
        
        const POP_SIZE = 50;
        const GENERATIONS = 40;
        const SEARCH_KEYS = ['str', 'vit', 'dex', 'luk'] as (keyof PrimaryStats)[];

        let population = Array.from({ length: POP_SIZE }, () => {
            const stats = { str: 0, vit: 0, dex: 0, int: 0, luk: 0 };
            for (let i = 0; i < SIM_POINTS; i++) stats[SEARCH_KEYS[Math.floor(Math.random() * SEARCH_KEYS.length)]]++;
            return { stats, fitness: 0 };
        });

        const hallOfFame: Record<string, CounterStrategy> = {
            peak: { name: "Peak Efficiency", stats: { str: 0, vit: 0, dex: 0, int: 0, luk: 0 }, winRate: -1, description: "Highest global winrate.", focus: 'GENERAL' },
            juggernaut: { name: "The Juggernaut", stats: { str: 0, vit: 0, dex: 0, int: 0, luk: 0 }, winRate: -1, description: "High STR. Overpowers target defense.", focus: 'STR' },
            immortal: { name: "The Immortal", stats: { str: 0, vit: 0, dex: 0, int: 0, luk: 0 }, winRate: -1, description: "Max VIT. Wins through attrition.", focus: 'VIT' },
            stalker: { name: "Shadow Stalker", stats: { str: 0, vit: 0, dex: 0, int: 0, luk: 0 }, winRate: -1, description: "Max DEX. High action frequency.", focus: 'DEX' }
        };

        let currentGen = 0;
        addLog(`Initiating Multi-Archetype Counter-Analysis...`, "text-indigo-400 font-bold");

        const runGeneration = () => {
            if (stopSearchRef.current || currentGen >= GENERATIONS) {
                setIsSearching(false);
                addLog(`--- Strategic Counter Options ---`, "text-white font-bold border-t border-stone-700 mt-1 pt-1");
                Object.values(hallOfFame).filter(s => s.winRate > 0.4).forEach(s => {
                    /* Fix: Cast Object.values to fix TS errors where it defaults to unknown[] */
                    const finalD = applyEquipmentBonuses(calculateDerivedStats(mergePrimaryStats(mercB.stats, s.stats), SIM_LEVEL), (Object.values(mercB.equipment) as (Equipment | null)[]).map(e => e?.stats).filter(Boolean) as any);
                    const finalWR = simulateMatch(targetDerived, finalD, targetPrimary, mergePrimaryStats(mercB.stats, s.stats), 1000);
                    const fStr = mercB.stats.str + s.stats.str;
                    const fVit = mercB.stats.vit + s.stats.vit;
                    const fDex = mercB.stats.dex + s.stats.dex;
                    addLog(`${s.name}: S${fStr} V${fVit} D${fDex}`, "text-emerald-400 font-bold text-[11px]");
                    addLog(`> ${(finalWR * 100).toFixed(1)}% WR | ${s.description}`, "text-stone-500 italic text-[9px] mb-1");
                });
                return;
            }

            population.forEach(ind => {
                const combined = mergePrimaryStats(mercB.stats, ind.stats);
                /* Fix: Cast Object.values to fix TS errors where it defaults to unknown[] */
                const dStats = applyEquipmentBonuses(calculateDerivedStats(combined, SIM_LEVEL), (Object.values(mercB.equipment) as (Equipment | null)[]).map(e => e?.stats).filter(Boolean) as any);
                ind.fitness = simulateMatch(targetDerived, dStats, targetPrimary, combined, 150);
                if (ind.fitness > 0.5) {
                    if (ind.fitness > hallOfFame.peak.winRate) { hallOfFame.peak.winRate = ind.fitness; hallOfFame.peak.stats = { ...ind.stats }; }
                    if (ind.stats.str > hallOfFame.juggernaut.stats.str) { hallOfFame.juggernaut.winRate = ind.fitness; hallOfFame.juggernaut.stats = { ...ind.stats }; }
                    if (ind.stats.vit > hallOfFame.immortal.stats.vit) { hallOfFame.immortal.winRate = ind.fitness; hallOfFame.immortal.stats = { ...ind.stats }; }
                    if (ind.stats.dex > hallOfFame.stalker.stats.dex) { hallOfFame.stalker.winRate = ind.fitness; hallOfFame.stalker.stats = { ...ind.stats }; }
                }
            });

            population.sort((a, b) => b.fitness - a.fitness);
            if (currentGen % 10 === 0) addLog(`Scanning Gen ${currentGen}...`, "text-stone-600 text-[9px] italic");
            const newPop = population.slice(0, 8);
            while (newPop.length < POP_SIZE) {
                const p1 = population[Math.floor(Math.random() * 12)];
                const p2 = population[Math.floor(Math.random() * 12)];
                const childStats = { str: 0, vit: 0, dex: 0, int: 0, luk: 0 };
                SEARCH_KEYS.forEach(k => { childStats[k] = Math.random() > 0.5 ? p1.stats[k] : p2.stats[k]; });
                let total = SEARCH_KEYS.reduce((a, k) => a + childStats[k], 0);
                while (total !== SIM_POINTS) {
                    const k = SEARCH_KEYS[Math.floor(Math.random() * SEARCH_KEYS.length)];
                    if (total < SIM_POINTS) { childStats[k]++; total++; }
                    else if (childStats[k] > 0) { childStats[k]--; total--; }
                }
                newPop.push({ stats: childStats, fitness: 0 });
            }
            population = newPop;
            currentGen++;
            setTimeout(runGeneration, 10);
        };
        runGeneration();
    };

    return {
        leftSlotId, setLeftSlotId, rightSlotId, setRightSlotId,
        levelA, setLevelA, allocA, setAllocA, hpA, gaugeA, dpsA,
        levelB, setLevelB, allocB, setAllocB, hpB, gaugeB, dpsB,
        combatLog, attacker, isBattleRunning, battleSpeed, setBattleSpeed,
        singleMatchReport, bulkReport, isSearching,
        mercA, mercB, derivedA, derivedB,
        handleReset, runBulkSimulation, runAttackCycle, runCounterBuildSearch
    };
};
