import type { RetrospectiveType } from "./types";

export const typeLabels: Record<RetrospectiveType, string> = {
  tech_blog: "기술 블로그",
  emotion: "감정 회고",
  woowacourse: "우테코 회고",
  freeform: "자유 형식",
};

export const promptOptions = [
  "배운 점 중심",
  "삽질과 해결 중심",
  "감정 변화 중심",
  "내 말투 강하게",
  "짧고 담백하게",
];

export const rangePresets = [
  { label: "오늘", value: "today" },
  { label: "최근 3일", value: "recent3" },
  { label: "이번 주", value: "thisWeek" },
  { label: "직접 선택", value: "custom" },
] as const;

export type RangePreset = (typeof rangePresets)[number]["value"];
