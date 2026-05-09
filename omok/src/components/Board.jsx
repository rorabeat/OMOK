import { STONE, BOARD_SIZE } from '../constants/config.js';
import Cell from './Cell.jsx';
import './Board.css';

const STAR_SET = new Set([
  '3-3','3-7','3-11','7-3','7-7','7-11','11-3','11-7','11-11',
]);

export default function Board({ board, winCells, lastMove, turn, gameStatus, onCellClick }) {
  const winSet = new Set((winCells || []).map(([r, c]) => `${r}-${c}`));

  return (
    <div className="board">
      {board.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`;
          const canPlace =
            turn === 'black' &&
            gameStatus === 'playing' &&
            cell === STONE.EMPTY;
          return (
            <Cell
              key={key}
              row={r}
              col={c}
              value={cell}
              isLastMove={lastMove?.row === r && lastMove?.col === c}
              isWinCell={winSet.has(key)}
              isStar={STAR_SET.has(key) && cell === STONE.EMPTY}
              canPlace={canPlace}
              onClick={canPlace ? () => onCellClick(r, c) : undefined}
            />
          );
        })
      )}
    </div>
  );
}
