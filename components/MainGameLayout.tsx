
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

// 튜토리얼 단계별 설정을 모델화
type TutorialDirection = 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
interface StepConfig {
    targetId: string;
    label: string;
    direction: TutorialDirection;
}

const TUTORIAL_STEPS_CONFIG: Record<string, StepConfig> = {
    MARKET_GUIDE: { targetId: 'MARKET_TAB', label: 'Visit the Market', direction: 'bottom' },
    FURNACE_GUIDE: { targetId: 'FURNACE_ITEM', label: 'Select the Furnace', direction: 'bottomright' },
    OPEN_SHOPPING_CART: { targetId: 'CART_TOGGLE', label: 'Open the Cart', direction: 'topleft' },
    CLOSE_SHOPPING_CART: { targetId: 'CART_TOGGLE', label: 'Close the Cart', direction: 'topright' },
    PAY_NOW: { targetId: 'PAY_NOW_BUTTON', label: 'Finalize Purchase', direction: 'bottomleft' },
    FORGE_TAB_GUIDE: { targetId: 'FORGE_TAB', label: 'Open Forge', direction: 'bottom' },
    SELECT_SWORD_GUIDE: { targetId: 'SWORD_RECIPE', label: 'Select Sword', direction: 'bottom' },
    START_FORGING_GUIDE: { targetId: 'START_FORGING_BUTTON', label: 'Start Forging', direction: 'bottom' },
    FINALIZE_FORGE_GUIDE: { targetId: 'FINALIZE_BUTTON', label: 'Complete Forge', direction: 'bottom' },
    OPEN_SHOP_TAB_GUIDE: { targetId: 'SHOP_TAB', label: 'Open Shop', direction: 'bottom' },
    OPEN_SHOP_SIGN_GUIDE: { targetId: 'SHOP_SIGN', label: 'Open the Shop', direction: 'bottom' },
};

const TUTORIAL_CONTEXT_SCRIPTS: Record<string, string> = {
    MARKET_GUIDE: "A forge without a roar is just a cold pile of stone. There should be a replacement furnace at the Market... let's head there.",
    FURNACE_GUIDE: "There it is. Not quite the grand hearth of my ancestors, but it will bring fire back to Lockhart's Forge.",
    OPEN_SHOPPING_CART: "I should check my cart before I leave. Accuracy in the ledger is as important as the strike of the hammer.",
    CLOSE_SHOPPING_CART: "The list is complete. Now, let's settle the account and bring the heat home.",
    PAY_NOW: "The gold is yours, the future is mine. Now to return and relight the embers.",
    FORGE_TAB_GUIDE: "The furnace is set. The air smells of potential again. I should prepare to craft my first blade.",
    SELECT_SWORD_GUIDE: "A Bronze Shortsword. A simple pattern, but a reliable test for this new unit.",
    // START_FORGING_GUIDE is intentionally empty to avoid covering the button
    // FINALIZE_FORGE_GUIDE removed to avoid overlapping the 'Finalize Forge' button
    OPEN_SHOP_TAB_GUIDE: "A blade without a wielder is just cold metal. Let's see if any travelers seek Lockhart steel.",
    OPEN_SHOP_SIGN_GUIDE: "The forge is alive. The shop must follow. Flip the sign and let them come.",
};

