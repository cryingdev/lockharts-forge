
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useGame } from '../../../context/GameContext';
import { useSimulation, CombatantInstance } from '../../../hooks/useSimulation';
import { Mercenary } from '../../../models/Mercenary';
import { DerivedStats, PrimaryStats } from '../../../models/Stats';
import { Sword, Shield, Activity, User, Play, RefreshCw, ScrollText, Crosshair, Target, Wind, FastForward, Brain, X, ChevronUp, ChevronDown, Package, Plus, Trash2, Trophy, Loader2 } from 'lucide-react';

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

const getArchetype = (p: PrimaryStats) => {
    const max = Math.max(p.str, p.vit, p.dex, p.int, p.luk);
    if (p.str === max) return { label: 'Berserker', color: 'bg-orange-600', icon: <Sword className="w-2 h-2 md:w-2.5 md:h-2.5"/> };
    if (p.vit === max) return { label: 'Guardian', color: 'bg-red-700', icon: <Shield className="w-2 h-2 md:w-2.5 md:h-2.5"/> };
    if (p.dex === max) return { label: 'Assassin', color: 'bg-emerald-600', icon: <Wind className="w-2 h-2 md:w-2.5 md:h-2.5"/> };
    if (p.int === max) return { label: 'Scholar', color: 'bg-blue-600', icon: <Brain className="w-2 h-2 md:w-2.5 md:h-2.5"/> };
    if (p.luk === max) return { label: 'Gambler', color: 'bg-pink-600', icon: <Target className="w-2 h-2 md:w-2.5 md:h-2.5"/> };
    return { label: 'Adept', color: 'bg-stone-600', icon: <Activity className="w-2 h-2 md:w-2.5 md:h-2.5"/> };
};

