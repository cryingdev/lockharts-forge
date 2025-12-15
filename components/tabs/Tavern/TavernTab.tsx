
import React, { useState } from 'react';
import { useGame } from '../../../context/GameContext';
import { createRandomMercenary, getUnmetNamedMercenary } from '../../../utils/mercenaryGenerator';
import { Heart, PlusCircle, Coins, Lock, CalendarClock, XCircle } from 'lucide-react';
import { CONTRACT_CONFIG, calculateHiringCost, calculateDailyWage } from '../../../config/contract-config';
import ConfirmationModal from '../../modals/ConfirmationModal';

const TavernTab = () => {
    const { state, actions } = useGame();
    const { gold } = state.stats;

    // Local state for confirmation modal
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; mercId: string | null; mercName: string }>({
        isOpen: false,
        mercId: null,
        mercName: ''
    });

    const handleScout = () => {
        let newMerc = getUnmetNamedMercenary(state.knownMercenaries);
        if (!newMerc) {
            newMerc = createRandomMercenary(state.stats.day);
        } else {
            newMerc = { ...newMerc, visitCount: 1, lastVisitDay: state.stats.day };
        }
        actions.addMercenary(newMerc);
    };

    const handleHire = (mercId: string, cost: number) => {
        actions.hireMercenary(mercId, cost);
    };

    const initiateFire = (e: React.MouseEvent, mercId: string, mercName: string) => {
        e.stopPropagation();
        setConfirmModal({
            isOpen: true,
            mercId,
            mercName
        });
    };

    const confirmFire = () => {
        if (confirmModal.mercId) {
            actions.fireMercenary(confirmModal.mercId);
        }
        setConfirmModal({ isOpen: false, mercId: null, mercName: '' });
    };

    const cancelFire = () => {
        setConfirmModal({ isOpen: false, mercId: null, mercName: '' });
    };

    // Component for the Battery Icon
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

    return (
        <div className="h-full w-full bg-stone-900 p-6 overflow-y-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-amber-500 font-serif">The Broken Anvil Tavern</h2>
                    <p className="text-stone-400">Wayfarers, regulars, and potential companions gather here.</p>
                </div>
                <button 
                    onClick={handleScout}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded flex items-center gap-2 shadow-lg transition-colors border border-stone-600"
                >
                    <PlusCircle className="w-4 h-4" />
                    <span className="font-bold text-sm">Wait for New Faces</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.knownMercenaries.map(merc => {
                    const hiringCost = calculateHiringCost(merc.level, merc.job);
                    const dailyWage = calculateDailyWage(merc.level, merc.job);
                    const canAfford = gold >= hiringCost;
                    const hasAffinity = merc.affinity >= CONTRACT_CONFIG.HIRE_AFFINITY_THRESHOLD;
                    const isHired = merc.isHired;
                    const energy = merc.expeditionEnergy || 0;
                    
                    // XP Calculation
                    const xpPercent = Math.min(100, (merc.currentXp / merc.xpToNextLevel) * 100);

                    return (
                        <div key={merc.id} className={`bg-stone-800 border ${isHired ? 'border-amber-600/50' : 'border-stone-700'} p-3 rounded-xl flex flex-col gap-3 shadow-lg hover:border-stone-500 transition-colors relative overflow-hidden group`}>
                            
                            {/* Top Right Status (Battery / Hired) */}
                            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                                {isHired && (
                                    <div className="flex items-center gap-2 bg-stone-950/80 px-2 py-1 rounded-md border border-stone-800 backdrop-blur-sm">
                                        <span className="text-[10px] text-amber-500 font-bold tracking-wider">HIRED</span>
                                        <div className="w-px h-3 bg-stone-700"></div>
                                        <EnergyBattery value={energy} />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                {/* Left Column: Avatar & Level & XP */}
                                <div className="shrink-0 flex flex-col items-center gap-1.5">
                                     <div className={`w-14 h-14 bg-stone-900 rounded-full border-2 ${isHired ? 'border-amber-600' : 'border-stone-600'} flex items-center justify-center text-2xl shadow-inner`}>
                                        {merc.icon || '👤'}
                                     </div>
                                     
                                     <div className="w-full flex flex-col gap-0.5">
                                         <div className="text-center text-[10px] bg-stone-950 rounded py-0.5 text-stone-400 font-mono font-bold border border-stone-800">
                                             LVL {merc.level}
                                         </div>
                                         {/* Compact XP Bar under Level */}
                                         <div className="w-full h-1 bg-stone-950 rounded-full overflow-hidden" title={`XP: ${merc.currentXp}/${merc.xpToNextLevel}`}>
                                             <div className="h-full bg-blue-500" style={{ width: `${xpPercent}%` }}></div>
                                         </div>
                                     </div>
                                </div>

                                {/* Right Column: Info & Stats */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex justify-between items-start pr-20"> {/* pr-20 to avoid overlap with battery */}
                                        <h3 className="font-bold text-stone-200 truncate text-sm leading-tight">{merc.name}</h3>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] text-stone-500 uppercase tracking-wide font-bold">{merc.job}</span>
                                        {merc.isUnique && <span className="text-[9px] text-amber-600 font-bold bg-amber-950/30 px-1 rounded border border-amber-900/30">NAMED</span>}
                                        
                                        {/* Affinity Inline */}
                                        <div className="flex items-center gap-0.5 text-[10px]" title={`Affinity: ${merc.affinity}`}>
                                            <Heart className={`w-2.5 h-2.5 ${merc.affinity > 0 ? 'text-pink-500 fill-pink-500' : 'text-stone-700'}`} />
                                            <span className={`${merc.affinity >= CONTRACT_CONFIG.HIRE_AFFINITY_THRESHOLD ? 'text-pink-400' : 'text-stone-600'}`}>
                                                {merc.affinity}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stacked Vitals (HP/MP) */}
                                    <div className="flex flex-col gap-1 mb-2">
                                        <div className="flex items-center gap-1.5 text-[9px] text-stone-500 font-bold">
                                            <span className="w-3">HP</span>
                                            <div className="flex-1 h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800/50">
                                                <div className="h-full bg-red-600" style={{ width: '100%' }}></div>
                                            </div>
                                            <span className="w-5 text-right">{merc.maxHp}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] text-stone-500 font-bold">
                                            <span className="w-3">MP</span>
                                            <div className="flex-1 h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800/50">
                                                <div className="h-full bg-blue-600" style={{ width: '100%' }}></div>
                                            </div>
                                            <span className="w-5 text-right">{merc.maxMp}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Wage below Stats */}
                                    <div className="flex items-center justify-between text-[10px] text-stone-500 bg-stone-950/30 px-1.5 py-0.5 rounded border border-stone-800/50">
                                        <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3"/> Wage</span>
                                        <span className="font-mono text-stone-300 font-bold">{dailyWage} G/day</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button Area */}
                            <div className="mt-1">
                                {isHired ? (
                                    <button 
                                        onClick={(e) => initiateFire(e, merc.id, merc.name)}
                                        className="w-full py-1.5 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all bg-red-900/10 hover:bg-red-900/30 text-stone-500 hover:text-red-400 border border-stone-800 hover:border-red-800"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>Terminate Contract</span>
                                    </button>
                                ) : (
                                    hasAffinity ? (
                                        <button 
                                            onClick={() => handleHire(merc.id, hiringCost)}
                                            disabled={!canAfford}
                                            className={`w-full py-1.5 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                                canAfford 
                                                ? 'bg-amber-700 hover:bg-amber-600 text-white shadow-md' 
                                                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                                            }`}
                                        >
                                            <span>Hire</span>
                                            <div className={`flex items-center gap-0.5 px-1 rounded ${canAfford ? 'bg-amber-800/50' : 'bg-stone-900'}`}>
                                                <Coins className="w-3 h-3" /> {hiringCost}
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="w-full py-1.5 rounded bg-stone-900/50 border border-stone-800 flex items-center justify-center gap-2 text-stone-600 text-xs cursor-not-allowed">
                                            <Lock className="w-3 h-3" />
                                            <span>Trust Needed</span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {state.knownMercenaries.length === 0 && (
                     <div className="col-span-full py-16 text-center text-stone-600 italic border-2 border-dashed border-stone-800 rounded-xl bg-stone-900/50">
                        No regulars yet. The tavern is empty.
                     </div>
                )}
            </div>

            {/* Confirmation Modal for Firing */}
            <ConfirmationModal 
                isOpen={confirmModal.isOpen}
                title="Terminate Contract"
                message={`Are you sure you want to fire ${confirmModal.mercName}? They will leave your service immediately.`}
                confirmLabel="Terminate"
                isDanger={true}
                onConfirm={confirmFire}
                onCancel={cancelFire}
            />
        </div>
    );
};

export default TavernTab;
