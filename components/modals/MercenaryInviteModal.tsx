import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Check, Sparkles } from 'lucide-react';
import { Mercenary } from '../../models/Mercenary';
import { getAssetUrl } from '../../utils';
import { SfxButton } from '../common/ui/SfxButton';
import { AnimatedMercenary } from '../common/ui/AnimatedMercenary';
import { useGame } from '../../context/GameContext';
import { t } from '../../utils/i18n';

interface MercenaryInviteModalProps {
    mercenary: Mercenary | null;
    onConfirm: () => void;
    onClose: () => void;
}

export const MercenaryInviteModal: React.FC<MercenaryInviteModalProps> = ({ mercenary, onConfirm, onClose }) => {
    const { state } = useGame();
    const language = state.settings.language;
    const [revealStage, setRevealStage] = useState<'hidden' | 'scanning' | 'revealed'>('hidden');
    const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });
    const skipRef = useRef(false);

    useEffect(() => {
        if (!mercenary) {
            setRevealStage('hidden');
            skipRef.current = false;
            return;
        }

        const runAnimation = async () => {
            setRevealStage('scanning');
            skipRef.current = false;
            
            // Sequence: Center -> Up -> Down -> Left -> Right
            const sequence = [
                { x: 50, y: 50, delay: 500 },
                { x: 50, y: 20, delay: 600 },
                { x: 50, y: 80, delay: 600 },
                { x: 20, y: 50, delay: 600 },
                { x: 80, y: 50, delay: 600 },
                { x: 50, y: 50, delay: 400 },
            ];

            for (const step of sequence) {
                if (skipRef.current) break;
                setSpotlightPos({ x: step.x, y: step.y });
                await new Promise(resolve => setTimeout(resolve, step.delay));
            }

            setRevealStage('revealed');
        };

        runAnimation();
    }, [mercenary]);

    const handleSkip = () => {
        if (revealStage === 'scanning') {
            skipRef.current = true;
            setRevealStage('revealed');
        }
    };

    if (!mercenary) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleSkip}
                className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-pointer"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl relative"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/50">
                        <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-amber-500" />
                            <h2 className="text-xs font-black uppercase tracking-widest font-serif italic text-stone-300">{t(language, 'tavern.new_visitor_approaching')}</h2>
                        </div>
                    </div>

                    {/* Reveal Area */}
                    <div className="relative aspect-[3/4] bg-black overflow-hidden group flex items-start justify-center">
                        {/* The Mercenary Image */}
                        <div className="w-full h-full flex items-start justify-center">
                            <AnimatedMercenary 
                                mercenary={mercenary} 
                                height="165%"
                                objectFit="cover"
                                valign="top"
                                className={`w-auto object-top transition-opacity duration-500 ${revealStage === 'hidden' ? 'opacity-0' : 'opacity-100'}`}
                            />
                        </div>

                        {/* Lantern Effect Overlay (The "Hole") */}
                        <motion.div 
                            className="absolute inset-0 pointer-events-none"
                            initial={{ 
                                opacity: 1, 
                                background: `radial-gradient(circle 0px at 50% 50%, transparent 0%, rgba(0,0,0,1) 0%)` 
                            }}
                            animate={{ 
                                opacity: revealStage === 'revealed' ? 0 : 1,
                                background: revealStage === 'scanning' 
                                    ? `radial-gradient(circle 80px at ${spotlightPos.x}% ${spotlightPos.y}%, transparent 0%, rgba(0,0,0,1) 80%)`
                                    : `radial-gradient(circle 0px at ${spotlightPos.x}% ${spotlightPos.y}%, transparent 0%, rgba(0,0,0,1) 0%)`
                            }}
                            transition={{ 
                                opacity: { duration: 1.5, ease: "easeOut" },
                                background: { type: 'spring', damping: 25, stiffness: 40 }
                            }}
                        />

                        {/* Dust/Atmosphere particles */}
                        <div className="absolute inset-0 pointer-events-none opacity-20">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                        </div>

                        {/* Revealed Info Overlay */}
                        {revealStage === 'revealed' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="inline-block mb-2"
                                >
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                </motion.div>
                                <h3 className="text-2xl font-black font-serif italic text-white mb-1 tracking-tight">{mercenary.name}</h3>
                                <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">{mercenary.job} • Level {mercenary.level}</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 bg-stone-950/80 flex gap-3">
                        <SfxButton 
                            onClick={onConfirm}
                            disabled={revealStage !== 'revealed'}
                            className={`flex-1 min-h-[4.5rem] py-4 rounded-xl font-black uppercase tracking-[0.16em] text-[14px] md:text-[16px] flex items-center justify-center gap-2.5 transition-all ${
                                revealStage === 'revealed' 
                                ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-900/20' 
                                : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                            }`}
                        >
                            <Check className="w-5 h-5" />
                            {t(language, 'tavern.welcome_to_town')}
                        </SfxButton>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
