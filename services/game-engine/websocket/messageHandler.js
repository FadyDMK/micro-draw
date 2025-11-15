const WebSocket = require('ws');
const { verifyToken } = require('../utils/auth');
const { getRandomWord } = require('../utils/words');
const { getGame, addSocketToGame, getCurrentDrawer, advanceTurn, addDrawing, addLineDrawing } = require('../store/gamesStore');

const TURN_DURATION_MS = 40_000;
const TURNS_PER_PLAYER = 2;

function getLinePoints(x1, y1, x2, y2) {
    const points = [];
    let dx = Math.abs(x2 - x1);
    let dy = -Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx + dy;
    let x = x1;
    let y = y1;

    while (true) {
        points.push({ x, y });
        if (x === x2 && y === y2) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            x += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y += sy;
        }
    }

    return points;
}

function send(ws, obj) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
    }
}

function broadcast(game, builder) {
    for (const [playerId, socket] of game.sockets.entries()) {
        const payload = typeof builder === 'function' ? builder(playerId, socket) : builder;
        if (payload) {
            send(socket, payload);
        }
    }
}

function ensureRuntime(game) {
    if (!game.runtime) {
        game.runtime = {
            timer: null,
            currentWord: null,
            usedWords: [],
            guessed: false,
            hasStarted: false
        };
    }
    return game.runtime;
}

function getPublicState(game) {
    return {
        turnNumber: game.state.turnNumber,
        turnsPerPlayer: game.state.turnsPerPlayer,
        totalTurns: game.state.totalTurns,
        drawerId: game.state.drawerId,
        scores: game.state.scores,
        turnEndsAt: game.state.turnEndsAt,
        canvas: game.state.canvas
    };
}

function clearTurnTimer(game) {
    if (game.runtime && game.runtime.timer) {
        clearTimeout(game.runtime.timer);
        game.runtime.timer = null;
    }
}

function endGame(game) {
    const runtime = ensureRuntime(game);
    clearTurnTimer(game);
    runtime.hasStarted = false;
    runtime.currentWord = null;
    runtime.usedWords = [];
    runtime.guessed = false;

    const scores = game.state.scores;
    const maxScore = Math.max(...Object.values(scores));
    const winnerIds = Object.entries(scores)
        .filter(([, score]) => score === maxScore)
        .map(([playerId]) => playerId);

    broadcast(game, {
        type: 'game-over',
        scores,
        winnerIds,
        totalTurns: game.state.totalTurns
    });

    game.state.turnNumber = 1;
    game.state.currentDrawerIndex = 0;
    game.state.drawerId = null;
    game.state.turnEndsAt = null;
}

function startNextTurn(game) {
    const runtime = ensureRuntime(game);

    if (!runtime.hasStarted) {
        runtime.hasStarted = true;
    }

    game.state.turnsPerPlayer = TURNS_PER_PLAYER;
    game.state.totalTurns = game.players.length * TURNS_PER_PLAYER;

    const drawer = getCurrentDrawer(game);
    if (!drawer) {
        return;
    }

    const word = getRandomWord(runtime.usedWords);
    runtime.currentWord = word;
    runtime.usedWords.push(word);
    runtime.guessed = false;

    game.state.drawerId = drawer.id;
    const now = Date.now();
    game.state.turnEndsAt = now + TURN_DURATION_MS;

    clearTurnTimer(game);
    runtime.timer = setTimeout(() => {
        endTurn(game, 'timeout');
    }, TURN_DURATION_MS);

    broadcast(game, (playerId) => {
        const isDrawer = playerId === drawer.id;
        return {
            type: 'turn-start',
            turnNumber: game.state.turnNumber,
            totalTurns: game.state.totalTurns,
            drawerId: drawer.id,
            role: isDrawer ? 'drawer' : 'guesser',
            word: isDrawer ? word : undefined,
            wordLength: isDrawer ? undefined : word.length,
            durationMs: TURN_DURATION_MS,
            endsAt: game.state.turnEndsAt,
            scores: game.state.scores
        };
    });
}

function endTurn(game, reason = 'timeout', extra = {}) {
    const runtime = ensureRuntime(game);
    if (!runtime.hasStarted) {
        return;
    }

    clearTurnTimer(game);

    broadcast(game, {
        type: 'turn-end',
        reason,
        word: runtime.currentWord,
        drawerId: game.state.drawerId,
        turnNumber: game.state.turnNumber,
        scores: game.state.scores,
        ...extra
    });

    // Reset canvas state for the next turn
    game.state.canvas = [];
    broadcast(game, { type: 'canvas-clear' });

    runtime.currentWord = null;
    game.state.drawerId = null;
    game.state.turnEndsAt = null;

    if (game.state.turnNumber >= game.state.totalTurns) {
        endGame(game);
        return;
    }

    advanceTurn(game.id);

    setTimeout(() => {
        startNextTurn(game);
    }, 1500);
}

function tryHandleGuess(game, ws, message) {
    const runtime = ensureRuntime(game);
    if (!runtime.hasStarted || runtime.guessed || !runtime.currentWord) {
        return false;
    }

    if (ws.userId === game.state.drawerId) {
        return false;
    }

    const guess = message.trim().toLowerCase();
    if (!guess) {
        return false;
    }

    if (guess === runtime.currentWord.toLowerCase()) {
        runtime.guessed = true;
        game.state.scores[ws.userId] = (game.state.scores[ws.userId] || 0) + 1;

        broadcast(game, {
            type: 'guess-result',
            guesserId: ws.userId,
            word: runtime.currentWord,
            turnNumber: game.state.turnNumber,
            scores: game.state.scores
        });

        endTurn(game, 'guessed', { guesserId: ws.userId });
        return true;
    }

    return false;
}

