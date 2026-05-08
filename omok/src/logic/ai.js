import { BOARD_SIZE, WIN_COUNT, STONE, AI_DEPTH, DIFFICULTY } from '../constants/config.js';
import { checkWinner, isBoardFull } from './rules.js';

// ── 후보 셀 추출 ────────────────────────────────────────────────────────────

const CANDIDATE_RADIUS = 2;

/**
 * 이미 놓인 돌 주변 CANDIDATE_RADIUS 칸 이내의 빈 교차점만 반환한다.
 * 전체 보드를 탐색하는 것보다 탐색 공간을 크게 줄여 미니맥스 속도를 높인다.
 * 보드가 비어 있으면 중앙을 반환한다.
 */
export function getCandidateCells(board) {
  const center = Math.floor(BOARD_SIZE / 2);
  const hasStone = board.some(row => row.some(c => c !== STONE.EMPTY));
  if (!hasStone) return [[center, center]];

  const candidates = new Set();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === STONE.EMPTY) continue;
      for (let dr = -CANDIDATE_RADIUS; dr <= CANDIDATE_RADIUS; dr++) {
        for (let dc = -CANDIDATE_RADIUS; dc <= CANDIDATE_RADIUS; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === STONE.EMPTY) {
            candidates.add(`${nr},${nc}`);
          }
        }
      }
    }
  }
  return [...candidates].map(key => key.split(',').map(Number));
}

// ── 패턴 점수 테이블 ────────────────────────────────────────────────────────

/**
 * 연속 돌의 수(count)와 양끝 열린 수(openEnds: 0~2)로 점수를 반환한다.
 * 공격(AI=WHITE) 점수와 방어(BLACK 차단) 점수 계산에 공통 사용.
 */
function scorePattern(count, openEnds) {
  if (count >= WIN_COUNT) return 100_000;
  switch (count) {
    case 4: return openEnds === 2 ? 10_000 : openEnds === 1 ? 1_000 : 0;
    case 3: return openEnds === 2 ? 500   : openEnds === 1 ? 100   : 0;
    case 2: return openEnds === 2 ? 10    : openEnds === 1 ? 2     : 0;
    default: return 0;
  }
}

// ── 보드 평가 함수 ──────────────────────────────────────────────────────────

const DIRECTIONS = [[0,1],[1,0],[1,1],[1,-1]];

/**
 * 보드 전체를 평가해 WHITE(AI) 관점의 점수를 반환한다.
 * 양수: AI 유리 / 음수: 플레이어 유리
 */
export function evaluateBoard(board) {
  let score = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (const [dr, dc] of DIRECTIONS) {
        // 이미 앞에서 처리한 방향은 건너뜀 (중복 카운트 방지)
        const pr = r - dr;
        const pc = c - dc;
        if (pr >= 0 && pr < BOARD_SIZE && pc >= 0 && pc < BOARD_SIZE && board[pr][pc] === board[r][c]) continue;

        const stone = board[r][c];
        if (stone === STONE.EMPTY) continue;

        let count = 0;
        let openEnds = 0;

        // 뒤쪽 끝
        const br = r - dr;
        const bc = c - dc;
        if (br < 0 || br >= BOARD_SIZE || bc < 0 || bc >= BOARD_SIZE || board[br][bc] === (stone === STONE.WHITE ? STONE.BLACK : STONE.WHITE)) {
          // blocked
        } else if (board[br][bc] === STONE.EMPTY) {
          openEnds++;
        }

        // 연속 카운트
        let nr = r;
        let nc = c;
        while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === stone) {
          count++;
          nr += dr;
          nc += dc;
        }

        // 앞쪽 끝
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === STONE.EMPTY) {
          openEnds++;
        }

        const lineScore = scorePattern(count, openEnds);
        if (stone === STONE.WHITE) {
          score += lineScore;
        } else {
          // 방어 가중치: 플레이어 위협을 AI 공격보다 약간 높게 평가
          score -= lineScore * 1.1;
        }
      }
    }
  }

  // 중앙 근접 보너스
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === STONE.EMPTY) continue;
      const center = Math.floor(BOARD_SIZE / 2);
      const dist = Math.abs(r - center) + Math.abs(c - center);
      const bonus = Math.max(0, 3 - dist) * 2;
      score += board[r][c] === STONE.WHITE ? bonus : -bonus;
    }
  }

  return score;
}

// ── 단말 노드 판정 ──────────────────────────────────────────────────────────

function isTerminal(board, lastRow, lastCol, lastStone) {
  if (lastRow === -1) return false;
  if (checkWinner(board, lastRow, lastCol, lastStone)) return true;
  if (isBoardFull(board)) return true;
  return false;
}

// ── 미니맥스 + 알파-베타 가지치기 ──────────────────────────────────────────

// 탐색 노드당 고려할 최대 후보 수. 값이 작을수록 빠르지만 강도가 낮아진다.
const MAX_CANDIDATES_PER_NODE = 10;

/**
 * 후보 셀을 휴리스틱 점수로 정렬해 상위 N개만 반환한다.
 * 알파-베타 가지치기 효율을 높이기 위해 좋은 수를 먼저 탐색한다.
 */
