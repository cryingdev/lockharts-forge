
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import Header from './Header';
import { InventoryDisplay } from './InventoryDisplay';
import { Anvil, Package, ShoppingBag, Coins, Beer, Map as MapIcon, Activity, Info, ChevronLeft, ChevronRight, Pointer, Lock as LockIcon, FastForward, MessageSquare } from 'lucide-react';
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
import TierUnlockModal from './modals/TierUnlockModal';
import SettingsModal from './modals/SettingsModal';
import TutorialScene from './tabs/Forge/TutorialScene';
import DialogueBox from './DialogueBox';
import ConfirmationModal from './modals/ConfirmationModal';
import TutorialCompleteModal from './modals/TutorialCompleteModal';

interface MainGameLayoutProps {
    onQuit: () => void;
    onLoadFromSettings: (data: any, index: number) => void;
}

type TutorialDirection = 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
interface StepConfig {
    targetId: string;
    label: string;
    direction: TutorialDirection;
}

const TUTORIAL_STEPS_CONFIG: Record<string, StepConfig> = {
    MARKET_GUIDE: { targetId: 'MARKET_TAB', label: 'Visit the Market', direction: 'bottom' },
    FORGE_TAB_GUIDE: { targetId: 'FORGE_TAB', label: 'Open Forge', direction: 'bottom' },
    SELECT_SWORD_GUIDE: { targetId: 'SWORD_RECIPE', label: 'Select Sword', direction: 'bottom' },
    START_FORGING_GUIDE: { targetId: 'START_FORGING_BUTTON', label: 'Start Forging', direction: 'right' },
    FINALIZE_FORGE_GUIDE: { targetId: 'FINALIZE_BUTTON', label: 'Complete Forge', direction: 'bottom' },
    OPEN_SHOP_TAB_GUIDE: { targetId: 'SHOP_TAB', label: 'Open Shop', direction: 'bottom' },
    OPEN_SHOP_SIGN_GUIDE: { targetId: 'SHOP_SIGN', label: 'Open the Shop', direction: 'bottom' },
};

const TUTORIAL_CONTEXT_SCRIPTS: Record<string, { speaker: string, text: string }> = {
    MARKET_GUIDE: { speaker: "Lockhart", text: "A forge without a roar is just a cold pile of stone. There should be a replacement furnace at the Market... let's head there." },
    FORGE_TAB_GUIDE: { speaker: "Lockhart", text: "The furnace is set. The air smells of potential again. I should prepare to craft my first blade." },
    SELECT_SWORD_GUIDE: { speaker: "Lockhart", text: "A Bronze Shortsword. A simple pattern, but a reliable test for this new unit." },
    OPEN_SHOP_TAB_GUIDE: { speaker: "Lockhart", text: "A blade without a wielder is just cold metal. Let's see if any travelers seek Lockhart steel." },
    OPEN_SHOP_SIGN_GUIDE: { speaker: "Lockhart", text: "The forge is alive. The shop must follow. Flip the sign and let them come." },
};

