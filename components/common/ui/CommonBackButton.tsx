import React from 'react';
import { SfxButton } from './SfxButton';
import backButtonFrame from '../../../assets/ui/common_back_button_ui.png';

interface CommonBackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    widthClassName?: string;
    heightClassName?: string;
    textClassName?: string;
}

export const CommonBackButton: React.FC<CommonBackButtonProps> = ({
    label,
    className = '',
    widthClassName = 'w-[128px] md:w-[162px]',
    heightClassName = 'h-[52px] md:h-[66px]',
    textClassName = '',
    disabled,
    ...props
}) => {
    return (
        <SfxButton
            {...props}
            type={props.type ?? 'button'}
            sfx="switch"
            disabled={disabled}
            className={`group inline-flex shrink-0 items-center overflow-visible bg-transparent transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${widthClassName} ${heightClassName} ${className}`}
        >
            <span className="relative flex h-full w-full items-center overflow-visible">
                <img
                    src={backButtonFrame}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
                />
                <span
                    className={`relative z-10 flex min-w-0 -translate-y-[2px] items-center pl-[36%] pr-[8%] text-[14px] font-black uppercase leading-none tracking-[0.12em] text-stone-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)] transition-colors group-hover:text-amber-100 md:text-[16px] md:tracking-[0.14em] ${textClassName}`}
                >
                    <span className="truncate">{label}</span>
                </span>
            </span>
        </SfxButton>
    );
};
