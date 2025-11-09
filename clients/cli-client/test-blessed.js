const blessed = require('blessed');

console.log('Creating blessed screen...');

const screen = blessed.screen({
    smartCSR: true,
    title: 'Blessed Test'
});

console.log('Screen created, size:', screen.width, 'x', screen.height);

const box = blessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    content: '{center}Hello World!\nPress ESC or q to quit.{/center}',
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        border: {
            fg: 'blue'
        }
    }
});

screen.append(box);

screen.key(['escape', 'q', 'C-c'], () => {
    console.log('Exiting...');
    process.exit(0);
});

console.log('Rendering...');
screen.render();
console.log('Rendered! You should see a blue box now.');