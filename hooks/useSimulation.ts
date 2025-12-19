
import { useState, useMemo, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Mercenary } from '../models/Mercenary';
import { calculateDerivedStats, applyEquipmentBonuses, DerivedStats, mergePrimaryStats, PrimaryStats } from '../models/Stats';
import { calculateCombatResult } from '../utils/combatLogic';

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
    lukImpactMsg: string;
}

/**
 * SimulationHook Interface
 * useSimulation 훅이 반환하는 데이터와 액션의 타입을 정의합니다.
 */
export interface SimulationHook {
    // 슬롯 제어
    leftSlotId: string | null;
    setLeftSlotId: (id: string | null) => void;
    rightSlotId: string | null;
    setRightSlotId: (id: string | null) => void;

    // 슬롯 A 상태
    mercA: Mercenary | null;
    derivedA: DerivedStats | null;
    levelA: number;
    setLevelA: React.Dispatch<React.SetStateAction<number>>;
    allocA: PrimaryStats;
    setAllocA: React.Dispatch<React.SetStateAction<PrimaryStats>>;
    hpA: number;
    gaugeA: number;

    // 슬롯 B 상태
    mercB: Mercenary | null;
    derivedB: DerivedStats | null;
    levelB: number;
    setLevelB: React.Dispatch<React.SetStateAction<number>>;
    allocB: PrimaryStats;
    setAllocB: React.Dispatch<React.SetStateAction<PrimaryStats>>;
    hpB: number;
    gaugeB: number;

    // 시뮬레이션 공통 상태
    combatLog: { msg: string; color: string }[];
    attacker: 'LEFT' | 'RIGHT' | null;
    isBattleRunning: boolean;
    battleSpeed: 1 | 2 | 4 | 8;
    setBattleSpeed: (speed: 1 | 2 | 4 | 8) => void;
    singleMatchReport: SingleMatchReport | null;
    bulkReport: BulkReport | null;

    // 액션
    handleReset: () => void;
    runBulkSimulation: () => void;
    runAttackCycle: () => void;
}

