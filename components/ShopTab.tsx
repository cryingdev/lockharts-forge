import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import DialogueBox from './DialogueBox';
import { Store, Coins, PackageOpen, Heart, Users } from 'lucide-react';
import { EQUIPMENT_ITEMS } from '../gameData';
import { ITEMS } from '../constants';
import { getAssetUrl } from '../utils';

const ShopTab = () => {
  const { state, actions } = useGame();
  const { isShopOpen } = state.forge;
  const { activeCustomer, shopQueue } = state;
  const [counterImgError, setCounterImgError] = useState(false);
  
  const getItemName = (id: string) => {
    const eq = EQUIPMENT_ITEMS.find(e => e.id === id);
    if (eq) return eq.name;
    const res = Object.values(ITEMS).find(i => i.id === id);
    return res ? res.name : id;
  };

  const handleSell = () => {
      if (!activeCustomer) return;
      
      const { mercenary, request } = activeCustomer;

      if (request.type === 'RESOURCE') {
          actions.sellItem(request.requestedId, 1, request.price, undefined, mercenary);
      } else {
          // Find an inventory item that matches the requested equipment ID (prefix match for unique IDs)
          const matchingItem = state.inventory.find(i => 
              i.equipmentData && i.id.startsWith(request.requestedId)
          );
          if (matchingItem) {
              actions.sellItem(matchingItem.id, 1, request.price, matchingItem.id, mercenary);
          }
      }
      // Note: dismissal handled in reducer for successful sale
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

  return (
    <div className="relative h-full w-full bg-stone-900 overflow-hidden flex flex-col items-center justify-center">
        
        {/* Layer 0: Background */}
        <div className="absolute inset-0 z-0">
            <img 
                src={getAssetUrl('shop_interior.png')} 
                alt="Shop Interior" 
                className="w-full object-cover opacity-60"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.style.background = 'linear-gradient(to bottom, #292524, #1c1917)';
                }}
            />
        </div>

        {/* Queue Indicator (Improved Visibility) */}
        {isShopOpen && (
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-stone-900/90 px-4 py-2 rounded-xl border-2 border-stone-700 text-stone-200 shadow-xl">
                <div className="bg-stone-800 p-1.5 rounded-full">
                    <Users className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Queue</span>
                    <span className="text-lg font-bold font-mono">{shopQueue.length}</span>
                </div>
            </div>
        )}

        {/* Layer 1: Character (Behind Counter) */}
        {/* Changed justify-center to justify-end to anchor character to bottom */}
        <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pointer-events-none pb-0">
            {isShopOpen && (
                <>
                   {activeCustomer ? (
                       <div className="relative flex justify-center items-end w-full animate-in fade-in slide-in-from-right duration-500">
                           
                           {/* Wrapper for absolute elements relative to character center */}
                           {/* Added translate-y-12 to lower the character behind the counter */}
                           <div className="relative h-[85vh] w-auto flex justify-center translate-y-12">
                               {/* NPC Info Card - Adjusted position for larger sprite */}
                               <div className="absolute top-20 -right-56 w-48 bg-stone-900/90 border border-stone-700 p-3 rounded-lg backdrop-blur-sm shadow-xl text-xs z-50">
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

                               {/* Request Bubble - Adjusted position for larger sprite */}
                               <div 
                                    className="absolute top-10 -left-64 w-64 h-32 flex items-center justify-center z-50 animate-in zoom-in delay-200 duration-300"
                                    style={{
                                        backgroundImage: `url(${getAssetUrl('bubble_thought.png')})`,
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center'
                                    }}
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

                               {/* Character Sprite - Increased Height and Object Bottom */}
                               <img 
                                   src={activeCustomer.mercenary.sprite ? getAssetUrl(activeCustomer.mercenary.sprite) : getAssetUrl('adventurer_wanderer_01.png')} 
                                   alt="Adventurer"
                                   className="h-full object-contain object-bottom filter drop-shadow-2xl"
                               />
                           </div>
                       </div>
                   ) : (
                       <div className="text-center animate-in fade-in zoom-in mb-32">
                           <div className="w-24 h-24 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                               <Store className="w-10 h-10 text-stone-500" />
                           </div>
                           <h3 className="text-xl font-bold text-stone-400">Waiting for customers...</h3>
                           <p className="text-stone-500 text-sm mt-1">They come and go as they please.</p>
                       </div>
                   )}
                </>
            )}

             {/* Layer 1.5: The Shop Counter (Desk) */}
            {/* This overlays the bottom part of the character to make them look like they are standing behind it */}
            <div className="absolute bottom-0 w-full z-30 flex items-end justify-center pointer-events-none">
                
                {/* Visual Representation */}
                {!counterImgError ? (
                    <img 
                        src={getAssetUrl('shop_counter.png')}
                        alt="Shop Counter"
                        className="w-full h-full object-cover object-top filter drop-shadow-[0_-10px_20px_rgba(0,0,0,0.5)]"
                        onError={() => setCounterImgError(true)}
                    />
                ) : (
                    /* CSS Fallback */
                    <div className="w-full h-full bg-[#3f2e22] border-t-[6px] border-[#5d4037] shadow-[0_-10px_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        {/* Wood Grain Texture Simulation */}
                        <div className="absolute inset-0 opacity-10" style={{ 
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)' 
                        }}></div>
                    </div>
                )}
                    
                {/* Decorative Elements on Counter (Overlay) */}
                {isShopOpen && activeCustomer && (
                    <div className="absolute top-0 right-20 w-32 h-20 bg-amber-900/20 blur-xl rounded-full pointer-events-none"></div>
                )}
            </div>
        </div>

        {/* Layer 2: Dialogue UI (Bottom) */}
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
            // [전체 래퍼] 화면 전체를 덮고 내용물을 중앙 정렬 (z-50)
            <div className="absolute inset-0 z-50 flex items-center justify-center">   
                {/* [배경 딤 처리] animate-in으로 나타날 때만 효과 (사라질 땐 뚝 끊김) */}
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-500"></div>
                {/* [모달 본문] relative를 줘서 배경 위에 뜨게 함 */}
                <div className="relative text-center animate-in zoom-in fade-in duration-300 p-8 bg-stone-900/90 rounded-2xl border border-stone-700 shadow-2xl backdrop-blur-md mb-20">
                    <Store className="w-16 h-16 text-stone-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-stone-300 mb-2 font-serif">The Shop is Closed</h2>
                    <p className="text-stone-500 max-w-xs mx-auto mb-6">Open the shop to start selling your crafted goods to adventurers.</p>
                    <button 
                        onClick={handleToggleShop}
                        className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-lg transition-all"
                    >
                        Open for Business
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default ShopTab;