
import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../../context/GameContext';
import { createRandomMercenary, getUnmetNamedMercenary } from '../../../utils/mercenaryGenerator';
import { PlusCircle, UserPlus, ShieldAlert, ChevronUp, Map, Beer, Users, UserRound, Skull, Activity, Heart, Zap, Sword } from 'lucide-react';
import TavernInteraction from './TavernInteraction';
import { getAssetUrl } from '../../../utils';
import { Mercenary } from '../../../models/Mercenary';
import { calculateMercenaryPower } from '../../../utils/combatLogic';

const EnergyBattery = ({ value }: { value: number }) => {
    let color = 'bg-emerald-500';
    if (value < 20) {
        color = 'bg-red-500 animate-pulse';
    } else if (value < 50) {
        color = 'bg-amber-500';
    }

    // 5 segments
    const segments = [20, 40, 60, 80, 100];

    return (
        <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-fit">
            <Zap className={`w-2.5 h-2.5 ${value < 20 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
            <div className="flex items-center gap-0.5 h-2 px-0.5 border-x border-stone-700/50">
                {segments.map((threshold, idx) => (
                    <div 
                        key={idx}
                        className={`h-1.5 w-1 rounded-[0.5px] transition-all duration-500 ${value >= threshold ? color : 'bg-stone-800'}`}
                    />
                ))}
            </div>
        </div>
    );
};

const MiniVitals = ({ current, max, colorClass }: { current: number, max: number, colorClass: string }) => {
    const percent = Math.min(100, Math.max(0, (current / (max || 1)) * 100));
    return (
        <div className="w-full bg-stone-950 h-0.5 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${percent}%` }} />
        </div>
    );
};

