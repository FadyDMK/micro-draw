class Canvas {
    constructor(width = 40, height = 20) {
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill(null).map(() => Array(width).fill(' '));
    }

    setPoint(x, y, char = '█') {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y][x] = char;
        }
    }

    clear() {
        this.grid = Array(this.height).fill(null).map(() => Array(this.width).fill(' '));
    }

    render() {
        const border = '─'.repeat(this.width + 2);
        let output = `┌${border}┐\n`;
        
        for (const row of this.grid) {
            output += `│ ${row.join('')} │\n`;
        }
        
        output += `└${border}┘`;
        return output;
    }
}

module.exports = { Canvas };    