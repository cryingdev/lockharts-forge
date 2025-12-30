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

    // Step 1: Select item from menu
    const handleSelectItemForGift = (item: InventoryItem) => {
        setPendingGiftItem(item);
        setShowGiftMenu(false);
        const raritySuffix = item.type === 'EQUIPMENT' ? ` (${item.equipmentData?.rarity})` : '';
        setDialogue(`(You hold out the ${item.name}${raritySuffix}.) "Would you like this?"`);
    };

    // Step 2: Finalize the gift
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

    // Step 2 Alternate: Cancel
    const handleCancelGift = () => {
        setPendingGiftItem(null);
        setDialogue(`(You pull your hand back.) "Actually, never mind."`);
    };

    // Filter updated to include EQUIPMENT
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

            {/* Back Button (Floating) */}
            <button 
                onClick={onBack}
                disabled={!!pendingGiftItem}
                className={`absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-md transition-all shadow-xl group ${
                    pendingGiftItem ? 'bg-stone-950/50 border-stone-800 text-stone-600 cursor-not-allowed' : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300 border-stone-700'
                }`}
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-sm">Return to Tavern</span>
            </button>

            {/* Mercenary Vitals Header (Right Side Top) */}
            <div className="absolute top-6 right-6 z-40 flex flex-col gap-3">
                <div className="bg-stone-900/90 border border-stone-700 p-4 rounded-xl backdrop-blur-md shadow-2xl min-w-[220px] animate-in slide-in-from-right-4 duration-500">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex flex-col">
                            <span className="font-black text-amber-500 text-[10px] tracking-[0.2em] uppercase">{mercenary.job}</span>
                            <span className="text-stone-500 text-[9px] font-mono">Lv.{mercenary.level} Specialist</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-pink-400 font-bold bg-pink-950/20 px-2 py-1 rounded-lg border border-pink-900/30">
                            <Heart className="w-3.5 h-3.5 fill-pink-400" />
                            <span className="font-mono text-sm">{mercenary.affinity}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-2.5">
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] font-black text-stone-500 uppercase tracking-tighter">
                                <span>Vitality</span>
                                <span>{mercenary.currentHp}/{mercenary.maxHp}</span>
                            </div>
                            <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden border border-stone-800">
                                <div className="bg-red-600 h-full transition-all duration-700 shadow-[0_0_8px_rgba(220,38,38,0.5)]" style={{ width: `${(mercenary.currentHp / mercenary.maxHp) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] font-black text-stone-500 uppercase tracking-tighter">
                                <span>Mental Focus</span>
                                <span>{mercenary.currentMp}/{mercenary.maxMp}</span>
                            </div>
                            <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden border border-stone-800">
                                <div className="bg-blue-600 h-full transition-all duration-700 shadow-[0_0_8px_rgba(37,99,235,0.5)]" style={{ width: `${(mercenary.currentMp / mercenary.maxMp) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interaction Action Menu (Right Side Center/Bottom) */}
            <div className={`absolute right-6 bottom-36 z-50 flex flex-col gap-2 w-56 animate-in slide-in-from-right-8 duration-700 delay-200 transition-opacity ${pendingGiftItem ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                <button 
                    onClick={handleTalk}
                    className="flex items-center gap-3 p-4 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 hover:border-amber-500 rounded-xl backdrop-blur-md transition-all shadow-xl group"
                >
                    <div className="bg-stone-800 p-2 rounded-lg group-hover:bg-amber-900/30 group-hover:text-amber-500 transition-colors">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-stone-300 group-hover:text-amber-200">Talk</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </button>

                <button 
                    onClick={() => setShowGiftMenu(true)}
                    className="flex items-center gap-3 p-4 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 hover:border-pink-500 rounded-xl backdrop-blur-md transition-all shadow-xl group"
                >
                    <div className="bg-stone-800 p-2 rounded-lg group-hover:bg-pink-900/30 group-hover:text-pink-500 transition-colors">
                        <Gift className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-stone-300 group-hover:text-pink-200">Give Gift</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </button>

                <div className="h-px bg-stone-800 mx-2 my-1"></div>

                {!isHired && (
                    <button 
                        onClick={handleRecruit}
                        disabled={!canAfford || !hasAffinity}
                        className={`flex items-center gap-3 p-4 border rounded-xl backdrop-blur-md transition-all shadow-xl group relative overflow-hidden ${
                            (!canAfford || !hasAffinity) 
                            ? 'bg-stone-950/80 border-stone-800 text-stone-600 grayscale cursor-not-allowed' 
                            : 'bg-amber-900/40 hover:bg-amber-800/60 border-amber-600/50 hover:border-amber-400 text-amber-100'
                        }`}
                    >
                        <div className={`p-2 rounded-lg transition-colors ${(!canAfford || !hasAffinity) ? 'bg-stone-900 text-stone-700' : 'bg-amber-950/50 group-hover:text-amber-400'}`}>
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                            <span className="font-bold text-sm uppercase tracking-wide">Recruit</span>
                            <span className={`text-[10px] font-mono ${(!canAfford || !hasAffinity) ? 'text-stone-700' : 'text-amber-500/70'}`}>
                                {hiringCost} Gold
                            </span>
                        </div>
                        {(!canAfford || !hasAffinity) && <div className="absolute inset-0 bg-stone-950/20"></div>}
                    </button>
                )}

                <button 
                    onClick={() => setShowDetail(true)}
                    className={`flex items-center gap-3 p-4 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 rounded-xl backdrop-blur-md transition-all shadow-xl group ${isHired ? 'hover:border-emerald-500' : 'hover:border-blue-500'}`}
                >
                    <div className={`bg-stone-800 p-2 rounded-lg transition-colors ${isHired ? 'group-hover:bg-emerald-900/30 group-hover:text-emerald-500' : 'group-hover:bg-blue-900/30 group-hover:text-blue-500'}`}>
                        {isHired ? <Wrench className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                    </div>
                    <span className={`font-bold text-sm text-stone-300 ${isHired ? 'group-hover:text-emerald-200' : 'group-hover:text-blue-200'}`}>
                        {isHired ? 'Manage Unit' : 'Inspect Unit'}
                    </span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </button>

                <div className="h-px bg-stone-800 mx-2 my-1"></div>

                <button 
                    onClick={onBack}
                    className="flex items-center gap-3 p-4 bg-red-950/20 hover:bg-red-900/40 border border-red-900/30 hover:border-red-500 rounded-xl backdrop-blur-md transition-all shadow-xl group"
                >
                    <div className="bg-red-900/20 p-2 rounded-lg group-hover:text-red-400 transition-colors text-red-700">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-red-200/60 group-hover:text-red-300">Leave</span>
                </button>
            </div>

            {/* Sprite Rendering */}
            <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pointer-events-none pb-0">
               <div className="relative flex justify-center items-end w-full animate-in fade-in zoom-in-95 duration-700 ease-out">
                   <div className="relative h-[80vh] w-auto flex justify-center translate-y-12">
                       <img 
                           src={mercenary.sprite ? getAssetUrl(mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')} 
                           alt={mercenary.name}
                           className="h-full object-contain object-bottom filter drop-shadow-[0_0_60px_rgba(0,0,0,0.9)]"
                       />
                       {/* Shadow below sprite */}
                       <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 h-12 bg-black/60 blur-2xl rounded-full -z-10"></div>
                   </div>
               </div>
            </div>

            {/* Interaction Dialogue (Only Text OR Confirm Options) */}
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-stone-800 bg-stone-850 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-pink-900/30 p-2 rounded-lg border border-pink-700/50">
                                    <Gift className="w-5 h-5 text-pink-500" />
                                </div>
                                <h3 className="font-bold text-stone-200 font-serif uppercase tracking-widest">Select a Gift</h3>
                            </div>
                            <button onClick={() => setShowGiftMenu(false)} className="p-2 hover:bg-stone-800 rounded-full text-stone-500 hover:text-stone-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[50vh] grid grid-cols-2 gap-3 custom-scrollbar">
                            {giftableItems.length === 0 ? (
                                <div className="col-span-2 py-16 text-center">
                                    <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-700 opacity-20">
                                        <Package className="w-8 h-8 text-stone-500" />
                                    </div>
                                    <p className="text-stone-600 italic">No valid items for gifts in your inventory.</p>
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
                                            className={`flex items-center gap-3 p-3 bg-stone-800 hover:bg-stone-750 border rounded-xl transition-all group text-left ${isEquipment ? 'border-amber-900/30' : 'border-stone-700'}`}
                                        >
                                            <div className="w-10 h-10 bg-stone-950 rounded-lg border border-stone-800 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                                {item.icon || (isEquipment ? '⚔️' : '🎁')}
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`text-xs font-bold truncate ${isEquipment ? 'text-stone-200' : 'text-stone-300'}`}>{item.name}</div>
                                                <div className="flex items-center gap-1.5">
                                                    {isEquipment ? (
                                                        <span className={`text-[8px] font-black uppercase tracking-tighter ${rarityColor}`}>{rarity}</span>
                                                    ) : (
                                                        <div className="text-[10px] text-stone-500 font-mono">Stock: {item.quantity}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        <div className="p-4 bg-stone-950 text-center border-t border-stone-800">
                            <p className="text-[10px] text-stone-500 font-mono uppercase tracking-[0.2em]">Offering gifts strengthens bonds of loyalty.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mercenary Detail Modal (Inspect/Manage) */}
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