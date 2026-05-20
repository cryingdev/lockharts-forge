import React from 'react';
import { X } from 'lucide-react';
import { UI_MODAL_LAYOUT } from '../../../../config/ui-config';
import { SKILLS } from '../../../../data/skills';
import { SfxButton } from '../../../common/ui/SfxButton';
import { getAssetUrl } from '../../../../utils';
import { t } from '../../../../utils/i18n';
import type { Mercenary } from '../../../../models/Mercenary';
import type { Language } from '../../../../types';
import type { ArenaOpponentViewModel } from '../types';

interface ArenaOpponentDetailModalProps {
    isOpen: boolean;
    language: Language;
    opponent: ArenaOpponentViewModel | null;
    playerParty: Mercenary[];
    onClose: () => void;
    onEditParty: () => void;
    onChallenge: () => void;
}

const PartyPreview = ({ title, party, emptyLabel }: { title: string; party: Mercenary[]; emptyLabel: string }) => (
    <div className="rounded-2xl border border-stone-800 bg-black/24 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">{title}</p>
        <div className="mt-3 space-y-2">
            {party.length > 0 ? (
                party.map((mercenary) => {
                    const equippedItems = Object.values(mercenary.equipment).filter(Boolean);
                    const skills = (mercenary.skillIds ?? [])
                        .map((skillId) => SKILLS[skillId])
                        .filter(Boolean)
                        .slice(0, 3);

                    return (
                        <div key={mercenary.id} className="rounded-xl border border-stone-800 bg-stone-900/72 px-3 py-3">
                            <p className="truncate text-sm font-black text-stone-100">{mercenary.name}</p>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                                {mercenary.job} • Lv.{mercenary.level}
                            </p>
                            {equippedItems.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {equippedItems.slice(0, 6).map((equipment) => (
                                        <div
                                            key={equipment!.id}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-700 bg-stone-950/90 p-1"
                                            title={equipment!.name}
                                        >
                                            <img
                                                src={getAssetUrl(equipment!.image || 'default.png')}
                                                alt={equipment!.name}
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {skills.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {skills.map((skill) => (
                                        <span
                                            key={skill.id}
                                            className="rounded-full border border-amber-800/60 bg-amber-950/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-300"
                                            title={skill.description}
                                        >
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="rounded-xl border border-dashed border-stone-800 bg-stone-950/60 px-3 py-4 text-sm text-stone-500">
                    {emptyLabel}
                </div>
            )}
        </div>
    </div>
);

export const ArenaOpponentDetailModal: React.FC<ArenaOpponentDetailModalProps> = ({
    isOpen,
    language,
    opponent,
    playerParty,
    onClose,
    onEditParty,
    onChallenge,
}) => {
    if (!isOpen || !opponent) return null;

    return (
        <div className={`${UI_MODAL_LAYOUT.OVERLAY} z-[2300]`} onClick={onClose}>
            <div
                className="relative mx-auto flex h-fit max-h-[90vh] w-[94%] max-w-4xl flex-col overflow-hidden rounded-[28px] border-2 border-stone-700 bg-stone-900"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-stone-800 bg-stone-900/95 px-5 py-4">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-300/90">
                            {t(language, 'arena.detail_title')}
                        </p>
                        <h3 className="mt-2 text-2xl font-black text-stone-100">{opponent.displayName}</h3>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-stone-500">
                            {opponent.rankLabel} • {opponent.rating.toLocaleString()}
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

                <div className="flex-1 overflow-y-auto px-5 py-5">
                    <div className="mb-4 rounded-2xl border border-stone-800 bg-black/24 px-4 py-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
                            {t(language, 'arena.point_preview')}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-lg font-black">
                            <span className="text-emerald-400">+{opponent.winPoints}</span>
                            <span className="text-stone-600">/</span>
                            <span className="text-rose-400">-{opponent.lossPoints}</span>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <PartyPreview title={t(language, 'arena.player_party')} party={playerParty} emptyLabel={t(language, 'common.empty')} />
                        <PartyPreview title={t(language, 'arena.enemy_party')} party={opponent.party} emptyLabel={t(language, 'common.empty')} />
                    </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-stone-800 bg-stone-900 px-5 py-4 sm:flex-row">
                    <SfxButton
                        sfx="click"
                        onClick={onEditParty}
                        className="w-full rounded-2xl bg-stone-800 px-5 py-4 text-[13px] font-black uppercase tracking-[0.14em] text-stone-300 transition-all hover:bg-stone-700 active:scale-[0.985] sm:flex-1"
                    >
                        {t(language, 'arena.change_party')}
                    </SfxButton>
                    <SfxButton
                        sfx="switch"
                        onClick={onChallenge}
                        disabled={playerParty.length === 0}
                        className={`w-full rounded-2xl border-b-4 px-5 py-4 text-[14px] font-black uppercase tracking-[0.16em] transition-all active:scale-[0.985] sm:flex-[1.3] ${
                            playerParty.length === 0
                                ? 'cursor-not-allowed border-stone-900 bg-stone-800 text-stone-600 grayscale'
                                : 'border-amber-800 bg-amber-600 text-white hover:bg-amber-500'
                        }`}
                    >
                        {t(language, 'arena.challenge')}
                    </SfxButton>
                </div>
            </div>
        </div>
    );
};
