# AGENTS.md — 오목 게임 기술 스택 & 개발 규칙

## 1. 기술 스택

| 항목 | 기술 |
|------|------|
| 마크업 | HTML5 |
| 스타일 | CSS3 (CSS Modules 또는 일반 .css 파일) |
| 언어 | JavaScript (ES6+) |
| UI 프레임워크 | React 18 (CDN 또는 Vite 번들) |
| 빌드 도구 | Vite |
| 패키지 관리 | npm |
| 외부 라이브러리 | 없음 (React, ReactDOM만 허용) |
| 배포 | 정적 빌드 → GitHub Pages |

---

## 2. 프로젝트 파일 구조

```
omok/
├── index.html              # 진입점 HTML (React 마운트 포인트)
├── package.json
├── vite.config.js
├── public/
│   └── favicon.ico
└── src/
    ├── main.jsx            # ReactDOM.render 진입점
    ├── App.jsx             # 루트 컴포넌트 (게임 상태 관리)
    ├── index.css           # 전역 스타일 (리셋, 폰트, 변수)
    ├── components/         # UI 컴포넌트
    │   ├── Board.jsx       # 오목판 렌더링
    │   ├── Cell.jsx        # 개별 교차점 (돌 + 클릭 이벤트)
    │   ├── StatusBar.jsx   # 현재 차례, 무르기, 재시작 버튼
    │   ├── DifficultyModal.jsx  # 난이도 선택 모달
    │   └── ResultModal.jsx      # 승패 결과 모달
    ├── hooks/              # 커스텀 훅
    │   ├── useGame.js      # 게임 상태 및 흐름 제어
    │   └── useAI.js        # AI 응수 로직 호출
    ├── logic/              # 순수 로직 (React 의존성 없음)
    │   ├── rules.js        # 승리 조건, 금수(33·44·장목) 판별
    │   └── ai.js           # 미니맥스 + 알파-베타 가지치기
    └── constants/
        └── config.js       # BOARD_SIZE, DIFFICULTY 등 상수
```

---

## 3. 컴포넌트 설계 규칙

### 3-1. 단일 책임 원칙
- 각 컴포넌트는 **하나의 역할**만 담당한다.
- UI 렌더링과 게임 로직을 같은 컴포넌트에 혼재하지 않는다.
  - 로직 → `hooks/` 또는 `logic/`
  - 렌더링 → `components/`

### 3-2. Props / State 규칙
- 컴포넌트는 **props로만 데이터를 받고**, 자체 상태는 최소화한다.
- 게임의 전역 상태(보드, 차례, 점수)는 `App.jsx` 또는 `useGame.js`에서 중앙 관리한다.
- 자식 컴포넌트는 상태를 직접 변경하지 않고 **콜백 함수(prop)** 를 통해 상위로 이벤트를 전달한다.

### 3-3. 커스텀 훅 규칙
- 컴포넌트에서 비즈니스 로직이 3줄 이상이면 커스텀 훅으로 분리한다.
- 훅 이름은 `use` 접두사를 반드시 붙인다.
- 훅은 React 상태(`useState`, `useEffect`)와 순수 로직(`logic/`)을 연결하는 어댑터 역할만 한다.

### 3-4. 순수 함수 규칙 (`logic/`)
- `rules.js`, `ai.js`의 모든 함수는 **순수 함수**로 작성한다 (같은 입력 → 같은 출력, 부수 효과 없음).
- React import 금지 — 이 파일들은 프레임워크에 의존하지 않아야 한다.
- 단위 테스트가 가능한 구조를 유지한다.

---

## 4. 스타일 규칙

- 전역 CSS 변수(`--color-black`, `--board-size` 등)는 `index.css`의 `:root`에 정의한다.
- 컴포넌트별 스타일은 동일 이름의 `.css` 파일로 분리한다 (`Board.jsx` → `Board.css`).
- 인라인 스타일(`style={{}}`)은 동적 값(보드 크기 계산 등)에만 허용한다.
- 클래스명은 `kebab-case`를 사용한다 (`board-cell`, `stone-black`).

---

## 5. 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `Board.jsx` |
| 훅 파일 | camelCase, use 접두사 | `useGame.js` |
| 로직 파일 | camelCase | `rules.js` |
| 상수 | UPPER_SNAKE_CASE | `BOARD_SIZE = 15` |
| 함수/변수 | camelCase | `checkWinner()` |
| CSS 클래스 | kebab-case | `.result-modal` |

---

## 6. 금지 사항

- `logic/` 파일 내 React 훅 또는 JSX 사용 금지
- 컴포넌트 내 직접 AI 연산 금지 (반드시 `useAI.js` 경유)
- `any` 타입 남발 (TypeScript 전환 시 대비하여 JSDoc으로 타입 명시 권장)
- 하드코딩된 숫자 — 보드 크기, 승리 조건 수 등은 반드시 `config.js` 상수 사용

---

## 7. AI 모듈 규칙 (`logic/ai.js`)

- AI 연산은 **메인 스레드 블로킹 방지**를 위해 `setTimeout` 또는 `Web Worker`로 비동기 처리한다.
- 난이도는 탐색 깊이(`depth`)로 제어한다.

| 난이도 | 알고리즘 | 탐색 깊이 |
|--------|----------|-----------|
| 쉬움 | 휴리스틱 랜덤 | — |
| 보통 | 미니맥스 | 3 |
| 어려움 | 미니맥스 + 알파-베타 | 5 |

---

## 8. Git 워크플로우

### 8-1. 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `omok-main` | 완성된 코드만 머지 (default branch) |
| `feat/phase{N}-{설명}` | 각 Phase 구현용 피처 브랜치 |

### 8-2. Phase 완료 시 필수 절차

Phase 구현이 완료될 때마다 아래 순서를 반드시 따른다:

1. **커밋** — 피처 브랜치에 구현 내용을 커밋한다.
   ```
   git add <변경 파일>
   git commit -m "feat(phase{N}): <설명>"
   ```

2. **푸시** — 원격 저장소에 브랜치를 푸시한다.
   ```
   git push origin feat/phase{N}-{설명}
   ```

3. **PR 생성** — `feat/phase{N}` → `omok-main` 방향으로 Pull Request를 생성한다.
   - PR 제목: `feat: Phase {N} — <설명>`
   - PR 본문: 구현 내용 요약, 테스트 체크리스트 포함

4. **progress.md 업데이트** — 해당 Phase를 완료 상태로 표시하고 다음 Phase 가이드를 작성한다.

5. **history.md 업데이트** — 사용자 프롬프트와 AI 요약을 누적 기록한다.

### 8-3. 저장소 정보

| 항목 | 값 |
|------|-----|
| GitHub URL | https://github.com/rorabeat/OMOK |
| Default branch | `omok-main` |
| 피처 브랜치 네이밍 | `feat/phase{N}-{kebab-case-설명}` |
