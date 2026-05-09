import { memo } from 'react';
import { STONE } from '../constants/config.js';
import './Cell.css';

const Cell = memo(function Cell({
  row,
  col,
  value,
  edgeIndex,
  isLastMove,
  isWinCell,
  isStar,
  isForbidden,
  canPlace,
  onClick,
}) {
  const edgeH = col === 0 ? ' edge-left' : col === edgeIndex ? ' edge-right' : '';
  const edgeV = row === 0 ? ' edge-top' : row === edgeIndex ? ' edge-bottom' : '';

  const cellClass =
    `cell${canPlace ? ' placeable' : ''}${isForbidden ? ' forbidden' : ''}`;

  const handleTouchStart = (event) => {
    if (!canPlace || !onClick) return;
    event.preventDefault();
    onClick();
  };

  return (
    <div
      className={cellClass}
      role={canPlace ? 'button' : undefined}
      tabIndex={canPlace ? 0 : undefined}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onKeyDown={(event) => {
        if (!canPlace || !onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {isForbidden && <span className="forbidden-marker" aria-hidden />}
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
