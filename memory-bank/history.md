# 개발 히스토리

---

## 2026-05-08

---

### [USER]
design_document.md 을 보고 오목 게임을 위한 스펙을 리뷰해줘

### [AI 요약]
design_document.md를 확인한 결과 게임 개요와 핵심기능 2개 항목만 작성된 최소 상태였음.
승리 조건, 금수 규칙, 보드 스펙, UI/UX 흐름, 기술 스택 5개 영역이 누락되어 있다고 지적.
스펙 보완 또는 바로 구현 시작 여부를 사용자에게 확인 요청.

---

### [USER]
스펙 문서를 보완해줘 그리고 인간대 ai 가 대결하는 게임으로 수정해줘

### [AI 요약]
design_document.md를 전면 보완. 주요 변경 및 추가 내용:
- 게임 모드를 인간 대 AI로 변경 (AI = 백, 후공)
- 게임 규칙: 15×15 보드, 정확히 5목 승리, 렌주 룰 금수(33·44·장목) 적용
- AI 난이도 3단계(쉬움/보통/어려움), 보통 이상은 미니맥스 알고리즘
- UI/UX: 난이도 선택 모달, 상태 바, 무르기/재시작, 결과 모달 정의
- 기술 스택: Vanilla JS + Canvas API, 외부 라이브러리 없음
- 파일 구조: main / board / rules / ai 4개 파일 분리안 제시

---

### [USER]
이 오목 게임을 만들기위한 기술 스택을 AGENTS.md 파일에 만들어줘. html, css, 자바스크립트를 사용하고 리액트 컴포넌트를 이용해 구동해야해. 유지보수가 가능하도록 개발 구조에 대한 규칙을 작성해줘.
내가 작성한 프롬프트를 그대로 history.md 파일에 추가하고 ai 가 답변한 내용을 요약해서 그 밑에 누적해서 표시해줘 나중에 어떻게 했는지 알 수있도록

### [AI 요약]
AGENTS.md 신규 생성. HTML5 + CSS3 + JavaScript(ES6+) + React 18 + Vite 스택으로 확정.
컴포넌트 구조(App/Board/Cell/Modal), 커스텀 훅(useGame/useAI), 순수 로직(rules/ai) 분리 구조 정의.
단일 책임 원칙, Props/State 규칙, 순수 함수 규칙, 네이밍 규칙, 스타일 규칙, AI 모듈 규칙 등 유지보수 가이드라인 작성.
history.md 신규 생성하여 프롬프트-응답 누적 기록 시작.

---

### [USER]
design-document.md 파일을 읽고 구체적인 구현 계획을 implementation-plan.md 파일에 작성해줘

### [AI 요약]
design_document.md와 AGENTS.md를 참고하여 implementation-plan.md 신규 생성.
7개 Phase로 구분한 전체 구현 계획 작성:
- Phase 1: Vite + React 18 프로젝트 초기 세팅, 디렉터리 골격 구성
- Phase 2: config.js 상수 정의 및 rules.js 순수 함수 구현 (checkWinner, isForbidden 등)
- Phase 3: ai.js 미니맥스 + 알파-베타 가지치기 구현, 난이도별 점수 테이블 정의
- Phase 4: useGame.js / useAI.js 커스텀 훅 구현, 상태 흐름 및 AI 비동기 처리
- Phase 5: Board / Cell / StatusBar / DifficultyModal / ResultModal 컴포넌트 구현
- Phase 6: CSS 변수 기반 스타일링, 반응형 모바일 대응
- Phase 7: 통합 테스트 체크리스트 (게임 흐름, 금수, AI, UI 전체 검증)
구현 순서는 config → rules → ai → hooks → components 의존 관계 순으로 정의.

---

### [USER]
memory-bank 디렉토리 내 모든 문서를 읽고, 구현 계획의 phase1 단계만 진행해줘 진행한 다음에는 progress.md 파일을 열어 향후 개발자들을 위해 수행한 작업을 문서화 해줘. 그런다음 각 파일의 역할을 설명하기 위해 architechure.md 파일에 아키텍쳐 관련 통찰력을 추가해줘

### [AI 요약]
memory-bank 전체 문서 검토 후 Phase 1 완료 (2026-05-09).
수행 작업:
- `npm create vite@latest omok -- --template react` 실행, Vite 8 + React 18 프로젝트 생성
- `npm install` 완료 (136 packages)
- 보일러플레이트 제거: `src/App.css`, `src/assets/` 삭제, `App.jsx` / `index.css` 초기화
- 4개 디렉터리 생성: `src/components/`, `src/hooks/`, `src/logic/`, `src/constants/`
- placeholder 파일 15개 생성 (각 Phase에서 구현 예정)
- `npm run build` 성공 확인 (빌드 오류 0건)
progress.md 신규 생성: Phase 1 완료 내역, Phase 2 다음 작업자 가이드, 각 Phase 미완료 현황 기록.
architecture.md 신규 생성: 4개 레이어 구조(UI/Hook/Logic/Constants), 각 파일의 역할과 설계 근거, 데이터 흐름 다이어그램, 상태 설계 근거, 향후 확장 주의사항 작성.

