import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Sword, Activity, Skull, Zap, LogOut, FastForward, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { Mercenary } from '../../../models/Mercenary';
import { Monster } from '../../../models/Monster';
import { ManualDungeonSession } from '../../../types/game-state';
import { calculateCombatResult } from '../../../utils/combatLogic';
import { calculateDerivedStats, applyEquipmentBonuses, mergePrimaryStats } from '../../../models/Stats';
import { useGame } from '../../../context/GameContext';

const ACTION_THRESHOLD = 1000;

interface CombatLogEntry {
    msg: string;
    team: 'PLAYER' | 'ENEMY' | 'SYSTEM';
    isCrit?: boolean;
}

interface DamagePopup {
    id: number;
    value: number;
    targetId: string;
    isCrit: boolean;
}

interface DungeonCombatViewProps {
    session: ManualDungeonSession;
    party: Mercenary[];
    boss: Monster;
    fleeChance: number;
    onFinish: (win: boolean, finalParty: any[]) => void;
    onFlee: (finalParty: any[]) => void;
}

const DungeonCombatView: React.FC<DungeonCombatViewProps> = ({ party, boss, fleeChance, onFinish, onFlee }) => {
    const [partyState, setPartyState] = useState(party.map(m => {
        const primary = mergePrimaryStats(m.stats, m.allocatedStats);
        const derived = applyEquipmentBonuses(calculateDerivedStats(primary, m.level), (Object.values(m.equipment) as any[]).map(e=>e?.stats).filter(Boolean) as any);
        return { ...m, derived, currentHp: m.currentHp, currentMp: m.currentMp, gauge: 0, lastDamaged: false };
    }));
    
    const [bossState, setBossState] = useState({
        ...boss,
        gauge: 0,
        lastDamaged: false
    });

    const [logs, setLogs] = useState<CombatLogEntry[]>([]);
    const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
    const [isAuto, setIsAuto] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [activeActorId, setActiveActorId] = useState<string | null>(null); 
    const [showLogs, setShowLogs] = useState(false);
    const battleInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const addLog = (msg: string, team: 'PLAYER' | 'ENEMY' | 'SYSTEM', isCrit = false) => {
        setLogs(prev => [{ msg, team, isCrit }, ...prev].slice(0, 50));
    };

    const triggerDamagePopup = (targetId: string, value: number, isCrit: boolean) => {
        const id = Date.now() + Math.random();
        setDamagePopups(prev => [...prev, { id, value, targetId, isCrit }]);
        setTimeout(() => {
            setDamagePopups(prev => prev.filter(p => p.id !== id));
        }, 800);
    };

    const executeAttack = useCallback((attacker: any, target: any, isPlayerAttacker: boolean) => {
        const res = calculateCombatResult(
            isPlayerAttacker ? attacker.derived : attacker.stats,
            isPlayerAttacker ? target.stats : target.derived,
            isPlayerAttacker ? attacker.job : 'Fighter' as any,
            isPlayerAttacker ? (attacker.derived.magicalAttack > attacker.derived.physicalAttack ? 'MAGICAL' : 'PHYSICAL') : 'PHYSICAL'
        );

        if (isPlayerAttacker) {
            setBossState(prev => {
                const next = { ...prev, lastDamaged: res.isHit };
                if (res.isHit) {
                    next.currentHp = Math.max(0, next.currentHp - res.damage);
                    triggerDamagePopup('BOSS', res.damage, res.isCrit);
                }
                setTimeout(() => setBossState(curr => ({ ...curr, lastDamaged: false })), 200);
                return next;
            });
            addLog(`${attacker.name.split(' ')[0]} hit for ${res.damage}${res.isCrit ? "!" : ""}`, 'PLAYER', res.isCrit);
        } else {
            setPartyState(prev => prev.map(p => {
                if (p.id === target.id) {
                    const next = { ...p, lastDamaged: res.isHit };
                    if (res.isHit) {
                        next.currentHp = Math.max(0, next.currentHp - res.damage);
                        triggerDamagePopup(p.id, res.damage, res.isCrit);
                    }
                    next.currentMp = Math.max(0, next.currentMp - 1);
                    setTimeout(() => setPartyState(curr => curr.map(c => c.id === p.id ? { ...c, lastDamaged: false } : c)), 200);
                    return next;
                }
                return p;
            }));
            addLog(`${attacker.name} struck ${target.name.split(' ')[0]} for ${res.damage}`, 'ENEMY');
        }
    }, []);

    const processLoop = useCallback(() => {
        if (isPaused || activeActorId) return;

        setPartyState(prevParty => {
            const nextParty = [...prevParty];
            setBossState(prevBoss => {
                const nextBoss = { ...prevBoss };

                nextParty.forEach(p => { if (p.currentHp > 0) p.gauge += p.derived.speed * 0.5; });
                nextBoss.gauge += nextBoss.stats.speed * 0.5;

                const readyMerc = nextParty.find(p => p.currentHp > 0 && p.gauge >= ACTION_THRESHOLD);
                if (readyMerc) {
                    if (isAuto) {
                        readyMerc.gauge -= ACTION_THRESHOLD;
                        executeAttack(readyMerc, nextBoss, true);
                    } else {
                        setActiveActorId(readyMerc.id);
                    }
                }

                if (nextBoss.gauge >= ACTION_THRESHOLD && nextBoss.currentHp > 0 && !activeActorId) {
                    nextBoss.gauge -= ACTION_THRESHOLD;
                    const targets = nextParty.filter(p => p.currentHp > 0);
                    if (targets.length > 0) {
                        const target = targets[Math.floor(Math.random() * targets.length)];
                        executeAttack(nextBoss, target, false);
                    }
                }

                return nextBoss;
            });
            return nextParty;
        });
    }, [isPaused, isAuto, activeActorId, executeAttack]);

    useEffect(() => {
        battleInterval.current = setInterval(processLoop, 100);
        return () => { if (battleInterval.current) clearInterval(battleInterval.current); };
    }, [processLoop]);

    const handleManualCommand = (type: 'ATTACK' | 'FLEE') => {
        if (!activeActorId) return;
        const actor = partyState.find(p => p.id === activeActorId);
        if (!actor) return;

        if (type === 'ATTACK') {
            setPartyState(prev => prev.map(p => p.id === activeActorId ? { ...p, gauge: p.gauge - ACTION_THRESHOLD } : p));
            executeAttack(actor, bossState, true);
            setActiveActorId(null);
        } else {
            const roll = Math.random() * 100;
            if (roll < fleeChance) {
                onFlee(partyState);
            } else {
                addLog(`${actor.name.split(' ')[0]} failed to find escape route!`, 'SYSTEM');
                setPartyState(prev => prev.map(p => p.id === activeActorId ? { ...p, gauge: p.gauge - ACTION_THRESHOLD } : p));
                setActiveActorId(null);
            }
        }
    };

    useEffect(() => {
        if (bossState.currentHp <= 0) {
            setIsPaused(true);
            setTimeout(() => onFinish(true, partyState), 1000);
        } else if (partyState.every(p => p.currentHp <= 0)) {
            setIsPaused(true);
            setTimeout(() => onFinish(false, partyState), 1000);
        }
    }, [bossState.currentHp, partyState, onFinish]);

    return (
        <div className="fixed inset-0 z-[110] flex flex-col bg-stone-950 animate-in zoom-in-95 duration-500 overflow-hidden">
            <style>{`
                @keyframes damage-float {
                    0% { transform: translateY(0); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateY(-40px); opacity: 0; }
                }
                .animate-damage { animation: damage-float 0.8s ease-out forwards; }
            `}</style>

            {/* Header */}
            <div className="p-3 bg-red-950/20 border-b border-red-900/30 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <Skull className="w-4 h-4 text-red-500" />
                    <h2 className="text-white font-black uppercase text-sm tracking-widest">Combat Phase</h2>
                </div>
                <button 
                    onClick={() => setIsAuto(!isAuto)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border font-black text-[10px] uppercase tracking-widest transition-all ${isAuto ? 'bg-amber-600 border-amber-400 text-white' : 'bg-stone-800 border-stone-600 text-stone-400'}`}
                >
                    {isAuto ? <FastForward className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    {isAuto ? 'AUTO' : 'MANUAL'}
                </button>
            </div>

            <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto no-scrollbar">
                
                {/* Boss Section */}
                <div className="flex flex-col items-center justify-center p-6 bg-stone-900/40 rounded-2xl border border-white/5 relative">
                    <div className={`relative transition-all duration-150 ${bossState.lastDamaged ? 'scale-110 brightness-150' : 'scale-100'}`}>
                        <div className="text-7xl md:text-8xl drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]">{bossState.icon}</div>
                        {damagePopups.filter(p => p.targetId === 'BOSS').map(p => (
                            <div key={p.id} className={`absolute top-0 left-1/2 -translate-x-1/2 font-black text-2xl animate-damage ${p.isCrit ? 'text-amber-400 scale-125' : 'text-red-500'}`}>
                                -{p.value}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 w-full max-w-xs space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-red-100 font-bold uppercase text-xs tracking-tighter">{bossState.name}</span>
                            <span className="font-mono text-[10px] text-red-500 font-bold">{Math.floor(bossState.currentHp)} / {bossState.stats.maxHp}</span>
                        </div>
                        <div className="h-2 bg-stone-950 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(bossState.currentHp/bossState.stats.maxHp)*100}%` }} />
                        </div>
                        <div className="h-1 bg-stone-950 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-amber-500 transition-all duration-100" style={{ width: `${(bossState.gauge/ACTION_THRESHOLD)*100}%` }} />
                        </div>
                    </div>
                </div>

                {/* Ally Party List */}
                <div className="flex flex-col gap-2">
                    {partyState.map(p => {
                        const isActive = activeActorId === p.id;
                        return (
                            <div key={p.id} className={`bg-stone-900 border-2 rounded-xl p-3 flex flex-col gap-2 transition-all ${isActive ? 'border-amber-500 shadow-glow-sm bg-stone-850' : 'border-stone-800'} ${p.currentHp <= 0 ? 'grayscale opacity-40' : ''}`}>
                                <div className="flex gap-3">
                                    <div className="w-12 h-12 bg-stone-800 rounded-lg flex items-center justify-center text-3xl shadow-inner shrink-0 relative">
                                        {p.icon}
                                        {damagePopups.filter(dp => dp.targetId === p.id).map(dp => (
                                            <div key={dp.id} className={`absolute top-0 left-0 right-0 text-center font-black text-lg animate-damage text-red-500`}>
                                                -{dp.value}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="font-black text-stone-100 text-xs uppercase truncate">{p.name}</span>
                                            <span className="font-mono font-black text-red-500 text-[9px]">{Math.floor(p.currentHp)}/{p.derived.maxHp}</span>
                                        </div>
                                        <div className="h-2 bg-stone-950 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(p.currentHp/p.derived.maxHp)*100}%` }} />
                                        </div>
                                        <div className="h-1 bg-stone-950 rounded-full overflow-hidden mt-1 border border-white/5">
                                            <div className="h-full bg-amber-500 transition-all duration-100" style={{ width: `${(p.gauge/ACTION_THRESHOLD)*100}%` }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Inline Manual Controls */}
                                {isActive && (
                                    <div className="flex gap-2 mt-1 animate-in slide-in-from-top-1 duration-200">
                                        <button 
                                            onClick={() => handleManualCommand('ATTACK')}
                                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-black text-[10px] uppercase tracking-widest border-b-2 border-amber-800 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Sword className="w-3 h-3" /> Attack
                                        </button>
                                        <button 
                                            onClick={() => handleManualCommand('FLEE')}
                                            className="flex-1 py-2 bg-stone-700 hover:bg-red-900 text-stone-100 rounded-lg font-black text-[10px] uppercase tracking-widest border-b-2 border-stone-900 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <LogOut className="w-3 h-3" /> Escape
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tactical Logs Toggleable Section */}
            <div className={`bg-stone-900 border-t border-stone-800 transition-all duration-300 flex flex-col ${showLogs ? 'h-48' : 'h-10'}`}>
                <button 
                    onClick={() => setShowLogs(!showLogs)}
                    className="w-full h-10 flex items-center justify-between px-4 text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] bg-stone-950/40 hover:bg-stone-950/60 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Activity className={`w-3 h-3 text-red-500 ${isPaused ? '' : 'animate-pulse'}`} />
                        <span>Tactical Log Feed</span>
                    </div>
                    {showLogs ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
                
                <div className={`flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-stone-950/20 ${showLogs ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {logs.map((log, idx) => (
                        <div key={idx} className={`text-[10px] font-mono px-3 py-1 border-l-2 ${log.team === 'PLAYER' ? 'border-blue-500 text-blue-100' : log.team === 'ENEMY' ? 'border-red-500 text-red-100' : 'border-amber-500 text-amber-100'} ${log.isCrit ? 'bg-amber-900/10 font-bold' : ''}`}>
                            <span className="opacity-30 mr-2 text-[8px]">{new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}</span>
                            {log.msg}
                        </div>
                    ))}
                    {logs.length === 0 && <div className="h-full flex items-center justify-center text-stone-800 italic text-[10px] uppercase tracking-widest opacity-50">Monitoring bio-rhythms...</div>}
                </div>
            </div>
        </div>
    );
};

export default DungeonCombatView;