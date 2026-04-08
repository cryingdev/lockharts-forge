import React, { useState } from 'react';
import { Package, Coins, Lock } from 'lucide-react';
import { getAssetUrl } from '../../../../utils';
import { SfxButton } from '../../../common/ui/SfxButton';
import { useGame } from '../../../../context/GameContext';
import { getLocalizedItemDescription, getLocalizedItemName } from '../../../../utils/itemText';
import { t } from '../../../../utils/i18n';

const RomanTierOverlay = ({ id }: { id: string }) => {
    if (id === 'scroll_t2') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-xs md:text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] translate-y-2">II</span></div>;
    if (id === 'scroll_t3') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-xs md:text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] translate-y-2">III</span></div>;
    if (id === 'scroll_t4') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-amber-500 font-serif font-black text-xs md:text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] translate-y-2">IV</span></div>;
    return null;
};

interface MarketItemCardProps {
    item: any;
    stock: number;
    inventoryCount: number;
    multiplier: number;
    isLocked: boolean;
    gold: number;
    onAdd: (id: string, count: number) => void;
    onSetMultiplier: (id: string, val: number) => void;
    isTooltipOpen: boolean;
    onToggleTooltip: (itemId: string, anchorRect: DOMRect, description: string) => void;
}

export const MarketItemCard: React.FC<MarketItemCardProps> = ({ item, stock, inventoryCount, multiplier, isLocked, gold, onAdd, onSetMultiplier, isTooltipOpen, onToggleTooltip }) => {
    const { state } = useGame();
    const language = state.settings.language;
    const isSoldOut = stock <= 0;
    const meta = item.meta;
    const localizedName = getLocalizedItemName(language, meta);
    const localizedDescription = getLocalizedItemDescription(language, meta);
    const currentPrice = meta.baseValue * multiplier;
    const canAfford = gold >= currentPrice;
    const isSkillItem = meta.type === 'SKILL_BOOK' || meta.type === 'SKILL_SCROLL';
    const showsMultiplier = !isSoldOut && meta.type !== 'KEY_ITEM' && meta.type !== 'SCROLL';
    const folder = isSkillItem ? 'skills' : 'materials';
    
    // 1순위: ID 기반 파일명 우선 시도
    const [imgSrc, setImgSrc] = useState(getAssetUrl(`${item.id}.png`, folder));

    // 이미지 로드 실패 시 폴백 처리
    const handleImgError = () => {
        if (meta.image && imgSrc !== getAssetUrl(meta.image, folder)) {
            // 2순위: 메타데이터에 정의된 image 경로
            setImgSrc(getAssetUrl(meta.image, folder));
        }
    };

    const handleQuickBuy = () => {
        if (isSoldOut || isLocked || !canAfford) return;
        onAdd(item.id, multiplier);
    };

    const handleTooltipToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        onToggleTooltip(item.id, rect, localizedDescription);
    };

    return (
        <div data-tutorial-id={item.id === 'furnace' ? 'FURNACE_ITEM' : undefined} className={`relative flex flex-col items-center gap-0 px-0 py-0 rounded-2xl border transition-all overflow-visible shadow-md ${isSoldOut ? 'bg-stone-900 border-stone-800 opacity-40 grayscale' : 'bg-stone-850 border-stone-800 hover:border-stone-600'}`}>
            {isLocked && <div className="absolute left-1.5 top-1.5 z-30 rounded-md border border-red-500 bg-red-900/85 p-1 shadow-[0_4px_10px_rgba(0,0,0,0.35)]"><Lock className="h-2.5 w-2.5 text-white md:h-3 md:w-3" /></div>}
            <SfxButton
                sfx="switch"
                onClick={handleTooltipToggle}
                className="absolute bottom-[3.05rem] right-1.5 z-30 flex h-5 w-5 items-center justify-center rounded-full border border-stone-600 bg-stone-900/90 text-[9px] font-black leading-none text-stone-300 transition-all hover:border-amber-500 hover:text-amber-300 md:bottom-[3.7rem] md:h-6 md:w-6 md:text-[11px]"
                aria-label={t(language, 'market.item_description')}
                aria-expanded={isTooltipOpen}
            >
                !
            </SfxButton>
            
            <div className="relative w-full flex-none">
                {/* 아이템 클릭 영역 (퀵 구매) */}
                <SfxButton 
                    onClick={handleQuickBuy}
                    disabled={isSoldOut || isLocked || !canAfford}
                    className={`relative mt-0 flex w-full flex-none items-start justify-center overflow-hidden transition-all ${isSoldOut || isLocked || !canAfford ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-stone-800/50 active:scale-95'}`}
                >
                    {inventoryCount > 0 && <div className="absolute left-1 top-1 z-20 flex items-center gap-1 rounded-md border border-slate-600 bg-slate-950/88 px-1.5 py-0.5 text-[14px] font-black uppercase leading-none text-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.35)] md:text-[12px]"><Package className="h-3.5 w-3.5 md:h-3.5 md:w-3.5" />{inventoryCount}</div>}
                    <div className={`absolute right-1 top-1 z-20 rounded-md border px-1.5 py-0.5 text-[14px] font-black leading-none tracking-tight shadow-[0_4px_10px_rgba(0,0,0,0.35)] md:text-[12px] ${stock > 0 ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-400' : 'border-red-500/40 bg-red-950/60 text-red-500'}`}>{isSoldOut ? 'X' : stock}</div>
                    <img src={imgSrc} onError={handleImgError} className="mt-0.5 h-full max-h-[5.3rem] w-full max-w-[5.3rem] object-contain drop-shadow-md md:max-h-[7rem] md:max-w-[7rem]" />
                    <RomanTierOverlay id={item.id} />
                </SfxButton>

                {showsMultiplier && (
                    <div className="absolute bottom-[-0.9rem] left-1/2 z-20 flex -translate-x-1/2 gap-1 md:bottom-[-1rem] md:gap-1.5">
                        {[1, 5, 10].map(v => (
                            <SfxButton 
                                key={v} 
                                sfx="switch"
                                disabled={stock < v} 
                                onClick={() => onSetMultiplier(item.id, v)} 
                                className={`h-8 w-8 rounded-full border text-[14px] font-black leading-none transition-all md:h-8 md:w-8 md:text-[12px] ${multiplier === v ? 'border-amber-400 bg-amber-600 text-white' : 'border-stone-700 bg-stone-900 text-stone-500 hover:text-stone-300'}`}
                            >
                                {v}
                            </SfxButton>
                        ))}
                    </div>
                )}
            </div>

            <div className={`relative w-full px-1.5 pb-1 text-center ${showsMultiplier ? 'mt-7 md:mt-8' : 'mt-1'}`}>
                <h4 className={`truncate text-[14px] font-black leading-none md:text-[18px] ${meta.type === 'TECHNIQUE' ? 'text-amber-400' : 'text-stone-300'}`}>{localizedName}</h4>
            </div>
            
            {/* 하단 가격 버튼 */}
            <SfxButton 
                onClick={handleQuickBuy}
                disabled={isSoldOut || isLocked || !canAfford}
                className={`w-full border-t py-2 md:py-3 flex flex-col items-center justify-center font-mono font-black transition-all overflow-hidden ${
                    isSoldOut 
                        ? 'bg-stone-900 border-stone-800 text-stone-700 cursor-not-allowed' 
                        : !canAfford 
                            ? 'bg-red-900 border-red-800 text-red-100 cursor-not-allowed' 
                            : 'bg-stone-950 border-stone-800 text-amber-500 cursor-pointer hover:bg-amber-900/20 active:scale-95'
                }`}
            >
                <div className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap px-1 text-[14px] md:text-[19px]">
                    <span className="truncate">{currentPrice.toLocaleString()}</span>
                    <Coins className={`h-4 w-4 shrink-0 md:h-5 md:w-5 ${!canAfford ? 'text-red-400' : 'text-amber-600'}`} />
                </div>
            </SfxButton>

            {isSoldOut && <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-black/60 pointer-events-none"><span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded rotate-12 uppercase">{t(language, 'market.sold_out')}</span></div>}
        </div>
    );
};
