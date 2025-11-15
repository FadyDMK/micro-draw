import { GameProvider, useGame } from '../hooks/useGame';
import Canvas from './Canvas';
import GameInfo from './GameInfo';
import Chat from './Chat';
import '../styles/Game.css';

interface GameProps {
  token: string;
  userId: string;
  gameId: string;
  onLeave: () => void;
}

function GameContent({ onLeave }: { onLeave: () => void }) {
  const { isConnected, turnActive, players } = useGame();

  if (!isConnected) {
    return (
      <div className="game-layout">
        <header className="game-header">
          <h1>Micro Draw</h1>
          <button onClick={onLeave} className="leave-button">
            Leave Game
          </button>
        </header>
        <div className="game-loading">
          <div className="loading-spinner"></div>
          <p>Connecting to game server...</p>
        </div>
      </div>
    );
  }

  if (!turnActive && players.length < 2) {
    return (
      <div className="game-layout">
        <header className="game-header">
          <h1>Micro Draw</h1>
          <button onClick={onLeave} className="leave-button">
            Leave Game
          </button>
        </header>
        <div className="game-loading">
          <p>Waiting for game to start...</p>
          <p className="game-loading-hint">{players.length}/2 players connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout">
      <header className="game-header">
        <h1>Micro Draw</h1>
        <button onClick={onLeave} className="leave-button">
          Leave Game
        </button>
      </header>

      <div className="game-content">
        <div className="left-panel">
          <Canvas />
        </div>

        <div className="right-panel">
          <GameInfo />
          <Chat />
        </div>
      </div>
    </div>
  );
}

function Game({ token, userId, gameId, onLeave }: GameProps) {
  return (
    <GameProvider token={token} gameId={gameId} userId={userId}>
      <GameContent onLeave={onLeave} />
    </GameProvider>
  );
}

export default Game;
