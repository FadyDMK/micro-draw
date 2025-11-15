import { useEffect, useRef, useState } from "react";
import { config } from "../config/config";
import type { GameMessage } from "../types/game";

interface UseWebSocketOptions {
    onMessage: (data: any) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
    userId?: string;
}

export const useGameWebSocket = (options: UseWebSocketOptions) => {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const pendingRef = useRef<any[]>([]);

    useEffect(() => {
        const ws = new WebSocket(config.GAME_ENGINE_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket connected");
            // Flush any pending messages (preserve order)
            if (pendingRef.current.length) {
                for (const msg of pendingRef.current) {
                    try {
                        ws.send(JSON.stringify(msg));
                        console.log("WebSocket message sent:", msg);
                    } catch (e) {
                        console.error("Failed to flush pending WS message:", e);
                    }
                }
                pendingRef.current = [];
            }
            setIsConnected(true);
            options.onOpen?.();
        };

        ws.onmessage = (event) => {
            try {
                const message: GameMessage = JSON.parse(event.data);
                console.log("WebSocket message received:", message);
                options.onMessage?.(message);
            }catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };
        ws.onerror=(error) => {
            console.error("WebSocket error:", error);
            options.onError?.(error);
        };
        ws.onclose = () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
            options.onClose?.();
        };
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);
    const sendMessage = (message: any) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            console.log("WebSocket message sent:", message);
            return;
        }
        // Queue until connection opens
        pendingRef.current.push(message);
        console.warn("WebSocket not open yet. Queued message:", message);
    };
    const authenticate = (token: string) => {
        sendMessage({ type: "auth", token });
    };

    const joinGame = (gameId: string) => {
        sendMessage({ type: "join-game", gameId, userId: options.userId });
    };

    const draw = (x: number, y: number, color: string = "white") => {
        sendMessage({ type: "draw", x, y, color });
    };

    const drawLine = (x1:number,y1:number,x2:number,y2:number, color: string = "white") => {
        sendMessage({ type: "draw-line", x1, y1, x2, y2, color });
    };

    const sendChat = (message: string) => {
        sendMessage({ type: "chat", message });
    };

    const clear = () => {
        sendMessage({ type: "clear" });
    };

    return {
        isConnected,
        sendMessage,
        authenticate,
        joinGame,
        draw,
        drawLine,
        sendChat,
        clear,
    };
    
}