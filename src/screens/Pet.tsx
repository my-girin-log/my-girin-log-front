import { useState } from "react";
import { useSpriteFrame } from "../hooks/useSpriteFrame";
import { api } from "../api";
import type { DiarySummary, PetState } from "../types";
import { format, subDays } from "date-fns";

const CONDITION_LABEL = { good: "GOOD", bad: "BAD", terrible: "TERRIBLE" } as const;
const STAGE_LABEL_KO = {
  calf: "새싹 기린",
  adolescent: "청년 기린",
  adult: "어른 기린",
} as const;
const MAX_LEVEL = 2;
const EXP_PER_RETROSPECTIVE = 10;

const GRASS_WEEKS = 18;
const GRASS_DAYS = GRASS_WEEKS * 7;

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function getCurrentStreak(diaryKeys: Set<string>) {
  let streak = 0;
  let cursor = new Date();

  while (diaryKeys.has(toDateKey(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
}

export function PetScreen({
  pet,
  diaries,
  onPetChange,
}: {
  pet: PetState;
  diaries: DiarySummary[];
  onPetChange?: (pet: PetState) => void;
}) {
  const sprite = useSpriteFrame(pet);
  const [granting, setGranting] = useState(false);

  async function handleLevelUp() {
    if (granting) return;
    setGranting(true);
    try {
      const next = await api.grantExp(10);
      onPetChange?.(next);
    } catch (e) {
      console.error("[grantExp] failed", e);
      alert("레벨업 실패 — 콘솔 확인");
    } finally {
      setGranting(false);
    }
  }
  const conditionLabel = CONDITION_LABEL[pet.condition];
  const diaryKeys = new Set(diaries.map((diary) => diary.dateKey));
  const currentStreak = getCurrentStreak(diaryKeys);
  const grassDays = Array.from({ length: GRASS_DAYS }, (_, index) => {
    const date = subDays(new Date(), GRASS_DAYS - 1 - index);
    const dateKey = toDateKey(date);
    const hasDiary = diaryKeys.has(dateKey);

    return {
      dateKey,
      label: format(date, "M월 d일"),
      level: hasDiary ? (dateKey === toDateKey(new Date()) ? 4 : 3) : 0,
    };
  });
  const grassWeeks = Array.from({ length: GRASS_WEEKS }, (_, index) =>
    grassDays.slice(index * 7, index * 7 + 7),
  );

  return (
    <section className="screen petScreen">
      <div className="petSpeech">오늘도 함께 성장해볼까요?</div>
      <div className="petStage">
        <img src={sprite} alt="성장 중인 기린" />
      </div>
      <p className="petLabel">PET</p>
      <h2>실록이</h2>
      <p className="petBadge">
        LV.{pet.level + 1} — {STAGE_LABEL_KO[pet.stage]} · STATUS: {conditionLabel}
      </p>
      {/* 데모용 — EXP +10 즉시 누적해서 진화 시연 */}
      <button
        type="button"
        className="primaryButton"
        onClick={handleLevelUp}
        disabled={granting || pet.level >= MAX_LEVEL}
        style={{ marginTop: 12, opacity: pet.level >= MAX_LEVEL ? 0.4 : 1 }}
      >
        {pet.level >= MAX_LEVEL
          ? "MAX LEVEL"
          : granting
            ? "진화 중..."
            : `🚀 레벨업 (+10 EXP, 데모)`}
      </button>
      {(() => {
        const isMax = pet.level >= MAX_LEVEL;
        const expIntoLevel = pet.expIntoLevel ?? pet.exp;
        const levelUpExp = pet.levelUpExp ?? 100;
        const percent = isMax ? 100 : Math.min(100, Math.round((expIntoLevel / levelUpExp) * 100));
        const remaining = Math.max(0, levelUpExp - expIntoLevel);
        const retrosNeeded = Math.ceil(remaining / EXP_PER_RETROSPECTIVE);
        return (
          <div className="meterBlock">
            <div className="meterHeader">
              <span>EXP</span>
              <strong>{isMax ? "MAX" : `${expIntoLevel} / ${levelUpExp}`}</strong>
            </div>
            <div className="meterTrack">
              <span style={{ width: `${percent}%` }} />
            </div>
            <p className="meterCaption">
              {isMax
                ? "최고 단계에 도달했어요. 함께한 시간이 곧 회고의 깊이가 돼요."
                : `회고 ${retrosNeeded}번 더 작성하면 다음 레벨로 진화해요`}
            </p>
          </div>
        );
      })()}
      <div className="grassCard" aria-label="최근 18주 기록 잔디">
        <div className="grassHeader">
          <div>
            <span>ACTIVITY GRASS</span>
            <strong>최근 18주 기록</strong>
            <p className="grassStats">
              Total Diaries <b>{diaries.length}</b>
              <i />
              Current Streak <b>{currentStreak} Days</b>
            </p>
          </div>
          <em>{currentStreak} day streak</em>
        </div>
        <div className="grassGrid">
          {grassWeeks.map((week, weekIndex) => (
            <div className="grassWeek" key={`week-${weekIndex}`}>
              {week.map((day) => (
                <span
                  className={`grassCell level${day.level}`}
                  key={day.dateKey}
                  title={`${day.label}${day.level > 0 ? " 기록 있음" : " 기록 없음"}`}
                  aria-label={`${day.label}${day.level > 0 ? " 기록 있음" : " 기록 없음"}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="grassLegend" aria-hidden="true">
          <span>Less</span>
          <i className="grassCell level0" />
          <i className="grassCell level1" />
          <i className="grassCell level2" />
          <i className="grassCell level3" />
          <i className="grassCell level4" />
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