function getSortedCandidates(board, isMaximizing) {
  const stone = isMaximizing ? STONE.WHITE : STONE.BLACK;
  const raw = getCandidateCells(board);
  const scored = raw.map(([r, c]) => {
    board[r][c] = stone;
    const s = evaluateBoard(board);
    board[r][c] = STONE.EMPTY;
    return { r, c, s };
  });
  scored.sort((a, b) => isMaximizing ? b.s - a.s : a.s - b.s);
  return scored.slice(0, MAX_CANDIDATES_PER_NODE);
}

/**
 * @param {number[][]} board
 * @param {number} depth   - 남은 탐색 깊이
 * @param {number} alpha
 * @param {number} beta
 * @param {boolean} isMaximizing - true: WHITE(AI) 차례
 * @param {number} lastRow  - 직전 착수 행
 * @param {number} lastCol  - 직전 착수 열
 * @param {number} lastStone
 * @returns {number} 평가 점수
 */
function minimax(board, depth, alpha, beta, isMaximizing, lastRow, lastCol, lastStone) {
  if (depth === 0 || isTerminal(board, lastRow, lastCol, lastStone)) {
    if (lastRow !== -1 && checkWinner(board, lastRow, lastCol, lastStone)) {
      return lastStone === STONE.WHITE ? 100_000 + depth : -(100_000 + depth);
    }
    return evaluateBoard(board);
  }

  const candidates = getSortedCandidates(board, isMaximizing);
  const stone = isMaximizing ? STONE.WHITE : STONE.BLACK;

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const { r, c } of candidates) {
      board[r][c] = stone;
      const score = minimax(board, depth - 1, alpha, beta, false, r, c, stone);
      board[r][c] = STONE.EMPTY;
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const { r, c } of candidates) {
      board[r][c] = stone;
      const score = minimax(board, depth - 1, alpha, beta, true, r, c, stone);
      board[r][c] = STONE.EMPTY;
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

// ── 쉬움 전략 ───────────────────────────────────────────────────────────────

/**
 * 쉬움: 즉시 승리 또는 즉시 차단이 가능한 수가 있으면 그 수를 두고,
 * 없으면 후보 중 랜덤으로 착수한다.
 */
function getBestMoveEasy(board) {
  const candidates = getCandidateCells(board);

  // 1. 즉시 승리 수
  for (const [r, c] of candidates) {
    board[r][c] = STONE.WHITE;
    const win = checkWinner(board, r, c, STONE.WHITE);
    board[r][c] = STONE.EMPTY;
    if (win) return { row: r, col: c };
  }

  // 2. 즉시 차단
  for (const [r, c] of candidates) {
    board[r][c] = STONE.BLACK;
    const win = checkWinner(board, r, c, STONE.BLACK);
    board[r][c] = STONE.EMPTY;
    if (win) return { row: r, col: c };
  }

  // 3. 랜덤
  const idx = Math.floor(Math.random() * candidates.length);
  const [row, col] = candidates[idx];
  return { row, col };
}

// ── 보통/어려움: 최선 수 탐색 ───────────────────────────────────────────────

function getBestMoveByMinimax(board, depth) {
  // 루트는 후보 수 제한 없이 전체 탐색 (1수 앞 정렬로 알파-베타 효율 확보)
  const candidates = getCandidateCells(board);
  const scored = candidates.map(([r, c]) => {
    board[r][c] = STONE.WHITE;
    const s = evaluateBoard(board);
    board[r][c] = STONE.EMPTY;
    return { r, c, s };
  });
  scored.sort((a, b) => b.s - a.s);

  let bestScore = -Infinity;
  let bestMove = scored[0] ? { row: scored[0].r, col: scored[0].c } : { row: 7, col: 7 };

  for (const { r, c } of scored) {
    board[r][c] = STONE.WHITE;
    const score = minimax(board, depth - 1, -Infinity, Infinity, false, r, c, STONE.WHITE);
    board[r][c] = STONE.EMPTY;
    if (score > bestScore) {
      bestScore = score;
      bestMove = { row: r, col: c };
      // 즉시 승리 확정 수를 찾으면 더 탐색하지 않는다
      if (bestScore >= 100_000) break;
    }
  }
  return bestMove;
}

// ── 공개 API ────────────────────────────────────────────────────────────────

/**
 * 난이도에 따라 AI 최선 수를 반환한다.
 * @param {number[][]} board - 현재 보드 (이 함수 내부에서 임시 변경 후 복원)
 * @param {string} difficulty - DIFFICULTY 상수 중 하나
 * @returns {{ row: number, col: number }}
 */
export function getBestMove(board, difficulty) {
  // board 깊은 복사 후 탐색 (원본 보호)
  const boardCopy = board.map(r => [...r]);

  switch (difficulty) {
    case DIFFICULTY.EASY:
      return getBestMoveEasy(boardCopy);
    case DIFFICULTY.HARD:
      return getBestMoveByMinimax(boardCopy, AI_DEPTH[DIFFICULTY.HARD]);
    case DIFFICULTY.NORMAL:
    default:
      return getBestMoveByMinimax(boardCopy, AI_DEPTH[DIFFICULTY.NORMAL]);
  }
}
