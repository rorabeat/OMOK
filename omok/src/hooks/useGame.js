import { useState, useCallback } from 'react';
import { STONE, DIFFICULTY } from '../constants/config.js';
import {
  createBoard,
  checkWinner,
  isForbidden,
  getForbiddenCells,
  isBoardFull,
} from '../logic/rules.js';

const INITIAL_STATE = {
  board: createBoard(),
  turn: 'black',            // 'black' | 'white'
  gameStatus: 'idle',       // 'idle' | 'playing' | 'win' | 'draw'
  winner: null,             // null | 'black' | 'white'
  winCells: [],             // 승리 돌 좌표 배열 [[r,c], ...]
  history: [],              // 무르기용 스냅샷 스택 [{ board, lastMove }, ...]
  difficulty: DIFFICULTY.NORMAL,
  forbiddenCells: [],       // 흑 금수 좌표 배열
  lastMove: null,           // 마지막 착수 좌표 { row, col }
  isAIThinking: false,
};

export function useGame() {
  const [state, setState] = useState(INITIAL_STATE);

  // ── 내부 헬퍼 ───────────────────────────────────────────────────────────

  /** 보드 배열 깊은 복사 */
  const cloneBoard = (board) => board.map(r => [...r]);

  /**
   * 착수 공통 로직. stone을 (row, col)에 놓고 상태를 업데이트한다.
   * isAI=true 이면 무르기 스냅샷을 히스토리에 쌓지 않는다 (플레이어 수에 묶어서 관리).
   */
  const applyMove = useCallback((prevState, row, col, stone, isAI = false) => {
    const newBoard = cloneBoard(prevState.board);
    newBoard[row][col] = stone;

    const winResult = checkWinner(newBoard, row, col, stone);
    if (winResult) {
      return {
        ...prevState,
        board: newBoard,
        gameStatus: 'win',
        winner: stone === STONE.BLACK ? 'black' : 'white',
        winCells: winResult,
        lastMove: { row, col },
        isAIThinking: false,
        forbiddenCells: [],
      };
    }

    if (isBoardFull(newBoard)) {
      return {
        ...prevState,
        board: newBoard,
        gameStatus: 'draw',
        lastMove: { row, col },
        isAIThinking: false,
        forbiddenCells: [],
      };
    }

    const nextTurn = stone === STONE.BLACK ? 'white' : 'black';
    const nextForbidden = nextTurn === 'black' ? getForbiddenCells(newBoard) : [];

    // 플레이어 수 완료 시 히스토리에 스냅샷 저장
    const newHistory = isAI
      ? prevState.history
      : [...prevState.history, { board: cloneBoard(prevState.board), lastMove: prevState.lastMove }];

    return {
      ...prevState,
      board: newBoard,
      turn: nextTurn,
      gameStatus: 'playing',
      lastMove: { row, col },
      forbiddenCells: nextForbidden,
      history: newHistory,
      isAIThinking: nextTurn === 'white',
    };
  }, []);

  // ── 외부 공개 함수 ───────────────────────────────────────────────────────

  /** 난이도 선택 후 게임 시작 */
  const selectDifficulty = useCallback((level) => {
    const board = createBoard();
    setState({
      ...INITIAL_STATE,
      board,
      difficulty: level,
      gameStatus: 'playing',
      forbiddenCells: [],
    });
  }, []);

  /** 플레이어(흑) 착수 */
  const placeStone = useCallback((row, col) => {
    setState(prev => {
      if (prev.gameStatus !== 'playing') return prev;
      if (prev.turn !== 'black') return prev;
      if (prev.board[row][col] !== STONE.EMPTY) return prev;
      if (isForbidden(prev.board, row, col)) return prev;
      return applyMove(prev, row, col, STONE.BLACK);
    });
  }, [applyMove]);

  /**
   * AI(백) 착수 — useAI 훅에서 호출한다.
   * setState 함수형 업데이트를 사용해 최신 상태를 보장한다.
   */
  const placeStoneByAI = useCallback((row, col) => {
    setState(prev => {
      if (prev.gameStatus !== 'playing') return prev;
      if (prev.turn !== 'white') return prev;
      if (prev.board[row][col] !== STONE.EMPTY) return prev;
      return applyMove(prev, row, col, STONE.WHITE, true);
    });
  }, [applyMove]);

  /** 무르기: 플레이어 + AI 2수를 함께 되돌린다 */
  const undoMove = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const { board, lastMove } = prev.history[prev.history.length - 1];
      const restoredBoard = cloneBoard(board);
      return {
        ...prev,
        board: restoredBoard,
        turn: 'black',
        gameStatus: 'playing',
        winner: null,
        winCells: [],
        lastMove,
        forbiddenCells: getForbiddenCells(restoredBoard),
        history: prev.history.slice(0, -1),
        isAIThinking: false,
      };
    });
  }, []);

  /** 게임 재시작 (난이도 유지) */
  const restartGame = useCallback(() => {
    setState(prev => {
      const board = createBoard();
      return {
        ...INITIAL_STATE,
        board,
        difficulty: prev.difficulty,
        gameStatus: 'playing',
        forbiddenCells: [],
      };
    });
  }, []);

  /** 난이도 변경 모달로 돌아가기 */
  const changeDifficulty = useCallback(() => {
    setState({ ...INITIAL_STATE, board: createBoard() });
  }, []);

  return {
    ...state,
    canUndo: state.history.length > 0 && state.gameStatus === 'playing' && state.turn === 'black',
    selectDifficulty,
    placeStone,
    placeStoneByAI,
    undoMove,
    restartGame,
    changeDifficulty,
  };
}
