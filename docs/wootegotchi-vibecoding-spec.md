# 내가그린기린기록 바이브코딩용 전체 기획서 / 요구사항 명세서

> 이 문서는 프론트엔드 구현 AI에게 그대로 전달할 수 있는 프롬프트형 기획서다. 해커톤 프로토타입이지만 실제 GitHub OAuth, 실제 OpenAI, 백엔드 API 연동을 전제로 설계한다. 단, 초기 구현 단계에서는 로컬 mock API와 mock data로 동일한 화면/흐름이 동작해야 한다.

## 0. 구현 AI에게 전달할 핵심 프롬프트

너는 해커톤에서 빠르게 제품 데모를 완성하는 시니어 프론트엔드 엔지니어다. `내가그린기린기록`라는 모바일 우선 웹앱을 구현한다.

내가그린기린기록은 사용자가 하루 동안 메모하듯 남긴 기록을 AI가 실시간으로 되묻고, 매일 오전 6시에 그날의 날것 기록을 `Diary`로 정리해 달력에 저장하는 서비스다. 사용자는 쌓인 다이어리 기간을 선택해 “기술 블로그”, “감정 회고”, “우테코 회고” 같은 작성 방향을 고르고, 자신의 `페르소나.md` 말투와 기록 데이터를 기반으로 블로그에 올릴 수 있는 회고 글을 생성한다. 사용자의 꾸준한 기록은 기린 캐릭터의 레벨, 경험치, 상태, 성장 이미지로 보상된다.

반드시 다음 방향을 지켜라.

- 모바일 우선 3탭 구조: `Home`, `Pet`, `Archive`
- 하단 고정 탭바 순서는 `Home / Pet / Archive`
- Home은 하루 종일 지속되는 기록룸, 즉 채팅형 메모 화면이다.
- Home 입력창은 하나만 둔다. 사용자의 메모, AI 역질문 답변, 추가 기록을 모두 같은 입력창으로 남긴다.
- AI는 사용자의 기록을 바탕으로 실시간으로 역질문을 던진다. 질문은 “최종 회고 생성”이 아니라 “하루 기록을 깊게 만드는 보조 질문”이다.
- 매일 오전 6시에 하루 대화가 `Diary`로 정리되어 DB에 저장되는 구조를 전제로 한다. 프로토타입에서는 `mockApi.rollupDailyDiary()`와 로컬 데이터로 재현한다.
- Archive는 달력 기반으로 일일 다이어리와 생성된 회고 글을 조회/수정/삭제하는 공간이다.
- “회고 작성하기”는 Archive 또는 Home에서 진입할 수 있는 생성 플로우다. 사용자가 기간, 글 종류, 작성 방식 프롬프트를 고르면 해당 기간의 Diary와 `페르소나.md`를 바탕으로 회고 글을 생성한다.
- 생성된 회고 글은 Markdown으로 보여주고, 티스토리/벨로그/네이버블로그 등에 복사해서 붙여넣기 쉬운 형태로 제공한다.
- Pet은 기린의 레벨, 경험치, 상태, 성장 이미지를 보여준다.
- 펫 이미지는 0/1/2 레벨과 good/bad/terrible 상태 조합마다 4프레임씩 총 36장을 사용하는 구조로 설계한다.
- 초기 구현은 백엔드 요청 코드처럼 작성하되, 실제 호출부는 local mock adapter를 사용한다. 나중에 endpoint만 바꾸면 실제 API로 전환 가능해야 한다.

## 1. 서비스 개요

### 서비스명

내가그린기린기록

### 한 줄 소개

하루 동안 남긴 날것의 기록을 AI가 대화로 깊게 만들고, 나의 말투를 닮은 회고 글과 성장하는 기린 캐릭터로 돌려주는 기록형 다마고치 서비스.

### 핵심 가치

- 기록을 잘 쓰려고 애쓰지 않아도 된다. 하루 동안 메모처럼 쌓으면 된다.
- AI가 실시간 역질문으로 감정, 사실, 배운 점을 더 구체화한다.
- 매일 오전 6시에 대화가 다이어리 파일처럼 정리되어 저장된다.
- 쌓인 다이어리를 기간 단위로 가져와 블로그 회고 글을 생성한다.
- 나의 기존 블로그/회고 스타일을 `페르소나.md`로 만들어 이후 글 생성에 반영한다.
- 꾸준히 기록하면 실록이가 성장하고, 오래 기록하지 않으면 상태가 나빠진다.

## 2. 핵심 사용자 플로우

### 2.1 최초 회원가입 / 페르소나 생성

1. 사용자가 앱에 처음 진입한다.
2. 실제 GitHub OAuth 로그인 버튼을 누른다.
3. OAuth 성공 후 닉네임과 프로필 이미지가 세팅된다.
4. 사용자는 기존 블로그 링크 또는 과거 회고 링크를 최대 3개 추가한다.
5. 부가 기능으로 `텍스트로 직접 넣기` 버튼을 누르면 모달이 열리고, 회고 원문을 붙여넣을 수 있다.
6. 사용자가 `페르소나 만들기`를 누르면 백엔드가 링크/텍스트를 분석해 `페르소나.md`를 생성한다.
7. 프론트는 짧은 로딩 후 페르소나 내용을 노출하지 않고 Home으로 이동한다.