const MercenaryCard: React.FC<{ merc: Mercenary, onClick: () => void, isHired: boolean }> = ({ merc, onClick, isHired }) => {
    const hasUnallocated = isHired && (merc.bonusStatPoints || 0) > 0;
    const xpPer = (merc.currentXp / (merc.xpToNextLevel || 100)) * 100;
    const cp = calculateMercenaryPower(merc);

    return (
        <div onClick={onClick} className={`group relative bg-stone-900 border-2 ${isHired ? 'border-amber-600/20 hover:border-amber-500/50 shadow-lg' : 'border-stone-800 hover:border-stone-700'} p-2 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${merc.status === 'DEAD' ? 'opacity-40 grayscale' : ''}`}>
            {/* Top Row: Avatar & Mini Tags */}
            <div className="flex justify-between items-start mb-2">
                <div className="relative">
                    <div className={`w-11 h-11 bg-stone-800 rounded-xl border-2 ${merc.status === 'ON_EXPEDITION' ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : isHired ? 'border-amber-600/40' : 'border-stone-700'} flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform`}>
                        {merc.status === 'DEAD' ? '💀' : merc.icon}
                    </div>
                    {hasUnallocated && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-stone-900 p-0.5 rounded shadow-lg animate-bounce border border-stone-950 z-10">
                            <ChevronUp className="w-2.5 h-2.5 font-black" />
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col items-end gap-1">
                    {/* Affinity Tag */}
                    <div className="flex items-center gap-1 bg-pink-950/20 px-1.5 py-0 rounded-full border border-pink-900/30">
                        <Heart className="w-2.5 h-2.5 fill-pink-500 text-pink-500" />
                        <span className="text-[9px] font-mono text-pink-400 font-black">{merc.affinity}</span>
                    </div>

                    {/* Combat Power Tag (New) */}
                    <div className="flex items-center gap-1 bg-amber-950/20 px-1.5 py-0 rounded border border-amber-900/30">
                        <Sword className="w-2.5 h-2.5 text-amber-500" />
                        <span className="text-[9px] font-mono text-amber-400 font-black">{cp}</span>
                    </div>
                    
                    {/* Level Tag */}
                    <div className="bg-stone-950 px-1.5 py-0 rounded border border-stone-800 text-[9px] font-mono text-stone-500 font-bold">
                        LV.{merc.level}
                    </div>
                </div>
            </div>

            {/* Middle: Name & Job Tags */}
            <div className="space-y-1 mb-2">
                <h3 className="font-black text-xs text-stone-200 truncate leading-tight group-hover:text-amber-200 transition-colors">{merc.name}</h3>
                <div className="flex flex-wrap gap-1">
                    <span className="bg-stone-950/80 px-1 py-0 rounded text-[7px] font-black text-stone-500 uppercase tracking-tighter border border-white/5">{merc.job}</span>
                    <span className={`px-1 py-0 rounded text-[7px] font-black uppercase border leading-none ${
                        merc.status === 'ON_EXPEDITION' ? 'bg-blue-900/40 border-blue-700 text-blue-300' : 
                        merc.status === 'INJURED' ? 'bg-red-900/40 border-red-700 text-red-300' : 
                        merc.status === 'DEAD' ? 'bg-black border-stone-800 text-stone-600' :
                        isHired ? 'bg-amber-900/30 border-amber-700/30 text-amber-400/80' : 
                        'bg-stone-800 border-stone-700 text-stone-500'
                    }`}>
                        {merc.status === 'ON_EXPEDITION' ? 'Duty' : 
                         merc.status === 'INJURED' ? 'Recov' : 
                         merc.status === 'DEAD' ? 'KIA' : 
                         isHired ? 'SQUAD' : 'VISIT'}
                    </span>
                </div>
            </div>

            {/* Vitals: Energy Battery (Slim Style) */}
            {isHired && merc.status !== 'DEAD' && (
                <div className="mb-2">
                    <EnergyBattery value={merc.expeditionEnergy} />
                </div>
            )}

            {/* Bottom: Slim Mini Vitals Bars */}
            <div className="space-y-1 pt-1.5 border-t border-white/5">
                <div className="flex justify-between items-center text-[7px] font-mono text-stone-600 px-0.5">
                    <span className="flex items-center gap-1">HP</span>
                    <span className="font-black">{Math.floor(merc.currentHp)}</span>
                </div>
                <div className="w-full bg-stone-950 h-0.5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600/80 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (merc.currentHp / (merc.maxHp || 1)) * 100))}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-[7px] font-mono text-stone-600 px-0.5">
                    <span className="flex items-center gap-1">MP</span>
                    <span className="font-black">{Math.floor(merc.currentMp)}</span>
                </div>
                <div className="w-full bg-stone-950 h-0.5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600/80 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (merc.currentMp / (merc.maxMp || 1)) * 100))}%` }} />
                </div>
            </div>

            {/* XP Footer with EXP Label */}
            <div className="mt-2 flex items-center gap-1 bg-stone-950/30 p-0.5 rounded">
                <span className="text-[6px] font-black text-stone-600 uppercase ml-0.5 shrink-0">EXP</span>
                <div className="flex-1 h-0.5 bg-stone-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500/40" style={{ width: `${xpPer}%` }} />
                </div>
                <span className="text-[6px] font-black text-stone-700 font-mono mr-0.5">{Math.round(xpPer)}%</span>
            </div>
        </div>
    );
};

const TavernTab = ({ activeTab }: { activeTab?: string }) => {
    const { state, actions } = useGame();
    const [selectedMercId, setSelectedMercId] = useState<string | null>(null);

    useEffect(() => { if (activeTab !== 'TAVERN') setSelectedMercId(null); }, [activeTab]);

    const handleScout = () => {
        if (state.stats.gold < 50) { actions.showToast("Not enough gold."); return; }
        let newMerc = getUnmetNamedMercenary(state.knownMercenaries) || createRandomMercenary(state.stats.day);
        actions.scoutMercenary(newMerc, 50);
    };

    const groupedMercs = useMemo(() => {
        const hired = state.knownMercenaries.filter(m => ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status));
        const visitors = state.knownMercenaries.filter(m => !['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status));
        return { hired, visitors };
    }, [state.knownMercenaries]);

    const selectedMercenary = state.knownMercenaries.find(m => m.id === selectedMercId);
    if (selectedMercenary) return < TavernInteraction mercenary={selectedMercenary} onBack={() => setSelectedMercId(null)} />;

    return (
        <div className="h-full w-full bg-stone-950 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"><img src={getAssetUrl('tavern_bg.jpeg')} className="w-full h-full object-cover blur-[2px]" /></div>
            <div className="relative z-10 h-full p-3 md:p-5 overflow-y-auto custom-scrollbar flex flex-col gap-6 pb-20">
                
                {/* Header Toolbar */}
                <div className="flex justify-between items-end border-b border-stone-800 pb-3 shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-amber-500 font-serif leading-none uppercase tracking-tighter">The Broken Anvil</h2>
                        <p className="text-stone-600 text-[8px] md:text-[10px] mt-1 uppercase tracking-widest font-bold">Wayfarers gather here.</p>
                    </div>
                    <button onClick={handleScout} className="bg-stone-900 border border-stone-700 px-4 py-1.5 rounded-lg text-stone-300 flex items-center gap-2 hover:border-amber-500 transition-all shadow-md active:scale-95 group">
                        <PlusCircle className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="text-[10px] font-black uppercase tracking-tight">Scout (50G)</span>
                    </button>
                </div>

                {/* SECTION 1: HIRED SQUAD */}
                <section className="animate-in fade-in slide-in-from-left-2 duration-500">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-3.5 h-3.5 text-amber-500" />
                        <h3 className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-[0.2em] font-serif italic">Your Squad</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-stone-800 to-transparent"></div>
                        <span className="text-[9px] font-mono text-stone-600 uppercase font-black">{groupedMercs.hired.length}/12</span>
                    </div>

                    {groupedMercs.hired.length === 0 ? (
                        <div className="py-8 border-2 border-dashed border-stone-800 rounded-xl flex flex-col items-center justify-center text-stone-700 gap-2">
                            <ShieldAlert className="w-8 h-8 opacity-20" />
                            <p className="text-[9px] uppercase font-black tracking-widest opacity-50">No active contracts.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                            {groupedMercs.hired.map(merc => (
                                <MercenaryCard key={merc.id} merc={merc} isHired={true} onClick={() => setSelectedMercId(merc.id)} />
                            ))}
                        </div>
                    )}
                </section>

                {/* SECTION 2: VISITORS */}
                <section className="animate-in fade-in slide-in-from-left-2 duration-700 delay-100">
                    <div className="flex items-center gap-2 mb-3">
                        <UserRound className="w-3.5 h-3.5 text-stone-500" />
                        <h3 className="text-[10px] md:text-xs font-black text-stone-500 uppercase tracking-[0.2em] font-serif italic">Visitors</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-stone-800 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                        {groupedMercs.visitors.map(merc => (
                            <MercenaryCard key={merc.id} merc={merc} isHired={false} onClick={() => merc.status !== 'DEAD' && setSelectedMercId(merc.id)} />
                        ))}
                        {/* Placeholder for scouting */}
                        <button 
                            onClick={handleScout}
                            className="bg-stone-950/30 border-2 border-dashed border-stone-800/50 rounded-xl flex flex-col items-center justify-center gap-1.5 text-stone-700 hover:text-stone-500 hover:border-stone-700 transition-all min-h-[140px]"
                        >
                            <PlusCircle className="w-6 h-6 opacity-20" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Find Talent</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TavernTab;