const CombatantSlot = ({ 
    side, combatant, mercenary, derived, onSelect, onUpdate, onRemove, disabled 
}: { 
    side: 'LEFT' | 'RIGHT', combatant: CombatantInstance, mercenary: Mercenary | null, derived: DerivedStats | null, onSelect: () => void, onUpdate: (data: Partial<CombatantInstance>) => void, onRemove: () => void, disabled?: boolean 
}) => {
    const hpPercent = derived ? (combatant.currentHp / derived.maxHp) * 100 : 0;
    const gaugePercent = Math.min(100, (combatant.gauge / ACTION_THRESHOLD) * 100);
    const totalPoints = (combatant.level - 1) * 3;
    const usedPoints = Object.values(combatant.allocatedStats).reduce((a, b) => a + b, 0);
    const availablePoints = Math.max(0, totalPoints - usedPoints);
    
    const mergedStats = mercenary ? {
        str: mercenary.stats.str + combatant.allocatedStats.str,
        vit: mercenary.stats.vit + combatant.allocatedStats.vit,
        dex: mercenary.stats.dex + combatant.allocatedStats.dex,
        int: mercenary.stats.int + combatant.allocatedStats.int,
        luk: mercenary.stats.luk + combatant.allocatedStats.luk,
    } : null;

    const archetype = mergedStats ? getArchetype(mergedStats) : null;
    const isMage = mergedStats ? mergedStats.int > mergedStats.str : false;
    const weaponAtk = derived ? (isMage ? derived.magicalAttack : derived.physicalAttack) : 0;

    return (
        <div className={`flex flex-col gap-1.5 md:gap-2 p-2.5 md:p-3 bg-stone-900 border transition-all duration-300 rounded-xl relative overflow-hidden shrink-0 min-h-[190px] md:min-h-[240px] ${side === 'LEFT' ? 'border-blue-900/40' : 'border-red-900/40'} ${combatant.lastAttacker ? 'scale-[1.02] ring-2 ring-amber-500 z-10' : 'hover:border-stone-700'} ${disabled ? 'opacity-50 pointer-events-none' : ''} ${mercenary && combatant.currentHp <= 0 ? 'grayscale opacity-30' : ''}`}>
            
            {/* Absolute Removal Button */}
            <button 
                onClick={onRemove} 
                className={`absolute top-2 hover:text-red-500 text-stone-700 transition-colors z-20 ${side === 'LEFT' ? 'right-2' : 'left-2'}`}
            >
                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>

            {mercenary && derived ? (
                <div className="flex flex-col gap-1.5 md:gap-2 h-full">
                    {/* Header: Always Icon then Text for both sides as requested */}
                    <div className="flex items-center gap-1">
                         <div className="flex items-center gap-1.5 md:gap-2 min-w-0 pr-6">
                            <div onClick={onSelect} className="w-8 h-8 md:w-10 md:h-10 bg-stone-800 rounded-lg border border-stone-700 flex items-center justify-center text-base md:text-xl shadow-inner shrink-0 cursor-pointer hover:border-amber-500 transition-colors">{mercenary.icon}</div>
                            <div className="min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-1 truncate text-left">
                                    <h3 className="text-[9px] md:text-xs font-black text-stone-200 truncate leading-none uppercase">{mercenary.name.split(' ')[0]}</h3>
                                    {archetype && (
                                        <span className={`text-[5px] md:text-[7px] px-1 rounded-full text-white font-black uppercase flex items-center gap-0.5 ${archetype.color} shrink-0`}>
                                            {archetype.label}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-[7px] md:text-[9px] font-bold text-amber-600 mt-0.5 justify-start">
                                    <div className="flex items-center bg-stone-950 px-1 rounded border border-amber-900/20">
                                        <HoldButton onAction={() => onUpdate({ level: Math.max(1, combatant.level - 1) })} className="hover:text-white px-0.5 text-[8px] font-black">-</HoldButton>
                                        <span className="mx-0.5 select-none font-mono tracking-tighter">LV{combatant.level}</span>
                                        <HoldButton onAction={() => onUpdate({ level: combatant.level + 1 })} className="hover:text-white px-0.5 text-[8px] font-black">+</HoldButton>
                                    </div>
                                    <span className="text-stone-500 font-mono text-[7px] md:text-[8px] uppercase">{combatant.dps} DPS</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Thick Vitals */}
                    <div className="space-y-1 shrink-0">
                        {/* HP Bar */}
                        <div className="relative h-3 md:h-5 bg-stone-950 rounded-md overflow-hidden border border-stone-800/50 shadow-inner">
                            <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${hpPercent}%` }}></div>
                            <div className="absolute inset-0 flex justify-between items-center px-1.5 md:px-2 pointer-events-none">
                                <span className="text-[7px] md:text-[9px] font-black text-white/80 uppercase tracking-tighter">HP</span>
                                <span className="text-[7px] md:text-[10px] font-mono font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                                    {Math.round(combatant.currentHp)}
                                </span>
                            </div>
                        </div>
                        {/* Action Bar (ACT/MP) */}
                        <div className="relative h-3 md:h-5 bg-stone-950 rounded-md overflow-hidden border border-amber-900/20 shadow-inner">
                            <div className={`h-full bg-amber-500 transition-all duration-100 ${gaugePercent >= 100 ? 'animate-pulse bg-white' : ''}`} style={{ width: `${gaugePercent}%` }}></div>
                            <div className="absolute inset-0 flex justify-between items-center px-1.5 md:px-2 pointer-events-none">
                                <span className="text-[7px] md:text-[9px] font-black text-stone-900/80 uppercase tracking-tighter">ACT</span>
                                <span className="text-[7px] md:text-[10px] font-mono font-black text-stone-900">
                                    {Math.round(gaugePercent)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* NEW ORDER: 1. Derived Stat Grid (변환수치 위로) */}
                    <div className="grid grid-cols-3 gap-1 shrink-0">
                        <StatBox label="ATK" value={weaponAtk} icon={<Sword className="w-2 h-2" />} color="text-amber-500" />
                        <StatBox label="RED" value={`${Math.round((isMage ? derived.magicalReduction : derived.physicalReduction) * 100)}%`} icon={<Shield className="w-2 h-2" />} color="text-blue-400" />
                        <StatBox label="SPD" value={derived.speed} icon={<FastForward className="w-2 h-2" />} color="text-indigo-400" />
                        <StatBox label="CRT" value={`${derived.critChance}%`} icon={<Target className="w-2 h-2" />} color="text-red-400" />
                        <StatBox label="ACC" value={derived.accuracy} icon={<Crosshair className="w-2 h-2" />} />
                        <StatBox label="EVA" value={derived.evasion} icon={<Wind className="w-2 h-2" />} />
                    </div>

                    {/* NEW ORDER: 2. Attribute Adjustment Bar (스탯 아래로) */}
                    <div className="bg-stone-950/60 p-1.5 rounded-lg border border-stone-800/50 flex flex-col gap-1.5 flex-1 min-h-0">
                        <div className="grid grid-cols-5 gap-1 md:gap-1.5 h-full">
                            {[
                                { label: 'STR', key: 'str' as const, color: 'text-orange-400' },
                                { label: 'VIT', key: 'vit' as const, color: 'text-red-400' },
                                { label: 'DEX', key: 'dex' as const, color: 'text-emerald-400' },
                                { label: 'INT', key: 'int' as const, color: 'text-blue-400' },
                                { label: 'LUK', key: 'luk' as const, color: 'text-pink-400' },
                            ].map(s => (
                                <div key={s.label} className="flex flex-col items-center justify-between h-full bg-stone-900/80 rounded border border-stone-800/50 py-1">
                                    <span className={`text-[6px] md:text-[8px] font-black ${s.color}`}>{s.label}</span>
                                    <div className="flex flex-col items-center gap-0.5 w-full px-1">
                                        <HoldButton 
                                            onAction={() => onUpdate({ allocatedStats: {...combatant.allocatedStats, [s.key]: combatant.allocatedStats[s.key] + 1} })} 
                                            disabled={availablePoints <= 0} 
                                            className="w-full text-amber-500 hover:text-white transition-colors disabled:opacity-20 flex justify-center bg-stone-950/50 rounded-t py-0.5 border-b border-stone-800"
                                        >
                                            <ChevronUp className="w-3 h-3" />
                                        </HoldButton>
                                        <span className="text-[9px] md:text-[11px] font-mono font-black text-stone-200 leading-none select-none my-0.5">{mercenary.stats[s.key] + combatant.allocatedStats[s.key]}</span>
                                        <HoldButton 
                                            onAction={() => onUpdate({ allocatedStats: {...combatant.allocatedStats, [s.key]: Math.max(0, combatant.allocatedStats[s.key] - 1)} })} 
                                            disabled={combatant.allocatedStats[s.key] <= 0} 
                                            className="w-full text-stone-600 hover:text-red-400 transition-colors disabled:opacity-20 flex justify-center bg-stone-950/50 rounded-b py-0.5 border-t border-stone-800"
                                        >
                                            <ChevronDown className="w-3 h-3" />
                                        </HoldButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-between min-h-[100px] md:min-h-[140px]">
                     <div onClick={onSelect} className="flex-1 border-2 border-dashed border-stone-800 rounded-lg flex flex-col items-center justify-center gap-2 text-stone-600 hover:text-stone-400 hover:border-stone-600 transition-all hover:bg-stone-800/30 cursor-pointer h-full"><User className="w-6 h-6 md:w-8 md:h-8 opacity-20" /><span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Assign Member</span></div>
                </div>
            )}
        </div>
    );
};

const SimulationTab = () => {
    const { state } = useGame();
    const sim = useSimulation();
    const [showPicker, setShowPicker] = useState<{ side: 'A' | 'B', id: string } | null>(null);
    const hiredMercs = state.knownMercenaries.filter(m => m.status === 'HIRED' || m.status === 'VISITOR');

    return (
        <div className="h-full flex flex-col bg-stone-925 p-2 md:p-3 overflow-hidden">
            {/* Header Controls */}
            <div className="flex justify-between items-center mb-2 bg-stone-900/50 p-1.5 md:p-2.5 rounded-lg border border-stone-800 shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="bg-amber-900/30 p-1 rounded-full border border-amber-800 shrink-0"><Activity className="w-3 h-3 md:w-4 md:h-4 text-amber-500 animate-pulse" /></div>
                    <div className="min-w-0">
                        <h2 className="text-xs md:text-lg font-bold text-amber-500 font-serif truncate leading-none uppercase">Squad Tactics</h2>
                        <p className="text-[6px] md:text-[8px] text-stone-500 font-mono mt-0.5">Simulation Environment v2.2</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center bg-stone-950 p-1 rounded-lg border border-stone-800 shrink-0 mr-1 overflow-x-auto no-scrollbar">
                        <div className="flex gap-0.5">{[1, 2, 5, 10].map(s => <button key={s} onClick={() => sim.setBattleSpeed(s as 1 | 2 | 5 | 10)} className={`px-2 py-0.5 rounded font-mono text-[8px] md:text-[10px] font-black transition-all ${sim.battleSpeed === s ? 'bg-amber-600 text-white' : 'text-stone-600 hover:text-stone-300'}`}>{s}x</button>)}</div>
                    </div>
                    <button onClick={sim.handleReset} className="p-1 md:p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-600 transition-all"><RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5" /></button>
                    <button onClick={sim.runBulkSimulation} disabled={sim.isBattleRunning || sim.isSearching} className="px-2 py-1 md:px-3 md:py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-500 border border-stone-600 rounded font-bold text-[8px] md:text-[10px] disabled:opacity-50 shrink-0">BATCH</button>
                    <button onClick={sim.runAttackCycle} disabled={sim.isSearching} className={`px-2 py-1 md:px-4 md:py-1.5 rounded font-black text-[8px] md:text-[10px] shrink-0 transition-all ${sim.isBattleRunning ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}>{sim.isBattleRunning ? 'PAUSE' : 'DEPLOY'}</button>
                </div>
            </div>

            {/* Battle Field Grid */}
            <div className="flex-1 flex gap-2 overflow-hidden min-h-0 mb-2">
                {/* Team A Column */}
                <div className="w-[35%] h-full flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
                    {sim.teamA.map(c => (
                        <CombatantSlot 
                            key={c.instanceId} 
                            side="LEFT" 
                            combatant={c} 
                            mercenary={state.knownMercenaries.find(m => m.id === c.mercenaryId) || null} 
                            derived={sim.getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)} 
                            onSelect={() => setShowPicker({ side: 'A', id: c.instanceId })} 
                            onUpdate={(data) => sim.updateSlot('A', c.instanceId, data)} 
                            onRemove={() => sim.removeSlot('A', c.instanceId)}
                            disabled={sim.isBattleRunning || sim.isSearching}
                        />
                    ))}
                    <button 
                        onClick={() => sim.addSlot('A')} 
                        disabled={sim.teamA.length >= 4 || sim.isBattleRunning} 
                        className="w-full py-4 border-2 border-dashed border-stone-800 rounded-xl text-stone-700 hover:text-stone-500 hover:bg-stone-900 transition-all flex flex-col items-center justify-center gap-1 shrink-0"
                    >
                        <Plus className="w-5 h-5" /> <span className="text-[10px] font-black uppercase">Add Slot</span>
                    </button>
                </div>
                
                {/* Central Status Report */}
                <div className="flex-1 flex flex-col h-full relative min-w-0 bg-stone-900/30 rounded-2xl border border-stone-800/40 overflow-hidden">
                    {sim.isSearching ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-center bg-indigo-950/10">
                            <div className="w-8 h-8 rounded-full border-2 border-t-indigo-500 border-stone-800 animate-spin" />
                            <h3 className="text-indigo-400 font-black uppercase tracking-widest text-[8px] md:text-[10px]">Strategic Analysis...</h3>
                        </div>
                    ) : sim.isBattleRunning ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-amber-600/20 border-t-amber-500 animate-spin" />
                                <Activity className="absolute inset-0 m-auto w-6 h-6 text-amber-500 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-amber-500 font-black uppercase text-xs tracking-tighter">Combat In Progress</h3>
                                <p className="text-[8px] md:text-[10px] text-stone-500 font-mono animate-pulse uppercase">Calculating Ticks (x{sim.battleSpeed})</p>
                            </div>
                            <div className="mt-4 w-full bg-stone-950/50 p-2 rounded-lg border border-stone-800 font-mono text-[8px] md:text-[10px] text-stone-400 overflow-hidden truncate">
                                Analyzing squad interactions...
                            </div>
                        </div>
                    ) : sim.bulkReport ? (
                        <div className="w-full h-full p-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar-thin">
                            <div className="text-center border-b border-stone-800 pb-2"><h3 className="text-[10px] md:text-xs font-black text-stone-100 uppercase tracking-widest">Squad Victory Analysis</h3></div>
                            <div className="space-y-4">
                                <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                                    <div className="flex justify-between text-[8px] md:text-[10px] font-black text-stone-500 uppercase mb-2 px-1"><span>Team A Wins</span><span>Team B Wins</span></div>
                                    <div className="h-4 md:h-6 bg-stone-900 rounded-full overflow-hidden border border-stone-800 relative">
                                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(sim.bulkReport.winA / 100)}%` }}></div>
                                        <div className="absolute inset-0 flex justify-between items-center px-3 text-[9px] md:text-xs font-black font-mono">
                                            <span className="text-white">{(sim.bulkReport.winA / 100).toFixed(1)}%</span>
                                            <span className="text-white">{(sim.bulkReport.winB / 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2 bg-stone-950/40 p-2 rounded-xl">
                                    <div className="flex justify-between text-[8px] md:text-[10px] font-mono border-b border-stone-800 pb-1"><span className="text-stone-600 uppercase">Avg Actions</span><span className="text-stone-300 font-bold">{sim.bulkReport.avgAtksA.toFixed(1)} : {sim.bulkReport.avgAtksB.toFixed(1)}</span></div>
                                    <div className="flex justify-between text-[8px] md:text-[10px] font-mono border-b border-stone-800 pb-1"><span className="text-stone-600 uppercase">Crit Totals</span><span className="text-stone-300 font-bold">{sim.bulkReport.avgCritsA.toFixed(0)} : {sim.bulkReport.avgCritsB.toFixed(0)}</span></div>
                                    <div className="flex justify-between text-[8px] md:text-[10px] font-mono"><span className="text-stone-600 uppercase">Dodged Blows</span><span className="text-stone-300 font-bold">{sim.bulkReport.avgEvasionsA.toFixed(0)} : {sim.bulkReport.avgEvasionsB.toFixed(0)}</span></div>
                                </div>
                            </div>
                        </div>
                    ) : sim.singleMatchReport ? (
                        <div className="w-full h-full p-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar-thin animate-in fade-in zoom-in duration-500">
                            <div className="text-center border-b border-amber-900/30 pb-2"><h3 className="text-[10px] md:text-xs font-black text-amber-500 flex items-center justify-center gap-1 uppercase tracking-widest"><Trophy className="w-4 h-4" /> Team {sim.singleMatchReport.winner} Victory</h3></div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-stone-950 p-2 rounded-xl border border-stone-800 text-center flex flex-col items-center"><span className="text-[7px] md:text-[9px] text-stone-600 uppercase font-black mb-1">Squad Crits</span><div className="font-mono text-stone-200 font-bold text-xs md:text-lg">{sim.singleMatchReport.statsA.crits} : {sim.singleMatchReport.statsB.crits}</div></div>
                                    <div className="bg-stone-950 p-2 rounded-xl border border-stone-800 text-center flex flex-col items-center"><span className="text-[7px] md:text-[9px] text-stone-600 uppercase font-black mb-1">Total Evasion</span><div className="font-mono text-stone-200 font-bold text-xs md:text-lg">{sim.singleMatchReport.statsA.evasions} : {sim.singleMatchReport.statsB.evasions}</div></div>
                                </div>
                                <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 shadow-inner">
                                    <div className="text-[8px] font-black text-stone-500 uppercase tracking-[0.2em] mb-2 px-1">Combat Summary</div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[9px] font-mono border-b border-stone-800 pb-1">
                                            <span className="text-stone-500">Total Attacks</span>
                                            <span className="text-stone-300">{sim.singleMatchReport.statsA.attacks + sim.singleMatchReport.statsB.attacks}</span>
                                        </div>
                                        <div className="flex justify-between text-[9px] font-mono border-b border-stone-800 pb-1">
                                            <span className="text-stone-500">Total Damage</span>
                                            <span className="text-stone-300">{sim.singleMatchReport.statsA.totalDmg + sim.singleMatchReport.statsB.totalDmg}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={sim.handleReset} className="mt-auto w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black transition-all uppercase tracking-widest shadow-lg active:scale-95">Reset Arena</button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6 bg-stone-950/20">
                            <div className="w-12 h-12 rounded-2xl bg-stone-800 flex items-center justify-center border border-stone-700 text-stone-600 font-black italic text-base shadow-inner">VS</div>
                            <div>
                                <h3 className="text-stone-400 font-black uppercase text-xs tracking-widest mb-1">Tactical Array</h3>
                                <p className="text-[8px] md:text-[10px] text-stone-600 leading-tight font-bold uppercase tracking-widest">Deploy squads to begin engagement</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Team B Column */}
                <div className="w-[35%] h-full flex flex-col gap-2 overflow-y-auto custom-scrollbar pl-1">
                    {sim.teamB.map(c => (
                        <CombatantSlot 
                            key={c.instanceId} 
                            side="RIGHT" 
                            combatant={c} 
                            mercenary={state.knownMercenaries.find(m => m.id === c.mercenaryId) || null} 
                            derived={sim.getDerivedStats(c.mercenaryId, c.level, c.allocatedStats)} 
                            onSelect={() => setShowPicker({ side: 'B', id: c.instanceId })} 
                            onUpdate={(data) => sim.updateSlot('B', c.instanceId, data)} 
                            onRemove={() => sim.removeSlot('B', c.instanceId)}
                            disabled={sim.isBattleRunning || sim.isSearching}
                        />
                    ))}
                    <button 
                        onClick={() => sim.addSlot('B')} 
                        disabled={sim.teamB.length >= 4 || sim.isBattleRunning} 
                        className="w-full py-4 border-2 border-dashed border-stone-800 rounded-xl text-stone-700 hover:text-stone-500 hover:bg-stone-900 transition-all flex flex-col items-center justify-center gap-1 shrink-0"
                    >
                        <Plus className="w-5 h-5" /> <span className="text-[10px] font-black uppercase">Add Slot</span>
                    </button>
                </div>
            </div>

            {/* Combat Feed */}
            <div className="h-20 md:h-28 bg-stone-950/80 border border-stone-800 rounded-xl flex flex-col overflow-hidden shadow-inner shrink-0">
                <div className="p-1 border-b border-stone-800 bg-stone-900/50 flex items-center gap-2 text-[8px] font-black text-stone-600 uppercase tracking-widest px-4"><ScrollText className="w-3 h-3" /> Engagement History</div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col-reverse min-h-0 font-mono text-[9px] md:text-[11px] leading-tight space-y-reverse space-y-1">
                    {sim.combatLog.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-stone-800 italic text-[9px] md:text-xs">Systems ready. Awaiting engagement.</div>
                    ) : (
                        sim.combatLog.map((log, i) => (
                            <div key={i} className={`px-2 py-0.5 rounded transition-colors duration-500 ${log.color} bg-stone-900/40`}>
                                {log.msg}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Selection Modal */}
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
