import React, { useState, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import { createRandomMercenary, getUnmetNamedMercenary } from '../../../utils/mercenaryGenerator';
import { Heart, PlusCircle, UserPlus, ShieldAlert, ChevronUp, Map, Beer } from 'lucide-react';
import TavernInteraction from './TavernInteraction';
import { getAssetUrl } from '../../../utils';
import ConfirmationModal from '../../modals/ConfirmationModal';

const EnergyBattery = ({ value }: { value: number }) => {
    let color = 'bg-emerald-500';
    if (value < 20) color = 'bg-red-500 animate-pulse';
    else if (value < 50) color = 'bg-amber-500';
    return (
        <div className="flex items-center gap-1">
            <span className={`text-[9px] font-bold ${value < 20 ? 'text-red-400' : 'text-stone-500'}`}>{value}%</span>
            <div className="w-5 h-2.5 border border-stone-500 rounded-[2px] p-[1px] bg-stone-900"><div className={`h-full ${color} rounded-[1px] transition-all`} style={{ width: `${value}%` }}></div></div>
        </div>
    );
};

const TavernTab = ({ activeTab }: { activeTab?: string }) => {
    const { state, actions } = useGame();
    const [selectedMercId, setSelectedMercId] = useState<string | null>(null);
    const [mercToRecall, setMercToRecall] = useState<string | null>(null);

    useEffect(() => { if (activeTab !== 'TAVERN') setSelectedMercId(null); }, [activeTab]);

    const handleScout = () => {
        if (state.stats.gold < 50) { actions.showToast("Not enough gold."); return; }
        let newMerc = getUnmetNamedMercenary(state.knownMercenaries) || createRandomMercenary(state.stats.day);
        actions.scoutMercenary(newMerc, 50);
    };

    const selectedMercenary = state.knownMercenaries.find(m => m.id === selectedMercId);
    if (selectedMercenary) return <TavernInteraction mercenary={selectedMercenary} onBack={() => setSelectedMercId(null)} />;

    return (
        <div className="h-full w-full bg-stone-950 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20"><img src={getAssetUrl('tavern_bg.jpeg')} className="w-full h-full object-cover blur-[2px]" /></div>
            <div className="relative z-10 h-full p-4 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
                    <div><h2 className="text-2xl font-black text-amber-500 font-serif">THE BROKEN ANVIL</h2><p className="text-stone-500 text-xs">Wayfarers gather under the candlelight.</p></div>
                    <button onClick={handleScout} className="bg-stone-900 border border-stone-700 px-4 py-2 rounded-xl text-stone-200 flex items-center gap-2 hover:border-amber-500 transition-all">
                        <PlusCircle className="w-4 h-4 text-amber-500" /><span className="text-xs font-bold uppercase">Scout (50G)</span>
                    </button>
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-3 lg:grid-cols-4 gap-4">
                    {state.knownMercenaries.map(merc => {
                        const isHired = ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(merc.status);
                        const pointsUsed = Object.values(merc.allocatedStats).reduce((a, b) => a + b, 0);
                        const hasUnallocated = isHired && (merc.level - 1) * 3 > pointsUsed;
                        const xpPer = (merc.currentXp / merc.xpToNextLevel) * 100;

                        return (
                            <div key={merc.id} onClick={() => merc.status !== 'DEAD' && setSelectedMercId(merc.id)} className={`group relative bg-stone-900 border ${isHired ? 'border-amber-900/50 hover:border-amber-500' : 'border-stone-800 hover:border-stone-600'} p-3 rounded-2xl cursor-pointer transition-all ${merc.status === 'DEAD' ? 'opacity-40 grayscale' : ''}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="relative">
                                        <div className={`w-12 h-12 bg-stone-800 rounded-full border-2 ${merc.status === 'ON_EXPEDITION' ? 'border-blue-500' : isHired ? 'border-amber-600' : 'border-stone-700'} flex items-center justify-center text-2xl shadow-inner`}>
                                            {merc.status === 'DEAD' ? '💀' : merc.icon}
                                        </div>
                                        {hasUnallocated && (
                                            <div className="absolute -top-1 -left-1 bg-amber-500 text-stone-900 p-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-bounce border border-stone-950">
                                                <ChevronUp className="w-3 h-3 font-black" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-mono text-stone-500 font-bold">LV.{merc.level}</div>
                                        {isHired && <EnergyBattery value={merc.expeditionEnergy} />}
                                    </div>
                                </div>
                                <h3 className="font-bold text-xs text-stone-100 truncate mb-1">{merc.name}</h3>
                                <div className="text-[9px] text-stone-500 uppercase font-black tracking-widest mb-2">{merc.job}</div>
                                <div className="w-full h-1 bg-stone-950 rounded-full overflow-hidden mb-2"><div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${xpPer}%` }} /></div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${merc.status === 'ON_EXPEDITION' ? 'bg-blue-900/30 text-blue-400' : isHired ? 'bg-amber-900/30 text-amber-500' : 'bg-stone-800 text-stone-500'}`}>
                                        {merc.status === 'ON_EXPEDITION' ? 'Exploring' : isHired ? 'Hired' : 'Visitor'}
                                    </span>
                                    <Heart className={`w-3 h-3 ${merc.affinity > 20 ? 'text-pink-500 fill-pink-500' : 'text-stone-700'}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TavernTab;