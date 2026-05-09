import { useEffect } from 'react';
import { AI_DELAY_MS } from '../constants/config.js';
import { getBestMove } from '../logic/ai.js';

/**
 * Handles the AI move after the player completes a turn.
 *
 * @param {object} params
 * @param {string} params.turn - 'black' | 'white'
 * @param {string} params.gameStatus - 'idle' | 'playing' | 'win' | 'draw'
 * @param {number[][]} params.board - Current board state.
 * @param {string} params.difficulty - DIFFICULTY value.
 * @param {function} params.placeStoneByAI - AI move callback.
 */
export function useAI({ turn, gameStatus, board, difficulty, placeStoneByAI }) {
  useEffect(() => {
    if (turn !== 'white' || gameStatus !== 'playing') return;

    const delay =
      AI_DELAY_MS.min + Math.random() * (AI_DELAY_MS.max - AI_DELAY_MS.min);

    const timer = setTimeout(() => {
      const { row, col } = getBestMove(board, difficulty);
      placeStoneByAI(row, col);
    }, delay);

    return () => clearTimeout(timer);
  }, [board, difficulty, gameStatus, placeStoneByAI, turn]);
}
