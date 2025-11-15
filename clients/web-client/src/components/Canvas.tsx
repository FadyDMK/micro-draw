import { useEffect, useRef, useState } from "react";
import { CANVAS_CONFIG, COLORS } from "../utils/gameHelpers";
import { useGame } from "../hooks/useGame";

function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    let game = useGame();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = '#ffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#e0e0';
        ctx.lineWidth = 1;

        for (let x = 0; x <= canvas.width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CANVAS_CONFIG.CELL_SIZE, 0);
            ctx.lineTo(x * CANVAS_CONFIG.CELL_SIZE, canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y <= canvas.height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CANVAS_CONFIG.CELL_SIZE);
            ctx.lineTo(canvas.width, y * CANVAS_CONFIG.CELL_SIZE);
            ctx.stroke();
        }

        game.canvasPoints.forEach(point => {
            ctx.fillStyle = point.color;
            ctx.fillRect(
                point.x * CANVAS_CONFIG.CELL_SIZE,
                point.y * CANVAS_CONFIG.CELL_SIZE,
                CANVAS_CONFIG.CELL_SIZE,
                CANVAS_CONFIG.CELL_SIZE
            );
        });
    }, [game.canvasPoints]);

    const getGridPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / CANVAS_CONFIG.CELL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / CANVAS_CONFIG.CELL_SIZE);

        if (x < 0 || x >= CANVAS_CONFIG.GRID_WIDTH || y < 0 || y >= CANVAS_CONFIG.GRID_HEIGHT) {
            return null;
        }

        return { x, y };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!game.canDraw || !game.turnActive) return;
        const pos = getGridPosition(e);
        if (!pos) return;

        setIsDrawing(true);
        setStartPos(pos);
        game.sendDraw(pos.x, pos.y, selectedColor.value);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!game.canDraw || !isDrawing || !startPos) return;

        const pos = getGridPosition(e);
        if (!pos) return;

        if (pos.x !== startPos.x || pos.y !== startPos.y) {
            game.sendDraw(pos.x, pos.y, selectedColor.value);
            setStartPos(pos);
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!game.canDraw || !isDrawing || !startPos) {
            setIsDrawing(false);
            setStartPos(null);
            return;
        }


        const pos = getGridPosition(e);
        if (!pos) {
            setIsDrawing(false);
            setStartPos(null);
            return;
        }

        if (pos.x !== startPos.x || pos.y !== startPos.y) {
            game.sendDrawLine(startPos.x, startPos.y, pos.x, pos.y, selectedColor.value);
        }
        setIsDrawing(false);
        setStartPos(null);

    };

    const getTouchPosition = (e: React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || e.touches.length === 0) return null;

        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = Math.floor((touch.clientX - rect.left) / CANVAS_CONFIG.CELL_SIZE);
        const y = Math.floor((touch.clientY - rect.top) / CANVAS_CONFIG.CELL_SIZE);

        if (x < 0 || x >= CANVAS_CONFIG.GRID_WIDTH || y < 0 || y >= CANVAS_CONFIG.GRID_HEIGHT) {
            return null;
        }

        return { x, y };
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!game.canDraw || !game.turnActive) return;
        const pos = getTouchPosition(e);
        if (!pos) return;

        setIsDrawing(true);
        setStartPos(pos);
        game.sendDraw(pos.x, pos.y, selectedColor.value);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!game.canDraw || !isDrawing || !startPos) return;

        const pos = getTouchPosition(e);
        if (!pos) return;

        if (pos.x !== startPos.x || pos.y !== startPos.y) {
            game.sendDraw(pos.x, pos.y, selectedColor.value);
            setStartPos(pos);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!game.canDraw || !isDrawing || !startPos) {
            setIsDrawing(false);
            setStartPos(null);
            return;
        }

        if (e.changedTouches.length === 0) {
            setIsDrawing(false);
            setStartPos(null);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) {
            setIsDrawing(false);
            setStartPos(null);
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const x = Math.floor((touch.clientX - rect.left) / CANVAS_CONFIG.CELL_SIZE);
        const y = Math.floor((touch.clientY - rect.top) / CANVAS_CONFIG.CELL_SIZE);

        if (x >= 0 && x < CANVAS_CONFIG.GRID_WIDTH && y >= 0 && y < CANVAS_CONFIG.GRID_HEIGHT) {
            const pos = { x, y };
            if (pos.x !== startPos.x || pos.y !== startPos.y) {
                game.sendDrawLine(startPos.x, startPos.y, pos.x, pos.y, selectedColor.value);
            }
        }

        setIsDrawing(false);
        setStartPos(null);
    };

    return (
        <div className="canvas-container">
            <div className="canvas-header">
                <h3>Drawing Canvas</h3>
                {!game.canDraw && <p>Waiting for your turn to draw...</p>}
            </div>
            <canvas
                ref={canvasRef}
                width={CANVAS_CONFIG.GRID_WIDTH * CANVAS_CONFIG.CELL_SIZE}
                height={CANVAS_CONFIG.GRID_HEIGHT * CANVAS_CONFIG.CELL_SIZE}
                className={`canvas ${!game.canDraw ? 'disabled' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                    setIsDrawing(false);
                    setStartPos(null);
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={() => {
                    setIsDrawing(false);
                    setStartPos(null);
                }}
            />
            {game.canDraw && (
                <div className="color-palette">
                    {COLORS.map((color) => (
                        <button
                            key={color.value}
                            className={`color-btn ${selectedColor === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => setSelectedColor(color)}
                            title={color.name}
                        />
                    ))}
                </div>
            )}
        </div>


    )


}
export default Canvas;