const TutorialOverlay = ({ step }: { step: string }) => {
    const { state, actions } = useGame();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [animatedRadius, setAnimatedRadius] = useState(2000);
    const requestRef = useRef<number | null>(null);
    const animRef = useRef<number | null>(null);
    
    const config = TUTORIAL_STEPS_CONFIG[step];
    const script = TUTORIAL_CONTEXT_SCRIPTS[step];

    const updateRect = useCallback(() => {
        if (!config) return;
        const el = document.querySelector(`[data-tutorial-id="${config.targetId}"]`);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) setTargetRect(rect);
            else setTargetRect(null);
        } else {
            setTargetRect(null);
        }
        requestRef.current = requestAnimationFrame(updateRect);
    }, [config]);

    useEffect(() => {
        if (!targetRect) return; 
        const targetR = Math.max(targetRect.width, targetRect.height) / 1.3;
        setAnimatedRadius(2000);
        const startTime = performance.now();
        const duration = 1300;
        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const nextR = 2000 - (2000 - targetR) * easeOut;
            setAnimatedRadius(nextR);
            if (progress < 1) animRef.current = requestAnimationFrame(animate);
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

    let pointerStyles: React.CSSProperties = {};
    let iconRotation = '';
    let animationClass = '';
    let containerLayout = '';
    let labelMargin = '';

    const cardinalBuffer = 12;

    switch (config.direction) {
        case 'top':
            pointerStyles = { left: centerX, top: top - cardinalBuffer, transform: 'translate(-50%, -100%)' };
            iconRotation = 'rotate(180deg)';
            animationClass = 'animate-bounce-reverse';
            containerLayout = 'flex-col-reverse';
            labelMargin = 'mb-3';
            break;
        case 'bottom':
            pointerStyles = { left: centerX, top: top + height + cardinalBuffer, transform: 'translateX(-50%)' };
            iconRotation = '';
            animationClass = 'animate-bounce';
            containerLayout = 'flex-col';
            labelMargin = 'mt-3';
            break;
        case 'left':
            pointerStyles = { left: left - cardinalBuffer, top: centerY, transform: 'translate(-100%, -50%)' };
            iconRotation = 'rotate(90deg)';
            animationClass = 'animate-bounce-x-reverse';
            containerLayout = 'flex-row-reverse';
            labelMargin = 'mr-3';
            break;
        case 'right':
            pointerStyles = { left: left + width + cardinalBuffer, top: centerY, transform: 'translateY(-50%)' };
            iconRotation = 'rotate(-90deg)';
            animationClass = 'animate-bounce-x';
            containerLayout = 'flex-row';
            labelMargin = 'ml-3';
            break;
        case 'topleft':
            pointerStyles = { left, top, transform: 'translate(-50%, -50%)' };
            iconRotation = 'rotate(135deg)';
            animationClass = 'animate-bounce-tl';
            containerLayout = 'flex-col-reverse items-end';
            labelMargin = 'mb-2 mr-2';
            break;
        case 'topright':
            pointerStyles = { left: left + width, top, transform: 'translate(-50%, -50%)' };
            iconRotation = 'rotate(-135deg)';
            animationClass = 'animate-bounce-tr';
            containerLayout = 'flex-col-reverse items-start';
            labelMargin = 'mb-2 ml-2';
            break;
        case 'bottomleft':
            pointerStyles = { left, top: top + height, transform: 'translate(-50%, -50%)' };
            iconRotation = 'rotate(45deg)';
            animationClass = 'animate-bounce-bl';
            containerLayout = 'flex-col items-end';
            labelMargin = 'mt-2 mr-2';
            break;
        case 'bottomright':
            pointerStyles = { left: left + width, top: top + height, transform: 'translate(-50%, -50%)' };
            iconRotation = 'rotate(-45deg)';
            animationClass = 'animate-bounce-br';
            containerLayout = 'flex-col items-start';
            labelMargin = 'mt-2 ml-2';
            break;
        default:
            pointerStyles = { left: centerX, top: top + height + cardinalBuffer, transform: 'translateX(-50%)' };
            iconRotation = '';
            animationClass = 'animate-bounce';
            containerLayout = 'flex-col';
            labelMargin = 'mt-3';
            break;
    }

    return (
        <div className="fixed inset-0 z-[4000] pointer-events-none overflow-hidden">
            <style>{`
                @keyframes bounce-x { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(12px); } }
                @keyframes bounce-x-reverse { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-12px); } }
                @keyframes bounce-reverse { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
                @keyframes bounce-tl { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-8px, -8px); } }
                @keyframes bounce-tr { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(8px, -8px); } }
                @keyframes bounce-bl { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-8px, 8px); } }
                @keyframes bounce-br { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(8px, 8px); } }
                .animate-bounce-x { animation: bounce-x 1s infinite; }
                .animate-bounce-x-reverse { animation: bounce-x-reverse 1s infinite; }
                .animate-bounce-reverse { animation: bounce-reverse 1s infinite; }
                .animate-bounce-tl { animation: bounce-tl 1s infinite; }
                .animate-bounce-tr { animation: bounce-tr 1s infinite; }
                .animate-bounce-bl { animation: bounce-bl 1s infinite; }
                .animate-bounce-br { animation: bounce-br 1s infinite; }
            `}</style>

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="tutorial-mask-layout">
                        <rect width="100%" height="100%" fill="white" />
                        {targetRect && <circle cx={centerX} cy={centerY} r={animatedRadius} fill="black" />}
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill={`rgba(0,0,0,${Math.min(0.75, 1.5 - (animatedRadius / 1000))})`} mask="url(#tutorial-mask-layout)" />
            </svg>

            {targetRect && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full pointer-events-auto bg-transparent" style={{ height: top }} />
                    <div className="absolute left-0 w-full pointer-events-auto bg-transparent" style={{ top: top + height, bottom: 0 }} />
                    <div className="absolute top-0 left-0 pointer-events-auto bg-transparent" style={{ top, height, width: left }} />
                    <div className="absolute top-0 pointer-events-auto bg-transparent" style={{ top, height, left: left + width, right: 0 }} />
                </div>
            )}

            {targetRect && (
                <div key={config.targetId} className="absolute animate-in fade-in zoom-in-95 duration-300" style={pointerStyles}>
                    <div className={`flex items-center ${containerLayout} ${animationClass}`}>
                        <Pointer className={`w-8 h-8 md:w-12 md:h-12 text-amber-400 fill-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]`} style={{ transform: iconRotation }} />
                        <div className={`${labelMargin} px-4 py-1.5 bg-amber-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full shadow-2xl whitespace-nowrap border-2 border-amber-400`}>
                            {config.label}
                        </div>
                    </div>
                </div>
            )}

            {script && (
                <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl pointer-events-none z-[5000]">
                    <DialogueBox 
                        speaker={script.speaker} 
                        text={script.text} 
                        options={[]} 
                        className="w-full relative pointer-events-auto" 
                    />
                </div>
            )}
        </div>
    );
};

