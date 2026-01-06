
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import Header from './Header';
import { InventoryDisplay } from './InventoryDisplay';
import { Anvil, Package, ShoppingBag, Coins, Beer, Map as MapIcon, Activity, Info, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const { state, actions } = useGame();

  // Scroll visibility logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrows = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      
      // 스크롤이 가능한 상태인지 체크
      const canScroll = scrollWidth > clientWidth + 2;
      
      // 왼쪽 끝 감지: scrollLeft가 1 이하이면 완전히 숨김
      setShowLeftArrow(canScroll && scrollLeft > 1);
      
      // 오른쪽 끝 감지: Math.ceil을 사용하여 소수점 픽셀 오차 보정
      const isAtEnd = Math.ceil(scrollLeft) >= (scrollWidth - clientWidth - 2);
      setShowRightArrow(canScroll && !isAtEnd);
    }
  }, []);

  const scrollTabs = (direction: 'LEFT' | 'RIGHT') => {
    if (scrollRef.current) {
      const amount = direction === 'LEFT' ? -200 : 200;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  useLayoutEffect(() => {
    // 렌더링 직후 여백을 계산하여 버튼 가시성 설정
    const timer = setTimeout(updateArrows, 100);
    return () => clearTimeout(timer);
  }, [updateArrows, activeTab]);

  useEffect(() => {
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows]);

  // --- BACKGROUND SERVICES ---
  useShopService();
  useDungeonService();
  
  const completedExpeditionsCount = state.activeExpeditions.filter(
      exp => exp.status === 'COMPLETED'
  ).length;

  const totalShopVisitors = (state.activeCustomer ? 1 : 0) + state.shopQueue.length;
  
  const isFullscreenOverlay = state.isCrafting || (state.activeManualDungeon && state.showManualDungeonOverlay);

  // Tab Button Helper
  const renderTabButton = (id: typeof activeTab, Icon: any, label: string, badgeCount: number = 0) => {
    const isActive = activeTab === id;
    return (
        <button 
            onClick={() => setActiveTab(id)}
            className={`relative flex items-center gap-2 px-5 md:px-6 py-3 md:py-4 border-b-2 transition-all whitespace-nowrap snap-start shrink-0 ${
                isActive 
                ? 'border-amber-500 text-amber-500 bg-stone-800/60 z-10' 
                : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
            }`}
        >
            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'scale-110' : ''}`} />
            <span className="font-bold tracking-wide text-[10px] md:text-sm uppercase">{label}</span>
            {badgeCount > 0 && (
                <div className="absolute top-1 right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-600 text-[8px] md:text-[10px] font-black text-white shadow-lg ring-2 ring-stone-900 animate-in zoom-in">
                    {badgeCount}
                </div>
            )}
        </button>
    );
  };

  return (
    <div className="h-[100dvh] w-full bg-stone-950 text-stone-200 flex flex-col overflow-hidden font-sans selection:bg-amber-500/30 animate-in fade-in duration-500 px-safe">
      
      {/* Top Section Wrapper */}
      <div className={`flex flex-col shrink-0 z-30 transition-all duration-500 ease-in-out ${isFullscreenOverlay ? '-translate-y-full h-0 opacity-0 pointer-events-none' : 'translate-y-0 h-auto opacity-100'}`}>
        <Header 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onSettingsClick={() => setIsSettingsOpen(true)}
        />
        
        {/* Tab Navigation Wrapper - isolate to prevent stacking issues */}
        <div className="bg-stone-900 border-b border-stone-800 flex items-center relative z-10 overflow-hidden isolate h-11 md:h-14">
          
          {/* Left Mask & Arrow - Completely scale out and hide if at start */}
          <div 
            className={`absolute left-0 top-0 bottom-0 z-30 w-12 flex items-center transition-all duration-300 transform-gpu ${
                showLeftArrow ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-0 invisible pointer-events-none'
            }`}
          >
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/90 to-transparent" />
              <button 
                onClick={() => scrollTabs('LEFT')}
                className="relative h-full w-full flex items-center pl-2 group/arrow"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="w-5 h-5 text-amber-500 group-hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </button>
          </div>

          {/* Scrollable Container - Removed inner padding div to allow scrollLeft 0 to be absolute start */}
          <div 
            ref={scrollRef}
            onScroll={updateArrows}
            className="flex overflow-x-auto no-scrollbar flex-1 min-w-0 touch-pan-x scroll-smooth snap-x snap-mandatory overscroll-behavior-x-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {renderTabButton('FORGE', Anvil, 'Forge')}
            {renderTabButton('DUNGEON', MapIcon, 'Dungeon', completedExpeditionsCount)}
            {renderTabButton('INVENTORY', Package, 'Items')}
            {renderTabButton('MARKET', ShoppingBag, 'Market')}
            {renderTabButton('SHOP', Coins, 'Shop', activeTab !== 'SHOP' ? totalShopVisitors : 0)}
            {renderTabButton('TAVERN', Beer, 'Tavern')}
            {renderTabButton('SIMULATION', Activity, 'Sim')}
          </div>

          {/* Right Mask & Arrow - Completely scale out and hide if at end */}
          <div 
            className={`absolute right-0 top-0 bottom-0 z-30 w-12 flex items-center justify-end transition-all duration-300 transform-gpu ${
                showRightArrow ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-0 invisible pointer-events-none'
            }`}
          >
              <div className="absolute inset-0 bg-gradient-to-l from-stone-900 via-stone-900/90 to-transparent" />
              <button 
                onClick={() => scrollTabs('RIGHT')}
                className="relative h-full w-full flex items-center justify-end pr-2 group/arrow"
                aria-label="Scroll Right"
              >
                <ChevronRight className="w-5 h-5 text-amber-500 group-hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
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

      {/* Toast Notification Container */}
      {state.toast?.visible && (
        <div 
            onClick={actions.hideToast}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-6 py-3 bg-stone-900/95 border border-amber-500/50 text-stone-200 rounded-xl shadow-2xl backdrop-blur-md cursor-pointer animate-in slide-in-from-bottom-4 fade-in duration-300 ring-2 ring-black/50 active:scale-95 w-max max-w-[80vw]"
        >
            <Info className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-sm font-bold tracking-tight text-center leading-tight">{state.toast.message}</span>
        </div>
      )}

      {/* Navigation Padding */}
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
