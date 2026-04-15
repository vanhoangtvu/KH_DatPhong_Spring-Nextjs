"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { compressImageFileToDataUrl } from "@/lib/imageCompression";

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
  bookedSlotTimes: string[];
  booked: boolean;
};

type RoomItem = {
  roomId: number;
  name: string;
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

type BookingDraftState = {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  receiveBookingEmail: boolean;
  guestCount: number;
  transportType: "Xe may" | "Xe o to";
  discountCode: string;
  note: string;
  acceptedTerms: boolean;
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

const formatPriceLikeOriginal = (originalText: string, amount: number) => {
  if (!originalText) return "";
  if (originalText.toLowerCase().includes("k")) {
    return `${Math.round(amount / 1000)}k`;
  }
  return `${amount.toLocaleString("vi-VN")}đ`;
};

const formatBookingFeedback = (value: string | null) => {
  const text = value?.trim() || "";
  const matches = text.match(/[A-Za-z0-9]{6,}/g);
  const confirmationCode = matches?.[matches.length - 1] ?? "";
  return confirmationCode ? `Đặt phòng thành công. Mã xác nhận: ${confirmationCode}` : "Đặt phòng thành công.";
};

const isSuccessFeedback = (value: string | null) => {
  const text = value?.trim().toLowerCase() || "";
  return text.includes("đặt phòng thành công") || text.includes("mã xác nhận") || text.includes("successfully");
};

const isBookedSlotStatus = (status: string) => {
  const normalized = status.trim().toLowerCase();
  return normalized === "đã đặt" || normalized === "hết chỗ";
};

const EMPTY_FORM: BookingFormState = {
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

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatLocalDateString = (dateValue: string) => {
  if (!dateValue || typeof dateValue !== "string") return "";
  const [yearText, monthText, dayText] = dateValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return dateValue;
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? dateValue : parsed.toLocaleDateString("vi-VN");
};

const parseLocalDateString = (dateValue: string) => {
  if (!dateValue) return null;
  const [yearText, monthText, dayText] = dateValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const countDaysInclusive = (startDate: string, endDate: string) => {
  const start = parseLocalDateString(startDate);
  const end = parseLocalDateString(endDate);
  if (!start || !end || end.getTime() < start.getTime()) {
    return 0;
  }

  const millisPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / millisPerDay) + 1;
};

const formatVnd = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "0đ";
  }

  return `${amount.toLocaleString("vi-VN")}đ`;
};

const buildSelectedDayLabel = (startDate: string, endDate: string) => {
  if (!startDate) return "Hôm nay";
  if (!endDate || startDate === endDate) return formatLocalDateString(startDate);
  return `${formatLocalDateString(startDate)} - ${formatLocalDateString(endDate)}`;
};

const getBookingStorageKey = (roomId: number) => `fiin-home-booking-${roomId}`;
const getScrollStorageKey = (roomId: number) => `fiin-home-room-scroll-${roomId}`;

const safeParseBookingForm = (value: string | null): BookingFormState | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<BookingDraftState>;
    return {
      guestName: typeof parsed.guestName === "string" ? parsed.guestName : "",
      guestPhone: typeof parsed.guestPhone === "string" ? parsed.guestPhone : "",
      guestEmail: typeof parsed.guestEmail === "string" ? parsed.guestEmail : "",
      receiveBookingEmail: typeof parsed.receiveBookingEmail === "boolean" ? parsed.receiveBookingEmail : true,
      guestCount: typeof parsed.guestCount === "number" ? parsed.guestCount : 2,
      transportType: parsed.transportType === "Xe o to" ? "Xe o to" : "Xe may",
      discountCode: typeof parsed.discountCode === "string" ? parsed.discountCode : "",
      note: typeof parsed.note === "string" ? parsed.note : "",
      acceptedTerms: typeof parsed.acceptedTerms === "boolean" ? parsed.acceptedTerms : false,
      idCardFrontImage: "",
      idCardBackImage: "",
    };
  } catch {
    return null;
  }
};

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return "";
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
  if (url.includes("/embed/")) return url;
  return "";
};

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Không đọc được file ảnh"));
    reader.readAsDataURL(file);
  });