async function handleMessage(ws, raw) {
    let msg;
    try {
        msg = JSON.parse(raw);
    } catch (error) {
        return send(ws, { error: 'Invalid JSON' });
    }

    if (msg.type === 'auth') {
        const userId = await verifyToken(msg.token);
        if (!userId) {
            return send(ws, { type: 'auth', success: false, error: 'Invalid token' });
        }
        ws.userId = userId;
        return send(ws, { type: 'auth', success: true, userId });
    }

    if (!ws.userId) {
        return send(ws, { type: 'error', error: 'Not authenticated' });
    }

    if (msg.type === 'join-game') {
        const game = getGame(msg.gameId);
        if (!game) {
            return send(ws, { type: 'join-game', success: false, error: 'Game not found' });
        }

        ws.gameId = msg.gameId;
        addSocketToGame(msg.gameId, ws.userId, ws);

        const publicState = getPublicState(game);

        send(ws, {
            type: 'state',
            success: true,
            gameId: msg.gameId,
            state: publicState,
            players: game.players,
            scores: publicState.scores,
            isYourTurn: publicState.drawerId === ws.userId,
            role: publicState.drawerId === ws.userId ? 'drawer' : 'guesser'
        });

        const runtime = ensureRuntime(game);
        if (game.sockets.size === game.players.length && !runtime.hasStarted) {
            startNextTurn(game);
        }

        return;
    }

    if (msg.type === 'draw') {
        const game = getGame(ws.gameId);
        if (!game) {
            return send(ws, { error: 'Not in a game' });
        }

        const runtime = ensureRuntime(game);
        if (!runtime.hasStarted) {
            return send(ws, { error: 'Game has not started yet' });
        }

        if (game.state.drawerId !== ws.userId) {
            return send(ws, { type: 'error', error: 'Not your drawing turn' });
        }

        if (runtime.guessed) {
            return send(ws, { type: 'error', error: 'Turn already completed' });
        }

        if (typeof msg.x !== 'number' || typeof msg.y !== 'number' ||
            msg.x < 0 || msg.x >= 40 || msg.y < 0 || msg.y >= 20) {
            return send(ws, { type: 'error', error: 'Invalid coordinates' });
        }

        const now = Date.now();
        if (game.state.turnEndsAt && now > game.state.turnEndsAt) {
            return send(ws, { type: 'error', error: 'Turn time expired' });
        }

        addDrawing(ws.gameId, msg.x, msg.y, msg.color || 'white', ws.userId);

        broadcast(game, (playerId) => ({
            type: 'draw',
            from: ws.userId,
            x: msg.x,
            y: msg.y,
            color: msg.color || 'white',
            turnNumber: game.state.turnNumber,
            drawerId: game.state.drawerId,
            isYourTurn: playerId === game.state.drawerId,
            remainingMs: Math.max((game.state.turnEndsAt || now) - now, 0)
        }));

        return;
    }

    if (msg.type === 'draw-line') {
        const game = getGame(ws.gameId);
        if (!game) {
            return send(ws, { error: 'Not in a game' });
        }

        const runtime = ensureRuntime(game);
        if (!runtime.hasStarted) {
            return send(ws, { error: 'Game has not started yet' });
        }

        if (game.state.drawerId !== ws.userId) {
            return send(ws, { type: 'error', error: 'Not your drawing turn' });
        }

        if (runtime.guessed) {
            return send(ws, { type: 'error', error: 'Turn already completed' });
        }

        const { x1, y1, x2, y2 } = msg;
        if ([x1, y1, x2, y2].some((n) => typeof n !== 'number' || Number.isNaN(n))) {
            return send(ws, { type: 'error', error: 'Invalid coordinates' });
        }

        const color = msg.color || 'white';

        const points = getLinePoints(Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2));
        const outOfBounds = points.some(({ x, y }) => x < 0 || x >= 40 || y < 0 || y >= 20);
        if (outOfBounds) {
            return send(ws, { type: 'error', error: 'Line goes out of bounds' });
        }

        const now = Date.now();
        if (game.state.turnEndsAt && now > game.state.turnEndsAt) {
            return send(ws, { type: 'error', error: 'Turn time expired' });
        }

        addLineDrawing(ws.gameId, points, color, ws.userId);

        broadcast(game, (playerId) => ({
            type: 'draw-line',
            from: ws.userId,
            points,
            color,
            turnNumber: game.state.turnNumber,
            drawerId: game.state.drawerId,
            isYourTurn: playerId === game.state.drawerId,
            remainingMs: Math.max((game.state.turnEndsAt || now) - now, 0)
        }));

        return;
    }

    if (msg.type === 'chat') {
        const game = getGame(ws.gameId);
        if (!game) {
            return send(ws, { error: 'Not in a game' });
        }

        const text = (msg.message || '').toString();
        broadcast(game, {
            type: 'chat',
            from: ws.userId,
            message: text
        });

        tryHandleGuess(game, ws, text);
        return;
    }

    send(ws, { error: 'Unknown message type' });
}

module.exports = {
    handleMessage
};