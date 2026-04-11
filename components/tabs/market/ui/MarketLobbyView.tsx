
import React from 'react';
import { MessageSquare, Gift, ShoppingBag, Heart } from 'lucide-react';
import { GarrickSprite } from './GarrickSprite';
import DialogueBox from '../../../DialogueBox';
import { SfxButton } from '../../../common/ui/SfxButton';
import { useGame } from '../../../../context/GameContext';
import { t } from '../../../../utils/i18n';

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
    isTutorialActive?: boolean;
    hideLobbyDialogue?: boolean;
}

export const MarketLobbyView: React.FC<MarketLobbyViewProps> = ({
    dialogue, garrickAffinity, talkedToday, floatingHearts, pendingGiftItem,
    onTalk, onOpenGiftModal, onOpenCatalog, onConfirmGift, onCancelGift,
    isTutorialActive = false,
    hideLobbyDialogue = false
}) => {
    const { state } = useGame();
    const language = state.settings.language;
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-end">
            <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-end pointer-events-none pb-0">
                <div className="relative flex justify-center items-end w-full animate-in fade-in zoom-in-95 duration-1000">
                    <div className="absolute top-[12dvh] md:top-32 right-[max(0.75rem,env(safe-area-inset-right))] md:right-8 z-[1050] pointer-events-auto">
                        <div className="max-w-[calc(100vw-1.5rem)] min-w-[118px] md:min-w-[138px] bg-stone-900/85 border-2 border-stone-700 px-3 py-2 md:px-5 md:py-2.5 rounded-2xl backdrop-blur-md shadow-2xl flex items-center gap-2 md:gap-3">
                            <Heart className="w-5 h-5 md:w-6 md:h-6 text-pink-500 fill-pink-500" />
                            <div className="flex flex-col leading-none">
                                <span className="whitespace-nowrap text-[8px] md:text-[10px] text-stone-400 font-black uppercase tracking-[0.08em]">{t(language, 'market.garricks_trust')}</span>
                                <span className="text-[18px] md:text-[22px] font-black font-mono text-pink-400 mt-1">{garrickAffinity}</span>
                            </div>
                        </div>
                    </div>
                    <GarrickSprite floatingHearts={floatingHearts} />
                </div>
            </div>

            <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[92vw] md:w-[85vw] max-w-5xl z-50 flex flex-col items-end pointer-events-none">
                <div className={`flex flex-col items-end gap-3 w-full px-4 py-2 pointer-events-auto transition-opacity ${pendingGiftItem || isTutorialActive ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                    <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3 w-full">
                        <SfxButton onClick={onTalk} disabled={isTutorialActive} className={`flex min-h-[46px] md:min-h-[54px] items-center gap-2.5 px-5 py-2.5 md:px-6 md:py-3 bg-stone-900/90 border border-stone-700 rounded-2xl hover:border-amber-500 transition-all shadow-xl active:scale-95 ${talkedToday ? 'opacity-50' : ''}`}>
                            <MessageSquare className="w-4.5 h-4.5 md:w-5 md:h-5 text-amber-500" />
                            <span className="font-black text-[10px] md:text-[11px] text-stone-200 uppercase tracking-[0.18em]">{t(language, 'market.talk')}</span>
                        </SfxButton>
                        <SfxButton onClick={onOpenGiftModal} disabled={isTutorialActive} className="flex min-h-[46px] md:min-h-[54px] items-center gap-2.5 px-5 py-2.5 md:px-6 md:py-3 bg-stone-900/90 border border-stone-700 rounded-2xl hover:border-pink-500 transition-all shadow-xl active:scale-95">
                            <Gift className="w-4.5 h-4.5 md:w-5 md:h-5 text-pink-500" />
                            <span className="font-black text-[10px] md:text-[11px] text-stone-200 uppercase tracking-[0.18em]">{t(language, 'market.gift')}</span>
                        </SfxButton>
                        <SfxButton onClick={onOpenCatalog} data-tutorial-id="BROWSE_GOODS_BUTTON" className="flex min-h-[46px] md:min-h-[54px] items-center gap-2.5 px-6 py-2.5 md:px-7 md:py-3 bg-amber-700/90 border border-amber-500 rounded-2xl shadow-xl active:scale-95">
                            <ShoppingBag className="w-4.5 h-4.5 md:w-5 md:h-5 text-white" />
                            <span className="font-black text-[10px] md:text-[11px] text-white uppercase tracking-[0.18em]">{t(language, 'market.browse_goods')}</span>
                        </SfxButton>
                    </div>
                </div>
                
                {/* 튜토리얼이 대화 단계를 처리 중일 때는 로컬 대화창을 숨김 */}
                {!isTutorialActive && !hideLobbyDialogue && (
                    <DialogueBox 
                        speaker="Garrick" 
                        text={dialogue} 
                        options={pendingGiftItem ? [
                            { label: t(language, 'market.give_item', { item: pendingGiftItem.name }), action: onConfirmGift, variant: 'primary' }, 
                            { label: t(language, 'common.cancel'), action: onCancelGift, variant: 'neutral' }
                        ] : []} 
                        className="w-full relative pointer-events-auto" 
                    />
                )}
            </div>
        </div>
    );
};