---

### [USER]
phase 2 진행해줘

### [AI 요약]
Phase 2 완료 (2026-05-09). 구현 내용:
- `src/constants/config.js`: BOARD_SIZE(15), WIN_COUNT(5), STONE, DIFFICULTY, AI_DEPTH, AI_DELAY_MS 상수 정의 (Object.freeze 적용)
- `src/logic/rules.js`: 순수 함수 7종 구현
  - createBoard, countDirection, countLine (내부 헬퍼)
  - checkWinner: 4방향 5목 감지, 이긴 좌표 5개 반환
  - isForbidden: 장목→44→33 순서 금수 판별 (흑 전용)
  - getForbiddenCells: 전체 금수 위치 배열 반환
  - isBoardFull: 무승부 판단
- Node.js 검증: 17개 테스트 전체 통과 (초기 hasGappedOpenThree 재귀 버그 수정 포함)
- npm run build 성공
- progress.md Phase 2 완료 내역 업데이트, Phase 3 가이드 추가

---

### [USER]
phase 3 진행해줘

### [AI 요약]
Phase 3 완료 (2026-05-09). `src/logic/ai.js` 구현:
- getCandidateCells: 기존 돌 주변 2칸 이내 빈 교차점 추출 (빈 보드 → 중앙 반환)
- scorePattern: 5목=100k, 열린4=10k, 반열린4=1k, 열린3=500, 반열린3=100, 열린2=10
- evaluateBoard: WHITE 관점 보드 평가, 방어 가중치 1.1× 적용, 중앙 근접 보너스
- getBestMoveEasy: 즉시 승리 → 즉시 차단 → 랜덤 순서
- minimax + 알파-베타: 내부 노드당 MAX_CANDIDATES_PER_NODE=10 제한으로 탐색 폭발 방지
- getBestMove: 공개 API, 난이도별 분기, board 깊은 복사 후 탐색
초기 HARD 깊이5 무제한 탐색이 30초+ 걸리는 버그 발견 → 노드당 후보 10개 제한으로 ~4초 이내로 개선.
Node.js 검증 23개 테스트 전체 통과, npm run build 성공.

---

### [USER]
phase 4 진행해줘

### [AI 요약]
Phase 4 완료 (2026-05-09). 구현 내용:
- `src/hooks/useGame.js`: 게임 전체 상태 머신. board/turn/gameStatus/winner/winCells/history/forbiddenCells/lastMove/isAIThinking 관리. placeStone(금수·턴·중복 검증), placeStoneByAI, undoMove(2수 복원), restartGame, changeDifficulty, selectDifficulty 제공. 모든 setState를 함수형 업데이트로 작성해 비동기 stale state 방지.
- `src/hooks/useAI.js`: turn==='white' 감지 → 0.3~0.8초 랜덤 딜레이 → getBestMove → placeStoneByAI. boardRef/difficultyRef로 클로저 stale 방지. cleanup clearTimeout으로 메모리 누수 방지.
- `src/App.jsx`: 두 훅 연결, 임시 인라인 UI 작성 (Phase 5에서 컴포넌트로 교체 예정).
브라우저 동작 확인: 난이도 선택, 착수, AI 응수(딜레이), 마지막 수 마킹, 무르기(2수 취소) 모두 정상. npm run build 성공.

---

### [USER]
현재까지 구현한 내용을 git 에 push 해줘 만일 저장소가 없다면 생성해줘 그리고 phase 가 변경될 때마다 commit, push, pr 을 진행해주고 이 내용을 agents.md 에 입력해줘

### [AI 요약]
GitHub 저장소 생성 및 Phase 1-4 전체 push 완료 (2026-05-09). 수행 작업:
- GitHub REST API로 `rorabeat/OMOK` 저장소 신규 생성
- 포트폴리오 레포 히스토리 오염 방지를 위해 orphan branch `omok-main` 생성
- 3개 커밋 분리: docs(기획 문서), feat(Phase 1 scaffold), chore(gitignore + README)
- `omok-main`을 default branch로 설정 (GitHub API)
- `feat/phase1-4-implementation` 피처 브랜치 생성 및 push
- AGENTS.md에 §8 Git 워크플로우 섹션 추가: 브랜치 전략, Phase 완료 시 commit→push→PR 절차, 저장소 정보
- PR #1 생성: `feat/phase1-4-implementation` → `omok-main` (https://github.com/rorabeat/OMOK/pull/1)
- `.gitignore` 화이트리스트 방식으로 수정: `omok/`, `memory-bank/` 포함, dist/node_modules 제외

---

### [USER]
빨간색 동그라미는 표시하지마

### [AI 요약]
App.jsx에서 금수 표시(빨간 원) 렌더링 블록 제거. isForbid 로직(착수 방지)은 useGame.js에서 유지 — 금수 위치에 돌을 놓을 수 없는 규칙은 그대로 적용됨.

---

### [USER]
다음 phase 진행해줘

