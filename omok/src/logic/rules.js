import { BOARD_SIZE, WIN_COUNT, STONE } from '../constants/config.js';

// ── 보드 생성 ──────────────────────────────────────────────────────────────

/** 15×15 빈 보드를 반환한다 */
export function createBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(STONE.EMPTY));
}

// ── 방향 벡터 (가로·세로·대각선 4방향) ────────────────────────────────────

const DIRECTIONS = [
  [0, 1],   // 가로
  [1, 0],   // 세로
  [1, 1],   // 대각선 ↘
  [1, -1],  // 대각선 ↙
];

// ── 연속 카운트 헬퍼 ───────────────────────────────────────────────────────

/**
 * 한 방향으로 stone과 같은 돌이 연속으로 몇 개인지 반환한다.
 * 착수 예정 위치(row, col)는 이미 board에 놓인 상태로 전달된다.
 */
function countDirection(board, row, col, dr, dc, stone) {
  let count = 0;
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === stone) {
    count++;
    r += dr;
    c += dc;
  }
  return count;
}

/**
 * 양방향 합산 연속 수를 반환한다 (착수점 포함 +1).
 */
function countLine(board, row, col, dr, dc, stone) {
  return (
    1 +
    countDirection(board, row, col, dr, dc, stone) +
    countDirection(board, row, col, -dr, -dc, stone)
  );
}

// ── 승리 판정 ──────────────────────────────────────────────────────────────

/**
 * (row, col)에 stone을 놓았을 때 승리 여부를 확인한다.
 * 승리 시 이긴 돌 5개의 좌표 배열을 반환, 아니면 null을 반환한다.
 * board는 이미 (row, col)에 stone이 놓인 상태여야 한다.
 */
export function checkWinner(board, row, col, stone) {
  for (const [dr, dc] of DIRECTIONS) {
    const line = buildLine(board, row, col, dr, dc, stone);
    // 정확히 WIN_COUNT(5)개인 연속 구간을 찾는다 (장목 제외는 흑 금수로 별도 처리)
    const winLine = findExactFive(line);
    if (winLine) return winLine;
  }
  return null;
}

/** 한 방향 양쪽으로 같은 돌 좌표를 모아 배열로 반환한다 */
function buildLine(board, row, col, dr, dc, stone) {
  const cells = [[row, col]];
  for (const [d] of [[-1], [1]]) {
    let r = row + d * dr;
    let c = col + d * dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === stone) {
      if (d === -1) cells.unshift([r, c]);
      else cells.push([r, c]);
      r += d * dr;
      c += d * dc;
    }
  }
  return cells;
}

/** 연속 좌표 배열에서 정확히 5개 짜리 구간을 찾는다 */
function findExactFive(cells) {
  if (cells.length < WIN_COUNT) return null;
  for (let i = 0; i <= cells.length - WIN_COUNT; i++) {
    const slice = cells.slice(i, i + WIN_COUNT);
    if (slice.length === WIN_COUNT) return slice;
  }
  return null;
}

// ── 금수 판별 (렌주 룰, 흑에만 적용) ─────────────────────────────────────

/**
 * (row, col)에 흑돌을 놓는 것이 금수인지 판별한다.
 * board는 해당 위치가 EMPTY인 상태로 전달된다.
 *
 * 판별 순서: 장목 → 44 → 33
 * 장목이면 44·33 검사 없이 즉시 true 반환.
 */
export function isForbidden(board, row, col) {
  if (board[row][col] !== STONE.EMPTY) return false;

  // 가상으로 흑돌을 놓아본다
  board[row][col] = STONE.BLACK;

  const forbidden = checkOverline(board, row, col) ||
    checkDoubleFour(board, row, col) ||
    checkDoubleThree(board, row, col);

  board[row][col] = STONE.EMPTY;
  return forbidden;
}

/** 장목: 6개 이상 연속 */
function checkOverline(board, row, col) {
  for (const [dr, dc] of DIRECTIONS) {
    if (countLine(board, row, col, dr, dc, STONE.BLACK) > WIN_COUNT) return true;
  }
  return false;
}

/** 44: 4를 만드는 방향이 2개 이상 */
function checkDoubleFour(board, row, col) {
  let fourCount = 0;
  for (const [dr, dc] of DIRECTIONS) {
    if (makesFour(board, row, col, dr, dc)) fourCount++;
    if (fourCount >= 2) return true;
  }
  return false;
}

/**
 * 특정 방향에서 4를 만드는지 확인한다.
 * "열린 4"(양쪽 끝이 빔) 또는 "반열린 4"(한쪽만 빔, 이미 4줄 형성)를 포함.
 */
function makesFour(board, row, col, dr, dc) {
  const line = countLine(board, row, col, dr, dc, STONE.BLACK);
  if (line === WIN_COUNT) {
    // 정확히 5줄이면 승리수이지, 4를 만드는 게 아니다
    return false;
  }
  if (line === WIN_COUNT - 1) {
    // 4연속: 한쪽이라도 열려 있으면 4로 인정
    const fwd = countDirection(board, row, col, dr, dc, STONE.BLACK);
    const bwd = countDirection(board, row, col, -dr, -dc, STONE.BLACK);
    const fwdOpen = isCellOpen(board, row + (fwd + 1) * dr, col + (fwd + 1) * dc);
    const bwdOpen = isCellOpen(board, row - (bwd + 1) * dr, col - (bwd + 1) * dc);
    return fwdOpen || bwdOpen;
  }
  // 간격이 있는 4 (X_XXX, XX_XX, XXX_X): 빈 칸 하나를 채워서 5가 되는 패턴
  return hasGappedFour(board, row, col, dr, dc);
}

