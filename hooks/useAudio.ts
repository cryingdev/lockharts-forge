
import { useCallback } from 'react';

/**
 * useAudio Hook
 * 전역 AudioManager에 이벤트를 전달하여 사운드를 재생합니다.
 */
export const useAudio = () => {
    /**
     * 특정 파일명의 SFX를 재생합니다.
     */
    const playSfx = useCallback((file: string) => {
        window.dispatchEvent(new CustomEvent('play-sfx', { detail: { file } }));
    }, []);

    /**
     * 가장 일반적인 UI 클릭 효과음을 재생합니다.
     */
    const playClick = useCallback(() => {
        playSfx('click_light.wav');
    }, [playSfx]);

    /**
     * 탭 전환이나 토글 스위치 효과음을 재생합니다.
     */
    const playSwitch = useCallback(() => {
        playSfx('tab_switch.wav');
    }, [playSfx]);

    return { playSfx, playClick, playSwitch };
};
