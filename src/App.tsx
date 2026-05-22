import { FormEvent, useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import ReactMarkdown from "react-markdown";
import { endOfWeek, format, startOfWeek, subDays } from "date-fns";
import { mockApi } from "./api/mockApi";
import type {
  DailyChatSession,
  Diary,
  DiarySummary,
  PetState,
  Persona,
  Retrospective,
  RetrospectiveRequest,
  RetrospectiveType,
  TabKey,
  User,
} from "./types";

const spriteModules = import.meta.glob("./giraffe_sprites/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const typeLabels: Record<RetrospectiveType, string> = {
  tech_blog: "기술 블로그",
  emotion: "감정 회고",
  woowacourse: "우테코 회고",
  freeform: "자유 형식",
};

const promptOptions = [
  "배운 점 중심",
  "삽질과 해결 중심",
  "감정 변화 중심",
  "내 말투 강하게",
  "짧고 담백하게",
];

function Icon({ name }: { name: "home" | "pet" | "archive" | "send" | "mic" | "spark" | "book" }) {
  const paths = {
    home: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z",
    pet: "M8.5 11.5c-1.38 0-2.5-1.34-2.5-3s1.12-3 2.5-3 2.5 1.34 2.5 3-1.12 3-2.5 3Zm7 0c-1.38 0-2.5-1.34-2.5-3s1.12-3 2.5-3 2.5 1.34 2.5 3-1.12 3-2.5 3ZM5 17.3c0-2.1 2.26-3.8 5.05-3.8.9 0 1.72.18 2.45.5.73-.32 1.55-.5 2.45-.5 2.79 0 5.05 1.7 5.05 3.8 0 1.62-1.2 2.7-2.8 2.7-1.37 0-2.35-.7-4.7-.7s-3.33.7-4.7.7C6.2 20 5 18.92 5 17.3Z",
    archive: "M5 4h14v16H5V4Zm3 4h8M8 12h8M8 16h5",
    send: "M3 20 21 12 3 4v6l11 2-11 2v6Z",
    mic: "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0M12 17v4",
    spark: "M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z",
    book: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Zm0 0V21",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path d={paths[name]} />
    </svg>
  );
}

function useSpriteFrame(pet?: PetState, intervalMs = 180) {
  const [frame, setFrame] = useState(1);

  useEffect(() => {
    if (!pet) return;
    const timerId = window.setInterval(() => {
      setFrame((current) => (current % pet.meta.totalFrames) + 1);
    }, intervalMs);
    return () => window.clearInterval(timerId);
  }, [intervalMs, pet]);

  if (!pet) return "";
  return spriteModules[`./giraffe_sprites/${pet.meta.stateKey}-${frame}.png`] ?? "";
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [pet, setPet] = useState<PetState | null>(null);
  const [session, setSession] = useState<DailyChatSession | null>(null);
  const [diaries, setDiaries] = useState<DiarySummary[]>([]);
  const [retrospectives, setRetrospectives] = useState<Retrospective[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [me, activeSession, diaryList, retroList] = await Promise.all([
      mockApi.getUsersMe(),
      mockApi.getChatsActive(),
      mockApi.getDiaries(),
      mockApi.getRetrospectives(),
    ]);
    setUser(me.user);
    setPet(me.pet);
    setSession(activeSession);
    setDiaries(diaryList.diaries);
    setRetrospectives(retroList.retrospectives);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return <div className="appShell centerOnly">우테고치를 깨우는 중...</div>;
  }

  if (!user?.hasPersona) {
    return <Onboarding onComplete={refresh} />;
  }

  return (
    <div className="appShell">
      <header className="appHeader">
        <h1>우테고치</h1>
        <button className="iconButton" aria-label="프로필">
          <span>{user.nickname.slice(0, 1)}</span>
        </button>
      </header>

      <main className="appMain">
        {activeTab === "home" && session && pet ? (
          <HomeScreen
            pet={pet}
            session={session}
            onPetChange={setPet}
            onSessionChange={setSession}
            onRollup={async () => {
              await mockApi.postDiariesRollup();
              await refresh();
              setActiveTab("archive");
            }}
            onOpenArchive={() => setActiveTab("archive")}
          />
        ) : null}
        {activeTab === "pet" && pet ? <PetScreen pet={pet} diaries={diaries} /> : null}
        {activeTab === "archive" && pet ? (
          <ArchiveScreen
            diaries={diaries}
            retrospectives={retrospectives}
            onRefresh={refresh}
            onPetChange={setPet}
            onOpenHome={() => setActiveTab("home")}
          />
        ) : null}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

function Onboarding({ onComplete }: { onComplete: () => Promise<void> }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("우테코기린");
  const [link, setLink] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [rawText, setRawText] = useState("");
  const [persona, setPersona] = useState<Persona | null>(null);
  const [creating, setCreating] = useState(false);

  function addLink() {
    const next = link.trim();
    if (!next || sources.includes(next)) return;
    setSources((current) => [...current, next]);
    setLink("");
  }

  return (
    <div className="onboarding">
      <div className="progressDots">
        <span className="active" />
        <span className={loggedIn ? "active" : ""} />
        <span className={persona ? "active" : ""} />
      </div>
      <section className="welcomeArt">
        <div className="welcomeBubble">안녕! 나는 너의 성장을 돕는 우테고치야.</div>
        <div className="welcomeCircle">
          <img src={spriteModules["./giraffe_sprites/4-adolescent-good-1.png"]} alt="기린이" />
        </div>
      </section>
      <h1>반가워요!</h1>
      <p className="muted">지난 기록을 읽고, 함께 성장할 페르소나를 만들어볼까요?</p>

      {!loggedIn ? (
        <button
          className="primaryButton dark"
          onClick={async () => {
            const me = await mockApi.startGithubMockLogin();
            setNickname(me.user.nickname);
            setLoggedIn(true);
          }}
        >
          GitHub로 시작하기
        </button>
      ) : (
        <div className="setupCard">
          <label>
            닉네임
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </label>
          <label>
            기존 글 링크
            <div className="inlineInput">
              <input
                value={link}
                onChange={(event) => setLink(event.target.value)}
                placeholder="https://velog.io/@..."
              />
              <button onClick={addLink}>추가</button>
            </div>
          </label>
          <div className="chips">
            {sources.map((source) => (
              <button
                key={source}
                className="chip"
                onClick={() => setSources((current) => current.filter((item) => item !== source))}
              >
                {source}
              </button>
            ))}
          </div>
          <label>
            텍스트로 직접 넣기
            <textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="과거 회고 원문을 붙여넣어 주세요."
            />
          </label>
          <button
            className="primaryButton"
            disabled={creating}
            onClick={async () => {
              setCreating(true);
              const nextPersona = await mockApi.postUsersOnboarding({ sources, rawText, nickname });
              setPersona(nextPersona);
              setCreating(false);
            }}
          >
            {creating ? "글쓰기 습관을 읽고 있어요" : "페르소나 만들기"}
          </button>
        </div>
      )}

      {persona ? (
        <section className="personaPreview">
          <strong>{persona.summary}</strong>
          <ReactMarkdown>{persona.markdown}</ReactMarkdown>
          <button
            className="primaryButton"
            onClick={async () => {
              await onComplete();
              window.scrollTo({ top: 0 });
            }}
          >
            기록룸으로 가기
          </button>
        </section>
      ) : null}
    </div>
  );
}

function HomeScreen({
  pet,
  session,
  onPetChange,
  onSessionChange,
  onRollup,
  onOpenArchive,
}: {
  pet: PetState;
  session: DailyChatSession;
  onPetChange: (pet: PetState) => void;
  onSessionChange: (session: DailyChatSession) => void;
  onRollup: () => Promise<void>;
  onOpenArchive: () => void;
}) {
  const sprite = useSpriteFrame(pet);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = message.trim();
    if (!content || sending) return;
    setMessage("");
    setSending(true);
    await mockApi.postChatsMessage({ sessionId: session.id, content });
    const [nextSession, me] = await Promise.all([mockApi.getChatsActive(), mockApi.getUsersMe()]);
    onSessionChange(nextSession);
    onPetChange(me.pet);
    setSending(false);
  }

  return (
    <section className="screen homeScreen">
      <div className="statusLine">
        <span className="statusDot" />
        오늘 기록 중
        <button className="softButton" onClick={onRollup}>
          <Icon name="spark" /> 오늘 기록 정리하기
        </button>
      </div>
      <div className="interactionBand">
        <img src={sprite} alt="기린이" />
        <div>
          <p>{session.messages.length > 2 ? "질문 대답해줘!" : "오늘 어땠어?"}</p>
          <span>{format(new Date(), "yyyy.MM.dd")}</span>
        </div>
      </div>
      <div className="chatLog">
        {session.messages.map((item) => (
          <article key={item.id} className={`messageBubble ${item.role}`}>
            <p>{item.content}</p>
            <time>{format(new Date(item.createdAt), "a h:mm")}</time>
          </article>
        ))}
      </div>
      {session.messages.length >= 5 ? (
        <button className="textAction" onClick={onOpenArchive}>
          쌓인 기록으로 회고 쓰기
        </button>
      ) : null}
      <form className="composer" onSubmit={submit}>
        <button type="button" className="iconButton" aria-label="음성 녹음">
          <Icon name="mic" />
        </button>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="오늘의 생각을 적어보세요..."
        />
        <button className="sendButton" type="submit" aria-label="전송">
          <Icon name="send" />
        </button>
      </form>
    </section>
  );
}

function PetScreen({ pet, diaries }: { pet: PetState; diaries: DiarySummary[] }) {
  const sprite = useSpriteFrame(pet);
  const conditionLabel = pet.condition === "good" ? "Good" : pet.condition === "bad" ? "Bad" : "Terrible";

  return (
    <section className="screen petScreen">
      <div className="petSpeech">오늘도 함께 성장해볼까요?</div>
      <div className="petStage">
        <img src={sprite} alt="성장 중인 기린" />
      </div>
      <h2>기린이</h2>
      <div className="petBadge">Level {pet.level} · Status: {conditionLabel}</div>
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

function ArchiveScreen({
  diaries,
  retrospectives,
  onRefresh,
  onPetChange,
  onOpenHome,
}: {
  diaries: DiarySummary[];
  retrospectives: Retrospective[];
  onRefresh: () => Promise<void>;
  onPetChange: (pet: PetState) => void;
  onOpenHome: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [retroOpen, setRetroOpen] = useState(false);
  const [selectedRetro, setSelectedRetro] = useState<Retrospective | null>(null);
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const diaryKeys = useMemo(() => new Set(diaries.map((diary) => diary.dateKey)), [diaries]);

  async function openDiary(date: Date) {
    const key = format(date, "yyyy-MM-dd");
    setSelectedDate(date);
    const diary = await mockApi.getDiary(key);
    setSelectedDiary(diary);
    setDraft(diary?.markdown ?? "");
    setEditing(false);
    setSheetOpen(true);
  }

  return (
    <section className="screen archiveScreen">
      <div className="archiveHero">
        <img src={spriteModules["./giraffe_sprites/1-calf-good-1.png"]} alt="" />
        <div>
          <p>성장하는 당신을 응원해요!</p>
          <strong>{format(new Date(), "M월")}의 기록들</strong>
        </div>
      </div>
      <div className="calendarCard">
        <div className="sectionTitle">
          <h2>{format(selectedDate, "yyyy년 M월")}</h2>
        </div>
        <Calendar
          calendarType="gregory"
          locale="ko-KR"
          value={selectedDate}
          onClickDay={openDiary}
          next2Label={null}
          prev2Label={null}
          tileContent={({ date, view }) => {
            const key = format(date, "yyyy-MM-dd");
            if (view !== "month" || !diaryKeys.has(key)) return null;
            return <span className="calendarDot" />;
          }}
        />
      </div>
      <button className="primaryButton" onClick={() => setRetroOpen(true)}>
        <Icon name="book" /> 회고 작성하기
      </button>
      <ListSection
        title="최근 다이어리"
        items={diaries.slice(0, 3).map((diary) => ({
          id: diary.dateKey,
          title: diary.dateKey,
          body: `${diary.emotionEmoji} 기록이 정리되어 있어요.`,
          onClick: () => openDiary(new Date(diary.dateKey)),
        }))}
      />
      <ListSection
        title="최근 회고"
        items={retrospectives.slice(0, 3).map((retro) => ({
          id: String(retro.retrospectiveId),
          title: retro.title,
          body: `${format(new Date(retro.range.startDate), "M/d")} ~ ${format(new Date(retro.range.endDate), "M/d")} · ${typeLabels[retro.type]}`,
          onClick: () => setSelectedRetro(retro),
        }))}
      />

      {sheetOpen ? (
        <BottomSheet onClose={() => setSheetOpen(false)}>
          <h2>다이어리</h2>
          <p className="muted">{format(selectedDate, "M/d")}</p>
          {selectedDiary ? (
            <>
              <h3>{selectedDiary.title}</h3>
              {editing ? (
                <textarea className="markdownEditor" value={draft} onChange={(event) => setDraft(event.target.value)} />
              ) : (
                <article className="markdownPreview">
                  <ReactMarkdown>{selectedDiary.markdown}</ReactMarkdown>
                </article>
              )}
              <div className="sheetActions">
                <button
                  className="dangerButton"
                  onClick={async () => {
                    await mockApi.deleteDiary(dateKey);
                    await onRefresh();
                    setSheetOpen(false);
                  }}
                >
                  삭제
                </button>
                <button
                  className="secondaryButton"
                  onClick={async () => {
                    if (!editing) {
                      setEditing(true);
                      return;
                    }
                    const diary = await mockApi.putDiary(dateKey, draft);
                    setSelectedDiary(diary);
                    setEditing(false);
                    await onRefresh();
                  }}
                >
                  {editing ? "저장" : "수정"}
                </button>
              </div>
            </>
          ) : (
            <div className="emptyState">
              <p>오늘의 기록이 없습니다!</p>
              <button className="primaryButton" onClick={onOpenHome}>
                기록하러 가기
              </button>
            </div>
          )}
        </BottomSheet>
      ) : null}

      {retroOpen ? (
        <RetrospectiveFlow
          onClose={() => setRetroOpen(false)}
          onCreated={async (petUpdate) => {
            onPetChange(petUpdate);
            await onRefresh();
          }}
        />
      ) : null}

      {selectedRetro ? (
        <BottomSheet onClose={() => setSelectedRetro(null)}>
          <h2>회고</h2>
          <p className="muted">
            {format(new Date(selectedRetro.range.startDate), "M/d")} ~{" "}
            {format(new Date(selectedRetro.range.endDate), "M/d")}
          </p>
          <h3>{selectedRetro.title}</h3>
          <article className="markdownPreview">
            <ReactMarkdown>{selectedRetro.markdown}</ReactMarkdown>
          </article>
          <div className="tagRow">
            {selectedRetro.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
          <div className="sheetActions">
            <button className="secondaryButton" onClick={() => navigator.clipboard.writeText(selectedRetro.markdown)}>
              복사
            </button>
          </div>
        </BottomSheet>
      ) : null}
    </section>
  );
}

function RetrospectiveFlow({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (petUpdate: PetState) => Promise<void>;
}) {
  const [rangeMode, setRangeMode] = useState("최근 3일");
  const [type, setType] = useState<RetrospectiveType>("woowacourse");
  const [selectedOptions, setSelectedOptions] = useState<string[]>(["삽질과 해결 중심"]);
  const [result, setResult] = useState("");
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);

  function requestBody(): RetrospectiveRequest {
    const now = new Date();
    if (rangeMode === "오늘") {
      return {
        startDate: format(now, "yyyy-MM-dd"),
        endDate: format(now, "yyyy-MM-dd"),
        type,
        promptOptions: selectedOptions,
      };
    }
    if (rangeMode === "이번 주") {
      return {
        startDate: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        endDate: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        type,
        promptOptions: selectedOptions,
      };
    }
    return {
      startDate: format(subDays(now, 2), "yyyy-MM-dd"),
      endDate: format(now, "yyyy-MM-dd"),
      type,
      promptOptions: selectedOptions,
    };
  }

  return (
    <BottomSheet onClose={onClose}>
      <h2>회고 작성하기</h2>
      <div className="choiceGroup">
        {["오늘", "최근 3일", "이번 주"].map((item) => (
          <button key={item} className={rangeMode === item ? "selected" : ""} onClick={() => setRangeMode(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="choiceGroup">
        {(Object.keys(typeLabels) as RetrospectiveType[]).map((item) => (
          <button key={item} className={type === item ? "selected" : ""} onClick={() => setType(item)}>
            {typeLabels[item]}
          </button>
        ))}
      </div>
      <div className="choiceGroup wrap">
        {promptOptions.map((item) => (
          <button
            key={item}
            className={selectedOptions.includes(item) ? "selected" : ""}
            onClick={() =>
              setSelectedOptions((current) =>
                current.includes(item) ? current.filter((option) => option !== item) : [...current, item],
              )
            }
          >
            {item}
          </button>
        ))}
      </div>
      <button
        className="primaryButton"
        disabled={generating}
        onClick={async () => {
          setGenerating(true);
          const response = await mockApi.postRetrospectives(requestBody());
          setResult(response.markdown);
          setTitle(response.title);
          await onCreated(response.petUpdate);
          setGenerating(false);
        }}
      >
        {generating ? "쌓인 기록을 회고 글로 엮고 있어요" : "생성하기"}
      </button>
      {result ? (
        <>
          <h3>{title}</h3>
          <article className="markdownPreview">
            <ReactMarkdown>{result}</ReactMarkdown>
          </article>
          <div className="sheetActions">
            <button className="secondaryButton" onClick={() => navigator.clipboard.writeText(result)}>
              복사
            </button>
            <button
              className="secondaryButton"
              onClick={() => {
                const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `${title}.md`;
                anchor.click();
                URL.revokeObjectURL(url);
              }}
            >
              Markdown 다운로드
            </button>
          </div>
          <p className="platformGuide">벨로그와 티스토리는 Markdown 그대로, 네이버블로그는 본문을 복사해 붙여넣으면 됩니다.</p>
        </>
      ) : null}
    </BottomSheet>
  );
}

function ListSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; title: string; body: string; onClick: () => void }>;
}) {
  return (
    <section className="listSection">
      <div className="sectionTitle">
        <h2>{title}</h2>
        <button>모두 보기</button>
      </div>
      {items.map((item) => (
        <button className="listCard" key={item.id} onClick={item.onClick}>
          <strong>{item.title}</strong>
          <span>{item.body}</span>
        </button>
      ))}
    </section>
  );
}

function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="sheetOverlay" role="dialog" aria-modal="true">
      <button className="sheetBackdrop" aria-label="닫기" onClick={onClose} />
      <section className="bottomSheet">
        <button className="sheetHandle" aria-label="닫기" onClick={onClose} />
        {children}
      </section>
    </div>
  );
}

function BottomNav({ activeTab, onChange }: { activeTab: TabKey; onChange: (tab: TabKey) => void }) {
  const tabs: Array<{ key: TabKey; label: string; icon: "home" | "pet" | "archive" }> = [
    { key: "home", label: "Home", icon: "home" },
    { key: "pet", label: "Pet", icon: "pet" },
    { key: "archive", label: "Archive", icon: "archive" },
  ];

  return (
    <nav className="bottomNav">
      {tabs.map((tab) => (
        <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => onChange(tab.key)}>
          <Icon name={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default App;
