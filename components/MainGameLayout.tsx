import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { InventoryDisplay } from './InventoryDisplay';
import { Pointer, FastForward } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { SfxButton } from './common/ui/SfxButton';

// Import Background Services
import { useShopService } from '../services/shop/shop-service';
import { useDungeonService } from '../services/dungeon/dungeon-service';

// Import Tab Components
import MainScene from './tabs/main/MainScene';
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
    MARKET_GUIDE: { targetId: 'MARKET_POI', label: 'Visit Market District', direction: 'right' },
    OPEN_RECIPE_GUIDE: { targetId: 'RECIPE_TOGGLE', label: 'Open Recipes', direction: 'left' },
    SELECT_SWORD_GUIDE: { targetId: 'SWORD_RECIPE', label: 'Select Sword', direction: 'bottom' },
    START_FORGING_GUIDE: { targetId: 'START_FORGING_BUTTON', label: 'Start Forging', direction: 'right' },
    FINALIZE_FORGE_GUIDE: { targetId: 'FINALIZE_BUTTON', label: 'Complete Forge', direction: 'bottom' },
    OPEN_SHOP_TAB_GUIDE: { targetId: 'NAV_TO_SHOP', label: 'Open the Shop', direction: 'right' },
    OPEN_SHOP_SIGN_GUIDE: { targetId: 'SHOP_SIGN', label: 'Open the Shop', direction: 'bottom' },
};

