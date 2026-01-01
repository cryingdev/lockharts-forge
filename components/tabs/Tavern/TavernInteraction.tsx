
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

const TavernInteraction: React.FC<TavernInteractionProps> = ({ mercenary, onBack }) => {
    const { state, actions } = useGame();
    const [dialogue, setDialogue] = useState(`(You sit across from ${mercenary.name}.)`);
    const [showGiftMenu, setShowGiftMenu] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [pendingGiftItem, setPendingGiftItem] = useState<InventoryItem | null>(null);
    
    const isHired = mercenary.status === 'HIRED' || mercenary.status === 'ON_EXPEDITION' || mercenary.status === 'INJURED';
    const hiringCost = calculateHiringCost(mercenary.level, mercenary.job);
    const canAfford = state.stats.gold >= hiringCost;
    const hasAffinity = mercenary.affinity >= CONTRACT_CONFIG.HIRE_AFFINITY_THRESHOLD;

    const handleTalk = () => {
        if (pendingGiftItem) return;
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
        i.type === 'EQUIPMENT'
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

    return (
        <div className="relative h-full w-full bg-stone-950 overflow-hidden flex flex-col items-center justify-center">
            
            {/* Background */}
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

            {/* Mercenary Vitals - TOP LEFT */}
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

            {/* Character Sprite Rendering - DVH BASED SCALING AS REQUESTED */}
            <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pointer-events-none pb-0">
               <div className="relative flex justify-center items-end w-full animate-in fade-in zoom-in-95 duration-700 ease-out">
                   <div className="relative h-[75dvh] md:h-64 w-auto flex justify-center bottom-[12dvh] md:bottom-0">
                       <img 
                           src={mercenary.sprite ? getAssetUrl(mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')} 
                           alt={mercenary.name}
                           className="h-full object-contain object-bottom filter drop-shadow-[0_0_100px_rgba(0,0,0,1)]"
                       />
                       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-10 bg-black/60 blur-3xl rounded-full -z-10"></div>
                   </div>
               </div>
            </div>

            {/* Tavern Table - Matching shop counter logic for grounding */}
            <div className="absolute bottom-0 w-full h-[35dvh] md:h-64 z-20 flex items-end justify-center pointer-events-none">
                <div className="w-full h-full bg-[#2a1e16] border-t-4 md:border-t-[8px] border-[#3e2723] shadow-[0_-40px_60px_rgba(0,0,0,0.85)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
                </div>
            </div>

            {/* INTERACTION MENU */}
            <div className={`absolute right-4 top-4 z-50 grid grid-cols-2 gap-2 w-60 md:w-80 animate-in slide-in-from-right-8 duration-700 delay-200 transition-opacity ${pendingGiftItem ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                
                <button 
                    onClick={onBack}
                    className="col-span-2 flex items-center gap-2 p-2 bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 hover:border-red-500 rounded-xl backdrop-blur-md transition-all shadow-xl group"
                >
                    <div className="bg-red-900/20 p-1.5 rounded-lg group-hover:text-red-400 transition-colors text-red-700 border border-red-900/30">
                        <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[11px] md:text-xs text-red-200 group-hover:text-white uppercase tracking-widest">Leave</span>
                </button>

                <button 
                    onClick={handleTalk}
                    className="flex items-center gap-2 p-2 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 hover:border-amber-500 rounded-xl backdrop-blur-md transition-all shadow-xl group"
                >
                    <div className="bg-stone-800 p-1.5 rounded-lg group-hover:bg-amber-900/30 group-hover:text-amber-500 transition-colors text-stone-500 group-hover:text-amber-500">
                        <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[11px] md:text-xs text-stone-300">Talk</span>
                </button>

                <button 
                    onClick={() => setShowGiftMenu(true)}
                    className="flex items-center gap-2 p-2 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 hover:border-pink-500 rounded-xl backdrop-blur-md transition-all shadow-xl group"
                >
                    <div className="bg-stone-800 p-1.5 rounded-lg group-hover:bg-pink-900/30 group-hover:text-pink-500 transition-colors text-stone-500 group-hover:text-pink-500">
                        <Gift className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[11px] md:text-xs text-stone-300">Gift</span>
                </button>

                {!isHired && (
                    <button 
                        onClick={handleRecruit}
                        disabled={!canAfford || !hasAffinity}
                        className={`flex items-center gap-2 p-2 border rounded-xl backdrop-blur-md transition-all shadow-xl group relative overflow-hidden ${
                            (!canAfford || !hasAffinity) 
                            ? 'bg-stone-950/80 border-stone-800 text-stone-600 grayscale cursor-not-allowed' 
                            : 'bg-amber-900/40 hover:bg-amber-800/60 border-amber-600/50 hover:border-amber-400 text-amber-100'
                        }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-colors ${(!canAfford || !hasAffinity) ? 'bg-stone-900 text-stone-700' : 'bg-amber-950/50 group-hover:text-amber-400 text-amber-600'}`}>
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                            <span className="font-bold text-[10px] md:text-xs uppercase">Recruit</span>
                            <span className={`text-[8px] md:text-[9px] font-mono ${(!canAfford || !hasAffinity) ? 'text-stone-700' : 'text-amber-500/70'}`}>
                                {hiringCost}G
                            </span>
                        </div>
                    </button>
                )}

                <button 
                    onClick={() => setShowDetail(true)}
                    className={`flex items-center gap-2 p-2 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 rounded-xl backdrop-blur-md transition-all shadow-xl group ${isHired ? 'hover:border-emerald-500' : 'hover:border-blue-500'}`}
                >
                    <div className={`bg-stone-800 p-1.5 rounded-lg transition-colors text-stone-500 ${isHired ? 'group-hover:bg-emerald-900/30 group-hover:text-emerald-500' : 'group-hover:bg-blue-900/30 group-hover:text-blue-500'}`}>
                        {isHired ? <Wrench className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                    </div>
                    <span className={`font-bold text-[11px] md:text-xs text-stone-300 ${isHired ? 'group-hover:text-emerald-200' : 'group-hover:text-blue-200'}`}>
                        {isHired ? 'Manage' : 'Inspect'}
                    </span>
                </button>
            </div>

            {/* Interaction Dialogue Area */}
            <DialogueBox 
                speaker={mercenary.name}
                text={dialogue}
                options={pendingGiftItem ? [
                    { label: `Give ${pendingGiftItem.name}`, action: handleConfirmGift, variant: 'primary' },
                    { label: "Cancel", action: handleCancelGift, variant: 'neutral' }
                ] : []}
            />

            {/* Gift Selection Overlay */}
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
                                                {item.icon || (isEquipment ? '⚔️' : '🎁')}
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

            {/* Mercenary Detail Modal */}
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
