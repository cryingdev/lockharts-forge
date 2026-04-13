import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Pointer, FastForward } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { SfxButton } from './common/ui/SfxButton';
import { t } from '../utils/i18n';
import { getForgeName, getPlayerName } from '../utils/gameText';

// Import Background Services
import { useShopService } from '../services/shop/shop-service';
import { useDungeonService } from '../services/dungeon/dungeon-service';

// Lazy Import Tab Components
const MainScene = lazy(() => import('./tabs/main/MainScene'));
const ForgeTab = lazy(() => import('./tabs/forge/ForgeTab'));
const ShopTab = lazy(() => import('./tabs/shop/ShopTab'));
const TavernTab = lazy(() => import('./tabs/tavern/TavernTab'));
const MarketTab = lazy(() => import('./tabs/market/MarketTab'));
const DungeonTab = lazy(() => import('./tabs/dungeon/DungeonTab'));
const SimulationTab = lazy(() => import('./tabs/Simulation/SimulationTab'));
const ResearchTab = lazy(() => import('./tabs/research/ResearchTab'));

// Lazy Import Modals
const InventoryDisplay = lazy(() => import('./InventoryDisplay').then(m => ({ default: m.InventoryDisplay })));
const EventModal = lazy(() => import('./modals/EventModal'));
const SleepModal = lazy(() => import('./modals/SleepModal'));
const JournalModal = lazy(() => import('./modals/JournalModal'));
const DungeonResultModal = lazy(() => import('./modals/DungeonResultModal'));
const CraftingResultModal = lazy(() => import('./modals/CraftingResultModal'));
const TierUnlockModal = lazy(() => import('./modals/TierUnlockModal'));
const SettingsModal = lazy(() => import('./modals/SettingsModal'));
const TutorialScene = lazy(() => import('./tutorial/TutorialScene'));
const DialogueBox = lazy(() => import('./DialogueBox'));
const ConfirmationModal = lazy(() => import('./modals/ConfirmationModal'));
const TutorialCompleteModal = lazy(() => import('./modals/TutorialCompleteModal'));

const LoadingFallback = () => {
    const { state } = useGame();
    return (
        <div className="h-full w-full flex items-center justify-center bg-stone-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin" />
                <span className="text-stone-500 font-black uppercase text-[10px] tracking-widest animate-pulse">{t(state.settings.language, 'common.loading')}</span>
            </div>
        </div>
    );
};

const REST_OVERLAY_VISIBLE_MS = 3000;
const REST_OVERLAY_FADE_MS = 1000;

const DocumentLanguageSync = () => {
    const { state } = useGame();

    useEffect(() => {
        const root = document.documentElement;
        const language = state.settings.language;
        root.lang = language;
        root.classList.toggle('lang-ko', language === 'ko');
    }, [state.settings.language]);

    return null;
};

interface MainGameLayoutProps {
    onQuit: () => void;
    onLoadFromSettings: (data: any, index: number) => void;
}

type TutorialDirection = 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
interface StepConfig {
    targetId: string;
    labelKey: string;
    direction: TutorialDirection;
}

const TUTORIAL_STEPS_CONFIG: Record<string, StepConfig> = {
    MARKET_POI_GUIDE: { targetId: 'MARKET_POI', labelKey: 'tutorial.visit_market_district', direction: 'right' },
    FORGE_POI_GUIDE: { targetId: 'FORGE_POI', labelKey: 'tutorial.visit_lockhart_forge', direction: 'right' },
    OPEN_RECIPE_GUIDE: { targetId: 'RECIPE_TOGGLE', labelKey: 'tutorial.open_recipes', direction: 'left' },
    CRAFT_FIRST_SWORD_GUIDE: { targetId: 'NAV_TO_FORGE', labelKey: 'tutorial.visit_lockhart_forge', direction: 'left' },
    SELECT_SWORD_GUIDE: { targetId: 'SWORD_RECIPE', labelKey: 'tutorial.select_sword', direction: 'bottom' },
    START_FORGING_GUIDE: { targetId: 'START_FORGING_BUTTON', labelKey: 'tutorial.start_forging', direction: 'right' },
    FINALIZE_FORGE_GUIDE: { targetId: 'FINALIZE_BUTTON', labelKey: 'tutorial.complete_forge', direction: 'bottom' },
    OPEN_SHOP_SIGN_GUIDE: { targetId: 'SHOP_SIGN', labelKey: 'tutorial.open_the_shop', direction: 'bottom' },
};

