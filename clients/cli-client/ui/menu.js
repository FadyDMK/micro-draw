const { Prompt } = require('../utils/prompt');
const { login, register } = require('../services/authService');
const { createRoom, joinRoom, listRooms } = require('../services/roomService');
const { connectToGame } = require('../network/wsClient');
const { createInterface } = require("./interface");

const prompt = new Prompt();

function printHeader() {
    console.log('===============================================');
    console.log('     Welcome to Micro Draw on the CLI!      ');
    console.log('===============================================');
}

async function showAuthMenu() {
    const action = await prompt.question('Do you want to (L)ogin or (R)egister? ');
    const username = await prompt.question('Username: ');
    const password = await prompt.question('Password: ');

    try {
        if (action.toLowerCase() === 'r') {
            console.log('Registering...');
            await register(username, password);
            console.log(`Registration successful! You can now log in as ${username.username} .`);
            const loginData = await login(username, password);
            return {
                token: loginData.token,
                userId: loginData.user.id,
                username: loginData.user.username
            };
        } else {
            console.log('Logging in...');
            const loginData = await login(username, password);
            console.log(`Login successful! Welcome back, ${loginData.user.username} .`);
            return {
                token: loginData.token,
                userId: loginData.user.id,
                username: loginData.user.username
            };
        }
    } catch (error) {
        console.error('Authentication failed:', error.message);
        throw error;
    }
}
async function showRoomMenu(token, userId, username) {
    console.log("\n─────────────────────────────────────────────────");
    const action = await prompt.question("Do you want to (J)oin existing room or (C)reate new? ");

    if (action.toLowerCase() === 'c') {
        return await handleCreateRoom(token, userId, username);
    } else {
        return await handleJoinRoom(token, userId, username);
    }
}
async function handleCreateRoom(token, userId, username) {
    const roomName = await prompt.question('Enter room name: ');
    try {
        const room = await createRoom(roomName);
        console.log(`Room "${room.name}" created with ID: ${room.id}`);

        const joinedRoom = await joinRoom(room.id, token, userId);
        console.log(`✓ Joined room. Players: ${joinedRoom.players.length}/2`);

        if (joinedRoom.gameId) {
            console.log(`✓ Game started! Game ID: ${joinedRoom.gameId}`);
            console.log('Starting UI in 1 second...');
            
            setTimeout(() => {
                prompt.close();
                const ui = createInterface();
                ui.log('UI Initialized!');
                ui.log('Connecting to game...');
                connectToGame(token, joinedRoom.gameId, ui, username);
            }, 1000);
        } else {
            console.log('Waiting for another player to join...');
            console.log('Checking for game start..\n');
            await pollForGameStart(room.id, token, userId, username);
        }
    } catch (error) {
        throw error;
    }

}

async function pollForGameStart(roomId, token, userId, username) {
    const {getRoom} = require('../services/roomService');

    const maxAttempts = 30;
    let attempts = 0;

    const pollInterval = setInterval(async () => {
        attempts++;
        try {
            const room = await getRoom(roomId);
            if (room.gameId) {
                clearInterval(pollInterval);
                console.log('\n✓ Another player joined! Game ID: ' + room.gameId);
                console.log('Starting UI in 1 second...');
                
                setTimeout(() => {
                    prompt.close();
                    const ui = createInterface();
                    ui.log('UI Initialized!');
                    ui.log('Connecting to game...');
                    connectToGame(token, room.gameId, ui, username);
                }, 1000);
            } else if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                console.log('Timed out waiting for another player to join.');
                prompt.close();
            } else {
                process.stdout.write('.'); //to indicate waiting
            }
            
        } catch (error) {
            clearInterval(pollInterval);
            console.error('Error while checking room status:', error.message);
            prompt.close();
        }
    }, 1000);
}


async function handleJoinRoom(token, userId, username) {
    console.log('Fetching available rooms...');
    console.log("\n─────────────────────────────────────────────────");
    console.log('Available Rooms:');

    const rooms = await listRooms();

    if (rooms.length === 0) {
        console.log('No available rooms. Please create one first.');
        prompt.close();
        return;
    }

    displayRoomTable(rooms);

    const roomChoice = await prompt.question('Enter Room ID to join: ');

    if (roomChoice.toLowerCase() === 'q') {
        console.log('Goodbye!')
        prompt.close();
        return;
    }

    const roomIndex = parseInt(roomChoice) - 1;

    if (isNaN(roomIndex) || roomIndex < 0 || roomIndex >= rooms.length) {
        console.log('Invalid choice. Please try again.');
        prompt.close();
        return;
    }

    const selectedRoom = rooms[roomIndex];

    if (selectedRoom.players.length >= 2) {
        console.log('Room is full. Please choose another room.');
        prompt.close();
        return;
    }

    console.log(`Joining room "${selectedRoom.name}"...`);

    const joinedRoom = await joinRoom(selectedRoom.id, token, userId);
    console.log(` Joined room. Players: ${joinedRoom.players.length}/2`);
    console.log(`\nPlayers: ${joinedRoom.players.map(p => p.username).join(', ')}`);

    if (joinedRoom.gameId) {
        console.log(`✓ Game started! Game ID: ${joinedRoom.gameId}`);
        console.log('Starting UI in 1 second...');
        
        setTimeout(() => {
            prompt.close();
            const ui = createInterface();
            ui.log('UI Initialized!');
            ui.log('Connecting to game...');
            connectToGame(token, joinedRoom.gameId, ui, username);
        }, 1000);
        console.log('DEBUG: About to close prompt...');
        prompt.close();
        console.log('DEBUG: Prompt closed');
        console.log('DEBUG: About to create interface...');
        const ui = createInterface();
        console.log('DEBUG: Interface created');
        console.log('DEBUG: UI object:', ui);
        console.log('DEBUG: About to connect to game...');
        
        connectToGame(token, joinedRoom.gameId, ui, username);
        console.log('DEBUG: connectToGame called');
    } else {
        console.log('Waiting for another player to join...');
        prompt.close();
    }
}

function displayRoomTable(rooms) {
    console.log("┌──────┬─────────────────────────┬─────────┬─────────┐");
    console.log("│ #    │ Room Name               │ Players │ Status  │");
    console.log("├──────┼─────────────────────────┼─────────┼─────────┤");
    rooms.forEach((room, index) => {
        const name = room.name.padEnd(23).substring(0, 23);
        const players = `${room.players.length}/2`.padEnd(7);
        const status = room.players.length >= 2 ? 'Full   ' : 'Open   ';
        console.log(`│ ${String(index + 1).padEnd(4)} │ ${name} │ ${players} │ ${status} │`);
    });
    console.log("└──────┴─────────────────────────┴─────────┴─────────┘");

}

async function showMainMenu() {
    printHeader();

    try {

        const authResult = await showAuthMenu();
        if (!authResult) {
            console.log('Authentication required to continue');
            prompt.close();
            return;
        }
        const { token, userId, username } = authResult;
        await showRoomMenu(token, userId, username);
    } catch (error) {
        console.error('Error:', error.message);
        prompt.close();
    }
};

module.exports = {
    showMainMenu
};