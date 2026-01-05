
import React, { useState, useEffect, useCallback } from 'react';
import { GameProvider } from './context/GameContext';
import IntroScreen from './components/IntroScreen';
import TitleScreen from './components/TitleScreen';
import MainGameLayout from './components/MainGameLayout';
import { getNextAvailableSlot } from './utils/saveSystem';
import { GameState } from './types/game-state';

type GameView = 'INTRO' | 'TITLE' | 'GAME';

const App = () => {
  const [view, setView] = useState<GameView>('INTRO');
  const [pendingLoadState, setPendingLoadState] = useState<GameState | null>(null);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  const handleIntroComplete = () => {
      setView('TITLE');
  };

  const handleNewGame = () => {
      const nextSlot = getNextAvailableSlot();
      setActiveSlotIndex(nextSlot);
      setPendingLoadState(null);
      setView('GAME');
  };

  const handleLoadGame = useCallback((data: GameState, slotIndex: number) => {
      if (data) {
          setActiveSlotIndex(slotIndex);
          setPendingLoadState(data);
          setView('GAME');
      } else {
          alert("Failed to load save data!");
      }
  }, []);

  const handleQuitToTitle = () => {
      setView('TITLE');
      setPendingLoadState(null);
  };

  // 게임 진행 중 로드 요청 시 호출되는 함수
  const handleLoadFromSettings = (data: GameState, slotIndex: number) => {
      // 1. 먼저 타이틀 화면으로 나가서 기존 게임 인스턴스를 파괴
      setView('TITLE');
      
      // 2. 다음 프레임에서 새로운 데이터로 게임 시작
      setTimeout(() => {
          handleLoadGame(data, slotIndex);
      }, 50);
  };

  return (
      <>
        {view === 'INTRO' && <IntroScreen onComplete={handleIntroComplete} />}
        
        {view === 'TITLE' && <TitleScreen onNewGame={handleNewGame} onLoadGame={handleLoadGame} />}
        
        {view === 'GAME' && (
            <GameProvider initialSlotIndex={activeSlotIndex}>
                <GameLoader initialData={pendingLoadState}>
                    <MainGameLayout onQuit={handleQuitToTitle} onLoadFromSettings={handleLoadFromSettings} />
                </GameLoader>
            </GameProvider>
        )}
      </>
  );
};

/**
 * GameLoader 컴포넌트:
 * GameProvider 내부에서 실행되어, 로드할 데이터가 있는 경우 상태를 즉시 교체합니다.
 */
import { useGame } from './context/GameContext';
const GameLoader: React.FC<{ initialData: GameState | null, children: React.ReactNode }> = ({ initialData, children }) => {
    const { actions } = useGame();
    const isFirstRun = React.useRef(true);

    useEffect(() => {
        if (isFirstRun.current && initialData) {
            actions.loadGame(initialData);
        }
        isFirstRun.current = false;
    }, [initialData, actions]);

    return <>{children}</>;
};

export default App;
