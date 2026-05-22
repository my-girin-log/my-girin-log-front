import { Icon } from "../components/Icon";
import { useSpriteFrame } from "../hooks/useSpriteFrame";
import type { DiarySummary, PetState } from "../types";

const CONDITION_LABEL = { good: "Good", bad: "Bad", terrible: "Terrible" } as const;

export function PetScreen({
  pet,
  diaries,
}: {
  pet: PetState;
  diaries: DiarySummary[];
}) {
  const sprite = useSpriteFrame(pet);
  const conditionLabel = CONDITION_LABEL[pet.condition];

  return (
    <section className="screen petScreen">
      <div className="petSpeech">오늘도 함께 성장해볼까요?</div>
      <div className="petStage">
        <img src={sprite} alt="성장 중인 기린" />
      </div>
      <h2>실록이</h2>
      <div className="petBadge">
        Level {pet.level} · Status: {conditionLabel}
      </div>
      <div className="meterCard">
        <div className="meterHeader">
          <span>EXP</span>
          <strong>{pet.exp} / 100</strong>
        </div>
        <div className="meterTrack">
          <span style={{ width: `${pet.exp}%` }} />
        </div>
      </div>
      <div className="statGrid">
        <div>
          <Icon name="archive" />
          <span>Total Diaries</span>
          <strong>{diaries.length}</strong>
        </div>
        <div>
          <Icon name="spark" />
          <span>Streak</span>
          <strong>{Math.max(1, Math.min(5, diaries.length + 1))} Days</strong>
        </div>
      </div>
      <div className="tipCard">
        <Icon name="pet" />
        <p>회고를 3번 더 작성하면 다음 레벨로 진화할 수 있어요!</p>
      </div>
    </section>
  );
}
