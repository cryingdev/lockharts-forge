
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import Header from './Header';
import { InventoryDisplay } from './InventoryDisplay';
import { Anvil, Package, ShoppingBag, Coins, Beer, Map as MapIcon, Activity, Info, ChevronLeft, ChevronRight, Pointer, Lock as LockIcon, FastForward } from 'lucide-react';
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
import TutorialScene from './tabs/Forge/TutorialScene';
import DialogueBox from './DialogueBox';
import ConfirmationModal from './modals/ConfirmationModal';

interface MainGameLayoutProps {
    onQuit: () => void;
    onLoadFromSettings: (data: any, index: number) => void;
}

const TutorialOverlay = ({ step, onSkip }: { step: string, onSkip: () => void }) => {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const requestRef = useRef<number>(null);

    const updateRect = useCallback(() => {
        let id = '';
        if (step === 'MARKET_GUIDE') id = 'MARKET_TAB';
        else if (step === 'FURNACE_GUIDE') id = 'FURNACE_ITEM';
        else if (step === 'OPEN_SHOPPING_CART' || step === 'CLOSE_SHOPPING_CART') id = 'CART_TOGGLE';
        else if (step === 'PAY_NOW') id = 'PAY_NOW_BUTTON';
        else if (step === 'FORGE_TAB_GUIDE') id = 'FORGE_TAB';
        else if (step === 'SELECT_SWORD_GUIDE') id = 'SWORD_RECIPE';
        else if (step === 'START_FORGING_GUIDE') id = 'START_FORGING_BUTTON';
        else if (step === 'FINALIZE_FORGE_GUIDE') id = 'FINALIZE_BUTTON';
        else if (step === 'OPEN_SHOP_TAB_GUIDE') id = 'SHOP_TAB';
        else if (step === 'OPEN_SHOP_SIGN_GUIDE') id = 'SHOP_SIGN';
        
        const el = document.querySelector(`[data-tutorial-id="${id}"]`);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setTargetRect(rect);
            }
        } else {
            setTargetRect(null);
        }
        requestRef.current = requestAnimationFrame(updateRect);
    }, [step]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updateRect);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [updateRect]);

    const { top, left, width, height } = targetRect || { top: 0, left: 0, width: 0, height: 0 };
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const radius = Math.max(width, height) / 1.3;

    let label = 'Guide';
    if (step === 'MARKET_GUIDE') label = 'Visit the Market';
    else if (step === 'FURNACE_GUIDE') label = 'Select the Furnace';
    else if (step === 'OPEN_SHOPPING_CART') label = 'Open the Cart';
    else if (step === 'CLOSE_SHOPPING_CART') label = 'Close the Cart';
    else if (step === 'PAY_NOW') label = 'Finalize Purchase';
    else if (step === 'FORGE_TAB_GUIDE') label = 'Open Forge';
    else if (step === 'SELECT_SWORD_GUIDE') label = 'Select Sword';
    else if (step === 'START_FORGING_GUIDE') label = 'Start Forging';
    else if (step === 'FINALIZE_FORGE_GUIDE') label = 'Complete Forge';
    else if (step === 'OPEN_SHOP_TAB_GUIDE') label = 'Open Shop';
    else if (step === 'OPEN_SHOP_SIGN_GUIDE') label = 'Open the Forge';

    return (
        <div className="fixed inset-0 z-[2000] pointer-events-none overflow-hidden">
            {/* Skip Button Area (Interactive) */}
            <div className="absolute top-4 left-4 pointer-events-auto">
                <button 
                    onClick={onSkip}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/80 hover:bg-stone-800 border border-stone-700/50 text-stone-500 hover:text-stone-300 rounded-full transition-all text-[10px] font-black uppercase tracking-tighter shadow-xl backdrop-blur-md group"
                >
                    <FastForward className="w-3 h-3 group-hover:animate-pulse" />
                    Skip Tutorial
                </button>
            </div>

            {targetRect && (
                <>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full pointer-events-auto bg-transparent" style={{ height: top }} />
                        <div className="absolute left-0 w-full pointer-events-auto bg-transparent" style={{ top: top + height, bottom: 0 }} />
                        <div className="absolute top-0 left-0 pointer-events-auto bg-transparent" style={{ top, height, width: left }} />
                        <div className="absolute top-0 pointer-events-auto bg-transparent" style={{ top, height, left: left + width, right: 0 }} />
                    </div>

                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <defs>
                            <mask id="tutorial-mask">
                                <rect width="100%" height="100%" fill="white" />
                                <circle cx={centerX} cy={centerY} r={radius} fill="black" />
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#tutorial-mask)" />
                    </svg>

                    <div className="absolute transition-all duration-300 ease-out" style={{ left: centerX, top: top + height + 15, transform: 'translateX(-50%)' }}>
                        <div className="flex flex-col items-center animate-bounce">
                            <Pointer className="w-8 h-8 md:w-12 md:h-12 text-amber-400 fill-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                            <div className="mt-3 px-4 py-1.5 bg-amber-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full shadow-2xl whitespace-nowrap border-2 border-amber-400">
                                {label}
                            </div>
                        </div>
                    </div>

                    <div className="absolute border-2 border-amber-400/50 rounded-full animate-ping pointer-events-none" style={{ left: centerX - radius, top: centerY - radius, width: radius * 2, height: radius * 2 }} />
                </>
            )}
        </div>
    );
};

