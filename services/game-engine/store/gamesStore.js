const {v4: uuidv4} = require('uuid');

// games: gameId -> {id, name, players: [id, username], sockets: Map<userId, ws> ,state:{}}, 
const games = new Map();

function createGameInStore(roomId, players) {
    const id = uuidv4();

    const scores = {};
    for (const player of players) {
        scores[player.id] = 0;
    }

    const game = {
        id,
        roomId,
        players, // [{ id, username }, { id, username }]
        sockets: new Map(),
        state: {
            currentDrawerIndex: 0,
            turnNumber: 1,
            turnsPerPlayer: 2,
            totalTurns: players.length * 2,
            drawerId: null,
            canvas: [],
            scores,
            turnEndsAt: null
        },
        runtime: {
            timer: null,
            currentWord: null,
            usedWords: [],
            guessed: false,
            hasStarted: false
        }
    };

    games.set(id, game);
    return game;
}

function getCurrentDrawer(game) {
    if (!game || !game.players || game.players.length === 0) return null;
    return game.players[game.state.currentDrawerIndex];
}

function advanceTurn(gameId) {
    const game = games.get(gameId);
    if (!game) return null;

    game.state.turnNumber += 1;
    game.state.currentDrawerIndex = (game.state.currentDrawerIndex + 1) % game.players.length;

    return game;
}

function addDrawing(gameId, x, y, color, playerId) {
    const game = games.get(gameId);
    if (!game) return null;
    
    game.state.canvas.push({ x, y, color, playerId });
    return game;
}

function addLineDrawing(gameId, points, color, playerId) {
    const game = games.get(gameId);
    if (!game) return null;

    for (const point of points) {
        const { x, y } = point;
        game.state.canvas.push({ x, y, color, playerId });
    }
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
    removeSocketFromGame,
    getCurrentDrawer,
    advanceTurn,
    addDrawing,
    addLineDrawing
};