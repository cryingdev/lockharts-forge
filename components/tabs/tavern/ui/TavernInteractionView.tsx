
import React from 'react';
import { ArrowLeft, Heart, MessageSquare, Gift, UserPlus, UserMinus, Search, Wrench, ChevronUp, Package, X, Ban } from 'lucide-react';
import DialogueBox from '../../../DialogueBox';
import { AnimatedMercenary } from '../../../common/ui/AnimatedMercenary';
import { MercenaryPortrait } from '../../../common/ui/MercenaryPortrait';
import { MercenaryDetailModal } from '../../../modals/MercenaryDetailModal';
import { ItemSelectorList } from '../../../ItemSelectorList';
import { SfxButton } from '../../../common/ui/SfxButton';
import { getAssetUrl } from '../../../../utils';
import { useTavernInteraction } from '../hooks/useTavernInteraction';
import { Mercenary } from '../../../../models/Mercenary';

interface TavernInteractionViewProps {
    mercenary: Mercenary;
    onBack: () => void;
}

export const TavernInteractionView: React.FC<TavernInteractionViewProps> = ({ mercenary, onBack }) => {
    const inter = useTavernInteraction(mercenary);
    const { 
        state, actions, dialogue, showGiftMenu, setShowGiftMenu, showDetail, setShowDetail, 
        pendingGiftItem, floatingHearts, step, hiringCost, canAfford, hasAffinity, handlers 
    } = inter;

    const isHired = ['HIRED', 'ON_EXPEDITION', 'INJURED'].includes(mercenary.status);
    const isOnExpedition = mercenary.status === 'ON_EXPEDITION';
    const hasUnallocated = isHired && (mercenary.bonusStatPoints || 0) > 0;

    return (
        <div className="fixed inset-0 z-[1000] bg-stone-950 overflow-hidden flex flex-col items-center justify-center px-safe">
            <style>{`
                @keyframes heartFloatUp { 0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-300px) translateX(var(--wobble)) scale(1.2); opacity: 0; } }
                .animate-heart { animation: heartFloatUp 2.5s ease-out forwards; }
            `}</style>

            <div className="absolute inset-0 z-0">
                <img src={getAssetUrl('tavern_bg.jpeg', 'bg')} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            <SfxButton onClick={onBack} sfx="switch" className="absolute top-4 left-4 z-[1050] flex items-center gap-2 px-4 py-2 bg-stone-900/80 hover:bg-red-900/60 text-stone-300 rounded-xl border border-stone-700 backdrop-blur-md transition-all shadow-2xl active:scale-90 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">Back</span>
            </SfxButton>

            <div className="absolute top-20 left-4 z-40 animate-in slide-in-from-left-4 duration-500 w-[32%] max-w-[180px] md:max-w-[240px]">
                <div className="bg-stone-900/90 border border-stone-700 p-2.5 md:p-4 rounded-xl backdrop-blur-md shadow-2xl">
                    <div className="flex justify-between items-center mb-1.5 md:mb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <MercenaryPortrait mercenary={mercenary} className="w-7 h-7 md:w-9 md:h-9 rounded-lg border border-white/10 shrink-0" />
                            <div className="flex flex-col leading-tight min-w-0">
                                <span className="font-black text-amber-50 text-[8px] md:text-[10px] tracking-widest uppercase truncate">{mercenary.job}</span>
                                <span className="text-stone-500 text-[8px] md:text-[10px] font-mono">Lv.{mercenary.level}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-pink-400 font-bold bg-pink-950/20 px-1 md:px-1.5 py-0.5 rounded border border-pink-900/30 shrink-0">
                            <Heart className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 fill-pink-400" /><span className="font-mono text-[9px] md:text-xs">{mercenary.affinity}</span>
                        </div>
                    </div>
                    <div className="space-y-1.5 md:space-y-2.5">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-center text-[7px] md:text-[9px] font-mono text-stone-500 px-0.5"><span>HP</span><span>{Math.floor(mercenary.currentHp)}/{mercenary.maxHp}</span></div>
                            <div className="w-full bg-stone-950 h-1 md:h-1.5 rounded-full overflow-hidden border border-stone-800"><div className="bg-red-600 h-full transition-all duration-700" style={{ width: `${(mercenary.currentHp / mercenary.maxHp) * 100}%` }} /></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 z-10 w-full h-full pointer-events-none flex items-end justify-center">
                <div className="relative w-full h-full flex items-end justify-center animate-in fade-in zoom-in-95 duration-700 ease-out">
                    <div className="relative h-[90dvh] max-h-[110dvh] flex items-end justify-center">
                        <AnimatedMercenary mercenary={mercenary} className="h-full w-auto filter drop-shadow-[0_0_100px_rgba(0,0,0,1)]" />
                        {floatingHearts.map(h => <Heart key={h.id} className="absolute animate-heart fill-pink-500 text-pink-400" style={{ left: `${h.left}%`, bottom: '30%', width: h.size, height: h.size, animationDelay: `${h.delay}s`, '--wobble': `${(Math.random()-0.5)*40}px` } as any} />)}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl z-50 flex flex-col items-center gap-[10px] pointer-events-none">
                <div className={`flex flex-col items-end gap-2 w-full px-4 py-2 pointer-events-auto transition-opacity duration-500 ${(pendingGiftItem || step !== 'IDLE') ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <div className="flex wrap items-center justify-end gap-1.5 md:gap-3 w-full">
                        <SfxButton onClick={handlers.handleTalk} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0">
                            <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-amber-500" /><span className="font-black text-[9px] md:text-xs text-stone-200 uppercase tracking-widest">Talk</span>
                        </SfxButton>
                        <SfxButton onClick={() => setShowGiftMenu(true)} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 hover:border-pink-500 rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0">
                            <Gift className="w-3 h-3 md:w-4 md:h-4 text-pink-500" /><span className="font-black text-[9px] md:text-xs text-stone-200 uppercase tracking-widest">Gift</span>
                        </SfxButton>
                        {isHired ? (
                            <SfxButton onClick={handlers.handleTerminateInit} disabled={isOnExpedition} className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 border rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0 text-white ${isOnExpedition ? 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed opacity-50' : 'bg-red-950/60 hover:bg-red-900/80 border border-red-800'}`}>
                                <UserMinus className="w-3 h-3 md:w-4 md:h-4" /><span className="font-black text-[9px] md:text-xs uppercase tracking-widest">Terminate</span>
                            </SfxButton>
                        ) : (
                            <SfxButton onClick={handlers.handleRecruitInit} disabled={!canAfford || !hasAffinity} className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 border rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0 ${(!canAfford || !hasAffinity) ? 'bg-stone-950/80 border-stone-800 text-stone-600 grayscale cursor-not-allowed' : 'bg-amber-900/65 hover:bg-amber-800 border-amber-500 text-white'}`}>
                                <UserPlus className="w-3 h-3 md:w-4 md:h-4" /><div className="flex flex-col items-start leading-none text-left"><span className="font-black text-[9px] md:text-xs uppercase tracking-widest">Recruit</span>{hasAffinity && <span className="text-[7px] md:text-[8px] font-mono opacity-70">{hiringCost}G</span>}</div>
                            </SfxButton>
                        )}
                        <SfxButton onClick={() => setShowDetail(true)} className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3.5 bg-stone-900/85 hover:bg-stone-800 border border-stone-700 rounded-xl backdrop-blur-md transition-all shadow-xl group shrink-0 relative ${isHired ? 'hover:border-emerald-500' : 'hover:border-blue-500'}`}>
                            {isHired ? <Wrench className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" /> : <Search className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />}
                            <span className="font-black text-[9px] md:text-xs text-stone-200 uppercase tracking-widest">{isHired ? 'Manage' : 'Inspect'}</span>
                            {hasUnallocated && <div className="absolute -top-2 -left-1 bg-amber-500 text-stone-900 p-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-bounce border border-stone-950 z-10"><ChevronUp className="w-2.5 h-2.5 font-black" /></div>}
                        </SfxButton>
                    </div>
                </div>

                <DialogueBox 
                    speaker={mercenary.name} 
                    text={dialogue} 
                    options={
                        pendingGiftItem ? [{ label: `Give ${pendingGiftItem.name}`, action: handlers.handleConfirmGift, variant: 'primary' }, { label: "Cancel", action: handlers.handleCancelGift, variant: 'neutral' }] : 
                        step === 'CONFIRM_HIRE' ? [{ label: `Sign Contract (-${hiringCost}G)`, action: handlers.handleConfirmHire, variant: 'primary' }, { label: "Think again", action: handlers.handleCancelStep, variant: 'neutral' }] : 
                        step === 'CONFIRM_FIRE' ? [{ label: "Terminate Contract", action: handlers.handleConfirmTerminate, variant: 'danger' }, { label: "Stay with me", action: handlers.handleCancelStep, variant: 'neutral' }] : []
                    }
                    className="w-full relative pointer-events-auto"
                />
            </div>

            {showGiftMenu && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl w-full max-w-2xl h-[60vh] min-h-[400px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                        <div className="p-3 border-b border-stone-800 bg-stone-850 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2"><div className="bg-pink-900/30 p-1.5 rounded-lg border border-pink-700/50"><Gift className="w-4 h-4 text-pink-500" /></div><h3 className="font-bold text-stone-200 font-serif uppercase tracking-widest text-sm">Select Gift</h3></div>
                            <SfxButton onClick={() => setShowGiftMenu(false)} className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500"><X className="w-4 h-4" /></SfxButton>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <ItemSelectorList items={state.inventory.filter(i => ['EQUIPMENT', 'PRODUCT', 'CONSUMABLE', 'GIFT'].includes(i.type))} onSelect={handlers.handleSelectItemForGift} onToggleLock={(id) => actions.toggleLockItem(id)} customerMarkup={1.0} emptyMessage="No suitable gear found." />
                        </div>
                    </div>
                </div>
            )}

            {showDetail && (
                <MercenaryDetailModal mercenary={mercenary} onClose={() => setShowDetail(false)} onUnequip={(mercId, slot) => actions.unequipItem(mercId, slot)} isReadOnly={!isHired || isOnExpedition} />
            )}
        </div>
    );
};
