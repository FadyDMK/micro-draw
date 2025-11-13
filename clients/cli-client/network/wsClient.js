const WebSocket = require('ws');
const { GAME_ENGINE_URL } = require('../config/config');

function renderScores(ui, scores, playersMap) {
    if (!scores) {
        return;
    }
    const entries = Object.entries(scores);
    if (entries.length === 0) {
        return;
    }
    const summary = entries
        .map(([playerId, score]) => `${playersMap[playerId] || playerId}: ${score}`)
        .join(' | ');
    ui.log(`🏆 Scores -> ${summary}`);
}

function connectToGame(token, gameId, ui, username) {
    // Debug: initial connection details
    // ui.log('=== Connection Starting ===');
    // ui.log(`Target: ${GAME_ENGINE_URL}`);
    // ui.log(`Game ID: ${gameId}`);
    // ui.log(`Username: ${username}`);

    const context = {
        token,
        gameId,
        ui,
        username,
        ws: null,
        role: 'spectator',
        isDrawer: false,
        canDraw: false,
        turnActive: false,
        word: null,
        wordLength: null,
        scores: {},
        playersMap: {},
        drawerId: null,
        turnNumber: 0,
        totalTurns: 0
    };

    try {
        context.ws = new WebSocket(GAME_ENGINE_URL);
    // ui.log('WebSocket object created');
    } catch (err) {
        ui.log(`ERROR creating WebSocket: ${err.message}`);
        return null;
    }

    const ws = context.ws;

    ws.on('open', () => {
    ui.log('✓ WebSocket OPEN');
        const authMsg = { type: 'auth', token };
    // ui.log(`Sending: ${JSON.stringify(authMsg)}`);
        ws.send(JSON.stringify(authMsg));
    });

    ws.on('message', (data) => {
    // ui.log(`RAW: ${data.toString()}`);
        try {
            const msg = JSON.parse(data);
            handleMessage(msg, context);
        } catch (e) {
            // ui.log(`PARSE ERROR: ${e.message}`);
        }
    });

    ws.on('error', (err) => {
    // ui.log(`WS ERROR: ${err.message}`);
    });

    ws.on('close', (code, reason) => {
    // ui.log(`WS CLOSED: ${code} - ${reason}`);
    });

    ui.onCommand((cmd) => {
        handleCommand(cmd, context);
    });

    return ws;
}