/** 간격이 있는 4 패턴 (예: X.XXX, XX.XX, XXX.X) 감지 */
function hasGappedFour(board, row, col, dr, dc) {
  // 양방향으로 최대 WIN_COUNT-1 칸까지 탐색하며 EMPTY 한 칸을 채웠을 때 4줄이 되는지 확인
  for (let gap = 1; gap <= WIN_COUNT - 1; gap++) {
    const tr = row + gap * dr;
    const tc = col + gap * dc;
    if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE) break;
    if (board[tr][tc] === STONE.EMPTY) {
      board[tr][tc] = STONE.BLACK;
      const len = countLine(board, row, col, dr, dc, STONE.BLACK);
      board[tr][tc] = STONE.EMPTY;
      if (len === WIN_COUNT) return true;
    } else if (board[tr][tc] !== STONE.BLACK) {
      break;
    }
  }
  for (let gap = 1; gap <= WIN_COUNT - 1; gap++) {
    const tr = row - gap * dr;
    const tc = col - gap * dc;
    if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE) break;
    if (board[tr][tc] === STONE.EMPTY) {
      board[tr][tc] = STONE.BLACK;
      const len = countLine(board, row, col, dr, dc, STONE.BLACK);
      board[tr][tc] = STONE.EMPTY;
      if (len === WIN_COUNT) return true;
    } else if (board[tr][tc] !== STONE.BLACK) {
      break;
    }
  }
  return false;
}

/** 33: 열린 3을 만드는 방향이 2개 이상 */
function checkDoubleThree(board, row, col) {
  let threeCount = 0;
  for (const [dr, dc] of DIRECTIONS) {
    if (makesOpenThree(board, row, col, dr, dc)) threeCount++;
    if (threeCount >= 2) return true;
  }
  return false;
}

/**
 * 특정 방향에서 열린 3을 만드는지 확인한다.
 * 열린 3: 양쪽 끝이 모두 비어 있는 3연속 (확장하면 열린 4 → 5목이 가능).
 */
function makesOpenThree(board, row, col, dr, dc) {
  const line = countLine(board, row, col, dr, dc, STONE.BLACK);
  if (line !== 3) {
    // 간격이 있는 열린 3 패턴도 확인
    return hasGappedOpenThree(board, row, col, dr, dc);
  }
  const fwd = countDirection(board, row, col, dr, dc, STONE.BLACK);
  const bwd = countDirection(board, row, col, -dr, -dc, STONE.BLACK);
  const fwdOpen = isCellOpen(board, row + (fwd + 1) * dr, col + (fwd + 1) * dc);
  const bwdOpen = isCellOpen(board, row - (bwd + 1) * dr, col - (bwd + 1) * dc);
  return fwdOpen && bwdOpen;
}

/**
 * 간격이 있는 열린 3 감지 (_X_XX_, _XX_X_ 등)
 * 재귀 없이 gap 위치에 돌을 가상으로 놓고 3연속 + 양끝 열림 여부만 직접 판단한다.
 */
function hasGappedOpenThree(board, row, col, dr, dc) {
  for (let k = -(WIN_COUNT - 1); k <= WIN_COUNT - 1; k++) {
    if (k === 0) continue;
    const tr = row + k * dr;
    const tc = col + k * dc;
    if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE) continue;
    if (board[tr][tc] !== STONE.EMPTY) continue;

    board[tr][tc] = STONE.BLACK;
    const line = countLine(board, row, col, dr, dc, STONE.BLACK);
    let result = false;
    if (line === 3) {
      const fwd = countDirection(board, row, col, dr, dc, STONE.BLACK);
      const bwd = countDirection(board, row, col, -dr, -dc, STONE.BLACK);
      const fwdOpen = isCellOpen(board, row + (fwd + 1) * dr, col + (fwd + 1) * dc);
      const bwdOpen = isCellOpen(board, row - (bwd + 1) * dr, col - (bwd + 1) * dc);
      result = fwdOpen && bwdOpen;
    }
    board[tr][tc] = STONE.EMPTY;
    if (result) return true;
  }
  return false;
}

function isCellOpen(board, r, c) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === STONE.EMPTY;
}

// ── 전체 금수 좌표 ──────────────────────────────────────────────────────────

/**
 * 현재 보드에서 흑이 놓을 수 없는 금수 위치 배열을 반환한다.
 * Board 컴포넌트가 호버 표시에 사용한다.
 */
export function getForbiddenCells(board) {
  const forbidden = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === STONE.EMPTY && isForbidden(board, r, c)) {
        forbidden.push([r, c]);
      }
    }
  }
  return forbidden;
}

// ── 무승부 판정 ────────────────────────────────────────────────────────────

/** 보드가 가득 찼으면 true */
export function isBoardFull(board) {
  return board.every(row => row.every(cell => cell !== STONE.EMPTY));
}
