import { memo } from 'react';
import { STONE } from '../constants/config.js';
import './Cell.css';

const Cell = memo(function Cell({ row, col, value, isLastMove, isWinCell, isStar, canPlace, onClick }) {
  const edgeH = col === 0 ? ' edge-left' : col === 14 ? ' edge-right' : '';
  const edgeV = row === 0 ? ' edge-top' : row === 14 ? ' edge-bottom' : '';

  return (
    <div className={`cell${canPlace ? ' placeable' : ''}`} onClick={onClick}>
      <div className={`line-h${edgeH}`} />
      <div className={`line-v${edgeV}`} />
      {isStar && <div className="star-point" />}
      {value !== STONE.EMPTY && (
        <div className={`stone ${value === STONE.BLACK ? 'stone-black' : 'stone-white'}${isLastMove ? ' last-move' : ''}${isWinCell ? ' win-cell' : ''}`} />
      )}
    </div>
  );
});

export default Cell;
