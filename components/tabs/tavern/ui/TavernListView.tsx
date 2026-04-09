import React from 'react';
import { BedDouble, PlusCircle, Star, Users, UserRound, ShieldAlert, ClipboardList, Coins, Clock, Sword, Hammer, Package, Trophy } from 'lucide-react';
import { MercenaryCard } from './MercenaryCard';
import { SfxButton } from '../../../common/ui/SfxButton';
import { getAssetUrl } from '../../../../utils';
import { ContractDefinition } from '../../../../types/game-state';
import { useGame } from '../../../../context/GameContext';
import { isContractReady } from '../../../../state/selectors/commissionSelectors';
import { t } from '../../../../utils/i18n';

interface TavernListViewProps {
    hired: any[];
    visitors: any[];
    availableContracts: ContractDefinition[];
    acceptedContracts: ContractDefinition[];
    onInvite: () => void;
    onSelect: (id: string) => void;
    onOpenCommissions: () => void;
    onSelectContract: (id: string) => void;
    inviteCost: number;
    readyContractsCount?: number;
    reputation: number;
    lodgingCapacity: number;
    nextLodgingCapacity: number | null;
    lodgingUpgradeCost: number | null;
    isLodgingMaxed: boolean;
    onExpandLodging: () => void;
}

export const TavernListView: React.FC<TavernListViewProps> = ({ 
    hired, 
    visitors, 
    availableContracts,
    acceptedContracts,
    onInvite, 
    onSelect, 
    onOpenCommissions,
    onSelectContract,
    inviteCost,
    readyContractsCount = 0,
    reputation,
    lodgingCapacity,
    nextLodgingCapacity,
    lodgingUpgradeCost,
    isLodgingMaxed,
    onExpandLodging
}) => {
    const { state, actions } = useGame();
    const language = state.settings.language;
    const allContracts = [...availableContracts, ...acceptedContracts].sort((a, b) => {
        const getPriority = (contract: ContractDefinition) => {
            if (contract.status === 'ACTIVE' && isContractReady(state, contract)) return 0;
            if (contract.status === 'ACTIVE') return 1;
            return 2;
        };

        const priorityDelta = getPriority(a) - getPriority(b);
        if (priorityDelta !== 0) return priorityDelta;
        return (a.daysRemaining || 99) - (b.daysRemaining || 99);
    });

    const getKindIcon = (kind?: string) => {
        switch (kind) {
            case 'HUNT': return <Sword className="w-3 h-3" />;
            case 'BOSS': return <Trophy className="w-3 h-3 text-amber-500" />;
            case 'CRAFT': return <Hammer className="w-3 h-3" />;
            case 'TURN_IN': return <Package className="w-3 h-3" />;
            default: return <Package className="w-3 h-3" />;
        }
    };

    return (
        <div className="h-full w-full bg-stone-950 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"><img src={getAssetUrl('tavern_bg.jpeg', 'bg')} className="w-full h-full object-cover blur-[2px]" /></div>
            
            <div className="relative z-10 h-full px-3 md:px-5 overflow-y-auto custom-scrollbar flex flex-col gap-8 pb-20 pt-20">
                <section className="animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="rounded-2xl border border-stone-700/70 bg-stone-900/75 backdrop-blur-md shadow-2xl overflow-hidden">
                        <div className="grid grid-cols-[1fr_1fr_auto] items-stretch">
                            <div className="flex min-h-[68px] items-center gap-3 px-4 py-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-900/30 border border-amber-700/40">
                                    <Star className="w-4.5 h-4.5 text-amber-400" />
                                </div>
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">{t(language, 'tavern.standing')}</span>
                                    <span className="mt-1 text-lg font-black text-amber-300">{reputation}</span>
                                </div>
                            </div>

                            <div className="flex min-h-[68px] items-center gap-3 border-l border-stone-700/70 px-4 py-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-900/30 border border-amber-700/40">
                                    <BedDouble className="w-4.5 h-4.5 text-amber-400" />
                                </div>
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">{t(language, 'tavern.lodging')}</span>
                                    <span className="mt-1 text-lg font-black text-stone-100">
                                        {lodgingCapacity}
                                        {!isLodgingMaxed && nextLodgingCapacity !== null && (
                                            <span className="ml-2 text-sm font-mono text-stone-500">/ {nextLodgingCapacity}</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="flex min-h-[68px] items-center border-l border-stone-700/70 px-3 py-3">
                                <SfxButton
                                    onClick={onExpandLodging}
                                    disabled={isLodgingMaxed}
                                    className={`flex min-h-[48px] items-center gap-2 rounded-xl px-4 py-3 transition-all ${
                                        isLodgingMaxed
                                            ? 'bg-stone-950/70 text-stone-500 border border-stone-800 cursor-not-allowed'
                                            : 'bg-amber-900/50 hover:bg-amber-800/70 text-amber-100 border border-amber-700/50'
                                    }`}
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    <div className="flex flex-col items-start leading-none">
                                        <span className="text-[10px] font-black uppercase tracking-[0.16em]">
                                            {isLodgingMaxed ? t(language, 'tavern.lodging_maxed') : t(language, 'tavern.lodging_expand')}
                                        </span>
                                        {!isLodgingMaxed && lodgingUpgradeCost !== null && (
                                            <span className="mt-1 text-[10px] font-mono text-amber-300/80">{lodgingUpgradeCost}G</span>
                                        )}
                                    </div>
                                </SfxButton>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Commissions Section - Horizontal Scroll */}
                <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                            <h3 className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-[0.2em] font-serif italic">{t(language, 'commission.available_commissions')}</h3>
                        </div>
                        <SfxButton 
                            onClick={onOpenCommissions}
                            className="relative text-[9px] font-black text-amber-500/80 hover:text-amber-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                        >
                            <ClipboardList className="w-3.5 h-3.5" />
                            {t(language, 'commission.view_board')}
                            {readyContractsCount > 0 && (
                                <div className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-stone-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                                    {readyContractsCount}
                                </div>
                            )}
                        </SfxButton>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar-horizontal -mx-1 px-1 snap-x">
                        {allContracts.length === 0 ? (
                            <div className="w-full py-6 bg-stone-900/40 border border-stone-800/50 rounded-xl flex flex-col items-center justify-center text-stone-600 gap-1">
                                <ClipboardList className="w-5 h-5 opacity-20" />
                                <span className="text-[8px] uppercase font-black tracking-widest">{t(language, 'commission.no_new_orders')}</span>
                            </div>
                        ) : (
                            allContracts.map(contract => {
                                const isAccepted = contract.status === 'ACTIVE';
                                const isReady = isAccepted && isContractReady(state, contract);

                                return (
                                    <div 
                                        key={contract.id}
                                        onClick={() => onSelectContract(contract.id)}
                                        className={`flex-shrink-0 w-64 bg-stone-900/80 border rounded-xl p-3 flex flex-col gap-2 cursor-pointer transition-all snap-start active:scale-[0.98] relative overflow-hidden ${
                                            isReady 
                                            ? 'border-emerald-500/50 bg-emerald-900/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                            : isAccepted 
                                            ? 'border-stone-800 opacity-60 grayscale-[0.5]' 
                                            : 'border-stone-800 hover:border-amber-900/50 hover:bg-stone-800/90'
                                        }`}
                                    >
                                        {isReady && (
                                            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 uppercase tracking-tighter rounded-bl-lg shadow-lg z-10">
                                                Ready
                                            </div>
                                        )}
                                        {isAccepted && !isReady && (
                                            <div className="absolute top-0 right-0 bg-stone-800 text-stone-400 text-[7px] font-black px-1.5 py-0.5 uppercase tracking-tighter rounded-bl-lg z-10">
                                                Accepted
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`p-1.5 rounded-lg border ${isReady ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-stone-950 border-stone-800 text-amber-500'}`}>
                                                    {getKindIcon(contract.kind || contract.type)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-[10px] font-black truncate w-32 ${isReady ? 'text-emerald-200' : 'text-stone-200'}`}>{contract.title}</span>
                                                    <span className="text-[8px] text-stone-500 uppercase font-bold tracking-tighter">{contract.clientName}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className={`flex items-center gap-1 font-mono text-[10px] font-bold ${isReady ? 'text-emerald-400' : 'text-amber-500'}`}>
                                                    <Coins className="w-2.5 h-2.5" />
                                                    {contract.rewards.find(r => r.type === 'GOLD')?.gold || 0}
                                                </div>
                                                <div className="flex items-center gap-1 text-stone-500 font-mono text-[8px]">
                                                    <Clock className="w-2 h-2" />
                                                    {contract.daysRemaining}d
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-stone-400 line-clamp-2 leading-relaxed italic opacity-80">
                                            "{contract.description}"
                                        </p>

                                        {isReady && (
                                            <div className="mt-1">
                                                <SfxButton
                                                    sfx="confirm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (contract.kind === 'CRAFT' || contract.kind === 'TURN_IN') {
                                                            actions.submitContract(contract.id);
                                                        } else {
                                                            actions.claimObjectiveContract(contract.id);
                                                        }
                                                    }}
                                                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 rounded-lg font-black uppercase tracking-widest text-[8px] flex items-center justify-center gap-1 shadow-lg shadow-emerald-900/20"
                                                >
                                                    <Trophy className="w-3 h-3" />
                                                    {t(language, 'commission.claim_rewards')}
                                                </SfxButton>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
                {/* Your Squad Section */}
                <section className="animate-in fade-in slide-in-from-left-2 duration-600">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-3.5 h-3.5 text-amber-500" />
                        <h3 className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-[0.2em] font-serif italic">{t(language, 'tavern.your_squad')}</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-stone-800 to-transparent"></div>
                        <span className="text-[9px] font-mono text-stone-600 uppercase font-black">{hired.length}/{lodgingCapacity}</span>
                    </div>
                    {hired.length === 0 ? (
                        <div className="py-8 border-2 border-dashed border-stone-800 rounded-xl flex flex-col items-center justify-center text-stone-700 gap-2">
                            <ShieldAlert className="w-8 h-8 opacity-20" />
                            <p className="text-[9px] uppercase font-black tracking-widest opacity-50">{t(language, 'tavern.no_active_contracts')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                            {hired.map(merc => <MercenaryCard key={merc.id} merc={merc} isHired={true} onClick={() => onSelect(merc.id)} />)}
                        </div>
                    )}
                </section>

                <section className="animate-in fade-in slide-in-from-left-2 duration-700 delay-100">
                    <div className="flex items-center gap-2 mb-3">
                        <UserRound className="w-3.5 h-3.5 text-stone-500" />
                        <h3 className="text-[10px] md:text-xs font-black text-stone-500 uppercase tracking-[0.2em] font-serif italic">{t(language, 'tavern.visitors')}</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-stone-800 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                        {visitors.map(merc => <MercenaryCard key={merc.id} merc={merc} isHired={false} onClick={() => merc.status !== 'DEAD' && onSelect(merc.id)} />)}
                        <SfxButton onClick={onInvite} className="bg-stone-950/30 border-2 border-dashed border-stone-800/50 rounded-xl flex flex-col items-center justify-center gap-1.5 text-stone-700 hover:text-stone-500 hover:border-stone-700 transition-all min-h-[140px]">
                            <PlusCircle className="w-6 h-6 opacity-20" />
                            <span className="text-[8px] font-black uppercase tracking-widest">{t(language, 'tavern.find_talent', { cost: inviteCost })}</span>
                        </SfxButton>
                    </div>
                </section>
            </div>
        </div>
    );
};