프로토타입에서는 실제 분석 API 대신 mock API가 다음 형태의 데이터를 반환한다.

```md
# 페르소나.md

## 말투
- 솔직하고 담백하게 문제 상황을 적는다.
- 기술적인 원인과 감정 변화를 같이 남긴다.

## 자주 쓰는 구조
1. 오늘 한 일
2. 막힌 지점
3. 해결 과정
4. 배운 점

## 글쓰기 특징
- 과한 미사여구보다 실제 상황과 판단을 중시한다.
- 마지막에 다음 액션을 남기는 편이다.
```

### 2.2 하루 기록룸

1. 사용자는 Home 기록룸에서 하루 동안 자유롭게 기록한다.
2. 기록은 일기, 메모, 에러 로그, 감정, 할 일, 짧은 음성 메모 느낌의 텍스트일 수 있다.
3. AI는 누적된 대화와 페르소나를 바탕으로 필요한 순간 역질문을 던진다.
4. 사용자는 같은 입력창에서 해당 질문에 답변하거나 새로운 내용의 기록을 남긴다.
5. 이 채팅은 하루 동안 지속된다.
6. 매일 오전 6시에 현재 기록룸 대화가 서버에 저장되고, 단순 정리 요약 형태의 `Diary`가 생성된다.
7. 생성된 Diary는 Archive 달력에 표시된다.
8. 오전 6시 이후 Home은 새 하루 기록룸으로 초기화된다.

중요한 해석:

- AI 질문은 “회고 글 생성”이 아니라 “더 좋은 원천 기록을 만들기 위한 실시간 인터뷰”다.
- Diary는 블로그 글이 아니다. 추후 회고 생성에 쓰기 좋은 날것의 정리 텍스트다.
- Diary는 과한 AI 문체 변환 없이, 사용자가 말한 사실/감정/답변을 보기 좋게 정리하는 수준이다.

### 2.3 다이어리 저장 / 달력 조회

1. 하루 기록룸 대화가 오전 6시에 Diary로 정리된다.
2. Diary는 날짜 기준으로 저장된다.
3. Archive 달력에서 Diary가 있는 날짜는 배경색이 채워지거나 이모지로 표시된다.
4. 사용자가 날짜를 누르면 해당 날짜의 Diary 바텀시트가 열린다.
5. 사용자는 Diary를 수정하거나 삭제할 수 있다.
6. Diary 원문은 “채팅방 전체 UI”가 아니라 추후 데이터로 활용하기 좋은 텍스트 파일 형태로 보여준다.

### 2.4 회고 작성하기

1. 사용자가 `회고 생성하기` 버튼을 누른다.
2. 기간을 선택한다. 예: `오늘`, `이번 주`, `직접 선택`
3. 어떤 글을 만들지 선택한다.
   - `기술 블로그`
   - `감정 회고`
   - `우테코 회고`
   - `자유 형식`
4. 작성 방식 예시 버튼을 선택한다.
   - `배운 점 중심`
   - `삽질과 해결 과정 중심`
   - `감정 변화 중심`
   - `다음 액션 중심`
   - `내 말투 강하게 반영`
5. 프론트는 선택한 기간의 Diary 목록과 `페르소나.md`를 가져온다.
6. OpenAI 생성 API에 넘길 prompt preview를 구성한다.
7. mock 단계에서는 `mockApi.generateRetrospective()`가 마크다운 글을 반환한다.
8. 실제 연동 단계에서는 백엔드가 OpenAI를 호출하고 생성 결과를 반환한다.
9. 생성된 회고 글은 Markdown Preview로 표시된다.
10. 사용자는 복사, Markdown 다운로드, 플랫폼별 붙여넣기 가이드를 사용할 수 있다.
11. 생성된 회고 글은 DB에 저장되고, Archive에서 건별 조회 가능해야 한다.

### 2.5 회고 글의 유동적 형식

회고 글의 형식은 고정 템플릿이 아니다. 선택한 글 종류와 사용자의 데이터에 따라 달라진다.

기술 블로그라면 다음 요소가 자연스럽게 드러나야 한다.

- 무엇을 공부했는지
- 어떤 문제/개념에서 헷갈렸는지
- 어떤 실험이나 디버깅을 했는지
- 무엇을 새로 이해했는지
- 다음에 어떻게 적용할 것인지

감정 회고라면 다음 요소가 자연스럽게 드러나야 한다.

- 그날 어떤 일을 했는지
- 어떤 감정을 느꼈는지
- 왜 그런 감정을 느꼈는지
- 관계/협업/성장 측면에서 무엇을 깨달았는지
- 다음 날의 나에게 남기고 싶은 말

우테코 회고라면 다음 요소가 자연스럽게 드러나야 한다.

- 미션/페어/리뷰/학습 과정
- 막혔던 지점과 선택한 해결 방식
- 리뷰나 토론을 통해 바뀐 생각
- 크루로서 성장한 지점

## 3. MVP 범위

### 반드시 구현

- 모바일 우선 React SPA
- 실제 API로 교체 가능한 mock API 계층
- 실제 GitHub OAuth 진입을 전제로 한 온보딩 UI
- 블로그/회고 링크 여러 개 추가 UI
- 텍스트 직접 입력 모달
- Home 기록룸
  - 단일 입력창
  - 누적 채팅 로그
  - AI 역질문
  - 하루 기록 상태
  - 오전 6시 rollup을 수동 실행할 수 있는 데모 버튼
