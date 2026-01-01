
import React, { useState, useEffect } from 'react';
import { Anvil, Play, Upload, User, Info, FastForward } from 'lucide-react';
import { getAssetUrl } from '../utils';
import { getLatestSave, getSaveMetadataList, loadFromSlot } from '../utils/saveSystem';
import SaveLoadModal from './modals/SaveLoadModal';

interface TitleScreenProps {
    onNewGame: () => void;
    onLoadGame: (data: any) => void;
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onNewGame, onLoadGame }) => {
    const [showCredits, setShowCredits] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [hasSaves, setHasSaves] = useState(false);

    useEffect(() => {
        setHasSaves(getSaveMetadataList().length > 0);
    }, []);

    const handleContinue = () => {
        const latest = getLatestSave();
        if (latest) onLoadGame(latest);
    };

    const handleLoadFromSlot = (index: number) => {
        const data = loadFromSlot(index);
        if (data) {
            onLoadGame(data);
            setShowLoadModal(false);
        }
    };

    return (
        <div className="relative h-full w-full bg-stone-950 overflow-hidden flex flex-col items-center justify-center">
            
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={getAssetUrl('forge_bg.png')} 
                    className="w-full h-full object-cover opacity-30 blur-sm scale-105"
                    alt="Background"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.style.background = 'radial-gradient(circle at center, #292524 0%, #0c0a09 100%)';
                    }}
                />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000 p-4 md:p-6 w-full max-h-full overflow-hidden">
                {/* Logo Area */}
                <div className="mb-[3vh] md:mb-12 text-center shrink-0">
                    <div className="w-[15vh] h-[15vh] min-w-[60px] min-h-[60px] max-w-[120px] max-h-[120px] md:w-32 md:h-32 bg-amber-900/20 rounded-full flex items-center justify-center border-2 md:border-4 border-amber-700/50 mb-[2vh] md:mb-6 mx-auto shadow-[0_0_50px_rgba(180,83,9,0.3)]">
                        <Anvil className="w-[8vh] h-[8vh] min-w-[30px] min-h-[30px] md:w-16 md:h-16 text-amber-500 drop-shadow-lg" />
                    </div>
                    <h1 className="text-[6vh] md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 font-serif tracking-tighter drop-shadow-sm leading-[1.1]">
                        LOCKHART'S<br/>FORGE
                    </h1>
                    <div className="h-0.5 md:h-1 w-16 md:w-32 bg-amber-800 mx-auto mt-2 md:mt-4 rounded-full"></div>
                    <p className="mt-1 md:mt-4 text-stone-500 font-mono tracking-widest text-[1.5vh] md:text-sm uppercase">Version 0.1.33</p>
                </div>

                {/* Menu Buttons */}
                <div className="flex flex-col gap-2 md:gap-4 w-48 md:w-64 shrink-0">
                    {hasSaves && (
                        <button 
                            onClick={handleContinue}
                            className="group relative px-4 md:px-8 py-2 md:py-4 bg-amber-700/20 border border-amber-500 hover:bg-amber-600 transition-all rounded-lg shadow-xl animate-pulse hover:animate-none"
                        >
                            <div className="flex items-center justify-center gap-2 md:gap-3">
                                <FastForward className="w-3.5 h-3.5 md:w-5 md:h-5 text-amber-400" />
                                <span className="font-bold text-amber-50 tracking-wide text-xs md:text-base">CONTINUE</span>
                            </div>
                        </button>
                    )}

                    <button 
                        onClick={onNewGame}
                        className="group relative px-4 md:px-8 py-2 md:py-4 bg-stone-900/80 border border-stone-700 hover:border-amber-500 rounded-lg overflow-hidden transition-all hover:bg-stone-800 shadow-lg"
                    >
                        <div className="absolute inset-0 w-1 bg-amber-500 transition-all group-hover:w-full opacity-10"></div>
                        <div className="flex items-center justify-center gap-2 md:gap-3">
                            <Play className="w-3.5 h-3.5 md:w-5 md:h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-stone-200 tracking-wide text-xs md:text-base">NEW GAME</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => setShowLoadModal(true)}
                        className={`group px-4 md:px-8 py-2 md:py-4 border rounded-lg transition-all flex items-center justify-center gap-2 md:gap-3 bg-stone-900/80 border-stone-700 hover:border-stone-500 hover:bg-stone-800 text-stone-300`}
                    >
                         <div className="flex items-center justify-center gap-2 md:gap-3">
                            <Upload className="w-3.5 h-3.5 md:w-5 md:h-5" />
                            <span className="font-bold tracking-wide text-xs md:text-base">LOAD GAME</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => setShowCredits(true)}
                        className="px-6 py-1 md:py-2 mt-1 md:mt-4 text-stone-600 hover:text-amber-600 text-[8px] md:text-xs font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                        <User className="w-2.5 h-2.5" /> CREDITS
                    </button>
                </div>
            </div>

            <SaveLoadModal 
                isOpen={showLoadModal} 
                mode="LOAD" 
                onClose={() => setShowLoadModal(false)} 
                onAction={handleLoadFromSlot} 
            />

            {/* Credits Modal */}
            {showCredits && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="max-w-md w-full bg-stone-900 border border-stone-700 p-6 md:p-8 rounded-xl text-center relative shadow-2xl">
                        <button onClick={() => setShowCredits(false)} className="absolute top-4 right-4 text-stone-500 hover:text-stone-300">✕</button>
                        <h2 className="text-xl md:text-2xl font-bold text-amber-500 mb-6 font-serif">Credits</h2>
                        <div className="space-y-4 text-stone-300">
                            <div><h3 className="text-[10px] md:text-xs text-stone-500 uppercase font-bold tracking-wider mb-1">Created By</h3><p className="font-medium text-sm md:text-base">CryingDev</p></div>
                            <div><h3 className="text-[10px] md:text-xs text-stone-500 uppercase font-bold tracking-wider mb-1">Assets</h3><p className="font-medium text-xs md:text-sm">Pixel Art & Icons via AI/Open Source</p></div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-stone-800 text-[10px] text-stone-600">Built with React, Phaser & TypeScript</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TitleScreen;
