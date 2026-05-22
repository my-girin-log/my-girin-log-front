import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { endOfWeek, format, isAfter, startOfWeek, subDays } from "date-fns";
import { mockApi } from "../api/mockApi";
import { promptOptions, rangePresets, typeLabels, type RangePreset } from "../constants";
import { toDateKey, todayKey } from "../utils/date";
import type { PetState, RetrospectiveRequest, RetrospectiveType } from "../types";
import { BottomSheet } from "./BottomSheet";

type ResolvedRange = { startDate: string; endDate: string } | { error: string };

function resolveRange(
  preset: RangePreset,
  customStart: string,
  customEnd: string,
): ResolvedRange {
  const now = new Date();
  if (preset === "today") {
    const key = toDateKey(now);
    return { startDate: key, endDate: key };
  }
  if (preset === "recent3") {
    return { startDate: toDateKey(subDays(now, 2)), endDate: toDateKey(now) };
  }
  if (preset === "thisWeek") {
    return {
      startDate: toDateKey(startOfWeek(now, { weekStartsOn: 1 })),
      endDate: toDateKey(endOfWeek(now, { weekStartsOn: 1 })),
    };
  }
  if (!customStart || !customEnd) return { error: "시작일과 종료일을 모두 선택해주세요." };
  if (isAfter(new Date(customStart), new Date(customEnd))) {
    return { error: "시작일이 종료일보다 늦습니다." };
  }
  return { startDate: customStart, endDate: customEnd };
}

export function RetrospectiveFlow({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (petUpdate: PetState) => Promise<void>;
}) {
  const today = todayKey();
  const [preset, setPreset] = useState<RangePreset>("recent3");
  const [customStart, setCustomStart] = useState(toDateKey(subDays(new Date(), 6)));
  const [customEnd, setCustomEnd] = useState(today);
  const [type, setType] = useState<RetrospectiveType>("woowacourse");
  const [selectedOptions, setSelectedOptions] = useState<string[]>(["삽질과 해결 중심"]);
  const [result, setResult] = useState("");
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const range = useMemo(
    () => resolveRange(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );
  const rangeError = "error" in range ? range.error : null;
  const rangeLabel =
    "startDate" in range ? `${range.startDate} ~ ${range.endDate}` : null;

  async function submit() {
    if (!("startDate" in range)) {
      setErrorMessage(range.error);
      return;
    }
    setErrorMessage(null);
    setGenerating(true);
    try {
      const body: RetrospectiveRequest = {
        startDate: range.startDate,
        endDate: range.endDate,
        type,
        promptOptions: selectedOptions,
      };
      const response = await mockApi.postRetrospectives(body);
      setResult(response.markdown);
      setTitle(response.title);
      await onCreated(response.petUpdate);
    } catch (error) {
      setErrorMessage("회고 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(result);
  }

  function downloadMarkdown() {
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <BottomSheet onClose={onClose} ariaLabel="회고 생성">
      <h2>회고 생성하기</h2>
      <p className="muted sheetCaption">기간 · 종류 · 작성 방식을 골라주세요</p>

      <div className="fieldLabel">기간</div>
      <div className="choiceGroup wrap">
        {rangePresets.map((item) => (
          <button
            key={item.value}
            className={preset === item.value ? "selected" : ""}
            onClick={() => setPreset(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {preset === "custom" ? (
        <div className="dateRangeRow">
          <label>
            시작
            <input
              type="date"
              value={customStart}
              max={customEnd}
              onChange={(event) => setCustomStart(event.target.value)}
            />
          </label>
          <label>
            종료
            <input
              type="date"
              value={customEnd}
              min={customStart}
              max={today}
              onChange={(event) => setCustomEnd(event.target.value)}
            />
          </label>
        </div>
      ) : null}
      {rangeLabel ? <p className="rangePreview">선택된 범위 · {rangeLabel}</p> : null}
      {rangeError ? <p className="formError">{rangeError}</p> : null}

      <div className="fieldLabel">회고 종류</div>
      <div className="choiceGroup wrap">
        {(Object.keys(typeLabels) as RetrospectiveType[]).map((item) => (
          <button
            key={item}
            className={type === item ? "selected" : ""}
            onClick={() => setType(item)}
          >
            {typeLabels[item]}
          </button>
        ))}
      </div>

      <div className="fieldLabel">작성 방식 (중복 선택 가능)</div>
      <div className="choiceGroup wrap">
        {promptOptions.map((item) => (
          <button
            key={item}
            className={selectedOptions.includes(item) ? "selected" : ""}
            onClick={() =>
              setSelectedOptions((current) =>
                current.includes(item)
                  ? current.filter((option) => option !== item)
                  : [...current, item],
              )
            }
          >
            {item}
          </button>
        ))}
      </div>

      <button
        className="primaryButton"
        disabled={generating || Boolean(rangeError)}
        onClick={submit}
      >
        {generating ? "쌓인 기록을 회고 글로 엮고 있어요" : "생성하기"}
      </button>
      {errorMessage ? <p className="formError">{errorMessage}</p> : null}

      {result ? (
        <>
          <h3>{title}</h3>
          <article className="markdownPreview">
            <ReactMarkdown>{result}</ReactMarkdown>
          </article>
          <div className="sheetActions">
            <button className="secondaryButton" onClick={copy}>
              복사
            </button>
            <button className="secondaryButton" onClick={downloadMarkdown}>
              Markdown 다운로드
            </button>
          </div>
          <p className="platformGuide">
            벨로그와 티스토리는 Markdown 그대로, 네이버블로그는 본문을 복사해 붙여넣으면 됩니다.
          </p>
        </>
      ) : null}
    </BottomSheet>
  );
}
