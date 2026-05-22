import { useEffect, useState } from "react";
import { api } from "./api";
import { BottomNav } from "./components/BottomNav";
import { ArchiveScreen } from "./screens/Archive";
import { HomeScreen } from "./screens/Home";
import { Onboarding } from "./screens/Onboarding";
import { PetScreen } from "./screens/Pet";
import { todayKey } from "./utils/date";
import type {
  DailyChatSession,
  DiarySummary,
  PetState,
  Retrospective,
  TabKey,
  User,
} from "./types";

/**
 * 첫 진입 로딩 화면.
 *  Render 무료 플랜은 15분 idle 후 sleep → 첫 호출 ~50초 cold start.
 *  메시지를 10초/30초 시점에 바꿔서 사용자가 "멈췄나?" 의심 안 하게.
 */
function LoadingScreen() {
  const [hint, setHint] = useState<string>("내가그린기린기록을 깨우는 중...");
  useEffect(() => {
    const t1 = window.setTimeout(
      () => setHint("서버가 깨어나는 중이에요. 처음 진입은 최대 50초 걸려요..."),
      8000,
    );
    const t2 = window.setTimeout(() => setHint("거의 다 됐어요. 잠시만 더..."), 25000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);
  return <div className="appShell centerOnly">{hint}</div>;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [pet, setPet] = useState<PetState | null>(null);
  const [session, setSession] = useState<DailyChatSession | null>(null);
  const [diaries, setDiaries] = useState<DiarySummary[]>([]);
  const [retrospectives, setRetrospectives] = useState<Retrospective[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey());
  const [autoOpenDateKey, setAutoOpenDateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [skippedOnboarding, setSkippedOnboarding] = useState(false);

  async function refresh(dateKey = selectedDateKey) {
    const [me, activeSession, diaryList, retroList] = await Promise.all([
      api.getUsersMe(),
      api.getChatsActive(dateKey),
      api.getDiaries(),
      api.getRetrospectives(),
    ]);
    setUser(me.user);
    setPet(me.pet);
    setSession(activeSession);
    setDiaries(diaryList.diaries);
    setRetrospectives(retroList.retrospectives);
    setLoading(false);
    return {
      diaries: diaryList.diaries,
      retrospectives: retroList.retrospectives,
    };
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user?.hasPersona && !skippedOnboarding) {
    return (
      <Onboarding
        onComplete={async () => {
          await refresh(selectedDateKey);
        }}
        onSkip={() => setSkippedOnboarding(true)}
      />
    );
  }

  async function handleRollup() {
    await api.postDiariesRollup(selectedDateKey);
    const { diaries: latest } = await refresh(selectedDateKey);
    setActiveTab("archive");
    // 백엔드 rollup은 06시 KST 경계 기준 어제 세션만 처리하기도 함.
    // 오늘 다이어리가 실제 만들어졌을 때만 자동으로 열기 (404 방지).
    if (latest.some((d) => d.dateKey === selectedDateKey)) {
      setAutoOpenDateKey(selectedDateKey);
    }
  }

  async function handleOpenHomeFromArchive(dateKey: string) {
    setSelectedDateKey(dateKey);
    const nextSession = await api.getChatsActive(dateKey);
    setSession(nextSession);
    setActiveTab("home");
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="appShell">
      <header className="appHeader">
        <h1>내가그린기린기록</h1>
        <button className="iconButton" aria-label="프로필">
          <span>{user?.nickname.slice(0, 1) ?? "익"}</span>
        </button>
      </header>

      <main className="appMain">
        {activeTab === "home" && session && pet ? (
          <HomeScreen
            pet={pet}
            session={session}
            onPetChange={setPet}
            onSessionChange={setSession}
            onRollup={handleRollup}
            selectedDateKey={selectedDateKey}
          />
        ) : null}
        {activeTab === "pet" && pet ? <PetScreen pet={pet} diaries={diaries} onPetChange={setPet} /> : null}
        {activeTab === "archive" && pet ? (
          <ArchiveScreen
            pet={pet}
            diaries={diaries}
            retrospectives={retrospectives}
            onRefresh={async () => {
              await refresh();
            }}
            onPetChange={setPet}
            autoOpenDateKey={autoOpenDateKey}
            onAutoOpened={() => setAutoOpenDateKey(null)}
            onOpenHome={handleOpenHomeFromArchive}
          />
        ) : null}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;
