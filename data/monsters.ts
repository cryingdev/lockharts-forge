import { Monster } from '../models/Monster';

export const MONSTERS: Record<string, Monster> = {
  rat_man: {
    id: 'rat_man',
    name: 'Rat Man',
    level: 2,
    icon: '🐀',
    sprite: 'rat_man.png',
    description: 'A mutated, semi-intelligent scavenger hiding in the depths.',
    currentHp: 150,
    rewardXp: 100, // 요구사항: 100 XP
    stats: {
      maxHp: 150,
      maxMp: 0,
      physicalAttack: 30,
      physicalDefense: 20,
      physicalReduction: 0.10,
      magicalAttack: 0,
      magicalDefense: 20,
      magicalReduction: 0.10,
      critChance: 5,
      critDamage: 150,
      accuracy: 90,
      evasion: 5,
      speed: 115
    }
  },
  plague_rat_king: {
    id: 'plague_rat_king',
    name: 'Plague Rat King',
    level: 3,
    icon: '👑',
    sprite: 'rat_king.png',
    description: 'A bloated, intelligent rodent ruling over the filth of the cellar.',
    currentHp: 450,
    rewardXp: 250,
    stats: {
      maxHp: 450,
      maxMp: 0,
      physicalAttack: 28,
      physicalDefense: 45,
      physicalReduction: 0.23,
      magicalAttack: 0,
      magicalDefense: 20,
      magicalReduction: 0.12,
      critChance: 10,
      critDamage: 150,
      accuracy: 85,
      evasion: 15,
      speed: 120
    }
  }
};