- Archive
  - Diary 달력
  - Diary 상세/수정/삭제
  - 회고 글 목록
  - 회고 글 상세/복사/삭제
  - 회고 작성하기 플로우
- Pet
  - 레벨
  - 경험치
  - good/bad/terrible 상태
  - 0/1/2 레벨별 이미지
  - 4프레임 애니메이션
- Markdown preview
- localStorage 기반 mock DB

### 구현하지 않음

- 소셜 피드
- 인벤토리/아이템 장착
- 유료 결제
- 복잡한 알림 시스템
- 실제 블로그 자동 배포 OAuth
- 복잡한 관리자 화면

## 4. 기술 스택과 라이브러리 결정

### 기본 스택

- React + TypeScript + Vite
- CSS Modules 또는 plain CSS
- 상태: React state + custom hooks
- 서버 상태 전환 대비: API adapter 레이어
- mock DB: `localStorage`
- 날짜 유틸: `date-fns`

### 달력 라이브러리

#### 선택: `react-calendar`

선택 이유:

- MVP에 필요한 것은 월간 달력, 날짜 클릭, 날짜별 커스텀 표시다.
- `FullCalendar`는 일정/이벤트/드래그/리소스 뷰에 강하지만 이번 제품의 핵심은 일정 관리가 아니라 날짜별 기록 조회다.
- `react-calendar`는 가볍고, 날짜 타일에 Diary/Retrospective 상태를 표시하기 쉽다.

설치:

```bash
npm install react-calendar date-fns
```

사용 방향:

```tsx
<Calendar
  value={selectedDate}
  onClickDay={handleSelectDate}
  tileContent={({ date, view }) => {
    if (view !== "month") return null;
    const key = format(date, "yyyy-MM-dd");
    const diary = diariesByDate[key];
    const hasRetro = retrospectives.some((retro) => isDateInRange(key, retro.range));

    return (
      <div className="calendarMarks">
        {diary ? <span className="diaryDot" /> : null}
        {hasRetro ? <span className="retroDot" /> : null}
      </div>
    );
  }}
/>
```

### 마크다운 프리뷰

#### 선택: `react-markdown`

설치:

```bash
npm install react-markdown
```

사용 방향:

```tsx
import ReactMarkdown from "react-markdown";

<article className="markdownPreview">
  <ReactMarkdown>{markdown}</ReactMarkdown>
</article>
```

### 4프레임 캐릭터 애니메이션

#### 이미지 구조

백엔드 또는 CDN에는 다음 36개 이미지가 저장되어 있어야 한다.

```txt
level 0 / good     / frame 1~4
level 0 / bad      / frame 1~4
level 0 / terrible / frame 1~4
level 1 / good     / frame 1~4
level 1 / bad      / frame 1~4
level 1 / terrible / frame 1~4
level 2 / good     / frame 1~4
level 2 / bad      / frame 1~4
level 2 / terrible / frame 1~4
```

총 이미지 수:

```txt
3 levels * 3 statuses * 4 frames = 36 images
```

프론트 타입:

```ts
type PetLevel = 0 | 1 | 2;
type PetCondition = "good" | "bad" | "terrible";

type PetSpriteSet = Record<PetLevel, Record<PetCondition, string[]>>;
```

mock 이미지 경로 예시:

```ts
const petSpriteSet: PetSpriteSet = {
  0: {
    good: ["/assets/pet/0-good-1.png", "/assets/pet/0-good-2.png", "/assets/pet/0-good-3.png", "/assets/pet/0-good-4.png"],
    bad: ["/assets/pet/0-bad-1.png", "/assets/pet/0-bad-2.png", "/assets/pet/0-bad-3.png", "/assets/pet/0-bad-4.png"],
    terrible: ["/assets/pet/0-terrible-1.png", "/assets/pet/0-terrible-2.png", "/assets/pet/0-terrible-3.png", "/assets/pet/0-terrible-4.png"],
  },
  1: {
    good: ["/assets/pet/1-good-1.png", "/assets/pet/1-good-2.png", "/assets/pet/1-good-3.png", "/assets/pet/1-good-4.png"],
    bad: ["/assets/pet/1-bad-1.png", "/assets/pet/1-bad-2.png", "/assets/pet/1-bad-3.png", "/assets/pet/1-bad-4.png"],
    terrible: ["/assets/pet/1-terrible-1.png", "/assets/pet/1-terrible-2.png", "/assets/pet/1-terrible-3.png", "/assets/pet/1-terrible-4.png"],
  },
  2: {
    good: ["/assets/pet/2-good-1.png", "/assets/pet/2-good-2.png", "/assets/pet/2-good-3.png", "/assets/pet/2-good-4.png"],
    bad: ["/assets/pet/2-bad-1.png", "/assets/pet/2-bad-2.png", "/assets/pet/2-bad-3.png", "/assets/pet/2-bad-4.png"],
    terrible: ["/assets/pet/2-terrible-1.png", "/assets/pet/2-terrible-2.png", "/assets/pet/2-terrible-3.png", "/assets/pet/2-terrible-4.png"],
  },
};
```

애니메이션 유틸:

```ts
function useSpriteAnimation(frames: string[], intervalMs = 180) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (frames.length === 0) return;

    const timerId = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, intervalMs);

    return () => window.clearInterval(timerId);
  }, [frames, intervalMs]);

  return frames[frameIndex] ?? "";
}
```

