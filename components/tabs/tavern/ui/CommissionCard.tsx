import React from 'react';
import { useGame } from '../../../../context/GameContext';
import { SfxButton } from '../../../common/ui/SfxButton';
import { 
    Package, 
    CheckCircle2, 
    Clock, 
    Coins, 
    Heart, 
    Sword, 
    Compass, 
    Hammer, 
    Trash2,
    Trophy,
    Shield,
    Flame,
    User,
    AlertTriangle
} from 'lucide-react';
import { ContractDefinition } from '../../../../types/game-state';
import { EQUIPMENT_ITEMS } from '../../../../data/equipment';
import { materials } from '../../../../data/materials';
import { isContractReady } from '../../../../state/selectors/commissionSelectors';
import { t } from '../../../../utils/i18n';

interface CommissionCardProps {
    contract: ContractDefinition;
    activeTab: 'available' | 'accepted' | 'ready' | 'expired';
    onActionComplete?: () => void;
}

export const CommissionCard: React.FC<CommissionCardProps> = ({ contract, activeTab, onActionComplete }) => {
    const { state, actions } = useGame();
    const language = state.settings.language;
    
    const isReady = isContractReady(state, contract);
    const progressSummary = state.commission.trackedObjectiveProgress[contract.id] || {};
    const issuerAffinity = contract.issuerId ? state.commission.issuerAffinity[contract.issuerId] || 0 : null;
    const getIssuerAffinityTier = (affinity: number) => {
        if (affinity >= 80) return 'elite';
        if (affinity >= 50) return 'favored';
        if (affinity >= 20) return 'trusted';
        return 'neutral';
    };

    const getKindIcon = (kind?: string) => {
        switch (kind) {
            case 'HUNT': return <Sword className="w-3 h-3" />;
            case 'BOSS': return <Trophy className="w-3 h-3 text-amber-500" />;
            case 'CRAFT': return <Hammer className="w-3 h-3" />;
            case 'TURN_IN': return <Package className="w-3 h-3" />;
            default: return <Package className="w-3 h-3" />;
        }
    };

    const getUrgencyColor = (urgency?: string) => {
        switch (urgency) {
            case 'URGENT': return 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
            case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            default: return 'text-stone-500 bg-stone-500/10 border-stone-500/20';
        }
    };

    const getIssuerIcon = (issuerId?: string) => {
        switch (issuerId) {
            case 'TOWN_GUARD': return <Shield className="w-3 h-3" />;
            case 'ASHFIELD_TRADERS': return <Coins className="w-3 h-3" />;
            case 'CHAPEL_OF_EMBER': return <Flame className="w-3 h-3" />;
            case 'ADVENTURERS_GUILD': return <Trophy className="w-3 h-3" />;
            default: return <User className="w-3 h-3" />;
        }
    };

    const getContractAccentClasses = (kind?: string) => {
        switch (kind) {
            case 'BOSS':
                return 'border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-stone-900/80 to-stone-950/80 shadow-[0_0_24px_rgba(245,158,11,0.12)]';
            case 'HUNT':
                return 'border-red-500/30 bg-gradient-to-br from-red-950/15 via-stone-900/80 to-stone-950/80 shadow-[0_0_18px_rgba(239,68,68,0.08)]';
            case 'TURN_IN':
                return 'border-sky-500/25 bg-gradient-to-br from-sky-950/10 via-stone-900/80 to-stone-950/80 shadow-[0_0_16px_rgba(56,189,248,0.06)]';
            default:
                return 'border-stone-800 bg-stone-900/80';
        }
    };

    const getContractHighlightBadge = (kind?: string) => {
        switch (kind) {
            case 'BOSS':
                return { icon: <Trophy className="w-3 h-3" />, label: t(language, 'commission.highlight_boss') };
            case 'HUNT':
                return { icon: <Sword className="w-3 h-3" />, label: t(language, 'commission.highlight_hunt') };
            case 'TURN_IN':
                return { icon: <Package className="w-3 h-3" />, label: t(language, 'commission.highlight_turn_in') };
            default:
                return null;
        }
    };

    const highlightBadge = getContractHighlightBadge(contract.kind);
    const isNamedPersonalRequest = contract.source === 'TAVERN' && contract.unique && !!contract.mercenaryId;

    return (
        <div className={`border rounded-xl p-4 flex flex-col gap-4 hover:border-stone-700 transition-colors relative overflow-hidden ${
            isNamedPersonalRequest
            ? 'border-fuchsia-500/35 shadow-[inset_0_0_28px_rgba(217,70,239,0.08)] bg-gradient-to-br from-fuchsia-950/20 via-stone-900/85 to-stone-950/90'
            : contract.source === 'TAVERN' 
            ? 'border-indigo-500/30 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)] bg-stone-900/80'
            : getContractAccentClasses(contract.kind)
        }`}>
            {isReady && activeTab !== 'ready' && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-stone-950 text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter rounded-bl-lg shadow-lg">
                    {t(language, 'commission.ready_badge')}
                </div>
            )}
            {highlightBadge && contract.source !== 'TAVERN' && (
                <div className="absolute top-0 left-0 rounded-br-lg border-r border-b border-stone-800/60 bg-stone-950/80 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-stone-200 flex items-center gap-1">
                    {highlightBadge.icon}
                    <span>{highlightBadge.label}</span>
                </div>
            )}
            {isNamedPersonalRequest && (
                <div className="absolute top-0 left-0 rounded-br-lg border-r border-b border-fuchsia-500/30 bg-fuchsia-950/70 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-fuchsia-100 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-fuchsia-300" />
                    <span>{t(language, 'commission.highlight_named_personal')}</span>
                </div>
            )}

            {/* Card Header */}
            <div className={`flex justify-between items-start ${(highlightBadge && contract.source !== 'TAVERN') || isNamedPersonalRequest ? 'pt-5' : ''}`}>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black border ${getUrgencyColor(contract.urgency)}`}>
                            {contract.urgency === 'URGENT' && <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />}
                            {getKindIcon(contract.kind)}
                            {contract.kind || 'GENERAL'}
                        </span>
                        {(contract.issuerName || contract.issuerId || contract.source === 'TAVERN') && (
                            <span className={`flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border ${
                                isNamedPersonalRequest
                                ? 'text-fuchsia-200 bg-fuchsia-950/50 border-fuchsia-500/30'
                                : contract.source === 'TAVERN' 
                                ? 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30' 
                                : 'text-stone-500 bg-stone-950/40 border-stone-800/50'
                            }`}>
                                {contract.source === 'TAVERN'
                                    ? <User className={`w-3 h-3 ${isNamedPersonalRequest ? 'text-fuchsia-300/70' : 'text-indigo-400/50'}`} />
                                    : getIssuerIcon(contract.issuerId)}
                                {contract.source === 'TAVERN'
                                    ? t(language, isNamedPersonalRequest ? 'commission.named_personal_badge' : 'commission.personal_badge', { name: contract.clientName })
                                    : (contract.issuerName || contract.issuerId)}
                            </span>
                        )}
                    </div>
                    <h3 className="text-amber-200 font-bold text-sm uppercase tracking-tight">{contract.title}</h3>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed italic opacity-80">"{contract.description}"</p>
                    {issuerAffinity !== null && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-sky-300 bg-sky-950/30 border border-sky-500/20 rounded-md px-2 py-1">
                                <Heart className="w-3 h-3 text-sky-300" />
                                <span>{t(language, 'commission.issuer_affinity', { value: issuerAffinity })}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-amber-200 bg-amber-950/20 border border-amber-500/20 rounded-md px-2 py-1">
                                <Shield className="w-3 h-3 text-amber-300" />
                                <span>{t(language, `commission.affinity_tier_${getIssuerAffinityTier(issuerAffinity)}`)}</span>
                            </div>
                        </div>
                    )}
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
                        {contract.kind === 'HUNT' || contract.kind === 'BOSS'
                            ? t(language, 'commission.objectives')
                            : t(language, 'commission.requirements')}
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
                            
                            const itemData = EQUIPMENT_ITEMS.find(i => i.id === req.itemId) || (materials as any)[req.itemId];
                            const displayName = itemData ? itemData.name : req.itemId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                            return (
                                <div key={idx} className="flex items-center justify-between text-[11px] bg-stone-950/50 p-1.5 rounded-lg border border-stone-800/50">
                                    <div className="flex min-w-0 items-center gap-2 mr-2">
                                        <span className="text-stone-300 truncate">{displayName}</span>
                                        {req.minQuality !== undefined && (
                                            <span className="shrink-0 px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-950/20 text-[9px] font-black uppercase tracking-widest text-amber-300">
                                                {t(language, 'commission.quality_requirement', { value: req.minQuality })}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`font-mono ${isMet ? 'text-emerald-500' : 'text-stone-500'}`}>
                                        {currentQty}/{req.quantity}
                                    </span>
                                </div>
                            );
                        })}

                        {/* Objectives (HUNT/BOSS) */}
                        {contract.objectives?.map((obj) => {
                            const current = progressSummary[obj.objectiveId] || 0;
                            const isMet = current >= obj.targetCount;
                            const percent = Math.min(100, (current / obj.targetCount) * 100);

                            return (
                                <div key={obj.objectiveId} className="space-y-1">
                                    <div className="flex items-center justify-between text-[10px] px-1">
                                        <span className="text-stone-400">{obj.label}</span>
                                        <span className={`font-mono ${isMet ? 'text-emerald-500' : 'text-stone-500'}`}>
                                            {current}/{obj.targetCount}
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
                    <h4 className="text-[10px] text-stone-500 uppercase font-black tracking-widest mb-2">{t(language, 'commission.rewards')}</h4>
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
                                    <><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500 font-bold italic">{t(language, 'commission.recruit_unlocked')}</span></>
                                )}
                                {reward.type === 'ISSUER_AFFINITY' && (
                                    <><Heart className="w-3 h-3 text-sky-400" /><span className="text-sky-400 font-bold">{t(language, 'commission.issuer_affinity_reward', { value: reward.issuerAffinity || 0 })}</span></>
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
                            onClick={() => {
                                actions.acceptContract(contract.id);
                                onActionComplete?.();
                            }}
                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg"
                        >
                            {t(language, 'commission.accept_contract')}
                        </SfxButton>
                        <SfxButton 
                            sfx="switch"
                            onClick={() => {
                                actions.declineContract({ contractId: contract.id });
                                onActionComplete?.();
                            }}
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
                                onClick={() => {
                                    actions.submitContract(contract.id);
                                    onActionComplete?.();
                                }}
                                disabled={!isReady}
                                className={`flex-1 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                                    isReady 
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-lg' 
                                    : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                                }`}
                            >
                                {isReady ? t(language, 'commission.submit_items') : t(language, 'commission.in_progress')}
                            </SfxButton>
                        ) : (
                            <SfxButton 
                                sfx="confirm"
                                onClick={() => {
                                    actions.claimObjectiveContract(contract.id);
                                    onActionComplete?.();
                                }}
                                disabled={!isReady}
                                className={`flex-1 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                                    isReady 
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-lg' 
                                    : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                                }`}
                            >
                                {isReady ? t(language, 'commission.claim_rewards') : t(language, 'commission.in_progress')}
                            </SfxButton>
                        )}
                        <SfxButton 
                            sfx="switch"
                            onClick={() => {
                                actions.failContract(contract.id);
                                onActionComplete?.();
                            }}
                            className="p-2 bg-stone-800 hover:bg-red-900/30 text-stone-500 hover:text-red-500 rounded-xl border border-stone-700 transition-all"
                            title={t(language, 'commission.abandon_contract')}
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
                            onActionComplete?.();
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                    >
                        <Trophy className="w-4 h-4" />
                        {t(language, 'commission.complete_and_claim')}
                    </SfxButton>
                )}

                {activeTab === 'expired' && (
                    <SfxButton 
                        sfx="switch"
                        onClick={() => {
                            actions.failContract(contract.id);
                            onActionComplete?.();
                        }}
                        className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-xl font-black uppercase tracking-widest text-[10px]"
                    >
                        {t(language, 'commission.dismiss_notice')}
                    </SfxButton>
                )}
            </div>
        </div>
    );
};
