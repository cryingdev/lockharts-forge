
import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Header from './components/Header';
import EventModal from './components/EventModal';
import InventoryDisplay from './components/InventoryDisplay';
import ForgeTab from './components/ForgeTab'; 
import ShopTab from './components/ShopTab';
import TavernTab from './components/TavernTab';
import ShopManager from './components/ShopManager';
import { Store, Anvil, Package, ShoppingBag, Plus, Minus, Trash2, AlertCircle, ShoppingCart, Coins, Beer } from 'lucide-react';
import { ITEMS } from './constants';
import { MARKET_CATALOG } from './data/gameData';

const MarketTab = () => {
  const { state, actions } = useGame();
  
  // Cart State: { [itemId]: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showError, setShowError] = useState(false);

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
      return total + (item ? item.price * count : 0);
    }, 0);
  };

  const handleBuy = () => {
    const total = calculateTotal();
    if (total > state.stats.gold) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    // Convert cart map to array for action
    const itemsToBuy = Object.entries(cart).map(([id, count]) => ({ id, count }));
    actions.buyItems(itemsToBuy, total);
    setCart({}); // Clear cart
  };

  const totalCost = calculateTotal();

  return (
    <div className="h-full flex flex-col md:flex-row bg-stone-925 p-4 gap-4 relative">
      
      {/* Error Popup */}
      {showError && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500 text-red-100 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
           <AlertCircle className="w-6 h-6" />
           <div>
             <h4 className="font-bold">Transaction Failed</h4>
             <p className="text-sm">You do not have enough gold.</p>
           </div>
        </div>
      )}

      {/* Left: Market Shelf */}
      <div className="flex-1 bg-stone-900 rounded-xl border border-stone-800 overflow-hidden flex flex-col">
         <div className="bg-stone-800/50 p-4 border-b border-stone-800 flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-500" />
            <h3 className="text-stone-200 font-bold tracking-wide">Material Supply</h3>
         </div>
         
         <div className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto">
            {MARKET_CATALOG.map(marketItem => {
                const itemDef = Object.values(ITEMS).find(i => i.id === marketItem.id);
                if (!itemDef) return null;
                return (
                    <button 
                        key={marketItem.id}
                        onClick={() => addToCart(marketItem.id)}
                        className="flex flex-col items-center p-4 bg-stone-800 rounded-lg border border-stone-700 hover:border-amber-500 hover:bg-stone-750 transition-all text-center group"
                    >
                        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                             {/* Placeholder icons based on ID since icon isn't in def yet */}
                             {marketItem.id === 'charcoal' ? '⚫' : 
                              marketItem.id === 'iron_ore' ? '🪨' : 
                              marketItem.id === 'copper_ore' ? '🔶' : 
                              marketItem.id === 'wood' ? '🪵' : '📦'}
                        </div>
                        <span className="font-bold text-stone-200">{itemDef.name}</span>
                        <span className="text-xs text-stone-500 mb-2">{itemDef.type}</span>
                        <div className="mt-auto bg-stone-950 px-3 py-1 rounded-full border border-stone-700 text-amber-400 font-mono text-sm font-bold">
                            {marketItem.price} G
                        </div>
                    </button>
                );
            })}
         </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full md:w-96 bg-stone-950 rounded-xl border border-stone-800 flex flex-col shadow-xl">
          <div className="bg-stone-900 p-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-stone-400" />
                  <h3 className="text-stone-300 font-bold">Cart</h3>
              </div>
              <span className="text-stone-500 text-sm">{Object.keys(cart).length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {Object.keys(cart).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-600 italic">
                      <ShoppingBag className="w-10 h-10 mb-2 opacity-20" />
                      Your cart is empty.
                  </div>
              ) : (
                  Object.entries(cart).map(([id, count]) => {
                      const marketItem = MARKET_CATALOG.find(i => i.id === id);
                      const itemDef = Object.values(ITEMS).find(i => i.id === id);
                      if (!marketItem || !itemDef) return null;

                      return (
                          <div key={id} className="flex items-center justify-between bg-stone-900 p-3 rounded-lg border border-stone-800">
                              <div>
                                  <div className="text-stone-200 font-bold">{itemDef.name}</div>
                                  <div className="text-stone-500 text-xs font-mono">{marketItem.price} G x {count}</div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                  <div className="text-amber-500 font-bold font-mono">
                                      {marketItem.price * count}
                                  </div>
                                  <div className="flex items-center gap-1">
                                      <button onClick={() => removeFromCart(id)} className="p-1 hover:bg-stone-800 rounded text-stone-400">
                                          <Minus className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => deleteFromCart(id)} className="p-1 hover:bg-red-900/30 rounded text-stone-500 hover:text-red-500 ml-1">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      );
                  })
              )}
          </div>

          <div className="bg-stone-900 p-6 border-t border-stone-800">
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

// --- Main App Component ---

const AppContent = () => {
  const [activeTab, setActiveTab] = useState<'FORGE' | 'INVENTORY' | 'MARKET' | 'SHOP' | 'TAVERN'>('FORGE');
  
  return (
    <div className="h-screen w-screen bg-stone-950 text-stone-200 flex flex-col overflow-hidden font-sans selection:bg-amber-500/30">
      
      {/* 1. Header (Fixed) */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* 2. Global Managers (Invisible) */}
      <ShopManager />

      {/* 3. Tab Navigation (Fixed) */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 shrink-0">
        <div className="max-w-6xl mx-auto flex space-x-1 overflow-x-auto no-scrollbar">
          
          <button 
            onClick={() => setActiveTab('FORGE')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'FORGE' 
                ? 'border-amber-500 text-amber-500 bg-stone-800/50' 
                : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
            }`}
          >
            <Anvil className="w-5 h-5" />
            <span className="font-bold tracking-wide">Forge</span>
          </button>

          <button 
            onClick={() => setActiveTab('INVENTORY')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'INVENTORY' 
                ? 'border-amber-500 text-amber-500 bg-stone-800/50' 
                : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="font-bold tracking-wide">Inventory</span>
          </button>

          <button 
            onClick={() => setActiveTab('MARKET')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'MARKET' 
                ? 'border-amber-500 text-amber-500 bg-stone-800/50' 
                : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-bold tracking-wide">Market</span>
          </button>

          <button 
            onClick={() => setActiveTab('SHOP')}
            className={`relative flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'SHOP' 
                ? 'border-amber-500 text-amber-500 bg-stone-800/50' 
                : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span className="font-bold tracking-wide">Shop</span>
          </button>

          <button 
            onClick={() => setActiveTab('TAVERN')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'TAVERN' 
                ? 'border-amber-500 text-amber-500 bg-stone-800/50' 
                : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
            }`}
          >
            <Beer className="w-5 h-5" />
            <span className="font-bold tracking-wide">Tavern</span>
          </button>

        </div>
      </div>

      {/* 4. Main Content Area (Scrollable internally) */}
      <main className="flex-1 overflow-hidden relative bg-stone-925 flex flex-col">
        {activeTab === 'FORGE' && <ForgeTab />}
        {activeTab === 'INVENTORY' && <InventoryDisplay />}
        {activeTab === 'MARKET' && <MarketTab />}
        {activeTab === 'SHOP' && <ShopTab />}
        {activeTab === 'TAVERN' && <TavernTab />}
      </main>

      {/* Overlays */}
      <EventModal />

    </div>
  );
};

const App = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};

export default App;
