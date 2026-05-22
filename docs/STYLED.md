# 내가그린기린기록 styled.md

이 문서는 `design/Wootegochi.html`의 시각 언어를 AI에게 전달하기 위한 스타일 지시서다. 구현 시 아래 규칙을 우선한다.

## 1. Core Direction

내가그린기린기록은 개발자의 하루 기록을 차분하게 축적하는 서비스다. 디자인은 강한 게임 UI가 아니라, 따뜻한 개인 작업실과 미니멀 개발자 대시보드 사이에 있어야 한다.

- 전체 톤은 **warm off-white**, **soft hairline**, **quiet dashboard**, **pixel pet**.
- 픽셀 기린 캐릭터는 귀엽지만 UI 자체는 과장하지 않는다.
- 장식적 브루탈리즘, 두꺼운 검정 테두리, 강한 하드 섀도우는 사용하지 않는다.
- 카드보다 여백과 얇은 구분선으로 정보 구조를 만든다.
- 데이터, 날짜, 상태값은 monospace로 다루어 개발자 도구 같은 감각을 만든다.

## 2. Design Tokens

```css
:root {
  --bg: #F7F6F2;
  --bg-2: #F0EEE7;
  --surface: #FFFFFF;
  --surface-2: #FBFAF7;

  --ink: #18181B;
  --ink-2: #3F3F46;
  --ink-3: #71717A;
  --ink-4: #A1A1AA;
  --ink-5: #D4D4D8;

  --line: rgba(24, 24, 27, 0.07);
  --line-2: rgba(24, 24, 27, 0.12);
  --line-strong: rgba(24, 24, 27, 0.18);

  --green: #2F9E6B;
  --green-soft: #E8F4ED;
  --green-ink: #1E6B47;
  --lilac: #6E63C6;
  --lilac-soft: #EFECF9;
  --amber: #B6772B;
  --amber-soft: #F6ECDB;
  --rose: #B9426B;
  --rose-soft: #F8E6EC;

  --e1: 0 1px 0 rgba(24,24,27,0.04), 0 1px 2px rgba(24,24,27,0.04);
  --e2: 0 1px 0 rgba(24,24,27,0.05), 0 4px 12px rgba(24,24,27,0.06);
  --e3: 0 2px 0 rgba(24,24,27,0.04), 0 16px 40px rgba(24,24,27,0.12);

  --radius: 10px;
  --radius-sm: 6px;
}
```

## 3. Page Foundation

```css
body {
  font-family: 'Pretendard', 'Apple SD Gothic Neo', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--ink);
  font-size: 16px;
  line-height: 1.6;
  letter-spacing: -0.005em;
  -webkit-font-smoothing: antialiased;
  background-image: radial-gradient(rgba(24,24,27,0.04) 1px, transparent 1px);
  background-size: 4px 4px;
}
```

- 기본 배경은 `#F7F6F2`이며, 4px 단위의 아주 희미한 도트 그리드를 깐다.
- 주요 화면은 좌측 사이드바와 우측 콘텐츠 영역의 데스크톱 레이아웃을 기준으로 한다.
- 모바일에서는 사이드바를 하단 탭 또는 상단 compact nav로 바꿔도 되지만, 같은 색/간격/라벨 규칙을 유지한다.
- 콘텐츠 영역은 `max-width: 1200px`, 데스크톱 padding은 대략 `32px 56px 80px`로 넉넉하게 둔다.

## 4. Typography

- 본문/제목: `Pretendard`, `Apple SD Gothic Neo`, system sans.
- 코드/날짜/상태/수치: `JetBrains Mono`, monospace.
- 페이지 제목은 `38px / 700 / letter-spacing -0.025em`.
- 큰 인사 문구나 프로필 이름은 `48px / 700 / line-height 1.1`.
- 섹션 설명은 `16px`, `var(--ink-3)`, 최대 `60ch`.
- 메타 라벨은 `10px~12px`, monospace, uppercase, `letter-spacing 0.06em~0.1em`.

## 5. Layout Pattern

### Sidebar

- 폭은 약 `240px`.
- padding은 `28px 18px 24px`.
- sticky sidebar로 화면 높이 전체를 차지한다.
- 브랜드 영역은 32px 픽셀 아바타와 monospace 14px 서비스명을 나란히 둔다.
- nav item은 border가 아니라 hover background로 상태를 표현한다.
- active nav는 `green-soft` 또는 점 패턴이 섞인 연한 초록 배경을 사용한다.

### Main

- 화면은 카드 덩어리보다 리스트, hairline, 넓은 여백으로 구성한다.
- 반복 항목은 `border-bottom: 1px solid var(--line)`로 나눈다.
- 중요한 패널만 `surface` 배경과 `box-shadow: var(--e1)`를 쓴다.

## 6. Components

