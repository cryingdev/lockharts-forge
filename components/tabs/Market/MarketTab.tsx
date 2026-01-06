

import React, { useState, useMemo, useRef } from 'react';
import { useGame } from '../../../context/GameContext';
import { Store, ShoppingCart, ShoppingBag, AlertCircle, Coins, CreditCard, X, ChevronRight, ChevronLeft, Trash2, Plus, Minus, Package } from 'lucide-react';
import { MATERIALS } from '../../../data/materials';
import { MARKET_CATALOG } from '../../../data/market/index';
import { getAssetUrl } from '../../../utils';

interface MarketTabProps {
    onNavigate: (tab: any) => void;
}

const MarketTab: React.FC<MarketTabProps> = ({ onNavigate }) => {
  const { state, actions } = useGame();
  
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  
  const [itemMultipliers, setItemMultipliers] = useState<Record<string, number>>({});

  // 롱터치 가속 관련 Ref
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentInterval = useRef<number>(200);
  const [pressingItemId, setPressingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  const { hasFurnace, hasWorkbench } = state.forge;
  const currentTier = state.stats.tierLevel;

  // Fix: Explicitly cast Object.values to number[] to resolve 'unknown' type error in reduce
  const cartItemCount = useMemo(() => (Object.values(cart) as number[]).reduce((a, b) => a + b, 0), [cart]);
  
  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [id, count]) => {
      const item = MARKET_CATALOG.find(i => i.id === id);
      return total + (item ? item.price * (count as number) : 0);
    }, 0);
  };

  const totalCost = calculateTotal();

  const addToCart = (itemId: string, amount: number = 1) => {
    const isOneTimeItem = itemId === 'furnace' || itemId === 'workbench' || itemId.startsWith('scroll_');
    const availableStock = state.marketStock[itemId] || 0;
    const currentInCart = cart[itemId] || 0;

    // 이미 재고만큼 다 담았으면 실패 반환
    if (currentInCart >= availableStock) return false;
    
    // 추가할 수 있는 최대 수량 계산 (재고 범위 내)
    const canAddCount = Math.min(amount, availableStock - currentInCart);
    if (canAddCount <= 0) return false;

    setCart(prev => {
      const nowInCart = prev[itemId] || 0;
      if (nowInCart >= availableStock) return prev;
      if (isOneTimeItem && nowInCart > 0) return prev;

      return {
        ...prev,
        [itemId]: nowInCart + (isOneTimeItem ? 1 : canAddCount)
      };
    });
    return true;
  };

  const removeFromCart = (itemId: string) => {
    let stillHasItems = true;
    setCart(prev => {
      const currentInCart = prev[itemId] || 0;
      if (currentInCart <= 0) {
        stillHasItems = false;
        return prev;
      }

      const newCount = currentInCart - 1;
      const newCart = { ...prev };
      if (newCount <= 0) {
        delete newCart[itemId];
        stillHasItems = false;
      } else {
        newCart[itemId] = newCount;
      }
      return newCart;
    });
    return stillHasItems;
  };

  const deleteFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[itemId];
      return newCart;
    });
  };

  const startContinuousAdd = (itemId: string) => {
    const success = addToCart(itemId, 1);
    if (!success) {
      handleEndLongPress(); // 재고 부족 시 가속 중단
      return;
    }
    currentInterval.current = Math.max(50, currentInterval.current * 0.85);
    longPressTimer.current = setTimeout(() => startContinuousAdd(itemId), currentInterval.current);
  };

  const startContinuousRemove = (itemId: string) => {
    const success = removeFromCart(itemId);
    if (!success) {
      handleEndLongPress(); // 0개 도달 시 가속 중단
      return;
    }
    currentInterval.current = Math.max(50, currentInterval.current * 0.85);
    longPressTimer.current = setTimeout(() => startContinuousRemove(itemId), currentInterval.current);
  };

  const handleStartLongPress = (e: React.MouseEvent | React.TouchEvent, itemId: string, isRemove: boolean = false) => {
    if (isRemove) setRemovingItemId(itemId);
    else setPressingItemId(itemId);

    currentInterval.current = 220;
    
    if (isRemove) {
      const success = removeFromCart(itemId);
      if (!success) {
        setRemovingItemId(null);
        return;
      }
    } else {
      const isCartAction = (e.currentTarget as HTMLElement).classList.contains('cart-btn');
      const amount = isCartAction ? 1 : (itemMultipliers[itemId] || 1);
      const success = addToCart(itemId, amount);
      if (!success) {
        setPressingItemId(null);
        return;
      }
    }

    longPressTimer.current = setTimeout(() => {
      if (isRemove) startContinuousRemove(itemId);
      else startContinuousAdd(itemId);
    }, 500);
  };

  const handleEndLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setPressingItemId(null);
    setRemovingItemId(null);
  };

  const handleBuy = () => {
    if (totalCost > state.stats.gold) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    const itemsToBuy = Object.entries(cart).map(([id, count]) => ({ id, count }));
    actions.buyItems(itemsToBuy, totalCost);
    setCart({});
    // setIsCartOpen(false); // 구매 후에도 장바구니를 열어둠
  };

  const setMultiplier = (itemId: string, mult: number) => {
    setItemMultipliers(prev => ({ ...prev, [itemId]: mult }));
  };

  return (
    <div className="h-full w-full flex bg-stone-950 relative overflow-hidden">
      
      {showError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[110] bg-red-900 border-2 border-red-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
           <AlertCircle className="w-5 h-5 text-red-200" />
           <div className="text-sm font-black uppercase tracking-tight">Insufficient Gold!</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex flex-col h-full transition-all duration-500 ease-in-out relative ${isCartOpen ? 'w-[50%] sm:w-[60%] md:flex-1' : 'w-full'}`}>
        
        <div className="bg-stone-900/80 backdrop-blur-md p-3 md:p-5 border-b border-stone-800 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="bg-amber-900/30 p-1.5 md:p-2.5 rounded-xl border border-amber-700/50">
              <Store className="w-4 h-4 md:w-6 md:h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm md:text-2xl font-black text-stone-100 font-serif tracking-tight uppercase leading-none">Market</h2>
              <span className="text-[7px] md:text-[9px] font-mono font-bold text-amber-600 block mt-1 uppercase">Tier {currentTier} Supplies</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-stone-500 font-mono text-[10px] uppercase tracking-widest hidden xs:block">
            Merchant: Lockhart's Provisions
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 md:p-6 custom-scrollbar">
          <div className={`grid gap-1.5 md:gap-4 max-w-7xl mx-auto content-start transition-all duration-500 ${isCartOpen ? 'grid-cols-2' : 'grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10'}`}>
            {MARKET_CATALOG.map((marketItem) => {
                const isKeyItem = marketItem.id === 'furnace' || marketItem.id === 'workbench';
                const isScrollItem = marketItem.id.startsWith('scroll_');
                const isOwned = (marketItem.id === 'furnace' && state.forge.hasFurnace) || (marketItem.id === 'workbench' && state.forge.hasWorkbench);

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

                const stockLeft = (state.marketStock[marketItem.id] || 0) - (cart[marketItem.id] || 0);
                const isSoldOut = stockLeft <= 0;
                const isInCart = (cart[marketItem.id] || 0) > 0;
                const selectedMult = itemMultipliers[marketItem.id] || 1;
                
                // 인벤토리 보유량 확인
                const invCount = state.inventory.find(i => i.id === marketItem.id)?.quantity || 0;

                return (
                  <div 
                    key={marketItem.id}
                    onMouseDown={(e) => !isSoldOut && handleStartLongPress(e, marketItem.id)}
                    onMouseUp={handleEndLongPress}
                    onMouseLeave={handleEndLongPress}
                    onTouchStart={(e) => !isSoldOut && handleStartLongPress(e, marketItem.id)}
                    onTouchEnd={handleEndLongPress}
                    className={`group relative flex flex-col items-center p-1 md:p-3 rounded-lg md:rounded-xl border transition-all ${isCartOpen ? 'h-[140px] md:h-[220px]' : 'h-[110px] md:h-[190px]'} justify-between overflow-hidden shadow-sm cursor-pointer select-none ${
                      pressingItemId === marketItem.id ? 'scale-95 border-amber-500 bg-amber-900/10' : 
                      isSoldOut 
                        ? 'bg-stone-900 border-stone-800 opacity-60 grayscale cursor-not-allowed' 
                        : 'bg-stone-850 border-stone-800 hover:border-amber-500/50 hover:bg-stone-800'
                    }`}
                  >
                    {/* 보유량 배지 (좌측 상단) */}
                    {invCount > 0 && (
                      <div className="absolute top-0.5 left-0.5 px-1 py-0 rounded text-[6px] md:text-[8px] font-black uppercase tracking-tighter border z-10 bg-slate-900/80 border-slate-600 text-slate-300 flex items-center gap-0.5">
                        <Package className="w-1.5 h-1.5 md:w-2 md:h-2" />
                        <span>{invCount}</span>
                      </div>
                    )}

                    {/* 상점 재고 배지 (우측 상단) */}
                    <div className={`absolute top-0.5 right-0.5 px-1 py-0 rounded text-[6px] md:text-[8px] font-black uppercase tracking-tighter border z-10 ${stockLeft > 0 ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' : 'bg-red-950/60 border-red-500/40 text-red-500'}`}>
                      {isSoldOut ? 'X' : stockLeft}
                    </div>

                    <div className="flex-1 flex items-center justify-center group-hover:scale-110 transition-transform relative mt-1">
                        <img 
                          src={getAssetUrl(`${marketItem.id}.png`)} 
                          className={`${isCartOpen ? 'w-10 h-10 md:w-20 md:h-20' : 'w-7 h-7 md:w-14 md:h-14'} object-contain drop-shadow-md`} 
                          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} 
                        />
                        <div className="hidden text-sm md:text-2xl">📦</div>
                    </div>

                    {!isSoldOut && !isKeyItem && !isScrollItem && (
                      <div className="multiplier-btn flex items-center gap-0.5 md:gap-1 mb-1 bg-stone-950/50 p-0.5 rounded-lg border border-stone-800/50 z-20 ignore-longpress">
                        {[1, 5, 10].map(m => (
                          <button
                            key={m}
                            onClick={(e) => { e.stopPropagation(); setMultiplier(marketItem.id, m); }}
                            className={`w-4 h-4 md:w-7 md:h-7 rounded text-[6px] md:text-[9px] font-black transition-all ${selectedMult === m ? 'bg-amber-600 text-white shadow-glow-sm' : 'bg-stone-800 text-stone-500 hover:text-stone-300'}`}
                          >
                            x{m}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="w-full text-center mb-0.5">
                        <h4 className={`${isCartOpen ? 'text-[9px] md:text-sm' : 'text-[7px] md:text-[11px]'} font-black leading-none truncate px-0.5 ${isKeyItem || isScrollItem ? 'text-amber-400' : 'text-stone-300'}`}>
                            {itemName}
                        </h4>
                    </div>

                    <div className={`w-full py-0.5 md:py-1 rounded border flex items-center justify-center gap-0.5 font-mono font-black ${isCartOpen ? 'text-[9px] md:text-sm' : 'text-[7px] md:text-xs'} transition-all ${isSoldOut ? 'bg-stone-900 border-stone-800 text-stone-700' : 'bg-stone-950 border-stone-800 text-amber-500'}`}>
                        <span className="hidden md:inline"><Coins className="w-2 h-2" /></span>
                        <span>{marketItem.price}</span>
                    </div>

                    {isSoldOut && !isInCart && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-[0.5px]">
                             <span className="bg-red-600 text-white text-[6px] md:text-[8px] font-black px-1 rounded rotate-12 shadow-md">SOLD</span>
                        </div>
                    )}
                  </div>
                );
            })}
          </div>
        </div>
      </div>

      {/* Slide-out Cart Panel */}
      <div className={`h-full bg-stone-900/95 backdrop-blur-3xl border-l border-stone-800 shadow-2xl z-[50] flex flex-col transition-all duration-500 ease-in-out relative ${isCartOpen ? 'w-[50%] sm:w-[40%] md:w-80' : 'w-0 overflow-visible border-none'}`}>
          
          <button 
            onClick={() => setIsCartOpen(!isCartOpen)} 
            className={`absolute top-1/2 -left-6 md:-left-8 w-6 md:w-8 h-20 md:h-24 -translate-y-1/2 border-y border-l transition-all z-[60] cursor-pointer shadow-xl rounded-l-lg flex flex-col items-center justify-center 
              ${cartItemCount > 0 
                ? 'bg-amber-600 border-amber-400 animate-pulse text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]' 
                : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700 hover:text-amber-400'
              }`}
          >
            <div className="relative">
              <ShoppingCart className={`w-3.5 h-3.5 md:w-5 md:h-5 ${isCartOpen && cartItemCount === 0 ? 'text-amber-500' : ''}`} />
              {cartItemCount > 0 && !isCartOpen && (
                <div className="absolute -top-2.5 -right-2.5 bg-white text-amber-600 text-[7px] md:text-[9px] font-black w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center ring-1 ring-amber-900">
                  {cartItemCount}
                </div>
              )}
            </div>
            {isCartOpen ? <ChevronRight className="w-3 h-3 md:w-4 md:h-4 mt-1 opacity-50" /> : <ChevronLeft className={`w-3 h-3 md:w-4 md:h-4 mt-1 ${cartItemCount > 0 ? 'text-white' : 'text-amber-500 animate-pulse'}`} />}
          </button>

          <div className={`flex flex-col h-full w-full ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="bg-stone-850 p-3 md:p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                      <div className="bg-amber-600 p-1.5 rounded-lg shrink-0">
                          <ShoppingCart className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-serif font-black text-xs md:text-lg text-stone-100 uppercase tracking-tighter truncate">Your Cart</h3>
                  </div>
                  <span className="text-[9px] md:text-xs font-mono font-bold text-stone-500 bg-stone-950 px-2 py-0.5 rounded-full border border-stone-800">
                    {cartItemCount}
                  </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2.5 custom-scrollbar">
                  {Object.keys(cart).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-stone-700 text-center px-4">
                          <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 opacity-10 mb-2" />
                          <p className="italic font-medium text-[8px] md:text-[10px] uppercase tracking-widest">Cart is empty</p>
                      </div>
                  ) : (
                      Object.entries(cart).map(([id, count]) => {
                          const marketItem = MARKET_CATALOG.find(i => i.id === id);
                          const name = id === 'furnace' ? 'Furnace' : id === 'workbench' ? 'Workbench' : MATERIALS[id.toUpperCase() as keyof typeof MATERIALS]?.name || id;
                          if (!marketItem) return null;
                          
                          const stockLeft = (state.marketStock[id] || 0) - (cart[id] || 0);

                          return (
                              <div 
                                key={id} 
                                className={`flex items-center gap-2 bg-stone-950 p-2 md:p-3 rounded-xl border transition-all group select-none min-h-[85px] md:min-h-[115px] ${removingItemId === id ? 'bg-red-900/10 border-red-500/50' : pressingItemId === id ? 'bg-amber-900/10 border-amber-500/50' : 'border-stone-800 hover:bg-stone-900'}`}
                              >
                                  <div className="w-10 h-10 md:w-14 md:h-14 bg-stone-900 rounded-lg border border-stone-800 flex items-center justify-center shrink-0">
                                      <img src={getAssetUrl(`${id}.png`)} className="w-8 h-8 md:w-11 md:h-11 object-contain" />
                                  </div>
                                  <div className="flex-1 min-w-0 h-full flex flex-col justify-center">
                                      <div className="text-stone-100 font-bold text-[10px] md:text-sm truncate leading-tight">{name}</div>
                                      <div className="text-amber-600 font-mono text-[9px] md:text-xs font-bold mt-0.5">{marketItem.price * (count as number)} G</div>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-1.5 md:gap-2 shrink-0 h-full justify-between py-0.5">
                                      {/* Top: Trash Button */}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); deleteFromCart(id); }}
                                        className="ignore-longpress p-1 md:p-1.5 bg-stone-900 hover:bg-red-900 text-stone-600 hover:text-white rounded-lg border border-stone-800 hover:border-red-500 transition-all active:scale-90 shadow-md"
                                        title="Remove all"
                                      >
                                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                      </button>

                                      {/* Bottom: Quantity Adjusters */}
                                      <div className="flex items-center bg-stone-900 rounded-lg border border-stone-700 p-0.5 shadow-inner">
                                          <button 
                                            onMouseDown={(e) => handleStartLongPress(e, id, true)}
                                            onMouseUp={handleEndLongPress}
                                            onMouseLeave={handleEndLongPress}
                                            onTouchStart={(e) => handleStartLongPress(e, id, true)}
                                            onTouchEnd={handleEndLongPress}
                                            className="cart-btn w-5 h-5 md:w-7 md:h-7 flex items-center justify-center bg-stone-800 hover:bg-stone-700 text-stone-400 rounded transition-all active:scale-90"
                                          >
                                            <Minus className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                                          </button>
                                          
                                          <div className="min-w-[22px] md:min-w-[32px] text-center font-mono text-stone-200 font-bold text-[10px] md:text-xs">
                                            {count}
                                          </div>
                                          
                                          <button 
                                            onMouseDown={(e) => handleStartLongPress(e, id, false)}
                                            onMouseUp={handleEndLongPress}
                                            onMouseLeave={handleEndLongPress}
                                            onTouchStart={(e) => handleStartLongPress(e, id, false)}
                                            onTouchEnd={handleEndLongPress}
                                            disabled={stockLeft <= 0}
                                            className={`cart-btn w-5 h-5 md:w-7 md:h-7 flex items-center justify-center transition-all active:scale-90 rounded ${stockLeft <= 0 ? 'bg-stone-900 text-stone-700 opacity-50 cursor-not-allowed' : 'bg-stone-800 hover:bg-stone-700 text-stone-400'}`}
                                          >
                                            <Plus className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>

              <div className="bg-stone-850 p-3 md:p-4 border-t border-stone-800 space-y-3 md:space-y-4 shrink-0">
                  <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] md:text-[10px] text-stone-600 font-bold uppercase tracking-tighter">
                          <span>Grand Total</span>
                          <div className="flex flex-col items-end">
                            <span className={`text-sm md:text-xl font-mono font-black ${totalCost > state.stats.gold ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                                {totalCost} G
                            </span>
                          </div>
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[7px] md:text-[8px] text-stone-600 font-black uppercase">
                        <CreditCard className="w-2 h-2 md:w-2.5 md:h-2.5" />
                        <span>Balance: {state.stats.gold} G</span>
                      </div>
                  </div>

                  <button
                      onClick={handleBuy}
                      disabled={totalCost === 0 || totalCost > state.stats.gold}
                      className={`w-full py-2.5 md:py-3 rounded-xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-2 shadow-xl border-b-2 active:border-b-0 active:translate-y-0.5 ${
                          totalCost > state.stats.gold 
                            ? 'bg-stone-800 border-stone-900 text-stone-600 cursor-not-allowed' 
                            : 'bg-amber-600 hover:bg-amber-500 border-amber-800 text-white'
                      }`}
                  >
                      {totalCost > state.stats.gold ? (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>Insufficient Funds</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Purchase</span>
                        </>
                      )}
                  </button>
              </div>
          </div>
      </div>

    </div>
  );
};

export default MarketTab;
