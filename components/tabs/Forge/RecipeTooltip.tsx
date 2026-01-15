import React from 'react';
import { EquipmentItem } from '../../../types/index';
import { materials } from '../../../data/materials';

interface RecipeTooltipProps {
    item: EquipmentItem;
    pos: { x: number; y: number };
    getInventoryCount: (id: string) => number;
}

const RecipeTooltip: React.FC<RecipeTooltipProps> = ({ item, pos, getInventoryCount }) => {
    return (
        <div 
            className="fixed z-[3000] pointer-events-none p-3 bg-stone-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-40 md:w-64 animate-in fade-in zoom-in-95 duration-200"
            style={{ left: pos.x, top: pos.y }}
        >
            <h4 className="text-[10px] md:text-sm font-black text-amber-500 uppercase font-serif mb-2">{item.name}</h4>
            <div className="space-y-2">
                <h5 className="text-[7px] md:text-[9px] font-black text-stone-500 uppercase tracking-widest border-b border-white/5 pb-1">Required Materials</h5>
                <div className="grid gap-1">
                    {item.requirements.map(req => {
                        const hasCount = getInventoryCount(req.id);
                        const isEnough = hasCount >= req.count;
                        const mat = Object.values(materials).find(m => m.id === req.id);
                        return (
                            <div key={req.id} className="flex justify-between items-center text-[7px] md:text-[10px]">
                                <span className={`truncate mr-2 ${isEnough ? 'text-stone-300' : 'text-red-400'}`}>{mat?.name || req.id}</span>
                                <span className={`font-mono font-bold ${isEnough ? 'text-stone-400' : 'text-red-500'}`}>{hasCount}/{req.count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RecipeTooltip;