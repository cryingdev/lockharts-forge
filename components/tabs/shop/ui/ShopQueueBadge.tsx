import React from 'react';
import { Users } from 'lucide-react';

interface ShopQueueBadgeProps {
    count: number;
}

export const ShopQueueBadge: React.FC<ShopQueueBadgeProps> = ({ count }) => {
    return (
        <div className="absolute top-36 md:top-48 right-4 z-50 flex items-center gap-1.5 md:gap-2 bg-stone-900/90 px-2 md:px-4 py-1 md:py-1.5 rounded-xl border border-stone-700 text-stone-200 shadow-xl backdrop-blur-md transition-all duration-500">
            <div className="bg-stone-800 p-1 md:p-1.5 rounded-full">
                <Users className="w-3 h-3 md:w-5 md:h-5 text-amber-500" />
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-[7px] md:text-[9px] text-stone-500 font-bold uppercase tracking-wider">Queue</span>
                <span className="text-sm md:text-lg font-bold font-mono">{count}</span>
            </div>
        </div>
    );
};