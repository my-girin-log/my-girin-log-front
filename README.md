# 내가그린기린기록 Frontend

개발자의 하루 기록을 실록이와 함께 모으고, 날짜별 다이어리와 회고로 정리하는 React/Vite 프로토타입입니다.

서비스는 현재 데모와 백엔드 연동을 함께 고려해 만들어져 있습니다. 기본 실행은 브라우저 localStorage 기반 `mockApi`를 사용하고, 환경변수로 실제 백엔드 API 어댑터를 켤 수 있습니다.

## 주요 기능

- 온보딩: GitHub 시작 흐름과 페르소나 생성 mock 처리
- Home: 날짜별 기록룸, 대화형 기록 누적, 날짜별 다이어리 rollup
- Pet: 실록이 스프라이트 애니메이션, EXP, 최근 18주 기록 잔디
- Archive: 날짜별 다이어리 달력, 상세 바텀시트, 수정/삭제
- Retrospective: 기간/유형/옵션 선택 후 회고 생성 및 목록 조회
- API 모드: `mockApi`와 실제 `/api/v1` 백엔드 어댑터 전환

## 기술 스택

- React 19
- TypeScript
- Vite
- Vitest
- react-calendar
- react-markdown
- date-fns

## 시작하기

```bash
npm install
npm run dev
```

기본 개발 서버는 `http://127.0.0.1:5173`에서 실행됩니다. 포트가 사용 중이면 Vite가 다음 포트를 사용합니다.

## 환경변수

`.env.example`을 참고해 필요하면 `.env.local`을 만듭니다.

```bash
cp .env.example .env.local
```

기본값은 mock API입니다.

```env
VITE_USE_REAL_API=false
```

실제 백엔드를 사용할 때:

```env
VITE_USE_REAL_API=true
VITE_BACKEND_URL=http://localhost:8080
```

`VITE_USE_REAL_API=true`일 때 Vite dev server가 `/api` 요청을 `VITE_BACKEND_URL`로 프록시합니다. 프론트의 API base path는 기본적으로 `/api/v1`입니다.

## 스크립트

```bash
npm run dev       # 로컬 개발 서버 실행
npm run build     # TypeScript/Vite production build
npm run preview   # production build preview
npm run test      # Vitest 테스트 실행
```

## 프로젝트 구조

```text
src/
  api/              # mockApi, realApi, API client, adapter tests
  components/       # 공용 UI 컴포넌트
  screens/          # Onboarding, Home, Pet, Archive 화면
  giraffe_sprites/  # 실록이 상태별 스프라이트
  hooks/            # sprite frame animation hook
  utils/            # date/async utilities
  App.tsx           # 탭 라우팅과 전역 상태
  styles.css        # 앱 전체 스타일

docs/
  API.md            # 백엔드 API 명세
  STYLED.md         # 디자인 시스템 지시서
```

## Mock 데이터

mock 모드는 브라우저 `localStorage`에 상태를 저장합니다. 데모 중 새로고침해도 온보딩, 기록, 다이어리, 회고 상태가 유지됩니다.

상태를 초기화하려면 브라우저 개발자 도구에서 localStorage를 비우거나, 사이트 데이터를 삭제하면 됩니다.

## 실제 API 연동 메모

프론트는 `src/api/index.ts`에서 API 모드를 고릅니다.

- `VITE_USE_REAL_API=false`: `mockApi`
- `VITE_USE_REAL_API=true`: `realApi`

`realApi`는 백엔드 응답 형태 차이를 화면 컴포넌트로 흘리지 않도록 adapter 경계에서 정규화합니다. 예를 들어 `/chats/active`가 flat session 또는 `{ session, messages }` envelope로 와도 `DailyChatSession`으로 맞춰 반환합니다.

## 배포

Vercel 배포를 기준으로 구성되어 있습니다.

현재 production URL:

```text
https://tecoton.vercel.app/
```

조직 GitHub App 권한이 연결되어 있으면 `main` push 후 자동 배포할 수 있고, 연결이 막혀 있으면 Vercel CLI로 수동 production deploy를 실행합니다.

```bash
vercel deploy . --prod -y
```

## 디자인 기준

디자인은 `docs/STYLED.md`를 기준으로 합니다.

- warm off-white 배경
- soft hairline 중심 UI
- 조용한 대시보드 톤
- JetBrains Mono 기반 날짜/상태/수치 표현
- pixelated 실록이 스프라이트
- GitHub 잔디형 활동 히트맵

## 검증

변경 후 최소한 아래 명령을 실행합니다.

```bash
npm run test
npm run build
```

UI 변경은 모바일 폭에서 주요 플로우를 확인합니다.

- 온보딩 완료
- 날짜별 Home 기록
- 다이어리 rollup
- Archive 달력/바텀시트
- Pet 실록이/잔디 표시
- 회고 생성 흐름
