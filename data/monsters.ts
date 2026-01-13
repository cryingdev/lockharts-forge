import { Monster } from '../models/Monster';

export const MONSTERS: Record<string, Monster> = {
  rat_man: {
    id: 'rat_man',
    name: 'Rat Man',
    level: 2,
    icon: '🐀',
    sprite: 'rat_man.png',
    description: 'A mutated, semi-intelligent scavenger hiding in the depths.',
    currentHp: 200,
    stats: {
      maxHp: 200,
      maxMp: 0,
      physicalAttack: 30,
      physicalDefense: 20,
      physicalReduction: 0.10, // 물리 방어율 10%
      magicalAttack: 0,
      magicalDefense: 20,
      magicalReduction: 0.10, // 마법 방어율 10%
      critChance: 5, // 크리티컬 5%
      critDamage: 150,
      accuracy: 90,
      evasion: 5, // 회피 5%
      speed: 115 // 스피드 115
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
