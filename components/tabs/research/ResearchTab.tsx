
import React from 'react';
import { useGame } from '../../../context/GameContext';
import { Sparkles, Beaker, Microscope, Loader2, ArrowLeft, Check, AlertCircle, Trash2, Trophy, Ghost } from 'lucide-react';
import { getAssetUrl } from '../../../utils';
import { useResearch } from './hooks/useResearch';
import { ResearchSlots } from './ui/ResearchSlots';
import { ResearchInventoryModal } from './ui/ResearchInventoryModal';
import { EQUIPMENT_ITEMS } from '../../../data/equipment';

interface ResearchTabProps {
    onClose?: () => void;
}

const ResearchResultOverlay = ({ result, onConfirm }: { result: any, onConfirm: () => void }) => {
    const isSuccess = result.type === 'SUCCESS';
    const isResonate = result.type === 'RESONATE';
    const discoveredRecipe = isSuccess ? EQUIPMENT_ITEMS.find(r => r.id === result.recipeId) : null;

    return (
        <div className="absolute inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-700" />
            
            <div className="relative w-full max-w-sm bg-stone-900 border-2 border-stone-700 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col items-center p-8 text-center ring-1 ring-white/10">
                
                {isSuccess && discoveredRecipe ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-500/40 blur-3xl animate-pulse rounded-full" />
                            <div className="w-32 h-32 bg-stone-950 rounded-full border-4 border-amber-500 flex items-center justify-center relative shadow-2xl animate-bounce-slow">
                                <img 
                                    src={getAssetUrl(`${discoveredRecipe.id}.png`, 'equipments')} 
                                    className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(245,158,11,1)]" 
                                    alt="Discovered" 
                                />
                                <div className="absolute -top-2 -right-2 bg-amber-500 text-stone-950 p-2 rounded-full shadow-lg border-2 border-stone-900">
                                    <Trophy className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-4xl font-black text-amber-500 font-serif uppercase tracking-tighter mb-1 drop-shadow-lg">Eureka!</h3>
                            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Lost Blueprint Deciphered</p>
                            <div className="bg-stone-950 px-6 py-4 rounded-2xl border border-amber-500/30 shadow-inner">
                                <span className="text-xl md:text-2xl font-black text-stone-100 uppercase tracking-tighter">{discoveredRecipe.name}</span>
                            </div>
                        </div>
                    </div>
                ) : isResonate ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-28 h-28 bg-stone-950 rounded-full border-4 border-indigo-600/50 flex items-center justify-center relative shadow-2xl animate-shake-hard">
                            <Sparkles className="w-14 h-14 text-indigo-400 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-2xl md:text-3xl font-black text-indigo-400 font-serif uppercase tracking-tight mb-2">Unstable Resonance</h3>
                            <p className="text-stone-400 text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed px-4">
                                The materials pulse with energy, but the proportions are incorrect. <br/>
                                <span className="text-indigo-300/80 font-mono text-[10px] mt-2 block">(Ingredients match, but quantities vary!)</span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-stone-950 rounded-full border-4 border-stone-800 flex items-center justify-center relative shadow-2xl opacity-40">
                            <Ghost className="w-12 h-12 text-stone-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-stone-500 font-serif uppercase tracking-tight mb-1">Ashen Failure</h3>
                            <p className="text-stone-600 text-xs font-bold uppercase tracking-widest leading-relaxed px-4">
                                The catalyst has failed. The materials turned to cold grey ash without a sound.
                            </p>
                        </div>
                    </div>
                )}

                <button 
                    onClick={onConfirm}
                    className="mt-8 w-full py-4 bg-stone-800 hover:bg-stone-750 text-stone-300 font-black uppercase tracking-[0.3em] rounded-2xl border-b-4 border-stone-950 transition-all active:translate-y-1 shadow-xl"
                >
                    Clear Workspace
                </button>
            </div>
        </div>
    );
};

