# Implementation Plan — 오목 게임

> 기준 문서: `design_document.md`, `AGENTS.md`
> 스택: React 18 + Vite + Vanilla CSS

---

## 전체 구현 단계 개요

| 단계 | 내용 | 예상 소요 |
|------|------|-----------|
| Phase 1 | 프로젝트 초기 세팅 | 0.5일 |
| Phase 2 | 상수 & 순수 로직 (rules.js) | 1일 |
| Phase 3 | AI 로직 (ai.js) | 1.5일 |
| Phase 4 | 게임 상태 훅 (useGame, useAI) | 1일 |
| Phase 5 | UI 컴포넌트 구현 | 1.5일 |
| Phase 6 | 스타일링 | 1일 |
| Phase 7 | 통합 테스트 & 버그 수정 | 1일 |

---

## Phase 1. 프로젝트 초기 세팅

### 목표
Vite + React 18 프로젝트 골격을 만들고 디렉터리 구조를 확립한다.

### 작업 목록
- [ ] `npm create vite@latest omok -- --template react` 실행
- [ ] 불필요한 보일러플레이트 파일 제거 (`App.css` 기본 내용, `assets/` 샘플)
- [ ] 디렉터리 생성: `src/components/`, `src/hooks/`, `src/logic/`, `src/constants/`
- [ ] 빈 파일 생성 (각 파일은 이후 단계에서 채움):
  - `src/constants/config.js`
  - `src/logic/rules.js`
  - `src/logic/ai.js`
  - `src/hooks/useGame.js`
  - `src/hooks/useAI.js`
  - `src/components/Board.jsx` + `Board.css`
  - `src/components/Cell.jsx` + `Cell.css`
  - `src/components/StatusBar.jsx` + `StatusBar.css`
  - `src/components/DifficultyModal.jsx` + `DifficultyModal.css`
  - `src/components/ResultModal.jsx` + `ResultModal.css`

### 완료 기준
`npm run dev` 실행 시 빈 React 앱이 브라우저에서 정상 렌더링된다.

---

## Phase 2. 상수 정의 & 게임 규칙 로직

### 2-1. `src/constants/config.js`

```js
export const BOARD_SIZE = 15;       // 교차점 수
export const WIN_COUNT = 5;         // 승리 연속 수
export const STONE = { EMPTY: 0, BLACK: 1, WHITE: 2 };
export const DIFFICULTY = { EASY: 'easy', NORMAL: 'normal', HARD: 'hard' };
export const AI_DEPTH = { easy: 0, normal: 3, hard: 5 };
export const AI_DELAY_MS = { min: 300, max: 800 };
```

### 2-2. `src/logic/rules.js`

#### 구현할 함수

| 함수 | 설명 |
|------|------|
| `createBoard()` | 15×15 EMPTY 2차원 배열 반환 |
| `countDirection(board, row, col, dr, dc, stone)` | 특정 방향으로 같은 돌 연속 개수 반환 |
| `countLine(board, row, col, dr, dc, stone)` | 양방향 합산 연속 수 반환 |
| `checkWinner(board, row, col, stone)` | 착수 후 승리 여부 확인, 이긴 좌표 배열 반환 |
| `isForbidden(board, row, col)` | 흑(BLACK) 금수 여부 확인 |
| `getForbiddenCells(board)` | 전체 금수 위치 배열 반환 (호버 표시용) |
| `isBoardFull(board)` | 무승부 판단 |

#### 금수 판별 세부 로직 (`isForbidden`)

```
1. 장목: countLine >= 6 이면 금수
2. 44: WIN_COUNT-1(4) 짜리 열린/반열린 라인이 2개 이상 → 금수
3. 33: 열린 3짜리 라인이 2개 이상 → 금수
우선순위: 장목 → 44 → 33 순으로 검사
```

### 완료 기준
- `checkWinner`가 가로/세로/대각선 5목을 정확히 감지
- `isForbidden`이 33, 44, 장목을 각각 정확히 판별
- 모든 함수가 React import 없이 순수 함수로 동작

---

## Phase 3. AI 로직

### `src/logic/ai.js`

#### 구현할 함수

