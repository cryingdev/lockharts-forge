
import React, { useState, useRef, useCallback } from 'react';
import { useGame } from '../../../context/GameContext';
import { useSimulation } from '../../../hooks/useSimulation';
import { Mercenary } from '../../../models/Mercenary';
import { DerivedStats, PrimaryStats } from '../../../models/Stats';
import { Sword, Shield, Activity, User, Play, RefreshCw, ScrollText, Crosshair, Target, Wind, FastForward, BarChart3, Trophy, Brain, X, ChevronUp, ChevronDown, Pause, Search, Loader2, Zap, Info } from 'lucide-react';

const ACTION_THRESHOLD = 1000;

const HoldButton = ({ onAction, disabled, className, children }: React.PropsWithChildren<{ onAction: () => void, disabled?: boolean, className?: string }>) => {
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        e.preventDefault();
        onAction();
        delayRef.current = setTimeout(() => { timerRef.current = setInterval(() => { onAction(); }, 50); }, 300);
    }, [onAction, disabled]);
    const stop = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current); if (delayRef.current) clearTimeout(delayRef.current); }, []);
    return <button onMouseDown={start} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchEnd={stop} disabled={disabled} className={className}>{children}</button>;
};

const StatBox = ({ label, value, icon, color = "text-stone-400" }: { label: string, value: number | string, icon: React.ReactNode, color?: string }) => (
    <div className="bg-stone-800/40 border border-stone-800/50 p-1.5 rounded-lg flex items-center justify-between">
        <span className={`text-[9px] font-bold uppercase flex items-center gap-1 ${color}`}>{icon} {label}</span>
        <span className="font-mono text-[11px] font-bold text-stone-200">{value}</span>
    </div>
);

/**
 * Tactical Archetype Detector
 * Helps debug if stat bonuses (like the +1 from perfect combo) shift the unit's core role.
 */
const getArchetype = (p: PrimaryStats) => {
    const max = Math.max(p.str, p.vit, p.dex, p.int, p.luk);
    if (p.str === max) return { label: 'Berserker', color: 'bg-orange-600', icon: <Sword className="w-3 h-3"/> };
    if (p.vit === max) return { label: 'Guardian', color: 'bg-red-700', icon: <Shield className="w-3 h-3"/> };
    if (p.dex === max) return { label: 'Assassin', color: 'bg-emerald-600', icon: <Wind className="w-3 h-3"/> };
    if (p.int === max) return { label: 'Scholar', color: 'bg-blue-600', icon: <Brain className="w-3 h-3"/> };
    if (p.luk === max) return { label: 'Gambler', color: 'bg-pink-600', icon: <Target className="w-3 h-3"/> };
    return { label: 'Adept', color: 'bg-stone-600', icon: <Activity className="w-3 h-3"/> };
};