const ResearchTab: React.FC<ResearchTabProps> = ({ onClose }) => {
    const { state } = useGame();
    const research = useResearch();
    const { selectedSlots, isInventoryModalOpen, inventoryItems, isResearching, isFlashing, result, handlers } = research;

    // Determine which animation to use
    const isFailAnim = result?.type === 'FAIL' && isResearching;
    const isSuccessAnim = (result?.type === 'SUCCESS' || result?.type === 'RESONATE') && isResearching;

    return (
        <div className="h-full w-full bg-stone-950 relative overflow-hidden flex flex-col font-sans animate-in fade-in duration-500">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={getAssetUrl('research_table_bg.png', 'bg')} 
                    className="absolute inset-0 w-full h-full object-cover opacity-30" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-transparent to-stone-950"></div>
            </div>

            {/* Flash Overlay */}
            {isFlashing && (
                <div className="absolute inset-0 z-[1000] bg-white animate-flash-out pointer-events-none" />
            )}

            {/* Header */}
            <div className={`relative z-10 px-4 py-3 md:px-8 md:py-6 flex justify-between items-center border-b border-white/5 bg-stone-900/40 backdrop-blur-md shrink-0 transition-all duration-500 ${isResearching ? 'opacity-20 translate-y-[-10px]' : 'opacity-100'}`}>
                <div className="flex items-center gap-4">
                    {onClose && (
                        <button 
                            onClick={onClose}
                            disabled={isResearching}
                            className="bg-stone-800 p-2 md:p-3 rounded-xl border border-stone-700 hover:bg-red-950/30 hover:border-red-500/50 transition-all active:scale-90 disabled:opacity-30 disabled:grayscale"
                        >
                            <ArrowLeft className="w-5 h-5 text-stone-300" />
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="hidden xs:block p-2 bg-indigo-900/30 rounded-xl border border-indigo-500/30">
                                <Microscope className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h2 className="text-xl md:text-4xl font-black text-stone-100 font-serif uppercase tracking-tighter leading-none">Scholars Desk</h2>
                        </div>
                        <p className="text-stone-500 text-[7px] md:text-xs font-bold uppercase tracking-[0.2em] leading-none">Combine materials to rediscover ancient patterns</p>
                    </div>
                </div>
                
                <div className="flex flex-col items-end shrink-0">
                    <span className="text-[7px] md:text-[9px] font-black text-stone-500 uppercase tracking-widest leading-none mb-1">Current State</span>
                    <div className="flex items-center gap-1.5 bg-stone-950/80 px-3 py-1 rounded-full border border-white/5 shadow-inner">
                        <Sparkles className={`w-3 h-3 text-amber-500 ${isResearching ? 'animate-spin' : 'animate-pulse'}`} />
                        <span className="text-[9px] md:text-xs font-mono font-bold text-stone-300">
                            {isResearching ? 'Alchemizing...' : result && !isResearching ? 'Analysis Complete' : 'Resonating'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-12 min-h-0 z-10">
                <div className={`relative w-full max-w-2xl aspect-square md:aspect-video flex items-center justify-center transition-transform duration-300 ${isResearching ? 'scale-110' : ''}`}>
                    {/* Magical Circle Effect */}
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 ${isResearching ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`w-[85%] h-[85%] border-2 border-indigo-500/20 rounded-full ${isResearching ? (isFailAnim ? 'animate-research-spin-fail' : 'animate-research-spin') : 'animate-spin-slow'}`}></div>
                        <div className={`absolute w-[95%] h-[95%] border border-indigo-500/10 rounded-full ${isResearching ? (isFailAnim ? 'animate-research-spin-fail' : 'animate-research-spin') : 'animate-reverse-spin-slow'}`}></div>
                    </div>

                    {/* Result View Overlay */}
                    {result && !isResearching && <ResearchResultOverlay result={result} onConfirm={handlers.handleClearResult} />}

                    {/* Slot Container with Accelerated Rotation */}
                    <div className={`transition-all duration-300 ${isSuccessAnim ? 'animate-research-spin' : isFailAnim ? 'animate-research-spin-fail' : ''}`}>
                        <ResearchSlots 
                            slots={selectedSlots} 
                            onOpenInventory={() => !isResearching && !result && handlers.setIsInventoryModalOpen(true)} 
                            disabled={isResearching || (!!result && !isResearching)}
                        />
                    </div>
                </div>

                <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 w-full max-w-md">
                    {result && !isResearching ? (
                         <button 
                            onClick={handlers.handleClearResult}
                            className="w-full py-4 rounded-2xl font-black text-sm md:text-lg uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 bg-stone-800 hover:bg-stone-750 text-stone-200 border-b-4 border-stone-950 shadow-2xl active:scale-95"
                         >
                            <Trash2 className="w-5 h-5 md:w-6 md:h-6" /> Purge Workspace
                        </button>
                    ) : (
                        <button 
                            onClick={handlers.handleResearch}
                            disabled={selectedSlots.every(s => !s) || isResearching}
                            className={`w-full py-4 rounded-2xl font-black text-sm md:text-lg uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 border-b-4 shadow-2xl relative overflow-hidden ${
                                selectedSlots.every(s => !s) || isResearching
                                ? 'bg-stone-800 text-stone-600 border-stone-900 cursor-not-allowed grayscale' 
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-800 active:scale-95 shadow-indigo-900/40'
                            }`}
                        >
                            {isResearching ? (
                                <>
                                    <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                                    Synthesizing...
                                </>
                            ) : (
                                <>
                                    <Beaker className="w-5 h-5 md:w-6 md:h-6" />
                                    Initiate Extraction
                                </>
                            )}
                            
                            {/* Progress Bar inside button for researching state */}
                            {isResearching && (
                                <div 
                                    className={`absolute bottom-0 left-0 h-1 bg-white/30 ${isFailAnim ? 'animate-button-progress-fail' : 'animate-button-progress'}`} 
                                />
                            )}
                        </button>
                    )}
                    <p className={`text-[8px] md:text-[10px] text-stone-600 font-bold uppercase tracking-widest text-center px-6 transition-opacity duration-300 ${isResearching || (result && !isResearching) ? 'opacity-0' : 'opacity-100'}`}>
                        Warning: All items in slots are permanently consumed during the reaction.
                    </p>
                </div>
            </div>

            {isInventoryModalOpen && !isResearching && (
                <ResearchInventoryModal 
                    items={inventoryItems}
                    selectedSlots={selectedSlots}
                    onClose={() => handlers.setIsInventoryModalOpen(false)}
                    onSelect={handlers.handleSelectItem}
                    onIncrement={handlers.handleIncrementQuantity}
                    onDecrement={handlers.handleDecrementQuantity}
                    onRemove={handlers.handleRemoveItem}
                    onResearch={handlers.handleResearch}
                />
            )}

            <style>{`
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes reverse-spin-slow { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                
                @keyframes research-accelerate {
                    0% { transform: rotate(0deg) scale(1); }
                    100% { transform: rotate(8640deg) scale(1); }
                }

                @keyframes research-accelerate-fail {
                    0% { transform: rotate(0deg) scale(1); }
                    85% { transform: rotate(5400deg) scale(1.1); }
                    100% { transform: rotate(6400deg) scale(0); opacity: 0; }
                }

                @keyframes flash-out {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
                @keyframes button-progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes button-progress-fail {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-spin-slow { animation: spin-slow 20s linear infinite; }
                .animate-reverse-spin-slow { animation: reverse-spin-slow 25s linear infinite; }
                
                .animate-research-spin { animation: research-accelerate 5s cubic-bezier(0.4, 0, 1, 1) forwards; }
                .animate-research-spin-fail { animation: research-accelerate-fail 3s cubic-bezier(0.6, 0, 1, 1) forwards; }
                
                .animate-flash-out { animation: flash-out 0.8s ease-out forwards; }
                .animate-button-progress { animation: button-progress 5s linear forwards; }
                .animate-button-progress-fail { animation: button-progress-fail 3s linear forwards; }
                .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default ResearchTab;
