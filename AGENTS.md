# AGENTS.md

## Operational Commands

패키지 매니저와 서버 런타임은 bun 고정이다. npm/yarn/pnpm으로 설치하지 않는다 (`bun.lock`이 기준 lockfile).

```bash
bun install          # 의존성 설치
bun run dev          # API 서버(3002) + Vite(5173) 동시 실행
bun run test         # vitest run (src/**, server/** 테스트)
bun run lint         # eslint .
bun run build        # tsc -b && vite build
```

- 테스트는 반드시 `bun run test`로 실행한다. `bun test`는 Bun 내장 러너를 호출해 jsdom/setup 설정(`vite.config.ts:16-20`)이 적용되지 않는다.
- 변경 후 `bun run test`, `bun run lint`, `bun run build`를 통과시킨 뒤 끝낸다.

## Golden Rules

### Immutable

- API 키 값을 클라이언트 응답으로 내보내지 않는다. `/api/config`는 키 보유 여부(boolean)만 반환한다 (`server/index.ts:147-156`). 키를 로그, 에러 메시지, 응답 본문에 넣지 않는다.
- Gemini 호출 URL에는 키가 쿼리스트링으로 들어간다 (`server/index.ts:99`). 이 URL을 로그에 찍거나 에러 메시지에 포함하지 않는다.
- `.env`는 커밋하지 않는다 (`.gitignore:32`).

### 서버와 프론트엔드에 걸친 규칙

- 생성된 컴포넌트 코드는 react-live `noInline` 모드로 실행된다 (`src/components/LivePreview.tsx:14`). 따라서 `render(<Component />)` 호출이 필수이고 `import`는 쓸 수 없다. 이 제약을 바꾸면 시스템 프롬프트(`server/index.ts:7-49`), 서버 정규화(`server/generator.ts`), 미리보기 세 곳을 함께 수정한다.
- 포트 3002를 한쪽만 바꾸지 않는다. `server/index.ts:139`와 `vite.config.ts:11`(프록시 target)이 같은 값을 따로 들고 있다.

## Project Context

프롬프트를 입력하면 AI가 React 컴포넌트를 생성하고 미리보기와 코드로 보여주는 도구.

Stack: React 19, TypeScript, Vite, Bun(API 프록시), react-live, vitest, Galmuri(픽셀 폰트).

## Context Map

- **[프론트엔드 UI/스타일/컴포넌트 수정](./src/AGENTS.md)** — `src/` 아래 React 컴포넌트, CSS, 폰트, 훅 작업 시.
- **[API 서버/프로바이더 연동 수정](./server/AGENTS.md)** — `server/` 아래 Bun 서버, 프롬프트, 모델 폴백 작업 시.

## Standards & References

- 설치, 실행 방법, 기능 목록은 [README.md](./README.md)를 따른다.
- 커밋 메시지는 한국어 `feat|fix|refactor|chore: 요약`. 절차는 `.claude/skills/commit/SKILL.md`를 따른다.
- Maintenance Policy: 이 파일의 규칙과 코드가 어긋나는 것을 발견하면 작업을 멈추고 AGENTS.md 업데이트를 제안한다.
