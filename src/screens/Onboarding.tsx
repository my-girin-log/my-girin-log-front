import { useState } from "react";
import { api } from "../api";
import { spriteModules } from "../sprites";
import { delay } from "../utils/async";

export function Onboarding({
  onComplete,
  onSkip,
}: {
  onComplete: () => Promise<void>;
  onSkip?: () => void;
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("우테코기린");
  const [link, setLink] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [rawText, setRawText] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function addLink() {
    const next = link.trim();
    if (!next || sources.includes(next)) return;
    setSources((current) => [...current, next]);
    setLink("");
  }

  async function startLogin() {
    const me = await api.startGithubMockLogin();
    setNickname(me.user.nickname);
    setLoggedIn(true);
  }

  async function submit() {
    setErrorMessage(null);
    setCreating(true);
    try {
      await delay(750);
      await api.postUsersOnboarding({ sources, rawText, nickname });
      await onComplete();
      window.scrollTo({ top: 0 });
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "페르소나 생성에 실패했어요. 잠시 후 다시 시도하거나, 관리자에게 LLM 설정을 확인해 달라고 알려주세요.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="onboarding">
      <div className="progressDots" aria-hidden="true">
        <span className="active" />
        <span className={loggedIn ? "active" : ""} />
        <span className={creating ? "active" : ""} />
      </div>
      <section className="welcomeArt">
        <div className="welcomeBubble">안녕! 나는 너의 성장을 기록하는 실록이야.</div>
        <div className="welcomeCircle">
          <img src={spriteModules["./giraffe_sprites/1-calf-good-1.png"]} alt="실록이" />
        </div>
      </section>
      <h1>반가워요!</h1>
      <p className="muted">지난 기록을 읽고, 함께 성장할 페르소나를 만들어볼까요?</p>

      {!loggedIn ? (
        <button className="primaryButton dark" onClick={startLogin}>
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
                inputMode="url"
              />
              <button onClick={addLink}>추가</button>
            </div>
          </label>
          <div className="chips">
            {sources.map((source) => (
              <button
                key={source}
                className="chip"
                onClick={() =>
                  setSources((current) => current.filter((item) => item !== source))
                }
              >
                {source} ✕
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
          <button className="primaryButton" disabled={creating} onClick={submit}>
            {creating ? "글쓰기 습관을 읽고 있어요…" : "페르소나 만들기"}
          </button>
          {errorMessage ? (
            <>
              <p className="formError">{errorMessage}</p>
              {onSkip ? (
                <button type="button" className="secondaryButton" onClick={onSkip}>
                  그냥 넘어가기
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
