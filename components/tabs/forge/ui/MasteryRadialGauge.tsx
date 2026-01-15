
import React from 'react';
import { Star } from 'lucide-react';

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
}

const MasteryRadialGauge: React.FC<MasteryRadialGaugeProps> = ({ imageUrl, masteryInfo }) => {
    return (
        <div className="relative mb-3 md:mb-6 group mx-auto">
            <div className={`w-24 h-24 md:w-48 md:h-48 bg-stone-900 rounded-full flex items-center justify-center relative z-10 p-2 md:p-4 border border-stone-800/50 ${masteryInfo?.glowClass} transition-all duration-700`}>
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
                <img src={imageUrl} className="w-14 h-14 md:w-32 md:h-32 object-contain drop-shadow-2xl z-20 relative transform group-hover:scale-110 transition-transform duration-500" />
                
                <div className={`absolute -bottom-1 -right-1 md:bottom-2 md:right-2 z-30 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full border border-stone-700 bg-stone-900 shadow-xl flex items-center gap-1 animate-in slide-in-from-right-2 duration-700`}>
                    <Star className={`w-2 h-2 md:w-3 md:h-3 ${masteryInfo?.colorClass.replace('stroke-', 'fill-')}`} />
                    <span className={`text-[7px] md:text-[10px] font-black uppercase tracking-tighter ${masteryInfo?.colorClass.replace('stroke-', 'text-')}`}>{masteryInfo?.label}</span>
                </div>
            </div>
        </div>
    );
};

export default MasteryRadialGauge;
