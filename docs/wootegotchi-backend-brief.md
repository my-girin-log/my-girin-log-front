# 내가그린기린기록 백엔드 공유용 핵심 기획 브리프

> 이 문서는 백엔드 담당자가 내가그린기린기록의 제품 의도, 핵심 플로우, 저장해야 할 데이터, AI 처리 책임을 빠르게 이해하기 위한 요약 문서다. 프론트 구현 방식이나 컴포넌트 코드는 제외한다.

## 1. 서비스 한 줄 설명

내가그린기린기록은 사용자가 하루 동안 남긴 메모형 기록을 AI가 실시간으로 되묻고, 매일 오전 6시에 다이어리로 정리한 뒤, 원하는 기간의 다이어리를 모아 사용자의 말투를 닮은 회고 글로 생성해주는 기록형 다마고치 서비스다.

기록을 꾸준히 남기면 기린 캐릭터가 성장한다. 오래 기록하지 않으면 기린 상태가 나빠진다.

## 2. 핵심 개념

### Persona

사용자의 기존 블로그 링크나 과거 회고 원문을 분석해서 만든 `페르소나.md`다.

페르소나는 이후 AI 질문, 다이어리 정리, 회고 글 생성에 사용된다.

포함해야 할 내용:

- 사용자의 말투
- 자주 쓰는 글 구조
- 기술/감정/학습 기록의 비중
- 글에서 중요하게 여기는 포인트
- 회고 글 생성 시 지켜야 할 작성 특징

### Daily Chat Session

사용자가 하루 동안 Home 기록룸에 남기는 채팅형 기록이다.

일반적인 채팅방을 영구 UI로 보존하는 목적이 아니라, 추후 다이어리와 회고 생성에 쓸 수 있는 원천 데이터다.

### Diary

매일 오전 6시에 하루 기록을 정리한 결과물이다.

Diary는 블로그 글이 아니다. AI가 과하게 꾸미지 않고, 사용자가 남긴 사실, 감정, AI 질문에 대한 답변을 보기 좋게 정리한 markdown string이다.

### Retrospective

사용자가 기간과 글 종류를 선택해 생성하는 완성형 회고 글이다.

Diary와 Persona를 바탕으로 만들며, 기술 블로그, 감정 회고, 우테코 회고, 자유 형식 등으로 달라질 수 있다.

### Pet

사용자의 기록 습관을 보여주는 게임 요소다.

MVP에서는 레벨 0/1/2만 표현한다. 상태는 `good`, `bad`, `terrible` 세 가지다.

## 3. 전체 사용자 플로우

### 3.1 회원가입과 페르소나 생성

1. 사용자가 GitHub OAuth로 로그인한다.
2. GitHub 프로필 기반으로 사용자 계정을 만든다.
3. 사용자가 기존 블로그/회고 링크를 여러 개 추가한다.
4. 필요하면 과거 회고 원문을 텍스트로 직접 입력한다.
5. 백엔드는 링크와 텍스트를 분석해 `페르소나.md`를 생성한다.
6. 생성된 Persona는 사용자 계정에 저장된다.

### 3.2 하루 기록룸

1. 사용자는 하루 동안 기록룸에 자유롭게 메모를 남긴다.
2. 내용은 일기, 에러 로그, 감정, 배운 점, 페어와 나눈 이야기 등 어떤 형태든 가능하다.
3. 사용자가 메시지를 남기면 백엔드는 현재 대화 맥락과 Persona를 기반으로 AI 역질문을 생성할 수 있다.
4. AI 질문은 사용자의 기록을 깊게 만들기 위한 질문이다.
5. 사용자는 같은 기록룸에 계속 답변하거나 새 기록을 남긴다.

### 3.3 오전 6시 다이어리 정리

1. 매일 오전 6시 `Asia/Seoul` 기준으로 전날 기록 세션을 닫는다.
2. 해당 날짜의 raw chat log를 DB에 저장한다.
3. raw log와 Persona를 기반으로 Diary markdown을 생성한다.
4. 생성된 Diary는 날짜 기준으로 조회 가능해야 한다.
5. 오전 6시 이후에는 새 Daily Chat Session이 시작된다.

