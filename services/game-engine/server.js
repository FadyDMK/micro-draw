const express = require('express');
const http = require('http');
const { initWebSocketServer } = require('./websocket/wsServer');
const gamesController = require('./controllers/gamesController');
const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/games', gamesController.createGame);
app.get('/games/:gameId', gamesController.getGame);

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(port, () => {
    console.log(`Game Engine Service running on port ${port}`);
});

module.exports = server;

