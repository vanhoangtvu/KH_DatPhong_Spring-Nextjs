"use client";

import { ReactNode, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  previousHref?: string | null;
  nextHref?: string | null;
  previousLabel?: string | null;
  nextLabel?: string | null;
  children: ReactNode;
};

export default function RoomSwipeArea({ previousHref, nextHref, previousLabel, nextLabel, children }: Props) {
  const router = useRouter();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const handled = useRef(false);

  const goPrev = () => {
    if (previousHref) router.push(previousHref);
  };

  const goNext = () => {
    if (nextHref) router.push(nextHref);
  };

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    handled.current = false;
    startX.current = touch.clientX;
    startY.current = touch.clientY;
  };

  const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (handled.current || startX.current == null || startY.current == null) return;
    const touch = event.touches[0];
    if (!touch) return;

    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy)) return;

    handled.current = true;
    startX.current = null;
    startY.current = null;

    if (dx < 0) goNext();
    if (dx > 0) goPrev();
  };

  const clear = () => {
    handled.current = false;
    startX.current = null;
    startY.current = null;
  };

  return (
    <div
      className="relative touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={clear}
      onTouchCancel={clear}
    >
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-2 sm:hidden">
        <button
          type="button"
          onClick={goPrev}
          disabled={!previousHref}
          className="pointer-events-auto h-12 w-12 rounded-full bg-white/75 text-xl font-black text-[#4361af] shadow-sm backdrop-blur disabled:opacity-30"
          aria-label={previousLabel || "Phòng trước"}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!nextHref}
          className="pointer-events-auto h-12 w-12 rounded-full bg-white/75 text-xl font-black text-[#4361af] shadow-sm backdrop-blur disabled:opacity-30"
          aria-label={nextLabel || "Phòng sau"}
        >
          ›
        </button>
      </div>

      {children}
    </div>
  );
}
