import { DerivedStats } from './Stats';

export interface Monster {
  id: string;
  name: string;
  level: number;
  icon: string;
  sprite?: string;
  description: string;
  // 파생 수치를 직접 정의하여 밸런싱 정밀도 향상
  stats: DerivedStats;
  currentHp: number;
}
