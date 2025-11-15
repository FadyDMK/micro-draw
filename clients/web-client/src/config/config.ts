export const config = {
  USER_SERVICE_URL: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3000',
  ROOM_SERVICE_URL: import.meta.env.VITE_ROOM_SERVICE_URL || 'http://localhost:4000',
  GAME_ENGINE_URL: import.meta.env.VITE_GAME_ENGINE_URL || 'ws://localhost:5000',
};