function handleMessage(msg, context) {
    const { ui, ws, gameId } = context;
    // ui.log(`MSG TYPE: ${msg.type}`);

    if (msg.type === 'auth') {
        if (msg.success) {
            ui.log(`✓ AUTH SUCCESS (UserID: ${msg.userId})`);
            const joinMsg = { type: 'join-game', gameId };
            ui.log(`Sending: ${JSON.stringify(joinMsg)}`);
            ws.send(JSON.stringify(joinMsg));
        } else {
            ui.log('✗ AUTH FAILED');
        }
        return;
    }

    if (msg.type === 'state') {
        if (Array.isArray(msg.players)) {
            context.playersMap = msg.players.reduce((map, player) => {
                map[player.id] = player.username;
                return map;
            }, {});
        }

        context.scores = msg.scores || msg.state?.scores || {};
        context.role = msg.role || 'guesser';
        context.isDrawer = context.role === 'drawer';
        context.drawerId = msg.state?.drawerId || null;
        context.turnNumber = msg.state?.turnNumber || 0;
        context.totalTurns = msg.state?.totalTurns || 0;
        context.turnActive = Boolean(context.drawerId);
        context.canDraw = Boolean(msg.isYourTurn);
        context.word = null;
        context.wordLength = null;

        ui.log('✓ JOINED GAME!');
        ui.log('─────────────────────────────────');
        if (context.canDraw) {
            ui.log('🎨 When the turn starts you will receive a secret word to draw.');
        } else {
            ui.log('⏳ Waiting for turn to start. Get ready to guess using "guess <word>"');
        }
        ui.log('─────────────────────────────────');
        ui.log('Type "help" for commands');

        const canvasPoints = msg.state?.canvas || [];
        if (canvasPoints.length > 0) {
            ui.log(`Loading ${canvasPoints.length} points`);
            canvasPoints.forEach((p) => {
                ui.drawPoint(p.x, p.y, p.color || 'white');
            });
        }

        renderScores(ui, context.scores, context.playersMap);
        return;
    }

    if (msg.type === 'turn-start') {
        context.turnActive = true;
        context.drawerId = msg.drawerId;
        context.turnNumber = msg.turnNumber;
        context.totalTurns = msg.totalTurns;
        context.canDraw = msg.role === 'drawer';
        context.isDrawer = msg.role === 'drawer';
        context.word = msg.role === 'drawer' ? msg.word : null;
        context.wordLength = msg.role === 'guesser' ? msg.wordLength : null;
        context.scores = msg.scores || context.scores;

        ui.log('─────────────────────────────────');
        ui.log(`🕒 Turn ${msg.turnNumber} of ${msg.totalTurns}`);
        if (context.isDrawer) {
            ui.log(`🎨 You're the drawer! Secret word: {bold}${msg.word}{/bold}`);
            ui.log('Draw using: draw <x> <y> [color]');
        } else {
            ui.log(`❔ You're guessing! Word length: ${msg.wordLength} letters`);
            ui.log('Guess using: guess <word> or chat <word>');
        }
        ui.log('─────────────────────────────────');
        renderScores(ui, msg.scores || context.scores, context.playersMap);
        return;
    }

    if (msg.type === 'draw') {
        context.drawerId = msg.drawerId;
        context.canDraw = Boolean(msg.isYourTurn);
        ui.drawPoint(msg.x, msg.y, msg.color || 'white');
        const drawerName = context.playersMap[msg.from] || msg.from;
        ui.log(`✏️  ${drawerName} drew at (${msg.x}, ${msg.y})`);
        if (msg.remainingMs !== undefined) {
            ui.log(`⏱️  ${Math.ceil(msg.remainingMs / 1000)}s remaining`);
        }
        return;
    }

    if (msg.type === 'draw-line') {
        context.drawerId = msg.drawerId;
        context.canDraw = Boolean(msg.isYourTurn);
        const drawerName = context.playersMap[msg.from] || msg.from;
        if (Array.isArray(msg.points)) {
            for (const point of msg.points) {
                ui.drawPoint(point.x, point.y, msg.color || 'white');
            }
        }
        ui.log(`📐 ${drawerName} drew a line with ${msg.points?.length || 0} points`);
        if (msg.remainingMs !== undefined) {
            ui.log(`⏱️  ${Math.ceil(msg.remainingMs / 1000)}s remaining`);
        }
        return;
    }

    if (msg.type === 'canvas-clear') {
        ui.clearCanvas();
        ui.log('🧹 Canvas cleared for next turn');
        return;
    }

    if (msg.type === 'chat') {
        const fromName = context.playersMap[msg.from] || msg.from;
        ui.log(`💬 [${fromName}]: ${msg.message}`);
        return;
    }

    if (msg.type === 'guess-result') {
        context.scores = msg.scores || context.scores;
        const guesserName = context.playersMap[msg.guesserId] || msg.guesserId;
        ui.log(`✅ ${guesserName} guessed the word "${msg.word}"!`);
        renderScores(ui, context.scores, context.playersMap);
        return;
    }

    if (msg.type === 'turn-end') {
        context.turnActive = false;
        context.canDraw = false;
        context.drawerId = null;
        context.word = null;
        context.wordLength = null;
        context.scores = msg.scores || context.scores;

        if (msg.reason === 'timeout') {
            ui.log(`⌛ Time's up! The word was "${msg.word}"`);
        } else if (msg.reason === 'guessed') {
            const guesserName = context.playersMap[msg.guesserId] || msg.guesserId;
            ui.log(`🎉 Turn complete! ${guesserName} got it right.`);
        } else {
            ui.log('Turn ended.');
        }
        renderScores(ui, context.scores, context.playersMap);
        return;
    }

    if (msg.type === 'game-over') {
        context.turnActive = false;
        context.canDraw = false;
        context.scores = msg.scores || context.scores;

        ui.log('🏁 Game over! Final scores:');
        renderScores(ui, context.scores, context.playersMap);

        if (Array.isArray(msg.winnerIds) && msg.winnerIds.length > 0) {
            const winnerNames = msg.winnerIds.map((id) => context.playersMap[id] || id);
            ui.log(`🥇 Winner${winnerNames.length > 1 ? 's' : ''}: ${winnerNames.join(', ')}`);
        }
        return;
    }

    if (msg.type === 'error') {
        ui.log(`❌ ERROR: ${msg.error}`);
        return;
    }

    if (msg.error) {
        ui.log(`SERVER ERROR: ${msg.error}`);
        return;
    }

    ui.log(`UNKNOWN MSG: ${JSON.stringify(msg)}`);
}

