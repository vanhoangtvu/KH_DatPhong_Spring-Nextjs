"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import RoomDetailBookingPanel from "@/components/RoomDetailBookingPanel";
import { useRoomStateSocket } from "@/lib/useRoomStateSocket";

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
console.log('API_BASE:', API_BASE);

const getRoomDetailPath = (room: RoomItem, date?: string) => {
  if (!date) {
    return `/room/${room.roomId}`;
  }

  return `/room/${room.roomId}?date=${encodeURIComponent(date)}`;
};
const getSharedSelectedDateKey = () => "fiin-home-selected-date";

const getDayLabelForDate = (dateValue: string) => {
  if (!dateValue) {
    return "";
  }

  const targetDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(targetDate.getTime())) {
    return "";
  }

  const today = new Date();
  const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

  for (let offset = 0; offset <= 6; offset += 1) {
    const candidate = new Date(today);
    candidate.setHours(0, 0, 0, 0);
    candidate.setDate(today.getDate() + offset);

    if (candidate.toISOString().slice(0, 10) === dateValue) {
      if (offset === 0) {
        return "Hôm nay";
      }
      return dayNames[candidate.getDay()];
    }
  }

  return "";
};

const formatDateForDisplay = (dateValue: string) => {
  if (!dateValue) {
    return "";
  }

  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("vi-VN");
};

const getDateForDayLabel = (dayLabel: string) => {
  if (!dayLabel) {
    return "";
  }

  const today = new Date();
  if (dayLabel.toLowerCase().includes("hôm nay")) {
    return today.toISOString().slice(0, 10);
  }

  const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const targetIndex = dayNames.findIndex((dayName) => dayName.toLowerCase() === dayLabel.trim().toLowerCase());
  if (targetIndex < 0) {
    return "";
  }

  for (let offset = 0; offset <= 6; offset += 1) {
    const candidate = new Date(today);
    candidate.setHours(0, 0, 0, 0);
    candidate.setDate(today.getDate() + offset);
    if (candidate.getDay() === targetIndex) {
      return candidate.toISOString().slice(0, 10);
    }
  }

  return "";
};

const parsePriceToVnd = (value: string) => {
  if (!value) return 0;
  const normalized = value.trim().toLowerCase().replace(/đ|\s/g, "");
  const isKUnit = normalized.endsWith("k");
  const digits = normalized.replace(/[^0-9]/g, "");
  if (!digits) return 0;
  const amount = Number(digits);
  return Number.isFinite(amount) ? (isKUnit ? amount * 1000 : amount) : 0;
};

const formatPriceLabel = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "0đ";
  }

  if (amount % 1000 === 0) {
    return `${Math.round(amount / 1000)}k`;
  }

  return `${amount.toLocaleString("vi-VN")}đ`;
};

const getLegendStyles = (label: string) => {
  if (label.trim().toLowerCase() === "đã đặt") {
    return {
      pill: "border-slate-300 bg-slate-100 text-slate-700",
      dot: "bg-slate-400",
    };
  }
  if (label === "Còn Trống") {
    return {
      pill: "border-[#e2c9ab] bg-[#fff4e7] text-[#8b5e3c]",
      dot: "bg-[#8b5e3c]",
    };
  }
  if (label === "Đang chọn") {
    return {
      pill: "border-[#e2c9ab] bg-[#fff4e7] text-[#8b5e3c]",
      dot: "bg-[#8b5e3c]",
    };
  }
  return {
    pill: "border-[#e2c9ab] bg-white text-[#8a6341]",
    dot: "bg-[#c79a6b]",
  };
};

const isBookedSlotStatus = (status: string) => {
  const normalized = status.trim().toLowerCase();
  return normalized === "đã đặt" || normalized === "hết chỗ";
};

