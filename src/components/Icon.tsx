export type IconName = "home" | "pet" | "archive" | "send" | "mic" | "spark" | "book";

const PATHS: Record<IconName, string> = {
  home: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z",
  pet: "M8.5 11.5c-1.38 0-2.5-1.34-2.5-3s1.12-3 2.5-3 2.5 1.34 2.5 3-1.12 3-2.5 3Zm7 0c-1.38 0-2.5-1.34-2.5-3s1.12-3 2.5-3 2.5 1.34 2.5 3-1.12 3-2.5 3ZM5 17.3c0-2.1 2.26-3.8 5.05-3.8.9 0 1.72.18 2.45.5.73-.32 1.55-.5 2.45-.5 2.79 0 5.05 1.7 5.05 3.8 0 1.62-1.2 2.7-2.8 2.7-1.37 0-2.35-.7-4.7-.7s-3.33.7-4.7.7C6.2 20 5 18.92 5 17.3Z",
  archive: "M5 4h14v16H5V4Zm3 4h8M8 12h8M8 16h5",
  send: "M3 20 21 12 3 4v6l11 2-11 2v6Z",
  mic: "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0M12 17v4",
  spark: "M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z",
  book: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Zm0 0V21",
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path d={PATHS[name]} />
    </svg>
  );
}