## 5. 정보 구조

### 전체 화면

앱은 모바일 1컬럼 구조다.

공통 구조:

- Header: 상단 고정 또는 sticky
- Main: 탭별 콘텐츠
- BottomNavigation: 하단 고정

탭 순서:

- `Home`: 하루 기록룸
- `Pet`: 기린 성장 상태
- `Archive`: 다이어리/회고 아카이브

기본 진입:

- 온보딩 완료 전: 온보딩
- 온보딩 완료 후: Home

## 6. 화면 명세

### 6.1 온보딩

목적:

- 실제 서비스 회원가입처럼 보이되 해커톤에서 빠르게 구현 가능해야 한다.
- 사용자의 기존 글을 기반으로 `페르소나.md`를 만든다.

단계:

1. GitHub OAuth 로그인
   - 버튼: `GitHub로 시작하기`
   - 실제 구현 시 프론트는 `/api/auth/github/start`로 이동한다.
   - mock 구현 시 버튼 클릭 즉시 mock user를 세팅한다.
2. 닉네임 확인/수정
   - GitHub nickname이 기본값
   - 사용자가 수정 가능
3. 기존 글 링크 추가
   - 기본 입력은 링크 추가
   - 여러 개 링크를 chip/list 형태로 추가 가능
   - 버튼: `링크 추가`
   - 빈 링크, 중복 링크는 추가하지 않는다.
4. 텍스트 직접 입력
   - 버튼: `텍스트로 직접 넣기`
   - 모달 안 textarea에 과거 회고 원문 붙여넣기
   - 저장하면 source list에 `텍스트 원문 1`처럼 추가
5. 페르소나 생성
   - 버튼: `페르소나 만들기`
   - 로딩 문구: `글쓰기 습관을 읽고 있어요`
   - 버튼: `기록룸으로 가기`

### 6.2 Home 기록룸 초기 상태

참조 프레임:

- `Frame 4.png`

구성:

- Header
  - 가운데: `내가그린기린기록`
  - 우측: 설정 또는 프로필 진입 영역
- Interaction Section
  - 현재 레벨의 작은 기린 얼굴
  - 문구: `오늘 어땠어?`
- 본문
  - 오늘 날짜
  - 현재 기록 세션 상태: `해당 날짜 기록 중`
  - 대화가 없으면 빈 상태 문구: `짧게라도 남겨두면 기억해둘게.`
- 하단 단일 입력창
  - 왼쪽: 음성 녹음 버튼
  - 중앙: 텍스트 입력
  - 오른쪽: 전송 버튼
- BottomNavigation
  - Home 활성화

입력 동작:

- 사용자가 텍스트를 입력하고 전송하면 user message가 추가된다.
- mock AI는 누적 맥락을 보고 assistant question을 생성한다.
- 질문은 매 메시지마다 무조건 나오지 않아도 된다. 단, 데모에서는 입력 1~2회마다 질문이 나오게 구현한다.
- 음성 녹음 버튼은 MVP에서 아이콘만 만들고 실제로 구현하지 않는다.

### 6.3 Home 역질문 상태

참조 프레임:

- `Frame 7.png`

구성:

- Interaction Section 문구: `질문 대답해줘!`
- 본문에는 사용자 메모와 AI 질문이 말풍선으로 표시된다.
- 같은 입력창으로 답변한다.

AI 질문 원칙:

- 질문은 하나씩 짧게 던진다.
- 사용자의 감정, 사실, 판단, 배운 점 중 부족한 부분을 묻는다.
- “회고를 완성하기 위한 질문”이 아니라 “오늘의 원천 기록을 더 진하게 만드는 질문”이어야 한다.

질문 예시:

- `그때 제일 답답했던 지점은 코드였어, 아니면 방향을 못 잡는 느낌이었어?`
- `해결한 순간에 바뀐 생각이 있다면 뭐였어?`
- `내일 다시 본다면 어떤 단서를 먼저 확인하고 싶어?`
- `페어와 이야기하면서 기억에 남은 말이 있어?`

### 6.4 오전 6시 Diary rollup

실서비스 동작:

- 매일 오전 6시 서버 스케줄러가 전날 06:00부터 오늘 05:59까지의 기록룸 메시지를 묶는다.
- 묶인 메시지는 DB에 raw log로 저장된다.
- raw log와 `페르소나.md`를 참고해 `Diary`가 생성된다.
- Diary는 과도하게 창작하지 않고, 사용자의 말과 AI 질문 답변을 보기 좋게 정리한다.

프로토타입 동작:

- Home 상단 또는 개발자용 작은 버튼으로 `해당 날짜 기록 정리하기`를 제공한다.
- 버튼 클릭 시 `mockApi.rollupDailyDiary()`를 호출한다.
- 생성된 Diary가 Archive 달력에 즉시 표시된다.
- 현재 Home 채팅 세션은 비워지고 새 하루 기록이 시작된다.

Diary 포맷:

```md
# 2026-05-21 다이어리

## 오늘의 조각
- useEffect 의존성 배열 때문에 렌더링이 반복됐다.
- 처음에는 API 문제라고 생각했지만 상태 객체 참조가 계속 바뀌는 것이 원인이었다.

## 감정
- 문제를 오래 못 잡아서 답답했다.
- 해결하고 나서는 비슷한 상황을 구분할 기준이 생겼다.

## AI가 물어본 것과 답
- Q. 어떤 값이 계속 바뀌고 있었어?
- A. options 객체를 매 렌더마다 새로 만들고 있었다.

## 나중에 다시 볼 단서
- effect 의존성에 객체/함수가 들어갈 때 참조 안정성을 먼저 확인하기.
```

### 6.5 Archive 기본 상태

참조 프레임:

- `Frame 5.png`

구성:

- Header
- 제목: `다이어리`
- 월간 달력
- 하단 영역
  - `회고 작성하기` 버튼
  - 최근 Diary 또는 최근 회고 글 목록
- BottomNavigation
  - Archive 활성화

달력 표시:

- Diary가 있는 날짜: 초록 점
- 생성된 회고 글의 기간에 포함된 날짜: 작은 보조 점 또는 옅은 배경
- 오늘 날짜: 테두리
- 선택 날짜: 우테코 그린 배경

### 6.6 Archive Diary 상세 바텀시트

참조 프레임:

- `Frame 8.png`
- `Frame 10.png`

Diary가 있는 날짜:

- 상단 핸들 바
- 제목: `다이어리`
- 날짜: `5/21`
- Diary title
- Diary content markdown preview
- 하단 버튼:
  - `삭제`
  - `수정`

Diary가 없는 날짜:

- 문구: `해당 날짜의 기록이 없습니다!`
- 버튼: `기록하기`

수정 동작:

- Diary 수정은 Archive 안에서 textarea 편집 모드로 처리한다.
- 저장 시 mock API의 `updateDiary()`를 호출한다.

삭제 동작:

- 삭제 확인 모달 후 `deleteDiary()` 호출
- 달력 표시 즉시 갱신

### 6.7 회고 작성하기 플로우

진입:

- Archive의 `회고 작성하기` 버튼
- 또는 Home에서 기록이 충분히 쌓였을 때 노출되는 `쌓인 기록으로 회고 쓰기` 버튼

단계:

1. 기간 선택
   - `오늘`
   - `최근 3일`
   - `이번 주`
   - `직접 선택`
2. 글 종류 선택
   - `기술 블로그`
   - `감정 회고`
   - `우테코 회고`
   - `자유 형식`
3. 작성 방식 선택
   - `배운 점 중심`
   - `삽질과 해결 중심`
   - `감정 변화 중심`
   - `내 말투 강하게`
   - `짧고 담백하게`
4. 생성 전 확인
   - 가져올 Diary 개수
   - 기간
   - 사용할 페르소나 요약
5. 생성 로딩
   - 문구: `쌓인 기록을 회고 글로 엮고 있어요`
6. 결과
   - Markdown preview
   - 복사 버튼
   - Markdown 다운로드 버튼
   - 플랫폼별 가이드 버튼
     - `티스토리`
     - `벨로그`
     - `네이버블로그`
   - 저장 완료 상태

플랫폼별 가이드는 실제 자동 배포가 아니다.

- `티스토리`: 제목/본문 복사 안내
- `벨로그`: Markdown 그대로 붙여넣기 안내
- `네이버블로그`: Markdown을 일반 텍스트에 가깝게 변환해 복사하는 옵션 제공

### 6.8 회고 글 상세

참조 프레임:

- `Frame 9.png`

구성:

- 상단 핸들 바
- 제목: `회고`
- 기간: `5/19 ~ 5/21`
- 회고 제목
- Markdown preview
- 태그
- 글 종류
- 하단 버튼:
  - `삭제`
  - `수정`
  - `복사`

조회 위치:

- Archive 최근 회고 목록
- Calendar에서 회고 기간에 해당하는 날짜 선택 시 관련 회고 노출

### 6.9 Pet

참조 프레임:

- `Frame 6.png`

구성:

- Header
- 큰 기린 이미지
- EXP bar
- 상태 텍스트:
  - `Level | 2`
  - `Status | Good`
- BottomNavigation
  - Pet 활성화

게임 규칙:

- 기록룸에 하루 기록을 남기면 EXP가 오른다.
- 오전 6시 Diary rollup이 성공하면 추가 EXP가 오른다.
- 회고 글을 생성하면 큰 EXP가 오른다.
- 레벨은 0, 1, 2까지 MVP에서 표현한다.
- 레벨이 오르면 더 성장한 기린 이미지 세트를 사용한다.
- 마지막 기록이 오래되면 상태가 bad 또는 terrible로 나빠진다.

상태 산정:

```ts
function getPetCondition(lastActivityAt: string | null, now: Date): PetCondition {
  if (!lastActivityAt) return "terrible";

  const diffDays = differenceInCalendarDays(now, new Date(lastActivityAt));

  if (diffDays <= 1) return "good";
  if (diffDays <= 3) return "bad";
  return "terrible";
}
```

## 7. 데이터 모델

