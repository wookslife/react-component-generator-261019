# src/AGENTS.md

## Module Context

Vite로 빌드되는 React 19 + TypeScript 프론트엔드. `/api/*` 호출은 `useComponentGenerator` 훅을 통해서만 하고, 서버 코드와 직접 import를 공유하지 않는다.

## Tech Stack & Constraints

- 스타일은 일반 CSS 두 파일이다. 전역 리셋과 폰트는 `index.css`, 컴포넌트 스타일은 `App.css`. CSS-in-JS나 Tailwind를 추가하지 않는다.
- 미리보기는 react-live를 쓴다 (`components/LivePreview.tsx`). 생성 코드를 `eval`이나 `dangerouslySetInnerHTML`로 직접 실행하지 않는다.

## Implementation Patterns

- 창 형태 UI는 `.window` > `.titlebar` > `.window-body` 구조를 재사용한다 (`App.tsx`, `ComponentCard.tsx`). 새 패널도 같은 구조로 만든다.
- 색상은 `App.css`의 `:root` 토큰(`--ink`, `--chrome`, `--paper`, `--amber`, `--pink` 등)만 쓴다. 하드코딩 색을 늘리지 않는다.
- 버튼은 2px 잉크 테두리와 하드 섀도(`--shadow-sm`)를 쓰고, 눌림은 `translate(2px, 2px)`로 표현한다. `prefers-reduced-motion`에서는 이동을 끈다 (`App.css` 하단 미디어쿼리).
- 폰트는 `index.css`의 `@font-face`로 필요한 파일만 선언한다 (Galmuri11, Galmuri11-Bold, GalmuriMono11). `galmuri/dist/galmuri.css`를 통째로 import하면 TTF 수 MB가 번들에 포함된다.
- 새 컴포넌트는 `components/<Name>.tsx`에 두고 테스트는 옆에 `<Name>.test.tsx`로 둔다.

## Testing Strategy

```bash
bun run test                          # 루트에서 전체 실행
bunx vitest run src/components        # 프론트엔드만
```

- 테스트 환경은 jsdom이고 `src/test/setup.ts`가 로드된다 (`vite.config.ts:17-18`).
- 쿼리는 role과 접근 가능한 이름 기준이다 (`PromptInput.test.tsx`: `getByRole('button', { name: '컴포넌트 생성' })`).

## Local Golden Rules

- 테스트가 있는 파일은 `PromptInput.tsx` 하나뿐이다. `useComponentGenerator`, `ComponentCard`, `LivePreview`, `CodeView`, `App`은 테스트가 없으므로 수정 후 `bun run dev`로 직접 확인한다.
- 버튼 문구 `컴포넌트 생성`과 `생성 중...`은 테스트가 이름으로 조회한다 (`PromptInput.test.tsx:9,18,26`). 문구를 바꾸면 테스트도 함께 바꾼다.
- `PromptInput`의 textarea는 테스트에서 `getByRole('textbox')`로 단일 조회된다 (`PromptInput.test.tsx:17`). 같은 컴포넌트 안에 input/textarea를 하나 더 추가하지 않는다.
- 훅은 항상 `provider`를 서버에 보낸다 (`hooks/useComponentGenerator.ts:26`). 서버 기본값(`anthropic`)과 UI 기본값(`google`, `App.tsx:16`)이 다르므로 provider 전달을 빼지 않는다.
- 서버가 내려준 `error` 문자열은 그대로 배너에 표시된다 (`hooks/useComponentGenerator.ts:32`, `App.tsx`의 `.error-banner`). 배너에 HTML을 렌더링하지 않는다.
- 결과 목록은 최신 항목이 맨 앞이다 (`setComponents((prev) => [newComponent, ...prev])`, `hooks/useComponentGenerator.ts:42`). 정렬 가정을 바꾸지 않는다.
