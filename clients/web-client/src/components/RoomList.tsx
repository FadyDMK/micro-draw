import { useEffect, useState, type FormEvent } from "react";
import type { Player, Room } from "../types/game";
import { roomService } from "../utils/api";
import '../styles/RoomList.css';

interface RoomListProps {
    token: string;
    userId: string;
    username: string;
    onGameStart: (gameId: string) => void;
}

function RoomList({ token, userId, onGameStart }: RoomListProps) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState<string | null>(null);

    useEffect(() => {
        loadRooms();
        const interval = setInterval(loadRooms, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadRooms = async () => {
        try {
            setLoading(true);
            const RoomList = await roomService.listRooms();
            setRooms(RoomList);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (e: FormEvent) => {
        e.preventDefault();
        if (!newRoomName.trim()) {
            setError('Room name cannot be empty');
            return;
        }
        setCreating(true);
        setError('');
        try {
            const room = await roomService.createRoom(newRoomName.trim());
            const joinedRoom = await roomService.joinRoom(room.id, token, userId);

            if (joinedRoom.gameId) {
                onGameStart(joinedRoom.gameId);
            } else {
                setShowCreateModal(false);
                setNewRoomName('');
                await loadRooms();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create room');
        } finally {
            setCreating(false);
        }
    }
    const handleJoinRoom = async (roomId: string) => {
        setJoining(roomId);
        setError('');
        try {
            const joinedRoom = await roomService.joinRoom(roomId, token, userId);
            if (joinedRoom.gameId) {
                onGameStart(joinedRoom.gameId);
            } else {
                await loadRooms();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to join room');
        } finally {
            setJoining(null);
        }

        if (loading) {
            return (
                <div>
                    <div>Loading available rooms...</div>
                </div>
            )
        }
    };

    return (
        <div className="room-list-container">
            <div className="room-list-header">
                <h1>Game Rooms:</h1>
                <button
                    className="create-room-btn"
                    onClick={() => setShowCreateModal(true)}
                >
                    + Create Room
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    ❌ {error}
                </div>
            )}

            {rooms.length === 0 ? (
                <div className="empty-state">
                    <p>No rooms available</p>
                    <p className="empty-subtitle">Create one to get started!</p>
                </div>
            ) : (
                <div className="rooms-grid">
                    {rooms.map((room) => {
                        const isFull = room.players.length >= 2;
                        const isJoining = joining === room.id;

                        return (
                            <div key={room.id} className={`room-card ${isFull ? 'full' : ''}`}>
                                <div className="room-header">
                                    <h3 className="room-name">{room.name}</h3>
                                    <span className={`room-status ${isFull ? 'full' : 'open'}`}>
                                        {isFull ? '🔴 Full' : '🟢 Open'}
                                    </span>
                                </div>

                                <div className="room-info">
                                    <div className="player-count">
                                        👥 {room.players.length}/2 players
                                    </div>
                                    {room.players.length > 0 && (
                                        <div className="player-list">
                                            {room.players.map((p: string) => (
                                                <span key={p} className="player-tag">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="join-btn"
                                    onClick={() => handleJoinRoom(room.id)}
                                    disabled={isFull || isJoining}
                                >
                                    {isJoining ? 'Joining...' : isFull ? 'Room Full' : 'Join Room'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => !creating && setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New Room</h2>
                        <form onSubmit={handleCreateRoom}>
                            <input
                                type="text"
                                placeholder="Enter room name"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                required
                                minLength={3}
                                maxLength={30}
                                autoFocus
                                disabled={creating}
                            />
                            <div className="modal-buttons">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={creating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={creating || !newRoomName.trim()}
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>);
}
export default RoomList;