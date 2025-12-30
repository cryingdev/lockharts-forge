import React, { useState } from 'react';
import { useGame } from '../../../context/GameContext';
import { createRandomMercenary, getUnmetNamedMercenary } from '../../../utils/mercenaryGenerator';
import { Heart, PlusCircle, Coins, Lock, CalendarClock, Map, Zap, UserPlus } from 'lucide-react';
import { CONTRACT_CONFIG, calculateHiringCost, calculateDailyWage } from '../../../config/contract-config';
import TavernInteraction from './TavernInteraction';
import { getAssetUrl } from '../../../utils';

// Component for the Battery Icon (Used in List View)
const EnergyBattery = ({ value }: { value: number }) => {
    let color = 'bg-emerald-500';
    if (value < 20) color = 'bg-red-500 animate-pulse';
    else if (value < 50) color = 'bg-amber-500';

    return (
        <div className="flex items-center gap-1.5" title={`Energy: ${value}%`}>
            <span className={`text-[10px] font-bold ${value < 20 ? 'text-red-400' : 'text-stone-500'}`}>
                {value}%
            </span>
            <div className="relative flex items-center">
                <div className="w-6 h-3 border border-stone-500 rounded-[2px] p-[1px] bg-stone-900 flex justify-start">
                    <div className={`h-full ${color} rounded-[1px] transition-all duration-500`} style={{ width: `${value}%` }}></div>
                </div>
                <div className="w-0.5 h-1.5 bg-stone-500 rounded-r-[1px]"></div>
            </div>
        </div>
    );
};

const TavernTab = () => {
    const { state, actions } = useGame();
    const { gold } = state.stats;
    const [selectedMercId, setSelectedMercId] = useState<string | null>(null);

    const handleScout = () => {
        let newMerc = getUnmetNamedMercenary(state.knownMercenaries);
        if (!newMerc) {
            newMerc = createRandomMercenary(state.stats.day);
        } else {
            newMerc = { ...newMerc, visitCount: 1, lastVisitDay: state.stats.day };
        }
        actions.addMercenary(newMerc);
    };

    const selectedMercenary = state.knownMercenaries.find(m => m.id === selectedMercId) || null;

    // Interaction mode if a mercenary is selected
    if (selectedMercenary) {
        return (
            <TavernInteraction 
                mercenary={selectedMercenary} 
                onBack={() => setSelectedMercId(null)} 
            />
        );
    }

    return (
        <div className="h-full w-full bg-stone-950 relative overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={getAssetUrl('tavern_bg.jpeg')} 
                    className="w-full h-full object-cover opacity-20 blur-[2px]"
                    alt="Background"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-950/80"></div>
            </div>

            <div className="relative z-10 h-full w-full p-6 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-stone-800 pb-6">
                    <div>
                        <h2 className="text-3xl font-black text-amber-500 font-serif tracking-tight">THE BROKEN ANVIL TAVERN</h2>
                        <p className="text-stone-400 mt-1">Wayfarers and regulars gather under the dim candlelight.</p>
                    </div>
                    <button 
                        onClick={handleScout}
                        className="group relative px-6 py-3 bg-stone-900 border border-stone-700 hover:border-amber-500 rounded-xl overflow-hidden transition-all hover:bg-stone-800 shadow-xl"
                    >
                        <div className="flex items-center gap-3">
                            <PlusCircle className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-stone-200 tracking-wide">WAIT FOR NEW FACES</span>
                        </div>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {state.knownMercenaries.map(merc => {
                        const isHired = merc.status === 'HIRED' || merc.status === 'ON_EXPEDITION' || merc.status === 'INJURED';
                        const energy = merc.expeditionEnergy || 0;
                        const isOnExpedition = merc.status === 'ON_EXPEDITION';
                        const xpPercent = Math.min(100, (merc.currentXp / merc.xpToNextLevel) * 100);

                        return (
                            <div 
                                key={merc.id} 
                                onClick={() => setSelectedMercId(merc.id)}
                                className={`group relative bg-stone-900 border ${isHired ? 'border-amber-900/50 hover:border-amber-500' : 'border-stone-800 hover:border-stone-600'} p-4 rounded-2xl flex flex-col gap-4 shadow-2xl transition-all cursor-pointer hover:-translate-y-1 active:scale-95`}
                            >
                                {/* Card Background Glow */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl bg-gradient-to-br ${isHired ? 'from-amber-500 to-transparent' : 'from-stone-500 to-transparent'}`}></div>

                                <div className="flex justify-between items-start z-10">
                                    <div className="flex gap-4">
                                        <div className="relative">
                                            <div className={`w-16 h-16 bg-stone-800 rounded-full border-2 ${isHired ? 'border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-stone-700'} flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-105`}>
                                                {merc.icon || '👤'}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 text-[10px] font-mono font-bold text-stone-400">
                                                LV.{merc.level}
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h3 className="font-bold text-stone-100 text-lg leading-tight group-hover:text-amber-400 transition-colors">{merc.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-stone-500 uppercase font-black tracking-widest">{merc.job}</span>
                                                {merc.isUnique && <span className="text-[8px] text-amber-500 font-bold bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-900/20">NAMED</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        {isHired && <EnergyBattery value={energy} />}
                                        <div className="flex items-center gap-1 text-[10px] bg-stone-950/50 px-2 py-1 rounded-full border border-stone-800">
                                            <Heart className={`w-3 h-3 ${merc.affinity > 0 ? 'text-pink-500 fill-pink-500' : 'text-stone-700'}`} />
                                            <span className="font-bold text-stone-300">{merc.affinity}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 z-10">
                                    <div className="flex justify-between text-[10px] font-black text-stone-600 uppercase tracking-tighter">
                                        <span>Experience</span>
                                        <span>{Math.floor(xpPercent)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800/50">
                                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${xpPercent}%` }}></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-1 z-10">
                                    {isHired ? (
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${isOnExpedition ? 'bg-blue-900/30 text-blue-400' : 'bg-amber-900/30 text-amber-500'}`}>
                                            {isOnExpedition ? 'On Expedition' : 'In Service'}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-stone-800 text-stone-500">
                                            Visitor
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1.5 text-stone-500 group-hover:text-amber-500 transition-colors">
                                        <span className="text-[10px] font-bold uppercase">Interact</span>
                                        <UserPlus className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {state.knownMercenaries.length === 0 && (
                         <div className="col-span-full py-24 text-center">
                            <div className="w-24 h-24 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-800">
                                <Map className="w-10 h-10 text-stone-700" />
                            </div>
                            <p className="text-stone-500 italic font-serif text-lg">The tavern is quiet today. No regulars have arrived yet.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TavernTab;