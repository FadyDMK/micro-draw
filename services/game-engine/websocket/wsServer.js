const WebSocket = require('ws');
const { handleMessage } = require('./messageHandler');

function initWebSocketServer(httpServer) {
    const wss = new WebSocket.Server({ server: httpServer });

    wss.on('connection', (ws, req) => {
        console.log('New WebSocket connection established');
        ws.isAlive = true;
        ws.userId = null;
        ws.gameId = null;

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (message) => {
            handleMessage(ws, message);
        });

        ws.on('close', () => {
            if (ws.gameId && ws.userId) {
                const gamesStore = require('../store/gamesStore');
                gamesStore.removeSocketFromGame(ws.gameId, ws.userId);
            }
            console.log('WebSocket connection closed');
        });
    });

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        })
    }, 30000);

    process.on('SIGTERM', () => {
        clearInterval(interval);
        wss.close(() => {
            console.log('WebSocket server closed');
        });
    });

    return wss;
}

module.exports = {
    initWebSocketServer
};