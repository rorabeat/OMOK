import { describe, expect, it } from 'vitest';
import { BOARD_SIZE, STONE } from '../constants/config.js';
import {
  createBoard,
  checkWinner,
  isForbidden,
  getForbiddenCells,
  isBoardFull,
} from './rules.js';

describe('rules', () => {
  it('creates a 15x15 empty board', () => {
    const b = createBoard();
    expect(b.length).toBe(BOARD_SIZE);
    expect(b[0].length).toBe(BOARD_SIZE);
    expect(b.every(row => row.every(c => c === STONE.EMPTY))).toBe(true);
  });

  it('detects an exact horizontal five', () => {
    const row = 7;
    const b = createBoard();
    for (let c = 5; c <= 9; c++) b[row][c] = STONE.BLACK;

    const win = checkWinner(b, row, 9, STONE.BLACK);

    expect(win).not.toBeNull();
    expect(win).toHaveLength(5);
    expect(win.every(([r, c]) => r === row && c >= 5 && c <= 9)).toBe(true);
  });

  it('does not report a win for only four stones', () => {
    const row = 3;
    const b = createBoard();
    for (let c = 2; c <= 5; c++) b[row][c] = STONE.WHITE;

    expect(checkWinner(b, row, 5, STONE.WHITE)).toBeNull();
  });

  it('reports an empty board as not full', () => {
    expect(isBoardFull(createBoard())).toBe(false);
  });

  it('has no forbidden cells on an empty board', () => {
    expect(getForbiddenCells(createBoard())).toEqual([]);
  });

  it('allows a normal first move', () => {
    expect(isForbidden(createBoard(), 7, 7)).toBe(false);
  });

  it('detects overline as forbidden', () => {
    const r = 7;
    const b = createBoard();
    b[r][5] = STONE.BLACK;
    b[r][6] = STONE.BLACK;
    b[r][8] = STONE.BLACK;
    b[r][9] = STONE.BLACK;
    b[r][10] = STONE.BLACK;
    b[r][11] = STONE.BLACK;

    expect(isForbidden(b, r, 7)).toBe(true);
  });

  it('detects double-three as forbidden', () => {
    const b = createBoard();
    b[7][5] = STONE.BLACK;
    b[7][6] = STONE.BLACK;
    b[5][7] = STONE.BLACK;
    b[6][7] = STONE.BLACK;

    expect(isForbidden(b, 7, 7)).toBe(true);
    expect(getForbiddenCells(b)).toContainEqual([7, 7]);
  });

  it('detects double-four as forbidden', () => {
    const b = createBoard();
    b[7][5] = STONE.BLACK;
    b[7][6] = STONE.BLACK;
    b[7][8] = STONE.BLACK;
    b[5][7] = STONE.BLACK;
    b[6][7] = STONE.BLACK;
    b[8][7] = STONE.BLACK;

    expect(isForbidden(b, 7, 7)).toBe(true);
    expect(getForbiddenCells(b)).toContainEqual([7, 7]);
  });

  it('reports a full board', () => {
    const b = createBoard();
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        b[r][c] = (r + c) % 2 === 0 ? STONE.BLACK : STONE.WHITE;
      }
    }

    expect(isBoardFull(b)).toBe(true);
  });
});