const TutorialOverlay = ({ step, onSkip }: { step: string, onSkip: () => void }) => {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [animatedRadius, setAnimatedRadius] = useState(2000);
    const requestRef = useRef<number>(null);
    const animRef = useRef<number>(null);
    
    // 모델에서 현재 단계 설정 가져오기
    const config = TUTORIAL_STEPS_CONFIG[step];
    const monologue = TUTORIAL_CONTEXT_SCRIPTS[step];

    const updateRect = useCallback(() => {
        if (!config) return;
        
        const el = document.querySelector(`[data-tutorial-id="${config.targetId}"]`);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setTargetRect(rect);
            }
        } else {
            setTargetRect(null);
        }
        requestRef.current = requestAnimationFrame(updateRect);
    }, [config]);

    // 반지름 축소 애니메이션 (아이리스 효과)
    useEffect(() => {
        if (!targetRect) return;
        const targetR = Math.max(targetRect.width, targetRect.height) / 1.3;
        
        // 단계가 바뀔 때(혹은 타겟이 처음 잡힐 때) 반지름 리셋
        setAnimatedRadius(2000);

        const startTime = performance.now();
        const duration = 1300; // 1.3초로 부드럽게 조정

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            const nextR = 2000 - (2000 - targetR) * easeOut;
            setAnimatedRadius(nextR);

            if (progress < 1) {
                animRef.current = requestAnimationFrame(animate);
            }
        };

        animRef.current = requestAnimationFrame(animate);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [config?.targetId, !!targetRect]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updateRect);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [updateRect]);

    if (!config) return null;

    const { top, left, width, height } = targetRect || { top: 0, left: 0, width: 0, height: 0 };
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // 방향에 따른 스타일 및 회전 값 결정
    let pointerStyles = {};
    let iconRotation = '';
    let animationClass = '';
    let containerLayout = '';
    let labelMargin = '';

    switch (config.direction) {
        case 'top':
            pointerStyles = { left: centerX, top: top - 15, transform: 'translate(-50%, -100%)' };
            iconRotation = 'rotate(180deg)';
            animationClass = 'animate-bounce-reverse';
            containerLayout = 'flex-col-reverse';
            labelMargin = 'mb-3';
            break;
        case 'bottom':
            pointerStyles = { left: centerX, top: top + height + 15, transform: 'translateX(-50%)' };
            iconRotation = '';
            animationClass = 'animate-bounce';
            containerLayout = 'flex-col';
            labelMargin = 'mt-3';
            break;
        case 'left':
            pointerStyles = { left: left - 15, top: centerY, transform: 'translate(-100%, -50%)' };
            iconRotation = 'rotate(90deg)';
            animationClass = 'animate-bounce-x-reverse';
            containerLayout = 'flex-row-reverse';
            labelMargin = 'mr-3';
            break;
        case 'right':
            pointerStyles = { left: left + width + 15, top: centerY, transform: 'translateY(-50%)' };
            iconRotation = 'rotate(-90deg)';
            animationClass = 'animate-bounce-x';
            containerLayout = 'flex-row';
            labelMargin = 'ml-3';
            break;
        case 'topleft':
            pointerStyles = { left: left - 5, top: top - 5, transform: 'translate(-100%, -100%)' };
            iconRotation = 'rotate(135deg)';
            animationClass = 'animate-bounce-tl';
            containerLayout = 'flex-col-reverse items-end';
            labelMargin = 'mb-2 mr-2';
            break;
        case 'topright':
            pointerStyles = { left: left + 5, top: top - 5, transform: 'translate(0, -100%)' };
            iconRotation = 'rotate(-135deg)';
            animationClass = 'animate-bounce-tr';
            containerLayout = 'flex-col-reverse items-start';
            labelMargin = 'mb-2 ml-2';
            break;
        case 'bottomleft':
            pointerStyles = { left: left - width - 5, top: top + height + 5, transform: 'translate(0, 0)' };
            iconRotation = 'rotate(45deg)';
            animationClass = 'animate-bounce-bl';
            containerLayout = 'flex-col items-end';
            labelMargin = 'mt-2 mr-2';
            break;
        case 'bottomright':
            pointerStyles = { left: left + 5, top: top + height + 5, transform: 'translate(0, 0)' };
            iconRotation = 'rotate(-45deg)';
            animationClass = 'animate-bounce-br';
            containerLayout = 'flex-col items-start';
            labelMargin = 'mt-2 ml-2';
            break;
        default:
            pointerStyles = { left: centerX, top: top + height + 15, transform: 'translateX(-50%)' };
            iconRotation = '';
            animationClass = 'animate-bounce';
            containerLayout = 'flex-col';
            labelMargin = 'mt-3';
            break;
    }

    return (
        <div className="fixed inset-0 z-[2000] pointer-events-none overflow-hidden">
            <style>{`
                @keyframes bounce-x {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(12px); }
                }
                @keyframes bounce-x-reverse {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(-12px); }
                }
                @keyframes bounce-reverse {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes bounce-tl {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(8px, 8px); }
                }
                @keyframes bounce-tr {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-8px, -8px); }
                }
                @keyframes bounce-bl {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(8px, -8px); }
                }
                @keyframes bounce-br {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-8px, -8px); }
                }
                .animate-bounce-x { animation: bounce-x 1s infinite; }
                .animate-bounce-x-reverse { animation: bounce-x-reverse 1s infinite; }
                .animate-bounce-reverse { animation: bounce-reverse 1s infinite; }
                .animate-bounce-tl { animation: bounce-tl 1s infinite; }
                .animate-bounce-tr { animation: bounce-tr 1s infinite; }
                .animate-bounce-bl { animation: bounce-bl 1s infinite; }
                .animate-bounce-br { animation: bounce-br 1s infinite; }
            `}</style>

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
                                <circle cx={centerX} cy={centerY} r={animatedRadius} fill="black" />
                            </mask>
                        </defs>
                        <rect 
                            width="100%" 
                            height="100%" 
                            fill={`rgba(0,0,0,${Math.min(0.75, 1.5 - (animatedRadius / 1000))})`} 
                            mask="url(#tutorial-mask)" 
                        />
                    </svg>

                    <div 
                        key={config.targetId}
                        className="absolute animate-in fade-in zoom-in-95 duration-300" 
                        style={pointerStyles}
                    >
                        <div className={`flex items-center ${containerLayout} ${animationClass}`}>
                            <Pointer className={`w-8 h-8 md:w-12 md:h-12 text-amber-400 fill-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]`} style={{ transform: iconRotation.includes('rotate') ? iconRotation : undefined }} />
                            <div className={`${labelMargin} px-4 py-1.5 bg-amber-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full shadow-2xl whitespace-nowrap border-2 border-amber-400`}>
                                {config.label}
                            </div>
                        </div>
                    </div>

                    {/* Monologue Box inside Tutorial Overlay - No options for immediate action */}
                    {monologue && (
                        <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl pointer-events-none">
                            <DialogueBox 
                                speaker="Lockhart"
                                text={monologue}
                                options={[]}
                                className="w-full relative pointer-events-none"
                            />
                        </div>
                    )}

                    <div className="absolute border-2 border-amber-400/50 rounded-full animate-ping pointer-events-none" style={{ left: centerX - (Math.max(width, height) / 1.3), top: centerY - (Math.max(width, height) / 1.3), width: (Math.max(width, height) / 1.3) * 2, height: (Math.max(width, height) / 1.3) * 2 }} />
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
    const isShopTutorialStep = (state.tutorialStep === 'SHOP_INTRO_PROMPT' || state.tutorialStep === 'OPEN_SHOP_TAB_GUIDE' || state.tutorialStep === 'OPEN_SHOP_SIGN_GUIDE' || state.tutorialStep === 'SELL_ITEM_GUIDE' || state.tutorialStep === 'PIP_PRAISE' || state.tutorialStep === 'DRAGON_TALK' || state.tutorialStep === 'TUTORIAL_END_MONOLOGUE');
    const isUnlocked = state.unlockedTabs.includes(id) || (id === 'SHOP' && isShopTutorialStep);
    
    const isHighlighted = (state.tutorialStep === 'MARKET_GUIDE' && id === 'MARKET') || 
                         (state.tutorialStep === 'FORGE_TAB_GUIDE' && id === 'FORGE') ||
                         (state.tutorialStep === 'OPEN_SHOP_TAB_GUIDE' && id === 'SHOP');

    const handleTabClick = () => {
        // Block tab switching during narrative sequence
        const isMidDialogue = state.tutorialStep === 'SELL_ITEM_GUIDE' || state.tutorialStep === 'PIP_PRAISE' || state.tutorialStep === 'DRAGON_TALK' || state.tutorialStep === 'TUTORIAL_END_MONOLOGUE';
        if (isMidDialogue) {
            actions.showToast("Continue the dialogue first.");
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
      
      {state.tutorialStep && state.hasCompletedPrologue && !state.isCrafting && state.tutorialStep !== 'TUTORIAL_END_MONOLOGUE' && state.tutorialStep !== 'PIP_PRAISE' && state.tutorialStep !== 'DRAGON_TALK' && (
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
                    text="Check out the summary. The quality and stats of the weapon are determined by my focus in the forge. a higher mastery of the blueprint also grants permanent bonuses. Let's finish this piece."
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
              <button onClick={() => scrollTabs('LEFT')} className="relative h-full w-full flex items-center pl-2 group/arrow"><ChevronLeft className="w-5 h-5 text-amber-50 group-hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /></button>
          </div>

          <div ref={scrollRef} onScroll={updateArrows} className="flex overflow-x-auto no-scrollbar flex-1 min-w-0 touch-pan-x scroll-smooth snap-x snap-mandatory overscroll-behavior-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>{allTabs.map(tab => renderTabButton(tab))}</div>

          <div className={`absolute right-0 top-0 bottom-0 z-30 w-12 flex items-center justify-end transition-all duration-300 transform-gpu ${showRightArrow ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-0 invisible pointer-events-none'}`}>
              <div className="absolute inset-0 bg-gradient-to-l from-stone-900 via-stone-900/90 to-transparent" />
              <button onClick={() => scrollTabs('RIGHT')} className="relative h-full w-full flex items-center justify-end pr-2 group/arrow"><ChevronRight className="w-5 h-5 text-amber-50 group-hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /></button>
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
