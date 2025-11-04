const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const UserServiceURL = process.env.USER_SERVICE_URL || 'http://localhost:3000';
const GameEngineURL = process.env.GAME_ENGINE_URL || 'http://localhost:5000';

const rooms = new Map(); // roomId -> {id, name, players: [{id, username}], gameId?: string}

async function tryGet(url) {
    try {
        const response = await axios.get(url, { timeout: 2000 });
        return response.data;
    } catch (error) {
        return null;
    }
}

async function verifyUserByToken(token) {
    const url = `${UserServiceURL}/tokens/${token}`;
    const data = await tryGet(url);
    if (data && (data.userId || data.username)) return data;

    return null;
}

async function verifyUserById(userId) {
    const url = `${UserServiceURL}/user/${userId}`;
    const data = await tryGet(url);
    if (data && data.id) return data;
    return null;
}

function createRoom(req, res) {
    const id = uuidv4();
    const name = req.body?.name || `room-${id.substring(0, 5)}`;
    const newRoom = { id, name, players: [] }; 
    rooms.set(id, newRoom);
    res.status(201).json(newRoom);
}

async function joinRoom(req, res) {
    const roomId = req.params.roomId;
    const token = req.body?.token;
    const userId = req.body?.userId;
    const room = rooms.get(roomId);
    if (!room) return res.status(404).send('Room not found');

    let userData = null;
    if (token) {
        userData = await verifyUserByToken(token);
        if (userData && userData.userId) {
            userData = await verifyUserById(userData.userId);
        }
    } else if (userId) {
        userData = await verifyUserById(userId);
    } else {
        return res.status(400).send('Either token or userId is required');
    }

    if (!userData) return res.status(401).send('Invalid token or userId');

    const id = userData.id || userData.userId;
    const username = userData.username || userData.name || 'unknown';
    const user = { id, username };

    if (room.players.find(u => u.id === user.id)) return res.status(409).send('User already in room');
    room.players.push(user);

    if (room.players.length === 2 && !room.gameId) {
        try {
            console.log(`Attempting to create game at: ${GameEngineURL}/games`);
            const gameResponse = await axios.post(`${GameEngineURL}/games`, {
                roomId: room.id,
                players: room.players
            }, { timeout: 3000 });
            
            if (gameResponse.data && gameResponse.data.id) {
                room.gameId = gameResponse.data.id;
                console.log(`Game created: ${room.gameId} for room: ${room.id}`);
            }
        } catch (error) {
            console.error('Failed to create game:', error.message);
        }
    }

    res.json(room);
}

function getRoom(req, res) {
    const room = rooms.get(req.params.roomId);
    if (!room) return res.status(404).send('Room not found');
    res.json(room);
}

function listRooms(req, res) {
    const list = Array.from(rooms.values());
    res.json(list);
}

module.exports = {
    createRoom,
    joinRoom,
    getRoom,
    listRooms
};