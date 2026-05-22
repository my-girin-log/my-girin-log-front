import type { TabKey } from "../types";
import { Icon, type IconName } from "./Icon";

const TABS: Array<{ key: TabKey; label: string; icon: IconName }> = [
  { key: "home", label: "Home", icon: "home" },
  { key: "pet", label: "Pet", icon: "pet" },
  { key: "archive", label: "Archive", icon: "archive" },
];

export function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <nav className="bottomNav" aria-label="주요 탭">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={activeTab === tab.key ? "active" : ""}
          aria-pressed={activeTab === tab.key}
          aria-label={tab.label}
          onClick={() => onChange(tab.key)}
        >
          <Icon name={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
