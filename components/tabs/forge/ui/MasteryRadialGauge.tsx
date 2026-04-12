
import React from 'react';
import { RefreshCw, Star } from 'lucide-react';
import { SfxButton } from '../../../common/ui/SfxButton';

interface MasteryRadialGaugeProps {
    imageUrl: string;
    masteryInfo: {
        label: string;
        colorClass: string;
        glowClass: string;
        progress: number;
        circumference: number;
        offset: number;
        count: number;
    } | null;
    onOpenRecipes?: () => void;
}

const MasteryRadialGauge: React.FC<MasteryRadialGaugeProps> = ({ imageUrl, masteryInfo, onOpenRecipes }) => {
    return (
        <div className="relative mb-4 md:mb-7 group mx-auto">
            <div className={`w-28 h-28 md:w-52 md:h-52 bg-stone-900 rounded-full flex items-center justify-center relative z-10 p-2.5 md:p-4.5 border border-stone-800/50 ${masteryInfo?.glowClass} transition-all duration-700`}>
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-stone-950/40" />
                    <circle 
                        cx="50" cy="50" r="46" 
                        stroke="currentColor" strokeWidth="4" fill="transparent"
                        strokeDasharray={masteryInfo?.circumference}
                        strokeDashoffset={masteryInfo?.offset}
                        strokeLinecap="round"
                        className={`${masteryInfo?.colorClass} transition-all duration-1000 ease-out`}
                    />
                </svg>
                <img src={imageUrl} className="w-16 h-16 md:w-36 md:h-36 object-contain drop-shadow-2xl z-20 relative transform group-hover:scale-110 transition-transform duration-500" />
                
                {onOpenRecipes && (
                    <SfxButton
                        sfx="switch"
                        onClick={onOpenRecipes}
                        className="absolute -top-2 -right-2 md:top-1 md:right-1 z-40 w-8 h-8 md:w-10 md:h-10 rounded-full border border-stone-600 bg-stone-900/95 text-stone-200 shadow-lg flex items-center justify-center transition-all hover:bg-stone-800 active:scale-95"
                    >
                        <RefreshCw className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                    </SfxButton>
                )}

                <div className={`absolute -bottom-1 -right-1 md:bottom-2 md:right-2 z-30 px-2 py-1 md:px-3 md:py-1.5 rounded-full border border-stone-700 bg-stone-900 shadow-xl flex items-center gap-1.5 animate-in slide-in-from-right-2 duration-700`}>
                    <Star className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${masteryInfo?.colorClass.replace('stroke-', 'fill-')}`} />
                    <span className={`text-[8px] md:text-[11px] font-black uppercase tracking-tight ${masteryInfo?.colorClass.replace('stroke-', 'text-')}`}>{masteryInfo?.label}</span>
                </div>
            </div>
        </div>
    );
};

export default MasteryRadialGauge;
