import { useState } from 'react';
import Login from './components/Login';
import RoomList from './components/RoomList';
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
    <div style={{ padding: '20px' }}>
      <h1>Game Started!</h1>
      <p>Game ID: {gameId}</p>
      <p>(Next: Build Game component)</p>
    </div>
  );
}

export default App;