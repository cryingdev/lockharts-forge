
import React, { useState, useEffect, useCallback } from 'react';
import { Anvil, Play, Upload, User, Info, FastForward } from 'lucide-react';
import { getAssetUrl } from '../utils';
import { getLatestSaveInfo, getSaveMetadataList, loadFromSlot } from '../utils/saveSystem';
import SaveLoadModal from './modals/SaveLoadModal';

interface TitleScreenProps {
    onNewGame: () => void;
    onLoadGame: (data: any, slotIndex: number) => void;
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onNewGame, onLoadGame }) => {
    const [showCredits, setShowCredits] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [hasSaves, setHasSaves] = useState(false);
    const VERSION = "0.1.40";

    // 세이브 파일 존재 여부를 체크하는 함수
    const checkSaves = useCallback(() => {
        const metadata = getSaveMetadataList();
        setHasSaves(metadata.length > 0);
    }, []);

    // 초기 마운트 시 체크
    useEffect(() => {
        checkSaves();
    }, [checkSaves]);

    // 로드 모달이 닫힐 때(변경 사항이 있을 수 있음) 다시 체크
    useEffect(() => {
        if (!showLoadModal) {
            checkSaves();
        }
    }, [showLoadModal, checkSaves]);

    const handleContinue = () => {
        const info = getLatestSaveInfo();
        if (info) {
            // 버전 검증
            if (info.data.version !== VERSION) {
                alert(`Cannot load: Version mismatch.\n\nSave: v${info.data.version || '0.1.36'}\nApp: v${VERSION}\n\nPlease start a New Game or use a compatible save.`);
                return;
            }
            onLoadGame(info.data, info.index);
        }
    };

    const handleLoadFromSlot = (index: number) => {
        const data = loadFromSlot(index);
        if (data) {
            // 버전 검증
            if (data.version !== VERSION) {
                alert(`Cannot load: Version mismatch.\n\nSave: v${data.version || '0.1.36'}\nApp: v${VERSION}`);
                return;
            }
            onLoadGame(data, index);
            setShowLoadModal(false);
        }
    };

    return (
            <div className="relative h-[100dvh] w-full bg-stone-950 overflow-hidden flex flex-col items-center justify-center">
                
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
                <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000 p-4 md:p-6 w-full max-h-full overflow-hidden px-safe">
                    {/* Logo Area */}
                    <div className="mb-[2dvh] md:mb-12 text-center shrink-0">
                        <div className="w-[clamp(60px,15dvh,120px)] h-[clamp(60px,15dvh,120px)] md:w-32 md:h-32 bg-amber-900/20 rounded-full flex items-center justify-center border-2 md:border-4 border-amber-700/50 mb-[1.5dvh] md:mb-6 mx-auto shadow-[0_0_50px_rgba(180,83,9,0.3)]">
                            <Anvil className="w-[50%] h-[50%] text-amber-500 drop-shadow-lg" />
                        </div>
                        <h1 className="text-[clamp(24px,6dvh,64px)] md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 font-serif tracking-tighter drop-shadow-sm leading-[1.1]">
                            LOCKHART'S<br/>FORGE
                        </h1>
                        <div className="h-0.5 md:h-1 w-16 md:w-32 bg-amber-800 mx-auto mt-[1dvh] md:mt-4 rounded-full"></div>
                        <p className="mt-[0.5dvh] md:mt-4 text-stone-500 font-sans tracking-[0.3em] text-[clamp(10px,1.2dvh,14px)] md:text-sm uppercase font-bold">The Ember of Retribution</p>
                        <p className="mt-1 text-stone-600 font-mono text-[9px] md:text-xs">Build v{VERSION}</p>
                    </div>

                    {/* Menu Buttons */}
                    <div className="flex flex-col gap-1.5 md:gap-4 w-48 md:w-64 shrink-0">
                        {hasSaves && (
                            <button 
                                onClick={handleContinue}
                                className="group relative px-4 md:px-8 py-1.5 md:py-4 bg-amber-700/20 border border-amber-500 hover:bg-amber-600 transition-all rounded-lg shadow-xl animate-pulse hover:animate-none"
                            >
                                <div className="flex items-center justify-center gap-2 md:gap-3">
                                    <FastForward className="w-3 h-3 md:w-5 md:h-5 text-amber-400" />
                                    <span className="font-serif font-black text-amber-50 tracking-wide text-[10px] md:text-base">CONTINUE</span>
                                </div>
                            </button>
                        )}

                        <button 
                            onClick={onNewGame}
                            className="group relative px-4 md:px-8 py-1.5 md:py-4 bg-stone-900/80 border border-stone-700 hover:border-amber-500 rounded-lg overflow-hidden transition-all hover:bg-stone-800 shadow-lg"
                        >
                            <div className="absolute inset-0 w-1 bg-amber-500 transition-all group-hover:w-full opacity-10"></div>
                            <div className="flex items-center justify-center gap-2 md:gap-3">
                                <Play className="w-3 h-3 md:w-5 md:h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                                <span className="font-serif font-black text-stone-200 tracking-wide text-[10px] md:text-base">NEW GAME</span>
                            </div>
                        </button>

                        <button 
                            onClick={() => setShowLoadModal(true)}
                            className={`group px-4 md:px-8 py-1.5 md:py-4 border rounded-lg transition-all flex items-center justify-center gap-2 md:gap-3 bg-stone-900/80 border-stone-700 hover:border-stone-500 hover:bg-stone-800 text-stone-300`}
                        >
                            <div className="flex items-center justify-center gap-2 md:gap-3">
                                <Upload className="w-3 h-3 md:w-5 md:h-5" />
                                <span className="font-serif font-black tracking-wide text-[10px] md:text-base">LOAD GAME</span>
                            </div>
                        </button>

                        <button 
                            onClick={() => setShowCredits(true)}
                            className="px-6 py-1 md:py-2 mt-0.5 md:mt-4 text-stone-600 hover:text-amber-600 text-[8px] md:text-xs font-black tracking-widest transition-colors flex items-center justify-center gap-2 font-sans"
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
                                <div><h3 className="text-[10px] md:text-xs text-stone-500 uppercase font-black tracking-widest mb-1 font-sans">Created By</h3><p className="font-serif font-bold text-sm md:text-lg">CryingDev</p></div>
                                <div><h3 className="text-[10px] md:text-xs text-stone-500 uppercase font-black tracking-widest mb-1 font-sans">Assets</h3><p className="font-serif font-bold text-xs md:text-base">Pixel Art & Icons via AI/Open Source</p></div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-stone-800 text-[10px] text-stone-600 font-sans font-bold uppercase tracking-tighter">Built with React, Phaser & TypeScript</div>
                        </div>
                    </div>
                )}
            </div>
    );
};

export default TitleScreen;
