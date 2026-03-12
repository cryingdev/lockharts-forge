import React, { useState } from 'react';
import { useGame } from '../../../../context/GameContext';
import { SfxButton } from '../../../common/ui/SfxButton';
import { 
    Package, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Coins, 
    Heart, 
    Sword, 
    Compass, 
    Hammer, 
    Trash2,
    ChevronRight,
    Trophy
} from 'lucide-react';
import { ContractDefinition } from '../../../../types/game-state';
import { 
    selectAvailableContracts, 
    selectAcceptedContracts, 
    selectReadyContracts, 
    selectExpiredContracts,
    isContractReady
} from '../../../../state/selectors/commissionSelectors';

interface CommissionBoardProps {
    onClose?: () => void;
}

type Tab = 'available' | 'accepted' | 'ready' | 'expired';

export const CommissionBoard: React.FC<CommissionBoardProps> = ({ onClose }) => {
    const { state, actions } = useGame();
    const [activeTab, setActiveTab] = useState<Tab>('available');

    const available = selectAvailableContracts(state);
    const accepted = selectAcceptedContracts(state);
    const ready = selectReadyContracts(state);
    const expired = selectExpiredContracts(state);

    const getContractsByTab = () => {
        switch (activeTab) {
            case 'available': return available;
            case 'accepted': return accepted;
            case 'ready': return ready;
            case 'expired': return expired;
            default: return [];
        }
    };

    const currentContracts = getContractsByTab();

    const getKindIcon = (kind?: string) => {
        switch (kind) {
            case 'HUNT': return <Sword className="w-3 h-3" />;
            case 'EXPLORE': return <Compass className="w-3 h-3" />;
            case 'CRAFT': return <Hammer className="w-3 h-3" />;
            case 'TURN_IN': return <Package className="w-3 h-3" />;
            default: return <Package className="w-3 h-3" />;
        }
    };

    const getUrgencyColor = (urgency?: string) => {
        switch (urgency) {
            case 'URGENT': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            default: return 'text-stone-500 bg-stone-500/10 border-stone-500/20';
        }
    };

    return (
        <div className="flex flex-col h-full bg-stone-950/40 backdrop-blur-md border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-stone-800 bg-stone-900/60 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-900/30 rounded-lg border border-amber-700/50">
                        <Package className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-stone-100 uppercase tracking-tighter">Commission Board</h2>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Guild Contract Management</p>
                    </div>
                </div>
                {onClose && (
                    <SfxButton sfx="switch" onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full text-stone-500">
                        <AlertCircle className="w-5 h-5" />
                    </SfxButton>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-800 bg-stone-950/40 p-1 gap-1">
                {(['available', 'accepted', 'ready', 'expired'] as Tab[]).map((tab) => {
                    const count = tab === 'available' ? available.length :
                                  tab === 'accepted' ? accepted.length :
                                  tab === 'ready' ? ready.length :
                                  expired.length;
                    
                    const isActive = activeTab === tab;
                    
                    return (
                        <SfxButton
                            key={tab}
                            sfx="switch"
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                isActive 
                                ? 'bg-amber-600 text-stone-950 shadow-lg' 
                                : 'text-stone-500 hover:bg-stone-800/50'
                            }`}
                        >
                            {tab}
                            {count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${isActive ? 'bg-stone-950 text-amber-500' : 'bg-stone-800 text-stone-400'}`}>
                                    {count}
                                </span>
                            )}
                        </SfxButton>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {currentContracts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-stone-600">
                        <Package className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest">No {activeTab} contracts</p>
                        <p className="text-xs opacity-60 mt-1">Check back later for new opportunities.</p>
                    </div>
                ) : (
                    currentContracts.map(contract => {
                        const isReady = isContractReady(state, contract);
                        const progressSummary = state.commission.trackedObjectiveProgress[contract.id] || {};

                        return (
                            <div key={contract.id} className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex flex-col gap-4 hover:border-stone-700 transition-colors relative overflow-hidden">
                                {isReady && activeTab !== 'ready' && (
                                    <div className="absolute top-0 right-0 bg-emerald-500 text-stone-950 text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter rounded-bl-lg shadow-lg">
                                        Ready to Claim
                                    </div>
                                )}

                                {/* Card Header */}
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black border ${getUrgencyColor(contract.urgency)}`}>
                                                {getKindIcon(contract.kind)}
                                                {contract.kind || 'GENERAL'}
                                            </span>
                                            {contract.issuer && (
                                                <span className="text-[9px] text-stone-500 uppercase font-bold tracking-widest">
                                                    Issued by: {contract.issuer}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-amber-200 font-bold text-sm uppercase tracking-tight">{contract.title}</h3>
                                        <p className="text-xs text-stone-400 mt-1 leading-relaxed">{contract.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-950 rounded-lg border border-stone-800">
                                            <Clock className="w-3 h-3 text-amber-500" />
                                            <span className="text-[10px] font-mono text-amber-500">{contract.daysRemaining}d</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Objectives / Requirements */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-[10px] text-stone-500 uppercase font-black tracking-widest mb-2 flex items-center gap-1">
                                            {contract.kind === 'HUNT' || contract.kind === 'EXPLORE' ? 'Objectives' : 'Requirements'}
                                        </h4>
                                        <div className="space-y-1.5">
                                            {/* Requirements (CRAFT/TURN_IN) */}
                                            {contract.requirements.map((req, idx) => {
                                                const invItems = state.inventory.filter(inv => {
                                                    const recipeId = inv.equipmentData?.recipeId;
                                                    const inventoryTags = inv.tags || [];
                                                    const quality = inv.equipmentData?.quality ?? inv.quality ?? 0;
                                                    const idMatch = inv.id === req.itemId || recipeId === req.itemId;
                                                    const tagMatch = !!req.acceptedTags && req.acceptedTags.some(tag => inventoryTags.includes(tag));
                                                    const qualityMatch = req.minQuality === undefined || quality >= req.minQuality;
                                                    return (idMatch || tagMatch) && qualityMatch;
                                                });
                                                const currentQty = invItems.reduce((sum, item) => sum + item.quantity, 0);
                                                const isMet = currentQty >= req.quantity;
                                                
                                                return (
                                                    <div key={idx} className="flex items-center justify-between text-[11px] bg-stone-950/50 p-1.5 rounded-lg border border-stone-800/50">
                                                        <span className="text-stone-300 truncate mr-2">{req.itemId.replace(/_/g, ' ')}</span>
                                                        <span className={`font-mono ${isMet ? 'text-emerald-500' : 'text-stone-500'}`}>
                                                            {currentQty}/{req.quantity}
                                                        </span>
                                                    </div>
                                                );
                                            })}

                                            {/* Objectives (HUNT/EXPLORE) */}
                                            {contract.objectives?.map((obj) => {
                                                const current = progressSummary[obj.id] || 0;
                                                const isMet = current >= obj.target;
                                                const percent = Math.min(100, (current / obj.target) * 100);

                                                return (
                                                    <div key={obj.id} className="space-y-1">
                                                        <div className="flex items-center justify-between text-[10px] px-1">
                                                            <span className="text-stone-400">{obj.label}</span>
                                                            <span className={`font-mono ${isMet ? 'text-emerald-500' : 'text-stone-500'}`}>
                                                                {current}/{obj.target}
                                                            </span>
                                                        </div>
                                                        <div className="h-1 bg-stone-950 rounded-full overflow-hidden border border-stone-800/50">
                                                            <div 
                                                                className={`h-full transition-all duration-500 ${isMet ? 'bg-emerald-500' : 'bg-amber-600'}`}
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] text-stone-500 uppercase font-black tracking-widest mb-2">Rewards</h4>
                                        <div className="space-y-1.5">
                                            {contract.rewards.map((reward, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-[11px] bg-stone-950/50 p-1.5 rounded-lg border border-stone-800/50">
                                                    {reward.type === 'GOLD' && (
                                                        <><Coins className="w-3 h-3 text-amber-500" /><span className="text-amber-500 font-bold">{reward.gold}G</span></>
                                                    )}
                                                    {reward.type === 'AFFINITY' && (
                                                        <><Heart className="w-3 h-3 text-pink-500" /><span className="text-pink-500 font-bold">+{reward.affinity}</span></>
                                                    )}
                                                    {reward.type === 'UNLOCK_RECRUIT' && (
                                                        <><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500 font-bold italic">Recruit Unlocked</span></>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-2">
                                    {activeTab === 'available' && (
                                        <>
                                            <SfxButton 
                                                sfx="confirm"
                                                onClick={() => actions.acceptContract(contract.id)}
                                                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg"
                                            >
                                                Accept Contract
                                            </SfxButton>
                                            <SfxButton 
                                                sfx="switch"
                                                onClick={() => actions.declineContract({ contractId: contract.id })}
                                                className="p-2 bg-stone-800 hover:bg-red-900/30 text-stone-500 hover:text-red-500 rounded-xl border border-stone-700 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </SfxButton>
                                        </>
                                    )}

                                    {activeTab === 'accepted' && (
                                        <>
                                            {(contract.kind === 'CRAFT' || contract.kind === 'TURN_IN') ? (
                                                <SfxButton 
                                                    sfx="confirm"
                                                    onClick={() => actions.submitContract(contract.id)}
                                                    disabled={!isReady}
                                                    className={`flex-1 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                                                        isReady 
                                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-lg' 
                                                        : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {isReady ? 'Submit Items' : 'In Progress'}
                                                </SfxButton>
                                            ) : (
                                                <SfxButton 
                                                    sfx="confirm"
                                                    onClick={() => actions.claimObjectiveContract(contract.id)}
                                                    disabled={!isReady}
                                                    className={`flex-1 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                                                        isReady 
                                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-lg' 
                                                        : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {isReady ? 'Claim Rewards' : 'In Progress'}
                                                </SfxButton>
                                            )}
                                            <SfxButton 
                                                sfx="switch"
                                                onClick={() => actions.failContract(contract.id)}
                                                className="p-2 bg-stone-800 hover:bg-red-900/30 text-stone-500 hover:text-red-500 rounded-xl border border-stone-700 transition-all"
                                                title="Abandon Contract"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </SfxButton>
                                        </>
                                    )}

                                    {activeTab === 'ready' && (
                                        <SfxButton 
                                            sfx="confirm"
                                            onClick={() => {
                                                if (contract.kind === 'CRAFT' || contract.kind === 'TURN_IN') {
                                                    actions.submitContract(contract.id);
                                                } else {
                                                    actions.claimObjectiveContract(contract.id);
                                                }
                                            }}
                                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                                        >
                                            <Trophy className="w-4 h-4" />
                                            Complete & Claim
                                        </SfxButton>
                                    )}

                                    {activeTab === 'expired' && (
                                        <SfxButton 
                                            sfx="switch"
                                            onClick={() => actions.failContract(contract.id)}
                                            className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                        >
                                            Dismiss Notice
                                        </SfxButton>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

