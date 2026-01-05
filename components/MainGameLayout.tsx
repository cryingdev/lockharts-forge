
import React, { useState } from 'react';
import Header from './Header';
import { InventoryDisplay } from './InventoryDisplay';
import { Anvil, Package, ShoppingBag, Coins, Beer, Map as MapIcon, Activity } from 'lucide-react';
import { useGame } from '../context/GameContext';

// Import Background Services
import { useShopService } from '../services/shop/shop-service';
import { useDungeonService } from '../services/dungeon/dungeon-service';

// Import Tabs
import ForgeTab from './tabs/Forge/ForgeTab';
import ShopTab from './tabs/Shop/ShopTab';
import TavernTab from './tabs/Tavern/TavernTab';
import MarketTab from './tabs/Market/MarketTab';
import DungeonTab from './tabs/Dungeon/DungeonTab';
import SimulationTab from './tabs/Simulation/SimulationTab';

// Import Modals
import EventModal from './modals/EventModal';
import SleepModal from './modals/SleepModal';
import JournalModal from './modals/JournalModal';
import DungeonResultModal from './modals/DungeonResultModal';
import CraftingResultModal from './modals/CraftingResultModal';
import SettingsModal from './modals/SettingsModal';

interface MainGameLayoutProps {
    onQuit: () => void;
    onLoadFromSettings: (data: any, index: number) => void;
}

const MainGameLayout: React.FC<MainGameLayoutProps> = ({ onQuit, onLoadFromSettings }) => {
  const [activeTab, setActiveTab] = useState<'FORGE' | 'INVENTORY' | 'MARKET' | 'SHOP' | 'TAVERN' | 'DUNGEON' | 'SIMULATION'>('FORGE');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { state } = useGame();

  // --- BACKGROUND SERVICES ---
  useShopService();
  useDungeonService();
  
  const completedExpeditionsCount = state.activeExpeditions.filter(
      exp => exp.status === 'COMPLETED'
  ).length;

  const totalShopVisitors = (state.activeCustomer ? 1 : 0) + state.shopQueue.length;
  const isCrafting = state.isCrafting;
  
  return (
    <div className="h-[100dvh] w-full bg-stone-950 text-stone-200 flex flex-col overflow-hidden font-sans selection:bg-amber-500/30 animate-in fade-in duration-500 px-safe">
      
      {/* Top Section Wrapper - Handles sliding up/down during crafting */}
      <div className={`flex flex-col shrink-0 z-30 transition-all duration-500 ease-in-out ${isCrafting ? '-translate-y-full h-0 opacity-0 pointer-events-none' : 'translate-y-0 h-auto opacity-100'}`}>
        <Header 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onSettingsClick={() => setIsSettingsOpen(true)}
        />
        
        <div className="bg-stone-900 border-b border-stone-800 px-2 md:px-4 flex justify-between items-center z-10">
          <div className="flex space-x-0.5 md:space-x-1 overflow-x-auto no-scrollbar flex-1">
            
            <button 
              onClick={() => setActiveTab('FORGE')}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-3 md:py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'FORGE' ? 'border-amber-500 text-amber-500 bg-stone-800/50' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
              }`}
            >
              <Anvil className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-bold tracking-wide text-[10px] md:text-sm uppercase md:capitalize">Forge</span>
            </button>

            <button 
              onClick={() => setActiveTab('DUNGEON')}
              className={`relative flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-3 md:py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'DUNGEON' ? 'border-amber-500 text-amber-500 bg-stone-800/50' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
              }`}
            >
              <MapIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-bold tracking-wide text-[10px] md:text-sm uppercase md:capitalize">Dungeon</span>
              {completedExpeditionsCount > 0 && (
                  <div className="absolute top-1 right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-600 text-[8px] md:text-[10px] font-bold text-white shadow-sm ring-2 ring-stone-900 animate-in zoom-in">
                      {completedExpeditionsCount}
                  </div>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('INVENTORY')}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-3 md:py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'INVENTORY' ? 'border-amber-500 text-amber-500 bg-stone-800/50' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
              }`}
            >
              <Package className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-bold tracking-wide text-[10px] md:text-sm uppercase md:capitalize">Items</span>
            </button>

            <button 
              onClick={() => setActiveTab('MARKET')}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-3 md:py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'MARKET' ? 'border-amber-500 text-amber-500 bg-stone-800/50' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
              }`}
            >
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-bold tracking-wide text-[10px] md:text-sm uppercase md:capitalize">Market</span>
            </button>

            <button 
              onClick={() => setActiveTab('SHOP')}
              className={`relative flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-3 md:py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'SHOP' ? 'border-amber-500 text-amber-500 bg-stone-800/50' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
              }`}
            >
              <Coins className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-bold tracking-wide text-[10px] md:text-sm uppercase md:capitalize">Shop</span>
              {activeTab !== 'SHOP' && totalShopVisitors > 0 && (
                  <div className="absolute top-1 right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-600 text-[8px] md:text-[10px] font-bold text-white shadow-sm ring-2 ring-stone-900 animate-in zoom-in">
                      {totalShopVisitors}
                  </div>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('TAVERN')}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-3 md:py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'TAVERN' ? 'border-amber-500 text-amber-500 bg-stone-800/50' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
              }`}
            >
              <Beer className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-bold tracking-wide text-[10px] md:text-sm uppercase md:capitalize">Tavern</span>
            </button>

            <button 
              onClick={() => setActiveTab('SIMULATION')}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-3 md:py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'SIMULATION' ? 'border-amber-500 text-amber-500 bg-stone-800/50' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
              }`}
            >
              <Activity className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-bold tracking-wide text-[10px] md:text-sm uppercase md:capitalize">Sim</span>
            </button>

          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative bg-stone-925 flex flex-col min-h-0">
        <div className={`h-full w-full ${activeTab === 'FORGE' ? 'block' : 'hidden'}`}>
            <ForgeTab onNavigate={setActiveTab} />
        </div>
        <div className={`h-full w-full ${activeTab === 'SHOP' ? 'block' : 'hidden'}`}>
            <ShopTab onNavigate={setActiveTab} />
        </div>
        {activeTab === 'INVENTORY' && <InventoryDisplay />}
        {activeTab === 'MARKET' && <MarketTab onNavigate={setActiveTab} />}
        {activeTab === 'TAVERN' && <TavernTab />}
        {activeTab === 'DUNGEON' && <DungeonTab />}
        {activeTab === 'SIMULATION' && <SimulationTab />}
      </main>

      {/* Navigation Padding for Bottom Edge Devices */}
      <div className="h-[env(safe-area-inset-bottom)] bg-stone-900 shrink-0"></div>

      <EventModal />
      <SleepModal />
      <JournalModal />
      <DungeonResultModal />
      <CraftingResultModal />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onQuit={onQuit} 
        onLoadRequest={onLoadFromSettings}
      />
    </div>
  );
};

export default MainGameLayout;