const TUTORIAL_CONTEXT_SCRIPTS: Record<string, { speaker: string, textKey: string }> = {
    MARKET_POI_GUIDE: { speaker: 'PLAYER', textKey: 'tutorial.guide.market_poi_guide' },
    FORGE_POI_GUIDE: { speaker: 'PLAYER', textKey: 'tutorial.guide.forge_poi_guide' },
    OPEN_RECIPE_GUIDE: { speaker: 'PLAYER', textKey: 'tutorial.guide.open_recipe_guide' },
    SELECT_SWORD_GUIDE: { speaker: 'PLAYER', textKey: 'tutorial.guide.select_sword_guide' },
    OPEN_SHOP_SIGN_GUIDE: { speaker: 'PLAYER', textKey: 'tutorial.guide.open_shop_sign_guide' },
};

const TutorialOverlay = ({ step }: { step: string }) => {
    const { state } = useGame();
    const language = state.settings.language;
    const playerName = getPlayerName(state);
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
                        <div className={`${labelMargin} min-w-max whitespace-nowrap px-5 py-1.5 bg-amber-600 text-white text-[10px] md:text-xs font-black uppercase rounded-full shadow-2xl border-2 border-amber-400`}>
                            {t(language, config.labelKey, { forgeName: getForgeName(state) })}
                        </div>
                    </div>
                </div>
            )}

            {script && (
                <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl pointer-events-none z-[5000]">
                    <DialogueBox
                        speaker={script.speaker === 'PLAYER' ? playerName : script.speaker}
                        text={t(language, script.textKey, { forgeName: getForgeName(state), playerName })}
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
  const language = state.settings.language;
  const forgeName = getForgeName(state);
  const playerName = getPlayerName(state);
  const [activeTab, setActiveTab] = useState<'MAIN' | 'FORGE' | 'MARKET' | 'SHOP' | 'TAVERN' | 'DUNGEON' | 'SIMULATION'>('MAIN');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const initialShouldSkipTitleLoadRest =
    typeof window !== 'undefined' && sessionStorage.getItem('skip-title-load-rest-overlay') === '1';
  const [isTitleLoadFadingIn, setIsTitleLoadFadingIn] = useState(initialShouldSkipTitleLoadRest);
  const [hasStartedTitleLoadFade, setHasStartedTitleLoadFade] = useState(false);
  const [zzzText, setZzzText] = useState('');
  const prevDayRef = useRef(state.stats.day);
  const shouldSkipNextRestOverlayRef = useRef(initialShouldSkipTitleLoadRest);

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
    if (initialShouldSkipTitleLoadRest) {
      setHasStartedTitleLoadFade(false);
      sessionStorage.removeItem('skip-title-load-rest-overlay');

      const startFadeTimer = window.setTimeout(() => {
        setHasStartedTitleLoadFade(true);
      }, 40);

      const fadeTimer = window.setTimeout(() => {
        setIsTitleLoadFadingIn(false);
      }, 700);

      return () => {
        window.clearTimeout(startFadeTimer);
        window.clearTimeout(fadeTimer);
      };
    }
  }, [initialShouldSkipTitleLoadRest]);

  useEffect(() => {
    if (shouldSkipNextRestOverlayRef.current) {
        if (state.stats.day !== prevDayRef.current) {
            prevDayRef.current = state.stats.day;
            shouldSkipNextRestOverlayRef.current = false;
            return;
        }

        prevDayRef.current = state.stats.day;
        return;
    }

    if (state.stats.day > prevDayRef.current) {
        setIsSleeping(true); setIsFadingOut(false);
        const sleepTimer = setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => { setIsSleeping(false); setIsFadingOut(false); actions.closeRest(); }, REST_OVERLAY_FADE_MS); 
        }, REST_OVERLAY_VISIBLE_MS); 
        prevDayRef.current = state.stats.day;
        return () => clearTimeout(sleepTimer);
    }
    prevDayRef.current = state.stats.day;
  }, [state.stats.day, actions]);

  const restAnimationDuration = `${REST_OVERLAY_VISIBLE_MS}ms`;

  const isAnyTutorialActive = !!state.tutorialStep && state.hasCompletedPrologue && !state.isCrafting;

  const dialogueContent = useMemo(() => {
    switch (state.tutorialStep) {
        case 'CRAFT_RESULT_DIALOG_GUIDE':
            return { speaker: playerName, text: t(language, 'tutorial.monologue.craft_result', { forgeName, playerName }), nextStep: 'FINALIZE_FORGE_GUIDE' as const };
        case 'SHOP_INTRO_DIALOG_GUIDE':
            return { speaker: playerName, text: t(language, 'tutorial.monologue.shop_intro', { forgeName, playerName }), nextStep: 'OPEN_SHOP_SIGN_GUIDE' as const };
        default: return null;
    }
  }, [state.tutorialStep, actions, language, forgeName, playerName]);

  // MainScene 등의 자식 컴포넌트에서 건물 클릭 시 호출할 지능형 내비게이션 핸들러
  const handleSceneNavigation = useCallback((target: string) => {
      if (target === 'FORGE_BUILDING') {
          if (state.tutorialStep === 'FORGE_POI_GUIDE') {
              setActiveTab('FORGE');
              actions.setTutorialStep('OPEN_RECIPE_GUIDE');
          } else {
              setActiveTab(lastForgeTab);
          }
      } else {
          // 일반 내비게이션
          if (state.tutorialStep === 'MARKET_POI_GUIDE' && target === 'MARKET') {
              actions.setTutorialStep('BROWSE_GOODS_GUIDE');
              actions.setTutorialScene('MARKET');
          }
          setActiveTab(target as any);
      }
  }, [lastForgeTab, state.tutorialStep, actions]);

  return (
    <div className="h-[100dvh] w-full bg-stone-950 text-stone-200 flex flex-col overflow-hidden px-safe selection:bg-amber-500/30">
      <DocumentLanguageSync />
      {/* Cinematic / Prologue Scene Overlay */}
      {state.activeTutorialScene && !['MARKET', 'SMITHING'].includes(state.activeTutorialScene) && (
        <div className="fixed inset-0 z-[5000]"><TutorialScene /></div>
      )}

      {/* Sleeping Overlay */}
      {isSleeping && (
        <div
          className={`fixed inset-0 z-[10000] bg-black transition-opacity ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
          style={{ transitionDuration: `${REST_OVERLAY_FADE_MS}ms` }}
        >
          {!isFadingOut && (
            <>
              <style>{`
                @keyframes rest-dark-lift {
                  0% { opacity: 0.5; }
                  24% { opacity: 0.46; }
                  58% { opacity: 0.28; }
                  100% { opacity: 0.12; }
                }
                @keyframes rest-window-dawn {
                  0% {
                    opacity: 0.02;
                    transform: scale(0.98);
                    filter: blur(26px) saturate(0.9);
                  }
                  22% {
                    opacity: 0.08;
                    transform: scale(0.995);
                    filter: blur(24px) saturate(0.95);
                  }
                  62% {
                    opacity: 0.24;
                    transform: scale(1.03);
                    filter: blur(22px) saturate(1.02);
                  }
                  100% {
                    opacity: 0.42;
                    transform: scale(1.06);
                    filter: blur(18px) saturate(1.08);
                  }
                }
                @keyframes rest-room-wash {
                  0% {
                    opacity: 0;
                    filter: blur(40px) brightness(0.96);
                  }
                  32% {
                    opacity: 0.04;
                    filter: blur(38px) brightness(0.98);
                  }
                  68% {
                    opacity: 0.12;
                    filter: blur(34px) brightness(1.02);
                  }
                  100% {
                    opacity: 0.2;
                    filter: blur(30px) brightness(1.05);
                  }
                }
                @keyframes rest-ember-fade {
                  0% {
                    opacity: 0.28;
                    transform: scale(1);
                    filter: blur(24px) saturate(1.08);
                  }
                  45% {
                    opacity: 0.18;
                    transform: scale(0.98);
                    filter: blur(20px) saturate(1.02);
                  }
                  100% {
                    opacity: 0.06;
                    transform: scale(0.94);
                    filter: blur(16px) saturate(0.9);
                  }
                }
                @keyframes rest-zzz-float {
                  0% { transform: translateY(0); opacity: 0.92; }
                  50% { transform: translateY(-4px); opacity: 1; }
                  100% { transform: translateY(0); opacity: 0.92; }
                }
                @keyframes rest-text-pulse {
                  0% { opacity: 0.8; }
                  50% { opacity: 1; }
                  100% { opacity: 0.8; }
                }
              `}</style>
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-[1px]" />
                <div
                  className="absolute inset-0 bg-black"
                  style={{ animation: `rest-dark-lift ${restAnimationDuration} cubic-bezier(0.4, 0, 0.2, 1) 1 forwards` }}
                />
                <div
                  className="absolute inset-0 mix-blend-screen"
                  style={{
                    background:
                      'radial-gradient(52% 36% at 53% 20%, rgba(166, 191, 235, 0.72) 0%, rgba(205, 217, 255, 0.26) 28%, rgba(255, 219, 173, 0.12) 54%, rgba(255,255,255,0) 82%)',
                    animation: `rest-window-dawn ${restAnimationDuration} cubic-bezier(0.4, 0, 0.2, 1) 1 forwards`,
                  }}
                />
                <div
                  className="absolute inset-0 mix-blend-screen"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(196,214,255,0) 0%, rgba(196,214,255,0.03) 36%, rgba(245,225,188,0.14) 74%, rgba(255,235,196,0.22) 100%)',
                    animation: `rest-room-wash ${restAnimationDuration} cubic-bezier(0.4, 0, 0.2, 1) 1 forwards`,
                  }}
                />
                <div
                  className="absolute inset-0 mix-blend-screen"
                  style={{
                    background:
                      'radial-gradient(28% 24% at 27% 40%, rgba(255, 168, 84, 0.55) 0%, rgba(255, 140, 60, 0.22) 32%, rgba(255, 120, 40, 0.08) 52%, rgba(255,255,255,0) 78%)',
                    animation: `rest-ember-fade ${restAnimationDuration} cubic-bezier(0.4, 0, 0.2, 1) 1 forwards`,
                  }}
                />

                <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-black/55 via-black/12 to-transparent" />
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <span
                  className="text-amber-50 font-serif italic text-5xl md:text-7xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
                  style={{ animation: 'rest-zzz-float 2.8s ease-in-out infinite' }}
                >
                  {zzzText}
                </span>
                <span
                  className="text-stone-100 font-black uppercase tracking-[0.2em] text-[18px] md:text-[22px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                  style={{ animation: 'rest-text-pulse 2.6s ease-in-out infinite' }}
                >
                  {t(language, 'tutorial.resting')}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {isTitleLoadFadingIn && (
        <div
          className={`fixed inset-0 z-[9990] bg-black pointer-events-none transition-opacity duration-700 ${hasStartedTitleLoadFade ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
      
      {/* Tutorial Skip UI */}
      {isAnyTutorialActive && (
        <div className="fixed top-4 right-4 z-[6000]">
            <SfxButton 
                sfx="switch"
                onClick={() => setShowSkipConfirm(true)} 
                className="flex items-center gap-2.5 px-5 py-2.5 md:px-6 md:py-3 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded-full text-[13px] md:text-base font-black uppercase shadow-2xl backdrop-blur-md transition-all active:scale-95 group"
            >
                <FastForward className="w-4.5 h-4.5 md:w-5 md:h-5 group-hover:animate-pulse" /> {t(language, 'tutorial.skip_button')}
            </SfxButton>
        </div>
      )}
      
      {/* Active Spotlight Tutorial Overlay */}
      {isAnyTutorialActive && state.tutorialStep && TUTORIAL_STEPS_CONFIG[state.tutorialStep] && <TutorialOverlay step={state.tutorialStep} />}
      
      {/* Narrative Dialogue Overlay */}
      {dialogueContent && (
        <div className="fixed inset-0 z-[2500] flex flex-col justify-end items-center pb-6 md:pb-12 px-4 pointer-events-none">
            <div className="w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto">
                {(() => {
                    const continueAction = () => {
                        if (state.tutorialStep === 'SHOP_INTRO_DIALOG_GUIDE') {
                            setActiveTab('SHOP');
                        }
                        actions.setTutorialStep(dialogueContent.nextStep);
                    };

                    return (
                <DialogueBox 
                    speaker={dialogueContent.speaker} 
                    text={dialogueContent.text} 
                    options={[{ 
                        label: t(language, 'common.continue'), 
                        action: continueAction, 
                        variant: 'primary' 
                    }]} 
                />
                    );
                })()}
            </div>
        </div>
      )}

      {/* General Dialogue Overlay */}
      {state.activeDialogue && (
        <div className="fixed inset-0 z-[2500] flex flex-col justify-end items-center pb-6 md:pb-12 px-4 pointer-events-none">
            <div className="w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto">
                <DialogueBox 
                    speaker={state.activeDialogue.speaker} 
                    text={state.activeDialogue.text} 
                    speakerAvatar={state.activeDialogue.avatar}
                    options={state.activeDialogue.options.map(opt => ({
                        ...opt,
                        action: () => {
                            if (opt.action) {
                                if (typeof opt.action === 'function') {
                                    opt.action();
                                } else if (typeof opt.action === 'object' && opt.action !== null) {
                                    actions.dispatch(opt.action);
                                }
                            }
                            if (opt.targetTab) {
                                setActiveTab(opt.targetTab as any);
                            }
                            actions.setDialogue(null);
                        }
                    }))} 
                />
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-stone-950 flex flex-col min-h-0">
        <Suspense fallback={<LoadingFallback />}>
          <div className={`h-full w-full ${activeTab === 'MAIN' ? 'block' : 'hidden'}`}><MainScene onNavigate={handleSceneNavigation} onSettingsClick={() => setIsSettingsOpen(true)} /></div>
          <div className={`h-full w-full ${activeTab === 'FORGE' ? 'block' : 'hidden'}`}><ForgeTab isActive={activeTab === 'FORGE'} onNavigate={handleSceneNavigation} onOpenInventory={() => setIsInventoryOpen(true)} /></div>
          <div className={`h-full w-full ${activeTab === 'DUNGEON' ? 'block' : 'hidden'}`}><DungeonTab onNavigate={handleSceneNavigation} /></div>
          <div className={`h-full w-full ${activeTab === 'SHOP' ? 'block' : 'hidden'}`}><ShopTab onNavigate={handleSceneNavigation} /></div>
          <div className={`h-full w-full ${activeTab === 'MARKET' ? 'block' : 'hidden'}`}><MarketTab onNavigate={handleSceneNavigation} /></div>
          <div className={`h-full w-full ${activeTab === 'TAVERN' ? 'block' : 'hidden'}`}><TavernTab onNavigate={handleSceneNavigation} /></div>
          {activeTab === 'SIMULATION' && <SimulationTab />}
        </Suspense>
      </main>

      {/* Global Modals */}
      <Suspense fallback={null}>
        {isInventoryOpen && <InventoryDisplay onClose={() => setIsInventoryOpen(false)} />}
        {state.isResearchOpen && <div className="fixed inset-0 z-[100] bg-stone-950 animate-in fade-in duration-500"><ResearchTab onClose={() => actions.setResearchOpen(false)} /></div>}
        
        {state.toast?.visible && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-bottom-4 pointer-events-none"><div onClick={actions.hideToast} className="bg-stone-900 border-2 border-amber-600/50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto cursor-pointer"><span className="text-stone-100 font-black text-xs md:text-sm uppercase tracking-widest">{state.toast.message}</span></div></div>}
        <EventModal /><SleepModal /><JournalModal /><DungeonResultModal /><CraftingResultModal /><SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onQuit={onQuit} onLoadRequest={onLoadFromSettings} /><TierUnlockModal /><TutorialCompleteModal /><ConfirmationModal isOpen={showSkipConfirm} title={t(state.settings.language, 'tutorial.skip_title')} message={t(state.settings.language, 'tutorial.skip_message')} onConfirm={() => { actions.completeTutorial(); setShowSkipConfirm(false); }} onCancel={() => setShowSkipConfirm(false)} isDanger />
      </Suspense>
    </div>
  );
};

export default MainGameLayout;
