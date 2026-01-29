
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import Header from './Header';
import { InventoryDisplay } from './InventoryDisplay';
import { Anvil, Package, ShoppingBag, Coins, Beer, Map as MapIcon, Activity, ChevronLeft, ChevronRight, Pointer, Lock as LockIcon, FastForward, AlertCircle, Library } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { getAssetUrl } from '../utils';
import { SfxButton } from './common/ui/SfxButton';

// Import Background Services
import { useShopService } from '../services/shop/shop-service';
import { useDungeonService } from '../services/dungeon/dungeon-service';

// Import Tab Components
import ForgeTab from './tabs/forge/ForgeTab';
import ShopTab from './tabs/shop/ShopTab';
import TavernTab from './tabs/tavern/TavernTab';
import MarketTab from './tabs/market/MarketTab';
import DungeonTab from './tabs/dungeon/DungeonTab';
import SimulationTab from './tabs/Simulation/SimulationTab';
import ResearchTab from './tabs/research/ResearchTab';

// Import Modals
import EventModal from './modals/EventModal';
import SleepModal from './modals/SleepModal';
import JournalModal from './modals/JournalModal';
import DungeonResultModal from './modals/DungeonResultModal';
import CraftingResultModal from './modals/CraftingResultModal';
import TierUnlockModal from './modals/TierUnlockModal';
import SettingsModal from './modals/SettingsModal';
import TutorialScene from './tutorial/TutorialScene';
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
    const { targetId } = TUTORIAL_STEPS_CONFIG[step] || {};
    const script = TUTORIAL_CONTEXT_SCRIPTS[step];
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [animatedRadius, setAnimatedRadius] = useState(2000);
    const requestRef = useRef<number | null>(null);
    
    const updateRect = useCallback(() => {
        if (!targetId) return;
        const el = document.querySelector(`[data-tutorial-id="${targetId}"]`);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) setTargetRect(rect);
            else setTargetRect(null);
        } else {
            setTargetRect(null);
        }
        requestRef.current = requestAnimationFrame(updateRect);
    }, [targetId]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updateRect);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [updateRect]);

    useEffect(() => {
        if (!targetRect) return; 
        const targetR = Math.max(targetRect.width, targetRect.height) / 1.3;
        setAnimatedRadius(2000);
        const startTime = performance.now();
        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / 1300, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setAnimatedRadius(2000 - (2000 - targetR) * easeOut);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [targetId, !!targetRect]);

    const config = TUTORIAL_STEPS_CONFIG[step];
    if (!config) return null;

    const { top = 0, left = 0, width = 0, height = 0 } = targetRect || {};
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    let pointerStyles: React.CSSProperties = {};
    let iconRotation = '';
    let animationClass = '';
    let containerLayout = '';
    let labelMargin = '';
    const cardinalBuffer = 12;

    switch (config.direction) {
        case 'top': pointerStyles = { left: centerX, top: top - cardinalBuffer, transform: 'translate(-50%, -100%)' }; iconRotation = 'rotate(180deg)'; animationClass = 'animate-bounce-reverse'; containerLayout = 'flex-col-reverse'; labelMargin = 'mb-3'; break;
        case 'bottom': pointerStyles = { left: centerX, top: top + height + cardinalBuffer, transform: 'translateX(-50%)' }; iconRotation = ''; animationClass = 'animate-bounce'; containerLayout = 'flex-col'; labelMargin = 'mt-3'; break;
        case 'left': pointerStyles = { left: left - cardinalBuffer, top: centerY, transform: 'translate(-100%, -50%)' }; iconRotation = 'rotate(90deg)'; animationClass = 'animate-bounce-x-reverse'; containerLayout = 'flex-row-reverse'; labelMargin = 'mr-3'; break;
        case 'right': pointerStyles = { left: left + width + cardinalBuffer, top: centerY, transform: 'translateY(-50%)' }; iconRotation = 'rotate(-90deg)'; animationClass = 'animate-bounce-x'; containerLayout = 'flex-row'; labelMargin = 'ml-3'; break;
        default: pointerStyles = { left: centerX, top: top + height + cardinalBuffer, transform: 'translateX(-50%)' }; iconRotation = ''; animationClass = 'animate-bounce'; containerLayout = 'flex-col'; labelMargin = 'mt-3'; break;
    }

    return (
        <div className="fixed inset-0 z-[4000] pointer-events-none overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs><mask id="tutorial-mask-layout"><rect width="100%" height="100%" fill="white" />{targetRect && <circle cx={centerX} cy={centerY} r={animatedRadius} fill="black" />}</mask></defs>
                <rect width="100%" height="100%" fill={`rgba(0,0,0,0.75)`} mask="url(#tutorial-mask-layout)" />
            </svg>

            {targetRect && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full pointer-events-auto" style={{ height: top }} />
                    <div className="absolute left-0 w-full pointer-events-auto" style={{ top: top + height, bottom: 0 }} />
                    <div className="absolute top-0 left-0 pointer-events-auto" style={{ top, height, width: left }} />
                    <div className="absolute top-0 pointer-events-auto" style={{ top, height, left: left + width, right: 0 }} />
                </div>
            )}

            {targetRect && (
                <div key={config.targetId} className="absolute animate-in fade-in zoom-in-95 duration-300" style={pointerStyles}>
                    <div className={`flex items-center ${containerLayout} ${animationClass}`}>
                        <Pointer className="w-8 h-8 md:w-12 md:h-12 text-amber-400 fill-amber-500/20" style={{ transform: iconRotation }} />
                        <div className={`${labelMargin} px-4 py-1.5 bg-amber-600 text-white text-[10px] md:text-xs font-black uppercase rounded-full shadow-2xl border-2 border-amber-400`}>{config.label}</div>
                    </div>
                </div>
            )}

            {script && (
                <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl pointer-events-none z-[5000]">
                    <DialogueBox speaker={script.speaker} text={script.text} options={[]} className="w-full relative pointer-events-auto" />
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
  const [isSleeping, setIsSleeping] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [zzzText, setZzzText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const prevDayRef = useRef(state.stats.day);

  useShopService();
  useDungeonService();
  
  useEffect(() => {
    if (state.stats.day > prevDayRef.current) {
        setIsSleeping(true); setIsFadingOut(false); setActiveTab('FORGE');
        const sleepTimer = setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => { setIsSleeping(false); setIsFadingOut(false); actions.closeRest(); }, 1000); 
        }, 1000); 
        prevDayRef.current = state.stats.day;
        return () => clearTimeout(sleepTimer);
    }
    prevDayRef.current = state.stats.day;
  }, [state.stats.day, actions]);

  const updateArrows = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const canScroll = scrollWidth > clientWidth + 2;
      setShowLeftArrow(canScroll && scrollLeft > 10);
      setShowRightArrow(canScroll && Math.ceil(scrollLeft) < (scrollWidth - clientWidth - 10));
    }
  }, []);

  useLayoutEffect(() => { setTimeout(updateArrows, 150); }, [updateArrows, activeTab, state.unlockedTabs]);

  const completedExpeditionsCount = state.activeExpeditions.filter(exp => exp.status === 'COMPLETED').length;
  const totalShopVisitors = (state.activeCustomer ? 1 : 0) + state.shopQueue.length;
  const isFullscreenOverlay = state.isCrafting || (state.activeManualDungeon && state.showManualDungeonOverlay) || state.isResearchOpen;
  const unallocatedPointsCount = useMemo(() => state.knownMercenaries.filter(m => ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(m.status) && (m.bonusStatPoints || 0) > 0).length, [state.knownMercenaries]);

  const allTabs = [
    { id: 'FORGE' as const, icon: Anvil, label: 'Forge' },
    { id: 'INVENTORY' as const, icon: Package, label: 'Storage' },
    { id: 'MARKET' as const, icon: ShoppingBag, label: 'Market' },
    { id: 'SHOP' as const, icon: Coins, label: 'Shop', badge: activeTab !== 'SHOP' ? totalShopVisitors : 0 },
    { id: 'TAVERN' as const, icon: Beer, label: 'Tavern', badge: unallocatedPointsCount },
    { id: 'DUNGEON' as const, icon: MapIcon, label: 'Dungeon', badge: completedExpeditionsCount },
    { id: 'SIMULATION' as const, icon: Activity, label: 'Sim' },
  ];

  const isAnyTutorialActive = !!state.tutorialStep && state.hasCompletedPrologue && !state.isCrafting;

  const dialogueContent = useMemo(() => {
    switch (state.tutorialStep) {
        case 'CRAFT_START_DIALOG': return { speaker: "Lockhart", text: "The heat is steady... I'll craft a Bronze Shortsword to test the unit.", nextStep: 'FORGE_TAB_GUIDE' as const };
        case 'CRAFT_RESULT_DIALOG': return { speaker: "Lockhart", text: "Higher mastery grants permanent bonuses. Let's finish this piece.", nextStep: 'FINALIZE_FORGE_GUIDE' as const };
        case 'SHOP_INTRO_DIALOG': return { speaker: "Lockhart", text: "The forge is alive. The shop must follow. Let's head to the Shop tab.", nextStep: 'OPEN_SHOP_TAB_GUIDE' as const };
        default: return null;
    }
  }, [state.tutorialStep]);

  return (
    <div className="h-[100dvh] w-full bg-stone-950 text-stone-200 flex flex-col overflow-hidden px-safe selection:bg-amber-500/30">
      {state.activeTutorialScene && !['MARKET', 'SMITHING'].includes(state.activeTutorialScene) && (
        <div className="fixed inset-0 z-[5000]"><TutorialScene /></div>
      )}

      {isSleeping && <div className={`fixed inset-0 z-[10000] bg-black transition-opacity ${isFadingOut ? 'opacity-0 duration-[1000ms]' : 'opacity-100'}`}>{!isFadingOut && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"><span className="text-amber-500 font-serif italic text-5xl md:text-7xl">{zzzText}</span><span className="text-stone-700 font-black uppercase text-[10px]">Resting...</span></div>}</div>}
      
      {isAnyTutorialActive && (
        <div className="fixed top-4 right-4 z-[6000]">
            <SfxButton 
                sfx="switch"
                onClick={() => setShowSkipConfirm(true)} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-300 rounded-full text-[10px] uppercase font-black shadow-2xl backdrop-blur-md active:scale-95 hover:bg-stone-800"
            >
                <FastForward className="w-3 h-3" /> Skip Tutorial
            </SfxButton>
        </div>
      )}
      
      {isAnyTutorialActive && state.tutorialStep && TUTORIAL_STEPS_CONFIG[state.tutorialStep] && <TutorialOverlay step={state.tutorialStep} />}
      
      {dialogueContent && (
        <div className="fixed inset-0 z-[2500] flex flex-col justify-end items-center pb-6 md:pb-12 px-4 pointer-events-none">
            <div className="w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto">
                <DialogueBox speaker={dialogueContent.speaker} text={dialogueContent.text} options={[{ label: "Continue", action: () => actions.setTutorialStep(dialogueContent.nextStep), variant: 'primary' }]} />
            </div>
        </div>
      )}

      <div className={`flex flex-col shrink-0 z-30 transition-all duration-500 ${isFullscreenOverlay ? '-translate-y-full h-0 opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Header activeTab={activeTab} onTabChange={setActiveTab} onSettingsClick={() => setIsSettingsOpen(true)} />
        
        <div className="bg-stone-900 border-b border-stone-800 flex items-center relative z-10 overflow-hidden h-11 md:h-14">
          {showLeftArrow && (
            <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pointer-events-none">
                <div className="h-full w-8 bg-gradient-to-r from-stone-900 to-transparent" />
                <SfxButton sfx="switch" onClick={() => scrollRef.current?.scrollBy({ left: -150, behavior: 'smooth' })} className="absolute left-1 p-1 bg-stone-800/80 rounded-full text-amber-500 shadow-lg pointer-events-auto animate-pulse"><ChevronLeft className="w-4 h-4" /></SfxButton>
            </div>
          )}

          <div ref={scrollRef} onScroll={updateArrows} className="flex overflow-x-auto no-scrollbar flex-1 touch-pan-x snap-x scroll-smooth">
            {allTabs.map(tab => (
              <SfxButton 
                sfx="switch"
                key={tab.id} 
                onClick={() => { 
                  if (!state.unlockedTabs.includes(tab.id) && !(tab.id === 'SHOP' && state.tutorialStep) && tab.id !== 'TAVERN') return actions.showToast("Facility locked."); 
                  if (state.tutorialStep === 'MARKET_GUIDE' && tab.id === 'MARKET') { actions.setTutorialStep('BROWSE_GOODS_GUIDE'); actions.setTutorialScene('MARKET'); } 
                  else if (state.tutorialStep === 'FORGE_TAB_GUIDE' && tab.id === 'FORGE') actions.setTutorialStep('SELECT_SWORD_GUIDE'); 
                  else if (state.tutorialStep === 'OPEN_SHOP_TAB_GUIDE' && tab.id === 'SHOP') actions.setTutorialStep('OPEN_SHOP_SIGN_GUIDE'); 
                  setActiveTab(tab.id); 
                }} 
                data-tutorial-id={tab.id === 'MARKET' ? 'MARKET_TAB' : tab.id === 'FORGE' ? 'FORGE_TAB' : tab.id === 'SHOP' ? 'SHOP_TAB' : undefined} 
                className={`relative flex items-center gap-2 px-5 md:px-6 py-3 md:py-4 border-b-2 transition-all shrink-0 ${activeTab === tab.id ? 'border-amber-500 text-amber-500 bg-stone-800/60 z-[2100]' : 'border-transparent text-stone-500'} ${!state.unlockedTabs.includes(tab.id) && !(tab.id === 'SHOP' && state.tutorialStep) && tab.id !== 'TAVERN' ? 'grayscale opacity-40' : ''}`}
              >
                <tab.icon className="w-4 h-4 md:w-5 md:h-5" /><span className="font-bold text-[10px] md:text-sm uppercase">{tab.label}</span>{tab.badge ? <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white bg-red-600">{tab.badge}</div> : null}
              </SfxButton>
            ))}
          </div>

          {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pointer-events-none">
                <div className="h-full w-8 bg-gradient-to-l from-stone-900 to-transparent" />
                <SfxButton sfx="switch" onClick={() => scrollRef.current?.scrollBy({ left: 150, behavior: 'smooth' })} className="absolute right-1 p-1 bg-stone-800/80 rounded-full text-amber-500 shadow-lg pointer-events-auto animate-pulse"><ChevronRight className="w-4 h-4" /></SfxButton>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative bg-stone-925 flex flex-col min-h-0">
        <div className={`h-full w-full ${activeTab === 'FORGE' ? 'block' : 'hidden'}`}><ForgeTab onNavigate={setActiveTab} /></div>
        <div className={`h-full w-full ${activeTab === 'DUNGEON' ? 'block' : 'hidden'}`}><DungeonTab /></div>
        {activeTab === 'SHOP' && <ShopTab onNavigate={setActiveTab} />}
        {activeTab === 'INVENTORY' && <InventoryDisplay />}
        {activeTab === 'MARKET' && <MarketTab onNavigate={setActiveTab} />}
        {activeTab === 'TAVERN' && <TavernTab />}
        {activeTab === 'SIMULATION' && <SimulationTab />}
      </main>

      {state.isResearchOpen && <div className="fixed inset-0 z-[100] bg-stone-950 animate-in fade-in duration-500"><ResearchTab onClose={() => actions.setResearchOpen(false)} /></div>}
      
      {state.toast?.visible && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-bottom-4 pointer-events-none"><div onClick={actions.hideToast} className="bg-stone-900 border-2 border-amber-600/50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto cursor-pointer"><span className="text-stone-100 font-black text-xs md:text-sm uppercase tracking-widest">{state.toast.message}</span></div></div>}
      <EventModal /><SleepModal /><JournalModal /><DungeonResultModal /><CraftingResultModal /><SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onQuit={onQuit} onLoadRequest={onLoadFromSettings} /><TierUnlockModal /><TutorialCompleteModal /><ConfirmationModal isOpen={showSkipConfirm} title="Skip?" message="Unlock all systems immediately?" onConfirm={() => { actions.completeTutorial(); setShowSkipConfirm(false); }} onCancel={() => setShowSkipConfirm(false)} isDanger />
    </div>
  );
};

export default MainGameLayout;