export default function HomePage() {
  const router = useRouter();
  const showcaseTouchStartX = useRef<number | null>(null);
  const showcaseTouchStartY = useRef<number | null>(null);
  const showcaseSwipeHandled = useRef(false);
  const dayStripRef = useRef<HTMLDivElement | null>(null);
  const todayDate = new Date().toISOString().slice(0, 10);
  const [pageData, setPageData] = useState<HomePageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedDay, setSelectedDay] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const queryDate = new URLSearchParams(window.location.search).get("date");
    if (queryDate) {
      const queryDayLabel = getDayLabelForDate(queryDate);
      return queryDayLabel || "Hôm nay";
    }

    const storedDate = window.sessionStorage.getItem(getSharedSelectedDateKey());
    return storedDate ? getDayLabelForDate(storedDate) : "Hôm nay";
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const queryDate = new URLSearchParams(window.location.search).get("date");
    if (queryDate) {
      return queryDate;
    }

    return window.sessionStorage.getItem(getSharedSelectedDateKey()) ?? todayDate;
  });
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormState>(EMPTY_BOOKING_FORM);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const loadHomePage = async (dayLabel?: string, date?: string) => {
    const shouldShowLoading = !pageData;
    try {
      if (shouldShowLoading) {
        setLoading(true);
      }
      setError(null);
      const query = date
        ? `?date=${encodeURIComponent(date)}`
        : dayLabel
          ? `?dayLabel=${encodeURIComponent(dayLabel)}`
          : "";
      console.log('Loading from API:', `${API_BASE}/api/public/home-page${query}`);
      const response = await fetch(`${API_BASE}/api/public/home-page${query}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Không tải được dữ liệu (${response.status})`);
      }
      const data: HomePageResponse = await response.json();
      console.log('Data loaded:', data);
      setPageData(data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!selectedDay) return;
    const nextDate = getDateForDayLabel(selectedDay) || selectedDate;
    if (typeof window !== "undefined" && nextDate) {
      window.sessionStorage.setItem(getSharedSelectedDateKey(), nextDate);
    }
    if (nextDate) {
      setSelectedDate(nextDate);
    }
  }, [selectedDay]);

  useEffect(() => {
    if (typeof window === "undefined" || !selectedDate) return;
    const params = new URLSearchParams(window.location.search);
    params.set("date", selectedDate);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    void loadHomePage(undefined, selectedDate);
  }, [selectedDate, refreshTick]);

  useRoomStateSocket(() => {
    setRefreshTick((value) => value + 1);
  });

  useEffect(() => {
    if (!pageData) return;

    if (!selectedArea || !pageData.areas.some((area) => area.name === selectedArea)) {
      setSelectedArea(pageData.areas[0]?.name ?? "");
    }

    if (!selectedDay) {
      if (selectedDate) {
        const storedDayLabel = getDayLabelForDate(selectedDate);
        if (storedDayLabel) {
          setSelectedDay(storedDayLabel);
        } else {
          setSelectedDay(pageData.days[0] ?? "");
        }
        return;
      }

      const firstDay = pageData.days[0] ?? "";
      setSelectedDay(firstDay);
      if (firstDay) {
        const firstDate = getDateForDayLabel(firstDay);
        if (firstDate) {
          setSelectedDate(firstDate);
        }
      }
      return;
    }

    if (pageData.days.includes(selectedDay)) {
      return;
    }
  }, [pageData, selectedArea, selectedDay, selectedDate]);

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
    const amount = slot ? parsePriceToVnd(slot.price) : 0;
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
      <main className="flex min-h-screen items-center justify-center bg-[#f6eddc] px-4 text-center text-[#6b4a2d]">
        <div>
          <div className="text-2xl font-black tracking-[-0.03em] text-balance">Fiin Home</div>
          <p className="mt-2 text-sm text-[#9c7450]">Đang tải dữ liệu...</p>
        </div>
      </main>
    );
  }

  if (error || !pageData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6eddc] px-4 text-center text-[#6b4a2d]">
        <div className="max-w-md rounded-[24px] bg-[#fffaf2]/80 p-6 shadow-[0_14px_40px_rgba(122,84,47,0.10)]">
          <div className="text-2xl font-black tracking-[-0.03em] text-balance">LuxeStay</div>
          <p className="mt-3 text-sm text-[#9c5c44]">{error ?? "Không có dữ liệu hiển thị"}</p>
          <p className="mt-2 text-sm text-[#9c7450]">
            Hãy kiểm tra backend đang chạy và endpoint /api/public/home-page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6eddc] pb-28 text-[#6b4a2d] sm:pb-0">
      <section className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-3 pb-24 pt-3 sm:max-w-6xl sm:px-6 sm:pb-10 lg:max-w-7xl lg:px-8">
        <header className="mb-3 flex items-center justify-between rounded-[24px] bg-[#fff8ef]/65 px-4 py-3 shadow-[0_10px_40px_rgba(122,84,47,0.08)] backdrop-blur-sm sm:mb-5 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm sm:h-11 sm:w-11">
              <Image src="/LOGO%20FIIN.png" alt="Fiin Home logo" width={44} height={44} className="h-full w-full object-contain p-0.5" priority />
            </div>
            <div>
              <div className="text-sm font-bold tracking-[0.08em] text-[#7e5331] uppercase sm:text-base sm:tracking-[0.12em]">
                {pageData.brandName}
              </div>
              <div className="text-xs text-[#9c7450] sm:text-sm">{pageData.brandSubtitle}</div>
            </div>
          </div>
          <div className="rounded-full bg-[#8b5e3c] px-3 py-2 text-xs font-semibold text-white sm:px-4 sm:text-sm">
            {pageData.hotline}
          </div>
          <Link
            href="/tra-cuu-booking"
            className="hidden rounded-full border border-[#e2c9ab] bg-[#fffaf2] px-3 py-2 text-xs font-semibold text-[#8b5e3c] shadow-sm transition hover:bg-[#f0dfc9] sm:inline-flex sm:px-4 sm:text-sm"
          >
            Tra cứu booking
          </Link>
        </header>

        <section className="mb-5 text-center sm:mb-7">
          <h1 className="mx-auto max-w-4xl text-balance text-2xl font-black tracking-[-0.02em] text-[#6b4a2d] leading-[1.08] sm:text-4xl">
            {pageData.heroTitle}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#9c7450] sm:text-base">
            {pageData.heroSubtitle}
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/tra-cuu-booking"
              className="inline-flex items-center justify-center rounded-full bg-[#8b5e3c] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(122,84,47,0.18)] transition hover:bg-[#734a2d] active:scale-95"
            >
              Tra cứu lịch đặt phòng
            </Link>
            <Link
              href="#booking-section"
              className="inline-flex items-center justify-center rounded-full border border-[#e2c9ab] bg-[#fffaf2] px-5 py-3 text-sm font-semibold text-[#8b5e3c] transition hover:bg-[#f0dfc9] active:scale-95"
            >
              Đặt phòng ngay
            </Link>
          </div>
        </section>

        <section className="mb-5">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="text-sm font-semibold tracking-[0.02em] text-[#7e5331]">
              {pageData.introSectionTitle}
            </div>
            <div className="text-xs text-[#9c7450]">Vuốt để xem thêm</div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {pageData.introCards.map((card) => (
              <article
                key={card.title}
                className="min-w-[84%] snap-center overflow-hidden rounded-[24px] bg-[#fffaf2] shadow-[0_14px_40px_rgba(122,84,47,0.10)] sm:min-w-[420px]"
              >
                <div className="h-44 bg-cover bg-center sm:h-56" style={{ backgroundImage: `url("${card.image}")` }} />
                <div className="p-4 sm:p-5">
                  <div className="text-lg font-bold text-[#6b4a2d] sm:text-2xl">{card.title}</div>
                  <p className="mt-2 text-sm leading-6 text-[#9c7450] sm:text-base">{card.subtitle}</p>
                  <button
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#8b5e3c] px-4 py-2 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 active:scale-95"
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
                  ? "border-[#8b5e3c] bg-[#8b5e3c] text-white shadow-lg"
                  : "border-[#e2c9ab] bg-[#fffaf2]/80 text-[#7e5331]"
              }`}
            >
              <div className="text-sm font-semibold sm:text-base">{area.name}</div>
              <div className={`mt-1 text-xs sm:text-sm ${selectedArea === area.name ? "text-white/85" : "text-[#9c7450]"}`}>
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
                  <div className="inline-flex rounded-full bg-[#f0dfc9] px-5 py-2 text-lg font-medium text-[#7e5331] shadow-sm sm:text-xl">
                    {selectedArea}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#9c7450]">
                    {selectedBranchRoomCount} phòng thuộc chi nhánh này
                  </p>
                  <p className="mt-1 text-xs text-[#b08964]">Tổng phòng hiện có: {totalRoomCount}</p>
                </div>

                <div
                  className="relative overflow-hidden rounded-[28px] bg-[#fff8ef] p-3 shadow-[0_16px_50px_rgba(122,84,47,0.10)] sm:p-4"
                  onTouchStart={handleShowcaseTouchStart}
                  onTouchMove={handleShowcaseTouchMove}
                  onTouchEnd={resetShowcaseTouch}
                  onTouchCancel={resetShowcaseTouch}
                >
                  <div className="mb-3 flex items-center justify-between px-2 sm:px-3">
                    <div className="text-lg font-black tracking-[-0.02em] text-black sm:text-2xl">
                      {selectedShowcase.title}
                    </div>
                    <div className="text-xs font-semibold text-[#b08964] sm:text-sm">Hình ảnh thực tế</div>
                  </div>

                  <div className="rounded-[22px] bg-[#f3e8da] p-2 sm:p-3">
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
                        className="rounded-full bg-[#f0dfc9] px-3 py-2 text-center text-[11px] font-semibold text-[#7e5331] shadow-sm sm:text-sm"
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  {selectedRoomList.length > 1 ? (
                    <div className="mt-4 rounded-[22px] bg-[#fff6ea] p-3 sm:p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-sm font-bold text-[#7e5331] sm:text-base">Phòng trong chi nhánh này</div>
                        <div className="text-xs text-[#9c7450]">{selectedRoomList.length} phòng</div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedRoomList.slice(0, 6).map((room) => (
                          <button
                            key={room.roomId}
                            type="button"
                            className="flex items-center gap-3 rounded-[18px] border border-[#dfe6fb] bg-white p-3 text-left shadow-sm transition-transform active:scale-[0.99]"
                            onClick={() => router.push(getRoomDetailPath(room, selectedDate))}
                          >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                              <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${room.image}")` }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-[#7e5331]">{room.name}</div>
                              <div className="truncate text-xs text-[#9c7450]">{room.features.slice(0, 2).join(" • ")}</div>
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
                        className={`h-2.5 w-2.5 rounded-full ${dotIndex === selectedIndex ? "bg-[#8b5e3c]" : "bg-[#d8c2a4]"}`}
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
            <h2 className="mx-auto max-w-4xl text-balance text-2xl font-black tracking-[-0.02em] text-[#6b4a2d] leading-[1.08] sm:text-4xl">
              {pageData.bookingSectionTitle}
            </h2>
              <p className="mt-2 inline-flex rounded-full bg-[#f0dfc9] px-5 py-2 text-sm text-[#7e5331] sm:text-base">
              {pageData.bookingSectionSubtitle}
            </p>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center">
            {pageData.areas.map((area) => (
              <button
                key={area.name}
                onClick={() => setSelectedArea(area.name)}
                className={`whitespace-nowrap rounded-[18px] px-4 py-3 text-sm font-medium transition-all active:scale-95 sm:px-5 sm:text-base ${
                  selectedArea === area.name ? "bg-[#8b5e3c] text-white" : "border border-[#e2c9ab] bg-[#fffaf2] text-[#7e5331]"
                }`}
              >
                {area.name}
              </button>
            ))}
          </div>

          {/* Day selector - fully responsive */}
          <div className="mt-4">
            {/* Desktop view: inline arrows with days */}
            <div className="hidden md:flex md:items-center md:justify-center md:gap-2">
              <button
                className="text-2xl font-black text-[#8b5e3c] transition-transform active:scale-90"
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
                  className={`min-w-[96px] rounded-[14px] border px-3 py-3 text-sm font-semibold transition-all ${
                    selectedDay === day
                      ? "border-[#8b5e3c] bg-[#f0dfc9] text-[#7e5331]"
                      : "border-[#e2c9ab] bg-[#fffaf2] text-[#7e5331]"
                  }`}
                >
                  {day}
                </button>
              ))}
              <button
                className="text-2xl font-black text-[#8b5e3c] transition-transform active:scale-90"
                onClick={() => {
                  const idx = (pageData.days.indexOf(selectedDay) + 1) % pageData.days.length;
                  setSelectedDay(pageData.days[idx]);
                }}
              >
                ›
              </button>
            </div>

            {/* Mobile/Tablet view: compact row with separate arrows */}
            <div className="md:hidden">
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <button
                  aria-label="Ngày trước"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e2c9ab] bg-[#fffaf2] text-xl font-black text-[#8b5e3c] shadow-sm transition-transform active:scale-90"
                  onClick={() => {
                    dayStripRef.current?.scrollBy({ left: -180, behavior: "smooth" });
                  }}
                >
                  ‹
                </button>

                <div ref={dayStripRef} className="min-w-0 flex-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-2 px-1">
                    {pageData.days.map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`min-w-[78px] flex-shrink-0 rounded-[14px] border px-3 py-3 text-xs font-semibold transition-all ${
                          selectedDay === day
                            ? "border-[#8b5e3c] bg-[#f0dfc9] text-[#7e5331] shadow-sm"
                            : "border-[#e2c9ab] bg-[#fffaf2] text-[#7e5331]"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  aria-label="Ngày sau"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e2c9ab] bg-[#fffaf2] text-xl font-black text-[#8b5e3c] shadow-sm transition-transform active:scale-90"
                  onClick={() => {
                    dayStripRef.current?.scrollBy({ left: 180, behavior: "smooth" });
                  }}
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          <h3 className="mt-6 text-center text-lg font-black tracking-[-0.01em] text-[#6b4a2d] leading-[1.1] sm:text-2xl">
            Các khung giờ {selectedDay} của {selectedArea}
          </h3>

          <div className="mt-4 space-y-4 sm:space-y-5">
            {selectedRoomList.map((room) => (
              <article
                key={room.name}
                className="rounded-[26px] bg-[#fff8ef] p-3 shadow-[0_10px_30px_rgba(122,84,47,0.08)] sm:p-4"
                role="button"
                tabIndex={0}
                onClick={() => router.push(getRoomDetailPath(room, selectedDate))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(getRoomDetailPath(room, selectedDate));
                  }
                }}
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-slate-200 sm:h-24 sm:w-24">
                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${room.image}")` }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-lg font-bold tracking-[-0.015em] text-[#7e5331] sm:text-2xl">{room.name}</div>
                      {room.videoUrl ? (
                          <span className="rounded-full bg-[#f0dfc9] px-2.5 py-1 text-[10px] font-semibold text-[#7e5331] sm:text-xs">
                          Có video
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                      {room.features.slice(0, 6).map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#8b5e3c] text-[10px] font-semibold text-white sm:h-8 sm:w-auto sm:px-2 sm:text-xs"
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
                        href={getRoomDetailPath(room, selectedDate)}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center rounded-full border border-[#e2c9ab] bg-[#fffaf2] px-3 py-2 text-xs font-semibold text-[#7e5331] transition-transform hover:-translate-y-0.5 active:scale-95 sm:text-sm"
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
                      disabled={bookingLocked || isBookedSlotStatus(slot.status)}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSlotPick(room.name, slot.time);
                      }}
                      className={`rounded-[14px] px-2 py-3 text-center transition-transform duration-300 active:scale-95 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-80 ${
                        bookingLocked || isBookedSlotStatus(slot.status)
                          ? "bg-slate-200 text-slate-500"
                          : selectedSlots[room.name] === slot.time
                            ? "bg-[#8b5e3c] text-white"
                            : "bg-[#f0dfc9] text-[#7e5331]"
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
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f0dfc9] px-3 py-1 text-sm font-bold text-[#7e5331]">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              Đã Đặt
            </div>
            <p className="mt-3 text-sm leading-6 text-[#9c7450]">Màu trung tính, dễ đọc và không gây rối khi nhìn nhanh trên điện thoại.</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/65 p-4 shadow-[0_10px_30px_rgba(70,98,172,0.06)] backdrop-blur-sm sm:p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f0dfc9] px-3 py-1 text-sm font-bold text-[#7e5331]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#8b5e3c]" />
              Còn Trống
            </div>
            <p className="mt-3 text-sm leading-6 text-[#9c7450]">Nút thời gian được giữ đủ lớn để thao tác thoải mái bằng ngón tay cái.</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/65 p-4 shadow-[0_10px_30px_rgba(70,98,172,0.06)] backdrop-blur-sm sm:p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f0dfc9] px-3 py-1 text-sm font-bold text-[#7e5331]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#8b5e3c]" />
              Đang chọn
            </div>
            <p className="mt-3 text-sm leading-6 text-[#9c7450]">Màu nhấn nổi bật để biết ngay khung giờ nào đang được chọn.</p>
          </div>
        </section>

        <footer className="mt-6 rounded-[30px] border border-white/70 bg-white/70 p-5 shadow-[0_10px_30px_rgba(70,98,172,0.06)] backdrop-blur sm:p-6">
          <div className="mx-auto flex max-w-4xl flex-col gap-5 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#e2c9ab] bg-[#fff8ef] px-4 py-1 text-sm font-semibold tracking-[0.02em] text-[#7e5331]">
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                  <Image src="/LOGO%20FIIN.png" alt="Fiin Home logo" width={32} height={32} className="h-full w-full object-contain" />
                </span>
                <span>Fiin Home</span>
              </div>
              <p className="mx-auto max-w-2xl text-sm leading-6 text-[#9c7450]">{pageData.footerDescription}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 text-sm text-[#7e5331]">
              {pageData.footerTags.map((tag) => (
                <span key={tag} className="rounded-full border border-[#dfe6fb] bg-white px-3 py-2 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:items-stretch">
                <div className="rounded-[24px] border border-[#e2c9ab] bg-[#fff8ef] p-4 text-left shadow-sm">
                <div className="text-center text-sm font-semibold text-[#7e5331] sm:text-left">Liên hệ</div>
                <div className="mt-2 text-center text-sm leading-6 text-[#9c7450] sm:text-left">
                  {footerContactLines.map((line, index) => (
                    <div key={`${line}-${index}`}>{line}</div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-[#e2c9ab] bg-[#fff8ef] p-4 shadow-sm">
                <div className="text-center text-sm font-semibold text-[#7e5331]">Điều hướng nhanh</div>
                <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm text-[#7e5331]">
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
                  <Link href="/dieu-khoan-dich-vu" className="inline-flex min-h-9 items-center rounded-full border border-[#dfe6fb] bg-white px-4 py-1.5 shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95">
                    Điều khoản & dịch vụ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </section>

      {showBookingForm && selectedBookingItem ? (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/45 p-3 sm:p-6">
          <div className="mx-auto w-full max-w-5xl rounded-[20px] bg-[#fff6ea] p-4 text-[#6b4a2d] shadow-[0_20px_70px_rgba(122,84,47,0.18)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black tracking-[-0.01em] leading-[1.08]">Thông tin đặt phòng</h2>
              <button
                className="rounded-lg border border-[#7b8ec7] px-3 py-1 text-sm"
                onClick={() => setShowBookingForm(false)}
              >
                Đóng
              </button>
            </div>

            <RoomDetailBookingPanel
              roomId={selectedBookingItem.room.roomId}
              roomName={selectedBookingItem.room.name}
              areaName={selectedArea}
              slots={selectedBookingItem.room.slots}
              bookingDate={parseDayToDate(selectedDay)}
              selectedDayLabel={selectedDay}
              initialSelectedTime={selectedBookingItem.slot.time}
              onBooked={(feedback) => {
                setSelectedSlots({});
                setShowBookingForm(false);
                setBookingMessage(null);
                setBookingSuccessMessage(feedback);
              }}
            />
          </div>
        </div>
      ) : null}

      {bookingSuccessMessage ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-md rounded-[28px] bg-[#fffaf2] p-6 text-center shadow-[0_20px_70px_rgba(122,84,47,0.24)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="mt-4 text-2xl font-black tracking-[-0.02em] text-[#7e5331]">Đã đặt thành công</h3>
            <p className="mt-2 text-sm leading-6 text-[#9c7450]">{bookingSuccessMessage}</p>
            <p className="mt-2 text-sm text-[#7e5331]">Bạn có thể tra cứu booking ngay để xem lại trạng thái và mã xác nhận.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link href="/tra-cuu-booking" className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#8b5e3c] px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95">
                Tra cứu booking
              </Link>
              <button
                type="button"
                onClick={() => setBookingSuccessMessage(null)}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#e2c9ab] bg-white px-4 py-3 text-sm font-bold text-[#7e5331] shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#d8c2a4] bg-[#8b5e3c] px-4 py-4 text-white shadow-[0_-10px_30px_rgba(122,84,47,0.18)]">
        <div className="mx-auto flex max-w-[430px] items-center justify-between gap-3 sm:max-w-6xl sm:px-2">
          <div>
            <div className="text-sm font-semibold sm:text-base">Tổng cộng: {formatPriceLabel(selectedTotal)}</div>
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
            {bookingLocked ? "Tạm ngưng nhận đặt phòng" : "Đặt phòng"}
          </button>
        </div>
        {bookingLocked && pageData.bookingNotice ? (
          <p className="mx-auto mt-2 max-w-[430px] text-xs text-white/80 sm:max-w-6xl sm:px-2">{pageData.bookingNotice}</p>
        ) : null}
      </div>
    </main>
  );
}
