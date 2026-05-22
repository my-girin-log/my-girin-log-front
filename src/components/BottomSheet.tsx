import { useEffect, useRef, type ReactNode } from "react";

export function BottomSheet({
  children,
  onClose,
  ariaLabel = "바텀 시트",
}: {
  children: ReactNode;
  onClose: () => void;
  ariaLabel?: string;
}) {
  const sheetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="sheetOverlay" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <button className="sheetBackdrop" aria-label="닫기" onClick={onClose} />
      <section className="bottomSheet" ref={sheetRef}>
        <button className="sheetHandle" aria-label="닫기" onClick={onClose} />
        {children}
      </section>
    </div>
  );
}