const MainGameLayout: React.FC<MainGameLayoutProps> = ({ onQuit, onLoadFromSettings }) => {
  const { state, actions } = useGame();
  const [activeTab, setActiveTab] = useState<'FORGE' | 'INVENTORY' | 'MARKET' | 'SHOP' | 'TAVERN' | 'DUNGEON' | 'SIMULATION'>('FORGE');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Smooth Sleep Transition State
  const [isSleeping, setIsSleeping] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [zzzText, setZzzText] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const prevDayRef = useRef(state.stats.day);
  
  useEffect(() => {
    if (state.stats.day > prevDayRef.current) {
        setIsSleeping(true);
        setIsFadingOut(false);
        setActiveTab('FORGE');

        // Hold the dark screen for 1 second
        const sleepTimer = setTimeout(() => {
            setIsFadingOut(true);
            const clearTimer = setTimeout(() => {
                setIsSleeping(false);
                setIsFadingOut(false);
                actions.closeRest();
            }, 1000); 
            return () => clearTimeout(clearTimer);
        }, 1000); 

        prevDayRef.current = state.stats.day;
        return () => clearTimeout(sleepTimer);
    }
    prevDayRef.current = state.stats.day;
  }, [state.stats.day, actions]);

  // ZZZ Animation Logic
  useEffect(() => {
    if (isSleeping && !isFadingOut) {
        const frames = ['z', 'zz', 'zzz', 'zz'];
        let idx = 0;
        const timer = setInterval(() => {
            setZzzText(frames[idx % frames.length]);
            idx++;
        }, 250);
        return () => clearInterval(timer);
    } else {
        setZzzText('');
    }
  }, [isSleeping, isFadingOut]);

  const updateArrows = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const canScroll = scrollWidth > clientWidth + 2;
      setShowLeftArrow(canScroll && scrollLeft > 1);
      setShowRightArrow(canScroll && Math.ceil(scrollLeft) < (scrollWidth - clientWidth - 2));
    }
  }, []);

  const scrollTabs = (direction: 'LEFT' | 'RIGHT') => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: direction === 'LEFT' ? -200 : 200, behavior: 'smooth' });
  };

  useLayoutEffect(() => {
    const timer = setTimeout(updateArrows, 100);
    return () => clearTimeout(timer);
  }, [updateArrows, activeTab]);

  useEffect(() => {
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows]);

  useShopService();
  useDungeonService();
  
  const completedExpeditionsCount = state.activeExpeditions.filter(exp => exp.status === 'COMPLETED').length;
  const totalShopVisitors = (state.activeCustomer ? 1 : 0) + state.shopQueue.length;
  const isFullscreenOverlay = state.isCrafting || (state.activeManualDungeon && state.showManualDungeonOverlay);

  const renderTabButton = (tab: { id: typeof activeTab, icon: any, label: string, badge?: number }) => {
    const { id, icon: Icon, label, badge: badgeCount } = tab;
    const isActive = activeTab === id;
    const isShopTutorialStep = ['SHOP_INTRO_PROMPT', 'OPEN_SHOP_TAB_GUIDE', 'OPEN_SHOP_SIGN_GUIDE', 'SELL_ITEM_GUIDE', 'PIP_PRAISE', 'DRAGON_TALK', 'TUTORIAL_END_MONOLOGUE'].includes(state.tutorialStep || '');
    const isUnlocked = state.unlockedTabs.includes(id) || (id === 'SHOP' && isShopTutorialStep);
    
    const isHighlighted = (state.tutorialStep === 'MARKET_GUIDE' && id === 'MARKET') || 
                         (state.tutorialStep === 'FORGE_TAB_GUIDE' && id === 'FORGE') ||
                         (state.tutorialStep === 'OPEN_SHOP_TAB_GUIDE' && id === 'SHOP');

    const handleTabClick = () => {
        if (['SELL_ITEM_GUIDE', 'PIP_PRAISE', 'DRAGON_TALK', 'TUTORIAL_END_MONOLOGUE'].includes(state.tutorialStep || '')) {
            actions.showToast("Continue the dialogue first.");
            return;
        }
        if (!isUnlocked) {
            let msg = "This facility needs restoration.";
            if (id === 'SHOP') msg = "Install a Furnace to open the Shop Counter.";
            if (id === 'INVENTORY') msg = "Acquire your first material to track inventory.";
            if (id === 'TAVERN') msg = "Rest until Day 2 to welcome travelers.";
            if (id === 'DUNGEON') msg = "Hire a mercenary at the Tavern to explore.";
            actions.showToast(msg);
            return;
        }
        if (state.tutorialStep === 'MARKET_GUIDE' && id === 'MARKET') actions.setTutorialStep('BROWSE_GOODS_GUIDE');
        else if (state.tutorialStep === 'FORGE_TAB_GUIDE' && id === 'FORGE') actions.setTutorialStep('SELECT_SWORD_GUIDE');
        else if (state.tutorialStep === 'OPEN_SHOP_TAB_GUIDE' && id === 'SHOP') actions.setTutorialStep('OPEN_SHOP_SIGN_GUIDE');
        setActiveTab(id);
    };

    return (
        <button onClick={handleTabClick} key={id} data-tutorial-id={id === 'MARKET' ? 'MARKET_TAB' : id === 'FORGE' ? 'FORGE_TAB' : id === 'SHOP' ? 'SHOP_TAB' : undefined}
            className={`relative flex items-center gap-2 px-5 md:px-6 py-3 md:py-4 border-b-2 transition-all whitespace-nowrap snap-start shrink-0 ${isActive ? 'border-amber-500 text-amber-500 bg-stone-800/60 z-[2100]' : 'border-transparent text-stone-500 hover:text-stone-300'} ${!isUnlocked ? 'grayscale opacity-40 cursor-not-allowed' : 'hover:bg-stone-800/30'} ${isHighlighted ? 'opacity-100 grayscale-0 z-[2100] bg-amber-500/10 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : ''}`}>
            <Icon className={`w-4 h-4 md:w-5 md:h-5 z-10 ${isActive ? 'scale-110' : ''}`} />
            <span className={`font-bold tracking-wide text-[10px] md:text-sm uppercase z-10`}>{label}</span>
            {!isUnlocked && <LockIcon className="w-3 h-3 text-stone-600 ml-0.5" />}
            {isUnlocked && badgeCount ? <div className="absolute top-1 right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-600 text-[8px] md:text-[10px] font-black text-white shadow-lg ring-2 ring-stone-900 animate-in zoom-in z-20">{badgeCount}</div> : null}
        </button>
    );
  };

  const allTabs = [
    { id: 'FORGE' as const, icon: Anvil, label: 'Forge' },
    { id: 'INVENTORY' as const, icon: Package, label: 'Storage' },
    { id: 'MARKET' as const, icon: ShoppingBag, label: 'Market' },
    { id: 'SHOP' as const, icon: Coins, label: 'Shop', badge: activeTab !== 'SHOP' ? totalShopVisitors : 0 },
    { id: 'TAVERN' as const, icon: Beer, label: 'Tavern' },
    { id: 'DUNGEON' as const, icon: MapIcon, label: 'Dungeon', badge: completedExpeditionsCount },
    { id: 'SIMULATION' as const, icon: Activity, label: 'Sim' },
  ];

  if (state.activeTutorialScene) return <TutorialScene />;

  const isAnyTutorialActive = !!state.tutorialStep && state.hasCompletedPrologue && !state.isCrafting;

  return (
    <div className="h-[100dvh] w-full bg-stone-950 text-stone-200 flex flex-col overflow-hidden font-sans selection:bg-amber-500/30 animate-in fade-in duration-500 px-safe">
      
      {/* FULL SCREEN SLEEP TRANSITION OVERLAY */}
      {isSleeping && (
          <div 
            className={`fixed inset-0 z-[10000] bg-black pointer-events-auto transition-opacity ${isFadingOut ? 'opacity-0 duration-[1000ms] ease-out' : 'opacity-100 duration-0'}`}
          >
              {/* ZZZ Animation Effect */}
              {!isFadingOut && (
                  <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                          <span className="text-amber-500 font-serif italic text-5xl md:text-7xl tracking-widest drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                              {zzzText}
                          </span>
                          <span className="text-stone-700 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">
                              Resting...
                          </span>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* GLOBAL SKIP BUTTON - Unified Style */}
      {isAnyTutorialActive && (
          <div className="fixed top-4 right-4 z-[6000] pointer-events-auto">
              <button 
                onClick={() => setShowSkipConfirm(true)} 
                className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/50 text-stone-300 hover:text-amber-400 rounded-full transition-all text-[10px] md:text-xs font-black uppercase tracking-widest shadow-2xl backdrop-blur-md group ring-2 ring-white/5 active:scale-95"
              >
                  <FastForward className="w-3 h-3 md:w-4 md:h-4 group-hover:animate-pulse" /> Skip Tutorial
              </button>
          </div>
      )}

      {isAnyTutorialActive && TUTORIAL_STEPS_CONFIG[state.tutorialStep!] && (
          <TutorialOverlay step={state.tutorialStep!} />
      )}

      {/* Narrative Popups - Back to Bottom */}
      {state.tutorialStep === 'CRAFT_PROMPT' && (
          <div className="fixed inset-0 z-[2500] flex flex-col justify-end items-center bg-black/40 backdrop-blur-sm pb-6 md:pb-12 px-4 pointer-events-none">
            <div className="w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto">
              <DialogueBox speaker="Lockhart" text="The heat is steady... I can feel the ancient rhythm returning. I'll craft a Bronze Shortsword to test the unit." options={[{ label: "Continue", action: () => actions.setTutorialStep('FORGE_TAB_GUIDE'), variant: 'primary' }]} />
            </div>
          </div>
      )}
      {state.tutorialStep === 'CRAFT_RESULT_PROMPT' && (
          <div className="fixed inset-0 z-[2500] flex flex-col justify-end items-center bg-transparent backdrop-blur-none pb-6 md:pb-12 px-4 pointer-events-none">
            <div className="w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto">
              <DialogueBox speaker="Lockhart" text="Higher mastery grants permanent bonuses. Let's finish this piece." options={[{ label: "Continue", action: () => actions.setTutorialStep('FINALIZE_FORGE_GUIDE'), variant: 'primary' }]} />
            </div>
          </div>
      )}
      {state.tutorialStep === 'SHOP_INTRO_PROMPT' && (
          <div className="fixed inset-0 z-[2500] flex flex-col justify-end items-center bg-black/40 backdrop-blur-sm pb-6 md:pb-12 px-4 pointer-events-none">
            <div className="w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto">
              <DialogueBox speaker="Lockhart" text="The forge is alive. The shop must follow. Let's head to the Shop tab." options={[{ label: "Continue", action: () => actions.setTutorialStep('OPEN_SHOP_TAB_GUIDE'), variant: 'primary' }]} />
            </div>
          </div>
      )}

      <div className={`flex flex-col shrink-0 z-30 transition-all duration-500 ease-in-out ${isFullscreenOverlay ? '-translate-y-full h-0 opacity-0 pointer-events-none' : '-translate-y-0 h-auto opacity-100'}`}>
        <Header activeTab={activeTab} onTabChange={setActiveTab} onSettingsClick={() => setIsSettingsOpen(true)} />
        <div className="bg-stone-900 border-b border-stone-800 flex items-center relative z-10 overflow-hidden isolate h-11 md:h-14">
          <div className={`absolute left-0 top-0 bottom-0 z-30 w-12 flex items-center transition-all duration-300 transform-gpu ${showLeftArrow ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-0 invisible pointer-none'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/90 to-transparent" /><button onClick={() => scrollTabs('LEFT')} className="relative h-full w-full flex items-center pl-2 group/arrow"><ChevronLeft className="w-5 h-5 text-amber-5 group-hover:scale-125 transition-transform drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" /></button>
          </div>
          <div ref={scrollRef} onScroll={updateArrows} className="flex overflow-x-auto no-scrollbar flex-1 min-w-0 touch-pan-x scroll-smooth snap-x snap-mandatory overscroll-behavior-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>{allTabs.map(tab => renderTabButton(tab))}</div>
          <div className={`absolute right-0 top-0 bottom-0 z-30 w-12 flex items-center justify-end transition-all duration-300 transform-gpu ${showRightArrow ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-0 invisible pointer-none'}`}>
              <div className="absolute inset-0 bg-gradient-to-l from-stone-900 via-stone-900/90 to-transparent" /><button onClick={() => scrollTabs('RIGHT')} className="relative h-full w-full flex items-center justify-end pr-2 group/arrow"><ChevronRight className="w-5 h-5 text-amber-5 group-hover:scale-125 transition-transform drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" /></button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative bg-stone-925 flex flex-col min-h-0">
        <div className={`h-full w-full ${activeTab === 'FORGE' ? 'block' : 'hidden'}`}><ForgeTab onNavigate={setActiveTab} /></div>
        <div className={`h-full w-full ${activeTab === 'SHOP' ? 'block' : 'hidden'}`}><ShopTab onNavigate={setActiveTab} /></div>
        <div className={`h-full w-full ${activeTab === 'INVENTORY' ? 'block' : 'hidden'}`}><InventoryDisplay /></div>
        <div className={`h-full w-full ${activeTab === 'MARKET' ? 'block' : 'hidden'}`}><MarketTab onNavigate={setActiveTab} /></div>
        <div className={`h-full w-full ${activeTab === 'TAVERN' ? 'block' : 'hidden'}`}><TavernTab activeTab={activeTab} /></div>
        <div className={`h-full w-full ${activeTab === 'DUNGEON' ? 'block' : 'hidden'}`}><DungeonTab /></div>
        <div className={`h-full w-full ${activeTab === 'SIMULATION' ? 'block' : 'hidden'}`}><SimulationTab /></div>
      </main>

      <div className="h-[env(safe-area-inset-bottom)] bg-stone-900 shrink-0"></div>
      <EventModal /><SleepModal /><JournalModal /><DungeonResultModal /><CraftingResultModal /><SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onQuit={onQuit} onLoadRequest={onLoadFromSettings} />
      <TierUnlockModal />
      <TutorialCompleteModal />
      <ConfirmationModal isOpen={showSkipConfirm} title="Skip Tutorial?" message="Skipping will unlock all systems immediately. Grant full access?" confirmLabel="Yes, Skip It" cancelLabel="Continue Guide" onConfirm={() => { actions.completeTutorial(); setShowSkipConfirm(false); }} onCancel={() => setShowSkipConfirm(false)} isDanger={true} />
    </div>
  );
};

export default MainGameLayout;