```ts
type AppTab = "home" | "pet" | "archive";

type UserProfile = {
  id: string;
  githubId: string;
  nickname: string;
  avatarUrl: string;
  onboarded: boolean;
  createdAt: string;
};

type PersonaSource =
  | {
      id: string;
      type: "link";
      url: string;
      createdAt: string;
    }
  | {
      id: string;
      type: "text";
      title: string;
      content: string;
      createdAt: string;
    };

type Persona = {
  id: string;
  userId: string;
  markdown: string; // persona.md
  summary: string;
  sources: PersonaSource[];
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  source: "typed" | "voice" | "mock";
};

type DailyChatSession = {
  id: string;
  userId: string;
  dateKey: string; // yyyy-MM-dd, 06:00 기준 서비스 날짜
  messages: ChatMessage[];
  status: "active" | "rolled_up";
  startedAt: string;
  closedAt: string | null;
};

type Diary = {
  id: string;
  userId: string;
  dateKey: string;
  title: string;
  rawText: string;
  markdown: string;
  emotionEmoji: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type RetrospectiveType = "tech_blog" | "emotion" | "woowacourse" | "freeform";

type RetrospectivePromptOption =
  | "learning_focused"
  | "debugging_focused"
  | "emotion_focused"
  | "persona_strong"
  | "short_plain";

type Retrospective = {
  id: string;
  userId: string;
  title: string;
  markdown: string;
  summary: string[];
  tags: string[];
  type: RetrospectiveType;
  promptOptions: RetrospectivePromptOption[];
  range: {
    startDate: string;
    endDate: string;
  };
  sourceDiaryIds: string[];
  createdAt: string;
  updatedAt: string;
};

type PetLevel = 0 | 1 | 2;
type PetCondition = "good" | "bad" | "terrible";

type PetState = {
  userId: string;
  level: PetLevel;
  exp: number; // 0~100
  condition: PetCondition;
  lastActivityAt: string | null;
  updatedAt: string;
};

type AppState = {
  activeTab: AppTab;
  user: UserProfile | null;
  persona: Persona | null;
  activeSession: DailyChatSession | null;
  diaries: Diary[];
  retrospectives: Retrospective[];
  pet: PetState | null;
};
```

localStorage key:

```ts
const STORAGE_KEY = "my-girin-log-mock-db-v2";
```

## 8. API / Mock Adapter 설계

프론트 코드는 실제 백엔드에 요청하는 형태로 작성한다. 단, MVP에서는 `mockApi` 구현체가 localStorage를 읽고 쓴다.

```txt
src/
  api/
    client.ts
    mockApi.ts
    realApi.ts
    types.ts
```

환경 전환:

```ts
const api = import.meta.env.VITE_USE_MOCK_API === "true" ? mockApi : realApi;
```

### 필요한 API 계약

```ts
type Api = {
  startGithubLogin(): Promise<void>;
  getCurrentUser(): Promise<UserProfile | null>;
  completeOnboarding(input: CompleteOnboardingInput): Promise<{ user: UserProfile; persona: Persona; pet: PetState }>;
  getActiveSession(): Promise<DailyChatSession>;
  sendChatMessage(input: SendChatMessageInput): Promise<{ session: DailyChatSession; assistantMessage?: ChatMessage; pet: PetState }>;
  rollupDailyDiary(input: RollupDailyDiaryInput): Promise<{ diary: Diary; session: DailyChatSession; pet: PetState }>;
  listDiaries(): Promise<Diary[]>;
  updateDiary(input: UpdateDiaryInput): Promise<Diary>;
  deleteDiary(id: string): Promise<void>;
  generateRetrospective(input: GenerateRetrospectiveInput): Promise<Retrospective>;
  listRetrospectives(): Promise<Retrospective[]>;
  updateRetrospective(input: UpdateRetrospectiveInput): Promise<Retrospective>;
  deleteRetrospective(id: string): Promise<void>;
  getPetState(): Promise<PetState>;
};
```

### OpenAI 연동 전제

프론트는 OpenAI를 직접 호출하지 않는다.

- 프론트 → 백엔드: 사용자 입력, 기간, 선택 옵션 요청
- 백엔드 → OpenAI: 페르소나/Diary/prompt로 생성
- 백엔드 → 프론트: 생성된 Diary 또는 Retrospective 반환

프론트에서 필요한 것은 request/response 스키마와 로딩/에러/결과 UI다.

### GitHub OAuth 전제

프론트 역할:

- `GitHub로 시작하기` 클릭 시 `/api/auth/github/start`로 이동
- OAuth callback 이후 `/api/me` 또는 `getCurrentUser()`로 로그인 상태 확인

mock 동작:

- 클릭 즉시 mock user를 생성한다.
- 실제 OAuth 화면은 뜨지 않는다.

## 9. Mock AI 규칙

### 9.1 역질문 생성

```ts
function createMockFollowUpQuestion(messages: ChatMessage[], persona: Persona | null): string | null {
  const lastUserText = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";

  if (lastUserText.includes("에러") || lastUserText.includes("버그")) {
    return "그 에러를 처음 봤을 때 원인이라고 의심한 건 뭐였어?";
  }

  if (lastUserText.includes("페어") || lastUserText.includes("리뷰")) {
    return "그 대화에서 네 생각이 바뀐 지점이 있었어?";
  }

  if (lastUserText.includes("힘들") || lastUserText.includes("답답")) {
    return "그 감정은 문제 자체 때문이었어, 아니면 해결 방향이 안 보여서였어?";
  }

  return "나중에 다시 봤을 때 꼭 기억하고 싶은 단서가 있다면 뭐야?";
}
```

질문 빈도:

- 데모에서는 사용자 메시지 1개당 질문 1개를 생성해도 된다.
- 실제 서비스에서는 최근 질문 수, 사용자의 피로도, 메시지 길이에 따라 질문 빈도를 조절한다.

