import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import DialogueBox from '../DialogueBox';
import { getAssetUrl } from '../../utils';
import { Flame, Zap, FastForward, Pointer } from 'lucide-react';
import { t } from '../../utils/i18n';
import { getForgeName, getPlayerName } from '../../utils/gameText';
const ConfirmationModal = React.lazy(() => import('../modals/ConfirmationModal'));
import { SfxButton } from '../common/ui/SfxButton';

const MAX_TEMP = 1500;
const IDLE_TEMP = 10;

type SequenceStep = 
    | 'IDLE' 
    | 'REPLACE_FURNACE_GUIDE' 
    | 'IGNITE_FURNACE_GUIDE' 
    | 'HEAT_CONFIRM_DIALOG' 
    | 'WAIT_CONTINUE_BELLOWS' 
    | 'PUMP_FURNACE_GUIDE' 
    | 'FURNACE_FINAL_DIALOG';

type TutorialDirection = 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';

interface SceneStepConfig {
    targetId: string;
    labelKey: string;
    direction: TutorialDirection;
}

const SCENE_STEPS_CONFIG: Partial<Record<SequenceStep, SceneStepConfig>> = {
    IGNITE_FURNACE_GUIDE: { targetId: "tutorial-heat", labelKey: "tutorial.scene_ignite_furnace", direction: "left" },
    PUMP_FURNACE_GUIDE: { targetId: "tutorial-bellows", labelKey: "tutorial.scene_pump_bellows", direction: "left" }
};

