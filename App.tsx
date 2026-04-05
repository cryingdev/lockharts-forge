import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { GameProvider } from './context/GameContext';
import IntroScreen from './components/IntroScreen';
import TitleScreen from './components/TitleScreen';
// Fix: Use default import for MainGameLayout as it is exported as default in its source file
const MainGameLayout = lazy(() => import('./components/MainGameLayout'));
import { getNextAvailableSlot, migrateSaveData } from './utils/saveSystem';
import { GameState } from './types/game-state';
import { createInitialGameState } from './state/initial-game-state';
// Moved useGame import from line 72 to the top of the file
import { useGame } from './context/GameContext';
import AudioManager from './services/AudioManager';
import AssetManager from './services/AssetManager';
import { rng } from './utils/random';

type GameView = 'INTRO' | 'TITLE' | 'GAME';

const App = () => {
  const [view, setView] = useState<GameView>('INTRO');
  const [pendingLoadState, setPendingLoadState] = useState<GameState | null>(null);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [pendingSkipTutorial, setPendingSkipTutorial] = useState(false);

  const handleIntroComplete = () => {
      setView('TITLE');
  };

  const handleNewGame = (skipTutorial: boolean) => {
      const nextSlot = getNextAvailableSlot();
      const initialState = createInitialGameState();
      setActiveSlotIndex(nextSlot);
      setPendingLoadState(initialState);
      setPendingSkipTutorial(skipTutorial);
      setView('GAME');
  };

  const handleLoadGame = useCallback((data: any, slotIndex: number) => {
      if (data) {
          const initialState = createInitialGameState();
          const migratedData = migrateSaveData(data, initialState);
          setActiveSlotIndex(slotIndex);
          setPendingLoadState(migratedData);
          setPendingSkipTutorial(false);
          setView('GAME');
      } else {
          alert("Failed to load save data!");
      }
  }, []);

  const handleQuitToTitle = () => {
      setView('TITLE');
      setPendingLoadState(null);
      setPendingSkipTutorial(false);
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
      <GameProvider initialSlotIndex={activeSlotIndex}>
        <AssetManager />
        <AudioManager currentView={view} />
        
        <Suspense fallback={<div className="h-screen w-screen bg-stone-950" />}>
          {view === 'INTRO' && <IntroScreen onComplete={handleIntroComplete} />}
          
          {view === 'TITLE' && <TitleScreen onNewGame={handleNewGame} onLoadGame={handleLoadGame} />}
          
          {view === 'GAME' && (
              <GameLoader initialData={pendingLoadState} skipTutorial={pendingSkipTutorial}>
                  <MainGameLayout onQuit={handleQuitToTitle} onLoadFromSettings={handleLoadFromSettings} />
              </GameLoader>
          )}
        </Suspense>
      </GameProvider>
  );
};

/**
 * GameLoader 컴포넌트:
 * GameProvider 내부에서 실행되어, 로드할 데이터가 있는 경우 상태를 즉시 교체합니다.
 * 새 게임이면서 skipTutorial이 활성화된 경우 튜토리얼을 즉시 건너뜁니다.
 */
const GameLoader: React.FC<{ initialData: GameState | null, skipTutorial: boolean, children: React.ReactNode }> = ({ initialData, skipTutorial, children }) => {
    const { state, actions } = useGame();
    const isFirstRun = React.useRef(true);

    useEffect(() => {
        if (isFirstRun.current) {
            if (initialData) {
                actions.loadGame(initialData);
                rng.setSeed(initialData.seed);
                if (skipTutorial) {
                    actions.completeTutorial();
                    actions.dismissTutorialComplete();
                }
            }
        }
        isFirstRun.current = false;
    }, [initialData, skipTutorial, actions]);

    return <>{children}</>;
};

export default App;
