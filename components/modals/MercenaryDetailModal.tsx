import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Mercenary } from '../../models/Mercenary';
import { X, Sword, Shield, Activity, Star, Box, Zap, Heart, Sparkles, ChevronUp, ChevronDown, Plus, Minus } from 'lucide-react';
import { getAssetUrl } from '../../utils';
import { calculateDerivedStats, applyEquipmentBonuses, mergePrimaryStats } from '../../models/Stats';
import { calculateCombatPower } from '../../utils/combatLogic';
import { SKILLS } from '../../data/skills';

const MercenaryDetailModal = ({ mercenary, onClose, onUnequip, isReadOnly = false }: any) => {
    const { state, actions } = useGame();
    const [localAllocated, setLocalAllocated] = useState(mercenary?.allocatedStats || { str: 0, vit: 0, dex: 0, int: 0, luk: 0 });

    if (!mercenary) return null;

    const totalUsed = Object.values(localAllocated).reduce((a, b) => (a as number) + (b as number), 0) as number;
    const availablePoints = (mercenary.level - 1) * 3 - totalUsed;
    const hasChanges = JSON.stringify(localAllocated) !== JSON.stringify(mercenary.allocatedStats);

    const eqStatsList = Object.values(mercenary.equipment).map((e: any) => e?.stats).filter(Boolean);
    const primary = mergePrimaryStats(mercenary.stats, localAllocated);
    const derived = applyEquipmentBonuses(calculateDerivedStats(primary, mercenary.level), eqStatsList as any);
    const cp = calculateCombatPower(derived, mercenary.job, primary.int > primary.str ? 'MAGICAL' : 'PHYSICAL');

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-red-900/20 text-red-500 rounded-full hover:bg-red-600 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left: Avatar & Summary */}
                    <div className="md:w-[35%] bg-stone-950/40 p-6 border-r border-stone-800 flex flex-col items-center">
                        <div className="w-40 h-40 bg-stone-900 rounded-full border-4 border-amber-600/30 flex items-center justify-center text-7xl shadow-2xl mb-4 relative">
                            {mercenary.icon}
                            <div className="absolute -bottom-2 -right-2 bg-stone-800 px-3 py-1 rounded-lg border border-stone-700 text-sm font-mono font-bold text-stone-300">LV.{mercenary.level}</div>
                        </div>
                        <h2 className="text-2xl font-black text-white font-serif tracking-tight uppercase mb-1">{mercenary.name}</h2>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="bg-amber-900/30 text-amber-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">{mercenary.job}</span>
                            <div className="flex items-center gap-1 text-stone-500 font-bold text-xs"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {cp} POWER</div>
                        </div>
                        
                        <div className="w-full space-y-3">
                            <div className="bg-stone-900/50 p-3 rounded-xl border border-stone-800">
                                <div className="flex justify-between text-xs font-black text-stone-500 mb-1"><span>HEALTH</span><span>{Math.floor(mercenary.currentHp)}/{derived.maxHp}</span></div>
                                <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden"><div className="h-full bg-red-600 transition-all" style={{ width: `${(mercenary.currentHp/derived.maxHp)*100}%` }} /></div>
                            </div>
                            <div className="bg-stone-900/50 p-3 rounded-xl border border-stone-800">
                                <div className="flex justify-between text-xs font-black text-stone-500 mb-1"><span>MANA</span><span>{Math.floor(mercenary.currentMp)}/{derived.maxMp}</span></div>
                                <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all" style={{ width: `${(mercenary.currentMp/derived.maxMp)*100}%` }} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Stats & Skills */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8">
                        {/* Attributes Section */}
                        <section>
                            <div className="flex justify-between items-end mb-4 border-b border-stone-800 pb-2">
                                <h3 className="font-black text-stone-400 uppercase tracking-widest text-sm flex items-center gap-2"><Star className="w-4 h-4" /> Attributes</h3>
                                {!isReadOnly && availablePoints > 0 && <span className="text-amber-500 text-[10px] font-black animate-pulse">POINTS AVAILABLE: {availablePoints}</span>}
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                                {['str', 'vit', 'dex', 'int', 'luk'].map(key => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <div className="bg-stone-950 border border-stone-800 p-2 rounded-xl flex flex-col items-center">
                                            <span className="text-[9px] font-black text-stone-600 uppercase mb-1">{key}</span>
                                            <span className="text-xl font-mono font-black text-stone-200">{mercenary.stats[key] + localAllocated[key]}</span>
                                        </div>
                                        {!isReadOnly && (
                                            <div className="flex gap-1">
                                                <button onClick={() => availablePoints > 0 && setLocalAllocated({...localAllocated, [key]: localAllocated[key]+1})} className="flex-1 h-6 bg-stone-800 hover:bg-amber-600 text-stone-500 hover:text-white rounded flex items-center justify-center transition-all disabled:opacity-20" disabled={availablePoints <= 0}><Plus className="w-3 h-3" /></button>
                                                <button onClick={() => localAllocated[key] > mercenary.allocatedStats[key] && setLocalAllocated({...localAllocated, [key]: localAllocated[key]-1})} className="flex-1 h-6 bg-stone-800 hover:bg-red-900 text-stone-500 hover:text-white rounded flex items-center justify-center transition-all disabled:opacity-20" disabled={localAllocated[key] <= mercenary.allocatedStats[key]}><Minus className="w-3 h-3" /></button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {hasChanges && (
                                <div className="mt-4 flex gap-2"><button onClick={() => setLocalAllocated(mercenary.allocatedStats)} className="flex-1 py-2 bg-stone-800 text-stone-400 text-[10px] font-black rounded-lg uppercase">Reset</button><button onClick={() => actions.updateMercenaryStats(mercenary.id, localAllocated)} className="flex-[2] py-2 bg-amber-700 text-white text-[10px] font-black rounded-lg uppercase shadow-lg">Confirm Attributes</button></div>
                            )}
                        </section>

                        {/* Techniques & Skills Section */}
                        <section>
                            <h3 className="font-black text-stone-400 uppercase tracking-widest text-sm flex items-center gap-2 mb-4 border-b border-stone-800 pb-2"><Sparkles className="w-4 h-4 text-amber-500" /> Techniques & Skills</h3>
                            <div className="space-y-3">
                                {mercenary.skillIds && mercenary.skillIds.length > 0 ? (
                                    mercenary.skillIds.map((id: string) => {
                                        const skill = SKILLS[id];
                                        return (
                                            <div key={id} className="bg-stone-950 border border-stone-800 p-4 rounded-2xl flex justify-between items-center group hover:border-amber-900/50 transition-all">
                                                <div className="flex gap-4 items-center">
                                                    <div className="p-2 bg-amber-900/20 rounded-xl border border-amber-600/30 text-amber-500 group-hover:bg-amber-600 group-hover:text-white transition-all"><Sword className="w-5 h-5" /></div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-stone-200 uppercase">{skill.name}</h4>
                                                        <p className="text-[10px] text-stone-500 italic">"{skill.description}"</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col gap-1">
                                                    <span className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-blue-900/30">{skill.mpCost} MP</span>
                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">{Math.round(skill.multiplier * 100)}% {skill.type} DMG</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-8 text-center border-2 border-dashed border-stone-800 rounded-2xl text-stone-600 text-xs font-bold uppercase tracking-widest">No active techniques learned</div>
                                )}
                            </div>
                        </section>

                        {/* Equipment Panel ... (기존 장비 로직 생략) */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export { MercenaryDetailModal };