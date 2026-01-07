import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import { useSimulation, CombatantInstance, MatchStats } from '../../../hooks/useSimulation';
import { Mercenary } from '../../../models/Mercenary';
import { Equipment } from '../../../models/Equipment';
import { DerivedStats, PrimaryStats } from '../../../models/Stats';
import { Sword, Shield, Activity, User, Play, RefreshCw, ScrollText, Crosshair, Target, Wind, FastForward, Brain, X, ChevronUp, ChevronDown, Package, Plus, Trash2, Trophy, Loader2, Zap, Crown, Skull } from 'lucide-react';
import { getAssetUrl } from '../../../utils';

const ACTION_THRESHOLD = 1000;

const HoldButton = ({ onAction, disabled, className, children }: React.PropsWithChildren<{ onAction: () => void, disabled?: boolean, className?: string }>) => {
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        if ('preventDefault' in e) e.preventDefault();
        onAction();
        delayRef.current = setTimeout(() => { timerRef.current = setInterval(() => { onAction(); }, 50); }, 300);
    }, [onAction, disabled]);
    const stop = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current); if (delayRef.current) clearTimeout(delayRef.current); }, []);
    return <button onMouseDown={start} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchEnd={stop} disabled={disabled} className={className}>{children}</button>;
};

const StatBox = ({ label, value, icon, color = "text-stone-400" }: { label: string, value: number | string, icon: React.ReactNode, color?: string }) => (
    <div className="bg-stone-800/30 border border-stone-800/40 p-0.5 md:p-1 rounded flex items-center justify-between min-w-0">
        <span className={`text-[6px] md:text-[8px] font-black uppercase flex items-center gap-0.5 ${color} truncate mr-1`}>{icon} <span className="hidden xs:inline">{label}</span></span>
        <span className="font-mono text-[8px] md:text-[10px] font-bold text-stone-200 shrink-0">{value}</span>
    </div>
);

const getArchetype = (derived: DerivedStats) => {
    if (derived.magicalAttack > derived.physicalAttack * 1.5) return { label: 'Sage', color: 'bg-blue-600', icon: <Brain className="w-2 h-2 md:w-2.5 md:h-2.5"/> };
    if (derived.physicalAttack > derived.magicalAttack * 1.5) return { label: 'Slayer', color: 'bg-orange-600', icon: <Sword className="w-2 h-2 md:w-2.5 md:h-2.5"/> };
    if (derived.physicalDefense > 100) return { label: 'Bulwark', color: 'bg-red-700', icon: <Shield className="w-2 h-2 md:w-2.5 md:h-2.5"/> };
    if (derived.speed > 180) return { label: 'Wind-walker', color: 'bg-emerald-600', icon: <Wind className="w-2 h-2 md:w-2.5 md:h-2.5"/> };
    return { label: 'Elite', color: 'bg-stone-600', icon: <Activity className="w-2 h-2 md:w-2.5 md:h-2.5"/> };
};

interface CombatantSlotProps {
    combatant: CombatantInstance;
    mercenary: Mercenary | null;
    derived: DerivedStats | null;
    onSelect: () => void;
    onUpdate: (data: Partial<CombatantInstance>) => void;
    onRemove: () => void;
    disabled?: boolean;
    isWinner?: boolean;
    isMvp?: boolean;
}

