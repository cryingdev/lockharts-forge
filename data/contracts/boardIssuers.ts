import { BoardIssuerProfile } from '../../types/game-state';

export const BOARD_ISSUER_PROFILES: BoardIssuerProfile[] = [
  {
    id: 'TOWN_GUARD',
    displayName: 'Town Guard',
    favoredKinds: ['CRAFT', 'HUNT', 'EXPLORE'],
    rewardBias: 'REPUTATION',
    urgencyBias: 'HIGH',
    flavorTone: 'Practical, defensive, and urgent',
    source: 'BOARD',
  },
  {
    id: 'ASHFIELD_TRADERS',
    displayName: 'Ashfield Traders',
    favoredKinds: ['CRAFT', 'TURN_IN'],
    rewardBias: 'GOLD',
    urgencyBias: 'MEDIUM',
    flavorTone: 'Commercial, deadline-aware, and transactional',
    source: 'BOARD',
  },
  {
    id: 'CHAPEL_OF_EMBER',
    displayName: 'Chapel of Ember',
    favoredKinds: ['TURN_IN', 'CRAFT', 'HUNT', 'EXPLORE'],
    rewardBias: 'UTILITY',
    urgencyBias: 'MEDIUM',
    flavorTone: 'Protective, solemn, and recovery-focused',
    source: 'BOARD',
  },
  {
    id: 'ADVENTURERS_GUILD',
    displayName: "Adventurers' Guild",
    favoredKinds: ['HUNT', 'EXPLORE', 'CRAFT', 'TURN_IN'],
    rewardBias: 'DUNGEON',
    urgencyBias: 'MEDIUM',
    flavorTone: 'Risk-tolerant, field-oriented, and opportunistic',
    source: 'BOARD',
  },
];
