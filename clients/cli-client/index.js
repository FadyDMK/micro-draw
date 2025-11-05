const readline = require('readline');
const { createInterface } = require('./ui/interface');
const { connectToGame } = require('./network/wsClient');
const { read } = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("===============Welcome to Micro Draw CLI Client!===============\n");

rl.question("Enter your username: ", (username) => {
    rl.question("Enter Password: ", (password) => {
        rl.question("Enter Room ID to join: ", async (roomId) => {
            console.log(`Connecting as ${username} to room ${roomId}...\n`);
            try {
                await connectToGame(username, password, roomId, createInterface());
            } catch (error) {
                console.error("Failed to connect to game:", error.message);
                rl.close();
            }
        });
    });
});