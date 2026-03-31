"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type AreaItem = {
  name: string;
  subtitle: string;
};

type IntroCard = {
  title: string;
  subtitle: string;
  image: string;
};

type ShowcaseRoom = {
  title: string;
  cover: string;
  grid: string[];
  times: string[];
};

type TimeSlot = {
  time: string;
  price: string;
  status: string;
};

type RoomItem = {
  roomId: number;
  name: string;
  image: string;
  gallery: string[];
  videoUrl: string;
  features: string[];
  slots: TimeSlot[];
};

type LegendItem = {
  label: string;
  color: string;
};

type HomePageResponse = {
  brandName: string;
  brandSubtitle: string;
  hotline: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  introSectionTitle: string;
  introSectionDescription: string;
  areas: AreaItem[];
  introCards: IntroCard[];
  showcaseRooms: ShowcaseRoom[];
  days: string[];
  bookingSectionTitle: string;
  bookingSectionSubtitle: string;
  roomLists: Record<string, RoomItem[]>;
  legend: LegendItem[];
  acceptingBookings: boolean;
  bookingNotice: string;
  footerDescription: string;
  footerTags: string[];
  footerLinks: string[];
  footerLinkUrls: string[];
};

type BookingFormState = {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  receiveBookingEmail: boolean;
  guestCount: number;
  transportType: "Xe may" | "Xe o to";
  idCardFrontImage: string;
  idCardBackImage: string;
  discountCode: string;
  note: string;
  acceptedTerms: boolean;
};