function handleCommand(cmd, context) {
    const { ws, ui } = context;
    ui.log(`> ${cmd}`);

    if (!ws || ws.readyState !== WebSocket.OPEN) {
        ui.log('NOT CONNECTED');
        return;
    }

    const trimmed = cmd.trim();
    if (!trimmed) {
        return;
    }

    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();

    if (command === 'draw') {
        if (!context.canDraw || !context.turnActive) {
            ui.log('❌ You cannot draw right now. Wait for your drawing turn.');
            return;
        }

        if (parts.length < 3) {
            ui.log('Usage: draw <x> <y> [color]');
            return;
        }

        const x = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        const color = parts[3] || 'white';

        if (Number.isNaN(x) || Number.isNaN(y)) {
            ui.log('Usage: draw <x> <y> [color]');
            return;
        }

        if (x < 0 || x >= 40 || y < 0 || y >= 20) {
            ui.log('Out of bounds! x: 0-39, y: 0-19');
            return;
        }

        ws.send(JSON.stringify({ type: 'draw', x, y, color }));
        return;
    }

    if (command === 'line') {
        if (!context.canDraw || !context.turnActive) {
            ui.log('❌ You cannot draw right now. Wait for your drawing turn.');
            return;
        }

        if (parts.length < 5) {
            ui.log('Usage: line <x1> <y1> <x2> <y2> [color]');
            return;
        }

        const x1 = parseInt(parts[1], 10);
        const y1 = parseInt(parts[2], 10);
        const x2 = parseInt(parts[3], 10);
        const y2 = parseInt(parts[4], 10);
        const color = parts[5] || 'white';

        if ([x1, y1, x2, y2].some(Number.isNaN)) {
            ui.log('Usage: line <x1> <y1> <x2> <y2> [color]');
            return;
        }

        const outOfBounds = [x1, x2].some((x) => x < 0 || x >= 40) || [y1, y2].some((y) => y < 0 || y >= 20);
        if (outOfBounds) {
            ui.log('Line endpoints out of bounds! x: 0-39, y: 0-19');
            return;
        }

        ws.send(JSON.stringify({ type: 'draw-line', x1, y1, x2, y2, color }));
        return;
    }

    if (command === 'guess') {
        if (parts.length < 2) {
            ui.log('Usage: guess <word>');
            return;
        }
        const guessWord = parts.slice(1).join(' ');
        ws.send(JSON.stringify({ type: 'chat', message: guessWord }));
        return;
    }

    if (command === 'chat') {
        if (parts.length < 2) {
            ui.log('Usage: chat <message>');
            return;
        }
        const message = parts.slice(1).join(' ');
        ws.send(JSON.stringify({ type: 'chat', message }));
        return;
    }

    if (command === 'clear') {
        ui.clearCanvas();
        ui.log('Canvas cleared (local view only)');
        return;
    }

    if (command === 'help') {
        ui.log('Commands:');
    ui.log('  draw <x> <y> [color] - Draw a point (drawer only)');
    ui.log('  line <x1> <y1> <x2> <y2> [color] - Draw a line between points (drawer only)');
        ui.log('  guess <word>         - Submit a guess for the current word');
        ui.log('  chat <message>       - Send a chat message');
        ui.log('  clear                - Clear your local canvas');
        ui.log('  help                 - Show this help');
        ui.log('  quit                 - Exit game');
        ui.log('Colors: white, red, green, blue, yellow, magenta, cyan');
        return;
    }

    if (command === 'quit' || command === 'exit') {
        ws.close();
        setTimeout(() => process.exit(0), 200);
        return;
    }

    ui.log('Unknown command. Type "help"');
}

module.exports = { connectToGame };