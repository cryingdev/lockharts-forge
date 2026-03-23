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
    Trophy,
    X,
    ClipboardList
} from 'lucide-react';
import { ContractDefinition } from '../../../../types/game-state';
import { EQUIPMENT_ITEMS } from '../../../../data/equipment';
import { materials } from '../../../../data/materials';
import { 
    selectAvailableContracts, 
    selectAcceptedContracts, 
    selectReadyContracts, 
    selectExpiredContracts,
    isContractReady
} from '../../../../state/selectors/commissionSelectors';

import { CommissionCard } from './CommissionCard';

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

    return (
        <div className="flex flex-col h-full bg-stone-950/40 backdrop-blur-md border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-stone-800 bg-stone-900/60 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-900/30 rounded-lg border border-amber-700/50">
                        <ClipboardList className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-stone-100 uppercase tracking-tighter">Commission Board</h2>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Guild Contract Management</p>
                    </div>
                </div>
                {onClose && (
                    <SfxButton sfx="switch" onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full text-stone-500 transition-colors">
                        <X className="w-5 h-5" />
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
                    currentContracts.map(contract => (
                        <CommissionCard 
                            key={contract.id} 
                            contract={contract} 
                            activeTab={activeTab} 
                        />
                    ))
                )}
            </div>
        </div>
    );
};