const TUTORIAL_CONTEXT_SCRIPTS: Record<string, { speaker: string, text: string }> = {
    MARKET_GUIDE: { speaker: "Lockhart", text: "A forge without a roar is just a cold pile of stone. There should be a replacement furnace at the Market District... let's head to Garrick's store." },
    OPEN_RECIPE_GUIDE: { speaker: "Lockhart", text: "I've memorized the family patterns. Let's see which ones I can still recall with these materials." },
    SELECT_SWORD_GUIDE: { speaker: "Lockhart", text: "A Bronze Shortsword. A simple pattern, but a reliable test for this new unit." },
    OPEN_SHOP_TAB_GUIDE: { speaker: "Lockhart", text: "A blade without a wielder is just cold metal. Let's head to the front desk and see if any travelers seek Lockhart steel." },
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
        case 'top': 
            pointerStyles = { left: centerX, top: top - cardinalBuffer, transform: 'translate(-50%, -100%)' }; 
            iconRotation = 'rotate(180deg)'; 
            animationClass = 'animate-bounce'; 
            containerLayout = 'flex-col-reverse'; 
            labelMargin = 'mb-3'; 
            break;
        case 'bottom': 
            pointerStyles = { left: centerX, top: top + height + cardinalBuffer, transform: 'translateX(-50%)' }; 
            iconRotation = ''; 
            animationClass = 'animate-bounce-reverse'; 
            containerLayout = 'flex-col'; 
            labelMargin = 'mt-3'; 
            break;
        case 'left': 
            pointerStyles = { left: left - cardinalBuffer, top: centerY, transform: 'translate(-100%, -50%)' }; 
            iconRotation = 'rotate(90deg)'; 
            animationClass = 'animate-bounce-x'; 
            containerLayout = 'flex-row-reverse'; 
            labelMargin = 'mr-3'; 
            break;
        case 'right': 
            pointerStyles = { left: left + width + cardinalBuffer, top: centerY, transform: 'translateY(-50%)' }; 
            iconRotation = 'rotate(-90deg)'; 
            animationClass = 'animate-bounce-x-reverse'; 
            containerLayout = 'flex-row'; 
            labelMargin = 'ml-3'; 
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
                .animate-bounce-x { animation: bounce-x 1s infinite ease-in-out; }
                .animate-bounce-x-reverse { animation: bounce-x-reverse 1s infinite ease-in-out; }
                .animate-bounce-reverse { animation: bounce-reverse 1s infinite ease-in-out; }
            `}</style>
            
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
                        <Pointer className="w-8 h-8 md:w-12 md:h-12 text-amber-400 fill-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" style={{ transform: iconRotation }} />
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
  const [activeTab, setActiveTab] = useState<'MAIN' | 'FORGE' | 'MARKET' | 'SHOP' | 'TAVERN' | 'DUNGEON' | 'SIMULATION'>('MAIN');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [zzzText, setZzzText] = useState('');
  const prevDayRef = useRef(state.stats.day);

  // 대장간 구역의 마지막 방문 하위 탭 기억 (기본값: SHOP)
  const [lastForgeTab, setLastForgeTab] = useState<'SHOP' | 'FORGE'>('SHOP');

  useShopService();
  useDungeonService();
  
  // 탭 변경 시 대장간 구역 탭 기록 업데이트
  useEffect(() => {
    if (activeTab === 'SHOP' || activeTab === 'FORGE') {
        setLastForgeTab(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (state.stats.day > prevDayRef.current) {
        setIsSleeping(true); setIsFadingOut(false);
        const sleepTimer = setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => { setIsSleeping(false); setIsFadingOut(false); actions.closeRest(); }, 1000); 
        }, 1000); 
        prevDayRef.current = state.stats.day;
        return () => clearTimeout(sleepTimer);
    }
    prevDayRef.current = state.stats.day;
  }, [state.stats.day, actions]);

  const isAnyTutorialActive = !!state.tutorialStep && state.hasCompletedPrologue && !state.isCrafting;

  const dialogueContent = useMemo(() => {
    switch (state.tutorialStep) {
        case 'CRAFT_START_DIALOG': 
            return { 
                speaker: "Lockhart", 
                text: "The heat is steady... I'll craft a Bronze Shortsword to test the unit.", 
                action: () => {
                    setActiveTab('FORGE');
                    actions.setTutorialStep('OPEN_RECIPE_GUIDE');
                }
            };
        case 'CRAFT_RESULT_DIALOG': return { speaker: "Lockhart", text: "Higher mastery grants permanent bonuses. Let's finish this piece.", nextStep: 'FINALIZE_FORGE_GUIDE' as const };
        case 'SHOP_INTRO_DIALOG': return { speaker: "Lockhart", text: "The forge is alive. The shop must follow. Let's head to the Shop counter.", nextStep: 'OPEN_SHOP_TAB_GUIDE' as const };
        default: return null;
    }
  }, [state.tutorialStep, actions]);

  // MainScene 등의 자식 컴포넌트에서 건물 클릭 시 호출할 지능형 내비게이션 핸들러
  const handleSceneNavigation = useCallback((target: string) => {
      if (target === 'FORGE_BUILDING') {
          // 튜토리얼 단계에 따라 강제로 탭 결정
          if (state.tutorialStep === 'OPEN_SHOP_TAB_GUIDE') {
              setActiveTab('SHOP');
          } else {
              setActiveTab(lastForgeTab);
          }
      } else {
          // 일반 내비게이션
          if (state.tutorialStep === 'MARKET_GUIDE' && target === 'MARKET') {
              actions.setTutorialStep('BROWSE_GOODS_GUIDE');
              actions.setTutorialScene('MARKET');
          }
          setActiveTab(target as any);
      }
  }, [lastForgeTab, state.tutorialStep, actions]);

  return (
    <div className="h-[100dvh] w-full bg-stone-950 text-stone-200 flex flex-col overflow-hidden px-safe selection:bg-amber-500/30">
      {/* Cinematic / Prologue Scene Overlay */}
      {state.activeTutorialScene && !['MARKET', 'SMITHING'].includes(state.activeTutorialScene) && (
        <div className="fixed inset-0 z-[5000]"><TutorialScene /></div>
      )}

      {/* Sleeping Overlay */}
      {isSleeping && <div className={`fixed inset-0 z-[10000] bg-black transition-opacity ${isFadingOut ? 'opacity-0 duration-[1000ms]' : 'opacity-100'}`}>{!isFadingOut && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"><span className="text-amber-50 font-serif italic text-5xl md:text-7xl">{zzzText}</span><span className="text-stone-700 font-black uppercase text-[10px]">Resting...</span></div>}</div>}
      
      {/* Tutorial Skip UI */}
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
      
      {/* Active Spotlight Tutorial Overlay */}
      {isAnyTutorialActive && state.tutorialStep && TUTORIAL_STEPS_CONFIG[state.tutorialStep] && <TutorialOverlay step={state.tutorialStep} />}
      
      {/* Narrative Dialogue Overlay */}
      {dialogueContent && (
        <div className="fixed inset-0 z-[2500] flex flex-col justify-end items-center pb-6 md:pb-12 px-4 pointer-events-none">
            <div className="w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto">
                <DialogueBox 
                    speaker={dialogueContent.speaker} 
                    text={dialogueContent.text} 
                    options={[{ 
                        label: "Continue", 
                        action: dialogueContent.action || (() => actions.setTutorialStep(dialogueContent.nextStep!)), 
                        variant: 'primary' 
                    }]} 
                />
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-stone-950 flex flex-col min-h-0">
        <div className={`h-full w-full ${activeTab === 'MAIN' ? 'block' : 'hidden'}`}><MainScene onNavigate={handleSceneNavigation} onSettingsClick={() => setIsSettingsOpen(true)} /></div>
        <div className={`h-full w-full ${activeTab === 'FORGE' ? 'block' : 'hidden'}`}><ForgeTab isActive={activeTab === 'FORGE'} onNavigate={setActiveTab} onOpenInventory={() => setIsInventoryOpen(true)} /></div>
        <div className={`h-full w-full ${activeTab === 'DUNGEON' ? 'block' : 'hidden'}`}><DungeonTab onNavigate={setActiveTab} /></div>
        {activeTab === 'SHOP' && <ShopTab onNavigate={setActiveTab} />}
        {activeTab === 'MARKET' && <MarketTab onNavigate={setActiveTab} />}
        {activeTab === 'TAVERN' && <TavernTab onNavigate={setActiveTab} />}
        {activeTab === 'SIMULATION' && <SimulationTab />}
      </main>

      {/* Global Modals */}
      {isInventoryOpen && <InventoryDisplay onClose={() => setIsInventoryOpen(false)} />}
      {state.isResearchOpen && <div className="fixed inset-0 z-[100] bg-stone-950 animate-in fade-in duration-500"><ResearchTab onClose={() => actions.setResearchOpen(false)} /></div>}
      
      {state.toast?.visible && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-bottom-4 pointer-events-none"><div onClick={actions.hideToast} className="bg-stone-900 border-2 border-amber-600/50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto cursor-pointer"><span className="text-stone-100 font-black text-xs md:text-sm uppercase tracking-widest">{state.toast.message}</span></div></div>}
      <EventModal /><SleepModal /><JournalModal /><DungeonResultModal /><CraftingResultModal /><SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onQuit={onQuit} onLoadRequest={onLoadFromSettings} /><TierUnlockModal /><TutorialCompleteModal /><ConfirmationModal isOpen={showSkipConfirm} title="Skip?" message="Unlock all systems immediately?" onConfirm={() => { actions.completeTutorial(); setShowSkipConfirm(false); }} onCancel={() => setShowSkipConfirm(false)} isDanger />
    </div>
  );
};

export default MainGameLayout;