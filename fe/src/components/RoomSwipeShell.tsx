"use client";

import { ReactNode, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  previousHref?: string | null;
  nextHref?: string | null;
  previousLabel?: string | null;
  nextLabel?: string | null;
  children: ReactNode;
};

export default function RoomSwipeShell({ previousHref, nextHref, previousLabel, nextLabel, children }: Props) {
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeHandled = useRef(false);

  const canGoPrev = !!previousHref;
  const canGoNext = !!nextHref;

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      swipeHandled.current = false;
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (swipeHandled.current) return;
      if (touchStartX.current == null || touchStartY.current == null) return;

      const touch = event.touches[0];
      if (!touch) return;

      const dx = touch.clientX - touchStartX.current;
      const dy = touch.clientY - touchStartY.current;

      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;

      if (dx < 0 && nextHref) {
        swipeHandled.current = true;
        touchStartX.current = null;
        touchStartY.current = null;
        router.push(nextHref);
      }

      if (dx > 0 && previousHref) {
        swipeHandled.current = true;
        touchStartX.current = null;
        touchStartY.current = null;
        router.push(previousHref);
      }
    };

    const clearTouchState = () => {
      touchStartX.current = null;
      touchStartY.current = null;
      swipeHandled.current = false;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true, capture: true });
    document.addEventListener("touchend", clearTouchState, { passive: true, capture: true });
    document.addEventListener("touchcancel", clearTouchState, { passive: true, capture: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart, true);
      document.removeEventListener("touchmove", handleTouchMove, true);
      document.removeEventListener("touchend", clearTouchState, true);
      document.removeEventListener("touchcancel", clearTouchState, true);
    };
  }, [previousHref, nextHref, router]);

  const mobileHint = useMemo(() => {
    if (canGoPrev && canGoNext) return "Vuốt trái/phải để chuyển phòng";
    if (canGoNext) return "Vuốt trái để sang phòng tiếp theo";
    if (canGoPrev) return "Vuốt phải để quay lại phòng trước";
    return "";
  }, [canGoNext, canGoPrev]);

  return (
    <div className="touch-pan-y select-none">
      {mobileHint ? (
        <div className="sticky top-3 z-10 mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-[#dfe6fb] bg-white/90 px-3 py-2 text-xs font-semibold text-[#4f67b0] shadow-sm backdrop-blur sm:hidden">
          <span>⇆</span>
          <span>{mobileHint}</span>
        </div>
      ) : null}

      {children}

      {(canGoPrev || canGoNext) ? (
        <div className="sticky bottom-3 z-10 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#dfe6fb] bg-white/95 px-3 py-2 shadow-[0_12px_30px_rgba(72,93,160,0.12)] backdrop-blur sm:hidden">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (previousHref) {
                console.log('Mobile: Navigating to previous:', previousHref);
                router.push(previousHref);
              }
            }}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-semibold text-[#4361af] transition-colors active:bg-[#eef3ff] disabled:opacity-40"
          >
            <span className="text-lg">‹</span>
            <span className="min-w-0 truncate">{previousLabel || "Phòng trước"}</span>
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <button
            type="button"
            disabled={!canGoNext}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (nextHref) {
                console.log('Mobile: Navigating to next:', nextHref);
                router.push(nextHref);
              }
            }}
            className="flex min-w-0 flex-1 items-center justify-end gap-2 rounded-xl px-2 py-2 text-right text-sm font-semibold text-[#4361af] transition-colors active:bg-[#eef3ff] disabled:opacity-40"
          >
            <span className="min-w-0 truncate">{nextLabel || "Phòng sau"}</span>
            <span className="text-lg">›</span>
          </button>
        </div>
      ) : null}

      {(canGoPrev || canGoNext) ? (
        <div className="pointer-events-none fixed inset-y-1/2 left-0 right-0 z-[9999] hidden -translate-y-1/2 sm:block">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (previousHref) {
                  console.log('Navigating to previous:', previousHref);
                  router.push(previousHref);
                }
              }}
              className="pointer-events-auto rounded-full border-2 border-[#4361af] bg-white px-5 py-3 text-base font-bold text-[#4361af] shadow-xl backdrop-blur transition-all hover:bg-[#4361af] hover:text-white hover:shadow-2xl active:scale-95 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-50"
            >
              ‹ {previousLabel || "Phòng trước"}
            </button>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (nextHref) {
                  console.log('Navigating to next:', nextHref);
                  router.push(nextHref);
                }
              }}
              className="pointer-events-auto rounded-full border-2 border-[#4361af] bg-white px-5 py-3 text-base font-bold text-[#4361af] shadow-xl backdrop-blur transition-all hover:bg-[#4361af] hover:text-white hover:shadow-2xl active:scale-95 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-50"
            >
              {nextLabel || "Phòng sau"} ›
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