export default function RoomDetailClient({ 
  room, 
  allRooms, 
  selectedDate, 
  onDateChange,
  promoCode,
  promoPercent,
}: { 
  room: RoomDetailResponse; 
  allRooms: RoomItem[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  promoCode?: string;
  promoPercent?: number;
}) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookingEndDate, setBookingEndDate] = useState(selectedDate);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [scrollRestored, setScrollRestored] = useState(false);

  console.log('RoomDetailClient rendered with room:', room.roomId, room.displayName || room.roomType);

  const gallery = useMemo(() => {
    const images = [room.imageUrl, ...room.gallery].filter(Boolean);
    return Array.from(new Set(images));
  }, [room.imageUrl, room.gallery]);

  const embedUrl = useMemo(() => getYoutubeEmbedUrl(room.videoUrl), [room.videoUrl]);
  const roomPriceLabel = typeof room.roomPrice === "number" ? room.roomPrice.toLocaleString("vi-VN") : String(room.roomPrice);
  const availableSlots = useMemo(() => room.slots.filter((s) => !isBookedSlotStatus(s.status)), [room.slots]);
  const bookedSlotTimes = room.bookedSlotTimes ?? room.slots.filter((slot) => isBookedSlotStatus(slot.status)).map((slot) => slot.time);
  const normalizedPromoCode = promoCode?.trim().toUpperCase() ?? "";
  const normalizedInputCode = bookingForm.discountCode.trim().toUpperCase();
  const isPromoCodeMatched = Boolean(normalizedPromoCode) && normalizedInputCode === normalizedPromoCode;

  const currentIndex = allRooms.findIndex((r) => r.roomId === room.roomId);
  const previousRoom = currentIndex > 0 ? allRooms[currentIndex - 1] : (allRooms.length > 1 ? allRooms[allRooms.length - 1] : null);
  const nextRoom = currentIndex >= 0 && currentIndex < allRooms.length - 1 ? allRooms[currentIndex + 1] : (allRooms.length > 1 ? allRooms[0] : null);

  const navigateToRoom = (roomId: number) => {
    console.log('Navigating to room:', roomId);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Navigate
    router.push(`/room/${roomId}?date=${encodeURIComponent(selectedDate)}`);
  };

  // Swipe handlers for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && nextRoom) {
      console.log('Swipe left to next room');
      navigateToRoom(nextRoom.roomId);
    }
    if (isRightSwipe && previousRoom) {
      console.log('Swipe right to previous room');
      navigateToRoom(previousRoom.roomId);
    }
  };

  const selectedSlotData = room.slots.find((s) => s.time === selectedSlot);
  const selectedSlotItems = useMemo(
    () => room.slots.filter((slot) => selectedSlots.includes(slot.time)),
    [room.slots, selectedSlots],
  );
  const selectedSlotsLabel = selectedSlots.length > 0 ? selectedSlots.join(", ") : "Chưa chọn";
  const bookingDaysCount = countDaysInclusive(selectedDate, bookingEndDate) || 1;
  const selectedPrice = formatVnd(selectedSlotItems.reduce((sum, slot) => sum + parsePriceToVnd(slot.price), 0) * bookingDaysCount);
  const isBookingFormComplete = Boolean(
    selectedSlotItems.length > 0 &&
      bookingForm.guestName.trim() &&
      bookingForm.guestPhone.trim() &&
      bookingForm.guestEmail.trim() &&
      bookingForm.idCardFrontImage &&
      bookingForm.idCardBackImage &&
      bookingForm.acceptedTerms
  );
  const promoSavingsText = useMemo(() => {
    if (!selectedSlotData || !isPromoCodeMatched || !promoPercent || promoPercent <= 0) return null;
    const originalAmount = parsePriceToVnd(selectedSlotData.price);
    if (!originalAmount) return null;
    const discountedAmount = Math.max(0, Math.round(originalAmount * (100 - promoPercent) / 100));
    return formatPriceLikeOriginal(selectedSlotData.price, discountedAmount);
  }, [selectedSlotData, isPromoCodeMatched, promoPercent, bookingForm.discountCode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.sessionStorage.getItem(getBookingStorageKey(room.roomId));
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          selectedSlots?: string[];
          selectedSlot?: string;
          showBookingForm?: boolean;
          bookingForm?: Partial<BookingFormState>;
          bookingEndDate?: string;
        };
        if (Array.isArray(parsed.selectedSlots)) {
          setSelectedSlots(parsed.selectedSlots);
        } else if (typeof parsed.selectedSlot === "string") {
          setSelectedSlots([parsed.selectedSlot]);
        }
        if (typeof parsed.showBookingForm === "boolean") {
          setShowBookingForm(parsed.showBookingForm);
        }
        if (typeof parsed.bookingEndDate === "string") {
          setBookingEndDate(parsed.bookingEndDate);
        }
        if (parsed.bookingForm) {
          setBookingForm((prev) => ({ ...prev, ...parsed.bookingForm }));
        }
      } catch {
        // Ignore malformed draft data.
      }
    }

    setDraftHydrated(true);
  }, [room.roomId]);

  useEffect(() => {
    if (typeof window === "undefined" || !draftHydrated) return;
    const { idCardFrontImage: _frontImage, idCardBackImage: _backImage, ...persistedForm } = bookingForm;
    window.sessionStorage.setItem(
      getBookingStorageKey(room.roomId),
      JSON.stringify({
        bookingForm: persistedForm,
        selectedSlots,
        bookingEndDate,
        showBookingForm,
      })
    );
  }, [room.roomId, bookingForm, selectedSlots, bookingEndDate, showBookingForm, draftHydrated]);

  useEffect(() => {
    if (typeof window === "undefined" || !draftHydrated || scrollRestored) return;

    const storedScroll = window.sessionStorage.getItem(getScrollStorageKey(room.roomId));
    if (!storedScroll) {
      setScrollRestored(true);
      return;
    }

    const targetScroll = Number(storedScroll);
    window.sessionStorage.removeItem(getScrollStorageKey(room.roomId));

    if (!Number.isFinite(targetScroll)) {
      setScrollRestored(true);
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: targetScroll, behavior: "instant" });
      setScrollRestored(true);
    });
  }, [room.roomId, draftHydrated, scrollRestored]);

  // Reset state when room changes
  useEffect(() => {
    console.log('Room changed, resetting state. New room:', room.roomId);
    setMessage(null);
    setScrollRestored(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [room.roomId]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: "idCardFrontImage" | "idCardBackImage") => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setBookingForm((prev) => ({ ...prev, [field]: compressed }));
    } catch {
      setMessage("Không thể tải ảnh lên");
    }
  };

  const handleBooking = async () => {
    if (selectedSlotItems.length === 0) {
      setMessage("Vui lòng chọn ít nhất một khung giờ.");
      return;
    }
    if (!parseLocalDateString(selectedDate) || !parseLocalDateString(bookingEndDate)) {
      setMessage("Vui lòng chọn ngày hợp lệ.");
      return;
    }
    if (parseLocalDateString(bookingEndDate)!.getTime() < parseLocalDateString(selectedDate)!.getTime()) {
      setMessage("Ngày trả phòng phải sau hoặc bằng ngày nhận phòng.");
      return;
    }
    if (!bookingForm.guestName.trim() || !bookingForm.guestPhone.trim() || !bookingForm.guestEmail.trim()) {
      setMessage("Vui lòng nhập đầy đủ họ tên, số điện thoại và email.");
      return;
    }
    if (!bookingForm.acceptedTerms) {
      setMessage("Bạn cần xác nhận điều khoản và điều kiện.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      const response = await fetch(`${API_BASE}/bookings/room/${room.roomId}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInDate: selectedDate,
          checkOutDate: bookingEndDate,
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
          branchName: room.areaName,
          selectedRoomName: room.displayName || room.roomType,
          selectedDayLabel: buildSelectedDayLabel(selectedDate, bookingEndDate),
          selectedSlotTime: selectedSlotsLabel,
          selectedSlotPrice: selectedPrice,
        }),
      });

      const text = await response.text();
      if (!response.ok) throw new Error(text || "Đặt phòng thất bại");

      const feedback = formatBookingFeedback(text);
      setMessage(feedback);
      setBookingForm(EMPTY_FORM);
      setSelectedSlots([]);
      setBookingEndDate(selectedDate);
      setShowBookingForm(false);
      setSuccessMessage(feedback);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Đặt phòng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main 
      className="min-h-screen bg-[linear-gradient(180deg,#f7f0e2_0%,#f1e2c8_55%,#ead5b5_100%)] px-3 py-4 text-[#6a4a2d] sm:px-4 sm:py-6"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="rounded-full border border-[#e2c9ab] bg-[#fffaf2] px-3 py-2 text-xs font-semibold text-[#8b5e3c] shadow-sm transition-all hover:shadow-md sm:px-4 sm:text-sm"
          >
            ← Trang chủ
          </Link>
          
          {allRooms.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (previousRoom) {
                    console.log('Previous room:', previousRoom);
                    navigateToRoom(previousRoom.roomId);
                  }
                }}
                disabled={!previousRoom}
                className="rounded-full border-2 border-[#8b5e3c] bg-[#fffaf2] px-3 py-2 text-xs font-bold text-[#8b5e3c] shadow-md transition-all hover:bg-[#8b5e3c] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:opacity-50 sm:px-4 sm:text-sm"
              >
                <span className="hidden sm:inline">‹ {previousRoom?.name || "Trước"}</span>
                <span className="sm:hidden">‹</span>
              </button>
              <button
                onClick={() => {
                  if (nextRoom) {
                    console.log('Next room:', nextRoom);
                    navigateToRoom(nextRoom.roomId);
                  }
                }}
                disabled={!nextRoom}
                className="rounded-full border-2 border-[#8b5e3c] bg-[#fffaf2] px-3 py-2 text-xs font-bold text-[#8b5e3c] shadow-md transition-all hover:bg-[#8b5e3c] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:opacity-50 sm:px-4 sm:text-sm"
              >
                <span className="hidden sm:inline">{nextRoom?.name || "Sau"} ›</span>
                <span className="sm:hidden">›</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Room Selector */}
        {allRooms.length > 1 && (
          <div className="mb-4 rounded-2xl bg-white p-3 shadow-md sm:hidden">
            <label className="mb-2 block text-xs font-semibold text-[#8b5e3c]">Chọn phòng khác:</label>
            <select
              value={room.roomId}
              onChange={(e) => navigateToRoom(Number(e.target.value))}
              className="w-full rounded-xl border border-[#eadcc9] bg-[#fffaf2] px-3 py-2 text-sm font-semibold text-[#8b5e3c] outline-none focus:border-[#8b5e3c]"
            >
              {allRooms.map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Selector */}
        <div className="mb-4 rounded-2xl bg-white p-3 shadow-md sm:p-4">
          <label className="mb-2 block text-xs font-semibold text-[#8b5e3c] sm:text-sm">Chọn ngày:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            min={getLocalDateString()}
            className="w-full rounded-xl border border-[#eadcc9] bg-[#fffaf2] px-3 py-2 text-sm font-semibold text-[#8b5e3c] outline-none focus:border-[#8b5e3c]"
          />
          <p className="mt-2 text-xs text-slate-500">
            Xem khung giờ còn trống cho ngày {formatLocalDateString(selectedDate)}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
          {/* Left Column */}
          <div className="space-y-4 lg:space-y-6">
            {/* Room Header */}
            <div className="rounded-2xl bg-white p-4 shadow-lg sm:rounded-3xl sm:p-6">
              <div className="mb-3 inline-flex rounded-full bg-[#f0dfc9] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#8b5e3c] sm:mb-4 sm:px-4 sm:text-xs">
                Chi tiết phòng
              </div>
              <h1 className="text-2xl font-black text-[#6f4b2d] sm:text-3xl lg:text-4xl">{room.displayName || room.roomType}</h1>
              <p className="mt-1 text-sm text-slate-500 sm:mt-2 sm:text-base">Khu vực: {room.areaName}</p>
              
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                <span className="rounded-full bg-[#f7efe4] px-2.5 py-1 text-xs font-semibold text-[#8b5e3c] sm:px-3 sm:py-1.5 sm:text-sm">{room.roomType}</span>
                <span className="rounded-full bg-[#f7efe4] px-2.5 py-1 text-xs font-semibold text-[#8b5e3c] sm:px-3 sm:py-1.5 sm:text-sm">{roomPriceLabel}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold sm:px-3 sm:py-1.5 sm:text-sm ${room.booked ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>
                  {room.booked ? "Đã có booking" : "Còn nhận booking"}
                </span>
              </div>
            </div>

            {/* Gallery */}
            <div className="rounded-2xl bg-white p-3 shadow-lg sm:rounded-3xl sm:p-4">
              <div className="overflow-hidden rounded-xl sm:rounded-2xl">
                <div className="aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `url("${gallery[0]}")` }} />
              </div>
              
              {gallery.length > 1 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
                  {gallery.slice(1, 4).map((img, index) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-lg sm:rounded-xl">
                      <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${img}")` }} />
                    </div>
                  ))}
                </div>
              )}

              {embedUrl && (
                <div className="mt-3 overflow-hidden rounded-lg sm:mt-4 sm:rounded-xl">
                  <iframe
                    className="aspect-video w-full"
                    src={embedUrl}
                    title={`Video ${room.displayName || room.roomType}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Description */}
            {room.description && (
              <div className="rounded-2xl bg-white p-4 shadow-lg sm:rounded-3xl sm:p-6">
                <h2 className="text-lg font-bold text-[#8b5e3c] sm:text-xl">Mô tả chi tiết</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 sm:mt-3 sm:text-base sm:leading-7">{room.description}</p>
              </div>
            )}

            {/* Features */}
            <div className="rounded-2xl bg-white p-4 shadow-lg sm:rounded-3xl sm:p-6">
              <h2 className="text-lg font-bold text-[#8b5e3c] sm:text-xl">Tiện ích</h2>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                {room.features.length > 0 ? (
                  room.features.map((feature) => (
                    <span key={feature} className="rounded-full bg-[#f0dfc9] px-3 py-1.5 text-xs font-semibold text-[#8b5e3c] sm:px-4 sm:py-2 sm:text-sm">
                      {feature}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Chưa có tiện ích.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="space-y-4 lg:space-y-6">
            {/* Time Slots */}
            <div className="rounded-2xl bg-white p-4 shadow-lg sm:rounded-3xl sm:p-6">
              <h2 className="text-lg font-bold text-[#8b5e3c] sm:text-xl">Khung giờ có sẵn</h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">{availableSlots.length} khung giờ còn trống</p>
              
              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                {room.slots.map((slot) => {
                  const isDisabled = isBookedSlotStatus(slot.status);
                  const isSelected = selectedSlots.includes(slot.time);
                  return (
                    <button
                      key={slot.time}
                      disabled={isDisabled}
                      onClick={() => setSelectedSlots((prev) => (prev.includes(slot.time) ? prev.filter((time) => time !== slot.time) : [...prev, slot.time]))}
                      className={`rounded-xl px-2 py-2.5 text-center transition-all sm:rounded-2xl sm:px-3 sm:py-3 ${
                        isDisabled
                          ? "cursor-not-allowed bg-slate-200 text-slate-500 opacity-60"
                          : isSelected
                            ? "bg-[#8b5e3c] text-white shadow-md"
                            : "bg-[#f7efe4] text-[#8b5e3c] hover:bg-[#f0dfc9]"
                      }`}
                    >
                      <div className="text-xs font-semibold sm:text-sm">{slot.time}</div>
                      <div className="mt-0.5 text-xs font-bold sm:mt-1">{slot.price}</div>
                      <div className="mt-0.5 text-[10px] sm:mt-1 sm:text-xs">{slot.status}</div>
                    </button>
                  );
                })}
              </div>

              {bookedSlotTimes.length > 0 ? (
                <div className="mt-4 rounded-xl border border-[#e2c9ab] bg-[#fffaf2] p-3 sm:mt-5 sm:rounded-2xl sm:p-4">
                  <div className="text-sm font-semibold text-[#8b5e3c] sm:text-base">Khung giờ đã được đặt</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {bookedSlotTimes.map((time) => (
                      <span key={time} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:text-sm">
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {!showBookingForm && selectedSlotItems.length > 0 && (
                <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
                  <div className="rounded-xl bg-[#fffaf2] p-3 sm:rounded-2xl sm:p-4">
                    <div className="text-xs font-semibold text-[#8b5e3c] sm:text-sm">Thông tin đặt phòng</div>
                    <div className="mt-2 space-y-1 text-xs text-slate-600 sm:text-sm">
                      <div><span className="font-semibold">Phòng:</span> {room.displayName || room.roomType}</div>
                      <div><span className="font-semibold">Khu vực:</span> {room.areaName}</div>
                      <div><span className="font-semibold">Ngày nhận:</span> {formatLocalDateString(selectedDate)}</div>
                      <div><span className="font-semibold">Ngày trả:</span> {formatLocalDateString(bookingEndDate)}</div>
                      <div><span className="font-semibold">Khung giờ:</span> {selectedSlotsLabel}</div>
                      <div><span className="font-semibold">Số ngày:</span> {bookingDaysCount}</div>
                      <div><span className="font-semibold">Giá:</span> {selectedPrice}</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#8b5e3c] sm:text-sm">Ngày nhận</label>
                      <input
                        type="date"
                        value={selectedDate}
                        disabled
                        className="w-full rounded-lg border border-[#eadcc9] bg-slate-100 px-3 py-2 text-sm outline-none sm:rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#8b5e3c] sm:text-sm">Ngày trả</label>
                      <input
                        type="date"
                        min={selectedDate}
                        value={bookingEndDate}
                        onChange={(e) => setBookingEndDate(e.target.value)}
                        className="w-full rounded-lg border border-[#eadcc9] px-3 py-2 text-sm outline-none focus:border-[#8b5e3c] sm:rounded-xl"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setShowBookingForm(true)}
                    disabled={selectedSlotItems.length === 0}
                    className="w-full rounded-xl bg-[#8b5e3c] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#734a2d] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:py-3"
                  >
                    Đặt phòng ngay
                  </button>
                </div>
              )}
            </div>

            {/* Booking Form */}
            {showBookingForm && selectedSlotItems.length > 0 && (
              <div className="rounded-2xl bg-white p-4 shadow-lg sm:rounded-3xl sm:p-6">
                <h2 className="text-lg font-bold text-[#8b5e3c] sm:text-xl">Thông tin khách hàng</h2>

                <div className="mt-3 rounded-2xl bg-[#f3e2cd] p-3 text-xs text-[#6b4a2d] sm:text-sm">
                  <div className="grid gap-1 sm:grid-cols-2">
                    <div><span className="font-semibold">Ngày nhận:</span> {formatLocalDateString(selectedDate)}</div>
                    <div><span className="font-semibold">Ngày trả:</span> {formatLocalDateString(bookingEndDate)}</div>
                    <div className="sm:col-span-2"><span className="font-semibold">Khung giờ:</span> {selectedSlotsLabel}</div>
                    <div><span className="font-semibold">Số ngày:</span> {bookingDaysCount}</div>
                    <div><span className="font-semibold">Tổng tiền:</span> {selectedPrice}</div>
                  </div>
                </div>
                
                <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8b5e3c] sm:text-sm">Họ tên *</label>
                    <input
                      className="w-full rounded-lg border border-[#eadcc9] px-3 py-2 text-sm outline-none focus:border-[#8b5e3c] sm:rounded-xl"
                      value={bookingForm.guestName}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, guestName: e.target.value }))}
                      placeholder="Nhập họ tên"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8b5e3c] sm:text-sm">Số điện thoại *</label>
                    <input
                      className="w-full rounded-lg border border-[#eadcc9] px-3 py-2 text-sm outline-none focus:border-[#8b5e3c] sm:rounded-xl"
                      value={bookingForm.guestPhone}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, guestPhone: e.target.value }))}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8b5e3c] sm:text-sm">Email *</label>
                    <input
                      type="email"
                      className="w-full rounded-lg border border-[#eadcc9] px-3 py-2 text-sm outline-none focus:border-[#8b5e3c] sm:rounded-xl"
                      value={bookingForm.guestEmail}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, guestEmail: e.target.value }))}
                      placeholder="Nhập email"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={bookingForm.receiveBookingEmail}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, receiveBookingEmail: e.target.checked }))}
                    />
                    Gửi thông tin booking vào email
                  </label>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8b5e3c] sm:text-sm">Số lượng khách</label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setBookingForm((prev) => ({ ...prev, guestCount: Math.max(1, prev.guestCount - 1) }))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f7efe4] text-base font-bold text-[#8b5e3c] sm:h-10 sm:w-10 sm:rounded-xl sm:text-lg"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="w-16 rounded-lg border border-[#eadcc9] px-2 py-2 text-center text-sm outline-none focus:border-[#8b5e3c] sm:w-20 sm:rounded-xl sm:px-3"
                        value={bookingForm.guestCount}
                        onChange={(e) => setBookingForm((prev) => ({ ...prev, guestCount: Math.max(1, Number(e.target.value)) }))}
                      />
                      <button
                        type="button"
                        onClick={() => setBookingForm((prev) => ({ ...prev, guestCount: prev.guestCount + 1 }))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f7efe4] text-base font-bold text-[#8b5e3c] sm:h-10 sm:w-10 sm:rounded-xl sm:text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8b5e3c] sm:text-sm">Phương tiện</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingForm((prev) => ({ ...prev, transportType: "Xe may" }))}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:rounded-xl sm:px-4 sm:text-sm ${
                          bookingForm.transportType === "Xe may" ? "bg-[#8b5e3c] text-white" : "bg-[#f7efe4] text-[#8b5e3c]"
                        }`}
                      >
                        Xe máy
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingForm((prev) => ({ ...prev, transportType: "Xe o to" }))}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:rounded-xl sm:px-4 sm:text-sm ${
                          bookingForm.transportType === "Xe o to" ? "bg-[#8b5e3c] text-white" : "bg-[#f7efe4] text-[#8b5e3c]"
                        }`}
                      >
                        Xe ô tô
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border-2 border-dashed border-[#eadcc9] bg-[#fffaf2] p-3 sm:rounded-xl sm:p-4">
                    <label className="mb-2 block text-xs font-semibold text-[#8b5e3c] sm:text-sm">CMND/CCCD</label>
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1 block text-[10px] text-slate-600 sm:text-xs">Mặt trước</label>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "idCardFrontImage")} className="w-full text-[10px] sm:text-xs" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-slate-600 sm:text-xs">Mặt sau</label>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "idCardBackImage")} className="w-full text-[10px] sm:text-xs" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8b5e3c] sm:text-sm">Mã giảm giá</label>
                    <input
                      className="w-full rounded-lg border border-[#eadcc9] px-3 py-2 text-sm outline-none focus:border-[#8b5e3c] sm:rounded-xl"
                      value={bookingForm.discountCode}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, discountCode: e.target.value }))}
                      placeholder="Nhập mã giảm giá (nếu có)"
                    />
                    {normalizedPromoCode ? (
                      <p className="mt-1 text-[11px] text-[#9c7450] sm:text-xs">
                        Mã hợp lệ: <span className="font-semibold text-[#8b5e3c]">{normalizedPromoCode}</span>
                        {promoPercent ? ` - giảm ${promoPercent}%` : ""}
                      </p>
                    ) : null}
                    {promoSavingsText ? (
                      <p className="mt-1 text-[11px] font-semibold text-emerald-700 sm:text-xs">
                        Giá sau giảm: {promoSavingsText}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8b5e3c] sm:text-sm">Ghi chú</label>
                    <textarea
                      className="w-full rounded-lg border border-[#eadcc9] px-3 py-2 text-sm outline-none focus:border-[#8b5e3c] sm:rounded-xl"
                      rows={3}
                      value={bookingForm.note}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="Ghi chú thêm (nếu có)"
                    />
                  </div>

                  <label className="flex items-start gap-2 text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={bookingForm.acceptedTerms}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, acceptedTerms: e.target.checked }))}
                      className="mt-0.5"
                    />
                    <span>
                      Tôi xác nhận đã đọc và đồng ý với{' '}
                      <Link
                        href="/dieu-khoan-dich-vu"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.sessionStorage.setItem(getScrollStorageKey(room.roomId), String(window.scrollY));
                          }
                        }}
                        className="font-semibold text-[#8b5e3c] underline decoration-[#d4aa7a] underline-offset-2 hover:text-[#734a2d]"
                      >
                        điều khoản và điều kiện
                      </Link>{' '}
                      của Fiin Home
                    </span>
                  </label>

                  {message && (
                    <p className={`text-xs sm:text-sm ${isSuccessFeedback(message) ? "text-emerald-700" : "text-red-600"}`}>
                      {message}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingForm(false);
                        setMessage(null);
                      }}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 sm:rounded-2xl sm:px-4 sm:py-3"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      disabled={submitting || !isBookingFormComplete}
                      onClick={handleBooking}
                      className="flex-1 rounded-xl bg-[#8b5e3c] px-3 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#734a2d] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-4 sm:py-3"
                    >
                      {submitting ? "Đang gửi..." : "Đặt"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {successMessage ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-md rounded-[28px] bg-[#fffaf2] p-6 text-center shadow-[0_20px_70px_rgba(122,84,47,0.24)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="mt-4 text-2xl font-black tracking-[-0.02em] text-[#7e5331]">Đã đặt thành công</h3>
            <p className="mt-2 text-sm leading-6 text-[#9c7450]">{successMessage}</p>
            <p className="mt-2 text-sm text-[#7e5331]">Bạn có thể tra cứu lại booking để xem trạng thái và mã xác nhận.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link href="/tra-cuu-booking" className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#8b5e3c] px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95">
                Tra cứu booking
              </Link>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#e2c9ab] bg-white px-4 py-3 text-sm font-bold text-[#7e5331] shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
