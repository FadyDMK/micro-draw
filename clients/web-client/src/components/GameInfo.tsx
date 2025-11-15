import { useEffect, useState } from "react";
import { useGame } from "../hooks/useGame";
import { formatTime } from "../utils/gameHelpers";
import '../styles/GameInfo.css';

function GameInfo() {
    const {
        players,
        playersMap,
        scores,
        word,
        wordLength,
        isDrawer,
        turnNumber,
        totalTurns,
        remainingTimeMs,
        gameOver,
    } = useGame();

    const [timeLeft, setTimeLeft] = useState(remainingTimeMs);

    useEffect(() => {
        setTimeLeft(remainingTimeMs);
        const interval = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [remainingTimeMs]);

    const getWinner = () => {
        if (!gameOver || players.length < 2) return null;

        const [p1, p2] = players;
        const score1 = scores[p1.id] || 0;
        const score2 = scores[p2.id] || 0;

        if (score1 > score2) return playersMap[p1.id];
        if (score2 > score1) return playersMap[p2.id];
        return null; // Tie
    };

    const winner = getWinner();

    return (
        <div className="game-info">
            {gameOver ? (
                <div className="game-over">
                    <h2>Game Over!</h2>
                    {winner ? (
                        <p className="winner-text">
                            Winner: <strong>{winner}</strong>
                        </p>
                    ) : (
                        <p className="tie-text">It's a tie!</p>
                    )}
                </div>
            ) : (
                <>
                    <div className="turn-info">
                        <div className="turn-number">
                            Turn {turnNumber} of {totalTurns}
                        </div>
                        <div className={`timer ${timeLeft < 10000 ? 'warning' : ''}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="role-info">
                        {isDrawer ? (
                            <div className="role-drawer">
                                <div>
                                    <div className="role-label">You are drawing:</div>
                                    <div className="word-display">{word}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="role-guesser">
                                <div>
                                    <div className="role-label">Guess the word:</div>
                                    <div className="word-hint">
                                        {Array(wordLength || 0).fill('_').join(' ')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="scores">
                        <h3>Scores</h3>
                        <div className="score-list">
                            {players.map((player) => (
                                <div key={player.id} className="score-item">
                                    <span className="player-name">
                                        {playersMap[player.id] || player.username || 'Unknown'}
                                    </span>
                                    <span className="player-score">
                                        {scores[player.id] || 0} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default GameInfo;