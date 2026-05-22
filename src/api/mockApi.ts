import { format, isAfter, isBefore, parseISO, subDays } from "date-fns";
import type {
  ChatMessage,
  DailyChatSession,
  Diary,
  DiarySummary,
  OnboardingRequest,
  Persona,
  PetCondition,
  PetLevel,
  PetMeta,
  PetStage,
  PetState,
  Retrospective,
  RetrospectiveRequest,
  RetrospectiveResponse,
  RollupResponse,
  SendMessageRequest,
  SendMessageResponse,
  User,
  UsersMeResponse,
} from "../types";

const STORAGE_KEY = "my-girin-log.mockDb.v2";
const LEGACY_STORAGE_KEYS = ["wootegotchi.mockDb.v1"];
const API_BASE_URL = "/api/v1";

type MockDb = {
  token: string | null;
  user: User;
  persona: Persona | null;
  pet: PetState;
  chatSessionsByDate: Record<string, DailyChatSession>;
  diaries: Diary[];
  retrospectives: Retrospective[];
  nextId: number;
};

const PET_META_MAP: Record<`${PetLevel}_${PetCondition}`, Omit<PetMeta, "totalFrames">> = {
  "0_good": { stateNumber: 1, stateKey: "1-calf-good", spriteRowIndex: 0 },
  "0_bad": { stateNumber: 2, stateKey: "2-calf-bad", spriteRowIndex: 1 },
  "0_terrible": { stateNumber: 3, stateKey: "3-calf-terrible", spriteRowIndex: 2 },
  "1_good": { stateNumber: 4, stateKey: "4-adolescent-good", spriteRowIndex: 3 },
  "1_bad": { stateNumber: 5, stateKey: "5-adolescent-bad", spriteRowIndex: 4 },
  "1_terrible": { stateNumber: 6, stateKey: "6-adolescent-terrible", spriteRowIndex: 5 },
  "2_good": { stateNumber: 7, stateKey: "7-adult-good", spriteRowIndex: 6 },
  "2_bad": { stateNumber: 8, stateKey: "8-adult-bad", spriteRowIndex: 7 },
  "2_terrible": { stateNumber: 9, stateKey: "9-adult-terrible", spriteRowIndex: 8 },
};

function todayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

function formatDateKey(dateKey: string) {
  return format(parseISO(dateKey), "M월 d일");
}

function stageForLevel(level: PetLevel): PetStage {
  if (level === 0) return "calf";
  if (level === 1) return "adolescent";
  return "adult";
}

function buildPet(level: PetLevel, condition: PetCondition, exp: number): PetState {
  const meta = PET_META_MAP[`${level}_${condition}`];
  return {
    level,
    stage: stageForLevel(level),
    condition,
    exp,
    lastActivityAt: new Date().toISOString(),
    meta: {
      ...meta,
      totalFrames: 4,
    },
  };
}

