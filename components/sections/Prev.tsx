'use client'
import React, { useRef, useState, useEffect, useCallback } from "react";

type SplitPaneProps = {
  storageKey?: string;
  initialPercent?: number; // 0-100
  minPercent?: number;
  maxPercent?: number;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export default function SplitPane({
  storageKey = "splitpane:percent",
  initialPercent = 50,
  minPercent = 20,
  maxPercent = 80,
  left,
  right,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [percent, setPercent] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? Math.max(minPercent, Math.min(maxPercent, Number(raw))) : initialPercent;
    } catch {
      return initialPercent;
    }
  });

  // helpers
  const clamp = (v: number) => Math.max(minPercent, Math.min(maxPercent, v));

  // set percent and persist
  const setPercentAndSave = useCallback((p: number) => {
    const clamped = clamp(p);
    setPercent(clamped);
    try { localStorage.setItem(storageKey, String(clamped)); } catch {}
  }, [minPercent, maxPercent, storageKey]);

  // pointer move logic
  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX;
      const pct = ((x - rect.left) / rect.width) * 100;
      setPercentAndSave(pct);
    }
    function onPointerUp() { draggingRef.current = false; document.body.style.cursor = ""; }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [setPercentAndSave]);

  // start dragging
  const startDrag = (ev: React.PointerEvent) => {
    (ev.target as Element).setPointerCapture(ev.pointerId);
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
  };

  // touch-friendly: pointer events handle touch

  // keyboard actions for the handle
  const onHandleKeyDown = (e: React.KeyboardEvent) => {
    const stepPx = 10; // pixels per arrow press
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const stepPercent = (stepPx / rect.width) * 100;
    if (e.key === "ArrowLeft") { e.preventDefault(); setPercentAndSave(percent - stepPercent); }
    if (e.key === "ArrowRight") { e.preventDefault(); setPercentAndSave(percent + stepPercent); }
    if (e.key === "Home") { e.preventDefault(); setPercentAndSave(minPercent); }
    if (e.key === "End") { e.preventDefault(); setPercentAndSave(maxPercent); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); /* could toggle collapse */ }
  };

  // double click resets to initialPercent
  const onHandleDoubleClick = () => setPercentAndSave(initialPercent);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-row select-none overflow-hidden"
      role="group"
      aria-label="Resizable split pane"
    >
      <div
        className="h-full"
        style={{ width: `${percent}%`, minWidth: `${minPercent}%`, maxWidth: `${maxPercent}%` }}
      >
        <div className="h-full overflow-auto">{left ?? <div className="p-4">Left pane</div>}</div>
      </div>

      {/* Drag handle */}
      <div
        role="separator"
        tabIndex={0}
        aria-valuemin={minPercent}
        aria-valuemax={maxPercent}
        aria-valuenow={Math.round(percent)}
        aria-label="Resize panels"
        onPointerDown={startDrag}
        onDoubleClick={onHandleDoubleClick}
        onKeyDown={onHandleKeyDown}
        className="relative flex items-center justify-center w-3 md:w-4 cursor-col-resize touch-none"
      >
        {/* Visual bar and hit target */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-300 dark:bg-gray-600" />
        {/* larger invisible hit area for easier grabbing */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-3 h-12 rounded-md bg-transparent hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600 transition" />
        </div>
      </div>

      <div className="h-full flex-1 min-w-0">
        <div className="h-full overflow-auto">{right ?? <div className="p-4">Right pane</div>}</div>
      </div>
    </div>
  );
}
