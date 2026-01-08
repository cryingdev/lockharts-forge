import React, { useState, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import DialogueBox from '../../DialogueBox';
import { ArrowLeft, Heart, Coins, Gift, MessageSquare, UserPlus, Info, Zap, Package, X, ChevronRight, Search, Wrench, LogOut, Star, UserMinus, Ban } from 'lucide-react';
import { getAssetUrl } from '../../../utils';
import { Mercenary } from '../../../models/Mercenary';
import { CONTRACT_CONFIG, calculateHiringCost } from '../../../config/contract-config';
import { InventoryItem } from '../../../types/inventory';
import MercenaryDetailModal from '../../modals/MercenaryDetailModal';

interface TavernInteractionProps {
    mercenary: Mercenary;
    onBack: () => void;
}

interface FloatingHeart {
    id: number;
    left: number;
    delay: number;
    size: number;
}

type InteractionStep = 'IDLE' | 'CONFIRM_HIRE' | 'CONFIRM_FIRE';

const TavernInteraction: React.FC<TavernInteractionProps> = ({ mercenary, onBack }) => {
    const { state, actions } = useGame();
    const [dialogue, setDialogue] = useState(`(You sit across from ${mercenary.name}.)`);
    const [showGiftMenu, setShowGiftMenu] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [pendingGiftItem, setPendingGiftItem] = useState<InventoryItem | null>(null);
    const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
    
    // Step-based interaction state
    const [step, setStep] = useState<InteractionStep>('IDLE');

    const isHired = mercenary.status === 'HIRED' || mercenary.status === 'ON_EXPEDITION' || mercenary.status === 'INJURED';
    const isOnExpedition = mercenary.status === 'ON_EXPEDITION';
    const hiringCost = calculateHiringCost(mercenary.level, mercenary.job);
    const canAfford = state.stats.gold >= hiringCost;
    const hasAffinity = mercenary.affinity >= CONTRACT_CONFIG.HIRE_AFFINITY_THRESHOLD;

    const handleTalk = () => {
        if (pendingGiftItem || step !== 'IDLE') return;

        if (!state.talkedToToday.includes(mercenary.id)) {
            actions.talkMercenary(mercenary.id);
            const newHearts = Array.from({ length: 5 }).map((_, i) => ({
                id: Date.now() + i,
                left: 40 + Math.random() * 20,
                delay: Math.random() * 0.5,
                size: 16 + Math.random() * 12
            }));
            setFloatingHearts(prev => [...prev, ...newHearts]);
            setTimeout(() => setFloatingHearts([]), 3000);
        }

        const lines = [
            "The road is long, but a warm fire makes it easier.",
            "I heard rumors of rare ores in the Rat Cellar...",
            "What's your specialty, smith? I need something that won't break.",
            "Business seems slow today. Maybe I can help with that later.",
            "I've seen many forges, but yours has... potential.",
            "Tell me, do you have any ale left?",
            "I'm looking for work. Something that pays in gold and glory."
        ];
        setDialogue(lines[Math.floor(Math.random() * lines.length)]);
    };

    // --- Hiring Flow ---
    const handleRecruitInit = () => {
        if (!hasAffinity) {
            setDialogue("I don't know you well enough to pledge my blade to your forge yet.");
            return;
        }
        if (!canAfford) {
            setDialogue(`The contract is ${hiringCost} gold. Come back when you have the coin.`);
            return;
        }
        setStep('CONFIRM_HIRE');
        setDialogue(`"A contract for ${hiringCost} Gold? Are you certain you want me on your squad?"`);
    };

    const handleConfirmHire = () => {
        actions.hireMercenary(mercenary.id, hiringCost);
        setStep('IDLE');
        setDialogue("A fair contract. My strength is yours, Lockhart.");
    };

    // --- Termination Flow ---
    const handleTerminateInit = () => {
        setStep('CONFIRM_FIRE');
        setDialogue(`(Surprised) "Terminate the contract? Did I fail you in some way? If you let me go now, I might not return for some time."`);
    };

    const handleConfirmTerminate = () => {
        actions.fireMercenary(mercenary.id);
        setStep('IDLE');
        setDialogue(`"I see. Perhaps our paths will cross again on another road. Farewell, smith."`);
    };

    const handleRecall = () => {
        if (mercenary.assignedExpeditionId) {
            if (window.confirm("Abort current mission and recall the entire squad? No rewards will be gained.")) {
                actions.abortExpedition(mercenary.assignedExpeditionId);
                setDialogue("(Heavy breathing) We're back. The mission was too hazardous... we had to retreat.");
            }
        }
    };

    const handleCancelStep = () => {
        setStep('IDLE');
        setDialogue(`"I'm glad we cleared that up."`);
    };

    const handleSelectItemForGift = (item: InventoryItem) => {
        setPendingGiftItem(item);
        setShowGiftMenu(false);
        const raritySuffix = item.type === 'EQUIPMENT' ? ` (${item.equipmentData?.rarity})` : '';
        setDialogue(`(You hold out the ${item.name}${raritySuffix}.) "Would you like this?"`);
    };

    const handleConfirmGift = () => {
        if (!pendingGiftItem) return;
        const item = pendingGiftItem;
        actions.giveGift(mercenary.id, item.id);
        if (item.type === 'EQUIPMENT') {
            setDialogue(`(Surprised) "Is this for me? A ${item.name}? I will carry it with honor."`);
        } else {
            setDialogue(`${mercenary.name} seems pleased with the gift. "For me? You're too kind."`);
        }
        setPendingGiftItem(null);
    };

    const handleCancelGift = () => {
        setPendingGiftItem(null);
        setDialogue(`(You pull your hand back.) "Actually, never mind."`);
    };

    const giftableItems = state.inventory.filter(i => 
        i.type === 'RESOURCE' || 
        i.type === 'CONSUMABLE' || 
        i.type === 'EQUIPMENT' ||
        i.type === 'SCROLL'
    );

    const getRarityColor = (rarity?: string) => {
        switch (rarity) {
            case 'Common': return 'text-stone-400';
            case 'Uncommon': return 'text-emerald-400';
            case 'Rare': return 'text-blue-400';
            case 'Epic': return 'text-purple-400';
            case 'Legendary': return 'text-amber-400';
            default: return 'text-stone-500';
        }
    };

    const getItemImageUrl = (item: InventoryItem) => {
        if (item.type === 'SCROLL') return getAssetUrl('scroll.png');
        if (item.id.startsWith('scroll_') || item.id.startsWith('recipe_scroll_')) return getAssetUrl('scroll.png');
        if (item.type === 'EQUIPMENT' && item.equipmentData) {
            if (item.equipmentData.image) return getAssetUrl(item.equipmentData.image);
            return item.equipmentData.recipeId ? getAssetUrl(`${item.equipmentData.recipeId}.png`) : getAssetUrl(`${item.id.split('_')[0]}.png`);
        }
        return getAssetUrl(`${item.id}.png`);
    };

    return (
        <div className="relative h-full w-full bg-stone-950 overflow-hidden flex flex-col items-center justify-center">
            
            <style>
                {`
                    @keyframes heartFloatUp {
                        0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
                        20% { opacity: 1; }
                        100% { transform: translateY(-300px) translateX(var(--wobble)) scale(1.2); opacity: 0; }
                    }
                    .animate-heart {
                        animation: heartFloatUp 2.5s ease-out forwards;
                    }
                `}
            </style>

            <div className="absolute inset-0 z-0">
                <img 
                    src={getAssetUrl('tavern_bg.jpeg')} 
                    alt="Tavern Interior" 
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.style.background = 'linear-gradient(to bottom, #1c1917, #0c0a09)';
                    }}
                />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Mercenary Info HUD */}
            <div className="absolute top-4 left-4 z-40 animate-in slide-in-from-left-4 duration-500 w-[32%] max-w-[180px] md:max-w-[240px]">
                <div className="bg-stone-900/90 border border-stone-700 p-2.5 md:p-4 rounded-xl backdrop-blur-md shadow-2xl">
                    <div className="flex justify-between items-center mb-1.5 md:mb-2.5">
                        <div className="flex flex-col leading-tight min-w-0">
                            <span className="font-black text-amber-500 text-[8px] md:text-[10px] tracking-widest uppercase truncate">{mercenary.job}</span>
                            <span className="text-stone-500 text-[8px] md:text-[10px] font-mono">Lv.{mercenary.level}</span>
                        </div>
                        <div className="flex items-center gap-1 text-pink-400 font-bold bg-pink-950/20 px-1 md:px-1.5 py-0.5 rounded border border-pink-900/30 shrink-0">
                            <Heart className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 fill-pink-400" />
                            <span className="font-mono text-[9px] md:text-xs">{mercenary.affinity}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5 md:space-y-2.5">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-center text-[7px] md:text-[9px] font-mono text-stone-500 px-0.5">
                                <span>HP</span>
                                <span>{Math.floor(mercenary.currentHp)}/{mercenary.maxHp}</span>
                            </div>
                            <div className="w-full bg-stone-950 h-1 md:h-1.5 rounded-full overflow-hidden border border-stone-800">
                                <div className="bg-red-600 h-full transition-all duration-700" style={{ width: `${(mercenary.currentHp / mercenary.maxHp) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-center text-[7px] md:text-[9px] font-mono text-stone-500 px-0.5">
                                <span>MP</span>
                                <span>{Math.floor(mercenary.currentMp)}/{mercenary.maxMp}</span>
                            </div>
                            <div className="w-full bg-stone-950 h-1 md:h-1.5 rounded-full overflow-hidden border border-stone-800">
                                <div className="bg-blue-600 h-full transition-all duration-700" style={{ width: `${(mercenary.currentMp / mercenary.maxMp) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                    {isOnExpedition && (
                        <div className="mt-3 bg-blue-950/40 border border-blue-700/30 rounded-lg p-1.5 flex flex-col items-center">
                            <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest animate-pulse">On Expedition</span>
                            <button 
                                onClick={handleRecall}
                                className="mt-1 w-full py-1 bg-red-900/60 hover:bg-red-800 text-white rounded text-[8px] font-black uppercase flex items-center justify-center gap-1 transition-all"
                            >
                                <Ban className="w-2.5 h-2.5" /> Force Recall
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pointer-events-none pb-0">
               <div className="relative flex justify-center items-end w-full animate-in fade-in zoom-in-95 duration-700 ease-out">
                   <div className="relative h-[75dvh] md:h-[110dvh] w-auto flex justify-center bottom-[12dvh] md:bottom-0 md:translate-y-[20dvh]">
                       <img 
                           src={mercenary.sprite ? getAssetUrl(mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')} 
                           alt={mercenary.name}
                           className="h-full w-auto object-contain object-bottom filter drop-shadow-[0_0_100px_rgba(0,0,0,1)]"
                       />
                       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-10 bg-black/60 blur-3xl rounded-full -z-10"></div>
                       
                       {floatingHearts.map(heart => (
                           <Heart 
                                key={heart.id}
                                className="absolute animate-heart fill-pink-500 text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]"
                                style={{
                                    left: `${heart.left}%`,
                                    bottom: '30%',
                                    width: heart.size,
                                    height: heart.size,
                                    animationDelay: `${heart.delay}s`,
                                    '--wobble': `${(Math.random() - 0.5) * 40}px`
                                } as React.CSSProperties}
                           />
                       ))}
                   </div>
               </div>
            </div>

            <div className="absolute bottom-0 w-full h-[35dvh] md:h-64 z-20 flex items-end justify-center pointer-events-none">
                <div className="w-full h-full bg-[#2a1e16] border-t-4 md:border-t-[8px] border-[#3e2723] shadow-[0_-40px_60px_rgba(0,0,0,0.85)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
                </div>
            </div>

            {/* Bottom UI Unit */}
            <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl z-50 flex flex-col items-center gap-[10px] pb-[env(safe-area-inset-bottom)] pointer-events-none">
                
                {/* Interaction Action Bars */}
                <div className={`flex flex-col items-end gap-2 w-full px-4 py-2 pointer-events-auto transition-opacity duration-500 ${(pendingGiftItem || step !== 'IDLE') ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                    
                    {/* Top Row: 나가기 버튼 단독 배치 */}
                    <div className="flex justify-end w-full">
                        <button 
                            onClick={onBack}
                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-3 bg-red-950/45 hover:bg-red-900/60 border border-red-900/50 rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0"
                        >
                            <LogOut className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                        </button>
                    </div>

                    {/* Bottom Row: 기능 버튼들 (우측 정렬 & 개행 가능) */}
                    <div className="flex flex-wrap items-center justify-end gap-1.5 md:gap-3 w-full">
                        <button 
                            onClick={handleTalk}
                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 hover:border-amber-500 rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0"
                        >
                            <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-amber-500" />
                            <span className="font-black text-[9px] md:text-xs text-stone-200 uppercase tracking-widest">Talk</span>
                        </button>

                        <button 
                            onClick={() => setShowGiftMenu(true)}
                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 hover:border-pink-500 rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0"
                        >
                            <Gift className="w-3 h-3 md:w-4 md:h-4 text-pink-500" />
                            <span className="font-black text-[9px] md:text-xs text-stone-200 uppercase tracking-widest">Gift</span>
                        </button>

                        {/* Recruit or Terminate Button */}
                        {isHired ? (
                            <button 
                                onClick={handleTerminateInit}
                                disabled={isOnExpedition}
                                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 border rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0 text-white ${isOnExpedition ? 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed opacity-50' : 'bg-red-950/60 hover:bg-red-900/80 border border-red-800'}`}
                            >
                                <UserMinus className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="font-black text-[9px] md:text-xs uppercase tracking-widest">Terminate</span>
                            </button>
                        ) : (
                            <button 
                                onClick={handleRecruitInit}
                                disabled={!canAfford || !hasAffinity}
                                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 border rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0 ${
                                    (!canAfford || !hasAffinity) 
                                    ? 'bg-stone-950/80 border-stone-800 text-stone-600 grayscale cursor-not-allowed' 
                                    : 'bg-amber-900/65 hover:bg-amber-800 border-amber-500 text-white'
                                }`}
                            >
                                <UserPlus className="w-3 h-3 md:w-4 md:h-4" />
                                <div className="flex flex-col items-start leading-none">
                                    <span className="font-black text-[9px] md:text-xs uppercase tracking-widest">Recruit</span>
                                    {hasAffinity && <span className="text-[7px] md:text-[8px] font-mono opacity-70">{hiringCost}G</span>}
                                </div>
                            </button>
                        )}

                        <button 
                            onClick={() => setShowDetail(true)}
                            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0 ${isHired ? 'hover:border-emerald-500' : 'hover:border-blue-500'}`}
                        >
                            {isHired ? <Wrench className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" /> : <Search className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />}
                            <span className="font-black text-[9px] md:text-xs text-stone-200 uppercase tracking-widest">
                                {isHired ? 'Manage' : 'Inspect'}
                            </span>
                        </button>
                    </div>
                </div>

                <DialogueBox 
                    speaker={mercenary.name}
                    text={dialogue}
                    options={
                        pendingGiftItem ? [
                            { label: `Give ${pendingGiftItem.name}`, action: handleConfirmGift, variant: 'primary' },
                            { label: "Cancel", action: handleCancelGift, variant: 'neutral' }
                        ] : 
                        step === 'CONFIRM_HIRE' ? [
                            { label: `Sign Contract (-${hiringCost}G)`, action: handleConfirmHire, variant: 'primary' },
                            { label: "Think again", action: handleCancelStep, variant: 'neutral' }
                        ] : 
                        step === 'CONFIRM_FIRE' ? [
                            { label: "Terminate Contract", action: handleConfirmTerminate, variant: 'danger' },
                            { label: "Stay with me", action: handleCancelStep, variant: 'neutral' }
                        ] : []
                    }
                    className="w-full relative pointer-events-auto"
                />
            </div>

            {showGiftMenu && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[85vh]">
                        <div className="p-3 border-b border-stone-800 bg-stone-850 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="bg-pink-900/30 p-1.5 rounded-lg border border-pink-700/50">
                                    <Gift className="w-4 h-4 text-pink-500" />
                                </div>
                                <h3 className="font-bold text-stone-200 font-serif uppercase tracking-widest text-sm">Select Gift</h3>
                            </div>
                            <button onClick={() => setShowGiftMenu(false)} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500 hover:text-stone-300 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-3 overflow-y-auto grid grid-cols-2 gap-2 custom-scrollbar flex-1 min-h-0">
                            {giftableItems.length === 0 ? (
                                <div className="col-span-2 py-12 text-center opacity-50">
                                    <Package className="w-8 h-8 text-stone-500 mx-auto mb-2" />
                                    <p className="text-[10px] text-stone-600 italic">Inventory is empty.</p>
                                </div>
                            ) : (
                                giftableItems.map(item => {
                                    const isEquipment = item.type === 'EQUIPMENT';
                                    const rarity = item.equipmentData?.rarity;
                                    const rarityColor = getRarityColor(rarity);

                                    return (
                                        <button 
                                            key={item.id} 
                                            onClick={() => handleSelectItemForGift(item)}
                                            className={`flex items-center gap-2 p-2 bg-stone-800 hover:bg-stone-750 border rounded-xl transition-all group text-left ${isEquipment ? 'border-amber-900/30' : 'border-stone-700'}`}
                                        >
                                            <div className="w-8 h-8 bg-stone-950 rounded-lg border border-stone-800 flex items-center justify-center text-lg shrink-0">
                                                <img src={getItemImageUrl(item)} className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                                <span className="hidden text-xl">📦</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className={`text-[10px] font-bold truncate ${isEquipment ? 'text-stone-200' : 'text-stone-300'}`}>{item.name}</div>
                                                <div className="flex items-center gap-1 leading-none mt-0.5">
                                                    {isEquipment ? (
                                                        <span className={`text-[7px] font-black uppercase tracking-tighter ${rarityColor}`}>{rarity}</span>
                                                    ) : (
                                                        <div className="text-[8px] text-stone-500 font-mono">x{item.quantity}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showDetail && (
                <MercenaryDetailModal 
                    mercenary={mercenary}
                    onClose={() => setShowDetail(false)}
                    onUnequip={(mercId, slot) => actions.unequipItem(mercId, slot)}
                    isReadOnly={!isHired || isOnExpedition}
                />
            )}
        </div>
    );
};

export default TavernInteraction;