
import React from 'react';
import { useAudio } from '../../../hooks/useAudio';

interface SfxButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** 
     * 재생할 SFX 유형. 
     * 'click': item_click.wav (기본값)
     * 'switch': tab_switch.wav
     * string: 커스텀 파일명
     */
    sfx?: 'click' | 'switch' | string;
}

/**
 * SfxButton
 * 클릭 시 자동으로 효과음을 재생하는 공용 버튼 컴포넌트입니다.
 */
export const SfxButton: React.FC<SfxButtonProps> = ({ 
    sfx = 'click', 
    onClick, 
    children, 
    ...props 
}) => {
    const { playClick, playSwitch, playSfx } = useAudio();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (props.disabled) return;

        // 사운드 재생
        if (sfx === 'click') playClick();
        else if (sfx === 'switch') playSwitch();
        else playSfx(sfx);

        // 기존 클릭 핸들러 실행
        if (onClick) onClick(e);
    };

    return (
        <button 
            {...props} 
            onClick={handleClick}
        >
            {children}
        </button>
    );
};
