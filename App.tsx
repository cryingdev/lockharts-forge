
import React, { useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import IntroScreen from './components/IntroScreen';
import TitleScreen from './components/TitleScreen';
import MainGameLayout from './components/MainGameLayout';
import { loadFromStorage } from './utils/saveSystem';
import { GameState } from './types/game-state';

type GameView = 'INTRO' | 'TITLE' | 'GAME';

const App = () => {
  const [view, setView] = useState<GameView>('INTRO');
  const [pendingLoadState, setPendingLoadState] = useState<GameState | null>(null);

  const handleIntroComplete = () => {
      setView('TITLE');
  };

  const handleNewGame = () => {
      setPendingLoadState(null);
      setView('GAME');
  };

  const handleLoadGame = (data: GameState) => {
      if (data) {
          setPendingLoadState(data);
          setView('GAME');
      } else {
          alert("Failed to load save data!");
      }
  };

  const handleQuitToTitle = () => {
      setView('TITLE');
  };

  return (
      <>
        {view === 'INTRO' && <IntroScreen onComplete={handleIntroComplete} />}
        
        {view === 'TITLE' && <TitleScreen onNewGame={handleNewGame} onLoadGame={handleLoadGame} />}
        
        {view === 'GAME' && (
            <GameProvider>
                <GameLoader initialData={pendingLoadState}>
                    <MainGameLayout onQuit={handleQuitToTitle} />
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
