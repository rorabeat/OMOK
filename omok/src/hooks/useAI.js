import { useEffect, useRef } from 'react';
import { AI_DELAY_MS } from '../constants/config.js';
import { getBestMove } from '../logic/ai.js';

/**
 * AI 응수를 담당하는 훅.
 * turn === 'white' && gameStatus === 'playing' 일 때 랜덤 딜레이 후 AI 착수.
 *
 * @param {object} params
 * @param {string} params.turn          - 'black' | 'white'
 * @param {string} params.gameStatus    - 'idle' | 'playing' | 'win' | 'draw'
 * @param {number[][]} params.board     - 현재 보드 상태
 * @param {string} params.difficulty    - DIFFICULTY 상수
 * @param {function} params.placeStoneByAI - AI 착수 콜백 (row, col) => void
 */
export function useAI({ turn, gameStatus, board, difficulty, placeStoneByAI }) {
  // 보드를 ref로 유지해 클로저 stale 방지
  const boardRef = useRef(board);
  boardRef.current = board;

  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;

  useEffect(() => {
    if (turn !== 'white' || gameStatus !== 'playing') return;

    const delay =
      AI_DELAY_MS.min + Math.random() * (AI_DELAY_MS.max - AI_DELAY_MS.min);

    const timer = setTimeout(() => {
      const { row, col } = getBestMove(boardRef.current, difficultyRef.current);
      placeStoneByAI(row, col);
    }, delay);

    return () => clearTimeout(timer);
  // placeStoneByAI는 useCallback으로 안정화되어 있으므로 의존성에 포함
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, gameStatus, placeStoneByAI]);
}
