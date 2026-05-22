- **Base URL:** `/api/v1`
- **인증 방식:** GitHub OAuth (Bearer Token)
- **시간대 기준:** Asia/Seoul
- **프론트엔드 이미지 연동 가이드:** 백엔드는 CDN 주소 대신 펫의 현재 식별자(`stateKey`)와 상태 데이터를 반환합니다. 프론트는 이 정보를 바탕으로 로컬 스프라이트 시트의 좌표를 계산하거나 로컬 자산 경로를 동적으로 바인딩합니다.

## 1. API 명세 요약

| **대분류** | **HTTP 메서드** | **엔드포인트** | **설명** | **우선순위** |
| --- | --- | --- | --- | --- |
| **Auth** | `GET` | `/auth/github` | GitHub OAuth 인증 시작 (Redirect) | Must |
|  | `GET` | `/auth/github/callback` | GitHub OAuth 콜백 처리 & 토큰 발급 | Must |
| **User** | `GET` | `/users/me` | 현재 유저 정보 및 Pet의 **상태 식별자** 조회 | Must |
|  | `POST` | `/users/onboarding` | 온보딩 블로그/텍스트 제출 및 Persona 생성 | Must |
| **Chat** | `GET` | `/chats/active` | 현재 활성화된 일일 채팅 세션 및 이력 조회 | Must |
|  | `POST` | `/chats/message` | 유저 기록 전송 및 AI 실시간 역질문 수신 | Must |
| **Diary** | `POST` | `/diaries/rollup` | [데모용] 오전 6시 다이어리 롤업 수동 트리거 | Must |
|  | `GET` | `/diaries` | 다이어리 목록 조회 (달력 잔디 심기용) | Must |
|  | `GET` | `/diaries/{dateKey}` | 특정 날짜의 다이어리 상세 조회 | Must |
|  | `PUT` | `/diaries/{dateKey}` | 특정 날짜의 다이어리 수정 | Must |
|  | `DELETE` | `/diaries/{dateKey}` | 특정 날짜의 다이어리 삭제 | Must |
| **Review** | `POST` | `/retrospectives` | 기간/옵션 기반 완성형 회고 글 생성 | Must |
|  | `GET` | `/retrospectives` | 생성된 회고 글 아카이브 목록 조회 | Must |

## 2. 상세 API 명세 및 변경된 JSON 구조

### 2.1 인증 및 유저 (Auth & User)

### [GET] `/users/me` (현재 유저 및 Pet 조회)

- **Description:** 메인 대시보드 진입 시 호출됩니다. 프론트엔드가 로컬 스프라이트 이미지의 파일명을 매핑하거나 CSS 좌표를 잡을 수 있도록 정제된 상태 텍스트(State Metadata)를 반환합니다.
- **Query Parameters (테스트/모킹용):**
    - `level`: 기린 레벨 (`0`, `1`, `2`)
    - `condition`: 건강 상태 (`good`, `bad`, `terrible`)
- **Response (200 OK - 예시: 1레벨 adolescent / bad 상태일 때):**

JSON

```
{
  "user": {
    "id": 12,
    "githubId": "woowa_giraffe",
    "nickname": "우테코기린",
    "avatarUrl": "https://avatars.githubusercontent.com/u/123456",
    "hasPersona": true,
    "createdAt": "2026-03-10T09:00:00Z"
  },
  "pet": {
    "level": 1,
    "stage": "adolescent",
    "condition": "bad",
    "exp": 45,
    "lastActivityAt": "2026-05-21T15:30:00Z",
    "meta": {
      "stateNumber": 5,
      "stateKey": "5-adolescent-bad",
      "totalFrames": 4,
      "spriteRowIndex": 4
    }
  }
}
```

> **💡 프론트엔드 로컬 연동 가이드 (택 1)**
> 
> 
> **방법 A: 로컬 개별 이미지 파일 매핑**
> 
> 프론트엔드 `public/assets/giraffe/` 폴더에 이미지를 넣어둔 경우, API가 주는 `stateKey`를 조합해 `img` 태그의 경로를 동적으로 처리합니다.
> 
> # 
> 
> ```
> const frameUrl = `/assets/giraffe/${pet.meta.stateKey}-${currentFrame}.png`;
> // 결과: /assets/giraffe/5-adolescent-bad-1.png
> ```
> 
> **방법 B: 하나의 대형 스프라이트 시트 사용 (CSS 백그라운드 변위)**
> 
> 36개의 기린 프레임이 하나의 거대한 이미지 파일(`giraffe_sprite.png`)로 합쳐져 있는 경우, `spriteRowIndex` 정보를 받아 단 몇 줄의 CSS로 렌더링이 가능합니다.
> 
> # 
> 
> ```
> const spriteStyle = {
>   backgroundImage: "url('/assets/giraffe_sprite.png')",
>   backgroundPosition: `${-(currentFrame - 1) * FRAME_WIDTH}px ${-pet.meta.spriteRowIndex * FRAME_HEIGHT}px`
> };
> ```
> 

### [POST] `/users/onboarding` (온보딩 및 Persona 생성)

- **Description:** 기존 회고 링크나 입력 텍스트를 받아 어조를 정의한 `persona.md` 스펙을 빌드합니다. (이전과 동일)
- **Request Body:**

JSON

```
{
  "sources": ["https://velog.io/@woowa/first-retrospective"],
  "rawText": "과거에 저는 주로 에러 코드를 마주했을 때 해결 과정을 담백하게 글로 남기는 편이었습니다..."
}
```

