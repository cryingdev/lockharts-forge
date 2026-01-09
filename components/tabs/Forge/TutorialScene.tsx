
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGame } from '../../../context/GameContext';
import DialogueBox from '../../DialogueBox';
import { getAssetUrl } from '../../../utils';
import { TutorialSceneMode } from '../../../types/game-state';
import { Flame, Zap, Pointer, FastForward } from 'lucide-react';
import ConfirmationModal from '../../modals/ConfirmationModal';

type SequenceStep = 
    | 'IDLE' 
    | 'POST_REPLACE_TALK' 
    | 'WAIT_HEAT' 
    | 'HEAT_CONFIRM' 
    | 'WAIT_CONTINUE_BELLOWS' 
    | 'WAIT_PUMP' 
    | 'FINAL_TALK';

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

const LocalSpotlight = ({ targetId, label }: { targetId: string, label: string }) => {
    const [rect, setRect] = useState<DOMRect | null>(null);
    
    useEffect(() => {
        const update = () => {
            const el = document.getElementById(targetId);
            if (el) setRect(el.getBoundingClientRect());
        };
        update();
        const interval = setInterval(update, 100);
        return () => clearInterval(interval);
    }, [targetId]);

    if (!rect) return null;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(rect.width, rect.height) / 1.2;

    return (
        <div className="fixed inset-0 z-[3050] pointer-events-none">
            <svg className="absolute inset-0 w-full h-full">
                <defs>
                    <mask id="local-spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <circle cx={centerX} cy={centerY} r={radius} fill="black" />
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#local-spotlight-mask)" />
            </svg>
            <div className="absolute animate-bounce flex flex-col items-center" style={{ left: centerX, top: rect.bottom + 20, transform: 'translateX(-50%)' }}>
                <Pointer className="w-10 h-10 text-amber-400 drop-shadow-lg" />
                <div className="mt-2 px-3 py-1 bg-amber-600 text-white text-[10px] font-black uppercase rounded-full border border-amber-400 shadow-xl">{label}</div>
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
            }, 200);
            setTimeout(() => setShowFlash(false), 1000);
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
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <img key={bgImage} src={getAssetUrl(bgImage)} className="w-full h-full object-cover opacity-60 transition-all duration-1000 scale-105" />
                <div className="absolute inset-0 bg-stone-950/20 backdrop-blur-[1px]"></div>
            </div>

            {/* Atmosphere */}
            <div className="absolute inset-0 pointer-events-none z-10">
                <div className="w-full h-full bg-amber-900/5 animate-pulse"></div>
            </div>

            {/* Skip Button */}
            <div className="absolute top-4 left-4 z-[4000] pointer-events-auto">
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowSkipConfirm(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-500 hover:text-stone-300 rounded-full transition-all text-[11px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md group"
                >
                    <FastForward className="w-3.5 h-3.5 group-hover:animate-pulse" />
                    Skip Tutorial
                </button>
            </div>

            {/* Flash Effect */}
            {showFlash && <div className="absolute inset-0 z-[4000] bg-white animate-flash-out pointer-events-none"></div>}

            {/* Initial Text Prompt */}
            {!isStarted && !showFlash && (
                <div className="relative z-20 flex flex-col items-center animate-pulse pointer-events-none">
                    <span className="text-amber-500 font-black uppercase tracking-[0.4em] text-[10px] md:text-sm drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                        {promptText}
                    </span>
                </div>
            )}

            {/* Controls Panel */}
            {isStarted && mode === 'FURNACE_RESTORED' && (
                <div className="absolute top-[15dvh] right-[5vw] z-[3040] flex flex-col items-center gap-6 animate-in slide-in-from-right-8 duration-700 pointer-events-auto">
                    {/* Temp Gauge */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-stone-500 uppercase tracking-tighter mb-2 font-mono">
                            {Math.floor(20 + (temp / 100) * 1480)}°C
                        </span>
                        <div className="w-7 h-48 md:h-64 bg-stone-950 rounded-full border-2 border-stone-800 p-1 relative shadow-2xl">
                            <div 
                                className={`absolute bottom-1 left-1 right-1 rounded-full transition-all duration-300 ${temp < 30 ? 'bg-blue-600' : temp > 80 ? 'bg-red-600 animate-pulse' : 'bg-amber-500'}`}
                                style={{ height: `${temp}%`, minHeight: '4px' }}
                            />
                        </div>
                    </div>

                    {/* Bellows */}
                    <button 
                        id="tutorial-bellows"
                        onClick={(e) => { e.stopPropagation(); handlePump(); }}
                        disabled={seq !== 'WAIT_PUMP'}
                        className={`w-16 h-16 md:w-24 md:h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all shadow-2xl relative overflow-hidden group
                            ${seq === 'WAIT_PUMP' ? 'bg-stone-800 border-amber-500 animate-pulse' : 'bg-stone-900 border-stone-800 grayscale opacity-40'}
                            ${isPumping ? 'scale-90 brightness-150' : 'hover:scale-105'}
                        `}
                    >
                        <Zap className={`w-6 h-6 md:w-10 md:h-10 ${seq === 'WAIT_PUMP' ? 'text-amber-400' : 'text-stone-600'}`} />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter mt-1">Pump</span>
                    </button>

                    {/* Heat Up */}
                    <button 
                        id="tutorial-heat"
                        onClick={(e) => { e.stopPropagation(); handleHeatUp(); }}
                        disabled={seq !== 'WAIT_HEAT'}
                        className={`w-14 h-14 md:w-20 md:h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all shadow-2xl
                            ${seq === 'WAIT_HEAT' ? 'bg-orange-900/60 border-orange-500 shadow-orange-500/20' : 'bg-stone-900 border-stone-800 grayscale opacity-40'}
                        `}
                    >
                        <Flame className={`w-5 h-5 md:w-8 md:h-8 ${seq === 'WAIT_HEAT' ? 'text-orange-400' : 'text-stone-600'}`} />
                        <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest mt-1">Ignite</span>
                    </button>
                </div>
            )}

            {/* Dialogue Box */}
            {isStarted && (
                <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl z-50 pointer-events-none">
                    <DialogueBox 
                        speaker={mode === 'PROLOGUE' || seq !== 'FINAL_TALK' ? "Lockhart" : "Master Smith"}
                        text={dialogue.text}
                        options={['WAIT_HEAT', 'WAIT_PUMP'].includes(seq) ? [] : [
                            { label: "Continue", action: handleNext, variant: 'primary' }
                        ]}
                        className="w-full relative pointer-events-auto"
                    />
                </div>
            )}

            {/* Local Spotlights */}
            {isStarted && seq === 'WAIT_HEAT' && <LocalSpotlight targetId="tutorial-heat" label="Ignite Furnace" />}
            {isStarted && seq === 'WAIT_PUMP' && <LocalSpotlight targetId="tutorial-bellows" label="Pump Bellows" />}

            <ConfirmationModal 
                isOpen={showSkipConfirm}
                title="Skip Tutorial?"
                message="Are you sure you want to skip the introduction and go straight to the forge? All basic systems will be unlocked."
                confirmLabel="Skip Everything"
                cancelLabel="Keep Playing"
                onConfirm={handleConfirmSkip}
                onCancel={() => setShowSkipConfirm(false)}
                isDanger={true}
            />

            <style>{`
                @keyframes flash-out { 0% { opacity: 0; } 20% { opacity: 1; } 100% { opacity: 0; } }
                .animate-flash-out { animation: flash-out 0.8s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default TutorialScene;
