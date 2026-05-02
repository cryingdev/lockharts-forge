import React, { useEffect, useRef } from 'react';
import { Coins, Package, Sparkles, Swords, X } from 'lucide-react';
import { UI_MODAL_LAYOUT } from '../../../../config/ui-config';
import { useGame } from '../../../../context/GameContext';
import { useAudio } from '../../../../hooks/useAudio';
import { getAssetUrl } from '../../../../utils';
import { t } from '../../../../utils/i18n';
import { SfxButton } from '../../../common/ui/SfxButton';

const getLineIcon = (type: 'GOLD' | 'ITEM' | 'EQUIPMENT') => {
    switch (type) {
        case 'GOLD':
            return <Coins className="h-4 w-4 text-amber-400" />;
        case 'EQUIPMENT':
            return <Swords className="h-4 w-4 text-sky-300" />;
        case 'ITEM':
        default:
            return <Package className="h-4 w-4 text-violet-300" />;
    }
};

export const ArenaRewardPreviewModal: React.FC = () => {
    const { state, actions } = useGame();
    const { playSfx } = useAudio();
    const language = state.settings.language;
    const preview = state.arenaRewardPreview;
    const lastPreviewRef = useRef<typeof preview>(null);

    useEffect(() => {
        if (!preview || lastPreviewRef.current === preview) return;
        lastPreviewRef.current = preview;

        if (preview.lines.some((line) => line.type === 'GOLD')) {
            playSfx('gathering_gold.wav');
        }
    }, [playSfx, preview]);

    if (!preview) return null;

    return (
        <div className={`${UI_MODAL_LAYOUT.OVERLAY} z-[2550]`} onClick={actions.dismissArenaRewardPreview}>
            <div
                className="mx-auto w-[92%] max-w-[440px] overflow-hidden rounded-[28px] border-2 border-violet-700/50 bg-stone-900 shadow-[0_24px_80px_rgba(0,0,0,0.48)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-stone-800 bg-stone-900/95 px-5 py-4">
                    <div>
                        <div className="flex items-center gap-2 text-violet-300">
                            <Sparkles className="h-4 w-4" />
                            <p className="text-[11px] font-black uppercase tracking-[0.2em]">
                                {t(language, 'arena.reward_preview_title')}
                            </p>
                        </div>
                        <h3 className="mt-2 text-2xl font-black text-stone-100">{preview.rewardLabel}</h3>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-stone-500">
                            {t(language, 'arena.reward_preview_subtitle', { threshold: preview.threshold.toLocaleString() })}
                        </p>
                    </div>
                    <SfxButton
                        sfx="switch"
                        onClick={actions.dismissArenaRewardPreview}
                        className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-800 hover:text-stone-300"
                    >
                        <X className="h-5 w-5" />
                    </SfxButton>
                </div>

                <div className="space-y-3 px-5 py-5">
                    {preview.lines.map((line, index) => (
                        <div
                            key={`${line.type}-${line.label}-${index}`}
                            className="flex items-center gap-3 rounded-2xl border border-stone-800 bg-black/28 px-4 py-3"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-700 bg-stone-950/90">
                                {line.image ? (
                                    <img
                                        src={getAssetUrl(line.image, line.assetFolder)}
                                        alt={line.label}
                                        className="h-full w-full object-contain p-1"
                                    />
                                ) : line.icon ? (
                                    <span className="text-xl">{line.icon}</span>
                                ) : (
                                    getLineIcon(line.type)
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                                    {getLineIcon(line.type)}
                                    <span>{t(language, `arena.reward_type_${line.type.toLowerCase()}`)}</span>
                                </div>
                                <p className="mt-1 truncate text-sm font-black text-stone-100">{line.label}</p>
                            </div>
                            {line.quantityText && (
                                <div className="shrink-0 rounded-full border border-violet-800/60 bg-violet-950/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-violet-300">
                                    {line.quantityText}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t border-stone-800 px-5 py-4">
                    <SfxButton
                        sfx="confirm"
                        onClick={actions.dismissArenaRewardPreview}
                        className="w-full rounded-2xl border-b-4 border-violet-900 bg-violet-600 px-5 py-4 text-[14px] font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-violet-500 active:scale-[0.985]"
                    >
                        {t(language, 'arena.reward_preview_confirm')}
                    </SfxButton>
                </div>
            </div>
        </div>
    );
};
