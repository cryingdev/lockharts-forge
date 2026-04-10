import React, { useEffect, useRef } from 'react';
import { Coins, Heart, CheckCircle2, X } from 'lucide-react';
import { useGame } from '../../../../context/GameContext';
import { SfxButton } from '../../../common/ui/SfxButton';
import { t } from '../../../../utils/i18n';
import { useAudio } from '../../../../hooks/useAudio';

export const CommissionRewardModal: React.FC = () => {
    const { state, actions } = useGame();
    const { playSfx } = useAudio();
    const language = state.settings.language;
    const preview = state.commissionRewardPreview;
    const lastPreviewRef = useRef<typeof preview>(null);

    useEffect(() => {
        if (!preview || lastPreviewRef.current === preview) return;
        lastPreviewRef.current = preview;

        if (preview.lines.some(line => line.type === 'GOLD')) {
            playSfx('gathering_gold.wav');
        }
    }, [playSfx, preview]);

    if (!preview) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'GOLD':
                return <Coins className="w-4 h-4 text-amber-400" />;
            case 'ISSUER_AFFINITY':
            case 'AFFINITY':
                return <Heart className="w-4 h-4 text-sky-400" />;
            case 'UNLOCK_RECRUIT':
                return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            default:
                return <CheckCircle2 className="w-4 h-4 text-stone-300" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[2600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-stone-700 bg-stone-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between gap-3 border-b border-stone-800 px-5 py-4">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.24em] text-amber-400">
                            {t(language, 'commission.reward_modal_title')}
                        </h3>
                        <p className="mt-1 text-xs text-stone-400 font-bold">
                            {preview.contractTitle}
                        </p>
                    </div>
                    <SfxButton
                        sfx="switch"
                        onClick={actions.dismissCommissionRewardPreview}
                        className="p-2 rounded-full border border-stone-800 bg-stone-950/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                    >
                        <X className="w-5 h-5" />
                    </SfxButton>
                </div>

                <div className="p-5 space-y-3">
                    {preview.lines.map((line, index) => (
                        <div
                            key={`${line.type}-${index}`}
                            className="rounded-xl border border-stone-800 bg-stone-950/50 px-4 py-3"
                        >
                            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
                                {getIcon(line.type)}
                                <span>{line.label}</span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2 text-sm md:text-base font-black">
                                {line.beforeText && <span className="text-stone-400">{line.beforeText}</span>}
                                {line.afterText && <span className="text-stone-200">→</span>}
                                {line.afterText && <span className="text-stone-100">{line.afterText}</span>}
                                {line.deltaText && <span className="text-emerald-400">{line.deltaText}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-stone-800 px-5 py-4">
                    <SfxButton
                        sfx="confirm"
                        onClick={actions.dismissCommissionRewardPreview}
                        className="w-full rounded-xl bg-amber-600 py-3 text-sm font-black uppercase tracking-[0.18em] text-stone-950 hover:bg-amber-500"
                    >
                        {t(language, 'commission.option_continue')}
                    </SfxButton>
                </div>
            </div>
        </div>
    );
};