| 함수 | 설명 |
|------|------|
| `getCandidateCells(board)` | 기존 돌 주변 2칸 이내 빈 교차점만 후보로 추출 |
| `evaluateBoard(board, stone)` | 보드 전체 점수 평가 (휴리스틱) |
| `scorePattern(count, openEnds, stone)` | 연속 패턴에 점수 부여 |
| `getBestMoveEasy(board)` | 쉬움: 위협 차단 + 랜덤 |
| `minimax(board, depth, alpha, beta, isMaximizing)` | 미니맥스 + 알파-베타 |
| `getBestMove(board, difficulty)` | 난이도에 따라 알맞은 함수 호출, `{row, col}` 반환 |

#### 점수 테이블 (evaluateBoard 내부)

| 패턴 | 점수 |
|------|------|
| 5연속 | 100,000 |
| 열린 4 | 10,000 |
| 반열린 4 | 1,000 |
| 열린 3 | 500 |
| 반열린 3 | 100 |
| 열린 2 | 10 |

- 공격(WHITE) 점수 + 방어(BLACK 차단) 점수 합산
- 중앙에 가까울수록 소폭 가산점

#### 비동기 처리
- `getBestMove`는 순수 함수로 유지
- `useAI.js`에서 `setTimeout`으로 감싸 0.3~0.8초 딜레이 후 결과 반환

### 완료 기준
- 쉬움: 4연속 차단 가능
- 보통: 명백한 승리 수를 즉시 둠
- 어려움: 2~3수 앞을 내다보는 응수

---

## Phase 4. 게임 상태 훅

### 4-1. `src/hooks/useGame.js`

#### 관리할 상태

```js
const [board, setBoard]           // 15×15 보드 배열
const [turn, setTurn]             // 'black' | 'white'
const [gameStatus, setGameStatus] // 'idle' | 'playing' | 'win' | 'draw'
const [winner, setWinner]         // null | 'black' | 'white'
const [winCells, setWinCells]     // 승리 돌 좌표 배열
const [history, setHistory]       // 무르기용 [{ board, turn }] 스택
const [difficulty, setDifficulty] // 'easy' | 'normal' | 'hard'
const [forbiddenCells, setForbiddenCells] // 금수 좌표 배열
const [lastMove, setLastMove]     // 마지막 착수 좌표 { row, col }
```

#### 제공할 함수

| 함수 | 설명 |
|------|------|
| `placeStone(row, col)` | 플레이어 착수 처리, 금수/턴 검증 포함 |
| `undoMove()` | history 스택에서 2수(플레이어+AI) 복원 |
| `restartGame()` | 보드 초기화, 상태 리셋 |
| `selectDifficulty(level)` | 난이도 설정 후 게임 시작 |

#### 흐름

```
placeStone(row, col)
  ├─ 턴/금수/이미 놓인 돌 검증
  ├─ board 업데이트
  ├─ checkWinner → 승리 시 gameStatus = 'win'
  ├─ isBoardFull → 무승부 시 gameStatus = 'draw'
  └─ turn = 'white' → useAI 트리거
```

### 4-2. `src/hooks/useAI.js`

```js
// useGame에서 turn === 'white' && gameStatus === 'playing' 감지 시 호출
useEffect(() => {
  if (turn !== 'white' || gameStatus !== 'playing') return;
  const delay = randomDelay(AI_DELAY_MS.min, AI_DELAY_MS.max);
  const timer = setTimeout(() => {
    const { row, col } = getBestMove(board, difficulty);
    placeStoneByAI(row, col);  // useGame 내부 함수
  }, delay);
  return () => clearTimeout(timer);
}, [turn, gameStatus]);
```

### 완료 기준
- 플레이어 착수 → AI 응수가 0.3~0.8초 딜레이 후 정상 동작
- 무르기 시 플레이어·AI 각 1수씩 취소
- 금수 위치 클릭 시 착수 거부

---

## Phase 5. UI 컴포넌트

### 5-1. `App.jsx`

```jsx
<DifficultyModal />   // gameStatus === 'idle' 일 때 표시
<header />            // 타이틀, 현재 난이도
<Board />
<StatusBar />
<ResultModal />       // gameStatus === 'win' | 'draw' 일 때 표시
```

### 5-2. `Board.jsx`

- `BOARD_SIZE × BOARD_SIZE` 개의 `<Cell>` 렌더링
- CSS Grid로 격자 구성
- 격자선은 CSS `::before` / `::after` 또는 `background`로 표현