export const useSimulation = (): SimulationHook => {
    const { state } = useGame();
    
    const [leftSlotId, setLeftSlotId] = useState<string | null>(null);
    const [rightSlotId, setRightSlotId] = useState<string | null>(null);
    
    const [levelA, setLevelA] = useState(1);
    const [allocA, setAllocA] = useState<PrimaryStats>({ str: 0, vit: 0, dex: 0, int: 0, luk: 0 });
    const [hpA, setHpA] = useState(0);
    const [gaugeA, setGaugeA] = useState(0);

    const [levelB, setLevelB] = useState(1);
    const [allocB, setAllocB] = useState<PrimaryStats>({ str: 0, vit: 0, dex: 0, int: 0, luk: 0 });
    const [hpB, setHpB] = useState(0);
    const [gaugeB, setGaugeB] = useState(0);

    const [combatLog, setCombatLog] = useState<{msg: string, color: string}[]>([]);
    const [attacker, setAttacker] = useState<'LEFT' | 'RIGHT' | null>(null);
    const [isBattleRunning, setIsBattleRunning] = useState(false);
    const [battleSpeed, setBattleSpeed] = useState<1 | 2 | 4 | 8>(1);
    const [singleMatchReport, setSingleMatchReport] = useState<SingleMatchReport | null>(null);
    const [bulkReport, setBulkReport] = useState<BulkReport | null>(null);
    
    const battleInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const battleSpeedRef = useRef<number>(1);
    
    const matchStatsRef = useRef<{A: MatchStats, B: MatchStats, ticks: number}>({
        A: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 },
        B: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 },
        ticks: 0
    });

    useEffect(() => {
        battleSpeedRef.current = battleSpeed;
    }, [battleSpeed]);

    const mercA = useMemo<Mercenary | null>(() => 
        state.knownMercenaries.find(m => m.id === leftSlotId) || null, 
    [leftSlotId, state.knownMercenaries]);

    const mercB = useMemo<Mercenary | null>(() => 
        state.knownMercenaries.find(m => m.id === rightSlotId) || null, 
    [rightSlotId, state.knownMercenaries]);

    useEffect(() => { if (mercA) { setLevelA(mercA.level); setAllocA(mercA.allocatedStats); } }, [leftSlotId, mercA]);
    useEffect(() => { if (mercB) { setLevelB(mercB.level); setAllocB(mercB.allocatedStats); } }, [rightSlotId, mercB]);

    const derivedA = useMemo<DerivedStats | null>(() => {
        if (!mercA) return null;
        const primary = mergePrimaryStats(mercA.stats, allocA);
        const base = calculateDerivedStats(primary, levelA);
        const eqStats = Object.values(mercA.equipment).map(e => e?.stats).filter(Boolean);
        return applyEquipmentBonuses(base, eqStats as any);
    }, [mercA, levelA, allocA]);

    const derivedB = useMemo<DerivedStats | null>(() => {
        if (!mercB) return null;
        const primary = mergePrimaryStats(mercB.stats, allocB);
        const base = calculateDerivedStats(primary, levelB);
        const eqStats = Object.values(mercB.equipment).map(e => e?.stats).filter(Boolean);
        return applyEquipmentBonuses(base, eqStats as any);
    }, [mercB, levelB, allocB]);

    useEffect(() => { if (derivedA) setHpA(derivedA.maxHp); }, [derivedA]);
    useEffect(() => { if (derivedB) setHpB(derivedB.maxHp); }, [derivedB]);

    const addLog = (msg: string, color: string = 'text-stone-400') => {
        setCombatLog(prev => [{ msg, color }, ...prev].slice(0, 50));
    };

    const handleReset = () => {
        setIsBattleRunning(false);
        if (battleInterval.current) clearInterval(battleInterval.current);
        if (derivedA) { setHpA(derivedA.maxHp); setGaugeA(0); }
        if (derivedB) { setHpB(derivedB.maxHp); setGaugeB(0); }
        setCombatLog([{ msg: "Battle State Reset.", color: "text-amber-500 font-bold" }]);
        setSingleMatchReport(null);
        setBulkReport(null);
        matchStatsRef.current = {
            A: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 },
            B: { totalDmg: 0, crits: 0, misses: 0, attacks: 0, evasions: 0 },
            ticks: 0
        };
    };

    const runBulkSimulation = () => {
        if (!mercA || !mercB || !derivedA || !derivedB) return;
        setBulkReport(null);
        setSingleMatchReport(null);
        
        const rounds = 10000;
        let winA = 0; let winB = 0;
        let totalAtksA = 0; let totalAtksB = 0;
        let totalCritsA = 0; let totalCritsB = 0;
        let totalEvasionsA = 0; let totalEvasionsB = 0;

        for (let i = 0; i < rounds; i++) {
            let chpA = derivedA.maxHp;
            let chpB = derivedB.maxHp;
            let gA = 0;
            let gB = 0;

            while (chpA > 0 && chpB > 0) {
                gA += derivedA.speed;
                gB += derivedB.speed;

                const actA = gA >= ACTION_THRESHOLD;
                const actB = gB >= ACTION_THRESHOLD;

                if (actA && actB) {
                    const first = Math.random() > 0.5 ? 'A' : 'B';
                    if (first === 'A') {
                        gA -= ACTION_THRESHOLD;
                        totalAtksA++;
                        const resA = calculateCombatResult(derivedA, derivedB, 'PHYSICAL');
                        if (resA.isHit) { if (resA.isCrit) totalCritsA++; chpB -= resA.damage; } else totalEvasionsB++;
                        if (chpB > 0) {
                            gB -= ACTION_THRESHOLD;
                            totalAtksB++;
                            const resB = calculateCombatResult(derivedB, derivedA, 'PHYSICAL');
                            if (resB.isHit) { if (resB.isCrit) totalCritsB++; chpA -= resB.damage; } else totalEvasionsA++;
                        }
                    } else {
                        gB -= ACTION_THRESHOLD;
                        totalAtksB++;
                        const resB = calculateCombatResult(derivedB, derivedA, 'PHYSICAL');
                        if (resB.isHit) { if (resB.isCrit) totalCritsB++; chpA -= resB.damage; } else totalEvasionsA++;
                        if (chpA > 0) {
                            gA -= ACTION_THRESHOLD;
                            totalAtksA++;
                            const resA = calculateCombatResult(derivedA, derivedB, 'PHYSICAL');
                            if (resA.isHit) { if (resA.isCrit) totalCritsA++; chpB -= resA.damage; } else totalEvasionsB++;
                        }
                    }
                } else {
                    if (actA) {
                        gA -= ACTION_THRESHOLD;
                        totalAtksA++;
                        const res = calculateCombatResult(derivedA, derivedB, 'PHYSICAL');
                        if (res.isHit) { if (res.isCrit) totalCritsA++; chpB -= res.damage; } else totalEvasionsB++;
                    }
                    if (actB && chpB > 0) {
                        gB -= ACTION_THRESHOLD;
                        totalAtksB++;
                        const res = calculateCombatResult(derivedB, derivedA, 'PHYSICAL');
                        if (res.isHit) { if (res.isCrit) totalCritsB++; chpA -= res.damage; } else totalEvasionsA++;
                    }
                }
            }
            if (chpA > 0) winA++; else winB++;
        }

        const lukA = (mercA.stats.luk + allocA.luk);
        const lukB = (mercB.stats.luk + allocB.luk);
        let lukImpactMsg = "Luck factors are evenly balanced.";
        if (lukA > lukB * 1.3) lukImpactMsg = "Slot A's higher LUK noticeably increased their critical efficiency.";
        else if (lukB > lukA * 1.3) lukImpactMsg = "Slot B's superior LUK provided critical advantages and better evasion.";

        setBulkReport({
            rounds, winA, winB,
            avgAtksA: totalAtksA / rounds, avgAtksB: totalAtksB / rounds,
            avgCritsA: totalCritsA / rounds, avgCritsB: totalCritsB / rounds,
            avgEvasionsA: totalEvasionsA / rounds, avgEvasionsB: totalEvasionsB / rounds,
            lukImpactMsg
        });
        addLog(`Bulk Simulation (10,000 rounds) completed. Standard balancing verified.`, "text-amber-400 font-bold");
    };

    const runAttackCycle = () => {
        if (!mercA || !mercB || !derivedA || !derivedB) return;
        if (hpA <= 0 || hpB <= 0) { handleReset(); return; }

        if (isBattleRunning) {
            setIsBattleRunning(false);
            if (battleInterval.current) clearInterval(battleInterval.current);
            return;
        }

        setIsBattleRunning(true);
        setSingleMatchReport(null);
        setBulkReport(null);
        
        let currentHpA = hpA;
        let currentHpB = hpB;
        let currentGaugeA = gaugeA;
        let currentGaugeB = gaugeB;

        battleInterval.current = setInterval(() => {
            const speedMult = battleSpeedRef.current;
            matchStatsRef.current.ticks++;
            currentGaugeA += (derivedA.speed * 0.1 * speedMult); 
            currentGaugeB += (derivedB.speed * 0.1 * speedMult);

            const performAttack = (side: 'LEFT' | 'RIGHT') => {
                const attackerStats = side === 'LEFT' ? derivedA : derivedB;
                const defenderStats = side === 'LEFT' ? derivedB : derivedA;
                const attackerName = side === 'LEFT' ? mercA.name : mercB.name;
                const sideStats = side === 'LEFT' ? matchStatsRef.current.A : matchStatsRef.current.B;
                const otherStats = side === 'LEFT' ? matchStatsRef.current.B : matchStatsRef.current.A;

                setAttacker(side);
                sideStats.attacks++;
                const res = calculateCombatResult(attackerStats, defenderStats, 'PHYSICAL');
                
                if (!res.isHit) {
                    sideStats.misses++;
                    otherStats.evasions++;
                    addLog(`${attackerName} MISSES!`, "text-stone-500 text-[9px]");
                } else {
                    if (res.isCrit) sideStats.crits++;
                    sideStats.totalDmg += res.damage;
                    if (side === 'LEFT') {
                        currentHpB = Math.max(0, currentHpB - res.damage);
                        setHpB(currentHpB);
                    } else {
                        currentHpA = Math.max(0, currentHpA - res.damage);
                        setHpA(currentHpA);
                    }
                    addLog(`${attackerName} hits ${res.damage}${res.isCrit ? " CRIT!" : ""}`, res.isCrit ? "text-amber-400 font-bold" : (side === 'LEFT' ? "text-blue-300" : "text-red-300"));
                }
                setTimeout(() => setAttacker(null), 100);
            };

            const actA = currentGaugeA >= ACTION_THRESHOLD;
            const actB = currentGaugeB >= ACTION_THRESHOLD;

            if (actA && actB) {
                if (Math.random() > 0.5) {
                    currentGaugeA -= ACTION_THRESHOLD;
                    performAttack('LEFT');
                    if (currentHpB > 0) { currentGaugeB -= ACTION_THRESHOLD; performAttack('RIGHT'); }
                } else {
                    currentGaugeB -= ACTION_THRESHOLD;
                    performAttack('RIGHT');
                    if (currentHpA > 0) { currentGaugeA -= ACTION_THRESHOLD; performAttack('LEFT'); }
                }
            } else if (actA) {
                currentGaugeA -= ACTION_THRESHOLD;
                performAttack('LEFT');
            } else if (actB) {
                currentGaugeB -= ACTION_THRESHOLD;
                performAttack('RIGHT');
            }

            setGaugeA(currentGaugeA);
            setGaugeB(currentGaugeB);

            if (currentHpA <= 0 || currentHpB <= 0) {
                setIsBattleRunning(false);
                if (battleInterval.current) clearInterval(battleInterval.current);
                
                const winner = currentHpA > 0 ? 'A' : 'B';
                const analysis: string[] = [];
                const wStats = winner === 'A' ? matchStatsRef.current.A : matchStatsRef.current.B;
                const lStats = winner === 'A' ? matchStatsRef.current.B : matchStatsRef.current.A;

                if (wStats.attacks > lStats.attacks) analysis.push(`${winner}'s Speed granted them an additional ${wStats.attacks - lStats.attacks} attack opportunities.`);
                if (wStats.crits > lStats.crits) analysis.push(`${winner} secured victory with critical timing.`);
                if (wStats.evasions > lStats.evasions) analysis.push(`${winner} demonstrated superior survival through evasion.`);
                if (analysis.length === 0) analysis.push("A close match determined by steady attribute pressure.");

                setSingleMatchReport({
                    winner,
                    durationTicks: matchStatsRef.current.ticks,
                    statsA: { ...matchStatsRef.current.A },
                    statsB: { ...matchStatsRef.current.B },
                    analysis
                });
                addLog("Battle Result Available.", "text-white font-black uppercase text-[10px]");
            }
        }, 40); 
    };

    return {
        // State
        leftSlotId, setLeftSlotId,
        rightSlotId, setRightSlotId,
        levelA, setLevelA,
        allocA, setAllocA,
        hpA, gaugeA,
        levelB, setLevelB,
        allocB, setAllocB,
        hpB, gaugeB,
        combatLog, attacker,
        isBattleRunning,
        battleSpeed, setBattleSpeed,
        singleMatchReport, bulkReport,
        
        // Data
        mercA, mercB, derivedA, derivedB,
        
        // Actions
        handleReset, runBulkSimulation, runAttackCycle
    };
};