MVP에서는 수동 트리거 API를 함께 제공하면 데모가 쉽다.

### 3.4 Diary 조회/수정/삭제

1. 사용자는 달력에서 날짜별 Diary를 조회한다.
2. Diary는 markdown string으로 저장한다.
3. 사용자는 Diary를 수정하거나 삭제할 수 있다.
4. 다운로드 요청 시 `.md` 파일로 내보낼 수 있어야 한다.

### 3.5 회고 글 생성

1. 사용자가 `회고 작성하기`를 누른다.
2. 기간을 선택한다.
3. 글 종류를 선택한다.
   - 기술 블로그
   - 감정 회고
   - 우테코 회고
   - 자유 형식
4. 작성 방향을 선택한다.
   - 배운 점 중심
   - 삽질과 해결 과정 중심
   - 감정 변화 중심
   - 내 말투 강하게 반영
   - 짧고 담백하게
5. 백엔드는 해당 기간의 Diary 목록과 Persona를 가져온다.
6. OpenAI를 호출해 회고 markdown을 생성한다.
7. 생성된 Retrospective를 DB에 저장한다.
8. 사용자는 생성된 글을 다시 조회하고, 복사하거나 `.md`로 다운로드할 수 있다.

자동 블로그 업로드는 MVP 범위가 아니다. 티스토리, 벨로그, 네이버블로그에는 사용자가 복사/붙여넣기 또는 다운로드 파일로 옮긴다.

## 4. AI 처리 책임

### Persona 생성

입력:

- 사용자 블로그/회고 링크 목록
- 사용자가 직접 입력한 과거 회고 원문

출력:

- `persona.md` markdown string
- 짧은 summary
- 사용한 source 목록

### 실시간 역질문 생성

입력:

- 현재 Daily Chat Session 메시지
- 최근 사용자 메시지
- Persona

출력:

- 짧은 질문 1개

질문 원칙:

- 한 번에 하나만 묻는다.
- 기록을 더 깊게 만드는 질문이어야 한다.
- 부족한 사실, 감정, 판단, 배운 점을 보완한다.
- 최종 회고 글처럼 정리하려고 하지 않는다.

예시:

- “그때 제일 답답했던 지점은 코드였어, 방향을 못 잡는 느낌이었어?”
- “해결한 순간에 바뀐 생각이 있다면 뭐였어?”
- “내일 다시 본다면 어떤 단서를 먼저 확인하고 싶어?”

### Diary 생성

입력:

- 하루치 raw chat log
- Persona

출력:

- Diary title
- rawText
- markdown
- emotionEmoji
- tags

Diary는 사용자가 남긴 내용을 보존하는 정리본이어야 한다. 과장된 창작, 블로그식 문체 변환, 지나친 미화는 피한다.

### Retrospective 생성

입력:

- 기간 내 Diary 목록
- Persona
- 글 종류
- 작성 방향 옵션

출력:

- title
- markdown
- summary
- tags
- sourceDiaryIds

글 형식은 고정 템플릿이 아니다. 사용자의 기록 내용과 선택 옵션에 따라 유동적으로 구성한다.

## 5. 주요 데이터

### User

- id
- githubId
- nickname
- avatarUrl
- createdAt

### Persona

- id
- userId
- markdown
- summary
- sources
- createdAt
- updatedAt

### DailyChatSession

- id
- userId
- dateKey
- messages
- status: `active` 또는 `rolled_up`
- startedAt
- closedAt

`dateKey`는 `Asia/Seoul` 오전 6시 기준 서비스 날짜다.

### ChatMessage

- id
- role: `user` 또는 `assistant`
- content
- createdAt
- source: `typed`, `voice`, `mock`

### Diary

- id
- userId
- dateKey
- title
- rawText
- markdown
- emotionEmoji
- tags
- createdAt
- updatedAt

