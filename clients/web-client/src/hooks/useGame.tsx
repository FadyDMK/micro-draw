import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useGameWebSocket } from './useWebSocket';
import type {
  GameMessage,
  GameContext as GameContextType,
  ChatMessage,
  DrawPoint,
} from '../types/game';

interface GameProviderProps {
  token: string;
  gameId: string;
  userId: string;
  children: ReactNode;
}

interface GameContextValue extends GameContextType {
  isConnected: boolean;
  chatMessages: ChatMessage[];
  canvasPoints: DrawPoint[];
  sendDraw: (x: number, y: number, color?: string) => void;
  sendDrawLine: (x1: number, y1: number, x2: number, y2: number, color?: string) => void;
  sendGuess: (message: string) => void;
  clearCanvas: () => void;
  remainingTimeMs: number;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider = ({ token, gameId, userId, children }: GameProviderProps) => {
  const [gameContext, setGameContext] = useState<GameContextType>({
    gameId: null,
    players: [],
    playersMap: {},
    role: 'spectator',
    isDrawer: false,
    canDraw: false,
    turnActive: false,
    word: null,
    wordLength: null,
    scores: {},
    drawerId: null,
    turnNumber: 0,
    totalTurns: 0,
    turnEndsAt: null,
    gameOver: false,
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [canvasPoints, setCanvasPoints] = useState<DrawPoint[]>([]);
  const [remainingTimeMs, setRemainingTimeMs] = useState(0);

  const handleMessage = (message: GameMessage) => {
    switch (message.type) {
      case 'auth':
        if (message.success) {
          console.log('Authenticated successfully');
        }
        break;

      case 'state':
        const playersMap = message.players.reduce((map, player) => {
          map[player.id] = player.username;
          return map;
        }, {} as Record<string, string>);

        setGameContext((prev) => ({
          ...prev,
          gameId: message.gameId,
          players: message.players,
          playersMap,
          scores: message.scores || message.state?.scores || {},
          role: message.role || 'guesser',
          isDrawer: message.role === 'drawer',
          drawerId: message.state?.drawerId || null,
          turnNumber: message.state?.turnNumber || 0,
          totalTurns: message.state?.totalTurns || 0,
          turnActive: Boolean(message.state?.drawerId),
          canDraw: Boolean(message.isYourTurn),
          turnEndsAt: message.state?.turnEndsAt || null,
        }));

        if (message.state?.canvas) {
          setCanvasPoints(message.state.canvas);
        }
        break;

      case 'turn-start':
        setGameContext((prev) => ({
          ...prev,
          turnActive: true,
          drawerId: message.drawerId,
          turnNumber: message.turnNumber,
          totalTurns: message.totalTurns,
          canDraw: message.role === 'drawer',
          isDrawer: message.role === 'drawer',
          role: message.role,
          word: message.role === 'drawer' ? message.word ?? null : null,
          wordLength: message.role === 'guesser' ? message.wordLength ?? null : null,
          scores: message.scores || prev.scores,
          turnEndsAt: message.endsAt,
        }));
        setRemainingTimeMs(message.durationMs);
        break;

      case 'draw':
        setCanvasPoints((prev) => [
          ...prev,
          { x: message.x, y: message.y, color: message.color, playerId: message.from },
        ]);
        setGameContext((prev) => ({
          ...prev,
          drawerId: message.drawerId,
          canDraw: Boolean(message.isYourTurn),
        }));
        break;

      case 'draw-line':
        if (message.points) {
          const newPoints = message.points.map((p) => ({
            x: p.x,
            y: p.y,
            color: message.color,
            playerId: message.from,
          }));
          setCanvasPoints((prev) => [...prev, ...newPoints]);
        }
        setGameContext((prev) => ({
          ...prev,
          drawerId: message.drawerId,
          canDraw: Boolean(message.isYourTurn),
        }));
        break;

      case 'chat':
        setChatMessages((prev) => [
          ...prev,
          { from: message.from, message: message.message, timestamp: Date.now() },
        ]);
        break;

      case 'guess-result':
        setGameContext((prev) => ({
          ...prev,
          scores: message.scores || prev.scores,
        }));
        setChatMessages((prev) => [
          ...prev,
          {
            from: 'SYSTEM',
            message: `${gameContext.playersMap[message.guesserId] || message.guesserId} guessed "${message.word}" correctly!`,
            timestamp: Date.now(),
          },
        ]);
        break;

      case 'turn-end':
        setGameContext((prev) => ({
          ...prev,
          turnActive: false,
          canDraw: false,
          drawerId: null,
          word: null,
          wordLength: null,
          scores: message.scores || prev.scores,
          turnEndsAt: null,
        }));

        let endMessage = '';
        if (message.reason === 'timeout') {
          endMessage = `Time's up! The word was "${message.word}"`;
        } else if (message.reason === 'guessed' && message.guesserId) {
          endMessage = `${gameContext.playersMap[message.guesserId] || 'Someone'} guessed it right!`;
        }

        if (endMessage) {
          setChatMessages((prev) => [
            ...prev,
            { from: 'SYSTEM', message: endMessage, timestamp: Date.now() },
          ]);
        }
        break;

      case 'game-over':
        setGameContext((prev) => ({
          ...prev,
          turnActive: false,
          canDraw: false,
          scores: message.scores || prev.scores,
          gameOver: true,
        }));

        const winnerNames = message.winnerIds.map(
          (id) => gameContext.playersMap[id] || id
        );
        setChatMessages((prev) => [
          ...prev,
          {
            from: 'SYSTEM',
            message: `Game Over! Winner${winnerNames.length > 1 ? 's' : ''}: ${winnerNames.join(', ')}`,
            timestamp: Date.now(),
          },
        ]);
        break;

      case 'canvas-clear':
        setCanvasPoints([]);
        setChatMessages((prev) => [
          ...prev,
          { from: 'SYSTEM', message: 'Canvas cleared for next turn', timestamp: Date.now() },
        ]);
        break;

      case 'error':
        console.error('Game error:', message.error);
        setChatMessages((prev) => [
          ...prev,
          { from: 'SYSTEM', message: `❌ Error: ${message.error}`, timestamp: Date.now() },
        ]);
        break;
    }
  };

  const { isConnected, authenticate, joinGame, draw, drawLine, sendChat } = useGameWebSocket({
    onMessage: handleMessage,
    userId,
  });

  // Authenticate and join game when connected
  useEffect(() => {
    if (isConnected) {
      authenticate(token);
      // Wait a bit for auth before joining
      setTimeout(() => {
        joinGame(gameId);
      }, 100);
    }
  }, [isConnected, token, gameId]);

  // Timer countdown
  useEffect(() => {
    if (!gameContext.turnEndsAt) {
      setRemainingTimeMs(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, gameContext.turnEndsAt! - Date.now());
      setRemainingTimeMs(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameContext.turnEndsAt]);

  const sendDraw = (x: number, y: number, color: string = 'white') => {
    if (gameContext.canDraw && gameContext.turnActive) {
      draw(x, y, color);
    }
  };

  const sendDrawLine = (x1: number, y1: number, x2: number, y2: number, color: string = 'white') => {
    if (gameContext.canDraw && gameContext.turnActive) {
      drawLine(x1, y1, x2, y2, color);
    }
  };

  const sendGuess = (message: string) => {
    sendChat(message);
  };

  const clearCanvas = () => {
    setCanvasPoints([]);
  };

  return (
    <GameContext.Provider
      value={{
        ...gameContext,
        isConnected,
        chatMessages,
        canvasPoints,
        sendDraw,
        sendDrawLine,
        sendGuess,
        clearCanvas,
        remainingTimeMs,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
