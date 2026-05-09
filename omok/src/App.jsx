import { useEffect, useRef, useState } from 'react';
import { useGame } from './hooks/useGame.js';
import { useAI } from './hooks/useAI.js';
import { useScoreboard } from './hooks/useScoreboard.js';
import { DIFFICULTY } from './constants/config.js';
import Board from './components/Board.jsx';
import StatusBar from './components/StatusBar.jsx';
import DifficultyModal from './components/DifficultyModal.jsx';
import ResultModal from './components/ResultModal.jsx';
import './index.css';

const DIFF_LABELS = {
  [DIFFICULTY.EASY]: '쉬움',
  [DIFFICULTY.NORMAL]: '보통',
  [DIFFICULTY.HARD]: '어려움',
};

export default function App() {
  const game = useGame();
  const {
    playerName,
    setPlayerName,
    topScores,
    addGameResult,
  } = useScoreboard();
  const [showResult, setShowResult] = useState(false);
  const recordedGameRef = useRef(null);

  useAI({
    turn: game.turn,
    gameStatus: game.gameStatus,
    board: game.board,
    difficulty: game.difficulty,
    placeStoneByAI: game.placeStoneByAI,
  });

  useEffect(() => {
    const isFinished = game.gameStatus === 'win' || game.gameStatus === 'draw';
    const timer = setTimeout(() => setShowResult(isFinished), isFinished ? 1500 : 0);
    return () => clearTimeout(timer);
  }, [game.gameStatus]);

  useEffect(() => {
    if (game.gameStatus !== 'win' && game.gameStatus !== 'draw') return;
    if (recordedGameRef.current === game.gameId) return;

    recordedGameRef.current = game.gameId;
    const result = game.gameStatus === 'draw'
      ? 'draw'
      : game.winner === 'black'
        ? 'win'
        : 'loss';
    addGameResult(result);
  }, [addGameResult, game.gameId, game.gameStatus, game.winner]);

  return (
    <div className="app">
      <DifficultyModal
        visible={game.gameStatus === 'idle'}
        playerName={playerName}
        onNameChange={setPlayerName}
        onSelect={game.selectDifficulty}
      />
      <ResultModal
        visible={showResult}
        gameStatus={game.gameStatus}
        winner={game.winner}
        playerName={playerName}
        topScores={topScores}
        onRestart={game.restartGame}
        onChangeDifficulty={game.changeDifficulty}
      />
      <header className="app-header">
        <h1 className="app-title">OMOK</h1>
        {game.gameStatus !== 'idle' && (
          <p className="app-difficulty">난이도: {DIFF_LABELS[game.difficulty]}</p>
        )}
      </header>
      <div className="board-shell">
        <Board
          board={game.board}
          winCells={game.winCells}
          forbiddenCells={game.forbiddenCells}
          lastMove={game.lastMove}
          turn={game.turn}
          gameStatus={game.gameStatus}
          onCellClick={game.placeStone}
        />
      </div>
      <StatusBar
        turn={game.turn}
        isAIThinking={game.isAIThinking}
        canUndo={game.canUndo}
        gameStatus={game.gameStatus}
        onUndo={game.undoMove}
        onRestart={game.restartGame}
        onChangeDifficulty={game.changeDifficulty}
      />
    </div>
  );
}
