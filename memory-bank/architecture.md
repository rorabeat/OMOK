# 아키텍처 인사이트 (Architecture)

> 이 문서는 프로젝트 구조의 **왜(Why)**를 설명한다.
> 파일 목록은 `AGENTS.md`, 구현 세부사항은 `implementation-plan.md`를 참고.

---

## 1. 전체 레이어 구조

```
┌─────────────────────────────────────────────────────┐
│                   UI Layer                          │
│  App.jsx → Board / Cell / StatusBar / Modal         │
│  (React 컴포넌트, 렌더링만 담당)                      │
├─────────────────────────────────────────────────────┤
│                  Hook Layer                         │
│  useGame.js  /  useAI.js  /  useScoreboard.js       │
│  (React 상태 ↔ 순수 로직/서비스 연결 어댑터)           │
├─────────────────────────────────────────────────────┤
│                 Service Layer                       │
│  logic/firebase.js  /  logic/firestoreScoreboard.js │
│  (외부 서비스 연동, Firebase Firestore 추상화)         │
├─────────────────────────────────────────────────────┤
│                 Logic Layer                         │
│  logic/rules.js  /  logic/ai.js                     │
│  (React 미의존, 순수 함수, 테스트 가능)               │
├─────────────────────────────────────────────────────┤
│                Constants Layer                      │
│  constants/config.js                               │
│  (매직 넘버 제거, 전체 레이어에서 공유)               │
└─────────────────────────────────────────────────────┘

        ┌────────────────────────────────────┐
        │       외부 서비스 (Cloud)           │
        │  Firebase Firestore (omok_scores)  │
        └────────────────────────────────────┘
                        ▲
              Service Layer가 연결
```

**핵심 원칙**: 아래 방향으로만 의존한다. Logic이 UI를 import하는 역방향 의존은 절대 금지.

---

## 2. 각 파일의 역할과 설계 근거

### `src/main.jsx`
- React 앱의 진입점. `ReactDOM.createRoot`로 `<App>`을 DOM에 마운트.
- **건드릴 일이 거의 없다.** StrictMode를 유지해 개발 중 부수 효과를 조기에 발견.

### `src/App.jsx`
- 게임 전체 상태의 **유일한 소유자**.
- `useGame` 훅에서 상태와 액션을 꺼내 자식 컴포넌트에 props로 내려줌.
- 조건부 렌더링 허브: `gameStatus`에 따라 `DifficultyModal` / `ResultModal` 표시 여부 결정.
- **왜 여기서 상태를 관리하나?** Board, StatusBar, Modal이 모두 같은 게임 상태를 필요로 하기 때문에 Context API나 상태 라이브러리 없이 단일 공통 조상(App)에 상태를 두는 것이 가장 단순하다.

### `src/constants/config.js`
- `BOARD_SIZE = 15`, `WIN_COUNT = 5` 같은 게임 규칙 상수를 한 곳에 모음.
- **왜 별도 파일인가?** 보드 크기를 19×19로 바꾸거나 승리 조건을 6목으로 변경할 때 이 파일 하나만 수정하면 전체에 반영된다. 매직 넘버가 코드 곳곳에 흩어져 있으면 규칙 변경 시 버그가 생긴다.

### `src/logic/rules.js`
- 오목의 순수 게임 로직: 승리 판정, 금수 판별, 보드 생성.
- **React import 완전 금지.** 이 파일은 브라우저 없이도 Node.js에서 실행되어야 한다.
- **왜 순수 함수인가?** 같은 입력에 항상 같은 출력을 보장하면 디버깅이 쉽고, 단위 테스트 작성이 가능하며, React 렌더 사이클과 분리되어 예측 불가능한 사이드 이펙트가 없다.
- 금수 판별(`isForbidden`)은 흑(플레이어)에게만 적용. 백(AI)은 금수 없음.

### `src/logic/ai.js`
- 미니맥스 + 알파-베타 가지치기 기반 AI 의사결정 로직.
- `getBestMove(board, difficulty)` 하나의 공개 API만 노출. 내부 구현(탐색 깊이, 점수 테이블)은 은닉.
- **왜 순수 함수인가?** AI 연산은 무겁다. 순수 함수로 유지하면 나중에 Web Worker로 오프로딩할 때 그대로 이전 가능.
- 비동기 딜레이(0.3~0.8초)는 이 파일이 아닌 `useAI.js`에서 처리. 로직과 타이밍을 분리.

