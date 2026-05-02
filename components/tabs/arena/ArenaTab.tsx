import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Swords } from 'lucide-react';
import { useGame } from '../../../context/GameContext';
import type { SingleMatchReport } from '../../../hooks/useSimulation';
import type { Mercenary } from '../../../models/Mercenary';
import { DUMMY_ARENA_OPPONENTS } from '../../../data/arena/opponents';
import { ARENA_MILESTONE_DEFINITIONS, getArenaMilestoneRewardLabel } from '../../../data/arena/milestones';
import { SfxButton } from '../../common/ui/SfxButton';
import { t } from '../../../utils/i18n';
import type {
    ArenaBattleResultViewModel,
    ArenaMilestoneViewModel,
    ArenaOpponentViewModel,
} from './types';
import { ArenaLobbyView } from './ui/ArenaLobbyView';
import { ArenaCombatOverlay } from './ui/ArenaCombatOverlay';
import { ArenaOpponentDetailModal } from './ui/ArenaOpponentDetailModal';
import { ArenaPartyModal } from './ui/ArenaPartyModal';
import { ArenaRewardPreviewModal } from './ui/ArenaRewardPreviewModal';
import { ArenaResultModal } from './ui/ArenaResultModal';

interface ArenaTabProps {
    onNavigate?: (tab: any) => void;
}

const ARENA_RANK_THRESHOLDS = [0, 100, 300, 600, 1000];

const getArenaRankLabel = (language: 'en' | 'ko', rating: number) => {
    if (rating >= 1000) return t(language, 'arena.rank_champion');
    if (rating >= 600) return t(language, 'arena.rank_gold');
    if (rating >= 300) return t(language, 'arena.rank_silver');
    if (rating >= 100) return t(language, 'arena.rank_bronze');
    return t(language, 'arena.rank_initiate');
};

const areSameIds = (left: string[], right: string[]) =>
    left.length === right.length && left.every((id, index) => id === right[index]);

