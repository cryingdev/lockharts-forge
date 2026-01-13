import { DerivedStats } from './Stats';

export interface Monster {
  id: string;
  name: string;
  level: number;
  icon: string;
  sprite?: string;
  description: string;
  stats: DerivedStats;
  currentHp: number;
  rewardXp: number; // 처치 시 지급될 총 경험치
}