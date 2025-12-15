
import React, { useState } from 'react';
import Header from './Header';
import { InventoryDisplay } from './InventoryDisplay';
import { Anvil, Package, ShoppingBag, Coins, Beer, Map as MapIcon } from 'lucide-react';
import { useGame } from '../context/GameContext';

// Import Services
import { useShopService } from '../services/shop/shop-service';
import { useDungeonService } from '../services/dungeon/dungeon-service';

// Import Tabs (New Structure)
import ForgeTab from './tabs/Forge/ForgeTab';
import ShopTab from './tabs/Shop/ShopTab';
import TavernTab from './tabs/Tavern/TavernTab'; // Fixed Typo: Tarven -> Tavern
import MarketTab from './tabs/Market/MarketTab';
import DungeonTab from './tabs/Dungeon/DungeonTab';

// Import Modals (New Structure)
import EventModal from './modals/EventModal';
import SleepModal from './modals/SleepModal';
import JournalModal from './modals/JournalModal';
import DungeonResultModal from './modals/DungeonResultModal';
import SettingsModal from './modals/SettingsModal';

interface MainGameLayoutProps {
    onQuit: () => void;
}

const MainGameLayout: React.FC<MainGameLayoutProps> = ({ onQuit }) => {
  const [activeTab, setActiveTab] = useState<'FORGE' | 'INVENTORY' | 'MARKET' | 'SHOP' | 'TAVERN' | 'DUNGEON'>('FORGE');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { state } = useGame();
  
  // --- Initialize Game Services ---
  useShopService();
  useDungeonService();

  // Calculate completed (waiting for claim) expeditions
  const completedExpeditionsCount = state.activeExpeditions.filter(
      exp => exp.status === 'COMPLETED'
  ).length;
  
  return (
    <div className="h-screen w-screen bg-stone-950 text-stone-200 flex flex-col overflow-hidden font-sans selection:bg-amber-500/30 animate-in fade-in duration-500">
      
      {/* 1. Header (Fixed) */}
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      
      {/* 2. Tab Navigation (Fixed) */}
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
            onClick={() => setActiveTab('DUNGEON')}
            className={`relative flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'DUNGEON' 
                ? 'border-amber-500 text-amber-500 bg-stone-800/50' 
                : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span className="font-bold tracking-wide">Dungeon</span>
            
            {/* Notification Badge */}
            {completedExpeditionsCount > 0 && (
                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-stone-900 animate-in zoom-in">
                    {completedExpeditionsCount}
                </div>
            )}
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
        
        {/* Quit Button Removed - Moved to Settings Modal */}
      </div>

      {/* 3. Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-stone-925 flex flex-col">
        <div className={`h-full w-full ${activeTab === 'FORGE' ? 'block' : 'hidden'}`}>
            <ForgeTab onNavigate={setActiveTab} />
        </div>

        <div className={`h-full w-full ${activeTab === 'SHOP' ? 'block' : 'hidden'}`}>
            <ShopTab />
        </div>

        {activeTab === 'INVENTORY' && <InventoryDisplay />}
        {activeTab === 'MARKET' && <MarketTab onNavigate={setActiveTab} />}
        {activeTab === 'TAVERN' && <TavernTab />}
        {activeTab === 'DUNGEON' && <DungeonTab />}
      </main>

      {/* Overlays */}
      <EventModal />
      <SleepModal />
      <JournalModal />
      <DungeonResultModal />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onQuit={onQuit} 
      />

    </div>
  );
};

export default MainGameLayout;
