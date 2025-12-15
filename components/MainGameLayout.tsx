
import React, { useState } from 'react';
import Header from './Header';
import EventModal from './EventModal';
import SleepModal from './SleepModal';
import { InventoryDisplay } from './InventoryDisplay';
import JournalModal from './JournalModal';
import ForgeTab from './ForgeTab'; 
import ShopTab from './ShopTab';
import TavernTab from './TavernTab';
import MarketTab from './MarketTab';
import ShopManager from './ShopManager';
import { Anvil, Package, ShoppingBag, Coins, Beer, LogOut } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface MainGameLayoutProps {
    onQuit: () => void;
}

const MainGameLayout: React.FC<MainGameLayoutProps> = ({ onQuit }) => {
  const [activeTab, setActiveTab] = useState<'FORGE' | 'INVENTORY' | 'MARKET' | 'SHOP' | 'TAVERN'>('FORGE');
  
  // Optional: Add a confirmation dialog for quitting
  const handleQuit = () => {
      // In a real app, save game here
      onQuit();
  };

  return (
    <div className="h-screen w-screen bg-stone-950 text-stone-200 flex flex-col overflow-hidden font-sans selection:bg-amber-500/30 animate-in fade-in duration-500">
      
      {/* 1. Header (Fixed) */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* 2. Global Managers (Invisible) */}
      <ShopManager />

      {/* 3. Tab Navigation (Fixed) */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 shrink-0 flex justify-between items-center">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar flex-1">
          
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
        
        {/* Quit Button */}
        <button 
            onClick={handleQuit}
            className="p-3 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors ml-2"
            title="Return to Title"
        >
            <LogOut className="w-5 h-5" />
        </button>
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
      <SleepModal />
      <JournalModal />

    </div>
  );
};

export default MainGameLayout;
