
import React from 'react';
import { Zap } from 'lucide-react';

export const StaminaBattery = ({ value }: { value: number }) => {
    let color = 'bg-white';
    if (value < 20) color = 'bg-red-500 animate-pulse';
    else if (value < 50) color = 'bg-stone-300';

    const segments = [20, 40, 60, 80, 100];

    return (
        <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-fit">
            <Zap className={`w-2.5 h-2.5 ${value < 20 ? 'text-red-500 animate-pulse' : 'text-stone-100'}`} />
            <div className="flex items-center gap-0.5 h-2 px-0.5 border-x border-stone-700/50">
                {segments.map((threshold, idx) => (
                    <div 
                        key={idx}
                        className={`h-1.5 w-1 rounded-[0.5px] transition-all duration-500 ${value >= threshold ? color : 'bg-stone-800'}`}
                    />
                ))}
            </div>
        </div>
    );
};
