import React, { useState } from 'react';
import { useGame } from '../../../../context/GameContext';
import { SfxButton } from '../../../common/ui/SfxButton';
import { 
    Package, 
    Coins, 
    Heart, 
    Trophy,
    Shield,
    Flame,
    HelpCircle,
    X,
    ClipboardList
} from 'lucide-react';
import { BoardIssuerId } from '../../../../types/game-state';
import { BOARD_ISSUER_PROFILES } from '../../../../data/contracts/boardIssuers';
import { 
    selectAvailableContracts, 
    selectAcceptedContracts, 
    selectReadyContracts, 
    selectExpiredContracts
} from '../../../../state/selectors/commissionSelectors';

import { CommissionCard } from './CommissionCard';
import { t } from '../../../../utils/i18n';

interface CommissionBoardProps {
    onClose?: () => void;
}

type Tab = 'available' | 'accepted' | 'ready' | 'expired';

export const CommissionBoard: React.FC<CommissionBoardProps> = ({ onClose }) => {
    const { state, actions } = useGame();
    const [activeTab, setActiveTab] = useState<Tab>('available');
    const [openIssuerHelp, setOpenIssuerHelp] = useState<BoardIssuerId | null>(null);
    const language = state.settings.language;

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
    const bossContracts = currentContracts.filter(contract => contract.kind === 'BOSS');
    const standardContracts = currentContracts.filter(contract => contract.kind !== 'BOSS');

    const getIssuerIcon = (issuerId: BoardIssuerId) => {
        switch (issuerId) {
            case 'TOWN_GUARD': return <Shield className="w-3.5 h-3.5" />;
            case 'ASHFIELD_TRADERS': return <Coins className="w-3.5 h-3.5" />;
            case 'CHAPEL_OF_EMBER': return <Flame className="w-3.5 h-3.5" />;
            case 'ADVENTURERS_GUILD': return <Trophy className="w-3.5 h-3.5" />;
        }
    };

    const getIssuerAffinityTier = (affinity: number) => {
        if (affinity >= 80) return 'elite';
        if (affinity >= 50) return 'favored';
        if (affinity >= 20) return 'trusted';
        return 'neutral';
    };

    const getIssuerTierDescription = (affinity: number) => {
        return t(language, `commission.affinity_desc_${getIssuerAffinityTier(affinity)}`);
    };

    return (
        <div className="flex flex-col h-full bg-stone-950/40 backdrop-blur-md border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-stone-800 bg-stone-900/60 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-900/30 rounded-lg border border-amber-700/50">
                        <ClipboardList className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-stone-100 uppercase tracking-tighter">{t(language, 'commission.board_title')}</h2>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">{t(language, 'commission.board_subtitle')}</p>
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
                            {t(language, `commission.${tab}`)}
                            {count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${isActive ? 'bg-stone-950 text-amber-500' : 'bg-stone-800 text-stone-400'}`}>
                                    {count}
                                </span>
                            )}
                        </SfxButton>
                    );
                })}
            </div>

            <div className="border-b border-stone-800 bg-stone-950/50 p-3">
                <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-sky-400" />
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-stone-200">
                            {t(language, 'commission.issuer_favor_title')}
                        </h3>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-stone-500">
                            {t(language, 'commission.issuer_favor_subtitle')}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {BOARD_ISSUER_PROFILES.map((issuer) => {
                        const affinity = state.commission.issuerAffinity[issuer.id] || 0;
                        const isHelpOpen = openIssuerHelp === issuer.id;

                        return (
                            <div
                                key={issuer.id}
                                className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-2"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1.5 rounded-md bg-stone-950/70 text-stone-300 border border-stone-800">
                                            {getIssuerIcon(issuer.id)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <div className="text-[11px] font-bold text-stone-200 truncate">{issuer.displayName}</div>
                                                <SfxButton
                                                    sfx="switch"
                                                    onClick={() => setOpenIssuerHelp(isHelpOpen ? null : issuer.id)}
                                                    className={`shrink-0 p-1 rounded-full border transition-colors ${
                                                        isHelpOpen
                                                            ? 'border-sky-500/40 bg-sky-950/30 text-sky-300'
                                                            : 'border-stone-800 bg-stone-950/60 text-stone-500 hover:text-stone-300'
                                                    }`}
                                                    title={t(language, 'commission.issuer_favor_help')}
                                                >
                                                    <HelpCircle className="w-3 h-3" />
                                                </SfxButton>
                                            </div>
                                            <div className="text-[9px] uppercase tracking-widest font-black text-stone-500">
                                                {t(language, `commission.affinity_tier_${getIssuerAffinityTier(affinity)}`)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-sky-300">{affinity}</div>
                                        <div className="text-[9px] uppercase tracking-widest font-bold text-stone-600">
                                            {t(language, 'commission.issuer_favor_label')}
                                        </div>
                                    </div>
                                </div>
                                {isHelpOpen && (
                                    <div className="mt-2 rounded-lg border border-sky-500/20 bg-sky-950/20 px-3 py-2">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-sky-300">
                                            {t(language, `commission.affinity_tier_${getIssuerAffinityTier(affinity)}`)}
                                        </div>
                                        <div className="mt-1 text-[11px] leading-relaxed text-stone-300">
                                            {getIssuerTierDescription(affinity)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {currentContracts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-stone-600">
                        <Package className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest">{t(language, 'commission.no_contracts', { tab: t(language, `commission.${activeTab}`).toLowerCase() })}</p>
                        <p className="text-xs opacity-60 mt-1">{t(language, 'commission.no_contracts_desc')}</p>
                    </div>
                ) : (
                    <>
                        {bossContracts.length > 0 && (
                            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-stone-900/70 to-stone-950/80 p-3 shadow-[0_0_28px_rgba(245,158,11,0.08)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-950/30">
                                        <Trophy className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-200">
                                            {t(language, 'commission.featured_boss_title')}
                                        </h3>
                                        <p className="text-[9px] uppercase tracking-widest font-bold text-stone-500">
                                            {t(language, 'commission.featured_boss_subtitle')}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {bossContracts.map(contract => (
                                        <CommissionCard
                                            key={contract.id}
                                            contract={contract}
                                            activeTab={activeTab}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {standardContracts.map(contract => (
                            <CommissionCard 
                                key={contract.id} 
                                contract={contract} 
                                activeTab={activeTab} 
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};
