// Bresenham's line algorithm - matches backend implementation
export const getLinePoints = (
    x1: number, y1: number, x2: number, y2: number
): Array<{ x: number; y: number }> => {
    const points: Array<{ x: number; y: number }> = [];
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
};

// Validate if coordinates are within canvas bounds
export const isValidCoordinate = (x: number, y: number, width: number = 40, height: number = 20): boolean => {
    return x >= 0 && x < width && y >= 0 && y < height;
};

// Scale canvas coordinates for display
export const scalePoint = (x: number, y: number, cellSize: number): { x: number; y: number } => {
    return {
        x: x * cellSize,
        y: y * cellSize,
    };
};

// Get canvas coordinate from mouse position
export const getCanvasCoordinate = (
    mouseX: number,
    mouseY: number,
    canvasRect: DOMRect,
    cellSize: number
): { x: number; y: number } => {
    const x = Math.floor((mouseX - canvasRect.left) / cellSize);
    const y = Math.floor((mouseY - canvasRect.top) / cellSize);
    return { x, y };
};