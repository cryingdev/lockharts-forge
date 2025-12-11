
import React, { useState } from 'react';
import { GameProvider } from './context/GameContext';
import Header from './components/Header';
import EventModal from './components/EventModal';
import InventoryDisplay from './components/InventoryDisplay';
import ForgeTab from './components/ForgeTab'; 
import ShopTab from './components/ShopTab';
import TavernTab from './components/TavernTab';
import MarketTab from './components/MarketTab';
import ShopManager from './components/ShopManager';
import { Anvil, Package, ShoppingBag, Coins, Beer } from 'lucide-react';

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
        {/* Persistent Forge Tab */}
        <div className={`h-full w-full ${activeTab === 'FORGE' ? 'block' : 'hidden'}`}>
            <ForgeTab onNavigate={setActiveTab} />
        </div>

        {/* Persistent Shop Tab - State preserved during navigation */}
        <div className={`h-full w-full ${activeTab === 'SHOP' ? 'block' : 'hidden'}`}>
            <ShopTab />
        </div>

        {/* Other tabs are lazy/conditionally rendered */}
        {activeTab === 'INVENTORY' && <InventoryDisplay />}
        {activeTab === 'MARKET' && <MarketTab onNavigate={setActiveTab} />}
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
