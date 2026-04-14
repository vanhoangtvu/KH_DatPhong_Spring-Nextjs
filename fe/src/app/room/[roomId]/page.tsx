"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RoomDetailClient from "./RoomDetailClient";

type RoomDetailResponse = {
  roomId: number;
  roomType: string;
  roomPrice: number;
  areaName: string;
  displayName: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  videoUrl: string;
  features: string[];
  slots: { time: string; price: string; status: string }[];
  booked: boolean;
};

type HomePageResponse = {
  roomLists: Record<string, { roomId: number; name: string }[]>;
  discountCode?: string;
  discountPercent?: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const getSelectedDateStorageKey = (roomId: string) => `fiin-home-room-date-${roomId}`;

export default function RoomDetailPage() {
  const params = useParams();
  const roomIdParam = params.roomId as string;
  const [room, setRoom] = useState<RoomDetailResponse | null>(null);
  const [allRooms, setAllRooms] = useState<{ roomId: number; name: string }[]>([]);
  const [promoCode, setPromoCode] = useState<string | undefined>(undefined);
  const [promoPercent, setPromoPercent] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !roomIdParam) {
      return;
    }

    const storedDate = window.sessionStorage.getItem(getSelectedDateStorageKey(roomIdParam));
    if (storedDate) {
      setSelectedDate(storedDate);
    }
    setIsHydrated(true);
  }, [roomIdParam]);

  useEffect(() => {
    if (typeof window !== "undefined" && roomIdParam && isHydrated) {
      window.sessionStorage.setItem(getSelectedDateStorageKey(roomIdParam), selectedDate);
    }
  }, [roomIdParam, selectedDate, isHydrated]);

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const roomId = Number(roomIdParam);
        
        console.log('Loading room:', roomId, 'for date:', selectedDate);

        if (isNaN(roomId)) {
          setError("ID phòng không hợp lệ");
          return;
        }

        // Fetch room details with date parameter
        const roomResponse = await fetch(`${API_BASE}/api/public/rooms/${roomId}?date=${selectedDate}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" }
        });

        if (!roomResponse.ok) {
          throw new Error("Không tìm thấy phòng");
        }

        const roomData = await roomResponse.json();
        console.log('Room data loaded:', roomData);
        setRoom(roomData);

        // Fetch all rooms for navigation
        const homeResponse = await fetch(`${API_BASE}/api/public/home-page`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" }
        });

        if (homeResponse.ok) {
          const homeData: HomePageResponse = await homeResponse.json();
          const rooms = Object.values(homeData.roomLists).flat();
          console.log('All rooms loaded:', rooms.length);
          setAllRooms(rooms);
          setPromoCode(homeData.discountCode);
          setPromoPercent(homeData.discountPercent);
        }
      } catch (err) {
        console.error('Error loading room:', err);
        setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [roomIdParam, selectedDate]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f5f7] px-4">
        <div className="text-center">
          <div className="text-2xl font-black text-[#8b5e3c]">Đang tải...</div>
          <p className="mt-2 text-sm text-slate-500">Vui lòng đợi</p>
        </div>
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="min-h-screen bg-[#f4f5f7] px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-[#8b5e3c]">Không tìm thấy phòng</h1>
          <p className="mt-2 text-sm text-slate-500">{error || "Phòng này không tồn tại"}</p>
          <Link href="/" className="mt-4 inline-flex rounded-full border border-[#e2c9ab] bg-[#fffaf2] px-4 py-2 text-sm font-semibold text-[#8b5e3c]">
            ← Quay lại trang chủ
          </Link>
        </div>
      </main>
    );
  }

  return <RoomDetailClient key={`${room.roomId}-${selectedDate}`} room={room} allRooms={allRooms} selectedDate={selectedDate} onDateChange={setSelectedDate} promoCode={promoCode} promoPercent={promoPercent} />;
}
