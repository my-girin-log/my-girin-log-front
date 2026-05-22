import { format } from "date-fns";
import type {
  DailyChatSession,
  Diary,
  DiarySummary,
  OnboardingRequest,
  Persona,
  PetState,
  Retrospective,
  RetrospectiveRequest,
  RetrospectiveResponse,
  RollupResponse,
  SendMessageRequest,
  SendMessageResponse,
  UsersMeResponse,
} from "../types";
import { apiRequest } from "./client";

/**
 * Backend POST /retrospectives uses `{type, rangeStartDate, rangeEndDate, promptOptions: {focus}}`.
 * Front API takes `{type, startDate, endDate, promptOptions: string[]}`. Translate.
 */
export function toBackendRetrospectiveBody(req: RetrospectiveRequest): {
  type: RetrospectiveRequest["type"];
  rangeStartDate: string;
  rangeEndDate: string;
  promptOptions: { focus: string };
} {
  return {
    type: req.type,
    rangeStartDate: req.startDate,
    rangeEndDate: req.endDate,
    promptOptions: { focus: req.promptOptions.join(", ") },
  };
}

type BackendRetrospective = {
  retrospectiveId: number;
  title: string;
  markdown: string;
  tags?: string[];
  type: Retrospective["type"];
  rangeStartDate: string;
  rangeEndDate: string;
  createdAt: string;
};

type BackendRetrospectiveCreated = BackendRetrospective & {
  petUpdate: PetState;
};

export function fromBackendRetrospective(b: BackendRetrospective): Retrospective {
  return {
    retrospectiveId: b.retrospectiveId,
    title: b.title,
    markdown: b.markdown,
    tags: b.tags ?? [],
    type: b.type,
    range: { startDate: b.rangeStartDate, endDate: b.rangeEndDate },
    createdAt: b.createdAt,
  };
}

// ---------- realApi ----------

export const realApi = {
  baseUrl: "/api/v1",

  async startGithubMockLogin(): Promise<UsersMeResponse> {
    return this.getUsersMe();
  },

  async getUsersMe(): Promise<UsersMeResponse> {
    return apiRequest<UsersMeResponse>("/users/me");
  },

  async postUsersOnboarding(body: OnboardingRequest): Promise<Persona> {
    return apiRequest<Persona>("/users/onboarding", { method: "POST", body });
  },

  async getOrCreateChatSession(_dateKey: string): Promise<DailyChatSession> {
    // Backend `/chats/active` returns today's session only (06:00 KST boundary).
    return apiRequest<DailyChatSession>("/chats/active");
  },

  async getChatsActive(_dateKey?: string): Promise<DailyChatSession> {
    return apiRequest<DailyChatSession>("/chats/active");
  },

  async postChatsMessage(body: SendMessageRequest): Promise<SendMessageResponse> {
    // Backend ignores `dateKey` (decides via 06:00 KST boundary internally).
    return apiRequest<SendMessageResponse>("/chats/message", {
      method: "POST",
      body: { sessionId: body.sessionId, content: body.content },
    });
  },

  async postDiariesRollup(_dateKey?: string): Promise<RollupResponse> {
    return apiRequest<RollupResponse>("/diaries/rollup", { method: "POST" });
  },

  async getDiaries(): Promise<{ diaries: DiarySummary[] }> {
    const list = await apiRequest<DiarySummary[] | { diaries: DiarySummary[] }>("/diaries");
    const diaries = Array.isArray(list) ? list : (list?.diaries ?? []);
    return { diaries };
  },

  async getDiariesByMonth(referenceDate: Date): Promise<{ diaries: DiarySummary[] }> {
    const list = await apiRequest<DiarySummary[] | { diaries: DiarySummary[] }>("/diaries", {
      query: { yearMonth: format(referenceDate, "yyyy-MM") },
    });
    const diaries = Array.isArray(list) ? list : (list?.diaries ?? []);
    return { diaries };
  },

  async getDiary(dateKey: string): Promise<Diary | null> {
    try {
      return await apiRequest<Diary>(`/diaries/${dateKey}`);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  },

  async putDiary(dateKey: string, markdown: string): Promise<Diary> {
    return apiRequest<Diary>(`/diaries/${dateKey}`, {
      method: "PUT",
      body: { markdown },
    });
  },

  async deleteDiary(dateKey: string): Promise<{ success: boolean }> {
    await apiRequest<void>(`/diaries/${dateKey}`, { method: "DELETE" });
    return { success: true };
  },

  async postRetrospectives(body: RetrospectiveRequest): Promise<RetrospectiveResponse> {
    const created = await apiRequest<BackendRetrospectiveCreated>("/retrospectives", {
      method: "POST",
      body: toBackendRetrospectiveBody(body),
    });
    return {
      retrospectiveId: created.retrospectiveId,
      title: created.title,
      markdown: created.markdown,
      tags: created.tags ?? [],
      petUpdate: created.petUpdate,
    };
  },

  async getRetrospectives(): Promise<{ retrospectives: Retrospective[] }> {
    const list = await apiRequest<BackendRetrospective[] | { retrospectives: BackendRetrospective[] }>(
      "/retrospectives",
    );
    const items = Array.isArray(list) ? list : (list?.retrospectives ?? []);
    return { retrospectives: items.map(fromBackendRetrospective) };
  },
};

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: number }).status === 404
  );
}

