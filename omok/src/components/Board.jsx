import { useMemo } from 'react';
import { STONE, BOARD_SIZE } from '../constants/config.js';
import Cell from './Cell.jsx';
import './Board.css';

const STAR_SET = new Set([
  '3-3','3-7','3-11','7-3','7-7','7-11','11-3','11-7','11-11',
]);

const EDGE = BOARD_SIZE - 1;

export default function Board({
  board,
  winCells,
  forbiddenCells,
  lastMove,
  turn,
  gameStatus,
  onCellClick,
}) {
  const winSet = useMemo(
    () => new Set((winCells || []).map(([r, c]) => `${r}-${c}`)),
    [winCells],
  );

  const forbiddenSet = useMemo(
    () => new Set((forbiddenCells || []).map(([r, c]) => `${r}-${c}`)),
    [forbiddenCells],
  );

  return (
    <div className="board">
      {board.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`;
          const isForbiddenSpot =
            cell === STONE.EMPTY && forbiddenSet.has(key);
          const canPlace =
            turn === 'black' &&
            gameStatus === 'playing' &&
            cell === STONE.EMPTY &&
            !isForbiddenSpot;
          return (
            <Cell
              key={key}
              row={r}
              col={c}
              value={cell}
              edgeIndex={EDGE}
              isLastMove={lastMove?.row === r && lastMove?.col === c}
              isWinCell={winSet.has(key)}
              isStar={STAR_SET.has(key) && cell === STONE.EMPTY}
              isForbidden={turn === 'black' && gameStatus === 'playing' && isForbiddenSpot}
              canPlace={canPlace}
              onClick={canPlace ? () => onCellClick(r, c) : undefined}
            />
          );
        })
      )}
    </div>
  );
}
