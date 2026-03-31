"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

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
  onDateChange 
}: { 
  room: RoomDetailResponse; 
  allRooms: RoomItem[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  console.log('RoomDetailClient rendered with room:', room.roomId, room.displayName || room.roomType);

  const gallery = useMemo(() => {
    const images = [room.imageUrl, ...room.gallery].filter(Boolean);
    return Array.from(new Set(images));
  }, [room.imageUrl, room.gallery]);

  const embedUrl = useMemo(() => getYoutubeEmbedUrl(room.videoUrl), [room.videoUrl]);
  const roomPriceLabel = typeof room.roomPrice === "number" ? room.roomPrice.toLocaleString("vi-VN") : String(room.roomPrice);
  const availableSlots = useMemo(() => room.slots.filter((s) => s.status !== "Đã Đặt" && s.status !== "Hết chỗ"), [room.slots]);

  const currentIndex = allRooms.findIndex((r) => r.roomId === room.roomId);
  const previousRoom = currentIndex > 0 ? allRooms[currentIndex - 1] : (allRooms.length > 1 ? allRooms[allRooms.length - 1] : null);
  const nextRoom = currentIndex >= 0 && currentIndex < allRooms.length - 1 ? allRooms[currentIndex + 1] : (allRooms.length > 1 ? allRooms[0] : null);

  const navigateToRoom = (roomId: number) => {
    console.log('Navigating to room:', roomId);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Navigate
    router.push(`/room/${roomId}`);
    // Force refresh after navigation
    setTimeout(() => {
      router.refresh();
    }, 100);
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

  // Reset state when room changes
  useEffect(() => {
    console.log('Room changed, resetting state. New room:', room.roomId);
    setSelectedSlot("");
    setShowBookingForm(false);
    setBookingForm(EMPTY_FORM);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [room.roomId]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: "idCardFrontImage" | "idCardBackImage") => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await toBase64(file);
      setBookingForm((prev) => ({ ...prev, [field]: base64 }));
    } catch {
      setMessage("Không thể tải ảnh lên");
    }
  };

  const handleBooking = async () => {
    if (!selectedSlotData) {
      setMessage("Vui lòng chọn khung giờ.");
      return;
    }
    if (selectedSlotData.status === "Đã Đặt" || selectedSlotData.status === "Hết chỗ") {
      setMessage("Khung giờ này đã được đặt.");
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
          checkOutDate: selectedDate,
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
          selectedDayLabel: new Date(selectedDate).toLocaleDateString('vi-VN'),
          selectedSlotTime: selectedSlotData.time,
          selectedSlotPrice: selectedSlotData.price,
        }),
      });

      const text = await response.text();
      if (!response.ok) throw new Error(text || "Đặt phòng thất bại");

      setMessage(text || "Đặt phòng thành công");
      setBookingForm(EMPTY_FORM);
      setTimeout(() => {
        setShowBookingForm(false);
        router.refresh();
      }, 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Đặt phòng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main 
      className="min-h-screen bg-[linear-gradient(180deg,#f4f5f7_0%,#eef2ff_100%)] px-3 py-4 text-[#25335a] sm:px-4 sm:py-6"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="rounded-full border border-[#cfe0ff] bg-white px-3 py-2 text-xs font-semibold text-[#4361af] shadow-sm transition-all hover:shadow-md sm:px-4 sm:text-sm"
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
                className="rounded-full border-2 border-[#4361af] bg-white px-3 py-2 text-xs font-bold text-[#4361af] shadow-md transition-all hover:bg-[#4361af] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:opacity-50 sm:px-4 sm:text-sm"
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
                className="rounded-full border-2 border-[#4361af] bg-white px-3 py-2 text-xs font-bold text-[#4361af] shadow-md transition-all hover:bg-[#4361af] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:opacity-50 sm:px-4 sm:text-sm"
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
            <label className="mb-2 block text-xs font-semibold text-[#4f67b0]">Chọn phòng khác:</label>
            <select
              value={room.roomId}
              onChange={(e) => navigateToRoom(Number(e.target.value))}
              className="w-full rounded-xl border border-[#d7e3ff] bg-white px-3 py-2 text-sm font-semibold text-[#4361af] outline-none focus:border-[#4361af]"
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
          <label className="mb-2 block text-xs font-semibold text-[#4f67b0] sm:text-sm">Chọn ngày:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-xl border border-[#d7e3ff] bg-white px-3 py-2 text-sm font-semibold text-[#4361af] outline-none focus:border-[#4361af]"
          />
          <p className="mt-2 text-xs text-slate-500">
            Xem khung giờ còn trống cho ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
          {/* Left Column */}
          <div className="space-y-4 lg:space-y-6">
            {/* Room Header */}
            <div className="rounded-2xl bg-white p-4 shadow-lg sm:rounded-3xl sm:p-6">
              <div className="mb-3 inline-flex rounded-full bg-[#d7e3ff] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#4361af] sm:mb-4 sm:px-4 sm:text-xs">
                Chi tiết phòng
              </div>
              <h1 className="text-2xl font-black text-[#324a91] sm:text-3xl lg:text-4xl">{room.displayName || room.roomType}</h1>
              <p className="mt-1 text-sm text-slate-500 sm:mt-2 sm:text-base">Khu vực: {room.areaName}</p>
              
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                <span className="rounded-full bg-[#eef3ff] px-2.5 py-1 text-xs font-semibold text-[#4361af] sm:px-3 sm:py-1.5 sm:text-sm">{room.roomType}</span>
                <span className="rounded-full bg-[#eef3ff] px-2.5 py-1 text-xs font-semibold text-[#4361af] sm:px-3 sm:py-1.5 sm:text-sm">{roomPriceLabel}</span>
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
                <h2 className="text-lg font-bold text-[#4f67b0] sm:text-xl">Mô tả chi tiết</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 sm:mt-3 sm:text-base sm:leading-7">{room.description}</p>
              </div>
            )}

            {/* Features */}
            <div className="rounded-2xl bg-white p-4 shadow-lg sm:rounded-3xl sm:p-6">
              <h2 className="text-lg font-bold text-[#4f67b0] sm:text-xl">Tiện ích</h2>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                {room.features.length > 0 ? (
                  room.features.map((feature) => (
                    <span key={feature} className="rounded-full bg-[#dfe9ff] px-3 py-1.5 text-xs font-semibold text-[#4361af] sm:px-4 sm:py-2 sm:text-sm">
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
              <h2 className="text-lg font-bold text-[#4f67b0] sm:text-xl">Khung giờ có sẵn</h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">{availableSlots.length} khung giờ còn trống</p>
              
              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                {room.slots.map((slot) => {
                  const isDisabled = slot.status === "Đã Đặt" || slot.status === "Hết chỗ";
                  const isSelected = selectedSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      disabled={isDisabled}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`rounded-xl px-2 py-2.5 text-center transition-all sm:rounded-2xl sm:px-3 sm:py-3 ${
                        isDisabled
                          ? "cursor-not-allowed bg-slate-200 text-slate-500 opacity-60"
                          : isSelected
                            ? "bg-[#4c67b2] text-white shadow-md"
                            : "bg-[#eef3ff] text-[#4361af] hover:bg-[#dfe9ff]"
                      }`}
                    >
                      <div className="text-xs font-semibold sm:text-sm">{slot.time}</div>
                      <div className="mt-0.5 text-xs font-bold sm:mt-1">{slot.price}</div>
                      <div className="mt-0.5 text-[10px] sm:mt-1 sm:text-xs">{slot.status}</div>
                    </button>
                  );
                })}
              </div>

              {!showBookingForm && selectedSlotData && (
                <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
                  <div className="rounded-xl bg-[#f8faff] p-3 sm:rounded-2xl sm:p-4">
                    <div className="text-xs font-semibold text-[#4f67b0] sm:text-sm">Thông tin đặt phòng</div>
                    <div className="mt-2 space-y-1 text-xs text-slate-600 sm:text-sm">
                      <div><span className="font-semibold">Phòng:</span> {room.displayName || room.roomType}</div>
                      <div><span className="font-semibold">Khu vực:</span> {room.areaName}</div>
                      <div><span className="font-semibold">Giờ:</span> {selectedSlotData.time}</div>
                      <div><span className="font-semibold">Giá:</span> {selectedSlotData.price}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowBookingForm(true)}
                    disabled={selectedSlotData.status === "Đã Đặt" || selectedSlotData.status === "Hết chỗ"}
                    className="w-full rounded-xl bg-[#425ca7] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#324a91] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:py-3"
                  >
                    Đặt phòng ngay
                  </button>
                </div>
              )}
            </div>

            {/* Booking Form */}
            {showBookingForm && selectedSlotData && (
              <div className="rounded-2xl bg-white p-4 shadow-lg sm:rounded-3xl sm:p-6">
                <h2 className="text-lg font-bold text-[#4f67b0] sm:text-xl">Thông tin khách hàng</h2>
                
                <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f67b0] sm:text-sm">Họ tên *</label>
                    <input
                      className="w-full rounded-lg border border-[#d7e3ff] px-3 py-2 text-sm outline-none focus:border-[#4361af] sm:rounded-xl"
                      value={bookingForm.guestName}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, guestName: e.target.value }))}
                      placeholder="Nhập họ tên"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f67b0] sm:text-sm">Số điện thoại *</label>
                    <input
                      className="w-full rounded-lg border border-[#d7e3ff] px-3 py-2 text-sm outline-none focus:border-[#4361af] sm:rounded-xl"
                      value={bookingForm.guestPhone}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, guestPhone: e.target.value }))}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f67b0] sm:text-sm">Email *</label>
                    <input
                      type="email"
                      className="w-full rounded-lg border border-[#d7e3ff] px-3 py-2 text-sm outline-none focus:border-[#4361af] sm:rounded-xl"
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
                    <label className="mb-1 block text-xs font-semibold text-[#4f67b0] sm:text-sm">Số lượng khách</label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setBookingForm((prev) => ({ ...prev, guestCount: Math.max(1, prev.guestCount - 1) }))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef3ff] text-base font-bold text-[#4361af] sm:h-10 sm:w-10 sm:rounded-xl sm:text-lg"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="w-16 rounded-lg border border-[#d7e3ff] px-2 py-2 text-center text-sm outline-none focus:border-[#4361af] sm:w-20 sm:rounded-xl sm:px-3"
                        value={bookingForm.guestCount}
                        onChange={(e) => setBookingForm((prev) => ({ ...prev, guestCount: Math.max(1, Number(e.target.value)) }))}
                      />
                      <button
                        type="button"
                        onClick={() => setBookingForm((prev) => ({ ...prev, guestCount: prev.guestCount + 1 }))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef3ff] text-base font-bold text-[#4361af] sm:h-10 sm:w-10 sm:rounded-xl sm:text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f67b0] sm:text-sm">Phương tiện</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingForm((prev) => ({ ...prev, transportType: "Xe may" }))}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:rounded-xl sm:px-4 sm:text-sm ${
                          bookingForm.transportType === "Xe may" ? "bg-[#4c67b2] text-white" : "bg-[#eef3ff] text-[#4361af]"
                        }`}
                      >
                        Xe máy
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingForm((prev) => ({ ...prev, transportType: "Xe o to" }))}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:rounded-xl sm:px-4 sm:text-sm ${
                          bookingForm.transportType === "Xe o to" ? "bg-[#4c67b2] text-white" : "bg-[#eef3ff] text-[#4361af]"
                        }`}
                      >
                        Xe ô tô
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border-2 border-dashed border-[#d7e3ff] bg-[#f8faff] p-3 sm:rounded-xl sm:p-4">
                    <label className="mb-2 block text-xs font-semibold text-[#4f67b0] sm:text-sm">CMND/CCCD</label>
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
                    <label className="mb-1 block text-xs font-semibold text-[#4f67b0] sm:text-sm">Mã giảm giá</label>
                    <input
                      className="w-full rounded-lg border border-[#d7e3ff] px-3 py-2 text-sm outline-none focus:border-[#4361af] sm:rounded-xl"
                      value={bookingForm.discountCode}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, discountCode: e.target.value }))}
                      placeholder="Nhập mã giảm giá (nếu có)"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f67b0] sm:text-sm">Ghi chú</label>
                    <textarea
                      className="w-full rounded-lg border border-[#d7e3ff] px-3 py-2 text-sm outline-none focus:border-[#4361af] sm:rounded-xl"
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
                    <span>Tôi xác nhận đã đọc và đồng ý với điều khoản và điều kiện của Fiin Home</span>
                  </label>

                  {message && <p className="text-xs text-red-600 sm:text-sm">{message}</p>}

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
                      disabled={submitting}
                      onClick={handleBooking}
                      className="flex-1 rounded-xl bg-[#425ca7] px-3 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#324a91] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-4 sm:py-3"
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
    </main>
  );
}