const CombatantSlot = ({ 
    side, mercenary, derived, level, allocatedStats, onSelect, onLevelChange, onStatChange, currentHp, isAttacking, gauge, dps, disabled 
}: { 
    side: 'LEFT' | 'RIGHT', mercenary: Mercenary | null, derived: DerivedStats | null, level: number, allocatedStats: PrimaryStats, onSelect: () => void, onLevelChange: (delta: number) => void, onStatChange: (stat: keyof PrimaryStats, delta: number) => void, currentHp: number, isAttacking: boolean, gauge: number, dps: number, disabled?: boolean 
}) => {
    const hpPercent = derived ? (currentHp / derived.maxHp) * 100 : 0;
    const gaugePercent = Math.min(100, (gauge / ACTION_THRESHOLD) * 100);
    const totalPoints = (level - 1) * 3;
    const usedPoints = Object.values(allocatedStats).reduce((a, b) => a + b, 0);
    const availablePoints = Math.max(0, totalPoints - usedPoints);
    
    const mergedStats = mercenary ? {
        str: mercenary.stats.str + allocatedStats.str,
        vit: mercenary.stats.vit + allocatedStats.vit,
        dex: mercenary.stats.dex + allocatedStats.dex,
        int: mercenary.stats.int + allocatedStats.int,
        luk: mercenary.stats.luk + allocatedStats.luk,
    } : null;

    const archetype = mergedStats ? getArchetype(mergedStats) : null;
    const isMage = mergedStats ? mergedStats.int > mergedStats.str : false;
    const weaponAtk = derived ? (isMage ? derived.magicalAttack : derived.physicalAttack) : 0;

    return (
        <div className={`flex-1 flex flex-col gap-2 p-4 bg-stone-900 border transition-all duration-300 rounded-2xl relative overflow-hidden ${side === 'LEFT' ? 'border-blue-900/30' : 'border-red-900/30'} ${isAttacking ? 'scale-[1.02] ring-2 ring-amber-500 z-10' : 'hover:border-stone-700'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {mercenary && derived ? (
                <div className="flex flex-col gap-2.5 h-full overflow-hidden">
                    <div className={`flex items-center justify-between gap-3 ${side === 'RIGHT' ? 'flex-row-reverse text-right' : ''}`}>
                         <div className={`flex items-center gap-3 ${side === 'RIGHT' ? 'flex-row-reverse' : ''}`}>
                            <div onClick={onSelect} className="w-12 h-12 bg-stone-800 rounded-full border-2 border-stone-700 flex items-center justify-center text-2xl shadow-lg shrink-0 cursor-pointer hover:border-amber-500 transition-colors">{mercenary.icon}</div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-stone-200 truncate leading-tight">{mercenary.name}</h3>
                                    {archetype && (
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full text-white font-black uppercase flex items-center gap-1 ${archetype.color}`}>
                                            {archetype.icon} {archetype.label}
                                        </span>
                                    )}
                                </div>
                                <div className={`flex items-center gap-1.5 text-[10px] font-bold text-amber-500 ${side === 'RIGHT' ? 'justify-end' : ''}`}>
                                    <div className="flex items-center bg-stone-950 px-1.5 py-0.5 rounded border border-amber-900/30">
                                        <HoldButton onAction={() => onLevelChange(-1)} className="hover:text-white px-1 text-xs select-none">-</HoldButton>
                                        <span className="mx-1 select-none">LV {level}</span>
                                        <HoldButton onAction={() => onLevelChange(1)} className="hover:text-white px-1 text-xs select-none">+</HoldButton>
                                    </div>
                                    <span className="text-stone-600">•</span>
                                    <span className="truncate">{mercenary.job}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Combat Efficiency</span>
                            <div className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-1">
                                <Activity className="w-3 h-3" /> {dps} <span className="text-[9px]">DPS</span>
                            </div>
                        </div>
                    </div>

                    {/* Attribute Editors (Crucial for Debugging +1 bonuses) */}
                    <div className="bg-stone-950/50 p-2 rounded-xl border border-stone-800/50 flex flex-col shrink-0">
                        <div className="flex justify-between items-center mb-1.5 px-1 text-[8px] font-black text-stone-500 uppercase tracking-widest">
                            <span>Attributes (Base + Bonus)</span>
                            {availablePoints > 0 && <span className="text-amber-500 animate-pulse">+{availablePoints} PT</span>}
                        </div>
                        <div className="flex justify-around">
                            {[
                                { label: 'STR', key: 'str' as const, color: 'text-orange-400' },
                                { label: 'VIT', key: 'vit' as const, color: 'text-red-400' },
                                { label: 'DEX', key: 'dex' as const, color: 'text-emerald-400' },
                                { label: 'INT', key: 'int' as const, color: 'text-blue-400' },
                                { label: 'LUK', key: 'luk' as const, color: 'text-pink-400' },
                            ].map(s => (
                                <div key={s.label} className="flex flex-col items-center min-w-[32px]">
                                    <span className={`text-[7px] font-black mb-0.5 ${s.color}`}>{s.label}</span>
                                    <div className="flex flex-col items-center bg-stone-900/50 rounded-md px-1 py-0.5 border border-stone-800 w-full min-h-[48px] justify-center overflow-hidden">
                                        <HoldButton onAction={() => onStatChange(s.key, 1)} disabled={availablePoints <= 0} className="text-amber-500 hover:text-white transition-colors disabled:opacity-0 disabled:pointer-events-none"><ChevronUp className="w-3 h-3" /></HoldButton>
                                        <span className="text-[10px] font-mono font-bold text-stone-200 leading-none py-0.5 select-none">{mercenary.stats[s.key] + allocatedStats[s.key]}</span>
                                        <HoldButton onAction={() => onStatChange(s.key, -1)} disabled={allocatedStats[s.key] <= 0} className="text-stone-600 hover:text-red-400 transition-colors disabled:opacity-0 disabled:pointer-events-none"><ChevronDown className="w-3 h-3" /></HoldButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5 shrink-0">
                        <div className="space-y-0.5">
                            <div className="flex justify-between text-[9px] font-bold text-stone-500 uppercase tracking-tighter"><span>Health Pool</span><span className="font-mono">{Math.max(0, Math.floor(currentHp))} / {derived.maxHp}</span></div>
                            <div className="h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800 p-0.5"><div className="h-full bg-red-600 rounded-full transition-all duration-300" style={{ width: `${hpPercent}%` }}></div></div>
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex justify-between text-[9px] font-bold text-stone-500 uppercase tracking-tighter"><span>Action Gauge</span><span className="font-mono">{Math.floor(gaugePercent)}%</span></div>
                            <div className="h-1.5 bg-stone-950 rounded-full overflow-hidden border border-amber-900/30 p-0.5"><div className={`h-full bg-amber-500 rounded-full transition-all duration-100 ${gaugePercent >= 100 ? 'animate-pulse bg-white' : ''}`} style={{ width: `${gaugePercent}%` }}></div></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 flex-1 overflow-y-auto custom-scrollbar-thin pr-1 pb-1">
                        <StatBox label={isMage ? "M.ATK" : "P.ATK"} value={weaponAtk} icon={<Sword className="w-2.5 h-2.5" />} color="text-amber-500" />
                        <StatBox label="REDUCTION" value={`${Math.round((isMage ? derived.magicalReduction : derived.physicalReduction) * 100)}%`} icon={<Shield className="w-2.5 h-2.5" />} color="text-blue-400" />
                        <StatBox label="SPEED" value={derived.speed} icon={<FastForward className="w-2.5 h-2.5" />} color="text-indigo-400" />
                        <StatBox label="CRIT" value={`${derived.critChance}%`} icon={<Target className="w-2.5 h-2.5" />} color="text-red-400" />
                        <StatBox label="ACC" value={derived.accuracy} icon={<Crosshair className="w-2.5 h-2.5" />} />
                        <StatBox label="EVA" value={derived.evasion} icon={<Wind className="w-2.5 h-2.5" />} />
                    </div>
                </div>
            ) : (
                <div onClick={onSelect} className="flex-1 border-2 border-dashed border-stone-800 rounded-xl flex flex-col items-center justify-center gap-3 text-stone-600 hover:text-stone-400 hover:border-stone-600 transition-all hover:bg-stone-800/30 cursor-pointer"><User className="w-10 h-10 opacity-20" /><span className="text-[11px] font-bold uppercase tracking-widest">Assign Unit</span></div>
            )}
        </div>
    );
};

