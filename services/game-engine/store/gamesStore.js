const {v4: uuidv4} = require('uuid');

// games: gameId -> {id, name, players: [id, username], sockets: Map<userId, ws> ,state:{}}, 
const games = new Map();

function createGameInStore(roomId, players) {
    const id = uuidv4();
    const game = {
        id,
        roomId,
        players,
        sockets: new Map(),
        state: {turn: 0, canvas: []}
    }
    games.set(id, game);
    return game;
}

function getGame(gameId) {
    return games.get(gameId);
}

function addSocketToGame(gameId, userId, ws) {
    const game = games.get(gameId);
    if (game) {
        game.sockets.set(userId, ws);
    }
    return game;;
}

function removeSocketFromGame(gameId, userId) {
    const game = games.get(gameId);
    if (game) {
        game.sockets.delete(userId);
    }
    return game;
}

module.exports = {
    createGameInStore,
    getGame,
    addSocketToGame,
    removeSocketFromGame
};