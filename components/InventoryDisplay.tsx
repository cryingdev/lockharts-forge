import React from 'react';
import { useGame } from '../context/GameContext';
import { Package, BookOpen } from 'lucide-react';

const InventoryDisplay = () => {
    const { state } = useGame();

    return (
        <div className="flex flex-col md:flex-row h-full w-full max-w-6xl mx-auto gap-4 p-4">
            
            {/* Inventory List - Flex 1 to take available space */}
            <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
                <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    <h3 className="text-slate-200 text-sm uppercase tracking-wider font-bold">Inventory</h3>
                </div>
                
                <div className="p-2 overflow-y-auto flex-1 space-y-2">
                    {state.inventory.length === 0 && (
                        <div className="text-slate-500 text-center text-sm py-8 italic">Your inventory is empty.</div>
                    )}
                    {state.inventory.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-800/50 hover:bg-slate-800 p-3 rounded-lg border border-slate-700/50 transition-colors">
                            <div className="flex flex-col">
                                <span className={`font-medium ${item.type === 'RESOURCE' ? 'text-slate-300' : 'text-amber-200'}`}>
                                    {item.name}
                                </span>
                                <span className="text-[10px] text-slate-500">{item.type}</span>
                            </div>
                            <span className="font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded text-xs">x{item.quantity}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logs - Flex 1 or fixed height on mobile */}
            <div className="flex-1 md:flex-[0.6] bg-black rounded-xl border border-stone-800 overflow-hidden flex flex-col h-64 md:h-auto">
                <div className="bg-stone-900/50 p-3 border-b border-stone-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-stone-500" />
                    <h3 className="text-stone-400 text-sm uppercase tracking-wider font-bold">Journal</h3>
                </div>
                <div className="p-3 overflow-y-auto flex-1 font-mono text-xs space-y-3">
                    {state.logs.map((log, i) => (
                        <div key={i} className="text-stone-400 border-l-2 border-stone-800 pl-3">
                            <span className="text-stone-600 block text-[10px] mb-0.5">Day {state.stats.day} • {state.stats.time}</span>
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InventoryDisplay;