import { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame.js';
import { useAI } from './hooks/useAI.js';
import Board from './components/Board.jsx';
import StatusBar from './components/StatusBar.jsx';
import DifficultyModal from './components/DifficultyModal.jsx';
import ResultModal from './components/ResultModal.jsx';
import './index.css';

export default function App() {
  const game = useGame();
  const [showResult, setShowResult] = useState(false);

  useAI({
    turn: game.turn,
    gameStatus: game.gameStatus,
    board: game.board,
    difficulty: game.difficulty,
    placeStoneByAI: game.placeStoneByAI,
  });

  // 승패 결정 후 1.5초 뒤에 결과 모달 표시 (승리 돌을 먼저 보여주기 위해)
  useEffect(() => {
    if (game.gameStatus === 'win' || game.gameStatus === 'draw') {
      const t = setTimeout(() => setShowResult(true), 1500);
      return () => clearTimeout(t);
    }
    setShowResult(false);
  }, [game.gameStatus]);

  return (
    <div className="app">
      <DifficultyModal
        visible={game.gameStatus === 'idle'}
        onSelect={game.selectDifficulty}
      />
      <ResultModal
        visible={showResult}
        gameStatus={game.gameStatus}
        winner={game.winner}
        onRestart={game.restartGame}
        onChangeDifficulty={game.changeDifficulty}
      />
      <h1 className="app-title">OMOK</h1>
      <Board
        board={game.board}
        winCells={game.winCells}
        lastMove={game.lastMove}
        turn={game.turn}
        gameStatus={game.gameStatus}
        onCellClick={game.placeStone}
      />
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
