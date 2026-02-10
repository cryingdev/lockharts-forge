
import React from 'react';
import { MessageSquare, Gift, ShoppingBag, Heart } from 'lucide-react';
import { GarrickSprite } from './GarrickSprite';
import DialogueBox from '../../../DialogueBox';
import { SfxButton } from '../../../common/ui/SfxButton';

interface MarketLobbyViewProps {
    dialogue: string;
    garrickAffinity: number;
    talkedToday: boolean;
    floatingHearts: any[];
    pendingGiftItem: any;
    onTalk: () => void;
    onOpenGiftModal: () => void;
    onOpenCatalog: () => void;
    onConfirmGift: () => void;
    onCancelGift: () => void;
    isTutorialActive?: boolean; // 추가됨
}

export const MarketLobbyView: React.FC<MarketLobbyViewProps> = ({
    dialogue, garrickAffinity, talkedToday, floatingHearts, pendingGiftItem,
    onTalk, onOpenGiftModal, onOpenCatalog, onConfirmGift, onCancelGift,
    isTutorialActive = false // 추가됨
}) => {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-end">
            <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pointer-events-none pb-0">
                <div className="relative flex justify-center items-end w-full animate-in fade-in zoom-in-95 duration-1000">
                    <div className="absolute top-[12dvh] md:top-32 left-[calc(50%+85px)] md:left-[calc(50%+180px)] z-[1050] pointer-events-auto">
                        <div className="bg-stone-900/85 border-2 border-stone-700 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                            <div className="flex flex-col leading-none">
                                <span className="text-[7px] text-stone-500 font-black uppercase">Garrick's Trust</span>
                                <span className="text-sm font-black font-mono text-pink-400">{garrickAffinity}</span>
                            </div>
                        </div>
                    </div>
                    <GarrickSprite floatingHearts={floatingHearts} />
                </div>
            </div>

            <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl z-50 flex flex-col items-end pointer-events-none">
                <div className={`flex flex-col items-end gap-3 w-full px-4 py-2 pointer-events-auto transition-opacity ${pendingGiftItem || isTutorialActive ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                    <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3 w-full">
                        <SfxButton onClick={onTalk} disabled={isTutorialActive} className={`flex items-center gap-2 px-4 py-2 bg-stone-900/90 border border-stone-700 rounded-xl hover:border-amber-500 transition-all shadow-xl active:scale-95 ${talkedToday ? 'opacity-50' : ''}`}>
                            <MessageSquare className="w-4 h-4 text-amber-500" />
                            <span className="font-black text-[9px] text-stone-200 uppercase tracking-widest">Talk</span>
                        </SfxButton>
                        <SfxButton onClick={onOpenGiftModal} disabled={isTutorialActive} className="flex items-center gap-2 px-4 py-2 bg-stone-900/90 border border-stone-700 rounded-xl hover:border-pink-500 transition-all shadow-xl active:scale-95">
                            <Gift className="w-4 h-4 text-pink-500" />
                            <span className="font-black text-[9px] text-stone-200 uppercase tracking-widest">Gift</span>
                        </SfxButton>
                        <SfxButton onClick={onOpenCatalog} data-tutorial-id="BROWSE_GOODS_BUTTON" className="flex items-center gap-2 px-6 py-2 bg-amber-700/90 border border-amber-500 rounded-xl shadow-xl active:scale-95">
                            <ShoppingBag className="w-4 h-4 text-white" />
                            <span className="font-black text-[9px] text-white uppercase tracking-widest">Browse Goods</span>
                        </SfxButton>
                    </div>
                </div>
                
                {/* 튜토리얼이 대화 단계를 처리 중일 때는 로컬 대화창을 숨김 */}
                {!isTutorialActive && (
                    <DialogueBox 
                        speaker="Garrick" 
                        text={dialogue} 
                        options={pendingGiftItem ? [
                            { label: `Give ${pendingGiftItem.name}`, action: onConfirmGift, variant: 'primary' }, 
                            { label: "Cancel", action: onCancelGift, variant: 'neutral' }
                        ] : []} 
                        className="w-full relative pointer-events-auto" 
                    />
                )}
            </div>
        </div>
    );
};
