import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useGame } from '../../../context/GameContext';
import DialogueBox from '../../DialogueBox';
import { getAssetUrl } from '../../../utils';
import { TutorialSceneMode } from '../../../types/game-state';
import { Flame, Zap, FastForward, MousePointer2 as Pointer } from 'lucide-react';
import ConfirmationModal from '../../modals/ConfirmationModal';

type SequenceStep = 
    | 'IDLE' 
    | 'POST_REPLACE_TALK' 
    | 'WAIT_HEAT' 
    | 'HEAT_CONFIRM' 
    | 'WAIT_CONTINUE_BELLOWS' 
    | 'WAIT_PUMP' 
    | 'FINAL_TALK';

type TutorialDirection = 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';

interface SceneStepConfig {
    targetId: string;
    label: string;
    direction: TutorialDirection;
}

const SCENE_STEPS_CONFIG: Partial<Record<SequenceStep, SceneStepConfig>> = {
    WAIT_HEAT: { targetId: "tutorial-heat", label: "Ignite Furnace", direction: "left" },
    WAIT_PUMP: { targetId: "tutorial-bellows", label: "Pump Bellows", direction: "left" }
};

const SCRIPTS: Record<string, { text: string; options?: any[] }> = {
    PROLOGUE_0: { text: "I have just returned from the hill after burying my family... My hands, stained with earth, are still trembling." },
    PROLOGUE_1: { text: "The forge has been ruthlessly trampled by their hands. Everything I built... gone in a single night of fire and blood." },
    PROLOGUE_2: { text: "But the fury within me burns hotter than any flame. For the sake of vengeance, I will rekindle the embers of this forge once more." },
    PROLOGUE_3: { text: "Wait... the furnace is completely beyond repair. I cannot melt ore without a steady flame." },
    PROLOGUE_4: { text: "I must head to the Market immediately to find a replacement. The hammer of the Lockhart lineage will not be silenced." },
    
    FURNACE_0: { text: "The furnace is finally in place. The air in the forge doesn't feel so heavy and cold anymore." },
    FURNACE_1: { text: "It's a sturdy unit. I've managed to seal the connections, but I should check if the flue is drawing correctly." },
    FURNACE_HEAT_PROMPT: { text: "Let's see if the fuel takes. I need to check the ignition systems." },
    FURNACE_HEATED: { text: "The temperature is rising. The heat is building... the chimney is drawing well." },
    FURNACE_COOLING: { text: "The fire is settling down. I should use the bellows to keep the oxygen flowing." },
    FURNACE_BELLOWS_MONO: { text: "If the temperature drops below 400°C, the bellows won't be enough to bring it back to a roar. I must act while the embers are hot." },
    FURNACE_PUMP_PROMPT: { text: "Let's see if we can reach the forging temperature. Pump it to the limit!" },
    FURNACE_MAXED: { text: "Magnificent. The forge is finally alive and roaring. I'm ready to begin the work of retribution." }
};