const ArenaTab: React.FC<ArenaTabProps> = ({ onNavigate }) => {
    const { state, actions } = useGame();
    const language = state.settings.language;

    const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
    const [selectedOpponent, setSelectedOpponent] = useState<ArenaOpponentViewModel | null>(null);
    const [combatOpponent, setCombatOpponent] = useState<ArenaOpponentViewModel | null>(null);
    const [result, setResult] = useState<ArenaBattleResultViewModel | null>(null);

    const arenaRating = state.arena.rating;
    const peakRating = state.arena.peakRating;

    const arenaMercenaryPool = useMemo(
        () => state.knownMercenaries.filter((mercenary) => mercenary.status === 'HIRED'),
        [state.knownMercenaries]
    );

    useEffect(() => {
        const availableIds = new Set(arenaMercenaryPool.map((mercenary) => mercenary.id));
        const filtered = state.arena.selectedPartyIds.filter((id) => availableIds.has(id)).slice(0, 4);
        const fallback = filtered.length > 0 ? filtered : arenaMercenaryPool.slice(0, 4).map((mercenary) => mercenary.id);

        if (!areSameIds(state.arena.selectedPartyIds, fallback)) {
            actions.setArenaParty(fallback);
        }
    }, [actions, arenaMercenaryPool, state.arena.selectedPartyIds]);

    const selectedParty = useMemo(
        () =>
            state.arena.selectedPartyIds
                .map((id) => arenaMercenaryPool.find((mercenary) => mercenary.id === id))
                .filter((mercenary): mercenary is Mercenary => Boolean(mercenary)),
        [arenaMercenaryPool, state.arena.selectedPartyIds]
    );

    const milestones = useMemo<ArenaMilestoneViewModel[]>(() => {
        const claimed = new Set(state.arena.claimedMilestoneThresholds);
        let claimableAssigned = false;

        return ARENA_MILESTONE_DEFINITIONS.map((milestone) => {
            const isClaimed = claimed.has(milestone.threshold);
            const claimable = !claimableAssigned && !isClaimed && arenaRating >= milestone.threshold;
            if (claimable) claimableAssigned = true;
            return {
                threshold: milestone.threshold,
                rewardLabel: getArenaMilestoneRewardLabel(language, milestone),
                claimed: isClaimed,
                claimable,
            };
        });
    }, [arenaRating, language, state.arena.claimedMilestoneThresholds]);

    const rankLabel = getArenaRankLabel(language, arenaRating);
    const nextMilestone = milestones.find((milestone) => !milestone.claimed);
    const claimableMilestoneCount = milestones.filter((milestone) => milestone.claimable).length;
    const averagePartyLevel =
        selectedParty.length > 0
            ? Math.round(selectedParty.reduce((sum, mercenary) => sum + mercenary.level, 0) / selectedParty.length)
            : 0;
    const previousMilestoneThreshold = nextMilestone
        ? ARENA_MILESTONE_DEFINITIONS.filter((milestone) => milestone.threshold < nextMilestone.threshold).reduce(
              (latest, milestone) => milestone.threshold,
              0
          )
        : 0;
    const milestoneProgress = nextMilestone
        ? Math.max(
              0,
              Math.min(
                  100,
                  ((arenaRating - previousMilestoneThreshold) /
                      Math.max(1, nextMilestone.threshold - previousMilestoneThreshold)) *
                      100
              )
          )
        : 100;
    const nextMilestoneRemaining = nextMilestone ? Math.max(0, nextMilestone.threshold - arenaRating) : 0;
    const currentRankIndex = ARENA_RANK_THRESHOLDS.reduce((latest, threshold, index) => {
        if (arenaRating >= threshold) return index;
        return latest;
    }, 0);
    const currentRankFloor = ARENA_RANK_THRESHOLDS[currentRankIndex] ?? 0;
    const nextRankThreshold = ARENA_RANK_THRESHOLDS[currentRankIndex + 1] ?? null;
    const nextRankLabel = nextRankThreshold !== null ? getArenaRankLabel(language, nextRankThreshold) : null;
    const rankProgress = nextRankThreshold
        ? Math.max(
              0,
              Math.min(
                  100,
                  ((arenaRating - currentRankFloor) / Math.max(1, nextRankThreshold - currentRankFloor)) * 100
              )
          )
        : 100;
    const nextRankRemaining = nextRankThreshold ? Math.max(0, nextRankThreshold - arenaRating) : 0;

    const handleTogglePartyMercenary = (mercenaryId: string) => {
        const nextPartyIds = (() => {
            if (state.arena.selectedPartyIds.includes(mercenaryId)) {
                return state.arena.selectedPartyIds.filter((id) => id !== mercenaryId);
            }
            if (state.arena.selectedPartyIds.length >= 4) return state.arena.selectedPartyIds;
            return [...state.arena.selectedPartyIds, mercenaryId];
        })();

        actions.setArenaParty(nextPartyIds);
    };

    const handleClaimMilestone = (threshold: number) => {
        actions.claimArenaMilestone(threshold);

        setResult((prev) => {
            if (!prev?.unlockedMilestone || prev.unlockedMilestone.threshold !== threshold) return prev;
            return {
                ...prev,
                unlockedMilestone: {
                    ...prev.unlockedMilestone,
                    claimed: true,
                    claimable: false,
                },
            };
        });
    };

    const handleChallenge = () => {
        if (!selectedOpponent || selectedParty.length === 0) return;

        setCombatOpponent(selectedOpponent);
        setSelectedOpponent(null);
    };

    const handleCombatFinish = (
        winner: 'A' | 'B',
        report: SingleMatchReport,
        playerMvp: {
            mercenary: Mercenary;
            kills: number;
            damageDealt: number;
            damageTaken: number;
        } | null
    ) => {
        if (!combatOpponent) return;

        const didWin = winner === 'A';
        const pointsDelta = didWin ? combatOpponent.winPoints : -combatOpponent.lossPoints;
        const nextRating = Math.max(0, arenaRating + pointsDelta);
        const nextPeakRating = Math.max(peakRating, nextRating);
        const unlockedMilestone = milestones.find(
            (milestone) => !milestone.claimed && arenaRating < milestone.threshold && nextRating >= milestone.threshold
        );

        actions.applyArenaBattleResult(pointsDelta);
        setCombatOpponent(null);
        setResult({
            opponentName: combatOpponent.displayName,
            outcome: didWin ? 'WIN' : 'LOSS',
            pointsDelta,
            ratingAfter: nextRating,
            peakRating: nextPeakRating,
            unlockedMilestone: unlockedMilestone ? { ...unlockedMilestone, claimable: true } : undefined,
            playerMvp: playerMvp ?? undefined,
            battleSummary: {
                durationTicks: report.durationTicks,
                attacksFor: report.statsA.attacks,
                attacksAgainst: report.statsB.attacks,
                critsFor: report.statsA.crits,
                critsAgainst: report.statsB.crits,
                evasionsFor: report.statsA.evasions,
                evasionsAgainst: report.statsB.evasions,
                damageFor: report.statsA.totalDmg,
                damageAgainst: report.statsB.totalDmg,
                maxHitFor: report.statsA.maxDmg,
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[50] overflow-hidden bg-stone-950 px-safe pt-safe pb-safe">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,53,15,0.16),transparent_36%),radial-gradient(circle_at_bottom,rgba(127,29,29,0.15),transparent_32%),linear-gradient(180deg,#120f0c_0%,#0b0908_100%)]" />

            {onNavigate && (
                <div className="absolute left-4 top-4 z-[1100]">
                    <SfxButton
                        sfx="switch"
                        onClick={() => onNavigate('MAIN')}
                        className="flex min-h-[52px] items-center gap-2.5 rounded-2xl border border-stone-700 bg-stone-900/80 px-5 py-3 text-stone-300 shadow-2xl backdrop-blur-md transition-all hover:bg-red-900/60 active:scale-90"
                    >
                        <ArrowLeft className="h-4.5 w-4.5" />
                        <span className="text-[13px] font-black uppercase tracking-[0.18em]">{t(language, 'common.back')}</span>
                    </SfxButton>
                </div>
            )}

            <div className="absolute right-4 top-4 z-[1100] rounded-2xl border border-stone-700 bg-stone-900/72 px-4 py-3 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-2 text-rose-300">
                    <Swords className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em]">{t(language, 'arena.title')}</span>
                </div>
            </div>

            <ArenaLobbyView
                language={language}
                rating={arenaRating}
                peakRating={peakRating}
                rankLabel={rankLabel}
                selectedParty={selectedParty}
                milestones={milestones}
                opponents={DUMMY_ARENA_OPPONENTS}
                averagePartyLevel={averagePartyLevel}
                claimableMilestoneCount={claimableMilestoneCount}
                nextMilestone={nextMilestone}
                nextMilestoneProgress={milestoneProgress}
                nextMilestoneRemaining={nextMilestoneRemaining}
                rankProgress={rankProgress}
                nextRankLabel={nextRankLabel}
                nextRankThreshold={nextRankThreshold}
                nextRankRemaining={nextRankRemaining}
                onOpenParty={() => setIsPartyModalOpen(true)}
                onSelectOpponent={setSelectedOpponent}
                onClaimMilestone={handleClaimMilestone}
            />

            <ArenaPartyModal
                isOpen={isPartyModalOpen}
                language={language}
                mercenaries={arenaMercenaryPool}
                selectedIds={state.arena.selectedPartyIds}
                onClose={() => setIsPartyModalOpen(false)}
                onConfirm={() => setIsPartyModalOpen(false)}
                onToggleMercenary={handleTogglePartyMercenary}
            />

            <ArenaOpponentDetailModal
                isOpen={!!selectedOpponent}
                language={language}
                opponent={selectedOpponent}
                playerParty={selectedParty}
                onClose={() => setSelectedOpponent(null)}
                onEditParty={() => {
                    setSelectedOpponent(null);
                    setIsPartyModalOpen(true);
                }}
                onChallenge={handleChallenge}
            />

            <ArenaCombatOverlay
                isOpen={!!combatOpponent}
                language={language}
                playerParty={selectedParty}
                opponent={combatOpponent}
                onFinish={handleCombatFinish}
            />

            <ArenaResultModal
                isOpen={!!result}
                language={language}
                result={result}
                onClose={() => setResult(null)}
                onClaimMilestone={
                    result?.unlockedMilestone?.claimable
                        ? () => handleClaimMilestone(result.unlockedMilestone!.threshold)
                        : undefined
                }
            />

            <ArenaRewardPreviewModal />
        </div>
    );
};

export default ArenaTab;
