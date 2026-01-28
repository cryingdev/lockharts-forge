
import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { getMusicUrl } from '../utils';

/**
 * AudioManager
 * 게임 전반의 오디오(BGM)를 관리하는 보이지 않는 컴포넌트입니다.
 * GameState의 오디오 설정 변화를 실시간으로 반영하며 중첩 재생을 방지합니다.
 */
const AudioManager: React.FC = () => {
    const { state } = useGame();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioSettings = state.settings.audio;

    // 초기 오디오 객체 생성 및 관리
    useEffect(() => {
        // 기존에 혹시라도 남은 오디오가 있다면 정지 (Safety Check)
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }

        const music = new Audio(getMusicUrl('track_01.mp3'));
        music.loop = true;
        // 초기 볼륨 설정 (마운트 시점의 상태 반영)
        const initialVol = state.settings.audio.masterVolume * state.settings.audio.musicVolume;
        music.volume = Math.max(0, Math.min(1, initialVol));
        
        audioRef.current = music;

        // 컴포넌트 언마운트 시 클린업 (예: 앱 재시작 등)
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current = null;
            }
        };
    }, []); // 빈 의존성 배열: 앱 수명 주기 동안 단 한 번만 생성

    // 설정 변경에 따른 실시간 동기화
    useEffect(() => {
        const music = audioRef.current;
        if (!music) return;

        // 실시간 볼륨 동기화: 마스터 볼륨 * 배경음 볼륨
        const effectiveVolume = audioSettings.masterVolume * audioSettings.musicVolume;
        music.volume = Math.max(0, Math.min(1, effectiveVolume));

        // 재생 상태 제어
        const shouldPlay = audioSettings.masterEnabled && audioSettings.musicEnabled;

        if (shouldPlay) {
            // 브라우저 Autoplay 정책 대응
            if (music.paused) {
                music.play().catch(() => {
                    // 상호작용 전이면 실패할 수 있음 (Interaction 리스너에서 처리됨)
                });
            }
        } else {
            if (!music.paused) {
                music.pause();
            }
        }

    }, [audioSettings.masterVolume, audioSettings.musicVolume, audioSettings.masterEnabled, audioSettings.musicEnabled]);

    // 전역 상호작용 리스너 (브라우저 정책 해제용)
    useEffect(() => {
        const handleFirstInteraction = () => {
            if (audioRef.current && state.settings.audio.masterEnabled && state.settings.audio.musicEnabled) {
                if (audioRef.current.paused) {
                    audioRef.current.play().catch(() => {});
                }
            }
            window.removeEventListener('mousedown', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
        };

        window.addEventListener('mousedown', handleFirstInteraction);
        window.addEventListener('touchstart', handleFirstInteraction);

        return () => {
            window.removeEventListener('mousedown', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
        };
    }, [state.settings.audio.masterEnabled, state.settings.audio.musicEnabled]);

    return null;
};

export default AudioManager;
