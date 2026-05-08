# 개발 진행 현황 (Progress)

> 이 문서는 각 Phase 완료 시 업데이트된다.
> 다음 개발자가 어디서부터 이어받아야 할지 즉시 파악할 수 있도록 작성한다.

---

## 현재 상태

| 항목 | 상태 |
|------|------|
| 마지막 완료 Phase | **Phase 4** |
| 다음 작업 | **Phase 5** — UI 컴포넌트 구현 (Board / Cell / StatusBar / DifficultyModal / ResultModal) |
| 빌드 상태 | ✅ 정상 (`npm run build` 통과) |
| 실행 방법 | `cd omok && npm install && npm run dev` |

---

## Phase 1 — 프로젝트 초기 세팅 ✅ (2026-05-09 완료)

### 완료된 작업

- [x] `npm create vite@latest omok -- --template react` 로 Vite 8 + React 18 프로젝트 생성
- [x] `npm install` 완료 (136 packages, 0 vulnerabilities)
- [x] 보일러플레이트 제거: `src/App.css`, `src/assets/` 삭제
- [x] `src/App.jsx` — 빈 앱 골격으로 교체
- [x] `src/index.css` — 전역 CSS 변수 및 리셋 스타일로 교체
- [x] `index.html` — 타이틀 "OMOK"으로 변경
- [x] 디렉터리 4개 생성: `src/components/`, `src/hooks/`, `src/logic/`, `src/constants/`
- [x] Placeholder 파일 생성 (총 15개):
  - `src/constants/config.js`
  - `src/logic/rules.js`, `src/logic/ai.js`
  - `src/hooks/useGame.js`, `src/hooks/useAI.js`
  - `src/components/Board.jsx/.css`
  - `src/components/Cell.jsx/.css`
  - `src/components/StatusBar.jsx/.css`
  - `src/components/DifficultyModal.jsx/.css`
  - `src/components/ResultModal.jsx/.css`
- [x] `npm run build` 성공 확인

### 주요 결정 사항

- **Vite 8 사용**: `create vite@latest` 실행 시 Vite 8.0.11이 설치됨. React 18과 완전 호환.
- **CSS Modules 미사용**: 컴포넌트별 `.css` 파일로 분리하되, 일반 import 방식 채택 (단순성 우선).
- **index.css에 CSS 변수 집중**: 모든 디자인 토큰(색상, 사이즈)을 `:root`에 정의해 이후 Phase에서 일관성 유지.
- **보일러플레이트 assets 제거**: `src/assets/` 폴더 전체 삭제. 필요 시 `public/`을 사용.

---

## Phase 2 — 상수 & 게임 규칙 로직 ✅ (2026-05-09 완료)

### 완료된 작업

- [x] `src/constants/config.js` — BOARD_SIZE, WIN_COUNT, STONE, DIFFICULTY, AI_DEPTH, AI_DELAY_MS 상수 정의 (Object.freeze 적용)
- [x] `src/logic/rules.js` — 아래 함수 구현 완료:
  - `createBoard()` — 15×15 EMPTY 배열
  - `countDirection()` / `countLine()` — 방향별 연속 수 카운트
  - `checkWinner(board, row, col, stone)` — 가로/세로/대각선/역대각선 5목 감지, 이긴 좌표 5개 반환
  - `isForbidden(board, row, col)` — 장목→44→33 순서로 금수 판별 (흑에만 적용)
  - `getForbiddenCells(board)` — 전체 금수 좌표 배열 반환
  - `isBoardFull(board)` — 무승부 판단
- [x] Node.js 검증: **17개 테스트 모두 통과** (0 실패)
- [x] `npm run build` 성공

### 주요 결정 사항

- **isForbidden은 board를 직접 변경 후 복원** (가상 착수 패턴): 호출 전 board[row][col]이 EMPTY여야 함
- **hasGappedOpenThree 비재귀 구현**: 초기 재귀 구현이 false positive 생성 → k 방향 순회로 교체
- **장목 우선 판별**: 장목이면 44/33 검사 없이 즉시 금수 반환 (렌주 공식 룰)

---

## Phase 3 — AI 로직 ✅ (2026-05-09 완료)

### 완료된 작업

- [x] `src/logic/ai.js` — 아래 함수 구현 완료:
  - `getCandidateCells(board)` — 기존 돌 주변 2칸 이내 빈 교차점 추출
  - `scorePattern(count, openEnds)` — 패턴 점수 테이블 (5목=100k, 열린4=10k, …)
  - `evaluateBoard(board)` — WHITE 관점 보드 평가, 방어 가중치 1.1× 적용
  - `getBestMoveEasy(board)` — 즉시 승리→즉시 차단→랜덤
  - `getSortedCandidates(board, isMaximizing)` — 휴리스틱 정렬 후 상위 10개 슬라이싱
  - `minimax(...)` — 미니맥스 + 알파-베타 가지치기
  - `getBestMove(board, difficulty)` — 공개 API, board 깊은 복사 후 탐색
