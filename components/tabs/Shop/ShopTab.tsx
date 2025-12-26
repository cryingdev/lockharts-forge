import React, { useState, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import DialogueBox from '../../DialogueBox';
import { Store, Coins, PackageOpen, Heart, Users, ArrowLeft, ZapOff, Link } from 'lucide-react';
import { EQUIPMENT_ITEMS } from '../../../data/equipment';
import { MATERIALS } from '../../../data/materials';
import { getAssetUrl } from '../../../utils';
import { GAME_CONFIG } from '../../../config/game-config';

interface ShopTabProps {
    onNavigate: (tab: any) => void;
}

const ShopSign = ({ isOpen, onToggle, disabled }: { isOpen: boolean, onToggle: () => void, disabled: boolean }) => {
    return (
        <div className="absolute top-4 right-4 z-50 flex flex-col items-center">
            {/* Hanging Chains */}
            <div className="flex justify-around w-24 h-6 px-4">
                <div className="w-1 bg-stone-600 rounded-full"></div>
                <div className="w-1 bg-stone-600 rounded-full"></div>
            </div>
            
            {/* Flipping Sign Card */}
            <button 
                onClick={onToggle}
                disabled={disabled}
                className={`group relative w-36 h-16 perspective-1000 cursor-pointer disabled:cursor-not-allowed`}
            >
                <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isOpen ? '' : 'rotate-y-180'}`}>
                    
                    {/* Front: OPEN */}
                    <div className="absolute inset-0 backface-hidden bg-[#5d4037] border-2 border-[#3e2723] rounded-md shadow-lg flex flex-col items-center justify-center p-1">
                        <div className="w-full h-full border border-[#795548]/30 rounded flex flex-col items-center justify-center">
                             <span className="text-[10px] text-[#8d6e63] font-bold uppercase tracking-widest leading-none">The Forge is</span>
                             <span className="text-xl font-black text-emerald-400 font-serif tracking-tighter drop-shadow-sm">OPEN</span>
                        </div>
                    </div>

                    {/* Back: CLOSED */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#3e2723] border-2 border-[#1b0000] rounded-md shadow-lg flex flex-col items-center justify-center p-1">
                        <div className="w-full h-full border border-[#5d4037]/30 rounded flex flex-col items-center justify-center">
                             <span className="text-[10px] text-[#5d4037] font-bold uppercase tracking-widest leading-none">The Forge is</span>
                             <span className="text-xl font-black text-stone-500 font-serif tracking-tighter drop-shadow-sm">CLOSED</span>
                        </div>
                    </div>

                </div>
                
                {/* Wood Grain Texture Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay" style={{ 
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #000 2px, #000 4px)' 
                }}></div>
            </button>
        </div>
    );
};

const ShopTab: React.FC<ShopTabProps> = ({ onNavigate }) => {
  const { state, actions } = useGame();
  const { isShopOpen } = state.forge;
  const { activeCustomer, shopQueue } = state;
  const [counterImgError, setCounterImgError] = useState(false);
  
  const getItemName = (id: string) => {
    const eq = EQUIPMENT_ITEMS.find(e => e.id === id);
    if (eq) return eq.name;
    const res = Object.values(MATERIALS).find(i => i.id === id);
    return res ? res.name : id;
  };

  const handleSell = () => {
      if (!activeCustomer) return;
      
      const { mercenary, request } = activeCustomer;

      if (request.type === 'RESOURCE') {
          actions.sellItem(request.requestedId, 1, request.price, undefined, mercenary);
      } else {
          const matchingItem = state.inventory.find(i => 
              i.equipmentData && i.id.startsWith(request.requestedId)
          );
          if (matchingItem) {
              actions.sellItem(matchingItem.id, 1, request.price, matchingItem.id, mercenary);
          }
      }
  };

  const handleRefuse = () => {
      actions.dismissCustomer();
  };

  const handleToggleShop = () => {
      actions.toggleShop();
  };

  const hasItem = () => {
      if (!activeCustomer) return false;
      const { request } = activeCustomer;
      if (request.type === 'RESOURCE') {
          const item = state.inventory.find(i => i.id === request.requestedId);
          return item && item.quantity > 0;
      } else {
          return state.inventory.some(i => i.id.startsWith(request.requestedId));
      }
  };

  const canAffordOpen = state.stats.energy >= GAME_CONFIG.ENERGY_COST.OPEN_SHOP;

  // Trigger energy bar highlight when entering "Exhausted" shop state
  useEffect(() => {
    if (!isShopOpen && !canAffordOpen) {
        actions.triggerEnergyHighlight();
    }
  }, [isShopOpen, canAffordOpen, actions]);

  return (
    <div className="relative h-full w-full bg-stone-900 overflow-hidden flex flex-col items-center justify-center">
        
        {/* Layer 0: Background */}
        <div className="absolute inset-0 z-0">
            <img 
                src={getAssetUrl('shop_interior.png')} 
                alt="Shop Interior" 
                className="absolute top-0 opacity-60 w-full h-auto left-0 portrait:h-full portrait:w-auto portrait:max-w-none portrait:left-1/2 portrait:-translate-x-1/2"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.style.background = 'linear-gradient(to bottom, #292524, #1c1917)';
                }}
            />
        </div>

        {/* The Wooden Sign Toggle - Positioned Top Right Corner */}
        <ShopSign 
            isOpen={isShopOpen} 
            onToggle={handleToggleShop} 
            disabled={!isShopOpen && !canAffordOpen}
        />

        {/* Queue Indicator - Positioned to the left of the Sign */}
        {isShopOpen && (
            <div className="absolute top-4 right-[160px] z-50 flex items-center gap-2 bg-stone-900/90 px-4 py-2 rounded-xl border-2 border-stone-700 text-stone-200 shadow-xl">
                <div className="bg-stone-800 p-1.5 rounded-full">
                    <Users className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Queue</span>
                    <span className="text-lg font-bold font-mono">{shopQueue.length}</span>
                </div>
            </div>
        )}

        {/* Customer Info & Request Bubble */}
        {isShopOpen && activeCustomer && (
            <>
                <div className="absolute top-[15%] left-10 z-50 animate-in slide-in-from-left-10 fade-in duration-500">
                     <div 
                        className="w-64 h-32 flex items-center justify-center"
                        style={{ backgroundImage: `url(${getAssetUrl('bubble_thought.png')})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
                    >
                        <div className="pb-6 pl-2 flex items-center gap-3">
                            <div className="bg-amber-100/80 p-1.5 rounded-lg backdrop-blur-sm">
                                <PackageOpen className="w-6 h-6 text-amber-700" />
                            </div>
                            <div className="leading-tight">
                                <div className="font-bold text-stone-800 text-sm line-clamp-1 w-24">{getItemName(activeCustomer.request.requestedId)}</div>
                                <div className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                                    <Coins className="w-3 h-3" />
                                    {activeCustomer.request.price} G
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute top-[15%] right-10 z-50 animate-in slide-in-from-right-10 fade-in duration-500">
                    <div className="w-48 bg-stone-900/90 border border-stone-700 p-3 rounded-lg backdrop-blur-sm shadow-xl text-xs">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-amber-500">{activeCustomer.mercenary.job}</span>
                            <span className="text-stone-500">Lv.{activeCustomer.mercenary.level}</span>
                        </div>
                        <div className="space-y-1 mb-2">
                            <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full" style={{ width: `${(activeCustomer.mercenary.currentHp / activeCustomer.mercenary.maxHp) * 100}%` }}></div>
                            </div>
                            <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full" style={{ width: `${(activeCustomer.mercenary.currentMp / activeCustomer.mercenary.maxMp) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-pink-400 font-bold">
                            <Heart className="w-3 h-3 fill-pink-400" />
                            <span>{activeCustomer.mercenary.affinity}</span>
                        </div>
                    </div>
                </div>
            </>
        )}

        {/* Layer 1: Character */}
        <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pointer-events-none pb-0">
            {isShopOpen && activeCustomer && (
               <div className="relative flex justify-center items-end w-full animate-in fade-in zoom-in-95 duration-200 ease-out">
                   <div className="relative h-[85vh] w-auto flex justify-center translate-y-12">
                       <img 
                           src={activeCustomer.mercenary.sprite ? getAssetUrl(activeCustomer.mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')} 
                           alt="Adventurer"
                           className="h-full object-contain object-bottom filter drop-shadow-2xl"
                       />
                   </div>
               </div>
            )}
        </div>

        {/* Layer 1.5: The Shop Counter */}
        <div className="absolute bottom-0 w-full z-30 flex items-end justify-center pointer-events-none">
            {!counterImgError ? (
                <img 
                    src={getAssetUrl('shop_counter.png')}
                    alt="Shop Counter"
                    className="w-full h-full object-cover object-top filter drop-shadow-[0_-10px_20px_rgba(0,0,0,0.5)]"
                    onError={() => setCounterImgError(true)}
                />
            ) : (
                <div className="w-full h-full bg-[#3f2e22] border-t-[6px] border-[#5d4037] shadow-[0_-10px_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ 
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)' 
                    }}></div>
                </div>
            )}
            {isShopOpen && activeCustomer && (
                <div className="absolute top-0 right-20 w-32 h-20 bg-amber-900/20 blur-xl rounded-full pointer-events-none"></div>
            )}
        </div>

        {/* Layer 2: Dialogue UI */}
        {isShopOpen && activeCustomer && (
            <DialogueBox 
                speaker={activeCustomer.mercenary.name}
                text={activeCustomer.request.dialogue}
                options={[
                    { 
                        label: `Sell (${activeCustomer.request.price} G)`, 
                        action: handleSell, 
                        variant: 'primary',
                        disabled: !hasItem()
                    },
                    { 
                        label: "Refuse", 
                        action: handleRefuse, 
                        variant: 'danger' 
                    }
                ]}
            />
        )}

        {/* Layer 3: Modal & Overlay Group */}
        {!isShopOpen && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                {/* Dimming Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity duration-700 animate-in fade-in"></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
                    {!canAffordOpen ? (
                        // Exhausted State
                        <div className="bg-stone-900 border-2 border-red-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-xs ring-4 ring-black/50">
                            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4 border border-red-800/50">
                                <ZapOff className="w-8 h-8 text-red-500 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-red-100 font-serif">Exhausted</h3>
                            <p className="text-stone-500 text-sm mt-2 mb-6">
                                You don't have the energy to manage the counter today. Get some rest.
                            </p>
                            <button 
                                onClick={() => onNavigate('FORGE')}
                                className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-bold text-sm transition-all border border-stone-700 pointer-events-auto flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Return to Forge
                            </button>
                        </div>
                    ) : (
                        // Just Closed State
                        <div className="text-center group">
                             <div className="w-20 h-20 bg-stone-800/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-700 backdrop-blur-sm shadow-xl transition-transform group-hover:scale-110 duration-500">
                                <Store className="w-8 h-8 text-stone-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-stone-300 font-serif tracking-wide drop-shadow-md uppercase">Shop is Closed</h3>
                            <p className="text-stone-500 text-sm mt-1 font-medium">Flip the sign to welcome customers.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Waiting State Message */}
        {isShopOpen && !activeCustomer && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none pb-20">
                <div className="text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 backdrop-blur-sm">
                        <Store className="w-10 h-10 text-stone-500" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-400">Waiting for customers...</h3>
                    <p className="text-stone-500 text-sm mt-1">They come and go as they please.</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default ShopTab;