### [AI 요약]
Phase 5 완료 (2026-05-09). UI 컴포넌트 구현:
- `Cell.jsx`: React.memo 적용. 교차점 가로/세로선(edge 클리핑), 화점, 돌(흑/백 그라디언트), 마지막 수 링, 승리 금색 강조
- `Board.jsx`: 15×15 CSS Grid, STAR_SET(Set) 화점 관리, winSet O(1) 조회
- `StatusBar.jsx`: 플레이어/AI 차례 표시, 무르기/재시작/난이도변경 버튼
- `DifficultyModal.jsx`: 오버레이 모달, 쉬움/보통/어려움 버튼 (호버 시 골드 강조)
- `ResultModal.jsx`: 승패/무승부 결과 메시지 + 다시 하기/난이도 변경
- `App.jsx`: 임시 인라인 UI 제거, 5개 컴포넌트로 교체
브라우저 동작 확인: DifficultyModal 표시, 난이도 선택 후 게임 시작, 착수/AI 응수, 마지막 수 링 모두 정상.
PR #2 생성: `feat/phase5-ui-components` → `omok-main` (https://github.com/rorabeat/OMOK/pull/2)

---

## 2026-05-09 (이어서)

---

### [USER]
agents.md 파일과 memory-bank 확인하고 구현이 완성되었는지 확인후 안되어 있으면 이어서 진행해줘

### [AI 요약]
memory-bank 및 AGENTS.md 전체 검토 후 Phase 6(스타일링), Phase 7(통합 테스트) 미완료 확인. 두 Phase 연속 완료.
Phase 6: CSS 변수 보강, 반응형 모바일 clamp, touch-action, 플레이어 이름 입력 flow, localStorage 스코어보드, `scoreboard.js` / `useScoreboard.js` 신규 추가.
Phase 7: Vitest 도입, `rules.test.js`(10) + `ai.test.js`(7) + `scoreboard.test.js`(3) = 총 20 tests passed.
PR #3 생성: `feat/phase5-ui-components` → `omok-main` (https://github.com/rorabeat/OMOK/pull/3) — Phase 6+7 전체 포함.

---

### [USER]
실행해 봤더니 게임이 완료되고 나서 txt 저장이라는 버튼이 있고 이걸 누르니 local 에 저장되는것 같다. 내 목표는 이 프로그램을 git hub web 서비스로 동작시켜서 다른 사람들도 같이 하는거지 그렇게 할려면 서버의 txt 파일에 저장이 되어야 해 그렇게 되도록 수정해줘

### [AI 요약]
localStorage 기반 스코어보드를 Firebase Firestore 실시간 공유 스코어보드로 완전 교체.
신규 파일:
- `src/logic/firebase.js`: `VITE_FIREBASE_*` 환경변수로 Firebase 앱 초기화, Firestore `db` export
- `src/logic/firestoreScoreboard.js`: `subscribeScoreboard` (onSnapshot 실시간 구독) + `recordScoreRemote` (runTransaction 동시성 안전 쓰기)
변경 파일:
- `src/hooks/useScoreboard.js`: localStorage 점수 제거 → Firestore 실시간 구독/쓰기로 교체
- `src/components/ResultModal.jsx`: TXT 저장 버튼 제거, "🌐 전체 순위 (실시간)" 추가, 현재 플레이어 금색 강조
- `src/components/ResultModal.css`: `.score-item--me`, `.score-me-badge` 추가
- `omok/.env.example`: 6개 VITE_FIREBASE_* 변수 템플릿 생성
GitHub Pages 자동 배포:
- `omok/vite.config.js`: `base: '/OMOK/'` (production)
- `.github/workflows/deploy.yml`: omok-main push 트리거 → npm ci → build (Firebase Secrets 주입) → gh-pages 배포
- `.gitignore`: `!/.github/` 예외 추가

---

### [USER]
제목은 채원채아 오목게임으로 변경해줘

### [AI 요약]
게임 타이틀 전체 "채원채아 오목게임"으로 변경:
- `omok/index.html`: `<title>채원채아 오목게임</title>`
- `src/components/DifficultyModal.jsx`: 모달 h2 타이틀 변경
- `src/App.jsx`: h1 앱 타이틀 변경
- `src/index.css`: `.app-title` 반응형 폰트 clamp 조정
- `src/components/DifficultyModal.css`: 모달 타이틀 폰트 크기 조정
PR #4 생성: 타이틀 변경 커밋 → `omok-main` (https://github.com/rorabeat/OMOK/pull/4)

---

### [USER]
현재까지 진행한 내용이 memory-bank 파일들에 반영이 안된것 같다 확인해서 모두 반영해줘

### [AI 요약]
memory-bank 3개 파일 전체 업데이트:
- `progress.md`: Phase 8 섹션 추가 (Firebase Firestore, GitHub Pages, 타이틀 변경, PR #3/#4 이력, 사용자 액션 가이드)
- `history.md`: 2026-05-09 세션 전체 이력 추가 (Phase 6+7 완료, Firebase 교체, 타이틀 변경)
- `architecture.md`: Service Layer 추가 (Hook Layer와 Logic Layer 사이), firebase.js / firestoreScoreboard.js / useScoreboard.js 설계 근거, 데이터 흐름 업데이트, 확장성 테이블 업데이트
