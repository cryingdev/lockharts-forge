
import Phaser from 'phaser';
import { SMITHING_CONFIG } from '../config/smithing-config';

/**
 * SmithingTutorialHandler
 * SmithingScene의 미니게임 내 튜토리얼 분기 로직을 담당합니다.
 */
export class SmithingTutorialHandler {
  // 400°C에 해당하는 비율 (10~1500 범위 기준)
  private static readonly TUTORIAL_TEMP_FLOOR = 26.17;

  /**
   * 튜토리얼 여부에 따른 온도 하한선을 반환합니다.
   */
  static getTemperatureFloor(isTutorial: boolean): number {
    return isTutorial ? this.TUTORIAL_TEMP_FLOOR : 0;
  }

  /**
   * 튜토리얼 첫 타격 시 유저 편의를 위해 링 수축 속도를 조절합니다.
   */
  static getRingSpeedFactor(isTutorial: boolean, tutorialStep: string | null, perfectCount: number): number {
    if (isTutorial && tutorialStep === 'SMITHING_MINIGAME_HIT' && perfectCount === 0) {
      return 0.6; // 기존 0.3(70% 감속)에서 0.6(40% 감속)으로 상향하여 쾌적함 개선
    }
    return 1.0;
  }

  /**
   * 튜토리얼 중 첫 시도시 강제로 EASY 난이도 설정을 적용할지 결정합니다.
   */
  static getForcedDifficulty(isTutorial: boolean, tutorialStep: string | null, perfectCount: number) {
    if (isTutorial && tutorialStep === 'SMITHING_MINIGAME_HIT' && perfectCount === 0) {
      return SMITHING_CONFIG.DIFFICULTY.EASY;
    }
    return null;
  }

  /**
   * 현재 튜토리얼 단계에 따라 리액트 오버레이에 보고할 하이라이트 영역을 계산합니다.
   */
  static getHighlightRect(
    isTutorial: boolean, 
    tutorialStep: string | null, 
    isPlaying: boolean,
    components: {
      heatUpBtn: Phaser.GameObjects.Container;
      bellowsBtn: Phaser.GameObjects.Container;
      hitX: number;
      hitY: number;
      targetRadius: number;
    }
  ) {
    if (!isTutorial || !tutorialStep) return null;

    switch (tutorialStep) {
      case 'PRE_IGNITE_INDICATE':
      case 'SMITHING_MINIGAME_IGNITE':
        return { 
          x: components.heatUpBtn.x, 
          y: components.heatUpBtn.y, 
          w: 100 * components.heatUpBtn.scaleX, 
          h: 100 * components.heatUpBtn.scaleY 
        };
      case 'PRE_PUMP_INDICATE':
      case 'SMITHING_MINIGAME_PUMP':
        return { 
          x: components.bellowsBtn.x, 
          y: components.bellowsBtn.y, 
          w: 100 * components.bellowsBtn.scaleX, 
          h: 100 * components.bellowsBtn.scaleY 
        };
      case 'SMITHING_MINIGAME_HIT':
        if (isPlaying) {
          return { 
            x: components.hitX, 
            y: components.hitY, 
            w: components.targetRadius * 3, 
            h: components.targetRadius * 3 
          };
        }
        return null;
      default:
        return null;
    }
  }
}
