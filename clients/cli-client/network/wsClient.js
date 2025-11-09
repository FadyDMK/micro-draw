const WebSocket = require('ws');
const { GAME_ENGINE_URL } = require('../config/config');

function connectToGame(token, gameId, ui, username) {
    ui.log('=== Connection Starting ===');
    ui.log(`Target: ${GAME_ENGINE_URL}`);
    ui.log(`Game ID: ${gameId}`);
    ui.log(`Username: ${username}`);

    let ws;
    
    try {
        ws = new WebSocket(GAME_ENGINE_URL);
        ui.log('WebSocket object created');
    } catch (err) {
        ui.log(`ERROR creating WebSocket: ${err.message}`);
        return null;
    }
    
    ws.on('open', () => {
        ui.log('✓ WebSocket OPEN');
        const authMsg = { type: 'auth', token };
        ui.log(`Sending: ${JSON.stringify(authMsg)}`);
        ws.send(JSON.stringify(authMsg));
    });

    ws.on('message', (data) => {
        ui.log(`RAW: ${data.toString()}`);
        try {
            const msg = JSON.parse(data);
            handleMessage(msg, ws, gameId, ui, username);
        } catch (e) {
            ui.log(`PARSE ERROR: ${e.message}`);
        }
    });

    ws.on('error', (err) => {
        ui.log(`WS ERROR: ${err.message}`);
    });

    ws.on('close', (code, reason) => {
        ui.log(`WS CLOSED: ${code} - ${reason}`);
    });

    ui.onCommand((cmd) => {
        handleCommand(cmd, ws, ui);
    });

    return ws;
}

function handleMessage(msg, ws, gameId, ui, username) {
    ui.log(`MSG TYPE: ${msg.type}`);
    
    if (msg.type === 'auth') {
        if (msg.success) {
            ui.log(`✓ AUTH SUCCESS (UserID: ${msg.userId})`);
            const joinMsg = { type: 'join-game', gameId };
            ui.log(`Sending: ${JSON.stringify(joinMsg)}`);
            ws.send(JSON.stringify(joinMsg));
        } else {
            ui.log('✗ AUTH FAILED');
        }
    } else if (msg.type === 'join-game') {
        // Handle old join-game response format
        if (msg.success) {
            ui.log('✓ JOINED GAME!');
            ui.log('Type "help" for commands');
        } else {
            ui.log(`✗ JOIN FAILED: ${msg.error}`);
        }
    } else if (msg.type === 'state') {
        ui.log('✓ JOINED GAME!');
        ui.log('─────────────────────────────────');
        ui.log('Game Ready! Type "help" for commands');
        ui.log('─────────────────────────────────');
        
        if (msg.state && msg.state.canvas && msg.state.canvas.length > 0) {
            ui.log(`Loading ${msg.state.canvas.length} points`);
            msg.state.canvas.forEach(p => {
                ui.drawPoint(p.x, p.y, p.color || 'white');
            });
        }
    } else if (msg.type === 'draw') {
        ui.log(`DRAW: (${msg.x}, ${msg.y}) by ${msg.from}`);
        ui.drawPoint(msg.x, msg.y, msg.color || 'white');
    } else if (msg.type === 'chat') {
        ui.log(`CHAT [${msg.from}]: ${msg.message}`);
    } else if (msg.error) {
        ui.log(`SERVER ERROR: ${msg.error}`);
    } else {
        ui.log(`UNKNOWN MSG: ${JSON.stringify(msg)}`);
    }
}

function handleCommand(cmd, ws, ui) {
    ui.log(`> ${cmd}`);
    
    if (ws.readyState !== WebSocket.OPEN) {
        ui.log('NOT CONNECTED');
        return;
    }

    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();

    if (command === 'draw' && parts.length >= 3) {
        const x = parseInt(parts[1]);
        const y = parseInt(parts[2]);
        const color = parts[3] || 'white';
        
        if (isNaN(x) || isNaN(y)) {
            ui.log('Usage: draw <x> <y> [color]');
            return;
        }
        
        if (x < 0 || x >= 40 || y < 0 || y >= 20) {
            ui.log('Out of bounds! x: 0-39, y: 0-19');
            return;
        }
        
        ws.send(JSON.stringify({ type: 'draw', x, y, color }));
    } else if (command === 'chat' && parts.length > 1) {
        const message = parts.slice(1).join(' ');
        ws.send(JSON.stringify({ type: 'chat', message }));
    } else if (command === 'clear') {
        ui.clearCanvas();
        ui.log('Canvas cleared');
    } else if (command === 'help') {
        ui.log('Commands: draw <x> <y> [color], chat <msg>, clear, help, quit');
    } else if (command === 'quit' || command === 'exit') {
        ws.close();
        setTimeout(() => process.exit(0), 200);
    } else {
        ui.log('Unknown command. Type "help"');
    }
}

module.exports = { connectToGame };