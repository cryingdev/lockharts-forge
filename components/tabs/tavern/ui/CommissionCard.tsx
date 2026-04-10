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
import { getLocalizedItemName } from '../../../../utils/itemText';

interface CommissionCardProps {
    contract: ContractDefinition;
    activeTab: 'available' | 'accepted' | 'ready' | 'expired';
    onActionComplete?: () => void;
    className?: string;
    visualStyle?: 'default' | 'parchment';
}

export const CommissionCard: React.FC<CommissionCardProps> = ({
    contract,
    activeTab,
    onActionComplete,
    className,
    visualStyle = 'default',
}) => {
    const { state, actions } = useGame();
    const language = state.settings.language;
    const isParchment = visualStyle === 'parchment';
    
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

    const getKindBadgeClasses = (kind?: string) => {
        if (isParchment) {
            switch (kind) {
                case 'CRAFT':
                    return 'text-[#5f451f] bg-[#d8b06a] border-[#a97c33]';
                case 'TURN_IN':
                    return 'text-[#55452f] bg-[#d8c19a] border-[#aa8c63]';
                case 'HUNT':
                    return 'text-[#5b2b22] bg-[#c98b74] border-[#9f5b45]';
                case 'BOSS':
                    return 'text-[#5a1f1f] bg-[#c68b3f] border-[#9a5e1d]';
                default:
                    return 'text-[#5f451f] bg-[#d8b06a] border-[#a97c33]';
            }
        }

        switch (kind) {
            case 'CRAFT':
                return 'text-amber-100 bg-amber-700/70 border-amber-400/40';
            case 'TURN_IN':
                return 'text-stone-100 bg-stone-600/75 border-stone-300/30';
            case 'HUNT':
                return 'text-red-100 bg-red-700/65 border-red-400/35';
            case 'BOSS':
                return 'text-orange-50 bg-orange-700/75 border-orange-400/40 shadow-[0_0_10px_rgba(245,158,11,0.12)]';
            default:
                return 'text-stone-400 bg-stone-800/30 border-stone-700';
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
        if (isParchment) {
            switch (kind) {
                case 'BOSS':
                    return 'border-[#9e7a49] bg-gradient-to-br from-[#e2c994] via-[#d7bf8f] to-[#ccb17b] shadow-[inset_0_1px_0_rgba(255,244,212,0.25),inset_0_-10px_24px_rgba(111,78,41,0.10)]';
                case 'HUNT':
                    return 'border-[#98725a] bg-gradient-to-br from-[#deca9f] via-[#d4c09a] to-[#c6af85] shadow-[inset_0_1px_0_rgba(255,244,212,0.22),inset_0_-10px_24px_rgba(111,78,41,0.10)]';
                case 'TURN_IN':
                    return 'border-[#8f7554] bg-gradient-to-br from-[#e2ce9f] via-[#d8c396] to-[#cdb583] shadow-[inset_0_1px_0_rgba(255,244,212,0.22),inset_0_-10px_24px_rgba(111,78,41,0.10)]';
                default:
                    return 'border-[#8b6a45] bg-gradient-to-br from-[#dfca9b] via-[#d4bf92] to-[#c7b080] shadow-[inset_0_1px_0_rgba(255,244,212,0.22),inset_0_-10px_24px_rgba(111,78,41,0.10)]';
            }
        }
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

    const getKindLabel = (kind?: string) => {
        switch (kind) {
            case 'CRAFT':
                return t(language, 'commission.kind_craft');
            case 'HUNT':
                return t(language, 'commission.kind_hunt');
            case 'BOSS':
                return t(language, 'commission.kind_boss');
            case 'TURN_IN':
                return t(language, 'commission.kind_turn_in');
            default:
                return kind || 'GENERAL';
        }
    };

    const getIssuerLabel = (issuerId?: string, issuerName?: string) => {
        switch (issuerId) {
            case 'TOWN_GUARD':
                return t(language, 'commission.issuer_town_guard');
            case 'ASHFIELD_TRADERS':
                return t(language, 'commission.issuer_ashfield_traders');
            case 'CHAPEL_OF_EMBER':
                return t(language, 'commission.issuer_chapel_of_ember');
            case 'ADVENTURERS_GUILD':
                return t(language, 'commission.issuer_adventurers_guild');
            default:
                return issuerName || issuerId;
        }
    };

    const highlightBadge = getContractHighlightBadge(contract.kind);
    const isNamedPersonalRequest = contract.source === 'TAVERN' && contract.unique && !!contract.mercenaryId;

    return (
        <div className={`border ${isParchment ? 'rounded-lg' : 'rounded-xl'} p-6 flex flex-col gap-5.5 transition-colors relative overflow-hidden ${className ?? ''} ${
            isNamedPersonalRequest
            ? isParchment
                ? 'border-[#9d6f74] bg-gradient-to-br from-[#d7c095] via-[#cfb78f] to-[#c1a77f] shadow-[inset_0_1px_0_rgba(255,244,212,0.18),inset_0_-12px_26px_rgba(111,78,41,0.12)]'
                : 'border-fuchsia-500/35 shadow-[inset_0_0_28px_rgba(217,70,239,0.08)] bg-gradient-to-br from-fuchsia-950/20 via-stone-900/85 to-stone-950/90'
            : contract.source === 'TAVERN' 
            ? isParchment
                ? 'border-[#8b6a45] bg-gradient-to-br from-[#d7c297] via-[#ceba90] to-[#c0a77d] shadow-[inset_0_1px_0_rgba(255,244,212,0.18),inset_0_-12px_26px_rgba(111,78,41,0.12)]'
                : 'border-indigo-500/30 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)] bg-stone-900/80'
            : getContractAccentClasses(contract.kind)
        }`}>
            {isParchment && (
                <>
                    <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] border border-[#f4e1b6]/18" />
                    <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_18%_14%,rgba(255,245,220,0.22),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(120,84,46,0.07),transparent_30%),repeating-linear-gradient(-7deg,rgba(255,245,220,0.04)_0px,rgba(255,245,220,0.04)_3px,rgba(145,108,62,0.03)_3px,rgba(145,108,62,0.03)_11px)]" />
                </>
            )}
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
                    <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black border tracking-[0.12em] ${getKindBadgeClasses(contract.kind)}`}>
                            {contract.urgency === 'URGENT' && <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />}
                            {getKindIcon(contract.kind)}
                            {getKindLabel(contract.kind)}
                        </span>
                        {(contract.issuerName || contract.issuerId || contract.source === 'TAVERN') && (
                            <span className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-[0.16em] px-2 py-1 rounded-md border ${
                                isNamedPersonalRequest
                                ? isParchment
                                    ? 'text-[#6b4b62] bg-[#ead1da]/42 border-[#b78ba6]'
                                    : 'text-fuchsia-200 bg-fuchsia-950/50 border-fuchsia-500/30'
                                : contract.source === 'TAVERN' 
                                ? isParchment
                                    ? 'text-[#625342] bg-[#eadab6]/42 border-[#b69768]'
                                    : 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30' 
                                : isParchment
                                    ? 'text-[#6b5a46] bg-[#ead9b7]/42 border-[#b39467]'
                                    : 'text-stone-500 bg-stone-950/40 border-stone-800/50'
                            }`}>
                                {contract.source === 'TAVERN'
                                    ? <User className={`w-3 h-3 ${isNamedPersonalRequest ? 'text-fuchsia-300/70' : 'text-indigo-400/50'}`} />
                                    : getIssuerIcon(contract.issuerId)}
                                {contract.source === 'TAVERN'
                                    ? t(language, isNamedPersonalRequest ? 'commission.named_personal_badge' : 'commission.personal_badge', { name: contract.clientName })
                                    : getIssuerLabel(contract.issuerId, contract.issuerName)}
                            </span>
                        )}
                    </div>
                    <h3 className={`text-[1.1rem] font-black uppercase tracking-[0.03em] ${isParchment ? 'text-[#4a3019]' : 'text-amber-100'}`}>{contract.title}</h3>
                    <p className={`mt-2 text-[15px] italic leading-7 ${isParchment ? 'text-[#5f4834]' : 'text-stone-300/85'}`}>"{contract.description}"</p>
                    {issuerAffinity !== null && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <div className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] font-bold rounded-md px-2 py-1 border ${isParchment ? 'text-sky-800 bg-sky-100/24 border-sky-800/18' : 'text-sky-300 bg-sky-950/30 border border-sky-500/20'}`}>
                                <Heart className="w-3 h-3 text-sky-300" />
                                <span>{t(language, 'commission.issuer_affinity', { value: issuerAffinity })}</span>
                            </div>
                            <div className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] font-bold rounded-md px-2 py-1 border ${isParchment ? 'text-amber-900 bg-amber-100/20 border-amber-800/18' : 'text-amber-200 bg-amber-950/20 border border-amber-500/20'}`}>
                                <Shield className="w-3 h-3 text-amber-300" />
                                <span>{t(language, `commission.affinity_tier_${getIssuerAffinityTier(issuerAffinity)}`)}</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border ${isParchment ? 'border-[#a98a60] bg-[#eedbb3]/46' : 'border-stone-800 bg-stone-950'}`}>
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className={`text-[11px] font-mono ${isParchment ? 'text-[#7a531f]' : 'text-amber-400'}`}>{contract.daysRemaining}d</span>
                    </div>
                </div>
            </div>

            {/* Objectives / Requirements */}
            <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
                <div>
                    <h4 className={`mb-3 text-[12px] font-black uppercase tracking-[0.18em] flex items-center gap-1 ${isParchment ? 'text-[#7a6549]' : 'text-stone-500'}`}>
                        {contract.kind === 'HUNT' || contract.kind === 'BOSS'
                            ? t(language, 'commission.objectives')
                            : t(language, 'commission.requirements')}
                    </h4>
                    <div className="space-y-2">
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
                            const fallbackName = req.itemId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                            const displayName = itemData
                                ? getLocalizedItemName(language, { id: req.itemId, name: itemData.name } as any)
                                : fallbackName;

                            return (
                                <div key={idx} className={`flex items-center justify-between text-[13px] px-3.5 py-3 ${isParchment ? 'rounded-lg' : 'rounded-xl'} border ${isParchment ? 'bg-[#efdfb7]/22 border-[#b69563]' : 'bg-stone-950/55 border-stone-800/60'}`}>
                                    <div className="flex min-w-0 items-center gap-2 mr-2">
                                        <span className={`${isParchment ? 'text-[#4e3826]' : 'text-stone-300'} truncate`}>{displayName}</span>
                                        {req.minQuality !== undefined && (
                                            <span className="shrink-0 px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-950/20 text-[10.5px] font-black uppercase tracking-[0.16em] text-amber-300">
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
                    <h4 className={`mb-3 text-[12px] font-black uppercase tracking-[0.18em] ${isParchment ? 'text-[#7a6549]' : 'text-stone-500'}`}>{t(language, 'commission.rewards')}</h4>
                    <div className="space-y-2">
                        {contract.rewards.map((reward, idx) => (
                            <div key={idx} className={`flex items-center gap-2 text-[13px] px-3.5 py-3 ${isParchment ? 'rounded-lg' : 'rounded-xl'} border ${isParchment ? 'bg-[#efdfb7]/22 border-[#b69563]' : 'bg-stone-950/55 border-stone-800/60'}`}>
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
            <div className="mt-3.5 flex gap-3">
                {activeTab === 'available' && (
                    <>
                        <SfxButton 
                            sfx="confirm"
                            onClick={() => {
                                actions.acceptContract(contract.id);
                                onActionComplete?.();
                            }}
                            className="flex-1 rounded-2xl bg-amber-500 py-[1.15rem] text-[15px] font-black uppercase tracking-[0.18em] text-stone-950 shadow-[0_18px_30px_rgba(245,158,11,0.28)] transition-all hover:bg-amber-400"
                        >
                            {t(language, 'commission.accept_contract')}
                        </SfxButton>
                        <SfxButton 
                            sfx="switch"
                            onClick={() => {
                                actions.declineContract({ contractId: contract.id });
                                onActionComplete?.();
                            }}
                            className="rounded-2xl border border-stone-700 bg-stone-800 px-4 py-[1.05rem] text-stone-500 transition-all hover:bg-red-900/30 hover:text-red-500"
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
                                className={`flex-1 rounded-2xl py-4 text-[15px] font-black uppercase tracking-[0.16em] transition-all ${
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
                                className={`flex-1 rounded-2xl py-4 text-[15px] font-black uppercase tracking-[0.16em] transition-all ${
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
                            className="rounded-2xl border border-stone-700 bg-stone-800 px-4 py-[1.05rem] text-stone-500 transition-all hover:bg-red-900/30 hover:text-red-500"
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
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-[1.2rem] text-[16px] font-black leading-none tracking-[0.14em] text-stone-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500"
                    >
                        <Trophy className="w-4 h-4" />
                        {t(language, 'commission.complete_and_claim')}
                    </SfxButton>
                )}

                {activeTab === 'expired' && (
                    <div className="w-full space-y-3">
                        <div className={`rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${isParchment ? 'border-[#a36a58] bg-[#b36d5d]/14 text-[#6d3328]' : 'border-red-500/20 bg-red-950/20 text-red-300'}`}>
                            {t(language, 'commission.failed_notice')}
                        </div>
                        <SfxButton 
                            sfx="switch"
                            onClick={() => {
                                actions.dismissExpiredContract(contract.id);
                                onActionComplete?.();
                            }}
                            className="w-full rounded-2xl bg-stone-800 py-4 text-[15px] font-black uppercase tracking-[0.16em] text-stone-300 hover:bg-stone-700"
                        >
                            {t(language, 'common.confirm')}
                        </SfxButton>
                    </div>
                )}
            </div>
        </div>
    );
};
