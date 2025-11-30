
import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Header from './components/Header';
import EventModal from './components/EventModal';
import InventoryDisplay from './components/InventoryDisplay';
import ForgeTab from './components/ForgeTab'; 
import { Store, Anvil, Package, ShoppingBag } from 'lucide-react';

const MarketTab = () => {
  const { state } = useGame();
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
       {!state.forge.hasFurnace ? (
         <div className="max-w-md p-8 border-2 border-dashed border-stone-800 rounded-2xl bg-stone-900/50">
           <Store className="w-16 h-16 text-stone-700 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-stone-500 mb-2">Market Closed</h3>
           <p className="text-stone-600">You need a functional <span className="text-orange-700 font-bold">Furnace</span> to open the shop and attract customers.</p>
           <p className="text-stone-700 text-sm mt-4 italic">Clean the rubble to find opportunities.</p>
         </div>
       ) : (
         <div className="w-full max-w-4xl">
            <button
              className="w-full py-12 bg-stone-800 rounded-2xl border-2 border-stone-700 hover:border-blue-500 hover:bg-stone-750 transition-all group"
            >
              <Store className="w-12 h-12 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-2xl font-bold text-stone-200">Open Shop</h2>
              <p className="text-stone-500 mt-2">Wait for customers to arrive (Coming Soon)</p>
            </button>
         </div>
       )}
    </div>
  );
};

// --- Main App Component ---

const AppContent = () => {
  const [activeTab, setActiveTab] = useState<'FORGE' | 'INVENTORY' | 'MARKET'>('FORGE');
  
  // Note: Minigame state is now handled internally in ForgeTab, 
  // but we can add global popups here if needed.

  return (
    <div className="h-screen w-screen bg-stone-950 text-stone-200 flex flex-col overflow-hidden font-sans selection:bg-amber-500/30">
      
      {/* 1. Header (Fixed) */}
      <Header />

      {/* 2. Tab Navigation (Fixed) */}
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

        </div>
      </div>

      {/* 3. Main Content Area (Scrollable internally) */}
      <main className="flex-1 overflow-hidden relative bg-stone-925 flex flex-col">
        {activeTab === 'FORGE' && <ForgeTab />}
        {activeTab === 'INVENTORY' && <InventoryDisplay />}
        {activeTab === 'MARKET' && <MarketTab />}
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