const MainGameLayout: React.FC<MainGameLayoutProps> = ({ onQuit, onLoadFromSettings }) => {
  const { state, actions } = useGame();
  const [activeTab, setActiveTab] = useState<'FORGE' | 'INVENTORY' | 'MARKET' | 'SHOP' | 'TAVERN' | 'DUNGEON' | 'SIMULATION'>('FORGE');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Scroll visibility logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrows = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const canScroll = scrollWidth > clientWidth + 2;
      setShowLeftArrow(canScroll && scrollLeft > 1);
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
  const renderTabButton = (tab: { id: typeof activeTab, icon: any, label: string, badge?: number }) => {
    const { id, icon: Icon, label, badge: badgeCount } = tab;
    const isActive = activeTab === id;
    
    // Tutorial override: SHOP is considered unlocked if we are in the Shop Guide steps
    const isShopTutorialStep = (state.tutorialStep === 'SHOP_INTRO_PROMPT' || state.tutorialStep === 'OPEN_SHOP_TAB_GUIDE' || state.tutorialStep === 'OPEN_SHOP_SIGN_GUIDE' || state.tutorialStep === 'SELL_ITEM_GUIDE');
    const isUnlocked = state.unlockedTabs.includes(id) || (id === 'SHOP' && isShopTutorialStep);
    
    const isHighlighted = (state.tutorialStep === 'MARKET_GUIDE' && id === 'MARKET') || 
                         (state.tutorialStep === 'FORGE_TAB_GUIDE' && id === 'FORGE') ||
                         (state.tutorialStep === 'OPEN_SHOP_TAB_GUIDE' && id === 'SHOP');

    const handleTabClick = () => {
        // Block tab switching during forced sale tutorial
        if (state.tutorialStep === 'SELL_ITEM_GUIDE') {
            actions.showToast("Finalize the sale to Pip first.");
            return;
        }

        if (!isUnlocked) {
            let message = "This facility needs restoration.";
            if (id === 'SHOP') message = "Install a Furnace to open the Shop Counter.";
            if (id === 'INVENTORY') message = "Acquire your first material or perform repairs to track inventory.";
            if (id === 'TAVERN') message = "Rest until Day 2 to welcome travelers at the Tavern.";
            if (id === 'DUNGEON') message = "Hire a mercenary at the Tavern to explore dungeons.";
            actions.showToast(message);
            return;
        }

        if (state.tutorialStep === 'MARKET_GUIDE' && id === 'MARKET') {
            actions.setTutorialStep('FURNACE_GUIDE');
        } else if (state.tutorialStep === 'FORGE_TAB_GUIDE' && id === 'FORGE') {
            actions.setTutorialStep('SELECT_SWORD_GUIDE');
        } else if (state.tutorialStep === 'OPEN_SHOP_TAB_GUIDE' && id === 'SHOP') {
            actions.setTutorialStep('OPEN_SHOP_SIGN_GUIDE'); 
        }
        setActiveTab(id);
    };

    return (
        <button 
            onClick={handleTabClick}
            key={id}
            data-tutorial-id={id === 'MARKET' ? 'MARKET_TAB' : id === 'FORGE' ? 'FORGE_TAB' : id === 'SHOP' ? 'SHOP_TAB' : undefined}
            className={`relative flex items-center gap-2 px-5 md:px-6 py-3 md:py-4 border-b-2 transition-all whitespace-nowrap snap-start shrink-0 ${
                isActive 
                ? 'border-amber-500 text-amber-500 bg-stone-800/60 z-[2100]' 
                : 'border-transparent text-stone-500 hover:text-stone-300'
            } ${!isUnlocked ? 'grayscale opacity-40 cursor-not-allowed' : 'hover:bg-stone-800/30'} ${isHighlighted ? 'opacity-100 grayscale-0 z-[2100] bg-amber-500/10 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : ''}`}
        >
            <Icon className={`w-4 h-4 md:w-5 md:h-5 z-10 ${isActive ? 'scale-110' : ''}`} />
            <span className={`font-bold tracking-wide text-[10px] md:text-sm uppercase z-10`}>{label}</span>
            
            {!isUnlocked && (
                <LockIcon className="w-3 h-3 text-stone-600 ml-0.5" />
            )}

            {isUnlocked && badgeCount && badgeCount > 0 ? (
                <div className="absolute top-1 right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-600 text-[8px] md:text-[10px] font-black text-white shadow-lg ring-2 ring-stone-900 animate-in zoom-in z-20">
                    {badgeCount}
                </div>
            ) : null}
        </button>
    );
  };

  const allTabs = [
    { id: 'FORGE' as const, icon: Anvil, label: 'Forge' },
    { id: 'MARKET' as const, icon: ShoppingBag, label: 'Market' },
    { id: 'INVENTORY' as const, icon: Package, label: 'Items' },
    { id: 'SHOP' as const, icon: Coins, label: 'Shop', badge: activeTab !== 'SHOP' ? totalShopVisitors : 0 },
    { id: 'TAVERN' as const, icon: Beer, label: 'Tavern' },
    { id: 'DUNGEON' as const, icon: MapIcon, label: 'Dungeon', badge: completedExpeditionsCount },
    { id: 'SIMULATION' as const, icon: Activity, label: 'Sim' },
  ];

  const handleConfirmSkip = () => {
      actions.completeTutorial();
      setShowSkipConfirm(false);
  };

  // --- 0. TUTORIAL/PROLOGUE CHECK ---
  if (state.activeTutorialScene) {
      return <TutorialScene />;
  }

  return (
    <div className="h-[100dvh] w-full bg-stone-950 text-stone-200 flex flex-col overflow-hidden font-sans selection:bg-amber-500/30 animate-in fade-in duration-500 px-safe">
      
      {state.tutorialStep && state.hasCompletedPrologue && (
          <TutorialOverlay 
            step={state.tutorialStep} 
            onSkip={() => setShowSkipConfirm(true)}
          />
      )}

      {/* Global Craft Prompt Dialogue */}
      {state.tutorialStep === 'CRAFT_PROMPT' && (
          <div className="fixed inset-0 z-[2500] flex flex-col justify-end items-center bg-black/40 backdrop-blur-sm pb-6 md:pb-12 px-4 pointer-events-none">
              <div className="w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto">
                  <DialogueBox 
                    speaker="Lockhart"
                    text="The heat is steady... I can feel the ancient rhythm returning to my arms. I know the blueprints for a Bronze Shortsword. I should craft one to test the new furnace."
                    options={[{ 
                        label: "Continue", 
                        action: () => actions.setTutorialStep('FORGE_TAB_GUIDE'),
                        variant: 'primary' 
                    }]}
                  />
              </div>
          </div>
      )}

      {/* Global Craft Result Dialogue */}
      {state.tutorialStep === 'CRAFT_RESULT_PROMPT' && (
          <div className="fixed inset-0 z-[2500] flex flex-col justify-end items-center bg-transparent backdrop-blur-none pb-6 md:pb-12 px-4 pointer-events-none">
              <div className="w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto">
                  <DialogueBox 
                    speaker="Lockhart"
                    text="Check out the summary. The quality and stats of the weapon are determined by my focus in the forge. A higher mastery of the blueprint also grants permanent bonuses. Let's finish this piece."
                    options={[{ 
                        label: "Continue", 
                        action: () => actions.setTutorialStep('FINALIZE_FORGE_GUIDE'),
                        variant: 'primary' 
                    }]}
                  />
              </div>
          </div>
      )}

      {/* Global Shop Intro Dialogue */}
      {state.tutorialStep === 'SHOP_INTRO_PROMPT' && (
          <div className="fixed inset-0 z-[2500] flex flex-col justify-end items-center bg-black/40 backdrop-blur-sm pb-6 md:pb-12 px-4 pointer-events-none">
              <div className="w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto">
                  <DialogueBox 
                    speaker="Lockhart"
                    text="With the furnace roaring and a fresh blade in hand, I should open the Shop. Adventurers often pass by looking for reliable steel. Let's head to the Shop tab and welcome our first customer."
                    options={[{ 
                        label: "Continue", 
                        action: () => actions.setTutorialStep('OPEN_SHOP_TAB_GUIDE'),
                        variant: 'primary' 
                    }]}
                  />
              </div>
          </div>
      )}

      {/* Global Tutorial Conclusion monologue */}
      {state.tutorialStep === 'TUTORIAL_END_MONOLOGUE' && (
          <div className="fixed inset-0 z-[2500] flex flex-col justify-end items-center bg-black/60 backdrop-blur-md pb-6 md:pb-12 px-4 pointer-events-none">
              <div className="w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto">
                  <DialogueBox 
                    speaker="Lockhart"
                    text="Finally... the first sale. It's just a simple bronze blade, but it marks the beginning of my resurgence. I will rebuild this forge, piece by piece, until the name Lockhart once again commands respect across the realm. Every strike of my hammer brings me closer to the day I face that dragon. ... I miss my people. I miss my home. But I will not falter. My business starts now."
                    options={[{ 
                        label: "The Forge is Open", 
                        action: () => {
                            actions.completeTutorial(); 
                        },
                        variant: 'primary' 
                    }]}
                  />
              </div>
          </div>
      )}

      {/* Top Section Wrapper */}
      <div className={`flex flex-col shrink-0 z-30 transition-all duration-500 ease-in-out ${isFullscreenOverlay ? '-translate-y-full h-0 opacity-0 pointer-events-none' : 'translate-y-0 h-auto opacity-100'}`}>
        <Header 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onSettingsClick={() => setIsSettingsOpen(true)}
        />
        
        {/* Tab Navigation Wrapper */}
        <div className="bg-stone-900 border-b border-stone-800 flex items-center relative z-10 overflow-hidden isolate h-11 md:h-14">
          
          <div className={`absolute left-0 top-0 bottom-0 z-30 w-12 flex items-center transition-all duration-300 transform-gpu ${showLeftArrow ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-0 invisible pointer-events-none'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/90 to-transparent" />
              <button onClick={() => scrollTabs('LEFT')} className="relative h-full w-full flex items-center pl-2 group/arrow"><ChevronLeft className="w-5 h-5 text-amber-500 group-hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /></button>
          </div>

          <div ref={scrollRef} onScroll={updateArrows} className="flex overflow-x-auto no-scrollbar flex-1 min-w-0 touch-pan-x scroll-smooth snap-x snap-mandatory overscroll-behavior-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>{allTabs.map(tab => renderTabButton(tab))}</div>

          <div className={`absolute right-0 top-0 bottom-0 z-30 w-12 flex items-center justify-end transition-all duration-300 transform-gpu ${showRightArrow ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-0 invisible pointer-events-none'}`}>
              <div className="absolute inset-0 bg-gradient-to-l from-stone-900 via-stone-900/90 to-transparent" />
              <button onClick={() => scrollTabs('RIGHT')} className="relative h-full w-full flex items-center justify-end pr-2 group/arrow"><ChevronRight className="w-5 h-5 text-amber-500 group-hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /></button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative bg-stone-925 flex flex-col min-h-0">
        <div className={`h-full w-full ${activeTab === 'FORGE' ? 'block' : 'hidden'}`}><ForgeTab onNavigate={setActiveTab} /></div>
        <div className={`h-full w-full ${activeTab === 'SHOP' ? 'block' : 'hidden'}`}><ShopTab onNavigate={setActiveTab} /></div>
        <div className={`h-full w-full ${activeTab === 'INVENTORY' ? 'block' : 'hidden'}`}><InventoryDisplay /></div>
        <div className={`h-full w-full ${activeTab === 'MARKET' ? 'block' : 'hidden'}`}><MarketTab onNavigate={setActiveTab} /></div>
        <div className={`h-full w-full ${activeTab === 'TAVERN' ? 'block' : 'hidden'}`}><TavernTab /></div>
        <div className={`h-full w-full ${activeTab === 'DUNGEON' ? 'block' : 'hidden'}`}><DungeonTab /></div>
        <div className={`h-full w-full ${activeTab === 'SIMULATION' ? 'block' : 'hidden'}`}><SimulationTab /></div>
      </main>

      {/* Toast Notification Container */}
      {state.toast?.visible && (
        <div onClick={actions.hideToast} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[3000] flex items-center gap-3 px-6 py-3 bg-stone-900/95 border border-amber-500/50 text-stone-200 rounded-xl shadow-2xl backdrop-blur-md cursor-pointer animate-in slide-in-from-bottom-4 fade-in duration-300 ring-2 ring-black/50 active:scale-95 w-max max-w-[80vw]">
            <Info className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-sm font-bold tracking-tight text-center leading-tight">{state.toast.message}</span>
        </div>
      )}

      <div className="h-[env(safe-area-inset-bottom)] bg-stone-900 shrink-0"></div>
      <EventModal />
      <SleepModal />
      <JournalModal />
      <DungeonResultModal />
      <CraftingResultModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onQuit={onQuit} onLoadRequest={onLoadFromSettings} />
      
      <ConfirmationModal 
        isOpen={showSkipConfirm}
        title="Skip Tutorial?"
        message="Skipping the tutorial will unlock all systems immediately and grant you full access to the Forge. This action cannot be undone."
        confirmLabel="Yes, Skip It"
        cancelLabel="Continue Guide"
        onConfirm={handleConfirmSkip}
        onCancel={() => setShowSkipConfirm(false)}
        isDanger={true}
      />
    </div>
  );
};

export default MainGameLayout;
