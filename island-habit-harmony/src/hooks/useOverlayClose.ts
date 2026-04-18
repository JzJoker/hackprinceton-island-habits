import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Shared hook for all overlays.
 * - Handles Escape key to close
 * - Provides a `close()` fn that plays exit animation before calling onClose
 * - Exposes `closing` boolean so the overlay can apply animate-out classes
 */
export function useOverlayClose(onClose: () => void, duration = 160) {
  const [closing, setClosing] = useState(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      onCloseRef.current();
      setClosing(false);
    }, duration);
  }, [closing, duration]);

  // Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return { closing, close };
}