const CombatantSlot: React.FC<CombatantSlotProps> = ({ 
    combatant, mercenary, derived, onSelect, onUpdate, onRemove, disabled, isWinner, isMvp 
}) => {
    const hpPercent = derived ? (combatant.currentHp / derived.maxHp) * 100 : 0;
    const gaugePercent = Math.min(100, (combatant.gauge / ACTION_THRESHOLD) * 100);
    const totalPoints = (combatant.level - 1) * 3;
    const usedPoints = (Object.values(combatant.allocatedStats) as number[]).reduce((a, b) => a + b, 0);
    const availablePoints = Math.max(0, totalPoints - usedPoints);
    const archetype = derived ? getArchetype(derived) : null;
    const isMage = derived ? derived.magicalAttack > derived.physicalAttack : false;
    const weaponAtkLabel = isMage ? "M.ATK" : "P.ATK";
    const weaponAtkColor = isMage ? "text-blue-400" : "text-amber-500";
    const weaponAtkIcon = isMage ? <Zap className="w-2 h-2" /> : <Sword className="w-2 h-2" />;
    const weaponAtkValue = derived ? (isMage ? derived.magicalAttack : derived.physicalAttack) : 0;
    const reductionLabel = isMage ? "M.RED" : "P.RED";
    const reductionValue = derived ? Math.round((isMage ? derived.magicalReduction : derived.physicalReduction) * 100) : 0;

    return (
        <div className={`relative shrink-0 min-h-[200px] md:min-h-[240px] transition-all duration-150 ${combatant.lastAttacker ? 'z-10 scale-[1.02]' : 'z-0'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            
            {/* Winner Overlay Effect */}
            {isWinner && mercenary && (
                <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none animate-in zoom-in fade-in duration-500">
                    <div className={`absolute inset-0 rounded-xl border-2 transition-all ${isMvp ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.4)]' : 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]'}`}></div>
                    
                    <div className="relative flex flex-col items-center">
                        {/* Kills Badge - Top Left of the crown area */}
                        {combatant.kills > 0 && (
                            <div className="absolute -top-12 -left-8 bg-red-600 border border-white/20 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg animate-in slide-in-from-bottom-2 duration-700">
                                <Skull className="w-3 h-3 text-white" />
                                <span className="text-[10px] font-black text-white font-mono">{combatant.kills}</span>
                            </div>
                        )}

                        {/* Centered Crown */}
                        <div className={`relative p-2 md:p-3 rounded-full shadow-[0_0_40px_rgba(245,158,11,0.8)] animate-bounce border-2 border-amber-200 ${isMvp ? 'bg-amber-400 scale-110' : 'bg-amber-500'}`}>
                            <Crown className={`w-5 h-5 md:w-8 md:h-8 text-stone-900 fill-stone-900`} />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
                        </div>

                        {/* MVP Text Label */}
                        {isMvp && (
                            <div className="mt-2 bg-stone-900 border border-amber-500 px-3 py-0.5 rounded-full shadow-xl animate-in fade-in zoom-in delay-300 duration-500">
                                <span className="text-[10px] md:text-xs font-black text-amber-500 tracking-widest uppercase">MVP</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Damaged Slash Effect */}
            {combatant.lastDamaged && mercenary && (
                <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-red-600/20 animate-in fade-in duration-75"></div>
                    <div className="relative w-full h-full flex items-center justify-center">
                        <div className="absolute w-[120%] h-2 md:h-4 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] rotate-[35deg] animate-in slide-in-from-top-left zoom-in duration-100 ease-out"></div>
                        <div className="absolute w-[120%] h-1 md:h-2 bg-white/80 rotate-[35deg] blur-sm animate-in slide-in-from-top-left zoom-in duration-150 delay-75"></div>
                    </div>
                </div>
            )}

            {/* Main Content Box */}
            <div className={`flex flex-col gap-1 md:gap-1.5 p-2 md:p-2.5 bg-stone-900 border rounded-xl overflow-hidden h-full w-full relative transition-all duration-150 ${combatant.lastAttacker ? 'border-amber-500 ring-2 ring-inset ring-amber-500/50 brightness-125' : 'border-stone-800/50 hover:border-stone-700'} ${mercenary && combatant.currentHp <= 0 ? 'grayscale opacity-30' : ''} ${isWinner ? 'border-amber-500/50 shadow-inner' : ''} ${combatant.lastDamaged ? 'border-red-500' : ''}`}>
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute top-1.5 right-1.5 hover:text-red-500 text-stone-700 transition-colors z-20"><Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" /></button>
                
                {mercenary && derived ? (
                    <div className="flex flex-col gap-1 md:gap-1.5 h-full">
                        <div className="flex items-center gap-1 min-w-0 pr-5">
                            <div onClick={onSelect} className="w-7 h-7 md:w-9 md:h-9 bg-stone-800 rounded-lg border border-stone-700 flex items-center justify-center text-sm md:text-lg shadow-inner shrink-0 cursor-pointer hover:border-amber-500 transition-colors">{mercenary.icon}</div>
                            <div className="min-w-0 flex flex-col justify-center text-left">
                                <div className="flex items-center gap-1 truncate text-left">
                                    <h3 className="text-[8px] md:text-[10px] font-black text-stone-200 truncate leading-none uppercase">{mercenary.name.split(' ')[0]}</h3>
                                    {archetype && <span className={`text-[5px] md:text-[6px] px-1 rounded-full text-white font-black uppercase flex items-center gap-0.5 ${archetype.color} shrink-0`}>{archetype.label}</span>}
                                </div>
                                <div className="flex items-center gap-1 text-[6px] md:text-[8px] font-bold text-amber-600 mt-0.5 justify-start">
                                    <div className="flex items-center bg-stone-950 px-1 rounded border border-amber-900/20">
                                        <HoldButton onAction={() => onUpdate({ level: Math.max(1, combatant.level - 1) })} className="hover:text-white px-0.5 text-[7px] font-black">-</HoldButton>
                                        <span className="mx-0.5 select-none font-mono tracking-tighter">LV{combatant.level}</span>
                                        <HoldButton onAction={() => onUpdate({ level: combatant.level + 1 })} className="hover:text-white px-0.5 text-[7px] font-black">+</HoldButton>
                                    </div>
                                    <span className="text-stone-500 font-mono text-[6px] md:text-[7px] uppercase">{combatant.dps} DPS</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5 bg-stone-950/30 rounded px-1 min-h-[18px]">
                            {Object.entries(mercenary.equipment).map(([slot, item]) => {
                                const eqItem = item as Equipment | null; if (!eqItem) return null;
                                const imageUrl = eqItem.image ? getAssetUrl(eqItem.image) : (eqItem.recipeId ? getAssetUrl(`${eqItem.recipeId}.png`) : getAssetUrl(`${eqItem.id.split('_')[0]}.png`));
                                return <div key={slot} className="w-3.5 h-3.5 md:w-4 md:h-4 bg-stone-900 rounded border border-stone-800 shrink-0 flex items-center justify-center p-0.5" title={`${slot}: ${eqItem.name}`}><img src={imageUrl} className="w-full h-full object-contain" /></div>;
                            })}
                        </div>
                        <div className="space-y-0.5 shrink-0">
                            <div className="relative h-2.5 md:h-3.5 bg-stone-950 rounded border border-stone-800/50 shadow-inner">
                                <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${hpPercent}%` }}></div>
                                <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none"><span className="text-[6px] md:text-[8px] font-black text-white/80 uppercase tracking-tighter">HP</span><span className="text-[6px] md:text-[9px] font-mono font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">{Math.round(combatant.currentHp)}</span></div>
                            </div>
                            <div className="relative h-2.5 md:h-3.5 bg-stone-950 rounded border border-amber-900/20 shadow-inner">
                                <div className={`h-full bg-amber-500 transition-all duration-100 ${gaugePercent >= 100 ? 'animate-pulse bg-white' : ''}`} style={{ width: `${gaugePercent}%` }}></div>
                                <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none"><span className="text-[6px] md:text-[8px] font-black text-stone-900/80 uppercase tracking-tighter">ACT</span><span className="text-[6px] md:text-[9px] font-mono font-black text-stone-900">{Math.round(gaugePercent)}%</span></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-0.5 md:gap-1 shrink-0">
                            <StatBox label={weaponAtkLabel} value={weaponAtkValue} icon={weaponAtkIcon} color={weaponAtkColor} />
                            <StatBox label={reductionLabel} value={`${reductionValue}%`} icon={<Shield className="w-1.5 h-1.5" />} color="text-blue-400" />
                            <StatBox label="SPD" value={derived.speed} icon={<FastForward className="w-1.5 h-1.5" />} color="text-indigo-400" />
                            <StatBox label="CRT" value={`${derived.critChance}%`} icon={<Target className="w-1.5 h-1.5" />} color="text-red-400" />
                            <StatBox label="ACC" value={derived.accuracy} icon={<Crosshair className="w-1.5 h-1.5" />} />
                            <StatBox label="EVA" value={derived.evasion} icon={<Wind className="w-1.5 h-1.5" />} />
                        </div>
                        <div className="bg-stone-950/60 p-1 rounded border border-stone-800/50 flex flex-col gap-1 flex-1 min-h-0">
                            <div className="grid grid-cols-5 gap-0.5 md:gap-1 h-full">
                                {[ { label: 'STR', key: 'str' as const, color: 'text-orange-400' }, { label: 'VIT', key: 'vit' as const, color: 'text-red-400' }, { label: 'DEX', key: 'dex' as const, color: 'text-emerald-400' }, { label: 'INT', key: 'int' as const, color: 'text-blue-400' }, { label: 'LUK', key: 'luk' as const, color: 'text-pink-400' } ].map(s => (
                                    <div key={s.label} className="flex flex-col items-center justify-between h-full bg-stone-900/80 rounded border border-stone-800/50 py-0.5">
                                        <span className={`text-[5px] md:text-[7px] font-black ${s.color}`}>{s.label}</span>
                                        <div className="flex flex-col items-center w-full px-0.5">
                                            <HoldButton onAction={() => onUpdate({ allocatedStats: {...combatant.allocatedStats, [s.key]: combatant.allocatedStats[s.key] + 1} })} disabled={availablePoints <= 0} className="w-full text-amber-500 hover:text-white transition-colors disabled:opacity-20 flex justify-center bg-stone-950/50 rounded-t py-0.5 border-b border-stone-800"><ChevronUp className="w-2.5 h-2.5" /></HoldButton>
                                            <span className="text-[8px] md:text-[10px] font-mono font-black text-stone-200 leading-none select-none my-0.5">{mercenary.stats[s.key] + combatant.allocatedStats[s.key]}</span>
                                            <HoldButton onAction={() => onUpdate({ allocatedStats: {...combatant.allocatedStats, [s.key]: Math.max(0, combatant.allocatedStats[s.key] - 1)} })} disabled={combatant.allocatedStats[s.key] <= 0} className="w-full text-stone-600 hover:text-red-400 transition-colors disabled:opacity-20 flex justify-center bg-stone-950/50 rounded-b py-0.5 border-t border-stone-800"><ChevronDown className="w-2.5 h-2.5" /></HoldButton>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-between min-h-[80px]">
                        <div onClick={onSelect} className="flex-1 border-2 border-dashed border-stone-800 rounded-lg flex flex-col items-center justify-center gap-1.5 text-stone-600 hover:text-stone-400 hover:border-stone-600 transition-all hover:bg-stone-800/30 cursor-pointer h-full"><User className="w-5 h-5 md:w-7 md:h-7 opacity-20" /><span className="text-[6px] md:text-[7px] font-black uppercase tracking-widest">Assign Member</span></div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SimulationTab = () => {
    const { state } = useGame();
    const sim = useSimulation();
    const [showPicker, setShowPicker] = useState<{ side: 'A' | 'B', id: string } | null>(null);
    const hiredMercs = state.knownMercenaries.filter(m => m.status === 'HIRED' || m.status === 'VISITOR');

    const hasTeamA = useMemo(() => sim.teamA.some(c => c.mercenaryId), [sim.teamA]);
    const hasTeamB = sim.teamB.some(c => c.mercenaryId); 
    const canRun = hasTeamA && hasTeamB;

    const logContainerRef = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef(true);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
        shouldAutoScrollRef.current = isAtBottom;
    };

    useEffect(() => {
        if (shouldAutoScrollRef.current && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [sim.combatLog]);

    const renderSummaryRow = (label: string, valueA: string | number, valueB: string | number, highlight: boolean = false) => (
        <div className={`grid grid-cols-12 gap-2 border-b border-stone-800/50 py-1.5 items-center ${highlight ? 'bg-amber-500/5' : ''}`}>
            <div className="col-span-4 text-[8px] md:text-[10px] font-black text-stone-500 uppercase tracking-tighter pl-2">{label}</div>
            <div className="col-span-4 text-center font-mono text-[10px] md:text-xs font-black text-blue-400">{valueA}</div>
            <div className="col-span-4 text-center font-mono text-[10px] md:text-xs font-black text-red-400">{valueB}</div>
        </div>
    );

    const activeStats = useMemo(() => {
        if (sim.singleMatchReport) return { A: sim.singleMatchReport.statsA, B: sim.singleMatchReport.statsB, winner: sim.singleMatchReport.winner };
        if (sim.liveStats) return { A: sim.liveStats.A, B: sim.liveStats.B, winner: null };
        const empty = { attacks: 0, totalDmg: 0, misses: 0, crits: 0, evasions: 0, maxDmg: 0, minDmg: 0 };
        return { A: empty, B: empty, winner: null };
    }, [sim.singleMatchReport, sim.liveStats]);

    const mvpId = useMemo(() => {
        const winner = sim.singleMatchReport?.winner;
        if (!winner) return null;
        const winnerTeam = winner === 'A' ? sim.teamA : sim.teamB;
        const candidates = winnerTeam.filter(c => c.mercenaryId);
        if (candidates.length === 0) return null;

        return [...candidates].sort((a, b) => {
            if (b.kills !== a.kills) return b.kills - a.kills;
            const scoreA = a.damageDealt + a.damageTaken;
            const scoreB = b.damageDealt + b.damageTaken;
            return scoreB - scoreA;
        })[0].instanceId;
    }, [sim.singleMatchReport, sim.teamA, sim.teamB]);

    const getHitRate = (stats: MatchStats) => stats.attacks > 0 ? `${Math.round(((stats.attacks - stats.misses) / stats.attacks) * 100)}%` : '0%';

    return (
        <div className="h-full w-full flex flex-col bg-stone-925 p-2 md:p-3 overflow-hidden relative">
            {/* Header Toolbar */}
            <div className="flex justify-between items-center mb-2 bg-stone-900/50 p-1.5 md:p-2.5 rounded-lg border border-stone-800 shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="bg-amber-900/30 p-1 rounded-full border border-amber-800 shrink-0"><Activity className="w-3 h-3 md:w-4 md:h-4 text-amber-500 animate-pulse" /></div>
                    <div className="min-w-0">
                        <h2 className="text-xs md:text-lg font-bold text-amber-500 font-serif truncate leading-none uppercase">Squad Tactics</h2>
                        <p className="text-[6px] md:text-[8px] text-stone-500 font-mono mt-0.5">Live Simulation Environment</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center bg-stone-950 p-1 rounded-lg border border-stone-800 shrink-0 mr-1 overflow-x-auto no-scrollbar">
                        <div className="flex gap-0.5">{[1, 2, 5, 10].map(s => <button key={s} onClick={() => sim.setBattleSpeed(s as 1 | 2 | 5 | 10)} className={`px-2 py-0.5 rounded font-mono text-[8px] md:text-[10px] font-black transition-all ${sim.battleSpeed === s ? 'bg-amber-600 text-white' : 'text-stone-600 hover:text-stone-300'}`}>{s}x</button>)}</div>
                    </div>
                    <button onClick={sim.handleReset} className="p-1 md:p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-600 transition-all" title="Arena Reset"><RefreshCw className="w-3 h-3 md:w-4 md:h-4" /></button>
                    <button onClick={sim.runBulkSimulation} disabled={sim.isBattleRunning || sim.isSearching || !canRun} className="px-2 py-1 md:px-3 md:py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-500 border border-stone-600 rounded font-bold text-[8px] md:text-[10px] disabled:opacity-30 shrink-0">BATCH</button>
                    <button onClick={sim.runAttackCycle} disabled={sim.isSearching || (!sim.isBattleRunning && !canRun)} className={`px-2 py-1 md:px-4 md:py-1.5 rounded font-black text-[8px] md:text-[10px] shrink-0 transition-all ${sim.isBattleRunning ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-30'}`}>{sim.isBattleRunning ? 'PAUSE' : 'DEPLOY'}</button>
                </div>
            </div>

            <div className="flex-1 flex gap-2 overflow-hidden min-h-0 mb-2">
                <div className="w-[35%] h-full flex flex-col gap-2 overflow-y-auto no-scrollbar pr-0.5">
                    {sim.teamA.map(c => (
                        <CombatantSlot 
                            key={c.instanceId} 
                            combatant={c} 
                            mercenary={state.knownMercenaries.find(m => m.id === c.mercenaryId) || null} 
                            derived={sim.getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)} 
                            onSelect={() => setShowPicker({ side: 'A', id: c.instanceId })} 
                            onUpdate={(data) => sim.updateSlot('A', c.instanceId, data)} 
                            onRemove={() => sim.removeSlot('A', c.instanceId)} 
                            disabled={sim.isBattleRunning || sim.isSearching}
                            isWinner={sim.singleMatchReport?.winner === 'A'}
                            isMvp={mvpId === c.instanceId}
                        />
                    ))}
                    <button onClick={() => sim.addSlot('A')} disabled={sim.teamA.length >= 4 || sim.isBattleRunning} className="w-full py-3 border-2 border-dashed border-stone-800 rounded-xl text-stone-700 hover:text-stone-500 hover:bg-stone-900 transition-all flex flex-col items-center justify-center gap-1 shrink-0"><Plus className="w-4 h-4" /> <span className="text-[8px] md:text-[9px] font-black uppercase">Add Slot</span></button>
                </div>
                
                {/* Center Panel: Battle Logs */}
                <div className="flex-1 flex flex-col h-full relative min-w-0 bg-stone-900/30 rounded-2xl border border-stone-800/40 overflow-hidden">
                    <div className="p-2 border-b border-stone-800 bg-stone-900/50 flex items-center justify-start shrink-0 px-3">
                        <div className="flex items-center text-[7px] md:text-[9px] font-black text-stone-500 uppercase tracking-tighter">
                            <Activity className={`w-2.5 h-2.5 mr-1 shrink-0 ${sim.isBattleRunning ? 'animate-pulse text-amber-500' : ''}`} />
                            <span>battle log</span>
                        </div>
                    </div>

                    <div 
                        ref={logContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col min-h-0 font-mono text-[9px] md:text-[11px] leading-tight space-y-1"
                    >
                        {sim.isSearching ? (
                             <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center bg-indigo-950/10">
                                <div className="w-8 h-8 rounded-full border-2 border-t-indigo-500 border-stone-800 animate-spin" /><h3 className="text-indigo-400 font-black uppercase tracking-widest text-[8px] md:text-[10px]">Strategic Analysis...</h3>
                            </div>
                        ) : sim.bulkReport ? (
                            <div className="h-full flex flex-col gap-4 p-2 animate-in fade-in">
                                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                                    <div className="flex justify-between text-[8px] font-black text-stone-500 uppercase mb-2"><span>Team A Wins</span><span>Team B Wins</span></div>
                                    <div className="h-4 bg-stone-900 rounded-full overflow-hidden border border-stone-800 relative">
                                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(sim.bulkReport.winA / 100)}%` }}></div>
                                        <div className="absolute inset-0 flex justify-between items-center px-3 text-[9px] font-black font-mono"><span className="text-white">{(sim.bulkReport.winA / 100).toFixed(1)}%</span><span className="text-white">{(sim.bulkReport.winB / 100).toFixed(1)}%</span></div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-mono text-stone-500 uppercase"><span>Avg Actions</span><span className="text-stone-200">{sim.bulkReport.avgAtksA.toFixed(1)} : {sim.bulkReport.avgAtksB.toFixed(1)}</span></div>
                                    <div className="flex justify-between text-[9px] font-mono text-stone-500 uppercase"><span>Avg Crits</span><span className="text-stone-200">{sim.bulkReport.avgCritsA.toFixed(0)} : {sim.bulkReport.avgCritsB.toFixed(0)}</span></div>
                                </div>
                            </div>
                        ) : sim.combatLog.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-stone-800 italic gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-stone-900/50 flex items-center justify-center border border-stone-800/50 text-stone-700 font-black italic text-base shadow-inner">VS</div>
                                <div className="text-center"><h3 className="text-stone-700 font-black uppercase text-[10px] tracking-widest mb-1">Tactical Array</h3><p className="text-[8px] text-stone-800 leading-tight font-bold uppercase tracking-widest">Deploy squads to begin engagement</p></div>
                            </div>
                        ) : (
                            sim.combatLog.map((log, i) => {
                                const isTeamA = log.team === 'A';
                                const isTeamB = log.team === 'B';
                                const isSystem = log.team === 'SYSTEM';
                                
                                let borderColor = 'border-stone-700';
                                if (isTeamA) borderColor = 'border-blue-500';
                                if (isTeamB) borderColor = 'border-red-500';
                                if (log.isCrit) borderColor = 'border-amber-500';

                                return (
                                    <div 
                                        key={i} 
                                        className={`px-2 py-1 border-l-2 ${borderColor} transition-all duration-300 rounded-sm
                                            ${log.isCrit ? 'bg-amber-900/20 text-amber-400 font-bold shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]' : 'bg-stone-900/40'}
                                            ${log.isMiss ? 'opacity-40 italic' : ''}
                                            ${!log.isCrit && isTeamA ? 'text-blue-300' : ''}
                                            ${!log.isCrit && isTeamB ? 'text-red-300' : ''}
                                            ${isSystem ? 'text-stone-400' : ''}
                                        `}
                                    >
                                        {log.msg}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="w-[35%] h-full flex flex-col gap-2 overflow-y-auto no-scrollbar pl-0.5">
                    {sim.teamB.map(c => (
                        <CombatantSlot 
                            key={c.instanceId} 
                            combatant={c} 
                            mercenary={state.knownMercenaries.find(m => m.id === c.mercenaryId) || null} 
                            derived={sim.getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)} 
                            onSelect={() => setShowPicker({ side: 'B', id: c.instanceId })} 
                            onUpdate={(data) => sim.updateSlot('B', c.instanceId, data)} 
                            onRemove={() => sim.removeSlot('B', c.instanceId)} 
                            disabled={sim.isBattleRunning || sim.isSearching}
                            isWinner={sim.singleMatchReport?.winner === 'B'}
                            isMvp={mvpId === c.instanceId}
                        />
                    ))}
                    <button onClick={() => sim.addSlot('B')} disabled={sim.teamB.length >= 4 || sim.isBattleRunning} className="w-full py-3 border-2 border-dashed border-stone-800 rounded-xl text-stone-700 hover:text-stone-500 hover:bg-stone-900 transition-all flex flex-col items-center justify-center gap-1 shrink-0"><Plus className="w-4 h-4" /> <span className="text-[8px] md:text-[9px] font-black uppercase">Add Slot</span></button>
                </div>
            </div>

            <div className="h-40 md:h-52 bg-stone-950/80 border border-stone-800 rounded-xl overflow-hidden shadow-inner shrink-0 flex flex-col">
                <div className="p-2 border-b border-stone-800 bg-stone-900/60 flex justify-between items-center px-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <h3 className="text-[10px] md:text-xs font-black text-stone-100 uppercase tracking-widest">Live Summary</h3>
                    </div>
                    {activeStats.winner && <span className={`text-[10px] font-black px-2 py-0.5 rounded ${activeStats.winner === 'A' ? 'bg-blue-900/40 text-blue-400' : 'bg-red-900/40 text-red-400'}`}>WINNER: TEAM {activeStats.winner}</span>}
                </div>
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 bg-stone-900/30 py-1.5 border-b border-stone-800/50 px-2 shrink-0">
                        <div className="col-span-4 text-[7px] md:text-[9px] font-black text-stone-600 uppercase text-center">Metric</div>
                        <div className="col-span-4 text-[7px] md:text-[9px] font-black text-blue-500 uppercase text-center">Team A</div>
                        <div className="col-span-4 text-[7px] md:text-[9px] font-black text-red-500 uppercase text-center">Team B</div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                        {renderSummaryRow("Attack Attempts", activeStats.A.attacks, activeStats.B.attacks)}
                        {renderSummaryRow("Hit Rate", getHitRate(activeStats.A), getHitRate(activeStats.B))}
                        {renderSummaryRow("Critical Hits", activeStats.A.crits, activeStats.B.crits)}
                        {renderSummaryRow("Dodged Blows", activeStats.A.evasions, activeStats.B.evasions)}
                        {renderSummaryRow("Max Damage", activeStats.A.maxDmg, activeStats.B.maxDmg)}
                        {renderSummaryRow("Min Damage", activeStats.A.minDmg, activeStats.B.minDmg)}
                        {renderSummaryRow("Total Damage", activeStats.A.totalDmg, activeStats.B.totalDmg, true)}
                    </div>
                </div>
            </div>

            {showPicker && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[85vh]">
                        <div className="p-4 border-b border-stone-800 bg-stone-850 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-stone-200 font-serif tracking-wide uppercase text-base">Select Combatant</h3>
                            <button onClick={() => setShowPicker(null)} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500 hover:text-stone-300 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
                            {hiredMercs.map(merc => (
                                <button key={merc.id} onClick={() => { sim.updateSlot(showPicker.side, showPicker.id, { mercenaryId: merc.id }); setShowPicker(null); }} className="w-full flex items-center gap-4 p-3 bg-stone-800 hover:bg-stone-750 border border-stone-700 rounded-2xl transition-all group">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-stone-900 rounded-2xl flex items-center justify-center text-2xl md:text-3xl group-hover:scale-110 transition-transform shadow-inner">{merc.icon}</div>
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="font-black text-stone-200 truncate text-xs md:text-sm">{merc.name}</div>
                                        <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{merc.job} • LV {merc.level}</div>
                                    </div>
                                    <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 group-hover:bg-amber-600 group-hover:text-white transition-colors">Assign</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimulationTab;