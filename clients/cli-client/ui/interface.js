const blessed = require('blessed');
const { Canvas } = require('./canvas');

function createInterface() {
    // Create screen
    const screen = blessed.screen({
        smartCSR: true,
        title: 'Micro Draw - CLI Client',
        fullUnicode: true,
        debug: true
    });

    // Canvas display box (left side - 70% width)
    const canvasBox = blessed.box({
        top: 0,
        left: 0,
        width: '70%',
        height: '80%',
        content: '',
        tags: true,
        border: {
            type: 'line'
        },
        style: {
            border: {
                fg: 'cyan'
            }
        },
        label: ' Canvas (40x20) '
    });

    // Log/chat box (right side - 30% width)
    const logBox = blessed.box({
        top: 0,
        left: '70%',
        width: '30%',
        height: '80%',
        tags: true,
        border: {
            type: 'line'
        },
        style: {
            border: {
                fg: 'yellow'
            }
        },
        label: ' Log ',
        scrollable: true,
        alwaysScroll: true,
        scrollbar: {
            ch: ' ',
            style: {
                bg: 'yellow'
            }
        },
        content: 'Initializing...\n',
        mouse: true,
        keys: true
    });

    // Input box (bottom - 20% height)
    const inputBox = blessed.textbox({
        bottom: 0,
        left: 0,
        width: '100%',
        height: 3,
        input: true,
        keys: true,
        border: {
            type: 'line'
        },
        style: {
            border: {
                fg: 'green'
            },
            focus: {
                border: {
                    fg: 'brightgreen'
                }
            }
        },
        label: ' Command (type "help" for commands, "quit" to exit) '
    });

    // Append elements to screen
    screen.append(canvasBox);
    screen.append(logBox);
    screen.append(inputBox);

    // Create canvas
    const canvas = new Canvas(40, 20);
    canvasBox.setContent(canvas.render());

    // Log storage
    let logs = [];

    // Input handling
    let commandCallback = null;

    inputBox.on('submit', (value) => {
        if (value.trim()) {
            // Handle quit command directly in UI
            if (value.trim().toLowerCase() === 'quit' || value.trim().toLowerCase() === 'exit') {
                screen.destroy();
                process.exit(0);
            }
            
            if (commandCallback) {
                commandCallback(value);
            }
        }
        inputBox.clearValue();
        inputBox.focus();
        screen.render();
    });

    // Multiple quit shortcuts
    screen.key(['escape', 'C-c'], () => {
        screen.destroy();
        process.exit(0);
    });

    // Focus input initially
    inputBox.focus();
    
    // Initial render
    screen.render();

    // API exposed to other modules
    return {
        log(message) {
            const timestamp = new Date().toLocaleTimeString();
            const logMessage = `[${timestamp}] ${message}`;
            
            // Add to logs array
            logs.push(logMessage);
            
            // Keep only last 100 logs
            if (logs.length > 100) {
                logs.shift();
            }
            
            // Update log box content
            logBox.setContent(logs.join('\n'));
            
            // Scroll to bottom
            logBox.setScrollPerc(100);
            
            // Force render
            screen.render();
        },
        
        drawPoint(x, y, color) {
            canvas.setPoint(x, y, '█');
            canvasBox.setContent(canvas.render());
            screen.render();
        },
        
        clearCanvas() {
            canvas.clear();
            canvasBox.setContent(canvas.render());
            screen.render();
        },
        
        onCommand(callback) {
            commandCallback = callback;
        },
        
        destroy() {
            screen.destroy();
        },
        
        screen
    };
}

module.exports = { createInterface };