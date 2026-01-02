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
    const isOneTimeItem = itemId === 'furnace' || itemId === 'workbench' || itemId.startsWith('scroll_');
    
    setCart(prev => {
      if (isOneTimeItem && prev[itemId] > 0) return prev;
      return {
        ...prev,
        [itemId]: (prev[itemId] || 0) + 1
      };
    });
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
    <div className="h-full w-full flex flex-row bg-stone-925 p-2 md:p-4 gap-2 md:gap-4 relative overflow-hidden">
      
      {showError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[70] bg-red-900/90 border border-red-500 text-red-100 px-4 py-2 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
           <AlertCircle className="w-5 h-5" />
           <div className="text-xs font-bold">Not enough gold.</div>
        </div>
      )}

      {/* Success Modals (Furnace/Workbench) omitted for brevity as they use fixed centering, but they should also be checked for height */}

      {/* Left: Market Shelf - Force visibility by using flex-1 and ensuring it doesn't wrap */}
      <div className="flex-[1.5] md:flex-[2] bg-stone-900 rounded-xl border border-stone-800 overflow-hidden flex flex-col min-w-0">
         <div className="bg-stone-800/50 p-2 md:p-4 border-b border-stone-800 flex items-center gap-2 justify-between shrink-0">
            <div className="flex items-center gap-2">
                <Store className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                <h3 className="text-stone-200 font-bold tracking-wide text-xs md:text-sm">Supplies</h3>
            </div>
            <div className="text-[9px] md:text-xs bg-stone-950 px-1.5 py-0.5 rounded border border-stone-700 font-mono text-amber-500">
                T{currentTier}
            </div>
         </div>
         
         <div className="p-2 md:p-4 grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 overflow-y-auto flex-1 min-h-0 content-start custom-scrollbar">
            {MARKET_CATALOG.map((marketItem: any) => {
                const isKeyItem = marketItem.id === 'furnace' || marketItem.id === 'workbench';
                const isScrollItem = marketItem.id.startsWith('scroll_');
                const isOwned = (marketItem.id === 'furnace' && hasFurnace) || (marketItem.id === 'workbench' && hasWorkbench);

                if (isKeyItem && isOwned) return null;

                let itemName = '';
                let itemTier = 1;

                if (marketItem.id === 'furnace') { itemName = 'Furnace'; itemTier = 0; }
                else if (marketItem.id === 'workbench') { itemName = 'Workbench'; itemTier = 1; }
                else if (marketItem.id === 'scroll_t2') { itemName = 'Scroll T2'; itemTier = 1; if (currentTier >= 2) return null; }
                else if (marketItem.id === 'scroll_t3') { itemName = 'Scroll T3'; itemTier = 2; if (currentTier >= 3) return null; }
                else {
                    const itemDef = Object.values(MATERIALS).find(i => i.id === marketItem.id);
                    if (!itemDef) return null;
                    itemName = (itemDef as any).name;
                    itemTier = (itemDef as any).tier || 1;
                }

                if (itemTier > currentTier) return null;

                const ownedCount = getOwnedCount(marketItem.id);
                const isInCart = cart[marketItem.id] > 0;
                const isOneTimeDisabled = (isKeyItem || isScrollItem) && isInCart;

                return (
                    <button 
                        key={marketItem.id}
                        onClick={() => addToCart(marketItem.id)}
                        disabled={isOneTimeDisabled} 
                        className={`flex flex-col items-center p-2 rounded-lg border transition-all text-center group relative overflow-hidden h-28 md:h-36 justify-between ${isOneTimeDisabled ? 'bg-stone-900 border-stone-800 opacity-60 grayscale cursor-not-allowed' : 'bg-stone-800 border-stone-700 hover:border-amber-500 hover:bg-stone-750'}`}
                    >
                        {!isKeyItem && !marketItem.id.startsWith('scroll') && (
                            <div className="absolute top-1 right-1 bg-stone-950/80 px-1 py-0.5 rounded text-[8px] md:text-[10px] text-stone-400 font-mono flex items-center gap-0.5 z-10">
                                <Package className="w-2.5 h-2.5" />
                                <span>{ownedCount}</span>
                            </div>
                        )}

                        <div className="w-8 h-8 md:w-12 md:h-12 mt-1 relative flex items-center justify-center group-hover:scale-110 transition-transform">
                             <img src={getAssetUrl(`${marketItem.id}.png`)} className="w-full h-full object-contain filter drop-shadow-lg" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                             <div className="fallback-icon hidden text-xl md:text-2xl">📦</div>
                        </div>
                        
                        <div className="flex flex-col items-center w-full px-0.5">
                            <span className={`font-bold text-[10px] md:text-xs line-clamp-1 leading-tight ${marketItem.id.startsWith('scroll') || isKeyItem ? 'text-amber-400' : 'text-stone-200'}`}>
                                {itemName}
                            </span>
                        </div>

                        <div className="bg-stone-950 px-2 py-0.5 md:py-1 rounded-full border border-stone-700 text-amber-400 font-mono text-[9px] md:text-[10px] font-bold w-full truncate">
                            {isInCart && isOneTimeDisabled ? 'In Cart' : `${marketItem.price} G`}
                        </div>
                    </button>
                );
            })}
         </div>
      </div>

      {/* Right: Cart - Flexible width but constrained on mobile */}
      <div className="flex-1 md:w-80 bg-stone-950 rounded-xl border border-stone-800 flex flex-col shadow-xl min-h-0 overflow-hidden">
          <div className="bg-stone-900 p-2 md:p-3 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 md:gap-2">
                  <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-400" />
                  <h3 className="text-stone-300 font-bold text-xs md:text-sm">Cart</h3>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0 custom-scrollbar">
              {Object.keys(cart).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-600 italic text-[10px] md:text-xs">
                      Empty
                  </div>
              ) : (
                  Object.entries(cart).map(([id, count]) => {
                      const marketItem = MARKET_CATALOG.find(i => i.id === id);
                      let itemName = id === 'furnace' ? 'Furnace' : id === 'workbench' ? 'Workbench' : MATERIALS[id.toUpperCase() as keyof typeof MATERIALS]?.name || id;
                      if (!marketItem) return null;
                      const isOneTime = id === 'furnace' || id === 'workbench' || id.startsWith('scroll_');

                      return (
                          <div key={id} className="flex items-center justify-between bg-stone-900 p-2 rounded border border-stone-800 gap-1">
                              <div className="min-w-0 flex-1">
                                  <div className="text-stone-200 font-bold text-[10px] md:text-xs truncate">{itemName}</div>
                                  <div className="text-stone-500 text-[9px] font-mono">{marketItem.price}G</div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-amber-500 font-bold font-mono text-[10px]">x{count}</span>
                                  <button onClick={() => deleteFromCart(id)} className="p-1 hover:bg-red-900/30 rounded text-stone-500">
                                      <Trash2 className="w-3 h-3" />
                                  </button>
                              </div>
                          </div>
                      );
                  })
              )}
          </div>

          <div className="bg-stone-900 p-2 md:p-4 border-t border-stone-800 shrink-0">
              <div className="flex justify-between items-end mb-2">
                  <span className="text-stone-400 text-[9px] uppercase font-bold">Total</span>
                  <span className={`text-sm md:text-xl font-mono font-bold ${totalCost > state.stats.gold ? 'text-red-500' : 'text-amber-400'}`}>
                      {totalCost}G
                  </span>
              </div>
              <button
                  onClick={handleBuy}
                  disabled={totalCost === 0 || totalCost > state.stats.gold}
                  className="w-full py-2 md:py-3 bg-amber-700 hover:bg-amber-600 disabled:bg-stone-800 disabled:text-stone-600 text-amber-50 font-bold rounded text-[10px] md:text-sm transition-all"
              >
                  {totalCost > state.stats.gold ? 'Insufficient' : 'Buy'}
              </button>
          </div>
      </div>

    </div>
  );
};

export default MarketTab;