### `src/logic/firebase.js`
- Firebase 앱 초기화 모듈. `VITE_FIREBASE_*` 환경변수(Vite의 `import.meta.env`)로 Firebase config를 구성하고 Firestore 인스턴스 `db`를 export.
- **왜 별도 파일인가?** Firebase 초기화 코드가 여러 곳에 흩어지면 중복 초기화 경고가 발생한다. 단일 모듈에서 한 번만 `initializeApp`하고 `db`를 공유.
- **환경변수 방식**: 실제 키는 `.env.local`(gitignore)과 GitHub Secrets에만 존재. `import.meta.env.VITE_*`는 빌드 시 번들에 인라인됨.

### `src/logic/firestoreScoreboard.js`
- Firebase Firestore 기반 스코어보드 서비스 모듈. 두 가지 공개 함수만 노출:
  - `subscribeScoreboard(onUpdate)`: `onSnapshot`으로 `omok_scores` 컬렉션을 실시간 구독. 변경 발생 시 점수 내림차순 정렬된 배열을 콜백에 전달. unsubscribe 함수 반환.
  - `recordScoreRemote(playerName, result)`: `runTransaction`으로 동시성 안전하게 score/wins/draws/losses 누적. document ID = playerName (동일 플레이어 재방문 시 같은 문서 업데이트).
- **왜 runTransaction인가?** 여러 플레이어가 동시에 게임을 마칠 경우 단순 read-modify-write는 레이스 컨디션으로 점수가 손실될 수 있다. Firestore 트랜잭션이 원자적 업데이트를 보장.

### `src/hooks/useScoreboard.js`
- Firestore 스코어보드 서비스를 React 상태와 연결하는 어댑터 훅.
- `useEffect`에서 `subscribeScoreboard` 구독 → `topScores` 상태 업데이트 → cleanup에서 `unsubscribe()` 호출.
- `addGameResult(result)` → `recordScoreRemote` 비동기 호출 (에러는 콘솔 경고만, UX 방해 안 함).
- `playerName`은 `localStorage`에 유지 (재방문 시 이름 재입력 생략 목적).

### `src/hooks/useGame.js`
- 게임의 **전체 상태 머신**: board, turn, gameStatus, history, forbiddenCells 등.
- `placeStone`, `undoMove`, `restartGame`, `selectDifficulty` 액션을 App에 제공.
- **왜 훅으로 분리했나?** App.jsx에 상태 로직까지 넣으면 파일이 수백 줄로 불어난다. 훅으로 분리하면 App은 "무엇을 렌더링할지"에만 집중하고, 훅은 "어떻게 상태가 변하는지"를 책임진다.
- `history` 스택을 유지해 무르기(undo) 지원. 플레이어+AI 2수를 한 단위로 pop.

### `src/hooks/useAI.js`
- `turn === 'white'` 감지 → `setTimeout`으로 딜레이 → `getBestMove` 호출 → AI 착수.
- `useEffect` cleanup에서 `clearTimeout`으로 메모리 누수 방지.
- **왜 별도 훅인가?** AI 응수 타이밍 로직이 `useGame`과 섞이면 상태 업데이트 순서가 복잡해진다. 분리하면 AI 딜레이만 독립적으로 테스트·수정 가능.

### `src/components/Board.jsx`
- 15×15 = 225개의 `<Cell>`을 CSS Grid로 렌더링.
- props로 받은 데이터(board, winCells, forbiddenCells, lastMove)를 Cell에 내려줌.
- **직접 상태를 가지지 않는다.** 순수하게 데이터를 시각화하는 역할만.

### `src/components/Cell.jsx`
- 교차점 하나의 시각 표현: 빈 칸 / 흑돌 / 백돌 / 마지막 수 마킹 / 승리 하이라이트 / 금수 표시.
- `onClick`을 props로 받아 상위로 전달. 클릭 로직을 직접 처리하지 않음.
- **가장 많이 렌더링되는 컴포넌트** (225개). 불필요한 리렌더를 막기 위해 `React.memo` 적용 권장 (Phase 5에서 구현).

