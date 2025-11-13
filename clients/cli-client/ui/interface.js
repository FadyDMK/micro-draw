const blessed = require('blessed');
const { Canvas } = require('./canvas');

function createInterface() {
    // Create screen
    const screen = blessed.screen({
        smartCSR: true,
        title: 'Micro Draw - CLI Client',
        fullUnicode: true
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

    // Input box (bottom - 20% height) - Simple box for displaying input
    const inputBox = blessed.box({
        bottom: 0,
        left: 0,
        width: '100%',
        height: 3,
        border: {
            type: 'line'
        },
        style: {
            border: {
                fg: 'green'
            }
        },
        label: ' Command (type and press Enter) ',
        content: '> '
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
    let currentInput = '';
    let lastKeySequence = null;
    let lastKeyTime = 0;

    // Listen to raw keypress events
    screen.on('keypress', (ch, key) => {
        const sequence = key.sequence || ch || key.name;
        const now = Date.now();

        //solution for repeating characters when key is pressed
        if (sequence && sequence === lastKeySequence && (now - lastKeyTime) < 30) {
            return;
        }

        if (sequence) {
            lastKeySequence = sequence;
            lastKeyTime = now;
        }

        // Handle Ctrl+C / Escape
        if ((key.name === 'c' && key.ctrl) || key.name === 'escape') {
            screen.destroy();
            process.exit(0);
            return;
        }
        
        // Handle Enter - submit command
        if (key.name === 'enter' || key.name === 'return') {
            if (currentInput.trim()) {
                const cmd = currentInput.trim();
                
                // Handle quit
                if (cmd.toLowerCase() === 'quit' || cmd.toLowerCase() === 'exit') {
                    screen.destroy();
                    process.exit(0);
                }
                
                if (commandCallback) {
                    commandCallback(cmd);
                }
            }
            
            currentInput = '';
            inputBox.setContent('> ');
            screen.render();
            return;
        }
        
        // Handle Backspace
        if (key.name === 'backspace') {
            if (currentInput.length > 0) {
                currentInput = currentInput.slice(0, -1);
                inputBox.setContent('> ' + currentInput);
                screen.render();
            }
            return;
        }
        
        // Handle regular characters
        if (ch && key.name !== 'space' && !key.ctrl && !key.meta) {
            currentInput += ch;
            inputBox.setContent('> ' + currentInput);
            screen.render();
        } else if (key.name === 'space') {
            currentInput += ' ';
            inputBox.setContent('> ' + currentInput);
            screen.render();
        }
    });

    
    screen.render();

    return {
        log(message) {
            const timestamp = new Date().toLocaleTimeString();
            const logMessage = `[${timestamp}] ${message}`;
            
            logs.push(logMessage);
            
            if (logs.length > 100) {
                logs.shift();
            }
            
            // Update log box content
            logBox.setContent(logs.join('\n'));
            
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