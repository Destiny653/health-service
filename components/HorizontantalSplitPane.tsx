// components/HorizontantalSplitPane.tsx
import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface HorizontalSplitPaneProps {
  top: React.ReactNode;
  bottom: React.ReactNode;
  initialPercent?: number;
  minPercent?: number;
  maxPercent?: number;
  storageKey?: string;
  className?: string;
}

export function HorizontalSplitPane({
  top,
  bottom,
  initialPercent = 65,
  minPercent = 20,
  maxPercent = 90,
  storageKey,
  className,
}: HorizontalSplitPaneProps) {
  const [heightPercent, setHeightPercent] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return initialPercent;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return Math.min(maxPercent, Math.max(minPercent, parsed));
      }
    } catch {}
    return initialPercent;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null); // Store pointer ID

  const clamp = (value: number) => Math.min(maxPercent, Math.max(minPercent, value));

  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, heightPercent.toString());
      } catch {}
    }
  }, [heightPercent, storageKey]);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const percent = (offsetY / rect.height) * 100;
      setHeightPercent(clamp(percent));
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    // Use the correct pointerId
    if (pointerIdRef.current !== null && dividerRef.current) {
      try {
        dividerRef.current.releasePointerCapture(pointerIdRef.current);
      } catch {
        // Ignore if already released
      }
    }
    pointerIdRef.current = null;
  }, [isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    pointerIdRef.current = e.pointerId; // Store the real pointerId
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    dividerRef.current?.setPointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      return () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleDoubleClick = () => setHeightPercent(initialPercent);

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col h-full overflow-hidden", className)}
      tabIndex={0}
    >
      <div style={{ height: `${heightPercent}%` }} className="overflow-auto min-h-0 flex flex-col">
        {top}
      </div>

      <div
        ref={dividerRef}
        role="separator"
        aria-valuenow={Math.round(heightPercent)}
        aria-valuemin={minPercent}
        aria-valuemax={maxPercent}
        aria-label="Resize panels"
        className={cn(
          "h-2 bg-gray-300 cursor-row-resize relative flex items-center justify-center transition-colors",
          "hover:bg-gray-400 active:bg-blue-500",
          isDragging && "bg-blue-500"
        )}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="absolute inset-x-0 h-1 bg-gray-500 rounded-full w-10 mx-auto" />
      </div>

      <div style={{ height: `${100 - heightPercent}%` }} className="overflow-auto min-h-0 flex flex-col">
        {bottom}
      </div>
    </div>
  );
}