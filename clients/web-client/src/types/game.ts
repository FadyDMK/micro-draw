export interface Player {
  id: string;
  username: string;
}

export interface DrawPoint {
  x: number;
  y: number;
  color: string;
  playerId: string;
}

export interface GameState {
  turnNumber: number;
  turnsPerPlayer: number;
  totalTurns: number;
  drawerId: string | null;
  scores: Record<string, number>;
  turnEndsAt: number | null;
  canvas: DrawPoint[];
}

export interface GameContext {
  gameId: string | null;
  players: Player[];
  playersMap: Record<string, string>;
  role: 'drawer' | 'guesser' | 'spectator';
  isDrawer: boolean;
  canDraw: boolean;
  turnActive: boolean;
  word: string | null;
  wordLength: number | null;
  scores: Record<string, number>;
  drawerId: string | null;
  turnNumber: number;
  totalTurns: number;
  turnEndsAt: number | null;
  gameOver: boolean;
}

export interface ChatMessage {
  from: string;
  message: string;
  timestamp: number;
}

// WebSocket Message Types
export interface WSMessage {
  type: string;
  [key: string]: any;
}

export interface AuthMessage extends WSMessage {
  type: 'auth';
  success: boolean;
  userId?: string;
  error?: string;
}

export interface StateMessage extends WSMessage {
  type: 'state';
  gameId: string;
  state: GameState;
  players: Player[];
  scores: Record<string, number>;
  isYourTurn: boolean;
  role: 'drawer' | 'guesser';
}

export interface TurnStartMessage extends WSMessage {
  type: 'turn-start';
  turnNumber: number;
  totalTurns: number;
  drawerId: string;
  role: 'drawer' | 'guesser';
  word?: string;
  wordLength?: number;
  durationMs: number;
  endsAt: number;
  scores: Record<string, number>;
}

export interface DrawMessage extends WSMessage {
  type: 'draw';
  from: string;
  x: number;
  y: number;
  color: string;
  turnNumber: number;
  drawerId: string;
  isYourTurn: boolean;
  remainingMs: number;
}

export interface DrawLineMessage extends WSMessage {
  type: 'draw-line';
  from: string;
  points: { x: number; y: number }[];
  color: string;
  turnNumber: number;
  drawerId: string;
  isYourTurn: boolean;
  remainingMs: number;
}

export interface ChatMessageWS extends WSMessage {
  type: 'chat';
  from: string;
  message: string;
}

export interface GuessResultMessage extends WSMessage {
  type: 'guess-result';
  guesserId: string;
  word: string;
  turnNumber: number;
  scores: Record<string, number>;
}

export interface TurnEndMessage extends WSMessage {
  type: 'turn-end';
  reason: 'timeout' | 'guessed';
  word: string;
  drawerId: string;
  turnNumber: number;
  scores: Record<string, number>;
  guesserId?: string;
}

export interface GameOverMessage extends WSMessage {
  type: 'game-over';
  scores: Record<string, number>;
  winnerIds: string[];
  totalTurns: number;
}

export interface CanvasClearMessage extends WSMessage {
  type: 'canvas-clear';
}

export interface ErrorMessage extends WSMessage {
  type: 'error';
  error: string;
}
export interface Room {
  id: string;
  name: string;
  players: Player[];
  gameId?: string;
}
export type GameMessage =
  | AuthMessage
  | StateMessage
  | TurnStartMessage
  | DrawMessage
  | DrawLineMessage
  | ChatMessageWS
  | GuessResultMessage
  | TurnEndMessage
  | GameOverMessage
  | CanvasClearMessage
  | ErrorMessage;
