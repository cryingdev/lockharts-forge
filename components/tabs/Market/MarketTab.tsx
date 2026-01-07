
import React, { useState, useMemo, useRef } from 'react';
import { useGame } from '../../../context/GameContext';
import {
  Store,
  ShoppingCart,
  ShoppingBag,
  AlertCircle,
  Coins,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Plus,
  Minus,
  Package,
  CreditCard,
} from 'lucide-react';
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

  const cartItemCount = useMemo(
    () => (Object.values(cart) as number[]).reduce((a, b) => a + b, 0),
    [cart]
  );

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

    if (currentInCart >= availableStock) return false;

    const canAddCount = Math.min(amount, availableStock - currentInCart);
    if (canAddCount <= 0) return false;

    setCart(prev => {
      const nowInCart = prev[itemId] || 0;
      if (nowInCart >= availableStock) return prev;
      if (isOneTimeItem && nowInCart > 0) return prev;

      return {
        ...prev,
        [itemId]: nowInCart + (isOneTimeItem ? 1 : canAddCount),
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
      handleEndLongPress();
      return;
    }
    currentInterval.current = Math.max(50, currentInterval.current * 0.85);
    longPressTimer.current = setTimeout(() => startContinuousAdd(itemId), currentInterval.current);
  };

  const startContinuousRemove = (itemId: string) => {
    const success = removeFromCart(itemId);
    if (!success) {
      handleEndLongPress();
      return;
    }
    currentInterval.current = Math.max(50, currentInterval.current * 0.85);
    longPressTimer.current = setTimeout(() => startContinuousRemove(itemId), currentInterval.current);
  };

  const handleStartLongPress = (e: React.PointerEvent, itemId: string, isRemove: boolean = false) => {
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
      const amount = itemMultipliers[itemId] || 1;
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

      {/* ✅ 메인 카탈로그: 너비를 w-full로 고정하여 장바구니 상태와 무관하게 일정하게 유지 */}
      <div className="flex flex-col h-full w-full relative shrink-0">
        <div className="bg-stone-900/80 backdrop-blur-md p-3 md:p-5 border-b border-stone-800 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="bg-amber-900/30 p-1.5 md:p-2.5 rounded-xl border border-amber-700/50">
              <Store className="w-4 h-4 md:w-6 md:h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm md:text-2xl font-black text-stone-100 font-serif tracking-tight uppercase leading-none">
                Market
              </h2>
              <span className="text-[7px] md:text-[9px] font-mono font-bold text-amber-600 block mt-1 uppercase">
                Tier {currentTier} Supplies
              </span>
            </div>
          </div>

          {/* Quick Pay Button in Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBuy}
              disabled={cartItemCount === 0 || totalCost > state.stats.gold}
              className={`relative flex items-center gap-2 md:gap-3 px-3 md:px-6 py-1.5 md:py-3 rounded-xl border transition-all shadow-lg active:scale-95 group ${
                cartItemCount === 0
                  ? 'bg-stone-800/40 border-stone-700 text-stone-600 cursor-not-allowed'
                  : totalCost > state.stats.gold
                    ? 'bg-red-900/40 border-red-700 text-red-300'
                    : 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white shadow-[0_0_20px_rgba(217,119,6,0.2)]'
              }`}
            >
              <div className="relative">
                <ShoppingCart className={`w-3.5 h-3.5 md:w-5 md:h-5 ${cartItemCount > 0 ? 'animate-bounce' : ''}`} />
                {cartItemCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[7px] md:text-[9px] font-black px-1 rounded-full border border-stone-900 ring-1 ring-white/20">
                    {cartItemCount}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Pay Now</span>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="text-[9px] md:text-sm font-mono font-black">{totalCost}</span>
                  <Coins className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-200" />
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 md:p-6 custom-scrollbar pb-24">
          {/* ✅ 그리드 고정: 컬럼 수를 고정하여 UI 변동 방지 */}
          <div className="grid gap-1.5 md:gap-4 max-w-7xl mx-auto content-start grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {MARKET_CATALOG.map(marketItem => {
              const isKeyItem = marketItem.id === 'furnace' || marketItem.id === 'workbench';
              const isScrollItem = marketItem.id.startsWith('scroll_');
              const isOwned =
                (marketItem.id === 'furnace' && state.forge.hasFurnace) ||
                (marketItem.id === 'workbench' && state.forge.hasWorkbench);

              if (isKeyItem && isOwned) return null;

              let itemName = '';
              let itemTier = 1;
              if (marketItem.id === 'furnace') {
                itemName = 'Furnace';
                itemTier = 0;
              } else if (marketItem.id === 'workbench') {
                itemName = 'Workbench';
                itemTier = 1;
              } else if (marketItem.id === 'scroll_t2') {
                itemName = 'Scroll T2';
                itemTier = 1;
                if (currentTier >= 2) return null;
              } else if (marketItem.id === 'scroll_t3') {
                itemName = 'Scroll T3';
                itemTier = 2;
                if (currentTier >= 3) return null;
              } else {
                const itemDef = Object.values(MATERIALS).find(i => i.id === marketItem.id);
                if (!itemDef) return null;
                itemName = (itemDef as any).name;
                itemTier = (itemDef as any).tier || 1;
              }

              if (itemTier > currentTier) return null;

              const stockLeft = (state.marketStock[marketItem.id] || 0) - (cart[marketItem.id] || 0);
              const isSoldOut = stockLeft <= 0;
              const selectedMult = itemMultipliers[marketItem.id] || 1;
              const invCount = state.inventory.find(i => i.id === marketItem.id)?.quantity || 0;

              return (
                <div
                  key={marketItem.id}
                  className={`group relative flex flex-col items-center p-1 md:p-2 rounded-lg md:rounded-xl border transition-all h-[130px] md:h-[210px] justify-between overflow-hidden shadow-sm select-none ${
                    pressingItemId === marketItem.id
                      ? 'scale-[0.97] border-amber-500 bg-amber-900/10'
                      : isSoldOut
                        ? 'bg-stone-900 border-stone-800 opacity-60 grayscale'
                        : 'bg-stone-850 border-stone-800'
                  }`}
                >
                  {invCount > 0 && (
                    <div className="absolute top-0.5 left-0.5 px-1 py-0 rounded text-[6px] md:text-[8px] font-black uppercase tracking-tighter border z-10 bg-slate-900/80 border-slate-600 text-slate-300 flex items-center gap-0.5">
                      <Package className="w-1.5 h-1.5 md:w-2 md:h-2" />
                      <span>{invCount}</span>
                    </div>
                  )}

                  <div
                    className={`absolute top-0.5 right-0.5 px-1 py-0 rounded text-[6px] md:text-[8px] font-black uppercase tracking-tighter border z-10 ${
                      stockLeft > 0 ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' : 'bg-red-950/60 border-red-500/40 text-red-500'
                    }`}
                  >
                    {isSoldOut ? 'X' : stockLeft}
                  </div>

                  {/* ✅ 아이콘 영역: 크기를 더욱 키움 */}
                  <div
                    className={`flex-1 w-full flex items-center justify-center transition-all relative mt-1 overflow-hidden rounded-lg
                      ${isSoldOut ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-stone-800/50 group-hover:scale-105 active:scale-95'}
                      touch-none
                    `}
                    onPointerDown={(e) => {
                      if (isSoldOut) return;
                      handleStartLongPress(e, marketItem.id);
                    }}
                    onPointerUp={handleEndLongPress}
                    onPointerLeave={handleEndLongPress}
                    onPointerCancel={handleEndLongPress}
                  >
                    <img
                      src={getAssetUrl(`${marketItem.id}.png`)}
                      className="w-14 h-14 md:w-26 md:h-26 object-contain drop-shadow-md pointer-events-none"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                      draggable={false}
                    />
                    <div className="hidden text-base md:text-3xl pointer-events-none">📦</div>
                  </div>

                  {!isSoldOut && !isKeyItem && !isScrollItem && (
                    <div
                      className="multiplier-btn flex items-center gap-0.5 md:gap-1 my-1 bg-stone-950/80 p-0.5 rounded-lg border border-stone-800/50 z-20"
                    >
                      {[1, 5, 10].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMultiplier(marketItem.id, m);
                          }}
                          className={`w-4 h-4 md:w-7 md:h-7 rounded text-[6px] md:text-[9px] font-black transition-all ${
                            selectedMult === m
                              ? 'bg-amber-600 text-white shadow-glow-sm'
                              : 'bg-stone-800 text-stone-500 hover:text-stone-300'
                          }`}
                        >
                          x{m}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="w-full text-center mb-0.5">
                    <h4
                      className="text-[7px] md:text-[11px] font-black leading-none truncate px-1 ${
                        isKeyItem || isScrollItem ? 'text-amber-400' : 'text-stone-400'
                      }"
                    >
                      {itemName}
                    </h4>
                  </div>

                  <div
                    className={`w-full py-0.5 md:py-1 rounded-b-lg border-t flex items-center justify-center gap-0.5 font-mono font-black transition-all
                      text-[7px] md:text-xs
                      ${isSoldOut
                        ? 'bg-stone-900 border-stone-800 text-stone-700 cursor-not-allowed'
                        : 'bg-stone-950 border-stone-800 text-amber-500 cursor-pointer hover:bg-amber-900/20 active:bg-amber-900/40'
                      }
                      select-none touch-none
                    `}
                    onPointerDown={(e) => {
                      if (isSoldOut) return;
                      handleStartLongPress(e, marketItem.id);
                    }}
                    onPointerUp={handleEndLongPress}
                    onPointerLeave={handleEndLongPress}
                    onPointerCancel={handleEndLongPress}
                  >
                    <span className="hidden md:inline pointer-events-none">
                      <Coins className="w-2.5 h-2.5" />
                    </span>
                    <span className="pointer-events-none">{marketItem.price}</span>
                  </div>

                  {isSoldOut && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-[0.5px]">
                      <span className="bg-red-600 text-white text-[6px] md:text-[8px] font-black px-1.5 py-0.5 rounded rotate-12 shadow-md">
                        SOLD
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ✅ 장바구니 오버랩 드로어: absolute 포지션으로 카탈로그 위에 덮어씌움 */}
      <div
        className={`absolute top-0 right-0 h-full bg-stone-900/95 backdrop-blur-3xl border-l border-stone-800 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-[100] flex flex-col transition-all duration-500 ease-in-out ${
          isCartOpen ? 'w-[85%] sm:w-[50%] md:w-80 translate-x-0' : 'w-0 translate-x-full border-none'
        }`}
      >
        {/* 토글 버튼: 장바구니 패널의 왼쪽에 고정되어 함께 이동 */}
        <button
          onClick={() => setIsCartOpen(!isCartOpen)}
          className={`absolute top-1/2 -left-6 md:-left-8 w-6 md:w-8 h-20 md:h-24 -translate-y-1/2 border-y border-l transition-all z-[110] cursor-pointer shadow-xl rounded-l-lg flex flex-col items-center justify-center 
            ${
              cartItemCount > 0
                ? 'bg-amber-600 border-amber-400 animate-pulse text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]'
                : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700 hover:text-amber-400'
            }`}
        >
          <ShoppingCart className="w-3.5 h-3.5 md:w-5 md:h-5" />
          {isCartOpen ? (
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 mt-1 opacity-50" />
          ) : (
            <ChevronLeft
              className={`w-3 h-3 md:w-4 md:h-4 mt-1 ${
                cartItemCount > 0 ? 'text-white' : 'text-amber-500 animate-pulse'
              }`}
            />
          )}
        </button>

        <div className={`flex flex-col h-full w-full ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-stone-850 p-3 md:p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
            <h3 className="font-serif font-black text-xs md:text-lg text-stone-100 uppercase tracking-tighter truncate">
              Your Cart
            </h3>
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
                const name =
                  id === 'furnace'
                    ? 'Furnace'
                    : id === 'workbench'
                      ? 'Workbench'
                      : MATERIALS[id.toUpperCase() as keyof typeof MATERIALS]?.name || id;

                if (!marketItem) return null;

                return (
                  <div key={id} className="flex items-center gap-2 bg-stone-950 p-2 md:p-3 rounded-xl border border-stone-800 group select-none">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-stone-900 rounded-lg border border-stone-800 flex items-center justify-center shrink-0">
                      <img src={getAssetUrl(`${id}.png`)} className="w-8 h-8 md:w-11 md:h-11 object-contain" draggable={false} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="text-stone-100 font-bold text-[10px] md:text-sm truncate">{name}</div>
                      <div className="text-amber-600 font-mono text-[9px] md:text-xs font-bold">{marketItem.price * (count as number)} G</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 bg-stone-900 rounded-lg border border-stone-700 p-0.5">
                      <button
                        type="button"
                        onClick={() => removeFromCart(id)}
                        className="w-5 h-5 md:w-7 md:h-7 flex items-center justify-center bg-stone-800 hover:bg-stone-700 text-stone-400 rounded transition-all"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="min-w-[16px] text-center font-mono text-stone-200 font-bold text-[10px] md:text-xs">{count}</span>
                      <button
                        type="button"
                        onClick={() => addToCart(id, 1)}
                        className="w-5 h-5 md:w-7 md:h-7 flex items-center justify-center bg-stone-800 hover:bg-stone-700 text-stone-400 rounded transition-all"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <button type="button" onClick={() => deleteFromCart(id)} className="p-1 md:p-1.5 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-stone-850 p-3 md:p-4 border-t border-stone-800 space-y-3 shrink-0">
            <div className="flex justify-between items-center text-[9px] md:text-sm text-stone-600 font-bold uppercase tracking-tighter">
              <span>Grand Total</span>
              <span className={`text-sm md:text-xl font-mono font-black ${totalCost > state.stats.gold ? 'text-red-500' : 'text-amber-500'}`}>
                {totalCost} G
              </span>
            </div>
            <button
              type="button"
              onClick={handleBuy}
              disabled={totalCost === 0 || totalCost > state.stats.gold}
              className={`w-full py-2.5 md:py-3 rounded-xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                totalCost > state.stats.gold ? 'bg-stone-800 text-stone-600 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{totalCost > state.stats.gold ? 'Insufficient Funds' : 'Purchase'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTab;
