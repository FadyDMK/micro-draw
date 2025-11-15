import { config } from '../config/config';
import type { Room } from '../types/game';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export const authService = {
  async register(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${config.USER_SERVICE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${config.USER_SERVICE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },
};

export const roomService = {
  async createRoom(name: string): Promise<Room> {
    const response = await fetch(`${config.ROOM_SERVICE_URL}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    return response.json();
  },

  async listRooms(): Promise<Room[]> {
    const response = await fetch(`${config.ROOM_SERVICE_URL}/rooms`);

    if (!response.ok) {
      throw new Error('Failed to list rooms');
    }

    return response.json();
  },

  async joinRoom(roomId: string, token: string, userId: string): Promise<Room> {
    const response = await fetch(`${config.ROOM_SERVICE_URL}/rooms/join/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to join room');
    }

    return response.json();
  },

  async getRoom(roomId: string): Promise<Room> {
    const response = await fetch(`${config.ROOM_SERVICE_URL}/rooms/${roomId}`);

    if (!response.ok) {
      throw new Error('Failed to get room');
    }

    return response.json();
  },
};