### Buttons

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink-2);
  box-shadow: inset 0 0 0 1px var(--line-2);
  transition: background 0.12s, box-shadow 0.12s, transform 0.05s;
}
.btn:active { transform: translateY(1px); }
.btn.primary { background: var(--ink); color: #fff; box-shadow: var(--e1); }
.btn.accent { background: var(--green); color: #fff; box-shadow: var(--e1); }
.btn.ghost { box-shadow: none; background: transparent; color: var(--ink-3); }
```

- 기본 버튼은 흰 배경 + 얇은 inset line.
- 주요 액션은 검정 또는 green solid.
- hover는 배경을 살짝 바꾸고 line 대비만 올린다.
- 누를 때는 1px 내려가는 정도만 허용한다.

### Chips / Tags

- pill radius `999px`.
- padding `3px 9px`.
- monospace `11px`, uppercase.
- 기본 배경 `var(--bg-2)`, 텍스트 `var(--ink-2)`.
- 상태별로 `green-soft`, `lilac-soft`, `amber-soft`, `rose-soft`를 사용한다.

### Calendar

- 달력은 박스형 grid card가 아니라 투명한 grid 위에 날짜 cell만 둔다.
- 요일은 monospace 10px, `var(--ink-4)`.
- 날짜 cell은 `height: 48px`, padding `6px 8px`, radius `6px`.
- 오늘은 초록 텍스트와 4px square dot으로 표시한다.
- 선택된 날짜는 `background: var(--ink); color: #fff`.
- 범위 선택은 `green-soft`, 시작/끝은 `green`.
- 기록이 있는 날은 4px square dots를 사용한다. 색은 green, lilac, amber로 구분한다.

### Record Room / Day Memos

- 날짜별 기록룸은 채팅 앱보다 “시간순 메모 로그”처럼 보여야 한다.
- 헤더는 날짜를 monospace 24px로 크게 두고, 요일/상태는 11px uppercase로 보조한다.
- 각 메모는 `display: flex`, 왼쪽에 시간 `56px`, 오른쪽에 본문.
- 메모 사이에는 `border-bottom: 1px solid var(--line)`.
- 본문 텍스트는 15px, line-height 1.65.
- 비어 있는 상태는 중앙 정렬, padding `64px 0`, `var(--ink-4)`.

### Composer

- 입력 영역은 `surface` 패널 위에 올린다.
- wrapper: padding `18px 20px`, radius `12px`, shadow `var(--e1)`.
- textarea는 border 없이 transparent.
- placeholder는 `var(--ink-4)`.
- 입력 종류 선택 pill을 상단에 둘 수 있다.

### Reflection List

- 회고 목록은 카드가 아니라 hairline-separated list다.
- row padding은 `28px 4px`.
- hover 시 좌우 padding을 `12px`로 늘려 조용한 이동감을 준다.
- 제목은 22px / 600, 설명은 15px / `ink-2`, 메타는 monospace 12px / `ink-4`.

### Modal

- backdrop은 `rgba(24,24,27,0.35)` + `backdrop-filter: blur(4px)`.
- modal은 `surface`, radius `14px`, shadow `var(--e3)`.
- width는 `max-width: 720px`.
- header padding `22px 32px 0`, body `24px 32px 32px`, footer `18px 32px`.
- footer는 `surface-2`와 top hairline으로 분리한다.

### Character / Pet Portrait

- 캐릭터 이미지는 항상 `image-rendering: pixelated`.
- portrait 배경은 `linear-gradient(135deg, #F1ECDF 0%, #EAE3F5 100%)`.
- 위에 매우 희미한 scanline 또는 4px pixel texture를 겹친다.
- 캐릭터는 `width: 78%`, 3.6초 주기의 부드러운 bob 애니메이션.
- 그림자는 blur shadow가 아니라 pixel-step drop shadow를 사용한다.

```css
.character-portrait img {
  image-rendering: pixelated;
  animation: bob 3.6s ease-in-out infinite;
  filter:
    drop-shadow(2px 0 0 rgba(24,24,27,0.06))
    drop-shadow(0 3px 0 rgba(24,24,27,0.10))
    drop-shadow(0 6px 0 rgba(24,24,27,0.04));
}
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
```

- 레벨 배지는 검정 pill, white text, monospace 11px.
- mood tag는 흰 배경, `var(--e1)`, 10px monospace, 6px square green dot.

### Stats / Heatmap

- 숫자는 boxed card가 아니라 여백 속에 배치한다.
- stat key는 11px uppercase monospace.
- stat value는 44px monospace, weight 500.
- heatmap cell은 square, gap 3px, radius 1px.
- intensity는 `bg-2 → #D5EBDF → #9FD5B9 → green → green-ink`.

## 7. Motion

- 전환은 짧고 조용하게: `0.12s` 중심.
- 버튼 active는 `translateY(1px)`.
- 리스트 hover는 padding shift 또는 `translateY(-2px)` 정도.
- 캐릭터만 3.6초 bob으로 살아있는 느낌을 준다.
- 과한 bounce, rotate, scale-up은 피한다.

## 8. Visual Do / Don't

Do:
- warm off-white 배경과 흰 surface를 조합한다.
- 얇은 hairline과 여백으로 정보 계층을 만든다.
- 날짜/수치/상태는 monospace로 정리한다.
- 픽셀 캐릭터와 square dot marker로 서비스의 귀여움을 표현한다.
- 초록은 선택/성장/기록 완료 상태에 집중해서 쓴다.

Don't:
- 2px 이상의 검정 외곽선을 모든 요소에 두르지 않는다.
- 3px hard shadow, neon gradient, 과한 terminal frame을 남발하지 않는다.
- 카드 안에 카드를 반복 중첩하지 않는다.
- 보라/민트/검정만으로 한 화면을 과하게 채우지 않는다.
- 픽셀 아트 이미지를 blur 처리하거나 둥근 crop으로 뭉개지 않는다.

## 9. Implementation Notes for AI

프론트엔드를 생성하거나 리팩터링할 때는 이 순서로 판단한다.

1. 먼저 `--bg`, `--surface`, `--line`, `--ink-*`로 조용한 정보 구조를 만든다.
2. 주요 액션만 `--green` 또는 `--ink` solid 버튼으로 만든다.
3. 기록 목록, 회고 목록, 날짜별 로그는 card grid보다 hairline list를 우선한다.
4. 실록이 또는 기린 sprite가 나오는 영역만 픽셀 질감과 scanline을 강하게 허용한다.
5. UI 라벨, 날짜, 레벨, 상태값은 `JetBrains Mono`를 사용한다.
6. 모바일에서도 색상, radius, hairline, dot marker 규칙은 그대로 유지한다.

## 10. Screen-Specific Patterns

### 10.1 Header
- 좌측 `기 · 록` 모노스페이스 11px(green) + 본문 `내가그린기린기록` 16px bold.
- 우측 원형 32px 아바타, 흰 surface + hairline inset, 닉네임 첫 글자 monospace.

### 10.2 Home / Session
- 상단 `5월 22일 · 기록 중`을 monospace uppercase 11px + 좌측 4px square `--green` dot.
- 첫 안내 카드(어시스턴트)는 좌측에 픽셀 아바타 32px + 가벼운 surface 카드, 본문 `질문 대답해줘!` 17px bold, 메타 `2026.05.22 · session #014` monospace 10.5px uppercase.
- 사용자 말풍선은 우측 정렬 ink solid + 흰 글씨, 어시스턴트는 좌측 정렬 surface + hairline.
- 컴포저는 흰 surface, radius 999px(pill) 혹은 12px, 입력 placeholder `5월 22일의 생각을 적어보세요`, 우측 32px 검정 원형 send.

### 10.3 Pet / Growth
- 상단 둥근 말풍선 `오늘도 함께 성장해볼까요?` (자그마한 tail).
- 큰 정사각형 portrait 카드(280×280 권장) — `linear-gradient(135deg, #F1ECDF 0%, #EAE3F5 100%)` + scanline. 캐릭터는 78% bob 3.6s.
- 이름 라벨은 `PET` monospace 11px + `실록이` 22px bold.
- 레벨 뱃지 한 줄: `LV.1 — 새싹 기린 · STATUS: GOOD` (monospace 12px, ink-2). 단계명은 calf=새싹 기린, adolescent=청년 기린, adult=어른 기린.
- EXP 미터는 hairline 카드 없이 그대로 노출 가능: `EXP` label + `68 / 100`, 진행 바 6px 높이, 아래 작은 안내 `회고 3번 더 작성하면 다음 레벨로 진화해요`.
- `기록의 흐름` 헤더 + `41 ENTRIES` chip + `지난 4개월` 보조. GitHub-style 잔디는 월 라벨 `2월 3월 4월 5월`을 상단에 두고 가로 columns로 흐른다.

### 10.4 Archive / Calendar
- `아카이브 / 5월의 기록들` 헤더, 좌측 작은 픽셀 portrait + 우측 큰 제목 18px.
- 달력 셀은 GitHub 잔디 강도 5단계: `bg-2 → #D5EBDF → #9FD5B9 → green → green-ink`. 오늘은 ink solid + 흰 글씨, 미래는 dim.
- 셀 하단에 별도 dot 표시 금지(셀 자체 배경이 indicator). 오늘만 inline 4px dot 허용.
- 메인 액션 `회고 생성하기`는 ink solid 풀폭, icon-left.
- `5월의 회고 · 2 ENTRIES`처럼 섹션 제목 옆 monospace chip로 카운트.

### 10.5 회고 생성 BottomSheet
- `새 회고` 작은 monospace 라벨 + `회고 생성하기` 18px 헤더 + 안내문.
- 각 필드 라벨은 `기간` + 우측에 `REQUIRED` 작은 chip (monospace 9px green-ink).
- 선택된 pill에는 ✓ 접두, surface bg → `--green-soft` 전환.
- 기간 미리보기는 `RANGE 2026-05-20 → 2026-05-22` (monospace, green-ink, soft 배경 chip).
- 하단 sticky `생성하기` 버튼은 ink solid + 우측에 `· 3 DAYS · 우테코` 같은 summary 보조 텍스트 monospace.
