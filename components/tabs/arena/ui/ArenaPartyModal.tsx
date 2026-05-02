import React from 'react';
import { X } from 'lucide-react';
import { UI_MODAL_LAYOUT } from '../../../../config/ui-config';
import { SfxButton } from '../../../common/ui/SfxButton';
import { t } from '../../../../utils/i18n';
import type { Mercenary } from '../../../../models/Mercenary';
import type { Language } from '../../../../types';

interface ArenaPartyModalProps {
    isOpen: boolean;
    language: Language;
    mercenaries: Mercenary[];
    selectedIds: string[];
    onClose: () => void;
    onConfirm: () => void;
    onToggleMercenary: (mercenaryId: string) => void;
}

export const ArenaPartyModal: React.FC<ArenaPartyModalProps> = ({
    isOpen,
    language,
    mercenaries,
    selectedIds,
    onClose,
    onConfirm,
    onToggleMercenary,
}) => {
    if (!isOpen) return null;

    return (
        <div className={`${UI_MODAL_LAYOUT.OVERLAY} z-[2200]`} onClick={onClose}>
            <div
                className="relative mx-auto flex h-fit max-h-[90vh] w-[94%] max-w-3xl flex-col overflow-hidden rounded-[28px] border-2 border-stone-700 bg-stone-900"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-stone-800 bg-stone-900/95 px-5 py-4">
                    <div>
                        <h3 className="text-2xl font-black text-stone-100">{t(language, 'arena.party_builder_title')}</h3>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-stone-500">
                            {t(language, 'arena.party_builder_subtitle')}
                        </p>
                    </div>
                    <SfxButton
                        sfx="switch"
                        onClick={onClose}
                        className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-800 hover:text-stone-300"
                    >
                        <X className="h-5 w-5" />
                    </SfxButton>
                </div>

                <div className="border-b border-stone-800 bg-black/20 px-5 py-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
                            {t(language, 'arena.selected_party')}
                        </p>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-500">
                            {t(language, 'arena.selected_count', { count: selectedIds.length })}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => {
                            const mercenary = mercenaries.find((entry) => entry.id === selectedIds[index]);
                            return (
                                <div
                                    key={mercenary?.id ?? `arena-slot-${index}`}
                                    className="rounded-2xl border border-stone-800 bg-stone-950/70 px-3 py-3"
                                >
                                    {mercenary ? (
                                        <>
                                            <p className="truncate text-sm font-black text-stone-100">{mercenary.name}</p>
                                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                                                {mercenary.job} • Lv.{mercenary.level}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-black text-stone-500">{t(language, 'arena.party_empty_slot')}</p>
                                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-700">
                                                {t(language, 'common.empty')}
                                            </p>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
                            {t(language, 'arena.roster')}
                        </p>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-600">
                            {mercenaries.length}
                        </p>
                    </div>

                    {mercenaries.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-stone-800 bg-black/20 px-5 py-8 text-center text-sm text-stone-500">
                            {t(language, 'arena.no_roster')}
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {mercenaries.map((mercenary) => {
                                const isSelected = selectedIds.includes(mercenary.id);
                                const canToggle = isSelected || selectedIds.length < 4;

                                return (
                                    <SfxButton
                                        key={mercenary.id}
                                        sfx="click"
                                        onClick={() => canToggle && onToggleMercenary(mercenary.id)}
                                        disabled={!canToggle}
                                        className={`rounded-2xl border px-4 py-4 text-left transition-all active:scale-[0.985] ${
                                            isSelected
                                                ? 'border-stone-500 bg-stone-900 ring-1 ring-amber-500/40'
                                                : 'border-stone-800 bg-black/24 hover:border-stone-700'
                                        } ${!canToggle ? 'opacity-50 grayscale' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-[15px] font-black text-stone-100">{mercenary.name}</p>
                                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                                                    {mercenary.job} • Lv.{mercenary.level}
                                                </p>
                                            </div>
                                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${isSelected ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-400'}`}>
                                                {isSelected ? t(language, 'common.confirm') : t(language, 'arena.available')}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-400">
                                            <span>HP {mercenary.currentHp}/{mercenary.maxHp}</span>
                                            <span>MP {mercenary.currentMp}/{mercenary.maxMp}</span>
                                        </div>
                                    </SfxButton>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="border-t border-stone-800 bg-stone-900 px-5 py-4">
                    <SfxButton
                        sfx="switch"
                        onClick={onConfirm}
                        className="w-full rounded-2xl border-b-4 border-amber-800 bg-amber-600 px-6 py-5 text-[14px] font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-amber-500 active:scale-[0.985]"
                    >
                        {t(language, 'arena.party_confirm')}
                    </SfxButton>
                </div>
            </div>
        </div>
    );
};
