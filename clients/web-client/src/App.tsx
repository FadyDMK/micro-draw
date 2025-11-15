import { useState } from 'react';
import Login from './components/Login';
import RoomList from './components/RoomList';
import Game from './components/Game';
import './App.css';

type AppState = 'login' | 'rooms' | 'game';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  if (appState === 'login') {
    return (
      <Login
        onLogin={(token, userId, username) => {
          setToken(token);
          setUserId(userId);
          setUsername(username);
          setAppState('rooms');
        }}
      />
    );
  }

  if (appState === 'rooms') {
    return (
      <RoomList
        token={token!}
        userId={userId!}
        username={username!}
        onGameStart={(gameId:string) => {
          setGameId(gameId);
          setAppState('game');
        }}
      />
    );
  }

  return (
    <Game
      token={token!}
      userId={userId!}
      gameId={gameId!}
      onLeave={() => {
        setGameId(null);
        setAppState('rooms');
      }}
    />
  );
}

export default App;