import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fromBackendRetrospective, realApi, toBackendRetrospectiveBody } from "./realApi";

describe("toBackendRetrospectiveBody", () => {
  it("renames startDate/endDate to rangeStartDate/rangeEndDate", () => {
    const result = toBackendRetrospectiveBody({
      type: "tech_blog",
      startDate: "2026-05-01",
      endDate: "2026-05-07",
      promptOptions: ["삽질과 해결 중심"],
    });
    expect(result.rangeStartDate).toBe("2026-05-01");
    expect(result.rangeEndDate).toBe("2026-05-07");
    expect(result.type).toBe("tech_blog");
  });

  it("joins promptOptions array into focus string", () => {
    const result = toBackendRetrospectiveBody({
      type: "emotion",
      startDate: "2026-05-01",
      endDate: "2026-05-01",
      promptOptions: ["배운 점 중심", "내 말투 강하게"],
    });
    expect(result.promptOptions).toEqual({ focus: "배운 점 중심, 내 말투 강하게" });
  });

  it("handles empty promptOptions", () => {
    const result = toBackendRetrospectiveBody({
      type: "freeform",
      startDate: "2026-05-01",
      endDate: "2026-05-01",
      promptOptions: [],
    });
    expect(result.promptOptions).toEqual({ focus: "" });
  });
});

describe("fromBackendRetrospective", () => {
  it("collapses range fields into nested range object", () => {
    const result = fromBackendRetrospective({
      retrospectiveId: 1,
      title: "T",
      markdown: "# title",
      tags: ["a"],
      type: "woowacourse",
      rangeStartDate: "2026-05-01",
      rangeEndDate: "2026-05-05",
      createdAt: "2026-05-06T00:00:00Z",
    });
    expect(result.range).toEqual({ startDate: "2026-05-01", endDate: "2026-05-05" });
    expect(result.tags).toEqual(["a"]);
  });

  it("defaults tags to empty array when missing", () => {
    const result = fromBackendRetrospective({
      retrospectiveId: 1,
      title: "T",
      markdown: "x",
      type: "freeform",
      rangeStartDate: "2026-05-01",
      rangeEndDate: "2026-05-01",
      createdAt: "2026-05-01T00:00:00Z",
    });
    expect(result.tags).toEqual([]);
  });
});

describe("realApi network behavior", () => {
  const ORIGINAL_FETCH = global.fetch;
  const fetchMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
  });

  function ok<T>(value: T, init: ResponseInit = { status: 200 }): Response {
    return new Response(JSON.stringify(value), {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  }

  it("auto-authenticates on first call and caches the token in localStorage", async () => {
    fetchMock
      .mockResolvedValueOnce(ok({ token: "demo-token-1" })) // POST /auth/demo
      .mockResolvedValueOnce(
        ok({
          user: { id: 1, githubId: "g", nickname: "n", avatarUrl: "", hasPersona: false, createdAt: "" },
          pet: {
            level: 0,
            stage: "calf",
            condition: "good",
            exp: 0,
            lastActivityAt: "",
            meta: { stateNumber: 1, stateKey: "1-calf-good", totalFrames: 4, spriteRowIndex: 0 },
          },
        }),
      );

    await realApi.getUsersMe();

    const authCall = fetchMock.mock.calls[0];
    expect(authCall[0]).toContain("/auth/demo");
    expect(authCall[1].method).toBe("POST");

    const meCall = fetchMock.mock.calls[1];
    expect(meCall[0]).toContain("/users/me");
    expect((meCall[1].headers as Record<string, string>).Authorization).toBe("Bearer demo-token-1");
    expect(localStorage.getItem("my-girin-log.token")).toBe("demo-token-1");
  });

  it("reuses cached token on subsequent calls", async () => {
    localStorage.setItem("my-girin-log.token", "cached-token");
    fetchMock.mockResolvedValueOnce(ok({ diaries: [] }));

    await realApi.getDiaries();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer cached-token");
  });

  it("clears token and throws on 401", async () => {
    localStorage.setItem("my-girin-log.token", "stale");
    fetchMock.mockResolvedValueOnce(new Response("", { status: 401 }));

    await expect(realApi.getUsersMe()).rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem("my-girin-log.token")).toBeNull();
  });

  it("postChatsMessage strips dateKey before sending", async () => {
    localStorage.setItem("my-girin-log.token", "t");
    fetchMock.mockResolvedValueOnce(
      ok({
        userMessage: { id: 1, role: "user", content: "hi", createdAt: "" },
        assistantMessage: { id: 2, role: "assistant", content: "q?", createdAt: "" },
        petExpGained: 2,
        currentPetExp: 12,
      }),
    );

    await realApi.postChatsMessage({ sessionId: 9, dateKey: "2026-05-01", content: "hi" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toEqual({ sessionId: 9, content: "hi" });
    expect(body).not.toHaveProperty("dateKey");
  });

  it("postRetrospectives translates request body to backend shape", async () => {
    localStorage.setItem("my-girin-log.token", "t");
    fetchMock.mockResolvedValueOnce(
      ok({
        retrospectiveId: 11,
        title: "T",
        markdown: "...",
        tags: [],
        type: "tech_blog",
        rangeStartDate: "2026-05-01",
        rangeEndDate: "2026-05-05",
        createdAt: "2026-05-06T00:00:00Z",
        petUpdate: {
          level: 1,
          stage: "adolescent",
          condition: "good",
          exp: 30,
          lastActivityAt: "",
          meta: { stateNumber: 4, stateKey: "4-adolescent-good", totalFrames: 4, spriteRowIndex: 3 },
        },
      }),
    );

    const response = await realApi.postRetrospectives({
      type: "tech_blog",
      startDate: "2026-05-01",
      endDate: "2026-05-05",
      promptOptions: ["삽질과 해결 중심"],
    });

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(sent).toEqual({
      type: "tech_blog",
      rangeStartDate: "2026-05-01",
      rangeEndDate: "2026-05-05",
      promptOptions: { focus: "삽질과 해결 중심" },
    });
    expect(response.retrospectiveId).toBe(11);
    expect(response.petUpdate.level).toBe(1);
  });

  it("getRetrospectives unwraps either array or {retrospectives} envelope", async () => {
    localStorage.setItem("my-girin-log.token", "t");
    const item = {
      retrospectiveId: 1,
      title: "T",
      markdown: "m",
      type: "freeform",
      rangeStartDate: "2026-05-01",
      rangeEndDate: "2026-05-01",
      createdAt: "2026-05-01T00:00:00Z",
    };

    fetchMock.mockResolvedValueOnce(ok([item]));
    const a = await realApi.getRetrospectives();
    expect(a.retrospectives).toHaveLength(1);
    expect(a.retrospectives[0].range.startDate).toBe("2026-05-01");

    fetchMock.mockResolvedValueOnce(ok({ retrospectives: [item, item] }));
    const b = await realApi.getRetrospectives();
    expect(b.retrospectives).toHaveLength(2);
  });

  it("getDiary returns null on 404 instead of throwing", async () => {
    localStorage.setItem("my-girin-log.token", "t");
    fetchMock.mockResolvedValueOnce(new Response("not found", { status: 404 }));
    const diary = await realApi.getDiary("2026-05-01");
    expect(diary).toBeNull();
  });
});