Diary raw log와 markdown content는 DB string으로 저장한다. 다운로드할 때만 `.md` 파일로 내보낸다.

### Retrospective

- id
- userId
- title
- markdown
- summary
- tags
- type: `tech_blog`, `emotion`, `woowacourse`, `freeform`
- promptOptions
- range: startDate, endDate
- sourceDiaryIds
- createdAt
- updatedAt

### PetState

- userId
- level: MVP에서는 0, 1, 2
- exp
- condition: `good`, `bad`, `terrible`
- lastActivityAt
- updatedAt

## 6. Pet 정책

### 성장

- 사용자가 기록룸에 기록을 남기면 EXP가 오른다.
- 오전 6시 Diary 생성이 성공하면 EXP가 오른다.
- 회고 글 생성이 성공하면 EXP가 더 크게 오른다.
- MVP에서 레벨은 0, 1, 2까지만 표현한다.
- 이후 확장을 위해 DB와 API는 level number를 더 받을 수 있게 열어둔다.

### 상태

- 최근 활동이 충분하면 `good`
- 며칠간 기록이 없으면 `bad`
- 더 오래 기록이 없으면 `terrible`

MVP 기준 예시:

- 최근 1일 이내 활동: `good`
- 2~3일 미활동: `bad`
- 4일 이상 미활동: `terrible`

### 이미지

이미지는 누끼 PNG를 사용한다.

MVP에서 필요한 이미지 수:

- level 0 / good / 4 frames
- level 0 / bad / 4 frames
- level 0 / terrible / 4 frames
- level 1 / good / 4 frames
- level 1 / bad / 4 frames
- level 1 / terrible / 4 frames
- level 2 / good / 4 frames
- level 2 / bad / 4 frames
- level 2 / terrible / 4 frames

총 36개 이미지가 필요하다.

백엔드는 현재 사용자의 `level`, `condition`, 그리고 해당 이미지 URL 4개를 내려주면 된다.

## 7. API 관점 요구사항

프론트는 초기에 mock data로 개발하지만, 실제 API를 쉽게 붙일 수 있어야 한다.

백엔드가 제공해야 할 기능 단위:

- GitHub OAuth 시작/콜백 처리
- 현재 로그인 사용자 조회
- 온보딩 완료와 Persona 생성
- 현재 active Daily Chat Session 조회
- 기록룸 메시지 전송과 AI 역질문 생성
- 오전 6시 Diary rollup
- Diary 목록/상세/수정/삭제
- 기간 기반 Retrospective 생성
- Retrospective 목록/상세/수정/삭제
- Pet 상태 조회

## 8. 확정 정책

- 오전 6시 기준은 `Asia/Seoul`이다.
- Diary raw log는 DB string으로 저장하고, 다운로드 시 `.md`로 내보낸다.
- 블로그 배포는 MVP에서 자동 업로드가 아니라 복사/다운로드로 제한한다.
- Pet 레벨은 MVP에서 0/1/2까지만 표현하고, 이후 확장 가능하게 타입을 분리한다.
- 프론트에서 OpenAI API key를 직접 보유하지 않는다. OpenAI 호출은 백엔드 책임이다.
- GitHub OAuth도 백엔드가 처리하고, 프론트는 OAuth 시작 URL로 이동한다.

## 9. 백엔드 담당자가 특히 헷갈리면 안 되는 점

- Diary와 Retrospective는 다르다.
- Diary는 하루 기록 정리본이고, Retrospective는 블로그에 올릴 수 있는 완성 글이다.
- 기록룸 채팅은 영구 채팅 서비스가 아니라 Diary와 Retrospective 생성을 위한 원천 데이터다.
- AI 역질문은 회고 글을 바로 만들기 위한 절차가 아니라, 하루 기록의 밀도를 높이기 위한 보조 기능이다.
- MVP에서 블로그 자동 업로드는 하지 않는다.
- MVP에서 Pet 이미지는 총 36개를 기준으로 한다.
