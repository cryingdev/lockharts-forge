
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Pointer } from 'lucide-react';
import DialogueBox from '../../../DialogueBox';
import { useGame } from '../../../../context/GameContext';
import { GameState } from '../../../../types/game-state';

/**
 * 마켓 튜토리얼 전용 단계 타입
 * GameState의 tutorialStep 중 마켓 관련 단계만 추출
 */
export type SequenceStep = Extract<GameState['tutorialStep'], 
    'BROWSE_GOODS_GUIDE' | 
    'FURNACE_GUIDE' | 
    'OPEN_SHOPPING_CART' | 
    'CLOSE_SHOPPING_CART' | 
    'PAY_NOW' | 
    'GARRICK_AFTER_PURCHASE_DIALOG' | 
    'LEAVE_MARKET_GUIDE'
>;

interface StepConfig {
    targetId: string;
    label: string;
    direction: 'top' | 'bottom' | 'left' | 'right';
}

const SCENE_STEPS_CONFIG: Record<SequenceStep, StepConfig> = {
    BROWSE_GOODS_GUIDE: { targetId: 'BROWSE_GOODS_BUTTON', label: 'Browse Goods', direction: 'top' },
    FURNACE_GUIDE: { targetId: 'FURNACE_ITEM', label: 'Select the Furnace', direction: 'bottom' },
    OPEN_SHOPPING_CART: { targetId: 'CART_TOGGLE', label: 'Open the Cart', direction: 'left' },
    CLOSE_SHOPPING_CART: { targetId: 'CART_TOGGLE', label: 'Close the Cart', direction: 'right' },
    PAY_NOW: { targetId: 'PAY_NOW_BUTTON', label: 'Finalize Purchase', direction: 'bottom' },
    GARRICK_AFTER_PURCHASE_DIALOG: { targetId: 'GARRICK_TALK_BUTTON', label: 'Talk to Garrick', direction: 'top' },
    LEAVE_MARKET_GUIDE: { targetId: 'MARKET_BACK_BUTTON', label: 'Return to Forge', direction: 'bottom' },
};

const SCRIPTS: Record<SequenceStep, { speaker: string; text: string }> = {
    BROWSE_GOODS_GUIDE: { speaker: "Garrick", text: "Welcome back, smith! Open up my catalog and see what catches your eye." },
    FURNACE_GUIDE: { speaker: "Garrick", text: "There it is! Not as grand as your old one, but it'll bring the fire back." },
    OPEN_SHOPPING_CART: { speaker: "Garrick", text: "Going to settle the bill? Open your cart on the right." },
    CLOSE_SHOPPING_CART: { speaker: "Garrick", text: "Now close the list so we can talk business." },
    PAY_NOW: { speaker: "Garrick", text: "Hand over the coin, and the future is yours." },
    GARRICK_AFTER_PURCHASE_DIALOG: { speaker: "Lockhart", text: "I should say goodbye to Garrick before I leave." },
    LEAVE_MARKET_GUIDE: { speaker: "Garrick", text: "Safe travels, Lockhart. Don't let those embers go cold again." },
};

export const MarketTutorialOverlay = ({ step }: { step: SequenceStep }) => {
    const { actions } = useGame();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [animatedRadius, setAnimatedRadius] = useState(2000);
    const requestRef = useRef<number | null>(null);
    const config = SCENE_STEPS_CONFIG[step];
    const script = SCRIPTS[step];

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
    }, [!!targetRect]);

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
            animationClass = 'animate-bounce-reverse';
            containerLayout = 'flex-col-reverse';
            labelMargin = 'mb-3';
            break;
        case 'bottom':
            pointerStyles = { left: centerX, top: top + height + cardinalBuffer, transform: 'translateX(-50%)' };
            iconRotation = 'rotate(0deg)';
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

    // 대화 위주의 안내 단계에서는 배경 암전 효과를 숨깁니다.
    const isDialogueStep = step === 'BROWSE_GOODS_GUIDE' || step === 'GARRICK_AFTER_PURCHASE_DIALOG' || step === 'LEAVE_MARKET_GUIDE';

    return (
        <div className="fixed inset-0 z-[4000] pointer-events-none overflow-hidden">
            {/* Visual Darkening Mask */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="m-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {targetRect && <circle cx={centerX} cy={centerY} r={animatedRadius} fill="black" />}
                    </mask>
                </defs>
                <rect 
                    width="100%" 
                    height="100%" 
                    fill="rgba(0,0,0,0.75)" 
                    mask="url(#m-mask)" 
                    className={`transition-opacity duration-700 ${isDialogueStep ? 'opacity-0' : 'opacity-100'}`}
                />
            </svg>

            {/* Logical Interaction Walls (Blocking 4 sides around the target) */}
            {targetRect && (
                <div className="absolute inset-0 pointer-events-none">
                    {/* Top wall */}
                    <div className="absolute top-0 left-0 w-full pointer-events-auto" style={{ height: top }} />
                    {/* Bottom wall */}
                    <div className="absolute left-0 w-full pointer-events-auto" style={{ top: top + height, bottom: 0 }} />
                    {/* Left wall */}
                    <div className="absolute top-0 left-0 pointer-events-auto" style={{ top, height, width: left }} />
                    {/* Right wall */}
                    <div className="absolute top-0 pointer-events-auto" style={{ top, height, left: left + width, right: 0 }} />
                </div>
            )}
            
            {targetRect && (
                <div className="absolute animate-in fade-in zoom-in-95 duration-300" style={pointerStyles}>
                    <div className={`flex items-center ${containerLayout} ${animationClass}`}>
                        <Pointer className="w-8 h-8 md:w-12 md:h-12 text-amber-400 fill-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" style={{ transform: iconRotation }} />
                        <div className={`${labelMargin} px-4 py-1.5 bg-amber-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full shadow-2xl border-2 border-amber-400 whitespace-nowrap`}>
                            {config.label}
                        </div>
                    </div>
                </div>
            )}

            {script && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-4xl pointer-events-none z-[5000]">
                    <DialogueBox 
                        speaker={script.speaker} 
                        text={script.text} 
                        options={
                            step === 'BROWSE_GOODS_GUIDE' 
                                ? [{ label: "Browse", action: () => actions.setTutorialStep('FURNACE_GUIDE'), variant: 'primary' }] 
                                : step === 'GARRICK_AFTER_PURCHASE_DIALOG' 
                                    ? [{ label: "Talk", action: () => actions.setTutorialStep('LEAVE_MARKET_GUIDE'), variant: 'primary' }] 
                                    : []
                        } 
                        className="w-full relative pointer-events-auto"
                    />
                </div>
            )}
        </div>
    );
};
