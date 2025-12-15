
import { Mercenary } from '../models/Mercenary';
import { calculateCombatPower } from '../models/Stats';

export const calculateMercenaryPower = (merc: Mercenary): number => {
    // Current base stat sum. 
    // TODO: Include Equipment stats in Phase 2
    return calculateCombatPower(merc.stats);
};

export const calculatePartyPower = (mercs: Mercenary[]): number => {
    return mercs.reduce((sum, m) => sum + calculateMercenaryPower(m), 0);
};

export const formatDuration = (ms: number): string => {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
