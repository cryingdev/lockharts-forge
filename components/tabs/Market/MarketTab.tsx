
import React, { useState } from 'react';
import { useGame } from '../../../context/GameContext';
import { Store, ShoppingCart, ShoppingBag, Minus, Trash2, AlertCircle, Package, Flame, Check, Box, Wrench } from 'lucide-react';
import { MATERIALS } from '../../../data/materials';
import { MARKET_CATALOG } from '../../../data/market/index';
import { getAssetUrl } from '../../../utils';

interface MarketTabProps {
    onNavigate: (tab: any) => void;
}

const MarketTab: React.FC<MarketTabProps> = ({ onNavigate }) => {
  const { state, actions } = useGame();
  
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showError, setShowError] = useState(false);
  const [showFurnaceSuccess, setShowFurnaceSuccess] = useState(false);
  const [showWorkbenchSuccess, setShowWorkbenchSuccess] = useState(false);

  const { hasFurnace, hasWorkbench } = state.forge;

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCount = (prev[itemId] || 0) - 1;
      const newCart = { ...prev };
      if (newCount <= 0) {
        delete newCart[itemId];
      } else {
        newCart[itemId] = newCount;
      }
      return newCart;
    });
  };

  const deleteFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[itemId];
      return newCart;
    });
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [id, count]) => {
      const item = MARKET_CATALOG.find(i => i.id === id);
      const quantity = count as number;
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  const handleBuy = () => {
    const total = calculateTotal();
    if (total > state.stats.gold) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    const buyingFurnace = cart['furnace'] && cart['furnace'] > 0;
    const buyingWorkbench = cart['workbench'] && cart['workbench'] > 0;

    const itemsToBuy = Object.entries(cart).map(([id, count]) => ({ id, count }));
    actions.buyItems(itemsToBuy, total);
    setCart({}); 

    if (buyingFurnace) {
        setShowFurnaceSuccess(true);
    } else if (buyingWorkbench) {
        setShowWorkbenchSuccess(true);
    }
  };

  const getOwnedCount = (itemId: string) => {
      return state.inventory.find(i => i.id === itemId)?.quantity || 0;
  };

  const totalCost = calculateTotal();
  const currentTier = state.stats.tierLevel;

  return (
    <div className="h-full flex flex-col md:flex-row bg-stone-925 p-4 gap-4 relative">
      
      {showError && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500 text-red-100 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
           <AlertCircle className="w-6 h-6" />
           <div>
             <h4 className="font-bold">Transaction Failed</h4>
             <p className="text-sm">You do not have enough gold.</p>
           </div>
        </div>
      )}

      {showFurnaceSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-stone-900 border-2 border-amber-600 rounded-xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/50">
                      <Flame className="w-10 h-10 text-amber-500 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold text-amber-100 mb-2">Furnace Installed!</h2>
                  <p className="text-stone-400 mb-6">
                      Your forge is now operational. You can start smelting ores and forging metal equipment.
                  </p>
                  <button 
                      onClick={() => setShowFurnaceSuccess(false)}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2"
                  >
                      <Check className="w-5 h-5" />
                      Back to Market
                  </button>
              </div>
          </div>
      )}

      {showWorkbenchSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-stone-900 border-2 border-emerald-600 rounded-xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/50">
                      <Wrench className="w-10 h-10 text-emerald-500 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold text-emerald-100 mb-2">Workbench Ready!</h2>
                  <p className="text-stone-400 mb-6">
                      You can now craft leather garments, bows, and wooden staffs at your new workbench.
                  </p>
                  <button 
                      onClick={() => setShowWorkbenchSuccess(false)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2"
                  >
                      <Check className="w-5 h-5" />
                      Back to Market
                  </button>
              </div>
          </div>
      )}

      {/* Left: Market Shelf */}
      <div className="flex-1 bg-stone-900 rounded-xl border border-stone-800 overflow-hidden flex flex-col min-h-0">
         <div className="bg-stone-800/50 p-4 border-b border-stone-800 flex items-center gap-2 justify-between shrink-0">
            <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-500" />
                <h3 className="text-stone-200 font-bold tracking-wide">Material Supply</h3>
            </div>
            <div className="text-xs bg-stone-950 px-2 py-1 rounded border border-stone-700 font-mono text-amber-500">
                MARKET TIER {currentTier}
            </div>
         </div>
         
         <div className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto flex-1 min-h-0 content-start">
            {MARKET_CATALOG.map((marketItem: any) => {
                
                const isKeyItem = marketItem.id === 'furnace' || marketItem.id === 'workbench';
                const isOwned = (marketItem.id === 'furnace' && hasFurnace) || (marketItem.id === 'workbench' && hasWorkbench);

                if (isKeyItem && isOwned) return null;

                let itemName = '';
                let itemType = '';
                let itemTier = 1;

                if (marketItem.id === 'furnace') {
                    itemName = 'Blacksmith Furnace';
                    itemType = 'KEY ITEM';
                    itemTier = 0; // Always available at start
                } else if (marketItem.id === 'workbench') {
                    itemName = 'Artisan Workbench';
                    itemType = 'KEY ITEM';
                    itemTier = 1; // Locked until Furnace is bought (tier level rises to 1)
                } else if (marketItem.id === 'scroll_t2') {
                    itemName = 'Upgrade Scroll (Tier 2)';
                    itemType = 'SCROLL';
                    itemTier = 1; // Locked until Furnace is bought
                    if (currentTier >= 2) return null; // Already used
                } else if (marketItem.id === 'scroll_t3') {
                    itemName = 'Upgrade Scroll (Tier 3)';
                    itemType = 'SCROLL';
                    itemTier = 2; // Locked until T2 is reached
                    if (currentTier >= 3) return null; // Already used
                } else {
                    const itemDef = Object.values(MATERIALS).find(i => i.id === marketItem.id);
                    if (!itemDef) return null;
                    const def = itemDef as any;
                    itemName = def.name;
                    itemType = def.type;
                    itemTier = def.tier || 1;
                }

                // Global Visibility Filter: Hide items above current market tier
                if (itemTier > currentTier) {
                    return null;
                }

                const ownedCount = getOwnedCount(marketItem.id);

                return (
                    <button 
                        key={marketItem.id}
                        onClick={() => addToCart(marketItem.id)}
                        disabled={isKeyItem && (cart[marketItem.id] > 0)} 
                        className={`flex flex-col items-center p-3 rounded-lg border transition-all text-center group relative overflow-hidden h-[150px] justify-between bg-stone-800 border-stone-700 hover:border-amber-500 hover:bg-stone-750`}
                    >
                        {!isKeyItem && !marketItem.id.startsWith('scroll') && (
                            <div className="absolute top-2 right-2 bg-stone-950/80 backdrop-blur-sm border border-stone-700 px-2 py-0.5 rounded text-[10px] text-stone-400 font-mono flex items-center gap-1 z-10">
                                <Package className="w-3 h-3" />
                                <span>{ownedCount}</span>
                            </div>
                        )}

                        <div className="w-16 h-16 mt-2 mb-2 relative flex items-center justify-center group-hover:scale-110 transition-transform">
                             <img 
                                src={getAssetUrl(`${marketItem.id}.png`)}
                                alt={itemName}
                                className="w-full h-full object-contain filter drop-shadow-lg z-10"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                    if (fallback) fallback.classList.remove('hidden');
                                }}
                             />
                             
                             <div className="fallback-icon hidden text-3xl">
                                 {marketItem.id === 'charcoal' ? '⚫' : 
                                  marketItem.id === 'iron_ore' ? '🪨' : 
                                  marketItem.id === 'copper_ore' ? '🔶' : 
                                  marketItem.id === 'tin_ore' ? '⚪' : 
                                  marketItem.id === 'oak_log' ? '🪵' : 
                                  marketItem.id.startsWith('scroll') ? '📜' : 
                                  marketItem.id === 'furnace' ? '🔥' : 
                                  marketItem.id === 'workbench' ? '🛠️' :
                                  marketItem.id === 'energy_potion' ? '🧪' : '📦'}
                             </div>
                        </div>
                        
                        <div className="flex flex-col items-center w-full">
                            <span className={`font-bold text-sm line-clamp-1 leading-tight px-1 ${marketItem.id.startsWith('scroll') || isKeyItem ? 'text-amber-400' : 'text-stone-200'}`}>
                                {itemName}
                            </span>
                            <span className="text-[10px] text-stone-500 mt-0.5">{itemType}</span>
                        </div>

                        <div className="bg-stone-950 px-3 py-1 rounded-full border border-stone-700 text-amber-400 font-mono text-xs font-bold w-full">
                            {marketItem.price} G
                        </div>
                        
                        {isKeyItem && (
                            <div className="absolute inset-0 border-2 border-amber-500/50 rounded-lg pointer-events-none animate-pulse"></div>
                        )}
                    </button>
                );
            })}
         </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full md:w-96 bg-stone-950 rounded-xl border border-stone-800 flex flex-col shadow-xl min-h-0">
          <div className="bg-stone-900 p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-stone-400" />
                  <h3 className="text-stone-300 font-bold">Cart</h3>
              </div>
              <span className="text-stone-500 text-sm">{Object.keys(cart).length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {Object.keys(cart).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-600 italic">
                      <ShoppingBag className="w-10 h-10 mb-2 opacity-20" />
                      Your cart is empty.
                  </div>
              ) : (
                  Object.entries(cart).map(([id, count]) => {
                      const marketItem = MARKET_CATALOG.find(i => i.id === id);
                      
                      let itemName = '';
                      if (id === 'furnace') {
                          itemName = 'Blacksmith Furnace';
                      } else if (id === 'workbench') {
                          itemName = 'Artisan Workbench';
                      } else {
                          const itemDef = Object.values(MATERIALS).find(i => i.id === id);
                          if (!itemDef) return null;
                          itemName = itemDef.name;
                      }

                      if (!marketItem) return null;

                      return (
                          <div key={id} className="flex items-center justify-between bg-stone-900 p-3 rounded-lg border border-stone-800">
                              <div>
                                  <div className="text-stone-200 font-bold">{itemName}</div>
                                  <div className="text-stone-500 text-xs font-mono">{marketItem.price} G x {count}</div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                  <div className="text-amber-500 font-bold font-mono">
                                      {marketItem.price * (count as number)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                      {id !== 'furnace' && id !== 'workbench' && (
                                        <>
                                            <button onClick={() => removeFromCart(id)} className="p-1 hover:bg-stone-800 rounded text-stone-400">
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteFromCart(id)} className="p-1 hover:bg-red-900/30 rounded text-stone-500 hover:text-red-500 ml-1">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                      )}
                                      {(id === 'furnace' || id === 'workbench') && (
                                          <button onClick={() => deleteFromCart(id)} className="p-1 hover:bg-red-900/30 rounded text-stone-500 hover:text-red-500 ml-1">
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      );
                  })
              )}
          </div>

          <div className="bg-stone-900 p-6 border-t border-stone-800 shrink-0">
              <div className="flex justify-between items-end mb-4">
                  <span className="text-stone-400 text-sm uppercase font-bold">Total Cost</span>
                  <span className={`text-2xl font-mono font-bold ${totalCost > state.stats.gold ? 'text-red-500' : 'text-amber-400'}`}>
                      {totalCost} G
                  </span>
              </div>
              <button
                  onClick={handleBuy}
                  disabled={totalCost === 0 || totalCost > state.stats.gold}
                  className="w-full py-4 bg-amber-700 hover:bg-amber-600 disabled:bg-stone-800 disabled:text-stone-600 disabled:cursor-not-allowed text-amber-50 font-bold rounded-lg shadow-lg hover:shadow-amber-900/20 transition-all flex items-center justify-center gap-2"
              >
                  {totalCost > state.stats.gold ? 'Insufficient Gold' : 'Purchase Items'}
              </button>
          </div>
      </div>

    </div>
  );
};

export default MarketTab;