### `src/components/StatusBar.jsx`
- 현재 차례 표시, 무르기/재시작 버튼.
- AI 생각 중(`isAIThinking === true`)일 때 버튼 비활성 + 스피너 표시.

### `src/components/DifficultyModal.jsx`
- 게임 시작 전(`gameStatus === 'idle'`) 단 한 번 표시되는 시작 화면.
- 쉬움/보통/어려움 선택 → `onSelect(difficulty)` 콜백 → `useGame.selectDifficulty` 호출.

### `src/components/ResultModal.jsx`
- 게임 종료(`gameStatus === 'win' | 'draw'`) 시 결과 표시.
- 다시 하기 / 난이도 변경 두 가지 액션 제공.

---

## 3. 데이터 흐름

### 게임 착수 흐름
```
사용자 클릭
    │
    ▼
Cell.onClick
    │
    ▼
Board.onCellClick(row, col)
    │
    ▼
App → useGame.placeStone(row, col)
    │
    ├─ rules.isForbidden() 검증
    ├─ board 상태 업데이트
    ├─ rules.checkWinner() 검사
    └─ turn = 'white' 설정
              │
              ▼
         useAI.useEffect 트리거
              │
              ▼
         setTimeout(0.3~0.8s)
              │
              ▼
         ai.getBestMove(board, difficulty)
              │
              ▼
         useGame.placeStoneByAI(row, col)
              │
              ▼
         board 상태 업데이트 → 리렌더
```

### 스코어보드 흐름
```
게임 시작 (App 마운트)
    │
    ▼
useScoreboard → subscribeScoreboard(onUpdate)
    │                   │
    │               Firestore onSnapshot
    │                   │
    │            omok_scores 컬렉션 변경 감지
    │                   │
    └── topScores 상태 업데이트 ──→ ResultModal 리렌더

게임 종료 (win/draw)
    │
    ▼
App.useEffect → addGameResult(result)
    │
    ▼
recordScoreRemote(playerName, result)
    │
    ▼
Firestore runTransaction → 점수 원자적 업데이트
    │
    ▼
onSnapshot 트리거 → topScores 자동 갱신 → UI 반영
```

---

## 4. 상태 설계 근거

### 왜 전역 상태 라이브러리(Redux, Zustand)를 쓰지 않는가?
오목은 단일 페이지 단일 게임이다. 컴포넌트 트리가 깊지 않고, 공유 상태의 소비자가 App 직계 자녀들뿐이다. Context API나 props drilling만으로 충분하며, 외부 라이브러리를 추가하면 번들 크기와 학습 곡선만 늘어난다.

### 왜 `history`를 배열 스택으로 관리하는가?
무르기 기능은 "직전 상태로 돌아가기"이므로 스택(LIFO)이 자연스럽다. 보드 전체를 깊은 복사해 저장하는 방식은 메모리를 쓰지만, 15×15 = 225 셀 × 최대 112수 = ~25,000 정수로 매우 작아 문제없다.

---

## 5. 향후 확장 시 주의사항

| 확장 | 고려할 점 |
|------|-----------|
| 온라인 대전 추가 | `useGame`의 `placeStone`을 WebSocket 이벤트와 연결. Logic Layer는 변경 불필요. |
| AI 강화 (딥러닝) | `ai.js`의 `getBestMove` 시그니처를 유지하면 내부 구현만 교체 가능. |
| 기보 저장/복기 | `history` 배열을 Firestore에 직렬화 저장. `firestoreScoreboard.js`에 함수 추가로 구현 가능. |
| Web Worker AI | `ai.js`가 순수 함수이므로 Worker 스크립트로 그대로 이전 가능. `useAI.js`의 setTimeout만 Worker 메시지로 교체. |
| Firestore 보안 규칙 강화 | 현재 테스트 모드(전체 허용). 프로덕션 전환 시 Firebase Console에서 read/write 규칙 설정 필요. playerName 기반 document 쓰기 제한 검토. |
| 플레이어 인증 | 현재 이름만으로 식별. Firebase Auth 도입 시 `firestoreScoreboard.js`의 document ID를 UID로 변경하고, `useScoreboard.js`에 Auth 상태 연동 추가. |