Props:
```
board, winCells, forbiddenCells, lastMove,
onCellClick(row, col), gameStatus
```

### 5-3. `Cell.jsx`

- 교차점 하나를 담당
- 상태에 따라 클래스 조합:

| 상태 | 클래스 |
|------|--------|
| 빈 칸 | `cell` |
| 흑돌 | `cell stone-black` |
| 백돌 | `cell stone-white` |
| 마지막 수 | `+ last-move` |
| 승리 돌 | `+ win-highlight` |
| 금수 (호버) | `cell forbidden` |

Props:
```
value, isLastMove, isWinCell, isForbidden, onClick
```

### 5-4. `StatusBar.jsx`

- 현재 차례 표시 (흑/백 아이콘 + 텍스트)
- AI 생각 중일 때 로딩 스피너 표시
- `[무르기]` 버튼: `history.length < 2` 이면 비활성
- `[재시작]` 버튼: 항상 활성

Props:
```
turn, isAIThinking, canUndo, onUndo, onRestart
```

### 5-5. `DifficultyModal.jsx`

- 쉬움 / 보통 / 어려움 버튼 3개
- 선택 시 `onSelect(difficulty)` 호출 후 모달 닫힘

### 5-6. `ResultModal.jsx`

- 결과 메시지: "플레이어 승리! 🎉" / "AI 승리..." / "무승부"
- `[다시 하기]` → `onRestart()`
- `[난이도 변경]` → `onChangeDifficulty()`

### 완료 기준
- 보드 클릭 → 돌 렌더링
- AI 응수 애니메이션(딜레이) 확인
- 모달 오픈/클로즈 정상 동작

---

## Phase 6. 스타일링

### `src/index.css` — CSS 변수 정의

```css
:root {
  --board-bg: #dcb468;
  --line-color: #000;
  --cell-size: 40px;
  --stone-size: 34px;
  --color-black: #1a1a1a;
  --color-white: #f5f5f5;
  --color-forbidden: #e53935;
  --color-win-highlight: #ffeb3b;
  --color-last-move: rgba(255,0,0,0.5);
}
```

### 주요 스타일 목표

| 요소 | 스타일 |
|------|--------|
| 보드 배경 | 나무결 느낌 황갈색 |
| 격자선 | 1px 검정 선 |
| 흑돌 | 방사형 그라디언트 (좌상단 하이라이트) |
| 백돌 | 방사형 그라디언트 + 테두리 |
| 승리 돌 | 노란색 반투명 오버레이 |
| 금수 표시 | 호버 시 빨간 X |
| 모달 | 중앙 고정, 반투명 배경 오버레이 |

### 반응형
- 모바일(max-width 600px): `--cell-size: 24px`로 조정
- 터치 이벤트 `touchstart` 지원 (Cell의 onClick과 병행)

---

## Phase 7. 통합 테스트 & 버그 수정

### 체크리스트

#### 게임 흐름
- [ ] 페이지 로드 → 난이도 모달 표시
- [ ] 난이도 선택 → 게임 시작, 흑 선공
- [ ] 플레이어 착수 → AI 딜레이 후 응수
- [ ] 5목 달성 → 이긴 돌 하이라이트 + 결과 모달
- [ ] 보드 가득 참 → 무승부 모달
- [ ] 무르기 → 2수 취소, 플레이어 차례로 복귀
- [ ] 재시작 → 보드 초기화

#### 금수
- [ ] 33 금수 위치 클릭 거부
- [ ] 44 금수 위치 클릭 거부
- [ ] 장목 금수 위치 클릭 거부
- [ ] 금수 위치 호버 시 빨간 X 표시

#### AI
- [ ] 쉬움: 즉시 이길 수 있는 수 차단
- [ ] 보통: 4연속 공격 수를 둠
- [ ] 어려움: 2수 앞 위협 감지

#### UI
- [ ] 모바일 화면에서 보드 정상 표시
- [ ] 터치 착수 정상 동작

---

## 구현 순서 요약 (의존 관계 기준)

```
config.js
    ↓
rules.js  ──────────────────────────────────────────┐
    ↓                                               │
ai.js                                               │
    ↓                                               ↓
useAI.js ──→ useGame.js ──→ App.jsx ──→ Board / Cell / Modal
```

> **rules.js와 ai.js는 React 없이 독립적으로 구현·검증한 후 훅에 연결한다.**