const LocalSpotlight = ({ step, hasPumpedOnce }: { step: SequenceStep, hasPumpedOnce: boolean }) => {
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

            if (progress < 1) {
                animRef.current = requestAnimationFrame(animate);
            }
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
        default:
            pointerStyles = { left: centerX, top: top + height + 15, transform: 'translateX(-50%)' };
            iconRotation = '';
            animationClass = 'animate-bounce';
            containerLayout = 'flex-col';
            labelMargin = 'mt-3';
            break;
    }

    const currentLabel = (step === 'WAIT_PUMP' && hasPumpedOnce) ? "Keep Pump!" : config.label;

    return (
        <div className="fixed inset-0 z-[3050] pointer-events-none overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="tutorial-mask-local">
                        <rect width="100%" height="100%" fill="white" />
                        {/* Focus hole for the interactive object */}
                        <circle cx={centerX} cy={centerY} r={animatedRadius} fill="black" />
                    </mask>
                </defs>
                <rect 
                    width="100%" 
                    height="100%" 
                    fill={`rgba(0,0,0,${Math.min(0.75, 1.5 - (animatedRadius / 1000))})`} 
                    mask="url(#tutorial-mask-local)" 
                />
            </svg>

            {/* Interaction blocker with hole for pointer events */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full pointer-events-auto bg-transparent" style={{ height: top }} />
                <div className="absolute left-0 w-full pointer-events-auto bg-transparent" style={{ top: top + height, bottom: 0 }} />
                <div className="absolute top-0 left-0 pointer-events-auto bg-transparent" style={{ top, height, width: left }} />
                <div className="absolute top-0 pointer-events-auto bg-transparent" style={{ top, height, left: left + width, right: 0 }} />
            </div>

            <div 
                key={`${config.targetId}-${currentLabel}`}
                className="absolute animate-in fade-in zoom-in-95 duration-300" 
                style={pointerStyles}
            >
                <div className={`flex items-center ${containerLayout} ${animationClass}`}>
                    <Pointer className={`w-8 h-8 md:w-12 md:h-12 text-amber-400 fill-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]`} style={{ transform: iconRotation.includes('rotate') ? iconRotation : undefined }} />
                    <div className={`${labelMargin} px-4 py-1.5 bg-amber-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full shadow-2xl whitespace-nowrap border-2 border-amber-400`}>
                        {currentLabel}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TutorialScene: React.FC = () => {
    const { state, actions } = useGame();
    const [seq, setSeq] = useState<SequenceStep>('IDLE');
    const [currentStep, setCurrentStep] = useState(0);
    const [temp, setTemp] = useState(0); 
    const [isPumping, setIsPumping] = useState(false);
    const [hasPumpedOnce, setHasPumpedOnce] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [showSkipConfirm, setShowSkipConfirm] = useState(false);
    
    const mode = state.activeTutorialScene || 'PROLOGUE';

    useEffect(() => {
        if (seq === 'HEAT_CONFIRM' || seq === 'WAIT_CONTINUE_BELLOWS' || seq === 'WAIT_PUMP') {
            const timer = setInterval(() => {
                setTemp(prev => {
                    if (prev > 29.1) return prev - 0.12;
                    return prev;
                });
            }, 50);
            return () => clearInterval(timer);
        }
    }, [seq]);

    useEffect(() => {
        setHasPumpedOnce(false);
    }, [seq]);

    const bgImage = useMemo(() => {
        if (mode === 'PROLOGUE') return 'forge_ruined_bg.png';
        if (seq === 'IDLE' && !isStarted) return 'forge_ruined_bg.png';
        if (seq === 'POST_REPLACE_TALK' || seq === 'WAIT_HEAT') return 'forge_fixed_bg.png';
        if (temp >= 99.5) return 'forge_hot_bg.png';
        if (['HEAT_CONFIRM', 'WAIT_CONTINUE_BELLOWS', 'WAIT_PUMP', 'FINAL_TALK'].includes(seq)) return 'forge_start_bg.png';
        return 'forge_fixed_bg.png';
    }, [mode, seq, temp, isStarted]);

    const handleStart = () => {
        if (isStarted) return;
        if (mode === 'FURNACE_RESTORED') {
            setShowFlash(true);
            setTimeout(() => {
                setIsStarted(true);
                setSeq('POST_REPLACE_TALK');
                setCurrentStep(0);
            }, 50);
            setTimeout(() => setShowFlash(false), 800);
        } else {
            setIsStarted(true);
        }
    };

    const handleHeatUp = () => {
        if (seq !== 'WAIT_HEAT') return;
        setTemp(80);
        setSeq('HEAT_CONFIRM');
    };

    const handlePump = () => {
        setIsPumping(true);
        setHasPumpedOnce(true);
        setTemp(prev => Math.min(100, prev + 5));
        setTimeout(() => setIsPumping(false), 300);
        if (seq === 'WAIT_PUMP' && temp + 5 >= 100) {
            setSeq('FINAL_TALK');
        }
    };

    const dialogue = useMemo(() => {
        if (!isStarted) return { text: "" };
        if (mode === 'PROLOGUE') return SCRIPTS[`PROLOGUE_${currentStep}`];
        if (seq === 'POST_REPLACE_TALK') return SCRIPTS[`FURNACE_${currentStep}`];
        if (seq === 'WAIT_HEAT') return SCRIPTS.FURNACE_HEAT_PROMPT;
        if (seq === 'HEAT_CONFIRM') return SCRIPTS.FURNACE_HEATED;
        if (seq === 'WAIT_CONTINUE_BELLOWS') {
            return currentStep === 0 ? SCRIPTS.FURNACE_COOLING : SCRIPTS.FURNACE_BELLOWS_MONO;
        }
        if (seq === 'WAIT_PUMP') return SCRIPTS.FURNACE_PUMP_PROMPT;
        if (seq === 'FINAL_TALK') return SCRIPTS.FURNACE_MAXED;
        return { text: "..." };
    }, [isStarted, mode, currentStep, seq]);

    const handleNext = () => {
        if (mode === 'PROLOGUE') {
            if (currentStep < 4) setCurrentStep(prev => prev + 1);
            else actions.completePrologue();
        } else {
            if (seq === 'POST_REPLACE_TALK') {
                if (currentStep < 1) setCurrentStep(prev => prev + 1);
                else setSeq('WAIT_HEAT');
            } else if (seq === 'HEAT_CONFIRM') {
                setSeq('WAIT_CONTINUE_BELLOWS');
                setCurrentStep(0);
            } else if (seq === 'WAIT_CONTINUE_BELLOWS') {
                if (currentStep < 1) setCurrentStep(prev => prev + 1);
                else setSeq('WAIT_PUMP');
            } else if (seq === 'FINAL_TALK') {
                actions.setTutorialScene(null);
                actions.setTutorialStep('CRAFT_PROMPT');
            }
        }
    };

    const handleConfirmSkip = () => {
        actions.completeTutorial();
        setShowSkipConfirm(false);
    };

    const promptText = mode === 'FURNACE_RESTORED' ? "REPLACE FURNACE" : "TAP TO BEGIN";

    return (
        <div 
            className="fixed inset-0 z-[3000] bg-stone-950 overflow-hidden flex flex-col items-center justify-center cursor-pointer"
            onClick={handleStart}
        >
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

            <div className="absolute inset-0 z-0 pointer-events-none">
                <img src={getAssetUrl(bgImage)} className="w-full h-full object-cover opacity-80 scale-105" alt="Forge Background" />
                <div className="absolute inset-0 bg-black/30"></div>
            </div>

            <div className="absolute top-4 right-4 z-[6000] pointer-events-auto">
                <button onClick={(e) => { e.stopPropagation(); setShowSkipConfirm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-50 hover:text-stone-300 rounded-full transition-all text-[11px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md group">
                    <FastForward className="w-3.5 h-3.5 group-hover:animate-pulse" /> Skip Tutorial
                </button>
            </div>

            {showFlash && <div className="absolute inset-0 z-[4000] bg-white animate-flash-out pointer-events-none"></div>}

            {!isStarted && !showFlash && (
                <div className="relative z-20 flex flex-col items-center animate-pulse pointer-events-none">
                    <span className="text-amber-500 font-black uppercase tracking-[0.4em] text-[10px] md:text-sm drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">{promptText}</span>
                </div>
            )}

            {isStarted && (seq === 'WAIT_HEAT' || seq === 'WAIT_PUMP') && (
                <LocalSpotlight step={seq} hasPumpedOnce={hasPumpedOnce} />
            )}

            {isStarted && mode === 'FURNACE_RESTORED' && (
                <div className="absolute top-[15dvh] right-[5vw] z-[3040] flex flex-col items-center gap-6 animate-in slide-in-from-right-8 duration-700 pointer-events-auto">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-stone-300 uppercase tracking-tighter mb-2 font-mono drop-shadow-md">{Math.floor(20 + (temp / 100) * 1480)}°C</span>
                        <div className="w-7 h-48 md:h-64 bg-stone-950 rounded-full border-2 border-stone-800 relative shadow-2xl overflow-hidden">
                            <div className="absolute inset-1 rounded-full overflow-hidden">
                                <div className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-300 ${temp < 30 ? 'bg-blue-600' : temp > 80 ? 'bg-red-600 animate-pulse' : 'bg-amber-500'}`} style={{ height: `${temp}%` }} />
                            </div>
                        </div>
                    </div>

                    <button id="tutorial-bellows" onClick={(e) => { e.stopPropagation(); handlePump(); }} disabled={seq !== 'WAIT_PUMP'} className={`w-16 h-16 md:w-24 md:h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all shadow-2xl relative overflow-hidden group ${seq === 'WAIT_PUMP' ? 'bg-stone-800 border-amber-500 animate-pulse' : 'bg-stone-900 border-stone-800 grayscale opacity-40'} ${isPumping ? 'scale-90 brightness-150' : 'hover:scale-105'}`}>
                        <Zap className={`w-6 h-6 md:w-10 md:h-10 ${seq === 'WAIT_PUMP' ? 'text-amber-400' : 'text-stone-600'}`} />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter mt-1">Pump</span>
                    </button>

                    <button id="tutorial-heat" onClick={(e) => { e.stopPropagation(); handleHeatUp(); }} disabled={seq !== 'WAIT_HEAT'} className={`w-14 h-14 md:w-20 md:h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all shadow-2xl ${seq === 'WAIT_HEAT' ? 'bg-orange-900/60 border-orange-500 shadow-orange-500/20' : 'bg-stone-900 border-stone-800 grayscale opacity-40'}`}>
                        <Flame className={`w-5 h-5 md:w-8 md:h-8 ${seq === 'WAIT_HEAT' ? 'text-orange-400' : 'text-stone-600'}`} />
                        <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest mt-1">Ignite</span>
                    </button>
                </div>
            )}

            {isStarted && (
                <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl z-[5000] pointer-events-none">
                    <DialogueBox speaker={mode === 'PROLOGUE' || seq !== 'FINAL_TALK' ? "Lockhart" : "Master Smith"} text={dialogue.text} options={['WAIT_HEAT', 'WAIT_PUMP'].includes(seq) ? [] : [{ label: "Continue", action: handleNext, variant: 'primary' }]} className="w-full relative pointer-events-auto" />
                </div>
            )}

            <ConfirmationModal isOpen={showSkipConfirm} title="Skip Tutorial?" message="Are you sure you want to skip the introduction and go straight to the forge? All basic systems will be unlocked." confirmLabel="Skip Everything" cancelLabel="Keep Playing" onConfirm={handleConfirmSkip} onCancel={() => setShowSkipConfirm(false)} isDanger={true} />
        </div>
    );
};

export default TutorialScene;