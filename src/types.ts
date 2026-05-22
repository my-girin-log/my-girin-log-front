export type TabKey = "home" | "pet" | "archive";

export type PetLevel = 0 | 1 | 2;
export type PetStage = "calf" | "adolescent" | "adult";
export type PetCondition = "good" | "bad" | "terrible";

export type PetMeta = {
  stateNumber: number;
  stateKey: string;
  totalFrames: number;
  spriteRowIndex: number;
};

export type User = {
  id: number;
  githubId: string;
  nickname: string;
  avatarUrl?: string;
  hasPersona: boolean;
  createdAt: string;
};

export type PetState = {
  level: PetLevel;
  stage: PetStage;
  condition: PetCondition;
  exp: number;
  expIntoLevel?: number;
  levelUpExp?: number;
  lastActivityAt: string;
  meta: PetMeta;
};

export type UsersMeResponse = {
  user: User;
  pet: PetState;
};

export type Persona = {
  personaId: number;
  summary: string;
  markdown: string;
};

export type OnboardingRequest = {
  sources: string[];
  rawText: string;
  nickname?: string;
};

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  source?: string;
};

export type DailyChatSession = {
  id: number;
  dateKey: string;
  messages: ChatMessage[];
  status: "active" | "rolled_up";
  startedAt: string;
  closedAt?: string;
};

export type SendMessageRequest = {
  sessionId?: number;
  dateKey: string;
  content: string;
};

export type SendMessageResponse = {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  petExpGained: number;
  currentPetExp: number;
};

export type DiarySummary = {
  dateKey: string;
  emotionEmoji: string;
};

export type Diary = {
  id: number;
  dateKey: string;
  title: string;
  markdown: string;
  emotionEmoji: string;
  tags: string[];
};

export type RollupResponse = {
  success: boolean;
  message: string;
  generatedDiaryId: number;
  petUpdate: PetState;
};

export type RetrospectiveType = "tech_blog" | "emotion" | "woowacourse" | "freeform";

export type RetrospectiveRequest = {
  startDate: string;
  endDate: string;
  type: RetrospectiveType;
  promptOptions: string[];
};

export type Retrospective = {
  retrospectiveId: number;
  title: string;
  markdown: string;
  tags: string[];
  type: RetrospectiveType;
  range: {
    startDate: string;
    endDate: string;
  };
  createdAt: string;
};

export type RetrospectiveResponse = Omit<Retrospective, "type" | "range" | "createdAt"> & {
  petUpdate: PetState;
};
