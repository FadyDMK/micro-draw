const { showMainMenu } = require('./ui/menu');

async function main() {
    try {
        await showMainMenu();
    } catch (err) {
        console.error('Fatal error:', err.message);
        process.exit(1);
    }
}

main();
