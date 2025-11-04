const { createGameInStore, getGame} = require('../store/gamesStore');

function createGame(req, res) {
    const {roomId, players} = req.body || {};
    if (!roomId || !Array.isArray(players) || players.length === 0) {
        return res.status(400).send('roomId and players are required');
    }
    const newGame = createGameInStore(roomId, players);
    res.status(201).json({
        id: newGame.id,
        roomId: newGame.roomId,
        players: newGame.players.map(p => ({ id: p.id, username: p.username }))
    });
}

function getGameHandler(req, res) {
    const game = getGame(req.params.gameId);
    if (!game) return res.status(404).send('Game not found');
    res.json({
        id: game.id,
        roomId: game.roomId,
        players: game.players,
        state: game.state
}
    );

}

module.exports = {
    createGame,
    getGame: getGameHandler
};