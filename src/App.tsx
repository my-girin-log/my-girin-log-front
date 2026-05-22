import { useEffect, useState } from "react";
import { mockApi } from "./api/mockApi";
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

  async function refresh(dateKey = selectedDateKey) {
    const [me, activeSession, diaryList, retroList] = await Promise.all([
      mockApi.getUsersMe(),
      mockApi.getChatsActive(dateKey),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="appShell centerOnly">내가그린기린기록을 깨우는 중...</div>;
  }

  if (!user?.hasPersona) {
    return <Onboarding onComplete={() => refresh(selectedDateKey)} />;
  }

  async function handleRollup() {
    await mockApi.postDiariesRollup(selectedDateKey);
    await refresh(selectedDateKey);
    setAutoOpenDateKey(selectedDateKey);
    setActiveTab("archive");
  }

  async function handleOpenHomeFromArchive(dateKey: string) {
    setSelectedDateKey(dateKey);
    const nextSession = await mockApi.getChatsActive(dateKey);
    setSession(nextSession);
    setActiveTab("home");
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="appShell">
      <header className="appHeader">
        <h1>내가그린기린기록</h1>
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
            onRollup={handleRollup}
            selectedDateKey={selectedDateKey}
          />
        ) : null}
        {activeTab === "pet" && pet ? <PetScreen pet={pet} diaries={diaries} /> : null}
        {activeTab === "archive" && pet ? (
          <ArchiveScreen
            diaries={diaries}
            retrospectives={retrospectives}
            onRefresh={refresh}
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
