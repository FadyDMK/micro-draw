module.exports = {
    USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:3000',
    ROOM_SERVICE_URL: process.env.ROOM_SERVICE_URL || 'http://localhost:4000',
    GAME_ENGINE_URL: process.env.GAME_ENGINE_URL || 'ws://localhost:5000'
};