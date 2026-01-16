
import React, { useState, useEffect, useMemo } from 'react';
import { Pointer } from 'lucide-react';
import DialogueBox from '../../../DialogueBox';
import { useGame } from '../../../../context/GameContext';

interface SmithingTutorialOverlayProps {
    step: string;
    targetCoord: { x: number, y: number, w: number, h: number } | null;
    onResume?: () => void;
}

export const SmithingTutorialOverlay: React.FC<SmithingTutorialOverlayProps> = ({ 
    step, 
    targetCoord, 
    onResume 
}) => {
    const { actions } = useGame();
    const [animatedRadius, setAnimatedRadius] = useState(2000);
    const [isDismissed, setIsDismissed] = useState(false);
    
    // 단계가 변경될 때마다 다시 노출되도록 초기화
    useEffect(() => {
        setIsDismissed(false);
    }, [step]);

    const script = useMemo(() => {
        if (step === 'PRE_IGNITE_DIALOG_1' || step === 'START_FORGING_GUIDE') 
            return "The furnace stands ready, but the hearth is cold. I must strike the flint and wake the fire to life.";
        if (step === 'PRE_IGNITE_DIALOG_2' || step === 'PRE_IGNITE_INDICATE') 
            return "Tap the Ignite button on the right, it will heat furnace up and be ready.";
        if (step === 'PRE_PUMP_DIALOG') 
            return "The flame has taken, but it is weak and gasping. It needs breath—the steady rhythm of the bellows—to reach forging heat.";
        if (step === 'PRE_PUMP_INDICATE' || step === 'SMITHING_MINIGAME_PUMP') 
            return "Pump the bellows repeatedly. Feed the fire until the gauge reaches its peak and the stone begins to hum.";
        if (step === 'POST_PUMP_DIALOG')
            return "The steel glows with the heat of a dying star! It's perfectly tempered. Now, I must strike while the iron is hot.";
        
        if (step === 'SMITHING_MINIGAME_HIT') 
            return "The steel glows with the color of the rising sun! Tap the target rings as they shrink to strike. Precision is our legacy.";
        
        if (step === 'FIRST_HIT_DIALOG') 
            return "Magnificent! The sound of steel on steel... it sings. Keep striking until the blade finds its form.";
        
        return "";
    }, [step]);

    // 하이라이트 원 애니메이션 로직
    // DIALOG 단계에서는 다이얼로그만 보여주고, INDICATE 단계부터 버튼을 강조합니다.
    const isTextOnlyStep = step.includes('_DIALOG') || step === 'START_FORGING_GUIDE';
    const isIndicateStep = step.includes('_INDICATE') || step.startsWith('SMITHING_MINIGAME');
    
    useEffect(() => {
        // 지시 단계(INDICATE)가 아니고 타겟 좌표가 없으면 원을 크게 유지
        if (!targetCoord || !isIndicateStep || step === 'SMITHING_MINIGAME_HIT' || step === 'POST_PUMP_DIALOG') {
            setAnimatedRadius(2000);
            return;
        }
        
        // 지시 단계일 때만 스포트라이트 애니메이션 실행
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
    }, [step, !!targetCoord, isIndicateStep]);

    if (!script && !isIndicateStep) return null;

    const centerX = targetCoord?.x || 0;
    const centerY = targetCoord?.y || 0;
    const w = targetCoord?.w || 0;
    const h = targetCoord?.h || 0;

    /**
     * 암전 마스크 숨김 조건:
     * 1. 명시적 닫힘 상태
     * 2. 대화창만 강조하는 텍스트 전용 단계 (마스크는 INDICATE에서만 버튼을 비춤)
     * 3. 첫 타격 대기 단계 (TOUCH TO START 안내를 가리지 않기 위함)
     */
    const isMaskHidden = isDismissed || isTextOnlyStep || step === 'SMITHING_MINIGAME_HIT';

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
                        {targetCoord && isIndicateStep && step !== 'SMITHING_MINIGAME_HIT' && step !== 'POST_PUMP_DIALOG' && (
                            <circle cx={centerX} cy={centerY} r={animatedRadius} fill="black" />
                        )}
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#smithing-tutorial-mask)" />
            </svg>

            {/* 클릭 방지 월 및 가이드 포인터 - 지시 단계(INDICATE)에서만 노출 */}
            {!isDismissed && targetCoord && isIndicateStep && step !== 'SMITHING_MINIGAME_HIT' && step !== 'POST_PUMP_DIALOG' && (
                <>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full pointer-events-auto" style={{ height: centerY - h/2 }} />
                        <div className="absolute left-0 w-full pointer-events-auto" style={{ top: centerY + h/2, bottom: 0 }} />
                        <div className="absolute top-0 left-0 pointer-events-auto" style={{ top: centerY - h/2, height: h, width: centerX - w/2 }} />
                        <div className="absolute top-0 pointer-events-auto" style={{ top: centerY - h/2, height: h, left: centerX + w/2, right: 0 }} />
                    </div>
                    <div className="absolute animate-in fade-in zoom-in-95 duration-300" style={{ left: centerX - w/2 - 12, top: centerY, transform: 'translate(-100%, -50%)' }}>
                        <div className="flex items-center flex-row-reverse animate-bounce-x-reverse">
                            <Pointer className="w-8 h-8 md:w-12 md:h-12 text-amber-400 fill-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" style={{ transform: 'rotate(90deg)' }} />
                            <div className="mr-3 px-4 py-1.5 bg-amber-600 text-white text-[10px] md:text-xs font-black uppercase rounded-full shadow-2xl border-2 border-amber-400 whitespace-nowrap">
                                {step.includes('IGNITE') ? 'Ignite' : step.includes('PUMP') ? 'Pump' : 'Strike!'}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 대화창 - DIALOG 단계에서만 노출 (INDICATE 시 숨김) */}
            {!isDismissed && isTextOnlyStep && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-4xl pointer-events-none z-[6000]">
                    <DialogueBox 
                        speaker="Lockhart" 
                        text={script} 
                        options={[
                            { 
                                label: (step === 'SMITHING_MINIGAME_HIT' || step === 'FIRST_HIT_DIALOG') ? "I'm ready" : "Continue", 
                                action: () => {
                                    if (step === 'PRE_IGNITE_DIALOG_1' || step === 'START_FORGING_GUIDE') {
                                        actions.setTutorialStep('PRE_IGNITE_DIALOG_2');
                                    } else if (step === 'PRE_IGNITE_DIALOG_2') {
                                        actions.setTutorialStep('PRE_IGNITE_INDICATE');
                                    } else if (step === 'PRE_PUMP_DIALOG') {
                                        actions.setTutorialStep('PRE_PUMP_INDICATE');
                                    } else if (step === 'POST_PUMP_DIALOG') {
                                        actions.setTutorialStep('SMITHING_MINIGAME_HIT');
                                    } else if (step === 'FIRST_HIT_DIALOG') {
                                        // 첫 타격 성공 다이얼로그 종료 시 타격 단계로 원복하여 게임 로직 재개
                                        actions.setTutorialStep('SMITHING_MINIGAME_HIT');
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
