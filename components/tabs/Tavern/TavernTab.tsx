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
        <div className="flex items-center gap-1" title={`Energy: ${value}%`}>
            <span className={`text-[9px] font-bold ${value < 20 ? 'text-red-400' : 'text-stone-500'}`}>
                {value}%
            </span>
            <div className="relative flex items-center">
                <div className="w-5 h-2.5 border border-stone-500 rounded-[2px] p-[1px] bg-stone-900 flex justify-start">
                    <div className={`h-full ${color} rounded-[1px] transition-all duration-500`} style={{ width: `${value}%` }}></div>
                </div>
                <div className="w-0.5 h-1 bg-stone-500 rounded-r-[1px]"></div>
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

            <div className="relative z-10 h-full w-full p-3 md:p-6 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-4 md:mb-8 gap-3 border-b border-stone-800 pb-4 md:pb-6">
                    <div>
                        <h2 className="text-xl md:text-3xl font-black text-amber-500 font-serif tracking-tight">THE BROKEN ANVIL</h2>
                        <p className="text-stone-500 text-[10px] md:text-sm mt-0.5">Wayfarers gather under the dim candlelight.</p>
                    </div>
                    <button 
                        onClick={handleScout}
                        className="group relative px-4 py-2 bg-stone-900 border border-stone-700 hover:border-amber-500 rounded-xl overflow-hidden transition-all hover:bg-stone-800 shadow-xl"
                    >
                        <div className="flex items-center gap-2">
                            <PlusCircle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-stone-200 text-xs md:text-sm tracking-wide uppercase">New Faces</span>
                        </div>
                    </button>
                </div>

                {/* Modified Grid Layout: 2 cols on very small, 3 cols on mobile landscape (xs), 4 cols on lg */}
                <div className="grid grid-cols-2 xs:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {state.knownMercenaries.map(merc => {
                        const isHired = merc.status === 'HIRED' || merc.status === 'ON_EXPEDITION' || merc.status === 'INJURED';
                        const energy = merc.expeditionEnergy || 0;
                        const isOnExpedition = merc.status === 'ON_EXPEDITION';
                        const xpPercent = Math.min(100, (merc.currentXp / merc.xpToNextLevel) * 100);

                        return (
                            <div 
                                key={merc.id} 
                                onClick={() => setSelectedMercId(merc.id)}
                                className={`group relative bg-stone-900 border ${isHired ? 'border-amber-900/50 hover:border-amber-500' : 'border-stone-800 hover:border-stone-600'} p-3 md:p-4 rounded-2xl flex flex-col gap-2 md:gap-4 shadow-2xl transition-all cursor-pointer hover:-translate-y-1 active:scale-95 min-w-0`}
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl bg-gradient-to-br ${isHired ? 'from-amber-500 to-transparent' : 'from-stone-500 to-transparent'}`}></div>

                                <div className="flex justify-between items-start z-10 gap-2">
                                    <div className="flex gap-2 md:gap-4 min-w-0 flex-1">
                                        <div className="relative shrink-0">
                                            <div className={`w-10 h-10 md:w-16 md:h-16 bg-stone-800 rounded-full border-2 ${isHired ? 'border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-stone-700'} flex items-center justify-center text-xl md:text-3xl shadow-inner transition-transform group-hover:scale-105`}>
                                                {merc.icon || '👤'}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-stone-950 px-1 py-0.5 rounded border border-stone-800 text-[8px] md:text-[10px] font-mono font-bold text-stone-400">
                                                L{merc.level}
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center min-w-0 overflow-hidden">
                                            <h3 className="font-bold text-stone-100 text-xs md:text-lg leading-tight group-hover:text-amber-400 transition-colors truncate">{merc.name}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[7px] md:text-[10px] text-stone-500 uppercase font-black tracking-widest truncate">{merc.job}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        {isHired && <EnergyBattery value={energy} />}
                                        <div className="flex items-center gap-0.5 text-[8px] md:text-[10px] bg-stone-950/50 px-1.5 py-0.5 rounded-full border border-stone-800 text-stone-400 font-bold">
                                            <Heart className={`w-2.5 h-2.5 ${merc.affinity > 0 ? 'text-pink-500 fill-pink-500' : 'text-stone-700'}`} />
                                            <span>{merc.affinity}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 z-10 mt-auto">
                                    <div className="w-full h-1 bg-stone-950 rounded-full overflow-hidden border border-stone-800/50">
                                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${xpPercent}%` }}></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-1 z-10 gap-1">
                                    {isHired ? (
                                        <span className={`text-[7px] md:text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded truncate ${isOnExpedition ? 'bg-blue-900/30 text-blue-400' : 'bg-amber-900/30 text-amber-500'}`}>
                                            {isOnExpedition ? 'Exploring' : 'Hired'}
                                        </span>
                                    ) : (
                                        <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-stone-800 text-stone-600">
                                            Visitor
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 text-stone-500 group-hover:text-amber-500 transition-colors shrink-0">
                                        <UserPlus className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {state.knownMercenaries.length === 0 && (
                         <div className="col-span-full py-24 text-center">
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-800">
                                <Map className="w-8 h-8 md:w-10 md:h-10 text-stone-700" />
                            </div>
                            <p className="text-stone-500 italic font-serif text-base md:text-lg">The tavern is quiet today...</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TavernTab;