
import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { getMusicUrl } from '../utils';

/**
 * AudioManager
 * Web Audio API(AudioContext)를 사용하여 배경음을 재생합니다.
 * 이 방식은 OS 레벨의 미디어 플레이어(다이내믹 아일랜드, 잠금 화면)에 등록되지 않습니다.
 */
const AudioManager: React.FC = () => {
    const { state } = useGame();
    const audioSettings = state.settings.audio;
    
    const contextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const bufferRef = useRef<AudioBuffer | null>(null);

    // 1. 오디오 컨텍스트 및 노드 초기화
    useEffect(() => {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        
        contextRef.current = ctx;
        gainNodeRef.current = gainNode;

        // Media Session API 무력화 (OS 컨트롤러 노출 방지)
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
        }

        // BGM 로드
        const loadBgm = async () => {
            try {
                const response = await fetch(getMusicUrl('track_01.mp3'));
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                bufferRef.current = audioBuffer;
                
                // 초기 로드 후 설정에 따라 재생 시도
                if (state.settings.audio.masterEnabled && state.settings.audio.musicEnabled) {
                    startPlayback();
                }
            } catch (e) {
                console.debug("BGM load failed", e);
            }
        };

        loadBgm();

        return () => {
            stopPlayback();
            if (contextRef.current) {
                contextRef.current.close();
            }
        };
    }, []);

    const startPlayback = () => {
        const ctx = contextRef.current;
        const buffer = bufferRef.current;
        const gainNode = gainNodeRef.current;
        if (!ctx || !buffer || !gainNode || sourceRef.current) return;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gainNode);
        
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        source.start(0);
        sourceRef.current = source;
    };

    const stopPlayback = () => {
        if (sourceRef.current) {
            try {
                sourceRef.current.stop();
            } catch (e) {}
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
    };

    // 2. 설정 동기화
    useEffect(() => {
        const gainNode = gainNodeRef.current;
        if (!gainNode) return;

        const effectiveVolume = audioSettings.masterVolume * audioSettings.musicVolume;
        gainNode.gain.setTargetAtTime(effectiveVolume, contextRef.current?.currentTime || 0, 0.1);

        const shouldPlay = audioSettings.masterEnabled && audioSettings.musicEnabled;
        if (shouldPlay) {
            if (!sourceRef.current && bufferRef.current) {
                startPlayback();
            }
        } else {
            stopPlayback();
        }
    }, [audioSettings.masterVolume, audioSettings.musicVolume, audioSettings.masterEnabled, audioSettings.musicEnabled]);

    // 3. 사용자 상호작용 대응 (Autoplay 제한 해제)
    useEffect(() => {
        const handleInteraction = () => {
            if (contextRef.current && contextRef.current.state === 'suspended') {
                contextRef.current.resume();
            }
            if (audioSettings.masterEnabled && audioSettings.musicEnabled && !sourceRef.current && bufferRef.current) {
                startPlayback();
            }
        };

        window.addEventListener('mousedown', handleInteraction, { once: true });
        window.addEventListener('touchstart', handleInteraction, { once: true });
    }, [audioSettings.masterEnabled, audioSettings.musicEnabled]);

    return null;
};

export default AudioManager;
