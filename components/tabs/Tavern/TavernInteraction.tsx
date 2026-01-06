
import React, { useState, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import DialogueBox from '../../DialogueBox';
import { ArrowLeft, Heart, Coins, Gift, MessageSquare, UserPlus, Info, Zap, Package, X, ChevronRight, Search, Wrench, LogOut, Star } from 'lucide-react';
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

const TavernInteraction: React.FC<TavernInteractionProps> = ({ mercenary, onBack }) => {
    const { state, actions } = useGame();
    const [dialogue, setDialogue] = useState(`(You sit across from ${mercenary.name}.)`);
    const [showGiftMenu, setShowGiftMenu] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [pendingGiftItem, setPendingGiftItem] = useState<InventoryItem | null>(null);
    const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
    
    const isHired = mercenary.status === 'HIRED' || mercenary.status === 'ON_EXPEDITION' || mercenary.status === 'INJURED';
    const hiringCost = calculateHiringCost(mercenary.level, mercenary.job);
    const canAfford = state.stats.gold >= hiringCost;
    const hasAffinity = mercenary.affinity >= CONTRACT_CONFIG.HIRE_AFFINITY_THRESHOLD;

    const handleTalk = () => {
        if (pendingGiftItem) return;

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

    const handleRecruit = () => {
        if (pendingGiftItem) return;
        if (!hasAffinity) {
            setDialogue("I don't know you well enough to pledge my blade to your forge yet.");
            return;
        }
        if (!canAfford) {
            setDialogue(`The contract is ${hiringCost} gold. Come back when you have the coin.`);
            return;
        }
        actions.hireMercenary(mercenary.id, hiringCost);
        setDialogue("A fair contract. My strength is yours, Lockhart.");
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

            <div className="absolute top-4 left-4 z-40 animate-in slide-in-from-left-4 duration-500">
                <div className="bg-stone-900/90 border border-stone-700 p-3 rounded-xl backdrop-blur-md shadow-2xl min-w-[180px]">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-col leading-tight">
                            <span className="font-black text-amber-500 text-[8px] tracking-widest uppercase">{mercenary.job}</span>
                            <span className="text-stone-500 text-[8px] font-mono">Lv.{mercenary.level}</span>
                        </div>
                        <div className="flex items-center gap-1 text-pink-400 font-bold bg-pink-950/20 px-1.5 py-0.5 rounded border border-pink-900/30">
                            <Heart className="w-2.5 h-2.5 fill-pink-400" />
                            <span className="font-mono text-xs">{mercenary.affinity}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <div className="flex flex-col gap-0.5">
                            <div className="w-full bg-stone-950 h-1 rounded-full overflow-hidden border border-stone-800">
                                <div className="bg-red-600 h-full transition-all duration-700" style={{ width: `${(mercenary.currentHp / mercenary.maxHp) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="w-full bg-stone-950 h-1 rounded-full overflow-hidden border border-stone-800">
                                <div className="bg-blue-600 h-full transition-all duration-700" style={{ width: `${(mercenary.currentMp / mercenary.maxMp) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
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

            {/* Interaction Action Bar - Perfectly Centered, Leave at far right */}
            <div 
                className={`absolute bottom-[calc(22dvh+1.5rem)] md:bottom-[calc(28vh+4rem)] left-0 right-0 z-50 flex flex-row items-center justify-center transition-opacity duration-500 ${pendingGiftItem ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}
            >
                <div className="flex flex-row items-center justify-center gap-1.5 md:gap-3 px-4 max-w-full overflow-x-auto no-scrollbar py-2">
                    {/* Talk Button */}
                    <button 
                        onClick={handleTalk}
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 hover:border-amber-500 rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0"
                    >
                        <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-amber-500" />
                        <span className="font-black text-[9px] md:text-xs text-stone-200 uppercase tracking-widest">Talk</span>
                    </button>

                    {/* Gift Button */}
                    <button 
                        onClick={() => setShowGiftMenu(true)}
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 hover:border-pink-500 rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0"
                    >
                        <Gift className="w-3 h-3 md:w-4 md:h-4 text-pink-500" />
                        <span className="font-black text-[9px] md:text-xs text-stone-200 uppercase tracking-widest">Gift</span>
                    </button>

                    {/* Recruit Button */}
                    {!isHired && (
                        <button 
                            onClick={handleRecruit}
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

                    {/* Manage/Inspect Button */}
                    <button 
                        onClick={() => setShowDetail(true)}
                        className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0 ${isHired ? 'hover:border-emerald-500' : 'hover:border-blue-500'}`}
                    >
                        {isHired ? <Wrench className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" /> : <Search className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />}
                        <span className="font-black text-[9px] md:text-xs text-stone-200 uppercase tracking-widest">
                            {isHired ? 'Manage' : 'Inspect'}
                        </span>
                    </button>

                    {/* Leave Button - Far Right */}
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 md:py-3.5 bg-red-950/45 hover:bg-red-900/60 border border-red-900/50 rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0"
                    >
                        <LogOut className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                    </button>
                </div>
            </div>

            <DialogueBox 
                speaker={mercenary.name}
                text={dialogue}
                options={pendingGiftItem ? [
                    { label: `Give ${pendingGiftItem.name}`, action: handleConfirmGift, variant: 'primary' },
                    { label: "Cancel", action: handleCancelGift, variant: 'neutral' }
                ] : []}
            />

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
                    isReadOnly={!isHired}
                />
            )}
        </div>
    );
};

export default TavernInteraction;
