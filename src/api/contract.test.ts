import { describe, expect, it } from "vitest";
import { mockApi } from "./mockApi";
import { realApi } from "./realApi";

const REQUIRED_METHODS = [
  "getUsersMe",
  "postUsersOnboarding",
  "getChatsActive",
  "postChatsMessage",
  "postDiariesRollup",
  "getDiaries",
  "getDiary",
  "putDiary",
  "deleteDiary",
  "postRetrospectives",
  "getRetrospectives",
  "startGithubMockLogin",
] as const;

describe("mockApi and realApi expose the same surface", () => {
  for (const method of REQUIRED_METHODS) {
    it(`both implement ${method}()`, () => {
      expect(typeof (mockApi as Record<string, unknown>)[method]).toBe("function");
      expect(typeof (realApi as Record<string, unknown>)[method]).toBe("function");
    });
  }
});