const EMPTY_BOOKING_FORM: BookingFormState = {
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  receiveBookingEmail: true,
  guestCount: 2,
  transportType: "Xe may",
  idCardFrontImage: "",
  idCardBackImage: "",
  discountCode: "",
  note: "",
  acceptedTerms: false,
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const getRoomDetailPath = (room: RoomItem) => `/room/${room.roomId}`;

const getLegendStyles = (label: string) => {
  if (label === "Đã Đặt") {
    return {
      pill: "border-slate-300 bg-slate-100 text-slate-700",
      dot: "bg-slate-400",
    };
  }
  if (label === "Còn Trống") {
    return {
      pill: "border-sky-200 bg-sky-50 text-sky-700",
      dot: "bg-sky-400",
    };
  }
  if (label === "Đang chọn") {
    return {
      pill: "border-blue-300 bg-blue-50 text-blue-700",
      dot: "bg-blue-500",
    };
  }
  return {
    pill: "border-[#d7e3ff] bg-white text-[#5e75b8]",
    dot: "bg-[#9eb0e0]",
  };
};

export default function HomePage() {
  const router = useRouter();
  const showcaseTouchStartX = useRef<number | null>(null);
  const showcaseTouchStartY = useRef<number | null>(null);
  const showcaseSwipeHandled = useRef(false);
  const [pageData, setPageData] = useState<HomePageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormState>(EMPTY_BOOKING_FORM);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);

  const loadHomePage = async (dayLabel?: string) => {
    try {
      setLoading(true);
      setError(null);
      const query = dayLabel ? `?dayLabel=${encodeURIComponent(dayLabel)}` : "";
      const response = await fetch(`${API_BASE}/api/public/home-page${query}`);
      if (!response.ok) {
        throw new Error(`Không tải được dữ liệu (${response.status})`);
      }
      const data: HomePageResponse = await response.json();
      setPageData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHomePage();
  }, []);

  useEffect(() => {
    if (!selectedDay) return;
    void loadHomePage(selectedDay);
  }, [selectedDay]);

  useEffect(() => {
    if (!pageData) return;

    if (!selectedArea || !pageData.areas.some((area) => area.name === selectedArea)) {
      setSelectedArea(pageData.areas[0]?.name ?? "");
    }

    if (!selectedDay || !pageData.days.includes(selectedDay)) {
      setSelectedDay(pageData.days[0] ?? "");
    }
  }, [pageData, selectedArea, selectedDay]);

  const selectedIndex = useMemo(() => {
    if (!pageData) return 0;
    const idx = pageData.areas.findIndex((area) => area.name === selectedArea);
    return idx >= 0 ? idx : 0;
  }, [pageData, selectedArea]);

  const bookingLocked = !pageData?.acceptingBookings;

  useEffect(() => {
    if (bookingLocked) {
      setShowBookingForm(false);
    }
  }, [bookingLocked]);

  const footerLinks = pageData?.footerLinks ?? [];
  const footerLinkUrls = pageData?.footerLinkUrls ?? [];

  const selectedShowcase = pageData?.showcaseRooms[selectedIndex] ?? pageData?.showcaseRooms[0];
  const selectedRoomList = pageData?.roomLists[selectedArea] ?? [];
  const selectedBranchRoomCount = selectedRoomList.length;
  const totalRoomCount = pageData ? Object.values(pageData.roomLists).reduce((sum, rooms) => sum + rooms.length, 0) : 0;
  const selectedRoomCount = Object.keys(selectedSlots).length;
  const selectedTotal = selectedRoomList.reduce((sum, room) => {
    const slotTime = selectedSlots[room.name];
    const slot = room.slots.find((item) => item.time === slotTime);
    const amount = slot ? Number(slot.price.replace("k", "")) : 0;
    return sum + amount;
  }, 0);

  const selectedBookingItem = useMemo(() => {
    for (const room of selectedRoomList) {
      const pickedTime = selectedSlots[room.name];
      if (!pickedTime) continue;
      const slot = room.slots.find((item) => item.time === pickedTime);
      if (!slot) continue;
      return {
        room,
        slot,
      };
    }
    return null;
  }, [selectedRoomList, selectedSlots]);

  const handleSlotPick = (roomName: string, slotTime: string) => {
    setSelectedSlots((prev) => ({
      ...prev,
      [roomName]: prev[roomName] === slotTime ? "" : slotTime,
    }));
  };

  const moveAreaBy = (delta: number) => {
    if (!pageData || pageData.areas.length === 0) return;
    const nextIndex = (selectedIndex + delta + pageData.areas.length) % pageData.areas.length;
    setSelectedArea(pageData.areas[nextIndex].name);
  };

  const handleShowcaseTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    showcaseSwipeHandled.current = false;
    showcaseTouchStartX.current = touch.clientX;
    showcaseTouchStartY.current = touch.clientY;
  };

  const handleShowcaseTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (showcaseSwipeHandled.current) return;
    if (showcaseTouchStartX.current == null || showcaseTouchStartY.current == null) return;

    const touch = event.touches[0];
    if (!touch) return;

    const dx = touch.clientX - showcaseTouchStartX.current;
    const dy = touch.clientY - showcaseTouchStartY.current;

    if (Math.abs(dx) < 30 || Math.abs(dx) < Math.abs(dy)) return;

    showcaseSwipeHandled.current = true;
    showcaseTouchStartX.current = null;
    showcaseTouchStartY.current = null;

    if (dx < 0) {
      moveAreaBy(1);
    } else {
      moveAreaBy(-1);
    }
  };

  const resetShowcaseTouch = () => {
    showcaseTouchStartX.current = null;
    showcaseTouchStartY.current = null;
    showcaseSwipeHandled.current = false;
  };

  const parseDayToDate = (dayLabel: string) => {
    const now = new Date();
    if (dayLabel.toLowerCase().includes("hôm nay")) {
      return now.toISOString().slice(0, 10);
    }
    const plusOne = new Date(now);
    plusOne.setDate(now.getDate() + 1);
    return plusOne.toISOString().slice(0, 10);
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Không đọc được file ảnh"));
      reader.readAsDataURL(file);
    });

  const footerContactLines = [pageData?.hotline, pageData?.bookingNotice || "Hỗ trợ đặt phòng 24/7"].filter(
    (line) => line && line.trim().length > 0
  );

  const handleBookingSubmit = async () => {
    if (bookingLocked) {
      setBookingMessage(pageData?.bookingNotice || "Hệ thống hiện đang tạm ngưng nhận booking.");
      return;
    }
    if (!selectedBookingItem) {
      setBookingMessage("Vui lòng chọn ít nhất 1 khung giờ.");
      return;
    }
    if (!bookingForm.guestName || !bookingForm.guestPhone || !bookingForm.guestEmail) {
      setBookingMessage("Vui lòng nhập đầy đủ họ tên, số điện thoại và email.");
      return;
    }
    if (!bookingForm.acceptedTerms) {
      setBookingMessage("Bạn cần xác nhận điều khoản và điều kiện.");
      return;
    }

    try {
      setSubmittingBooking(true);
      setBookingMessage(null);

      const bookingDate = parseDayToDate(selectedDay);
      const payload = {
        checkInDate: bookingDate,
        checkOutDate: bookingDate,
        guestName: bookingForm.guestName,
        guestEmail: bookingForm.guestEmail,
        guestPhone: bookingForm.guestPhone,
        receiveBookingEmail: bookingForm.receiveBookingEmail,
        numOfAdults: bookingForm.guestCount,
        numOfChildren: 0,
        transportType: bookingForm.transportType,
        idCardFrontImage: bookingForm.idCardFrontImage,
        idCardBackImage: bookingForm.idCardBackImage,
        discountCode: bookingForm.discountCode,
        note: bookingForm.note,
        acceptedTerms: bookingForm.acceptedTerms,
        branchName: selectedArea,
        selectedRoomName: selectedBookingItem.room.name,
        selectedDayLabel: selectedDay,
        selectedSlotTime: selectedBookingItem.slot.time,
        selectedSlotPrice: selectedBookingItem.slot.price,
      };

      const response = await fetch(`${API_BASE}/bookings/room/${selectedBookingItem.room.roomId}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || "Đặt phòng thất bại");
      }

      setBookingMessage(text || "Đặt phòng thành công");
      await loadHomePage(selectedDay);
      setSelectedSlots({});
      setBookingForm(EMPTY_BOOKING_FORM);
      setTimeout(() => setShowBookingForm(false), 1200);
    } catch (err) {
      setBookingMessage(err instanceof Error ? err.message : "Đặt phòng thất bại");
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5db] px-4 text-center text-[#4f67b0]">
        <div>
          <div className="text-2xl font-black uppercase tracking-[0.08em]">LuxeStay</div>
          <p className="mt-2 text-sm text-[#7f8ec6]">Đang tải dữ liệu từ backend...</p>
        </div>
      </main>
    );
  }

  if (error || !pageData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5db] px-4 text-center text-[#4f67b0]">
        <div className="max-w-md rounded-[24px] bg-white/70 p-6 shadow-[0_14px_40px_rgba(70,98,172,0.08)]">
          <div className="text-2xl font-black uppercase tracking-[0.08em]">LuxeStay</div>
          <p className="mt-3 text-sm text-red-500">{error ?? "Không có dữ liệu hiển thị"}</p>
          <p className="mt-2 text-sm text-[#7f8ec6]">
            Hãy kiểm tra backend đang chạy và endpoint /api/public/home-page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5db] text-[#4562ac]">
      <section className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-3 pb-24 pt-3 sm:max-w-6xl sm:px-6 sm:pb-10 lg:max-w-7xl lg:px-8">
        <header className="mb-3 flex items-center justify-between rounded-[24px] bg-white/40 px-4 py-3 shadow-[0_10px_40px_rgba(70,98,172,0.08)] backdrop-blur-sm sm:mb-5 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm sm:h-11 sm:w-11">
              <Image src="/LOGO%20FIIN.png" alt="Fiin Home logo" width={44} height={44} className="h-full w-full object-contain p-0.5" priority />
            </div>
            <div>
              <div className="text-sm font-bold tracking-[0.18em] text-[#4361af] uppercase sm:text-base sm:tracking-[0.22em]">
                {pageData.brandName}
              </div>
              <div className="text-xs text-[#7f8ec6] sm:text-sm">{pageData.brandSubtitle}</div>
            </div>
          </div>
          <div className="rounded-full bg-[#4361af] px-3 py-2 text-xs font-semibold text-white sm:px-4 sm:text-sm">
            {pageData.hotline}
          </div>
        </header>

        <section className="mb-5 text-center sm:mb-7">
          <h1 className="text-2xl font-black uppercase tracking-[0.04em] text-[#4f67b0] sm:text-4xl">
            {pageData.heroTitle}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#7f8ec6] sm:text-base">
            {pageData.heroSubtitle}
          </p>
        </section>

        <section className="mb-5">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f67b0]">
              {pageData.introSectionTitle}
            </div>
            <div className="text-xs text-[#7f8ec6]">Vuốt qua để xem</div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {pageData.introCards.map((card) => (
              <article
                key={card.title}
                className="min-w-[84%] snap-center overflow-hidden rounded-[24px] bg-white shadow-[0_14px_40px_rgba(70,98,172,0.12)] sm:min-w-[420px]"
              >
                <div className="h-44 bg-cover bg-center sm:h-56" style={{ backgroundImage: `url("${card.image}")` }} />
                <div className="p-4 sm:p-5">
                  <div className="text-lg font-bold text-[#4f67b0] sm:text-2xl">{card.title}</div>
                  <p className="mt-2 text-sm leading-6 text-[#7f8ec6] sm:text-base">{card.subtitle}</p>
                  <button
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#4361af] px-4 py-2 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 active:scale-95"
                    onClick={() => {
                      if (card.title.includes("Vincom")) {
                        setSelectedArea("Căn PG2-11");
                      } else {
                        setSelectedArea("Hẻm Duy Khổng");
                      }
                      document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Xem thêm
                    <span>›</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center">
          {pageData.areas.map((area) => (
            <button
              key={area.name}
              onClick={() => setSelectedArea(area.name)}
              className={`min-w-[190px] rounded-[18px] border px-4 py-3 text-left transition-all duration-300 active:scale-95 sm:min-w-[240px] ${
                selectedArea === area.name
                  ? "border-[#4361af] bg-[#4361af] text-white shadow-lg"
                  : "border-[#dfe6fb] bg-white/70 text-[#4f67b0]"
              }`}
            >
              <div className="text-sm font-semibold sm:text-base">{area.name}</div>
              <div className={`mt-1 text-xs sm:text-sm ${selectedArea === area.name ? "text-white/85" : "text-[#7f8ec6]"}`}>
                {area.subtitle}
              </div>
            </button>
          ))}
        </section>

        <section className="space-y-6 sm:space-y-8">
          {selectedShowcase ? (
            <article className="rounded-[30px] bg-transparent">
              <div className="mx-auto max-w-[360px] sm:max-w-[560px]">
                <div className="mb-4 text-center">
                  <div className="inline-flex rounded-full bg-[#d7e3ff] px-5 py-2 text-lg font-medium text-[#4f67b0] shadow-sm sm:text-xl">
                    {selectedArea}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#7f8ec6]">
                    {selectedBranchRoomCount} phòng thuộc chi nhánh này
                  </p>
                  <p className="mt-1 text-xs text-[#95a3cf]">Tổng phòng hiện có: {totalRoomCount}</p>
                </div>

                <div
                  className="relative overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_16px_50px_rgba(72,93,160,0.15)] sm:p-4"
                  onTouchStart={handleShowcaseTouchStart}
                  onTouchMove={handleShowcaseTouchMove}
                  onTouchEnd={resetShowcaseTouch}
                  onTouchCancel={resetShowcaseTouch}
                >
                  <div className="mb-3 flex items-center justify-between px-2 sm:px-3">
                    <div className="text-lg font-black tracking-[0.12em] text-black sm:text-2xl">
                      {selectedShowcase.title}
                    </div>
                    <div className="text-xs font-semibold text-[#8aa0d7] sm:text-sm">Mozi-style</div>
                  </div>

                  <div className="rounded-[22px] bg-[#f2f4fa] p-2 sm:p-3">
                    <div className="overflow-hidden rounded-[20px] bg-slate-200">
                      <div
                        className="aspect-[16/10] h-full w-full bg-cover bg-center transition-transform duration-500 hover:scale-105"
                        style={{ backgroundImage: `url("${selectedShowcase.cover}")` }}
                      />
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3 sm:gap-3">
                      {selectedShowcase.grid.slice(0, 3).map((img, index) => (
                        <div key={`${img}-${index}`} className="aspect-square overflow-hidden rounded-[16px] bg-slate-200">
                          <div
                            className="h-full w-full bg-cover bg-center transition-transform duration-500 hover:scale-105"
                            style={{ backgroundImage: `url("${img}")` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4 sm:gap-3">
                    {selectedShowcase.times.map((time) => (
                      <div
                        key={time}
                        className="rounded-full bg-[#eef3ff] px-3 py-2 text-center text-[11px] font-semibold text-[#435da7] shadow-sm sm:text-sm"
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  {selectedRoomList.length > 1 ? (
                    <div className="mt-4 rounded-[22px] bg-[#f8faff] p-3 sm:p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-sm font-bold text-[#4f67b0] sm:text-base">Phòng trong chi nhánh này</div>
                        <div className="text-xs text-[#7f8ec6]">{selectedRoomList.length} phòng</div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedRoomList.slice(0, 6).map((room) => (
                          <button
                            key={room.roomId}
                            type="button"
                            className="flex items-center gap-3 rounded-[18px] border border-[#dfe6fb] bg-white p-3 text-left shadow-sm transition-transform active:scale-[0.99]"
                            onClick={() => router.push(getRoomDetailPath(room))}
                          >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                              <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${room.image}")` }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-[#4f67b0]">{room.name}</div>
                              <div className="truncate text-xs text-[#7f8ec6]">{room.features.slice(0, 2).join(" • ")}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex justify-center gap-2 pb-1">
                    {pageData.showcaseRooms.map((dotRoom, dotIndex) => (
                      <button
                        type="button"
                        key={`${dotRoom.title}-${dotIndex}`}
                        aria-label={`Chuyển đến mục ${dotIndex + 1}`}
                        onClick={() => setSelectedArea(pageData.areas[dotIndex]?.name ?? selectedArea)}
                        className={`h-2.5 w-2.5 rounded-full ${dotIndex === selectedIndex ? "bg-[#2f7df6]" : "bg-[#cfd4df]"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ) : null}
        </section>

        <section id="booking-section" className="mt-8 rounded-[30px] bg-white/55 p-4 shadow-[0_14px_40px_rgba(70,98,172,0.08)] sm:p-6 lg:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-[0.04em] text-[#4f67b0] sm:text-4xl">
              {pageData.bookingSectionTitle}
            </h2>
            <p className="mt-2 inline-flex rounded-full bg-[#d7e3ff] px-5 py-2 text-sm text-[#5973bb] sm:text-base">
              {pageData.bookingSectionSubtitle}
            </p>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center">
            {pageData.areas.map((area) => (
              <button
                key={area.name}
                onClick={() => setSelectedArea(area.name)}
                className={`whitespace-nowrap rounded-[18px] px-4 py-3 text-sm font-medium transition-all active:scale-95 sm:px-5 sm:text-base ${
                  selectedArea === area.name ? "bg-[#4c67b2] text-white" : "border border-[#96a8db] bg-white text-[#4c67b2]"
                }`}
              >
                {area.name}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              className="text-2xl font-black text-[#4c67b2] transition-transform active:scale-90"
              onClick={() => {
                const idx = (pageData.days.indexOf(selectedDay) - 1 + pageData.days.length) % pageData.days.length;
                setSelectedDay(pageData.days[idx]);
              }}
            >
              ‹
            </button>
            {pageData.days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`min-w-[78px] rounded-[14px] border px-3 py-3 text-xs font-semibold sm:min-w-[96px] sm:text-sm ${
                  selectedDay === day
                    ? "border-[#4c67b2] bg-[#dfe9ff] text-[#4c67b2]"
                    : "border-[#9ab0e1] bg-white text-[#4c67b2]"
                }`}
              >
                {day}
              </button>
            ))}
            <button
              className="text-2xl font-black text-[#4c67b2] transition-transform active:scale-90"
              onClick={() => {
                const idx = (pageData.days.indexOf(selectedDay) + 1) % pageData.days.length;
                setSelectedDay(pageData.days[idx]);
              }}
            >
              ›
            </button>
          </div>

          <h3 className="mt-6 text-center text-lg font-black uppercase tracking-[0.06em] text-[#4f67b0] sm:text-2xl">
            Các khung giờ {selectedDay} của {selectedArea}
          </h3>

          <div className="mt-4 space-y-4 sm:space-y-5">
            {selectedRoomList.map((room) => (
              <article
                key={room.name}
                className="rounded-[26px] bg-[#f8f9f5] p-3 shadow-[0_10px_30px_rgba(70,98,172,0.06)] sm:p-4"
                role="button"
                tabIndex={0}
                onClick={() => router.push(getRoomDetailPath(room))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(getRoomDetailPath(room));
                  }
                }}
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-slate-200 sm:h-24 sm:w-24">
                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${room.image}")` }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-lg font-bold text-[#4f67b0] sm:text-2xl">{room.name}</div>
                      {room.videoUrl ? (
                        <span className="rounded-full bg-[#e7efff] px-2.5 py-1 text-[10px] font-semibold text-[#4361af] sm:text-xs">
                          Có video
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                      {room.features.slice(0, 6).map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#4c67b2] text-[10px] font-semibold text-white sm:h-8 sm:w-auto sm:px-2 sm:text-xs"
                          title={feature}
                        >
                          {feature.slice(0, 1)}
                        </span>
                      ))}
                    </div>
                    {room.gallery.length > 0 ? (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {room.gallery.slice(0, 4).map((img, index) => (
                          <div key={`${room.roomId}-${index}`} className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-200 sm:h-14 sm:w-14">
                            <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${img}")` }} />
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3">
                      <Link
                        href={getRoomDetailPath(room)}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center rounded-full border border-[#cfe0ff] bg-white px-3 py-2 text-xs font-semibold text-[#4361af] transition-transform hover:-translate-y-0.5 active:scale-95 sm:text-sm"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {room.slots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={bookingLocked || slot.status === "Đã Đặt"}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSlotPick(room.name, slot.time);
                      }}
                      className={`rounded-[14px] px-2 py-3 text-center transition-transform duration-300 active:scale-95 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-80 ${
                        bookingLocked || slot.status === "Đã Đặt"
                          ? "bg-slate-200 text-slate-500"
                          : selectedSlots[room.name] === slot.time
                            ? "bg-[#4c67b2] text-white"
                            : "bg-[#d5ecff] text-[#4c67b2]"
                      }`}
                    >
                      <div className="text-[11px] font-semibold sm:text-xs">{slot.time}</div>
                      <div className="mt-1 text-xs font-bold sm:text-sm">{slot.price}</div>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
            {pageData.legend.map((item) => {
              const styles = getLegendStyles(item.label);
              return (
                <div
                  key={item.label}
                  className={`flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full border px-2 py-2 text-[11px] font-semibold leading-none sm:w-auto sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm ${styles.pill}`}
                >
                  <span className={`h-3 w-3 rounded-full ${styles.dot}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] border border-white/70 bg-white/65 p-4 shadow-[0_10px_30px_rgba(70,98,172,0.06)] backdrop-blur-sm sm:p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-[#4f67b0]">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              Đã Đặt
            </div>
            <p className="mt-3 text-sm leading-6 text-[#7f8ec6]">Màu trung tính, dễ đọc và không gây rối khi nhìn nhanh trên điện thoại.</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/65 p-4 shadow-[0_10px_30px_rgba(70,98,172,0.06)] backdrop-blur-sm sm:p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-[#4f67b0]">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              Còn Trống
            </div>
            <p className="mt-3 text-sm leading-6 text-[#7f8ec6]">Nút thời gian được giữ đủ lớn để thao tác thoải mái bằng ngón tay cái.</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/65 p-4 shadow-[0_10px_30px_rgba(70,98,172,0.06)] backdrop-blur-sm sm:p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-[#4f67b0]">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              Đang chọn
            </div>
            <p className="mt-3 text-sm leading-6 text-[#7f8ec6]">Màu nhấn nổi bật để biết ngay khung giờ nào đang được chọn.</p>
          </div>
        </section>

        <footer className="mt-6 rounded-[30px] border border-white/70 bg-white/70 p-5 shadow-[0_10px_30px_rgba(70,98,172,0.06)] backdrop-blur sm:p-6">
          <div className="mx-auto flex max-w-4xl flex-col gap-5 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#dfe6fb] bg-[#f7f9ff] px-4 py-1 text-sm font-semibold uppercase tracking-[0.18em] text-[#4f67b0]">
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                  <Image src="/LOGO%20FIIN.png" alt="Fiin Home logo" width={32} height={32} className="h-full w-full object-contain" />
                </span>
                <span>Fiin Home</span>
              </div>
              <p className="mx-auto max-w-2xl text-sm leading-6 text-[#7f8ec6]">{pageData.footerDescription}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 text-sm text-[#4f67b0]">
              {pageData.footerTags.map((tag) => (
                <span key={tag} className="rounded-full border border-[#dfe6fb] bg-white px-3 py-2 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:items-stretch">
              <div className="rounded-[24px] border border-[#edf1fb] bg-[#f8f9f5] p-4 text-left shadow-sm">
                <div className="text-center text-sm font-semibold text-[#4f67b0] sm:text-left">Liên hệ</div>
                <div className="mt-2 text-center text-sm leading-6 text-[#7f8ec6] sm:text-left">
                  {footerContactLines.map((line, index) => (
                    <div key={`${line}-${index}`}>{line}</div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-[#edf1fb] bg-[#f8f9f5] p-4 shadow-sm">
                <div className="text-center text-sm font-semibold text-[#4f67b0]">Điều hướng nhanh</div>
                <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm text-[#4f67b0]">
                  {footerLinks.map((link, index) => {
                    const href = footerLinkUrls[index]?.trim() ?? "";
                    const isExternal = /^https?:\/\//.test(href);
                    const content = (
                      <span className="inline-flex min-h-9 items-center rounded-full border border-[#dfe6fb] bg-white px-4 py-1.5 shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95">
                        {link}
                      </span>
                    );

                    if (!href) {
                      return (
                        <span key={link} className="inline-flex min-h-9 items-center rounded-full border border-[#dfe6fb] bg-white px-4 py-1.5 text-[#8aa0d6] shadow-sm">
                          {link}
                        </span>
                      );
                    }

                    return isExternal ? (
                      <a key={link} href={href} target="_blank" rel="noreferrer" className="inline-flex">
                        {content}
                      </a>
                    ) : (
                      <a key={link} href={href} className="inline-flex">
                        {content}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </section>

      {showBookingForm && selectedBookingItem ? (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/45 p-3 sm:p-6">
          <div className="mx-auto w-full max-w-[430px] rounded-[20px] bg-[#ecefd7] p-4 text-[#2d3f7a] shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:max-w-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-[0.06em]">Thong tin dat phong</h2>
              <button
                className="rounded-lg border border-[#7b8ec7] px-3 py-1 text-sm"
                onClick={() => setShowBookingForm(false)}
              >
                Dong
              </button>
            </div>

            <div className="rounded-[12px] border border-[#5a74bd] bg-[#c4dbe9] p-3 text-sm">
              <div className="grid grid-cols-[140px_1fr] gap-y-2">
                <span className="font-semibold">Phong ban chon:</span>
                <span>{selectedBookingItem.room.name} - {selectedArea}</span>
                <span className="font-semibold">Gio nhan phong:</span>
                <span>{selectedBookingItem.slot.time} ngay {parseDayToDate(selectedDay)}</span>
                <span className="font-semibold">Tong tien:</span>
                <span>{selectedBookingItem.slot.price}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <label className="mb-1 block font-semibold">Ho ten: *</label>
                <input
                  className="w-full rounded-lg border border-[#d5d8de] bg-white px-3 py-2"
                  value={bookingForm.guestName}
                  onChange={(e) => setBookingForm((p) => ({ ...p, guestName: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">So dien thoai / Zalo: *</label>
                <input
                  className="w-full rounded-lg border border-[#d5d8de] bg-white px-3 py-2"
                  value={bookingForm.guestPhone}
                  onChange={(e) => setBookingForm((p) => ({ ...p, guestPhone: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">Nhan thong tin dat phong qua email: *</label>
                <input
                  className="w-full rounded-lg border border-[#d5d8de] bg-white px-3 py-2"
                  type="email"
                  value={bookingForm.guestEmail}
                  onChange={(e) => setBookingForm((p) => ({ ...p, guestEmail: e.target.value }))}
                />
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={bookingForm.receiveBookingEmail}
                    onChange={(e) => setBookingForm((p) => ({ ...p, receiveBookingEmail: e.target.checked }))}
                  />
                  Gui thong tin booking vao email
                </label>
              </div>

              <div>
                <label className="mb-1 block font-semibold">So luong khach:</label>
                <div className="flex items-center overflow-hidden rounded-lg border border-[#d5d8de] bg-white">
                  <button
                    className="px-4 py-2 text-lg"
                    onClick={() => setBookingForm((p) => ({ ...p, guestCount: Math.max(1, p.guestCount - 1) }))}
                  >
                    -
                  </button>
                  <input
                    className="w-full border-x border-[#d5d8de] px-3 py-2 text-center"
                    type="number"
                    min={1}
                    value={bookingForm.guestCount}
                    onChange={(e) => setBookingForm((p) => ({ ...p, guestCount: Math.max(1, Number(e.target.value || 1)) }))}
                  />
                  <button
                    className="px-4 py-2 text-lg"
                    onClick={() => setBookingForm((p) => ({ ...p, guestCount: p.guestCount + 1 }))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold">Ban ghe home bang phuong tien gi?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`rounded-lg border px-3 py-3 font-semibold ${bookingForm.transportType === "Xe may" ? "border-[#4461ad] bg-[#4e67ad] text-white" : "border-[#7f95cb] bg-[#c7d9d7]"}`}
                    onClick={() => setBookingForm((p) => ({ ...p, transportType: "Xe may" }))}
                  >
                    Xe may
                  </button>
                  <button
                    className={`rounded-lg border px-3 py-3 font-semibold ${bookingForm.transportType === "Xe o to" ? "border-[#4461ad] bg-[#4e67ad] text-white" : "border-[#7f95cb] bg-[#c7d9d7]"}`}
                    onClick={() => setBookingForm((p) => ({ ...p, transportType: "Xe o to" }))}
                  >
                    Xe o to
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold">Chung minh nhan dan: *</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="rounded-lg border border-dashed border-[#6f84bd] bg-[#f1f2f6] p-3 text-center text-xs">
                    Mat truoc
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2 block w-full text-[11px]"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const value = await toBase64(file);
                        setBookingForm((p) => ({ ...p, idCardFrontImage: value }));
                      }}
                    />
                  </label>
                  <label className="rounded-lg border border-dashed border-[#6f84bd] bg-[#f1f2f6] p-3 text-center text-xs">
                    Mat sau
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2 block w-full text-[11px]"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const value = await toBase64(file);
                        setBookingForm((p) => ({ ...p, idCardBackImage: value }));
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-[#6780bd] p-3">
                <label className="mb-1 block font-semibold">Ma giam gia:</label>
                <input
                  className="w-full rounded-lg border border-[#4f69b4] bg-[#c4dbe9] px-3 py-2"
                  value={bookingForm.discountCode}
                  onChange={(e) => setBookingForm((p) => ({ ...p, discountCode: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">Ghi chu:</label>
                <textarea
                  className="h-24 w-full rounded-lg border border-[#d5d8de] bg-white px-3 py-2"
                  value={bookingForm.note}
                  onChange={(e) => setBookingForm((p) => ({ ...p, note: e.target.value }))}
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-[#2a3d76]">
                <input
                  type="checkbox"
                  checked={bookingForm.acceptedTerms}
                  onChange={(e) => setBookingForm((p) => ({ ...p, acceptedTerms: e.target.checked }))}
                />
                Xac nhan voi dieu khoan va dieu kien
              </label>

              {bookingMessage ? <p className="text-sm text-[#cb2f2f]">{bookingMessage}</p> : null}

              <button
                className="w-full rounded-xl bg-[#425ca7] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                onClick={() => void handleBookingSubmit()}
                disabled={submittingBooking}
              >
                {submittingBooking ? "Dang gui dat phong..." : "Xac nhan dat phong"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#d7e0f4] bg-[#425aa4] px-4 py-4 text-white shadow-[0_-10px_30px_rgba(38,53,98,0.2)]">
        <div className="mx-auto flex max-w-[430px] items-center justify-between gap-3 sm:max-w-6xl sm:px-2">
          <div>
            <div className="text-sm font-semibold sm:text-base">Tổng cộng: {selectedTotal.toLocaleString("vi-VN")} đ</div>
            <div className="text-xs text-white/75 sm:text-sm">
              {selectedRoomCount > 0 ? `${selectedRoomCount} khung giờ đã chọn` : "Chưa chọn khung giờ nào"}
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-2xl bg-white/25 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-transform active:scale-95 sm:px-5 sm:text-base"
            disabled={bookingLocked}
            onClick={() => {
              if (bookingLocked) {
                setBookingMessage(pageData.bookingNotice || "Hệ thống hiện đang tạm ngưng nhận booking.");
                return;
              }
              if (selectedRoomCount > 0) {
                setShowBookingForm(true);
                setBookingMessage(null);
              } else {
                alert("Vui lòng chọn ít nhất 1 khung giờ.");
              }
            }}
          >
            {bookingLocked ? "Tạm ngưng nhận booking" : "Đặt phòng →"}
          </button>
        </div>
        {bookingLocked && pageData.bookingNotice ? (
          <p className="mx-auto mt-2 max-w-[430px] text-xs text-white/80 sm:max-w-6xl sm:px-2">{pageData.bookingNotice}</p>
        ) : null}
      </div>
    </main>
  );
}