### 9.2 Diary 생성

Diary는 창작하지 않고 정리한다.

```ts
function createMockDiary(session: DailyChatSession): Diary {
  const userMessages = session.messages.filter((message) => message.role === "user");
  const assistantMessages = session.messages.filter((message) => message.role === "assistant");

  return {
    id: crypto.randomUUID(),
    userId: session.userId,
    dateKey: session.dateKey,
    title: `${formatDiaryDate(session.dateKey)} 기록`,
    rawText: userMessages.map((message) => `- ${message.content}`).join("\n"),
    markdown: buildDiaryMarkdown(userMessages, assistantMessages),
    emotionEmoji: inferEmotion(userMessages.map((message) => message.content).join(" ")),
    tags: inferTags(userMessages.map((message) => message.content).join(" ")),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
```

### 9.3 Retrospective 생성

Retrospective는 블로그 글에 가까운 결과물이다.

```ts
function createMockRetrospective(input: GenerateRetrospectiveInput): Retrospective {
  const diariesText = input.diaries.map((diary) => diary.markdown).join("\n\n---\n\n");

  return {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: pickRetroTitle(input.type, diariesText),
    markdown: buildRetrospectiveMarkdown({
      type: input.type,
      promptOptions: input.promptOptions,
      persona: input.persona,
      diariesText,
    }),
    summary: buildRetroSummary(diariesText),
    tags: inferTags(diariesText),
    type: input.type,
    promptOptions: input.promptOptions,
    range: input.range,
    sourceDiaryIds: input.diaries.map((diary) => diary.id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
```

## 10. 디자인 시스템

### 전체 톤

- 모바일 앱 느낌
- 복잡한 대시보드가 아니라 기록 앱에 가까운 단순함
- 연한 회색 바탕 + 흰 콘텐츠 영역 + 우테코 그린 포인트
- 기린은 픽셀 아트 또는 누끼 이미지로 귀엽고 명확하게
- 텍스트 크기는 와이어프레임보다 줄여 실제 모바일에서 깨지지 않게 한다.

### 색상

```css
:root {
  --color-background: #f7f7f4;
  --color-surface: #ffffff;
  --color-header: #d9d9d9;
  --color-bottom-nav: #d9d9d9;
  --color-sheet: #bfbfbf;
  --color-primary: #3d9c48;
  --color-primary-soft: #e7f4e9;
  --color-text: #111111;
  --color-muted: #6f6f6f;
  --color-border: #d7d7d7;
  --color-danger: #d94b4b;
  --color-progress-track: #d9d9d9;
  --color-progress-fill: #3d9c48;
}
```

### 타이포그래피

- 기본 폰트: `Pretendard`, system-ui fallback
- Header title: 24px, weight 700
- Section title: 22px, weight 700
- Body: 15px~16px
- Caption: 12px~13px
- Bottom nav: 18px
- 버튼 내부 텍스트는 한 줄에서 잘리지 않게 max-width와 font-size를 조정한다.

### 레이아웃 기준

- 기준 디자인 크기: 393px x 852px
- Header height: 64px
- Bottom nav height: 72px
- Main min-height: `calc(100dvh - 136px)`
- Safe area 대응:

```css
padding-bottom: calc(72px + env(safe-area-inset-bottom));
```

## 11. 컴포넌트 설계

```txt
src/
  App.tsx
  main.tsx
  api/
    client.ts
    mockApi.ts
    realApi.ts
    types.ts
  styles/
    tokens.css
    global.css
  components/
    AppHeader.tsx
    BottomNav.tsx
    BottomSheet.tsx
    Modal.tsx
    MarkdownPreview.tsx
    GiraffeSprite.tsx
  features/
    onboarding/
      OnboardingFlow.tsx
      SourceLinkInput.tsx
      TextSourceModal.tsx
      PersonaPreview.tsx
    home/
      HomePage.tsx
      InteractionSection.tsx
      ChatLog.tsx
      ChatComposer.tsx
      RollupDiaryButton.tsx
    archive/
      ArchivePage.tsx
      DiaryCalendar.tsx
      DiaryDetailSheet.tsx
      RetrospectiveDetailSheet.tsx
      RetrospectiveWizard.tsx
      PlatformCopyActions.tsx
    pet/
      PetPage.tsx
      PetStatusPanel.tsx
  lib/
    storage.ts
    date.ts
    sprite.ts
    markdown.ts
    copy.ts
```

핵심 책임:

- `api/client.ts`: mock/real API 선택
- `mockApi.ts`: localStorage 기반 mock DB와 mock AI
- `realApi.ts`: fetch 기반 실제 API 호출 함수
- `OnboardingFlow`: GitHub OAuth, source 입력, persona 생성
- `HomePage`: 하루 기록룸
- `ChatComposer`: 단일 입력창
- `RollupDiaryButton`: 오전 6시 자동 처리의 데모 수동 트리거
- `ArchivePage`: 달력, Diary, 회고 글, 회고 작성하기
- `RetrospectiveWizard`: 기간/글 종류/작성 방식 선택 후 회고 생성
- `PetPage`: 기린 상태 표시
- `GiraffeSprite`: 36개 이미지 중 현재 level/status 4프레임 애니메이션
- `MarkdownPreview`: `react-markdown` wrapper