function createMessage(role: ChatMessage["role"], content: string, id: number): ChatMessage {
  return {
    id,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function createInitialSession(dateKey: string, id: number, messageId: number): DailyChatSession {
  return {
    id,
    dateKey,
    messages: [
      createMessage(
        "assistant",
        `${formatDateKey(dateKey)} 기록룸이 열렸어. 실록이가 오늘의 조각을 잘 모아둘게.`,
        messageId,
      ),
    ],
    status: "active",
    startedAt: new Date().toISOString(),
  };
}

function seedDb(): MockDb {
  const dateA = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const dateB = format(subDays(new Date(), 2), "yyyy-MM-dd");

  return {
    token: null,
    user: {
      id: 12,
      githubId: "woowa_giraffe",
      nickname: "우테코기린",
      avatarUrl: "https://avatars.githubusercontent.com/u/123456",
      hasPersona: false,
      createdAt: "2026-03-10T09:00:00Z",
    },
    persona: null,
    pet: buildPet(1, "good", 64),
    chatSessionsByDate: {
      [todayKey()]: createInitialSession(todayKey(), 789, 1),
    },
    diaries: [
      {
        id: 101,
        dateKey: dateA,
        title: "리액트 렌더링 최적화를 붙잡은 날",
        markdown:
          `# ${dateA} 다이어리\n\n### 1. 무슨 일이 있었나요?\n- 리액트 성능 최적화 강의를 들으며 useCallback과 useMemo의 차이를 정리했다.\n- 렌더링이 반복되는 원인을 상태 참조 관점에서 다시 봤다.\n\n### 2. 감정\n- 처음에는 개념이 흐릿해서 답답했지만, 예제를 따라가며 기준이 생겼다.\n\n### 3. 나중에 다시 볼 단서\n- 최적화는 습관처럼 쓰기보다 병목을 확인한 뒤 적용하기.`,
        emotionEmoji: "🌱",
        tags: ["React", "성능", "회고"],
      },
      {
        id: 102,
        dateKey: dateB,
        title: "객체지향 설계와 테스트 코드",
        markdown:
          `# ${dateB} 다이어리\n\n### 1. 무슨 일이 있었나요?\n- 로또 미션에서 예외를 어디서 던질지 오래 고민했다.\n- 객체 책임을 나누는 기준을 테스트 코드로 검증해봤다.\n\n### 2. 감정\n- 막막했지만 페어와 이야기하면서 판단 기준이 조금 선명해졌다.`,
        emotionEmoji: "🔥",
        tags: ["우테코", "Java", "테스트"],
      },
    ],
    retrospectives: [
      {
        retrospectiveId: 50,
        title: "객체지향 설계와 테스트 코드",
        markdown:
          "# 객체지향 설계와 테스트 코드\n\n이번 주에는 로또 미션을 진행하면서 책임을 어디에 둘지 많이 고민했다. 처음에는 예외 처리 위치가 단순한 코드 스타일 문제라고 생각했지만, 테스트를 작성하다 보니 객체가 어떤 결정을 가져야 하는지의 문제에 가까웠다.\n\n## 배운 점\n- 예외는 입력 검증과 도메인 규칙을 구분해서 바라봐야 한다.\n- 테스트는 구현 확인보다 설계의 압박을 드러내는 도구가 될 수 있다.\n\n## 다음 액션\n다음 미션에서는 먼저 책임 후보를 적고, 테스트로 어색한 의존성을 확인해볼 것이다.",
        tags: ["우테코", "트러블슈팅"],
        type: "woowacourse",
        range: {
          startDate: dateB,
          endDate: dateA,
        },
        createdAt: new Date().toISOString(),
      },
    ],
    nextId: 200,
  };
}

function normalizeDb(input: (Partial<MockDb> & { activeSession?: DailyChatSession }) | null): MockDb {
  const seeded = seedDb();
  if (!input) return seeded;

  const chatSessionsByDate =
    input.chatSessionsByDate ??
    (input.activeSession
      ? { [input.activeSession.dateKey]: input.activeSession }
      : seeded.chatSessionsByDate);

  return {
    token: input.token ?? seeded.token,
    user: input.user ?? seeded.user,
    persona: input.persona ?? seeded.persona,
    pet: input.pet ?? seeded.pet,
    chatSessionsByDate,
    diaries: input.diaries ?? seeded.diaries,
    retrospectives: input.retrospectives ?? seeded.retrospectives,
    nextId: input.nextId ?? seeded.nextId,
  };
}

function readDb(): MockDb {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const legacyRaw = LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    const db = normalizeDb(legacyRaw ? (JSON.parse(legacyRaw) as Partial<MockDb>) : null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return db;
  }
  const db = normalizeDb(JSON.parse(raw) as Partial<MockDb>);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
}

function writeDb(db: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function nextId(db: MockDb) {
  db.nextId += 1;
  return db.nextId;
}

function getOrCreateSession(db: MockDb, dateKey: string): DailyChatSession {
  const existing = db.chatSessionsByDate[dateKey];
  if (existing) return existing;
  const session = createInitialSession(dateKey, nextId(db), nextId(db));
  db.chatSessionsByDate[dateKey] = session;
  return session;
}

function normalizePetAfterExp(exp: number): PetState {
  const level: PetLevel = exp >= 100 ? 2 : exp >= 55 ? 1 : 0;
  const carriedExp = level === 2 ? exp % 100 : exp;
  return buildPet(level, "good", Math.min(100, carriedExp));
}

function pickQuestion(content: string, count: number) {
  if (/감정|답답|힘들|불안|뿌듯/.test(content)) {
    return "그 감정이 가장 크게 올라온 순간은 언제였나요?";
  }
  if (/에러|예외|버그|렌더|테스트/.test(content)) {
    return "헤맨 끝에 결국 원인이라고 판단한 단서는 무엇이었나요?";
  }
  if (count % 2 === 0) {
    return "내일 다시 본다면 어떤 단서를 먼저 확인하고 싶어요?";
  }
  return "그 경험에서 다음 미션에 가져가고 싶은 기준이 있다면 뭐예요?";
}

function inRange(dateKey: string, startDate: string, endDate: string) {
  const date = parseISO(dateKey);
  return (
    (isAfter(date, parseISO(startDate)) || dateKey === startDate) &&
    (isBefore(date, parseISO(endDate)) || dateKey === endDate)
  );
}

export const mockApi = {
  baseUrl: API_BASE_URL,

  async startGithubMockLogin(): Promise<UsersMeResponse> {
    const db = readDb();
    db.token = "mock-bearer-token";
    writeDb(db);
    return this.getUsersMe();
  },

  async getUsersMe(): Promise<UsersMeResponse> {
    const db = readDb();
    return {
      user: {
        ...db.user,
        hasPersona: Boolean(db.persona),
      },
      pet: db.pet,
    };
  },

  async postUsersOnboarding(body: OnboardingRequest): Promise<Persona> {
    const db = readDb();
    const persona: Persona = {
      personaId: 45,
      summary: "핵심만 담백하게 공유하며 피드백 수용이 빠른 주니어 개발자 페르소나",
      markdown:
        "# 페르소나 정의서\n\n## 1. 문체\n- '~했습니다'처럼 담백한 문장을 선호합니다.\n- 문제 상황과 감정 변화를 함께 적습니다.\n\n## 2. 자주 쓰는 구조\n1. 오늘 한 일\n2. 막힌 지점\n3. 해결 과정\n4. 배운 점\n\n## 3. 작성 특징\n- 과장보다 실제 판단 근거를 중시합니다.\n- 마지막에 다음 액션을 남깁니다.",
    };
    db.persona = persona;
    db.user = {
      ...db.user,
      nickname: body.nickname?.trim() || db.user.nickname,
      hasPersona: true,
    };
    writeDb(db);
    return persona;
  },

  async getOrCreateChatSession(dateKey: string): Promise<DailyChatSession> {
    const db = readDb();
    const session = getOrCreateSession(db, dateKey);
    writeDb(db);
    return session;
  },

  async getChatsActive(dateKey = todayKey()): Promise<DailyChatSession> {
    return this.getOrCreateChatSession(dateKey);
  },

  async postChatsMessage(body: SendMessageRequest): Promise<SendMessageResponse> {
    const db = readDb();
    const session = getOrCreateSession(db, body.dateKey);
    const userMessage = createMessage("user", body.content, nextId(db));
    const assistantMessage = createMessage(
      "assistant",
      pickQuestion(body.content, session.messages.length),
      nextId(db),
    );
    db.chatSessionsByDate[body.dateKey] = {
      ...session,
      id: body.sessionId ?? session.id,
      messages: [...session.messages, userMessage, assistantMessage],
    };
    const gained = 2;
    db.pet = {
      ...db.pet,
      exp: Math.min(100, db.pet.exp + gained),
      lastActivityAt: new Date().toISOString(),
    };
    writeDb(db);
    return {
      userMessage,
      assistantMessage,
      petExpGained: gained,
      currentPetExp: db.pet.exp,
    };
  },

  async postDiariesRollup(dateKey = todayKey()): Promise<RollupResponse> {
    const db = readDb();
    const session = getOrCreateSession(db, dateKey);
    const userLines = session.messages
      .filter((message) => message.role === "user")
      .map((message) => `- ${message.content}`);
    const questionLines = session.messages
      .filter((message) => message.role === "assistant")
      .slice(1)
      .map((message) => `- Q. ${message.content}`);
    const diary: Diary = {
      id: nextId(db),
      dateKey,
      title: `${formatDateKey(dateKey)} 기록 조각을 정리한 다이어리`,
      markdown:
        `# ${dateKey} 다이어리\n\n## ${formatDateKey(dateKey)}의 조각\n${userLines.join("\n") || "- 아직 남긴 기록이 많지 않았습니다."}\n\n## 실록이가 물어본 것\n${questionLines.join("\n") || "- 이 날짜에는 짧은 안부만 남겼습니다."}\n\n## 나중에 다시 볼 단서\n- ${formatDateKey(dateKey)}에 남긴 표현을 바탕으로 다음 회고에서 원인, 감정, 다음 액션을 이어서 확인하기.`,
      emotionEmoji: "🤔",
      tags: ["날짜기록", "회고재료"],
    };
    db.diaries = [diary, ...db.diaries.filter((item) => item.dateKey !== dateKey)];
    db.pet = normalizePetAfterExp(db.pet.exp + 13);
    db.chatSessionsByDate[dateKey] = {
      ...session,
      status: "rolled_up",
      closedAt: new Date().toISOString(),
    };
    writeDb(db);
    return {
      success: true,
      message: `${dateKey} 데일리 마이그레이션 완료`,
      generatedDiaryId: diary.id,
      petUpdate: db.pet,
    };
  },

  async getDiaries(): Promise<{ diaries: DiarySummary[] }> {
    const db = readDb();
    return {
      diaries: db.diaries.map(({ dateKey, emotionEmoji }) => ({ dateKey, emotionEmoji })),
    };
  },

  async getDiary(dateKey: string): Promise<Diary | null> {
    const db = readDb();
    return db.diaries.find((diary) => diary.dateKey === dateKey) ?? null;
  },

  async putDiary(dateKey: string, markdown: string): Promise<Diary> {
    const db = readDb();
    const current = db.diaries.find((diary) => diary.dateKey === dateKey);
    const diary: Diary = current
      ? { ...current, markdown }
      : {
          id: nextId(db),
          dateKey,
          title: "직접 수정한 다이어리",
          markdown,
          emotionEmoji: "✍️",
          tags: ["수정됨"],
        };
    db.diaries = [diary, ...db.diaries.filter((item) => item.dateKey !== dateKey)];
    writeDb(db);
    return diary;
  },

  async deleteDiary(dateKey: string): Promise<{ success: boolean }> {
    const db = readDb();
    db.diaries = db.diaries.filter((diary) => diary.dateKey !== dateKey);
    writeDb(db);
    return { success: true };
  },

  async postRetrospectives(body: RetrospectiveRequest): Promise<RetrospectiveResponse> {
    const db = readDb();
    const sourceDiaries = db.diaries.filter((diary) =>
      inRange(diary.dateKey, body.startDate, body.endDate),
    );
    const title =
      body.type === "tech_blog"
        ? "기록으로 다시 보는 기술적 삽질의 흐름"
        : body.type === "emotion"
          ? "오늘의 감정을 놓치지 않기 위한 회고"
          : body.type === "woowacourse"
            ? "우테코 미션 속에서 바뀐 생각"
            : "쌓인 기록을 엮은 자유 회고";
    const retrospective: Retrospective = {
      retrospectiveId: nextId(db),
      title,
      markdown:
        `# ${title}\n\n${sourceDiaries.length}개의 다이어리를 바탕으로 이번 기록을 다시 엮어봤습니다.\n\n## 기록에서 보인 흐름\n${sourceDiaries.map((diary) => `- ${diary.dateKey}: ${diary.title}`).join("\n") || "- 아직 선택한 기간에 다이어리가 많지 않아, 선택한 날짜의 기록을 중심으로 정리했습니다."}\n\n## 이번 회고의 방향\n- 글 종류: ${body.type}\n- 작성 방식: ${body.promptOptions.join(", ") || "기본"}\n\n## 배운 점\n처음에는 막막했던 문제도 기록으로 남기니 판단 과정이 보였습니다. 다음에는 문제를 만난 순간의 감정과 선택지를 조금 더 빠르게 적어두면 좋겠습니다.\n\n## 다음 액션\n다음 기록에서는 원인, 선택한 해결책, 다시 적용할 기준을 한 문장씩 남겨보겠습니다.`,
      tags: ["우테코", "회고"],
      type: body.type,
      range: {
        startDate: body.startDate,
        endDate: body.endDate,
      },
      createdAt: new Date().toISOString(),
    };
    db.retrospectives = [retrospective, ...db.retrospectives];
    db.pet = normalizePetAfterExp(db.pet.exp + 25);
    writeDb(db);
    return {
      retrospectiveId: retrospective.retrospectiveId,
      title: retrospective.title,
      markdown: retrospective.markdown,
      tags: retrospective.tags,
      petUpdate: db.pet,
    };
  },

  async getRetrospectives(): Promise<{ retrospectives: Retrospective[] }> {
    const db = readDb();
    return {
      retrospectives: db.retrospectives,
    };
  },
};
