const WebSocket = require('ws');
const {verifyToken} = require('../utils/auth');
const { getGame, addSocketToGame } = require('../store/gamesStore');

function send(ws, obj) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
    }
}

async function handleMessage(ws, raw) {
    let msg;
    try{
        msg = JSON.parse(raw);
    } catch (error) {
        return send(ws, {error: 'Invalid JSON'});
    }

    //auth message
    if (msg.type === 'auth') {
        const userId = await verifyToken(msg.token)
        if (!userId) return send(ws, {type: 'auth', success: false, error: 'Invalid token'});
        ws.userId = userId;
        return send(ws, {type: 'auth', success: true, userId});
    }

    //default to auth required for other messages
    if (!ws.userId) return send(ws, {error: 'Not authenticated'});

    //join game
    if (msg.type === 'join-game') {
        const game = getGame(msg.gameId);
        if (!game) return send(ws, {type: 'join-game', success: false, error: 'Game not found'});
        ws.gameId = msg.gameId;
        addSocketToGame(msg.gameId, ws.userId, ws);
        
        return send(ws, {
            type: 'state',
            success: true,
            gameId: msg.gameId,
            state: game.state,
            players: game.players
        });
    }

    //draw or chat
    if (msg.type === 'draw' || msg.type === 'chat') {
        const game = getGame(ws.gameId);
        if (!game) return send(ws, {type: msg.type, success: false, error: 'Not in a game'});
        const out = JSON.stringify({from: ws.userId, ...msg});
        for (const s of game.sockets.values()) {
            if (s.readyState === WebSocket.OPEN) {
                s.send(out);
            }
        }
        return;
    }
    send(ws, {error: 'Unknown message type'});
}

module.exports = {
    handleMessage
};