const axios = require('axios');
const { ROOM_SERVICE_URL } = require('../config/config');

async function listRooms() {
    try {
        const response = await axios.get(`${ROOM_SERVICE_URL}/rooms`, { timeout: 2000 });
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch rooms: ' + error.message);
    }


}
async function createRoom(name) {
    try {
        const response = await axios.post(`${ROOM_SERVICE_URL}/rooms/create`,
                                         { name },
                                         { timeout: 2000 });
        return response.data;
    } catch (error) {
        throw new Error('Failed to create room: ' + error.message);
    }
}

async function joinRoom(roomId, token, userId) {
    try {
        const response = await axios.post(`${ROOM_SERVICE_URL}/rooms/join/${roomId}`,
                                         { token, userId },
                                         { timeout: 2000 });
        return response.data;
    } catch (error) {
        throw new Error('Failed to join room: ' + error.message);
    }
}

async function getRoom(roomId) {
    try {
        const response = await axios.get(`${ROOM_SERVICE_URL}/rooms/${roomId}`, { timeout: 2000 });
        return response.data;
    } catch (error) {
        throw new Error('Failed to get room: ' + error.message);
    }
}
module.exports = {
    listRooms,
    createRoom,
    joinRoom,
    getRoom
};
