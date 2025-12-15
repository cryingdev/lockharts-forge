
import React, { useState } from 'react';
import { GameProvider } from './context/GameContext';
import IntroScreen from './components/IntroScreen';
import TitleScreen from './components/TitleScreen';
import MainGameLayout from './components/MainGameLayout';

type GameView = 'INTRO' | 'TITLE' | 'GAME';

const App = () => {
  const [view, setView] = useState<GameView>('INTRO');

  const handleIntroComplete = () => {
      setView('TITLE');
  };

  const handleNewGame = () => {
      setView('GAME');
  };

  const handleLoadGame = () => {
      // Logic to load saved state would go here
      // For now, treat as new game or show error
      console.log("Load Game not implemented yet");
  };

  const handleQuitToTitle = () => {
      setView('TITLE');
  };

  return (
      <>
        {view === 'INTRO' && <IntroScreen onComplete={handleIntroComplete} />}
        
        {view === 'TITLE' && <TitleScreen onNewGame={handleNewGame} onLoadGame={handleLoadGame} />}
        
        {view === 'GAME' && (
            // Wrapping MainGameLayout in GameProvider here ensures 
            // a fresh game state is created every time we enter 'GAME' view.
            <GameProvider>
                <MainGameLayout onQuit={handleQuitToTitle} />
            </GameProvider>
        )}
      </>
  );
};

export default App;