const SimulationTab = () => {
    const { state } = useGame();
    const sim = useSimulation();
    const [showPicker, setShowPicker] = useState<'LEFT' | 'RIGHT' | null>(null);
    const hiredMercs = state.knownMercenaries.filter(m => m.status === 'HIRED' || m.status === 'VISITOR');

    return (
        <div className="h-full flex flex-col bg-stone-925 p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-4 bg-stone-900/50 p-3 rounded-xl border border-stone-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-900/30 p-2 rounded-full border border-amber-800"><Activity className="w-5 h-5 text-amber-500 animate-pulse" /></div>
                    <div><h2 className="text-xl font-bold text-amber-500 font-serif">In-Time Battle Simulator</h2><p className="text-stone-500 text-[9px] uppercase tracking-widest font-black">Multi-Archetype Tactical Analysis Engine</p></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-stone-950 p-1 rounded-lg border border-stone-800 shrink-0">
                        <div className="px-2 text-[9px] font-black text-stone-600 uppercase tracking-tighter mr-1 border-r border-stone-800 flex items-center gap-1"><FastForward className="w-3 h-3" /> Speed</div>
                        <div className="flex gap-0.5">{[1, 2, 4, 8].map(s => <button key={s} onClick={() => sim.setBattleSpeed(s as 1 | 2 | 4 | 8)} className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold transition-all ${sim.battleSpeed === s ? 'bg-amber-600 text-white shadow-[0_0_8px_rgba(217,119,6,0.3)]' : 'text-stone-500 hover:text-stone-300'}`}>{s}x</button>)}</div>
                    </div>
                    <button onClick={sim.handleReset} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-600 transition-all font-bold text-xs"><RefreshCw className="w-3.5 h-3.5" /> Reset</button>
                    <button onClick={sim.runCounterBuildSearch} disabled={!sim.mercA || !sim.mercB || sim.isSearching} className={`flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 border border-stone-600 rounded-lg transition-all font-bold text-xs disabled:opacity-50 ${sim.isSearching ? 'ring-1 ring-indigo-500 text-indigo-400' : ''}`}>{sim.isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5 text-indigo-400" />} Counter-Build</button>
                    <button onClick={sim.runBulkSimulation} disabled={!sim.mercA || !sim.mercB || sim.isSearching} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 border border-stone-600 rounded-lg transition-all font-bold text-xs disabled:opacity-50"><BarChart3 className="w-3.5 h-3.5 text-amber-500" /> 10k Sim</button>
                    <button onClick={sim.runAttackCycle} disabled={!sim.mercA || !sim.mercB || sim.isSearching || (sim.hpA <= 0 && sim.hpB <= 0 && !sim.isBattleRunning)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg shadow-lg transition-all font-bold text-xs ${sim.isBattleRunning ? 'bg-red-600 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}>{sim.isBattleRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} {sim.isBattleRunning ? 'Pause' : 'Start Auto'}</button>
                </div>
            </div>

            <div className="flex-1 flex gap-4 items-stretch overflow-hidden min-h-0 mb-4">
                <CombatantSlot side="LEFT" mercenary={sim.mercA} derived={sim.derivedA} level={sim.levelA} allocatedStats={sim.allocA} onSelect={() => setShowPicker('LEFT')} onLevelChange={(d) => sim.setLevelA(prev => Math.max(1, prev + d))} onStatChange={(s, d) => sim.setAllocA(prev => ({...prev, [s]: Math.max(0, prev[s] + d)}))} currentHp={sim.hpA} isAttacking={sim.attacker === 'LEFT'} gauge={sim.gaugeA} dps={sim.dpsA} disabled={sim.isSearching} />
                <div className="flex flex-col items-center justify-center gap-3 shrink-0 w-80 h-full relative">
                    {sim.isSearching ? (
                        <div className="flex flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-300">
                            <div className="w-16 h-16 rounded-full border-4 border-t-indigo-500 border-stone-800 animate-spin flex items-center justify-center"><Search className="w-6 h-6 text-indigo-400" /></div>
                            <div className="space-y-2"><h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Deep Search Active</h3><p className="text-[10px] text-stone-500 leading-relaxed px-6">Extracting tactical archetypes based on Strength, Vitality, and Dexterity specializations.</p></div>
                        </div>
                    ) : sim.bulkReport ? (
                        <div className="w-full h-full bg-stone-900 border-2 border-indigo-500/50 rounded-2xl p-4 flex flex-col gap-3 animate-in zoom-in-95 shadow-2xl overflow-y-auto custom-scrollbar-thin">
                             <div className="text-center"><div className="inline-block bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full mb-1">10,000 ROUND STATISTICS</div><h3 className="text-lg font-bold text-stone-100">Equilibrium Analysis</h3></div>
                            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800"><div className="flex justify-between text-[10px] font-black text-stone-500 uppercase mb-2">Win Distribution</div><div className="flex items-center h-6 bg-stone-900 rounded-full overflow-hidden border border-stone-800 relative"><div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${(sim.bulkReport.winA / 100)}%` }}></div><div className="absolute inset-0 flex justify-between items-center px-3 text-[10px] font-bold font-mono"><span className="text-white">{(sim.bulkReport.winA / 100).toFixed(1)}%</span><span className="text-white">{(sim.bulkReport.winB / 100).toFixed(1)}%</span></div></div></div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-mono"><span className="text-stone-500 uppercase">Avg Actions</span><span className="text-stone-300 font-bold">{sim.bulkReport.avgAtksA.toFixed(1)} vs {sim.bulkReport.avgAtksB.toFixed(1)}</span></div>
                                <div className="flex justify-between text-[10px] font-mono"><span className="text-stone-500 uppercase">Crit Success</span><span className="text-stone-300 font-bold">{sim.bulkReport.avgCritsA.toFixed(1)} vs {sim.bulkReport.avgCritsB.toFixed(1)}</span></div>
                                <div className="flex justify-between text-[10px] font-mono"><span className="text-stone-500 uppercase">Evasion Rate</span><span className="text-stone-300 font-bold">{sim.bulkReport.avgEvasionsA.toFixed(1)} vs {sim.bulkReport.avgEvasionsB.toFixed(1)}</span></div>
                            </div>
                        </div>
                    ) : sim.singleMatchReport ? (
                        <div className="w-full h-full bg-stone-900 border-2 border-amber-500/50 rounded-2xl p-4 flex flex-col gap-4 animate-in zoom-in-95 shadow-2xl overflow-y-auto custom-scrollbar-thin">
                            <div className="text-center"><div className="inline-block bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full mb-1">BOUT FINALIZED</div><h3 className="text-xl font-bold text-stone-100 flex items-center justify-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Slot {sim.singleMatchReport.winner} Victorious</h3></div>
                            <div className="space-y-3">
                                <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-center"><div className="text-[9px] font-black text-stone-500 uppercase mb-1">Time Elapsed</div><div className="text-lg font-mono text-stone-200 font-bold">{sim.singleMatchReport.durationTicks} Ticks</div></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-stone-950 p-2 rounded-xl border border-stone-800 text-center"><Target className="w-3.5 h-3.5 text-red-500 mx-auto mb-1" /><div className="text-[9px] text-stone-500 uppercase font-bold">Crits</div><div className="font-mono text-stone-200 font-bold">{sim.singleMatchReport.statsA.crits} : {sim.singleMatchReport.statsB.crits}</div></div>
                                    <div className="bg-stone-950 p-2 rounded-xl border border-stone-800 text-center"><Wind className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" /><div className="text-[9px] text-stone-500 uppercase font-bold">Evasion</div><div className="font-mono text-stone-200 font-bold">{sim.singleMatchReport.statsA.evasions} : {sim.singleMatchReport.statsB.evasions}</div></div>
                                </div>
                                <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl space-y-2"><div className="flex items-center gap-1.5 text-amber-500"><Brain className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Tactical Review</span></div>{sim.singleMatchReport.analysis.map((line, idx) => <div key={idx} className="flex items-start gap-2 text-[10px] text-stone-300 leading-tight"><div className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 shrink-0" />{line}</div>)}</div>
                            </div>
                            <button onClick={sim.handleReset} className="mt-auto w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg font-bold text-xs transition-colors">Reset Arena</button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700 text-stone-500 font-black italic">VS</div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1 justify-center"><Info className="w-3 h-3"/> Debug Mode</p>
                                <p className="text-[9px] text-stone-600 leading-relaxed px-4 text-center">
                                    Equipment bonuses and level allocated points are calculated in real-time.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <CombatantSlot side="RIGHT" mercenary={sim.mercB} derived={sim.derivedB} level={sim.levelB} allocatedStats={sim.allocB} onSelect={() => setShowPicker('RIGHT')} onLevelChange={(d) => sim.setLevelB(prev => Math.max(1, prev + d))} onStatChange={(s, d) => sim.setAllocB(prev => ({...prev, [s]: Math.max(0, prev[s] + d)}))} currentHp={sim.hpB} isAttacking={sim.attacker === 'RIGHT'} gauge={sim.gaugeB} dps={sim.dpsB} disabled={sim.isSearching} />
            </div>

            <div className="h-40 bg-stone-950/80 border border-stone-800 rounded-xl flex flex-col overflow-hidden shadow-inner shrink-0">
                <div className="p-2 border-b border-stone-800 bg-stone-900/50 flex items-center gap-2 text-[9px] font-black text-stone-500 uppercase tracking-widest px-4"><ScrollText className="w-3 h-3" /> Event Log</div>
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col-reverse min-h-0 font-mono text-[10px]">{sim.combatLog.length === 0 ? <div className="h-full flex items-center justify-center text-stone-700 italic">Arena initialized. Waiting for combatants.</div> : sim.combatLog.map((log, i) => <div key={i} className={`py-0.5 ${log.color}`}>{log.msg}</div>)}</div>
            </div>

            {showPicker && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[80vh]">
                        <div className="p-4 border-b border-stone-800 bg-stone-850 flex justify-between items-center shrink-0"><h3 className="font-bold text-stone-200 font-serif tracking-wide uppercase">Select Combatant</h3><button onClick={() => setShowPicker(null)} className="p-1 hover:bg-stone-800 rounded text-stone-500 hover:text-stone-300 transition-colors"><X className="w-5 h-5" /></button></div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-2 custom-scrollbar">{hiredMercs.map(merc => <button key={merc.id} onClick={() => { if (showPicker === 'LEFT') sim.setLeftSlotId(merc.id); else sim.setRightSlotId(merc.id); setShowPicker(null); }} className="w-full flex items-center gap-4 p-3 bg-stone-800 hover:bg-stone-750 border border-stone-700 rounded-xl transition-all group"><div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">{merc.icon}</div><div className="text-left flex-1 min-w-0"><div className="font-bold text-stone-200 truncate">{merc.name}</div><div className="text-xs text-stone-500">{merc.job} • LV {merc.level}</div></div><div className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-stone-950 px-2 py-1 rounded border border-stone-800">Assign</div></button>)}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimulationTab;
