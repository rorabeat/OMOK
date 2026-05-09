# 개발 진행 현황 (Progress)

> 이 문서는 각 Phase 완료 시 업데이트된다.
> 다음 개발자가 어디서부터 이어받아야 할지 즉시 파악할 수 있도록 작성한다.

---

## 현재 상태

| 항목 | 상태 |
|------|------|
| 마지막 완료 | **Firebase 공유 스코어보드 + GitHub Pages 배포 + 타이틀 변경** |
| 다음 작업 | Firebase Secrets 등록 후 PR #4 머지 → GitHub Pages 자동 배포 |
| 빌드 상태 | ✅ 정상 (`npm run build` 통과) |
| 테스트 상태 | ✅ 20 tests passed (rules 10 + ai 7 + scoreboard 3) |
| 서비스 URL | `https://rorabeat.github.io/OMOK/` (PR #3 머지 후 배포됨) |
| 실행 방법 | `cd omok && cp .env.example .env.local` → 값 입력 → `npm install && npm run dev` |
| 단위 테스트 | `npm run test:run` (Vitest), `npm test`(watch) |
| 오픈 PR | PR #4: 타이틀 변경 (`feat/phase5-ui-components` → `omok-main`) |

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

## Phase 5 — UI 컴포넌트 ✅ (2026-05-09 완료)

### 완료된 작업

- [x] `Cell.jsx` — 교차점 컴포넌트. React.memo 적용. 가로/세로선(edge 클리핑), 화점, 돌, 마지막 수 링, 승리 강조 렌더링
- [x] `Cell.css` — CSS 변수 기반 스타일. `.stone-black`, `.stone-white`, `.last-move`, `.win-cell`
- [x] `Board.jsx` — 15×15 CSS Grid, STAR_SET으로 화점 위치 관리, winSet으로 승리 교차점 판단
- [x] `Board.css` — CSS Grid + board-bg 변수
- [x] `StatusBar.jsx` — 플레이어/AI 차례 텍스트, AI 생각 중 표시, 무르기/재시작/난이도변경 버튼
- [x] `StatusBar.css` — `.btn`, `.btn:disabled` 스타일
- [x] `DifficultyModal.jsx` — 오버레이 모달, 쉬움/보통/어려움 버튼
- [x] `DifficultyModal.css` — 다크 모달, 호버 시 골드 강조
- [x] `ResultModal.jsx` — 승패/무승부 메시지, 다시 하기/난이도 변경
- [x] `ResultModal.css` — result-modal, result-message
- [x] `App.jsx` — 임시 인라인 UI 제거, 5개 컴포넌트로 교체
- [x] `index.css` — `.app-title` 추가
- [x] `npm run build` 성공
- [x] PR #2 생성: `feat/phase5-ui-components` → `omok-main`

### 주요 결정 사항

- **Cell에 React.memo 적용**: 225개 Cell이 매 착수마다 전체 재렌더되는 것을 방지. 변경된 교차점만 리렌더.
- **STAR_SET을 Set으로 관리**: Board 렌더 시마다 배열 순회 대신 O(1) 조회
- **winCells를 Set으로 변환**: `${r}-${c}` 문자열 키로 O(1) 조회
- **금수 표시 제거**: 사용자 요청으로 빨간 원 렌더링 삭제. isForbid 로직(착수 방지)은 useGame에서 유지

---

## Phase 6 — 스타일링 ✅ (2026-05-09 완료)

### 완료된 작업

- [x] `index.css`: CSS 변수 보강(보드 테두리·격자선·패널 색 토큰), 모바일 뷰포트 연동 `--cell-size clamp`, `safe-area-inset`, `overscroll-behavior`
- [x] `Board.css`: 나무결 레이어드 배경, `aspect-ratio 1`, `touch-action: manipulation`
- [x] `Cell.css`: 격자선 CSS 변수 통일, 흑/백돌 질감 그라디언트, 금수 X 마커, 반응형 stone 크기, 키보드 포커스 링
- [x] `Cell.jsx`: `onTouchStart` 터치 착수, `onKeyDown` Enter/Space 착수, `tabIndex`/`role="button"`
- [x] `StatusBar.css`: 모바일 세로 버튼 레이아웃, `.ai-spinner` 회전 애니메이션
- [x] `DifficultyModal.css` / `ResultModal.css`: 좁은 화면 패딩·버튼 배치, 안전 영역 padding

### 추가 기능 — 플레이어 이름 & 스코어보드

- [x] 시작 모달에서 이름 입력 → 난이도 선택 flow (이름 없으면 버튼 비활성)
- [x] 게임 종료 시 점수 누적 (승리: 10점, 무승부: 1점, 패배: 0점)
- [x] `localStorage` txt 포맷 영속화
- [x] 결과 모달에 상위 5명 점수판 + TXT 저장 버튼
- [x] `scoreboard.js`, `useScoreboard.js`, `scoreboard.test.js` 추가

### 검증

- [x] `npm run test:run` 통과: 3개 파일, 20개 테스트
- [x] `npm run build` 통과
- [x] `npm run lint` 통과

---

## Phase 7 — 통합 테스트 ✅ (2026-05-09 완료)

### 완료된 작업

- [x] `vitest` 도입 (`vite.config.js` `test.globals`, `test.environment` 설정)
- [x] `rules.test.js`: 승리·금수(33/44/장목) 검증 10 케이스
- [x] `ai.test.js`: 즉시 승리·차단·보통 난이도 7 케이스
- [x] `scoreboard.test.js`: 점수 계산·직렬화 3 케이스
- [x] **총 20 tests passed** (0 failed)
- [x] 게임 흐름 수동 검증: 착수→AI 응수, 무르기, 재시작, 금수 차단, 결과 모달

### 주요 결정 사항

- **gameId로 중복 기록 방지**: `recordedGameRef.current === game.gameId` 체크로 같은 게임이 두 번 집계되지 않도록 처리

---

## Phase 8 — Firebase 공유 스코어보드 & GitHub Pages 배포 & 타이틀 변경 ✅ (2026-05-09 완료)

### 완료된 작업

#### Firebase Firestore 공유 스코어보드
- [x] `npm install firebase` — Firebase 12 SDK 설치
- [x] `src/logic/firebase.js` 신규 생성 — `VITE_FIREBASE_*` 환경변수로 앱 초기화, `db` (Firestore) export
- [x] `src/logic/firestoreScoreboard.js` 신규 생성:
  - `subscribeScoreboard(onUpdate)` — `onSnapshot`으로 `omok_scores` 컬렉션 실시간 구독; 변경 시 정렬된 배열 콜백
  - `recordScoreRemote(playerName, result)` — `runTransaction`으로 동시성 안전 점수 누적 (score/wins/draws/losses)
- [x] `src/hooks/useScoreboard.js` 전면 교체:
  - localStorage 점수 저장 완전 제거 (이름만 localStorage 유지)
  - `subscribeScoreboard` 실시간 구독으로 `topScores` 상태 유지
  - `addGameResult` → `recordScoreRemote` 비동기 호출 (에러 catch 포함)
  - `scoreboardText` / TXT 다운로드 기능 제거
- [x] `src/components/ResultModal.jsx` 업데이트:
  - TXT 저장 버튼 제거
  - "🌐 전체 순위 (실시간)" 헤더 추가
  - 현재 플레이어 행 금색 강조 (`.score-item--me`) + `(나)` 뱃지
- [x] `src/components/ResultModal.css` 업데이트:
  - `.score-item--me { border-color: #dcb468; background: #2e2a1e; }`
  - `.score-me-badge { font-size: 12px; color: #dcb468; }`
- [x] `omok/.env.example` 신규 생성 — 6개 `VITE_FIREBASE_*` 변수 템플릿

#### GitHub Pages 자동 배포
- [x] `omok/vite.config.js` 업데이트 — `base: process.env.NODE_ENV === 'production' ? '/OMOK/' : '/'`
- [x] `npm install --save-dev gh-pages` 설치
- [x] `omok/package.json` 업데이트 — `"deploy"` 스크립트, `firebase`/`gh-pages` 의존성 추가
- [x] `.github/workflows/deploy.yml` 신규 생성:
  - `omok-main` 브랜치 push 트리거
  - `omok/` 디렉터리에서 `npm ci` → `npm run build` (6개 Firebase Secret 주입)
  - `peaceiris/actions-gh-pages@v4`로 `omok/dist` 배포
- [x] `.gitignore` 수정 — `!/.github/` 및 `!/.github/**` 예외 추가 (워크플로우 파일 추적)

#### 타이틀 변경
- [x] `omok/index.html` — `<title>채원채아 오목게임</title>`
- [x] `src/components/DifficultyModal.jsx` — 모달 타이틀 "채원채아 오목게임"
- [x] `src/App.jsx` — `<h1>채원채아 오목게임</h1>`
- [x] `src/index.css` — `.app-title` 반응형 폰트 크기 조정 (`clamp(1.1rem, 4vw, 1.6rem)`)
- [x] `src/components/DifficultyModal.css` — 모달 타이틀 폰트 크기 조정

### PR 이력
- PR #3: Phase 6 스타일링 + Phase 7 테스트 + Firebase + GitHub Pages → `omok-main` (머지 완료)
- PR #4: 타이틀 변경 (`채원채아 오목게임`) → `omok-main` (머지 대기 중)

### 사용자 액션 필요
1. **Firebase 프로젝트 생성**:
   - https://console.firebase.google.com → 새 프로젝트
   - Firestore Database 활성화 (테스트 모드)
   - 웹 앱 등록 후 6개 config 값 복사
2. **GitHub Secrets 등록** (`rorabeat/OMOK` → Settings → Secrets → Actions):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. **PR #4 머지** → GitHub Actions가 자동 빌드·배포 실행

### 주요 결정 사항

- **Firestore 문서 ID = 플레이어 이름**: 동일 플레이어가 재접속 시 같은 문서에 누적. 이름 충돌 가능성은 사용 규모상 문제없음.
- **runTransaction 사용**: 여러 플레이어가 동시에 게임을 마칠 경우 점수 손실 방지
- **localStorage 이름만 유지**: 재방문 시 이름 재입력 생략 (편의성). 점수는 Firestore에서 로드.
- **onSnapshot 실시간 구독**: `useEffect` cleanup에서 `unsubscribe()` 호출로 메모리 누수 방지
- **GitHub Actions Secret 주입**: `.env.local`은 gitignore; 빌드 시 CI가 Secret으로 주입하여 클라이언트 번들에 포함
