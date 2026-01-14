
import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../../context/GameContext';
import { createRandomMercenary, getUnmetNamedMercenary } from '../../../utils/mercenaryGenerator';
import { PlusCircle, UserPlus, ShieldAlert, ChevronUp, Map, Beer, Users, UserRound, Skull, Activity, Heart, Zap } from 'lucide-react';
import TavernInteraction from './TavernInteraction';
import { getAssetUrl } from '../../../utils';
import ConfirmationModal from '../../modals/ConfirmationModal';
import { Mercenary } from '../../../models/Mercenary';

const EnergyBattery = ({ value }: { value: number }) => {
    let color = 'bg-emerald-500';
    if (value < 20) color = 'bg-red-500 animate-pulse';
    else if (value < 50) color = 'bg-amber-500';
    return (
        <div className="flex items-center gap-1">
            <span className={`text-[9px] font-bold ${value < 20 ? 'text-red-400' : 'text-stone-500'}`}>{value}%</span>
            <div className="w-5 h-2.5 border border-stone-500 rounded-[2px] p-[1px] bg-stone-900">
                <div className={`h-full ${color} rounded-[1px] transition-all`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );
};

const MiniVitals = ({ current, max, colorClass }: { current: number, max: number, colorClass: string }) => {
    const percent = Math.min(100, Math.max(0, (current / (max || 1)) * 100));
    return (
        <div className="w-full bg-stone-950 h-1 rounded-full overflow-hidden border border-white/5">
            <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${percent}%` }} />
        </div>
    );
};

const MercenaryCard: React.FC<{ merc: Mercenary, onClick: () => void, isHired: boolean }> = ({ merc, onClick, isHired }) => {
    const hasUnallocated = isHired && (merc.bonusStatPoints || 0) > 0;
    const xpPer = (merc.currentXp / (merc.xpToNextLevel || 100)) * 100;

    return (
        <div onClick={onClick} className={`group relative bg-stone-900 border ${isHired ? 'border-amber-900/50 hover:border-amber-500 shadow-lg shadow-black/40' : 'border-stone-800 hover:border-stone-600'} p-3 rounded-2xl cursor-pointer transition-all ${merc.status === 'DEAD' ? 'opacity-40 grayscale' : ''}`}>
            {/* Top Row: Avatar & Metadata */}
            <div className="flex justify-between items-start mb-2">
                <div className="relative">
                    <div className={`w-12 h-12 bg-stone-800 rounded-full border-2 ${merc.status === 'ON_EXPEDITION' ? 'border-blue-500' : isHired ? 'border-amber-600' : 'border-stone-700'} flex items-center justify-center text-2xl shadow-inner`}>
                        {merc.status === 'DEAD' ? '💀' : merc.icon}
                    </div>
                    {hasUnallocated && (
                        <div className="absolute -top-1 -left-1 bg-amber-500 text-stone-900 p-0.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-bounce border border-stone-950 z-10">
                            <ChevronUp className="w-3 h-3 font-black" />
                        </div>
                    )}
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                        <span className="text-[8px] font-black text-stone-500 uppercase tracking-tighter">Affinity</span>
                        <span className="text-[10px] font-mono text-pink-500 font-black">{merc.affinity}</span>
                    </div>
                    <div className="text-[9px] font-mono text-stone-500 font-bold">LV.{merc.level}</div>
                    {isHired && merc.status !== 'DEAD' && <EnergyBattery value={merc.expeditionEnergy} />}
                </div>
            </div>

            {/* Middle: Identification */}
            <h3 className="font-bold text-xs text-stone-100 truncate leading-tight">{merc.name}</h3>
            <div className="text-[8px] text-stone-500 uppercase font-black tracking-widest mb-2">{merc.job}</div>

            {/* Vitals: HP & MP Bars */}
            <div className="space-y-1 mb-2">
                <div className="flex justify-between items-center text-[7px] font-black uppercase text-stone-600 px-0.5">
                    <span>HP</span>
                    <span>{Math.floor(merc.currentHp)}/{merc.maxHp}</span>
                </div>
                <MiniVitals current={merc.currentHp} max={merc.maxHp} colorClass="bg-red-600" />
                
                <div className="flex justify-between items-center text-[7px] font-black uppercase text-stone-600 px-0.5">
                    <span>MP</span>
                    <span>{Math.floor(merc.currentMp)}/{merc.maxMp}</span>
                </div>
                <MiniVitals current={merc.currentMp} max={merc.maxMp} colorClass="bg-blue-600" />
            </div>

            {/* Bottom: XP & Status */}
            <div className="pt-1 border-t border-white/5">
                <div className="flex justify-between items-center text-[7px] font-bold text-stone-500 uppercase mb-1 px-0.5">
                    <span>EXP</span>
                    <span>{Math.round(xpPer)}%</span>
                </div>
                <div className="w-full h-1 bg-stone-950 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${xpPer}%` }} />
                </div>
                
                <div className="flex justify-center">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        merc.status === 'ON_EXPEDITION' ? 'bg-blue-900/20 border-blue-800 text-blue-400' : 
                        merc.status === 'INJURED' ? 'bg-red-900/20 border-red-800 text-red-400' : 
                        merc.status === 'DEAD' ? 'bg-black border-stone-800 text-stone-600' :
                        isHired ? 'bg-amber-900/20 border-amber-800 text-amber-500' : 
                        'bg-stone-800 border-stone-700 text-stone-500'
                    }`}>
                        {merc.status === 'ON_EXPEDITION' ? 'Exploring' : 
                         merc.status === 'INJURED' ? 'Injured' : 
                         merc.status === 'DEAD' ? 'Dead' : 
                         isHired ? 'Contracted' : 'Visitor'}
                    </span>
                </div>
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
            <div className="absolute inset-0 opacity-20"><img src={getAssetUrl('tavern_bg.jpeg')} className="w-full h-full object-cover blur-[2px]" /></div>
            <div className="relative z-10 h-full p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8 pb-20">
                
                {/* Header Toolbar */}
                <div className="flex justify-between items-end border-b border-stone-800 pb-4 shrink-0">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-amber-500 font-serif leading-none">THE BROKEN ANVIL</h2>
                        <p className="text-stone-500 text-[10px] md:text-xs mt-1 uppercase tracking-widest font-bold">Wayfarers gather under the candlelight.</p>
                    </div>
                    <button onClick={handleScout} className="bg-stone-900 border border-stone-700 px-5 py-2.5 rounded-xl text-stone-200 flex items-center gap-2 hover:border-amber-500 transition-all shadow-xl active:scale-95 group">
                        <PlusCircle className="w-4 h-4 text-amber-500 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="text-xs font-black uppercase tracking-tight">Scout (50G)</span>
                    </button>
                </div>

                {/* SECTION 1: HIRED SQUAD */}
                <section className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 bg-amber-900/20 rounded-lg border border-amber-900/30">
                            <Users className="w-4 h-4 text-amber-500" />
                        </div>
                        <h3 className="text-sm md:text-lg font-black text-stone-300 uppercase tracking-[0.2em] font-serif italic">Your Squad Members</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-stone-800 to-transparent"></div>
                        <span className="text-[10px] font-mono text-stone-600 uppercase font-black">{groupedMercs.hired.length} / 12</span>
                    </div>

                    {groupedMercs.hired.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-stone-800 rounded-2xl flex flex-col items-center justify-center text-stone-700 gap-3">
                            <ShieldAlert className="w-10 h-10 opacity-20" />
                            <p className="text-[10px] md:text-xs uppercase font-black tracking-widest">No active contracts. Recruit from visitors below.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 xs:grid-cols-3 lg:grid-cols-4 gap-4">
                            {groupedMercs.hired.map(merc => (
                                <MercenaryCard key={merc.id} merc={merc} isHired={true} onClick={() => setSelectedMercId(merc.id)} />
                            ))}
                        </div>
                    )}
                </section>

                {/* SECTION 2: VISITORS & KNOWN RECURS */}
                <section className="animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 bg-stone-800 rounded-lg border border-stone-700">
                            <UserRound className="w-4 h-4 text-stone-400" />
                        </div>
                        <h3 className="text-sm md:text-lg font-black text-stone-500 uppercase tracking-[0.2em] font-serif italic">Tavern Visitors</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-stone-800 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-2 xs:grid-cols-3 lg:grid-cols-4 gap-4">
                        {groupedMercs.visitors.map(merc => (
                            <MercenaryCard key={merc.id} merc={merc} isHired={false} onClick={() => merc.status !== 'DEAD' && setSelectedMercId(merc.id)} />
                        ))}
                        {/* Placeholder for scouting */}
                        <button 
                            onClick={handleScout}
                            className="bg-stone-950/40 border-2 border-dashed border-stone-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-700 hover:text-stone-500 hover:border-stone-600 transition-all min-h-[140px]"
                        >
                            <PlusCircle className="w-8 h-8 opacity-20" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Find New Talent</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TavernTab;
