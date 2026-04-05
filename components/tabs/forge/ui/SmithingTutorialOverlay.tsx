
import React, { useState, useEffect, useMemo } from 'react';
import { Pointer } from 'lucide-react';
import DialogueBox from '../../../DialogueBox';
import { useGame } from '../../../../context/GameContext';
import { t } from '../../../../utils/i18n';
import { getPlayerName } from '../../../../utils/gameText';

interface SmithingTutorialOverlayProps {
    step: string;
    targetCoord: { x: number, y: number, w: number, h: number } | null;
    strikePromptVisible?: boolean;
    onResume?: () => void;
}

export const SmithingTutorialOverlay: React.FC<SmithingTutorialOverlayProps> = ({ 
    step, 
    targetCoord, 
    strikePromptVisible = false,
    onResume
}) => {
    const { actions, state } = useGame();
    const language = state.settings.language;
    const playerName = getPlayerName(state);
    const [animatedRadius, setAnimatedRadius] = useState(2000);
    const [isDismissed, setIsDismissed] = useState(false);
    
    // 단계가 변경될 때마다 다시 노출되도록 초기화
    useEffect(() => {
        setIsDismissed(false);
    }, [step]);

    const script = useMemo(() => {
        if (step === 'SMITHING_INTRO_DIALOG_GUIDE') 
            return t(language, 'smithingTutorial.dialogue.pre_first_hit');
        if (step === 'FIRST_HIT_DIALOG_GUIDE') 
            return t(language, 'smithingTutorial.dialogue.first_hit');
        return "";
    }, [step, language]);

    const showDialogue = step === 'SMITHING_INTRO_DIALOG_GUIDE' || step === 'FIRST_HIT_DIALOG_GUIDE';
    const isIndicateStep = step === 'SMITHING_MINIGAME_HIT_GUIDE';
    const shouldShowMask = !isDismissed && !!targetCoord && isIndicateStep;
    const isMaskHidden = !shouldShowMask;
    
    useEffect(() => {
        if (!targetCoord || !isIndicateStep) {
            setAnimatedRadius(2000);
            return;
        }
        
        const targetR = Math.max(targetCoord.w, targetCoord.h) / 1.1;
        const startTime = performance.now();
        const duration = 1300;
        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setAnimatedRadius(2000 - (2000 - targetR) * easeOut);
            if (progress < 1) requestAnimationFrame(animate);
        };
        const rid = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rid);
    }, [step, targetCoord?.x, targetCoord?.y, targetCoord?.w, targetCoord?.h, isIndicateStep]);

    if (!script && !isIndicateStep) return null;

    const centerX = targetCoord?.x || 0;
    const centerY = targetCoord?.y || 0;
    const w = targetCoord?.w || 0;
    const h = targetCoord?.h || 0;

    return (
        <div className="fixed inset-0 z-[5000] pointer-events-none overflow-hidden">
            <style>{`
                @keyframes bounce-x-reverse { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-12px); } }
                .animate-bounce-x-reverse { animation: bounce-x-reverse 1s infinite; }
            `}</style>

            {/* 암전 효과 (Mask) - INDICATE 단계에서만 강조 서클 노출 */}
            <svg className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700 ${isMaskHidden ? 'opacity-0' : 'opacity-100'}`}>
                <defs>
                    <mask id="smithing-tutorial-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {shouldShowMask && (
                            <circle cx={centerX} cy={centerY} r={animatedRadius} fill="black" />
                        )}
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#smithing-tutorial-mask)" />
            </svg>

            {/* 클릭 방지 월 및 가이드 포인터 - 지시 단계(INDICATE)에서만 노출 */}
            {shouldShowMask && (
                <>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full pointer-events-auto" style={{ height: centerY - h/2 }} />
                        <div className="absolute left-0 w-full pointer-events-auto" style={{ top: centerY + h/2, bottom: 0 }} />
                        <div className="absolute top-0 left-0 pointer-events-auto" style={{ top: centerY - h/2, height: h, width: centerX - w/2 }} />
                        <div className="absolute top-0 pointer-events-auto" style={{ top: centerY - h/2, height: h, left: centerX + w/2, right: 0 }} />
                    </div>
                    {strikePromptVisible && (
                        <div className="absolute animate-in fade-in zoom-in-95 duration-300" style={{ left: centerX - w/2 - 12, top: centerY, transform: 'translate(-100%, -50%)' }}>
                            <div className="flex items-center flex-row-reverse animate-bounce-x-reverse">
                                <Pointer className="w-8 h-8 md:w-12 md:h-12 text-amber-400 fill-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" style={{ transform: 'rotate(90deg)' }} />
                                <div className="mr-3 px-4 py-1.5 bg-amber-600 text-white text-[10px] md:text-xs font-black uppercase rounded-full shadow-2xl border-2 border-amber-400 whitespace-nowrap">
                                    {t(language, 'smithingTutorial.indicator.strike')}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 대화창 - showDialogue 조건에 따라 노출 */}
            {!isDismissed && showDialogue && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-4xl pointer-events-none z-[6000]">
                    <DialogueBox 
                        speaker={playerName}
                        text={script} 
                        options={[
                            { 
                                label: step === 'FIRST_HIT_DIALOG_GUIDE' ? t(language, 'smithingTutorial.option_ready') : t(language, 'common.continue'), 
                                action: () => {
                                    if (step === 'SMITHING_INTRO_DIALOG_GUIDE') {
                                        actions.setTutorialStep('SMITHING_MINIGAME_HIT_GUIDE');
                                        setIsDismissed(true);
                                        if (onResume) onResume();
                                    } else if (step === 'FIRST_HIT_DIALOG_GUIDE') {
                                        actions.setTutorialStep('SMITHING_MINIGAME_HIT_GUIDE');
                                        setIsDismissed(true);
                                        if (onResume) onResume();
                                    } else {
                                        setIsDismissed(true);
                                    }
                                }, 
                                variant: 'primary' 
                            }
                        ]} 
                        className="w-full relative pointer-events-auto" 
                    />
                </div>
            )}
        </div>
    );
};