- [x] Node.js 검증: **23개 테스트 모두 통과**
- [x] `npm run build` 성공

### 주요 결정 사항

- **탐색 폭발 방지**: `minimax` 내부에서 `MAX_CANDIDATES_PER_NODE = 10`으로 후보 제한. 초기 구현(제한 없음)은 HARD 깊이 5에서 30초+ 소요 → 수정 후 ~4초 이내
- **루트 노드는 제한 없음**: `getBestMoveByMinimax`의 루트 탐색은 전체 후보 대상으로 1수 앞 점수 정렬 후 알파-베타 진입
- **방어 가중치 1.1×**: 플레이어 위협을 AI 공격보다 미세하게 높게 평가해 방어 실패를 방지
- **즉시 승리 조기 종료**: 루트에서 100,000점 이상 수를 찾으면 탐색 즉시 중단

---

## Phase 4 — 게임 상태 훅 ✅ (2026-05-09 완료)

### 완료된 작업

- [x] `src/hooks/useGame.js` — 게임 전체 상태 머신 구현
  - 상태: board, turn, gameStatus, winner, winCells, history, difficulty, forbiddenCells, lastMove, isAIThinking
  - `selectDifficulty(level)` — 난이도 설정 후 게임 시작
  - `placeStone(row, col)` — 플레이어 착수, 금수/턴/중복 검증 포함
  - `placeStoneByAI(row, col)` — AI 착수 (useAI에서 호출)
  - `undoMove()` — history 스택에서 1엔트리(플레이어+AI 2수) 복원
  - `restartGame()` — 난이도 유지하며 보드 초기화
  - `changeDifficulty()` — idle 상태로 복귀
- [x] `src/hooks/useAI.js` — turn === 'white' 감지 → 0.3~0.8초 딜레이 → getBestMove → placeStoneByAI
  - boardRef / difficultyRef로 클로저 stale 방지
  - useEffect cleanup에서 clearTimeout으로 메모리 누수 방지
- [x] `src/App.jsx` — 두 훅 연결, 임시 인라인 UI로 동작 검증
- [x] 브라우저 동작 확인:
  - 난이도 선택 → 보드 렌더링 ✅
  - 플레이어 착수 → AI 딜레이 후 응수 ✅
  - 마지막 수 빨간 링 표시 ✅
  - 무르기 → 2수 취소, 빈 보드 복원, 버튼 비활성화 ✅
- [x] `npm run build` 성공

### 주요 결정 사항

- **applyMove 공통 함수**: 플레이어/AI 착수 로직이 동일하므로 내부 헬퍼로 통합. `isAI` 플래그로 history 스냅샷 여부만 분기
- **함수형 setState 사용**: 모든 상태 업데이트에서 `setState(prev => ...)` 패턴 유지 — AI 비동기 콜백에서 stale state 참조 방지
- **history 단위**: 플레이어 수 직전 보드를 스냅샷으로 저장. 무르기 시 플레이어+AI 2수를 한 번에 복원
- **canUndo 조건**: `history.length > 0 && gameStatus === 'playing' && turn === 'black'` — AI 생각 중에는 무르기 비활성

---

## Phase 5 — UI 컴포넌트 ⏳ 미완료

### 다음 작업자가 할 일

1. `Board.jsx` — 15×15 CSS Grid, `<Cell>` 225개 렌더링
2. `Cell.jsx` — 교차점 한 칸. stone/lastMove/winCell/forbidden 상태별 클래스 분기. `React.memo` 적용
3. `StatusBar.jsx` — 차례 표시, AI 스피너, 무르기/재시작 버튼
4. `DifficultyModal.jsx` — 쉬움/보통/어려움 선택 모달
5. `ResultModal.jsx` — 승패/무승부 결과 모달, 다시 하기 / 난이도 변경
6. `App.jsx` — 임시 인라인 UI를 위 컴포넌트로 교체

> 세부 설계는 `implementation-plan.md` Phase 5 섹션 참고

---

## Phase 6 — 스타일링 ⏳ 미완료

> Phase 5 완료 후 진행. `implementation-plan.md` Phase 6 섹션 참고.

---

## Phase 7 — 통합 테스트 ⏳ 미완료

> Phase 6 완료 후 진행. `implementation-plan.md` Phase 7 체크리스트 활용.
