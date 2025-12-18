
import React, { useState } from 'react';
import { useGame } from '../../../context/GameContext';
import { createRandomMercenary, getUnmetNamedMercenary } from '../../../utils/mercenaryGenerator';
import { Heart, PlusCircle, Coins, Lock, CalendarClock, XCircle, Map } from 'lucide-react';
import { CONTRACT_CONFIG, calculateHiringCost, calculateDailyWage } from '../../../config/contract-config';
import ConfirmationModal from '../../modals/ConfirmationModal';
import MercenaryDetailModal from '../../modals/MercenaryDetailModal';
import { DUNGEONS } from '../../../data/dungeons';
import { EquipmentSlotType } from '../../../types/inventory';

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

const TavernTab = () => {
    const { state, actions } = useGame();
    const { gold } = state.stats;
    const activeExpeditionsList = state.activeExpeditions;

    // Local state for confirmation modal
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; mercId: string | null; mercName: string }>({
        isOpen: false,
        mercId: null,
        mercName: ''
    });

    // Local state for detail modal
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

    const handleOpenDetail = (mercId: string) => {
        setSelectedMercId(mercId);
    };

    const handleCloseDetail = () => {
        setSelectedMercId(null);
    };

    const handleUnequipFromDetail = (mercId: string, slot: EquipmentSlotType) => {
        actions.unequipItem(mercId, slot);
    };

    const selectedMercenary = state.knownMercenaries.find(m => m.id === selectedMercId) || null;

    const getExpeditionName = (expId?: string) => {
        if (!expId) return "Unknown";
        const exp = activeExpeditionsList.find(e => e.id === expId);
        if (!exp) return "Unknown";
        const dungeon = DUNGEONS.find(d => d.id === exp.dungeonId);
        return dungeon ? dungeon.name : "Unknown Location";
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
                    const isHired = merc.status === 'HIRED' || merc.status === 'ON_EXPEDITION' || merc.status === 'INJURED';
                    const energy = merc.expeditionEnergy || 0;
                    
                    // Status Checks
                    const isOnExpedition = merc.status === 'ON_EXPEDITION';
                    const expeditionName = isOnExpedition ? getExpeditionName(merc.assignedExpeditionId) : "";
                    
                    // XP Calculation
                    const xpPercent = Math.min(100, (merc.currentXp / merc.xpToNextLevel) * 100);

                    return (
                        <div 
                            key={merc.id} 
                            onClick={() => isHired && handleOpenDetail(merc.id)} // Click card to open detail if hired
                            className={`bg-stone-800 border ${isHired ? 'border-amber-600/50 cursor-pointer hover:border-amber-500' : 'border-stone-700'} p-3 rounded-xl flex flex-col gap-3 shadow-lg transition-all relative overflow-hidden group`}
                        >
                            
                            {/* Top Right Status (Battery / Hired) */}
                            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                                {isHired && (
                                    <div className="flex items-center gap-2 bg-stone-950/80 px-2 py-1 rounded-md border border-stone-800 backdrop-blur-sm">
                                        {isOnExpedition ? (
                                             <>
                                                <Map className="w-3 h-3 text-blue-400 animate-pulse" />
                                                <span className="text-[10px] text-blue-400 font-bold tracking-wider max-w-[80px] truncate" title={expeditionName}>
                                                    {expeditionName}
                                                </span>
                                             </>
                                        ) : (
                                            <span className="text-[10px] text-amber-500 font-bold tracking-wider">HIRED</span>
                                        )}
                                        <div className="w-px h-3 bg-stone-700"></div>
                                        <EnergyBattery value={energy} />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pointer-events-none"> {/* Disable pointer events on content so card click works easier */}
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

                            {/* Action Button Area (Interactivity restored via relative z-index) */}
                            <div className="mt-1 relative z-20" onClick={(e) => e.stopPropagation()}>
                                {isHired ? (
                                    <button 
                                        onClick={(e) => !isOnExpedition && initiateFire(e, merc.id, merc.name)}
                                        disabled={isOnExpedition}
                                        className={`w-full py-1.5 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                            isOnExpedition
                                            ? 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
                                            : 'bg-red-900/10 hover:bg-red-900/30 text-stone-500 hover:text-red-400 border border-stone-800 hover:border-red-800'
                                        }`}
                                    >
                                        {isOnExpedition ? (
                                            <>
                                                <Map className="w-3.5 h-3.5" /> On Expedition
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3.5 h-3.5" /> Terminate Contract
                                            </>
                                        )}
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

            {/* Mercenary Detail Modal */}
            {selectedMercenary && (
                <MercenaryDetailModal 
                    key={selectedMercenary.id} // Ensure fresh mount for each mercenary
                    mercenary={selectedMercenary}
                    onClose={handleCloseDetail}
                    onUnequip={handleUnequipFromDetail}
                />
            )}
        </div>
    );
};

export default TavernTab;
