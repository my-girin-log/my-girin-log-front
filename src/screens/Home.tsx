import { useEffect, useRef, useState, type FormEvent } from "react";
import { format, parseISO } from "date-fns";
import { mockApi } from "../api/mockApi";
import { Icon } from "../components/Icon";
import { useSpriteFrame } from "../hooks/useSpriteFrame";
import { formatDateKey } from "../utils/date";
import type { DailyChatSession, PetState } from "../types";

export function HomeScreen({
  pet,
  session,
  onPetChange,
  onSessionChange,
  onRollup,
  selectedDateKey,
}: {
  pet: PetState;
  session: DailyChatSession;
  onPetChange: (pet: PetState) => void;
  onSessionChange: (session: DailyChatSession) => void;
  onRollup: () => Promise<void>;
  selectedDateKey: string;
}) {
  const sprite = useSpriteFrame(pet);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [rolling, setRolling] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session.messages.length]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = message.trim();
    if (!content || sending) return;
    setMessage("");
    setSending(true);
    try {
      await mockApi.postChatsMessage({
        sessionId: session.id,
        dateKey: selectedDateKey,
        content,
      });
      const [nextSession, me] = await Promise.all([
        mockApi.getChatsActive(selectedDateKey),
        mockApi.getUsersMe(),
      ]);
      onSessionChange(nextSession);
      onPetChange(me.pet);
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  }

  async function handleRollup() {
    if (rolling) return;
    setRolling(true);
    try {
      await onRollup();
    } finally {
      setRolling(false);
    }
  }

  const userMessageCount = session.messages.filter((m) => m.role === "user").length;
  const canRollup = userMessageCount >= 1;

  return (
    <section className="screen homeScreen">
      <div className="statusLine">
        <span className="statusDot" />
        {formatDateKey(selectedDateKey)} 기록 중
      </div>
      <div className="interactionBand">
        <img src={sprite} alt="실록이" />
        <div>
          <p>
            {session.messages.length > 2
              ? "질문 대답해줘!"
              : `${formatDateKey(selectedDateKey)} 어땠어?`}
          </p>
          <span>{format(parseISO(selectedDateKey), "yyyy.MM.dd")} · SESSION LOG</span>
        </div>
      </div>
      <div className="chatLog">
        {session.messages.map((item) => (
          <article key={item.id} className={`messageBubble ${item.role}`}>
            <span className="speakerLabel">{item.role === "user" ? "[USER]" : "[SILOK]"}</span>
            <p>{item.content}</p>
            <time>{format(new Date(item.createdAt), "a h:mm")}</time>
          </article>
        ))}
        {canRollup ? (
          <button
            type="button"
            className="endSessionButton"
            onClick={handleRollup}
            disabled={rolling}
          >
            <Icon name="spark" />
            {rolling ? "정리 중…" : "현재까지 회고 요약해서 끝내기"}
          </button>
        ) : null}
        <div ref={logEndRef} />
      </div>
      <form className="composer" onSubmit={submit}>
        <button type="button" className="iconButton" aria-label="음성 녹음">
          <Icon name="mic" />
        </button>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={`${formatDateKey(selectedDateKey)}의 생각을 적어보세요...`}
          enterKeyHint="send"
          aria-label="기록 입력"
        />
        <button className="sendButton" type="submit" aria-label="전송" disabled={sending}>
          <Icon name="send" />
        </button>
      </form>
    </section>
  );
}
