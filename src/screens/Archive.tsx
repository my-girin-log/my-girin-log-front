import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import ReactMarkdown from "react-markdown";
import { format, parseISO } from "date-fns";
import { api } from "../api";
import { BottomSheet } from "../components/BottomSheet";
import { Icon } from "../components/Icon";
import { ListSection } from "../components/ListSection";
import { RetrospectiveFlow } from "../components/RetrospectiveFlow";
import { RetrospectiveSheet } from "../components/RetrospectiveSheet";
import { spriteUrl } from "../sprites";
import { typeLabels } from "../constants";
import { formatDateKey, toDateKey } from "../utils/date";
import type { Diary, DiarySummary, PetState, Retrospective } from "../types";

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

function monthAnchor(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function ArchiveScreen({
  pet,
  diaries,
  retrospectives,
  onRefresh,
  onPetChange,
  onOpenHome,
  autoOpenDateKey,
  onAutoOpened,
}: {
  pet: PetState;
  diaries: DiarySummary[];
  retrospectives: Retrospective[];
  onRefresh: () => Promise<void>;
  onPetChange: (pet: PetState) => void;
  onOpenHome: (dateKey: string) => void;
  autoOpenDateKey: string | null;
  onAutoOpened: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date>(() => monthAnchor(new Date()));
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [retroOpen, setRetroOpen] = useState(false);
  const [selectedRetro, setSelectedRetro] = useState<Retrospective | null>(null);
  const dateKey = toDateKey(selectedDate);
  const todayDateKey = useMemo(() => toDateKey(new Date()), []);
  const diaryKeys = useMemo(() => new Set(diaries.map((diary) => diary.dateKey)), [diaries]);
  const monthRetros = useMemo(
    () =>
      retrospectives.filter((retro) => {
        const d = new Date(retro.createdAt);
        return (
          d.getFullYear() === activeStartDate.getFullYear() &&
          d.getMonth() === activeStartDate.getMonth()
        );
      }),
    [retrospectives, activeStartDate],
  );

  async function openDiary(date: Date) {
    const key = toDateKey(date);
    setSelectedDate(date);
    const diary = await api.getDiary(key);
    setSelectedDiary(diary);
    setDraft(diary?.markdown ?? "");
    setEditing(false);
    setSheetOpen(true);
  }

  useEffect(() => {
    if (!autoOpenDateKey) return;
    const target = parseISO(autoOpenDateKey);
    setActiveStartDate(monthAnchor(target));
    openDiary(target);
    onAutoOpened();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenDateKey]);

  async function deleteDiary() {
    await api.deleteDiary(dateKey);
    await onRefresh();
    setSheetOpen(false);
  }

  async function toggleEditOrSave() {
    if (!editing) {
      setEditing(true);
      return;
    }
    const diary = await api.putDiary(dateKey, draft);
    setSelectedDiary(diary);
    setEditing(false);
    await onRefresh();
  }

  return (
    <section className="screen archiveScreen">
      <div className="archiveHero">
        <img src={spriteUrl(pet.meta.stateKey, 1)} alt="" />
        <div>
          <p>성장하는 당신을 응원해요!</p>
          <strong>{format(activeStartDate, "M월")}의 기록들</strong>
        </div>
      </div>
      <div className="calendarCard">
        <Calendar
          calendarType="gregory"
          locale="ko-KR"
          value={selectedDate}
          activeStartDate={activeStartDate}
          onActiveStartDateChange={({ activeStartDate: next }) => {
            if (next) setActiveStartDate(next);
          }}
          onClickDay={openDiary}
          view="month"
          minDetail="month"
          maxDetail="month"
          next2Label={null}
          prev2Label={null}
          prevLabel="‹"
          nextLabel="›"
          navigationLabel={({ date }) => format(date, "yyyy년 M월")}
          formatDay={(_, date) => format(date, "d")}
          formatShortWeekday={(_, date) => WEEKDAY_LABEL[date.getDay()]}
          tileClassName={({ date, view }) => {
            if (view !== "month") return null;
            return diaryKeys.has(toDateKey(date)) ? "tileWithEntry" : null;
          }}
          tileDisabled={({ date, view }) => {
            if (view !== "month") return false;
            return toDateKey(date) > todayDateKey;
          }}
        />
      </div>
      <button className="primaryButton" onClick={() => setRetroOpen(true)}>
        <Icon name="book" /> 회고 생성하기
      </button>
      <ListSection
        title={`${format(activeStartDate, "M월")}의 회고`}
        emptyMessage="이 달에 생성된 회고가 없어요."
        items={monthRetros.map((retro) => ({
          id: String(retro.retrospectiveId),
          title: retro.title,
          body: `${format(new Date(retro.range.startDate), "M/d")} ~ ${format(new Date(retro.range.endDate), "M/d")} · ${typeLabels[retro.type]}`,
          onClick: () => setSelectedRetro(retro),
        }))}
      />

      {sheetOpen ? (
        <BottomSheet onClose={() => setSheetOpen(false)} ariaLabel="다이어리 상세">
          <h2>다이어리</h2>
          <p className="muted">{format(selectedDate, "M/d")}</p>
          {selectedDiary ? (
            <>
              <h3>{selectedDiary.title}</h3>
              {editing ? (
                <textarea
                  className="markdownEditor"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              ) : (
                <article className="markdownPreview">
                  <ReactMarkdown>{selectedDiary.markdown}</ReactMarkdown>
                </article>
              )}
              <div className="sheetActions">
                <button className="dangerButton" onClick={deleteDiary}>
                  삭제
                </button>
                <button className="secondaryButton" onClick={toggleEditOrSave}>
                  {editing ? "저장" : "수정"}
                </button>
              </div>
            </>
          ) : (
            <div className="emptyState">
              <p>{formatDateKey(dateKey)} 기록이 없습니다!</p>
              <button
                className="primaryButton"
                onClick={() => {
                  setSheetOpen(false);
                  onOpenHome(dateKey);
                }}
              >
                기록하기
              </button>
            </div>
          )}
        </BottomSheet>
      ) : null}

      {retroOpen ? (
        <RetrospectiveFlow
          onClose={() => setRetroOpen(false)}
          onCreated={async (created, petUpdate) => {
            onPetChange(petUpdate);
            setRetroOpen(false);
            setSelectedRetro(created);
            await onRefresh();
          }}
        />
      ) : null}

      {selectedRetro ? (
        <RetrospectiveSheet
          retro={selectedRetro}
          onClose={() => setSelectedRetro(null)}
        />
      ) : null}
    </section>
  );
}
