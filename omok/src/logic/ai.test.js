import { describe, expect, it } from 'vitest';
import { DIFFICULTY, STONE } from '../constants/config.js';
import {
  createBoard,
  checkWinner,
} from './rules.js';
import { getCandidateCells, evaluateBoard, getBestMove } from './ai.js';

describe('ai', () => {
  it('returns the center as the only candidate on an empty board', () => {
    expect(getCandidateCells(createBoard())).toEqual([[7, 7]]);
  });

  it('evaluates identical empty boards consistently', () => {
    expect(evaluateBoard(createBoard())).toBe(evaluateBoard(createBoard()));
  });

  it('getBestMove(EASY) returns an empty cell', () => {
    const b = createBoard();
    const { row, col } = getBestMove(b, DIFFICULTY.EASY);
    expect(b[row][col]).toBe(STONE.EMPTY);
  });

  it('getBestMove(EASY) takes an immediate AI win', () => {
    const b = createBoard();
    const r = 8;
    for (let c = 11; c <= 14; c++) b[r][c] = STONE.WHITE;

    const { row, col } = getBestMove(b, DIFFICULTY.EASY);
    expect(row).toBe(r);
    expect(col).toBe(10);
    b[row][col] = STONE.WHITE;
    expect(checkWinner(b, row, col, STONE.WHITE)).not.toBeNull();
  });

  it('getBestMove(NORMAL) takes an immediate AI win', () => {
    const b = createBoard();
    const r = 6;
    for (let c = 3; c <= 6; c++) b[r][c] = STONE.WHITE;

    const { row, col } = getBestMove(b, DIFFICULTY.NORMAL);
    b[row][col] = STONE.WHITE;

    expect(checkWinner(b, row, col, STONE.WHITE)).not.toBeNull();
  });

  it('getBestMove(NORMAL) blocks an immediate player win', () => {
    const b = createBoard();
    const r = 9;
    for (let c = 3; c <= 6; c++) b[r][c] = STONE.BLACK;

    const { row, col } = getBestMove(b, DIFFICULTY.NORMAL);
    b[row][col] = STONE.BLACK;

    expect(checkWinner(b, row, col, STONE.BLACK)).not.toBeNull();
  });

  it('getBestMove(HARD) takes an immediate AI win', () => {
    const b = createBoard();
    const r = 5;
    for (let c = 4; c <= 7; c++) b[r][c] = STONE.WHITE;

    const { row, col } = getBestMove(b, DIFFICULTY.HARD);
    b[row][col] = STONE.WHITE;

    expect(checkWinner(b, row, col, STONE.WHITE)).not.toBeNull();
  });
});
