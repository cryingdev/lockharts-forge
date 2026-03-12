import React from 'react';
import { useGame } from '../../../../context/GameContext';
import { SfxButton } from '../../../common/ui/SfxButton';
import { Package, CheckCircle2, AlertCircle, Clock, Coins, Heart } from 'lucide-react';
import { ContractDefinition } from '../../../../types/game-state';

interface CommissionBoardProps {
    onClose?: () => void;
}

export const CommissionBoard: React.FC<CommissionBoardProps> = ({ onClose }) => {
    const { state, actions } = useGame();
    const { activeContracts } = state.commission;

    const canSubmit = (contract: ContractDefinition) => {
        return contract.requirements.every(req => {
            const invItems = state.inventory.filter(inv => {
                const recipeId = inv.equipmentData?.recipeId;
                const inventoryTags = inv.tags || [];
                const quality = inv.equipmentData?.quality ?? inv.quality ?? 0;
                const idMatch = inv.id === req.itemId || recipeId === req.itemId;
                const tagMatch = !!req.acceptedTags && req.acceptedTags.some(tag => inventoryTags.includes(tag));
                const qualityMatch = req.minQuality === undefined || quality >= req.minQuality;
                return (idMatch || tagMatch) && qualityMatch;
            });
            const totalQty = invItems.reduce((sum, item) => sum + item.quantity, 0);
            
            if (totalQty < req.quantity) return false;

            return true;
        });
    };

    return (
        <div className="flex flex-col h-full bg-stone-950/40 backdrop-blur-md border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-800 bg-stone-900/60 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-900/30 rounded-lg border border-amber-700/50">
                        <Package className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-stone-100 uppercase tracking-tighter">Commission Board</h2>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Active Requests & Contracts</p>
                    </div>
                </div>
                {onClose && (
                    <SfxButton sfx="switch" onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full text-stone-500">
                        <AlertCircle className="w-5 h-5" />
                    </SfxButton>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {activeContracts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-stone-600">
                        <Package className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest">No active commissions</p>
                        <p className="text-xs opacity-60 mt-1">Visit locations to find special requests.</p>
                    </div>
                ) : (
                    activeContracts.map(contract => (
                        <div key={contract.id} className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex flex-col gap-4 hover:border-stone-700 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-amber-200 font-bold text-sm uppercase tracking-tight">{contract.title}</h3>
                                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">{contract.description}</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-950 rounded-lg border border-stone-800">
                                    <Clock className="w-3 h-3 text-amber-500" />
                                    <span className="text-[10px] font-mono text-amber-500">{contract.daysRemaining}d</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-[10px] text-stone-500 uppercase font-black tracking-widest mb-2">Requirements</h4>
                                    <div className="space-y-1.5">
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

                            <SfxButton 
                                sfx="confirm"
                                onClick={() => actions.submitContract(contract.id)}
                                disabled={!canSubmit(contract)}
                                className={`w-full py-2.5 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all ${
                                    canSubmit(contract) 
                                    ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-[0_0_20px_rgba(217,119,6,0.3)]' 
                                    : 'bg-stone-800 text-stone-600 cursor-not-allowed grayscale'
                                }`}
                            >
                                {canSubmit(contract) ? 'Complete Commission' : 'Requirements Not Met'}
                            </SfxButton>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