- **Response (201 Created):**

JSON

# 

```
{
  "personaId": 45,
  "summary": "핵심만 담백하게 공유하며 피드백 수용이 빠른 주니어 개발자 페르소나",
  "markdown": "# 페르소나 정의서\n\n## 1. 문체\n- '~했습니다' 선호\n## 2. 특징\n- 트러블슈팅의 비중이 70% 이상"
}
```

### 2.2 기록룸 및 실시간 대화 (Daily Chat Session)

### [POST] `/chats/message` (기록 전송 및 역질문 생성)

- **Description:** 메시지를 전송하면 실시간 역질문과 함께 펫의 실시간 EXP 증가분을 반환합니다.
- **Request Body:**

JSON

```
{
  "sessionId": 789,
  "content": "비즈니스 로직 안에서 숫자가 6개가 안 넘을 때 예외를 터뜨려야 하는데 커스텀 익셉션을 어디서 던질지 헤맸어."
}
```

- **Response (200 OK):**

JSON

```
{
  "userMessage": { "id": 3, "role": "user", "content": "비즈니스 로직 안에서..." },
  "assistantMessage": { "id": 4, "role": "assistant", "content": "헤맨 끝에 결국 커스텀 예외를 던진 위치는 어디였나요?" },
  "petExpGained": 2,
  "currentPetExp": 47
}
```

### 2.3 다이어리 관리 (Diary)

### [POST] `/diaries/rollup` (배치 수동 트리거 API)

- **Description:** 시연 중 수동 정산을 발생시켜 펫의 레벨(`level`)이나 상태(`condition`)를 강제로 변화시키고 정산 결과를 로컬 상태 머신에 갱신합니다.
- **Response (200 OK):**

JSON

```
{
  "success": true,
  "message": "2026-05-21 데일리 마이그레이션 완료",
  "generatedDiaryId": 101,
  "petUpdate": {
    "level": 1,
    "stage": "adolescent",
    "condition": "good",
    "exp": 77,
    "meta": {
      "stateNumber": 4,
      "stateKey": "4-adolescent-good",
      "totalFrames": 4,
      "spriteRowIndex": 3
    }
  }
}
```

### [GET] `/diaries` (다이어리 목록 조회 - 잔디 시각화용)

- **Response (200 OK):**

JSON

```
{
  "diaries": [
    { "dateKey": "2026-05-19", "emotionEmoji": "🌱" },
    { "dateKey": "2026-05-20", "emotionEmoji": "🔥" },
    { "dateKey": "2026-05-21", "emotionEmoji": "🤔" }
  ]
}
```

### [GET] `/diaries/{dateKey}` (다이어리 상세 조회)

- **Response (200 OK):**

JSON

```
{
  "id": 101,
  "dateKey": "2026-05-21",
  "title": "로또 미션 예외 처리 구조 설계의 날",
  "markdown": "# 2026-05-21 다이어리\n\n### 1. 무슨 일이 있었나요?\n- 프리코스 고민 진행...",
  "emotionEmoji": "🤔",
  "tags": ["우테코", "자바", "예외처리"]
}
```

### 2.4 완성형 회고 글 생성 (Retrospective)

### [POST] `/retrospectives` (회고 글 생성)

- **Response (200 OK):**

JSON

```
{
  "retrospectiveId": 50,
  "title": "우테코 3주차 로또 미션 삽질의 기록",
  "markdown": "# 우테코 3주차 로또 미션 삽질의 기록\n\n이번 주차 로또 미션을 설계하며...",
  "tags": ["우테코", "트러블슈팅"],
  "petUpdate": {
    "level": 2,
    "stage": "adult",
    "condition": "good",
    "exp": 10,
    "meta": {
      "stateNumber": 7,
      "stateKey": "7-adult-good",
      "totalFrames": 4,
      "spriteRowIndex": 6
    }
  }
}
```

## 3. 🛠️ 백엔드 도메인 내부 매핑 로직 사전 준비 팁

백엔드 개발자(B, C)는 실제 데이터베이스에서 유저의 `level`과 `condition`을 가지고 온 뒤, 조립 연산을 거쳐 응답 객체의 `meta` 스케일을 채워주도록 아래와 같은 고정 상수를 백엔드 유틸리티 클래스나 파일에 선언해 두면 노가다가 방지됩니다.

JavaScript

```
// 백엔드 내부의 9가지 펫 상태 상태 테이블 매핑 상수 예시
const PET_META_MAP = {
  "0_good":     { stateNumber: 1, stateKey: "1-calf-good",          spriteRowIndex: 0 },
  "0_bad":      { stateNumber: 2, stateKey: "2-calf-bad",           spriteRowIndex: 1 },
  "0_terrible": { stateNumber: 3, stateKey: "3-calf-terrible",      spriteRowIndex: 2 },
  "1_good":     { stateNumber: 4, stateKey: "4-adolescent-good",    spriteRowIndex: 3 },
  "1_bad":      { stateNumber: 5, stateKey: "5-adolescent-bad",     spriteRowIndex: 4 },
  "1_terrible": { stateNumber: 6, stateKey: "6-adolescent-terrible",spriteRowIndex: 5 },
  "2_good":     { stateNumber: 7, stateKey: "7-adult-good",         spriteRowIndex: 6 },
  "2_bad":      { stateNumber: 8, stateKey: "8-adult-bad",          spriteRowIndex: 7 },
  "2_terrible": { stateNumber: 9, stateKey: "9-adult-terrible",     spriteRowIndex: 8 }
};
```