## 12. 상태별 문구

Home 초기:

- `오늘 어땠어?`
- `짧게 남겨도 괜찮아. 하루가 쌓이면 기록이 돼.`

AI 질문 중:

- `질문 대답해줘!`
- `조금만 더 물어봐도 될까?`

Diary 정리 중:

- `해당 날짜 기록을 다이어리로 정리하고 있어`
- `말한 그대로의 결을 살려 정리하는 중이야.`

Diary 완료:

- `해당 날짜의 기록을 저장했어!`
- `Archive에서 다시 볼 수 있어.`

회고 생성 중:

- `쌓인 기록을 회고 글로 엮고 있어`
- `페르소나와 다이어리를 같이 읽는 중이야.`

Archive 빈 날짜:

- `해당 날짜의 기록이 없습니다!`
- 버튼: `기록하기`

Pet 상태:

- `Good`
- `Bad`
- `Terrible`

## 13. 수용 기준

아래 기준을 만족해야 MVP 완료로 본다.

- 사용자가 GitHub 로그인 플로우를 통해 온보딩을 시작할 수 있다.
- 온보딩에서 여러 링크를 추가할 수 있다.
- 텍스트 직접 입력은 모달로 가능하다.
- 페르소나 생성 후 미리보기 없이 Home으로 이동한다.
- 하단 탭 순서는 `Home / Pet / Archive`다.
- Home에서 하나의 입력창으로 하루 기록을 계속 남길 수 있다.
- AI 역질문이 누적 대화에 따라 추가된다.
- 수동 `해당 날짜 기록 정리하기`로 오전 6시 rollup을 데모할 수 있다.
- rollup 결과 Diary가 Archive 달력에 표시된다.
- Archive 날짜 클릭 시 Diary 상세 바텀시트가 열린다.
- Diary는 수정/삭제할 수 있다.
- `회고 작성하기`에서 기간, 글 종류, 작성 방식을 선택할 수 있다.
- 생성된 회고 글은 Markdown으로 렌더링된다.
- 생성된 회고 글은 복사/Markdown 다운로드가 가능하다.
- 생성된 회고 글은 건별로 저장되어 Archive에서 다시 조회된다.
- Pet은 level, exp, condition을 보여준다.
- Pet 이미지는 level/status 조합의 4프레임 애니메이션으로 동작한다.
- mock API를 제거하고 real API로 바꿔도 화면 컴포넌트 수정이 최소화되도록 API adapter 경계를 지킨다.
- 모바일 390px 너비에서 텍스트/버튼/캐릭터가 겹치지 않는다.

## 14. 구현 시 주의

- Home은 회고 생성 화면이 아니라 하루 기록룸이다.
- Diary와 Retrospective를 혼동하지 않는다.
- Diary는 raw log를 보기 좋게 정리한 자료이고, Retrospective는 블로그에 올릴 수 있는 완성 글이다.
- MVP에서 블라인드 광장, 인벤토리, 소셜 피드는 넣지 않는다.
- 입력창은 Home에 하나만 둔다.
- API는 처음부터 mock/real adapter 구조로 작성한다.
- 프론트에서 OpenAI API key를 직접 들고 있지 않는다.
- GitHub OAuth도 프론트 단독 처리로 가정하지 않는다. 백엔드 OAuth endpoint로 이동하는 구조다.
- Calendar는 직접 구현하지 말고 `react-calendar`를 감싸서 사용한다.
- 마크다운은 `react-markdown`으로 렌더링한다.
- 캐릭터 애니메이션은 4프레임 `setInterval` 유틸로 구현하고 cleanup을 반드시 넣는다.
- 디자인은 레퍼런스 프레임의 IA를 따르되, 실제 구현에서는 폰트 크기와 여백을 줄여 깨지지 않게 한다.

## 15. 참고 라이브러리 조사 근거

- `react-calendar`: 월간 달력 구현용. npm 패키지 문서 기준 설치 명령은 `npm install react-calendar`이고, `Calendar` 컴포넌트의 `onChange`, `value`, 날짜 타일 커스터마이징을 활용하면 MVP 달력에 충분하다.  
  참고: https://www.npmjs.com/package/react-calendar
- `FullCalendar`: 공식 React 컴포넌트가 있고 `@fullcalendar/react`, `@fullcalendar/core`, `@fullcalendar/daygrid` 조합으로 설치하지만, 일정/이벤트 중심의 캘린더 기능이 강해 이번 MVP에는 과하다.  
  참고: https://fullcalendar.io/docs/react
- `react-markdown`: 마크다운 렌더링용. npm 패키지 기준 `npm install react-markdown`이며, AI가 생성한 회고 본문을 React 컴포넌트로 안전하게 렌더링하는 목적에 맞다.  
  참고: https://www.npmjs.com/package/react-markdown

## 16. 확정된 제품 정책

아래 항목은 MVP 기준 확정 정책으로 본다.

- 오전 6시 기준은 `Asia/Seoul`로 고정한다.
- Diary raw log와 markdown content는 DB string으로 저장하고, 다운로드 시 `.md` 파일로 내보낸다.
- 블로그 배포는 MVP에서 자동 업로드가 아니라 복사/다운로드로 제한한다.
- Pet 레벨은 MVP에서 0/1/2까지만 표현하고, 이후 확장 가능하게 타입을 분리한다.
