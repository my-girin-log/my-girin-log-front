import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { typeLabels } from "../constants";
import type { Retrospective } from "../types";
import { BottomSheet } from "./BottomSheet";

export function RetrospectiveSheet({
  retro,
  onClose,
}: {
  retro: Retrospective;
  onClose: () => void;
}) {
  function copy() {
    navigator.clipboard.writeText(retro.markdown);
  }

  function downloadMarkdown() {
    const blob = new Blob([retro.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${retro.title}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <BottomSheet onClose={onClose} ariaLabel="회고 상세">
      <h2>회고</h2>
      <p className="muted">
        {format(new Date(retro.range.startDate), "M/d")} ~{" "}
        {format(new Date(retro.range.endDate), "M/d")} · {typeLabels[retro.type]}
      </p>
      <h3>{retro.title}</h3>
      <article className="markdownPreview">
        <ReactMarkdown>{retro.markdown}</ReactMarkdown>
      </article>
      {retro.tags.length > 0 ? (
        <div className="tagRow">
          {retro.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      ) : null}
      <div className="sheetActions">
        <button className="secondaryButton" onClick={copy}>
          복사
        </button>
        <button className="secondaryButton" onClick={downloadMarkdown}>
          Markdown 다운로드
        </button>
      </div>
    </BottomSheet>
  );
}