const LocalSpotlight = ({ step, hasPumpedOnce }: { step: SequenceStep, hasPumpedOnce: boolean }) => {
    const { state } = useGame();
    const language = state.settings.language;
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [animatedRadius, setAnimatedRadius] = useState(2000);
    const requestRef = useRef<number | null>(null);
    const animRef = useRef<number | null>(null);
    const config = SCENE_STEPS_CONFIG[step];
    
    const updateRect = useCallback(() => {
        if (!config) return;
        const el = document.getElementById(config.targetId);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setTargetRect(rect);
            }
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
        return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current); };
    }, [step, !!targetRect]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updateRect);
        return () => { if (requestRef.current !== null) cancelAnimationFrame(requestRef.current); };
    }, [updateRect]);

    if (!config || !targetRect) return null;

    const { top, left, width, height } = targetRect;
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
    }

    const currentLabel = (step === 'PUMP_FURNACE_GUIDE' && hasPumpedOnce)
        ? t(language, 'tutorial.scene_keep_pumping')
        : t(language, config.labelKey);

    return (
        <div className="fixed inset-0 z-[3050] pointer-events-none overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="tutorial-mask-local">
                        <rect width="100%" height="100%" fill="white" />
                        <circle cx={centerX} cy={centerY} r={animatedRadius} fill="black" />
                    </mask>
                </defs>
                <rect 
                    width="100%" 
                    height="100%" 
                    fill={`rgba(0,0,0,0.75)`} 
                    mask="url(#tutorial-mask-local)" 
                />
            </svg>

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full pointer-events-auto bg-transparent" style={{ height: top }} />
                <div className="absolute left-0 w-full pointer-events-auto bg-transparent" style={{ top: top + height, bottom: 0 }} />
                <div className="absolute top-0 left-0 pointer-events-auto bg-transparent" style={{ top, height, width: left }} />
                <div className="absolute top-0 pointer-events-auto bg-transparent" style={{ top, height, left: left + width, right: 0 }} />
            </div>

            <div 
                key={`${config.targetId}-${currentLabel}-${config.direction}`}
                className="absolute animate-in fade-in zoom-in-95 duration-300" 
                style={pointerStyles}
            >
                <div className={`flex items-center ${containerLayout} ${animationClass}`}>
                    <Pointer className={`w-8 h-8 md:w-12 md:h-12 text-amber-400 fill-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]`} style={{ transform: iconRotation }} />
                    <div className={`${labelMargin} px-4 py-1.5 bg-amber-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full shadow-2xl border-2 border-amber-400 whitespace-nowrap`}>
                        {currentLabel}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TutorialScene: React.FC = () => {
    const { state, actions } = useGame();
    const language = state.settings.language;
    const [seq, setSeq] = useState<SequenceStep>('IDLE');
    const [currentStep, setCurrentStep] = useState(0);
    const [temp, setTemp] = useState(0); 
    const [isPumping, setIsPumping] = useState(false);
    const [hasPumpedOnce, setHasPumpedOnce] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [showSkipConfirm, setShowSkipConfirm] = useState(false);
    
    const mode = state.activeTutorialScene || 'PROLOGUE';
    const playerName = getPlayerName(state);

    useEffect(() => {
        setIsStarted(false);
        setHasPumpedOnce(false);
        setTemp(0);
        setCurrentStep(0);
        setSeq('IDLE');
    }, [mode]);

    useEffect(() => {
        if (seq === 'HEAT_CONFIRM_DIALOG' || seq === 'WAIT_CONTINUE_BELLOWS' || seq === 'PUMP_FURNACE_GUIDE') {
            const timer = setInterval(() => {
                setTemp(prev => {
                    const floorVal = 26.17;
                    if (prev > floorVal) return prev - 0.12;
                    return floorVal;
                });
            }, 50);
            return () => clearInterval(timer);
        }
    }, [seq]);

    const bgImage = useMemo(() => {
        if (mode === 'PROLOGUE' || (seq === 'IDLE' && !isStarted)) return 'tutorial/forge_ruined_bg.jpeg';
        if (seq === 'REPLACE_FURNACE_GUIDE' || seq === 'IGNITE_FURNACE_GUIDE') return 'tutorial/forge_fixed_bg.jpeg';
        const currentDegrees = Math.round(IDLE_TEMP + (temp / 100) * (MAX_TEMP - IDLE_TEMP));
        if (currentDegrees >= 1490) return 'tutorial/forge_hot_bg.jpeg';
        if (['HEAT_CONFIRM_DIALOG', 'WAIT_CONTINUE_BELLOWS', 'PUMP_FURNACE_GUIDE', 'FURNACE_FINAL_DIALOG'].includes(seq)) return 'tutorial/forge_start_bg.jpeg';
        return 'tutorial/forge_fixed_bg.jpeg';
    }, [mode, seq, temp, isStarted]);

    const handleStart = () => {
        if (isStarted) return;
        if (mode === 'FURNACE_RESTORED') {
            setShowFlash(true);
            setTimeout(() => {
                setIsStarted(true);
                setSeq('REPLACE_FURNACE_GUIDE');
                setCurrentStep(0);
            }, 50);
            setTimeout(() => setShowFlash(false), 800);
        } else {
            setIsStarted(true);
        }
    };

    const handleHeatUp = () => {
        if (seq !== 'IGNITE_FURNACE_GUIDE') return;
        setTemp(39.6);
        setSeq('HEAT_CONFIRM_DIALOG');
    };

    const handlePump = () => {
        setIsPumping(true);
        setHasPumpedOnce(true);
        const nextTempRatio = Math.min(100, temp + 5.5);
        setTemp(nextTempRatio);
        setTimeout(() => setIsPumping(false), 300);
        
        if (seq === 'PUMP_FURNACE_GUIDE' && nextTempRatio >= 99) {
            setSeq('FURNACE_FINAL_DIALOG');
        }
    };

    const dialogue = useMemo(() => {
        if (!isStarted) return { text: "" };
        if (mode === 'PROLOGUE') return { text: t(language, `tutorial.prologue_${currentStep}`, { forgeName: getForgeName(state) }) };
        if (seq === 'REPLACE_FURNACE_GUIDE') return { text: t(language, `tutorial.furnace_${currentStep}`) };
        if (seq === 'HEAT_CONFIRM_DIALOG') return { text: t(language, 'tutorial.furnace_heated') };
        if (seq === 'WAIT_CONTINUE_BELLOWS') {
            return currentStep === 0
                ? { text: t(language, 'tutorial.furnace_cooling') }
                : { text: t(language, 'tutorial.furnace_bellows_mono') };
        }
        if (seq === 'FURNACE_FINAL_DIALOG') return { text: t(language, 'tutorial.furnace_maxed') };
        return { text: t(language, 'tutorial.placeholder') };
    }, [isStarted, mode, currentStep, seq, language]);

    const handleNext = () => {
        if (mode === 'PROLOGUE') {
            if (currentStep < 1) setCurrentStep(prev => prev + 1);
            else actions.completePrologue();
        } else {
            if (seq === 'REPLACE_FURNACE_GUIDE') {
                if (currentStep < 1) setCurrentStep(prev => prev + 1);
                else setSeq('IGNITE_FURNACE_GUIDE');
            } else if (seq === 'HEAT_CONFIRM_DIALOG') {
                setSeq('WAIT_CONTINUE_BELLOWS');
                setCurrentStep(0);
            } else if (seq === 'WAIT_CONTINUE_BELLOWS') {
                if (currentStep < 1) setCurrentStep(prev => prev + 1);
                else setSeq('PUMP_FURNACE_GUIDE');
            } else if (seq === 'FURNACE_FINAL_DIALOG') {
                actions.setTutorialScene(null);
                actions.setTutorialStep('SHOP_INTRO_DIALOG_GUIDE');
            }
        }
    };

    const handleConfirmSkip = () => {
        actions.completeTutorial();
        setShowSkipConfirm(false);
    };

    const promptText = mode === 'FURNACE_RESTORED'
        ? t(language, 'tutorial.replace_furnace_prompt')
        : t(language, 'tutorial.tap_to_begin');
    const isIndicateStep = seq === 'IGNITE_FURNACE_GUIDE' || seq === 'PUMP_FURNACE_GUIDE';

    return (
        <div className="fixed inset-0 z-[3000] bg-stone-950 overflow-hidden flex flex-col items-center justify-center cursor-pointer px-safe" onClick={handleStart}>
            <style>{`
                @keyframes bounce-x { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(12px); } }
                @keyframes bounce-x-reverse { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-12px); } }
                @keyframes bounce-reverse { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
                .animate-bounce-x { animation: bounce-x 1s infinite; }
                .animate-bounce-x-reverse { animation: bounce-x-reverse 1s infinite; }
                .animate-bounce-reverse { animation: bounce-reverse 1s infinite; }
                @keyframes flash-out { 0% { opacity: 0; } 20% { opacity: 1; } 100% { opacity: 0; } }
                .animate-flash-out { animation: flash-out 0.8s ease-out forwards; }
            `}</style>

            <div className="absolute inset-0 z-0 pointer-events-none bg-stone-950">
                <img src={getAssetUrl(bgImage)} className="w-full h-full object-cover" alt="Background" />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            <div className="absolute top-4 right-4 z-[6000]">
                <SfxButton sfx="switch" onClick={(e) => { e.stopPropagation(); setShowSkipConfirm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded-full text-[10px] font-black uppercase shadow-2xl backdrop-blur-md transition-all active:scale-95 group">
                    <FastForward className="w-3 h-3 group-hover:animate-pulse" /> {t(language, 'tutorial.skip_button')}
                </SfxButton>
            </div>

            {showFlash && <div className="absolute inset-0 z-[4000] bg-white animate-flash-out pointer-events-none"></div>}

            {!isStarted && !showFlash && (
                <div className="relative z-20 flex flex-col items-center animate-pulse pointer-events-none">
                    <span className="text-amber-500 font-black uppercase tracking-[0.4em] text-[10px] md:text-sm drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">{promptText}</span>
                </div>
            )}

            {isStarted && isIndicateStep && (
                <LocalSpotlight step={seq} hasPumpedOnce={hasPumpedOnce} />
            )}
            
            {isStarted && !isIndicateStep && (
                <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl pointer-events-auto z-[5000]">
                    <DialogueBox 
                        speaker={mode === 'PROLOGUE' || seq !== 'FURNACE_FINAL_DIALOG' ? playerName : t(language, 'tutorial.master_smith')} 
                        text={dialogue.text} 
                        options={[{ label: t(language, 'common.continue'), action: handleNext, variant: 'primary' }]} 
                        className="w-full relative" 
                    />
                </div>
            )}

            {mode === 'FURNACE_RESTORED' && isStarted && (
                <div className="absolute top-[15dvh] right-[5vw] z-[3040] flex flex-col items-center gap-6 animate-in slide-in-from-right-8 duration-700 pointer-events-auto">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-stone-300 uppercase tracking-tighter mb-2 font-mono drop-shadow-md">
                            {Math.round(IDLE_TEMP + (temp / 100) * (MAX_TEMP - IDLE_TEMP))}°C
                        </span>
                        <div className="w-7 h-48 md:h-64 bg-stone-950 rounded-full border-2 border-stone-800 relative shadow-2xl overflow-hidden">
                            <div className="absolute inset-1 rounded-full overflow-hidden">
                                <div className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-300 ${temp < 30 ? 'bg-blue-600' : temp > 80 ? 'bg-red-600 animate-pulse' : 'bg-amber-500'}`} style={{ height: `${temp}%` }} />
                            </div>
                        </div>
                    </div>

                    <SfxButton id="tutorial-bellows" sfx="bellows.wav" onClick={(e) => { e.stopPropagation(); handlePump(); }} disabled={seq !== 'PUMP_FURNACE_GUIDE'} className={`w-16 h-16 md:w-24 md:h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all shadow-2xl relative overflow-hidden group ${seq === 'PUMP_FURNACE_GUIDE' ? 'bg-stone-800 border-amber-500 animate-pulse' : 'bg-stone-900 border-stone-800 grayscale opacity-40'} ${isPumping ? 'scale-90 brightness-150' : 'hover:scale-105'}`}>
                        <Zap className={`w-6 h-6 md:w-10 md:h-10 ${seq === 'PUMP_FURNACE_GUIDE' ? 'text-amber-400' : 'text-stone-600'}`} />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter mt-1">{t(language, 'tutorial.pump')}</span>
                    </SfxButton>

                    <SfxButton id="tutorial-heat" sfx="fire_up.mp3" onClick={(e) => { e.stopPropagation(); handleHeatUp(); }} disabled={seq !== 'IGNITE_FURNACE_GUIDE'} className={`w-14 h-14 md:w-20 md:h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all shadow-2xl ${seq === 'IGNITE_FURNACE_GUIDE' ? 'bg-orange-900/60 border-orange-500 shadow-orange-500/20' : 'bg-stone-900 border-stone-800 grayscale opacity-40'}`}>
                        <Flame className={`w-5 h-5 md:w-8 md:h-8 ${seq === 'IGNITE_FURNACE_GUIDE' ? 'text-orange-400' : 'text-stone-600'}`} />
                        <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest mt-1">{t(language, 'tutorial.ignite')}</span>
                    </SfxButton>
                </div>
            )}

            <React.Suspense fallback={null}>
                <ConfirmationModal isOpen={showSkipConfirm} title={t(language, 'tutorial.skip_confirm_title')} message={t(language, 'tutorial.skip_confirm_message')} confirmLabel={t(language, 'tutorial.skip_confirm_label')} onConfirm={handleConfirmSkip} onCancel={() => setShowSkipConfirm(false)} isDanger={true} />
            </React.Suspense>
        </div>
    );
};

export default TutorialScene;
