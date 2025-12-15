
import React, { useState } from 'react';
import { Anvil, Play, Upload, User, Info } from 'lucide-react';
import { getAssetUrl } from '../utils';

interface TitleScreenProps {
    onNewGame: () => void;
    onLoadGame: () => void; // Placeholder
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onNewGame, onLoadGame }) => {
    const [showCredits, setShowCredits] = useState(false);

    return (
        <div className="relative h-screen w-screen bg-stone-950 overflow-hidden flex flex-col items-center justify-center">
            
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
            <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
                {/* Logo Area */}
                <div className="mb-12 text-center">
                    <div className="w-32 h-32 bg-amber-900/20 rounded-full flex items-center justify-center border-4 border-amber-700/50 mb-6 mx-auto shadow-[0_0_50px_rgba(180,83,9,0.3)]">
                        <Anvil className="w-16 h-16 text-amber-500 drop-shadow-lg" />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 font-serif tracking-tighter drop-shadow-sm">
                        LOCKHART'S<br/>FORGE
                    </h1>
                    <div className="h-1 w-32 bg-amber-800 mx-auto mt-4 rounded-full"></div>
                    <p className="mt-4 text-stone-400 font-mono tracking-widest text-sm uppercase">Version 0.1.25</p>
                </div>

                {/* Menu Buttons */}
                <div className="flex flex-col gap-4 w-64">
                    <button 
                        onClick={onNewGame}
                        className="group relative px-8 py-4 bg-stone-900/80 border border-stone-700 hover:border-amber-500 rounded-lg overflow-hidden transition-all hover:bg-stone-800 shadow-lg"
                    >
                        <div className="absolute inset-0 w-1 bg-amber-500 transition-all group-hover:w-full opacity-10"></div>
                        <div className="flex items-center justify-center gap-3">
                            <Play className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-stone-200 tracking-wide">NEW GAME</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => alert("Load Game feature is coming soon!")}
                        className="group px-8 py-4 bg-stone-900/50 border border-stone-800 hover:border-stone-600 rounded-lg transition-all hover:bg-stone-800 text-stone-500 hover:text-stone-300"
                    >
                         <div className="flex items-center justify-center gap-3">
                            <Upload className="w-5 h-5" />
                            <span className="font-bold tracking-wide">LOAD GAME</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => setShowCredits(true)}
                        className="px-8 py-3 mt-4 text-stone-500 hover:text-amber-500 text-sm font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                        <User className="w-4 h-4" /> CREDITS
                    </button>
                </div>
            </div>

            {/* Credits Modal */}
            {showCredits && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="max-w-md w-full bg-stone-900 border border-stone-700 p-8 rounded-xl text-center relative">
                        <button 
                            onClick={() => setShowCredits(false)}
                            className="absolute top-4 right-4 text-stone-500 hover:text-stone-300"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-bold text-amber-500 mb-6 font-serif">Credits</h2>
                        
                        <div className="space-y-4 text-stone-300">
                            <div>
                                <h3 className="text-xs text-stone-500 uppercase font-bold tracking-wider mb-1">Created By</h3>
                                <p className="font-medium">CryingDev</p>
                            </div>
                            <div>
                                <h3 className="text-xs text-stone-500 uppercase font-bold tracking-wider mb-1">Music & SFX</h3>
                                <p className="font-medium text-sm">Generated / Placeholder</p>
                            </div>
                            <div>
                                <h3 className="text-xs text-stone-500 uppercase font-bold tracking-wider mb-1">Assets</h3>
                                <p className="font-medium text-sm">Pixel Art via AI & Lucide Icons</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-stone-800 text-xs text-stone-500">
                            Built with React, Phaser & TypeScript
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TitleScreen;
