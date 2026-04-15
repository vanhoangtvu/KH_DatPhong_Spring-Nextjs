"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { compressImageFileToDataUrl } from "@/lib/imageCompression";

type Slot = {
  time: string;
  price: string;
  status: string;
};

type Props = {
  roomId: number;
  roomName: string;
  areaName: string;
  slots: Slot[];
  bookingDate?: string;
  selectedDayLabel?: string;
  initialSelectedTime?: string;
  onBooked?: (feedback: string) => void;
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

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
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

const addDays = (dateValue: string, days: number) => {
  const parsed = parseLocalDateString(dateValue);
  if (!parsed) return dateValue;

  const nextDate = new Date(parsed);
  nextDate.setDate(parsed.getDate() + days);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
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

const parsePriceToVnd = (value: string) => {
  if (!value) return 0;
  const normalized = value.trim().toLowerCase().replace(/đ|\s/g, "");
  const isKUnit = normalized.endsWith("k");
  const digits = normalized.replace(/[^0-9]/g, "");
  if (!digits) return 0;
  const amount = Number(digits);
  return Number.isFinite(amount) ? (isKUnit ? amount * 1000 : amount) : 0;
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

const extractConfirmationCode = (value: string | null) => {
  const text = value?.trim() || "";
  if (!text) {
    return "";
  }

  const matches = text.match(/[A-Za-z0-9]{6,}/g);
  return matches?.[matches.length - 1] ?? "";
};

const isSuccessFeedback = (value: string | null) => {
  const text = value?.trim().toLowerCase() || "";
  return text.includes("đặt phòng thành công") || text.includes("mã xác nhận") || text.includes("successfully");
};

export default function RoomDetailBookingPanel({
  roomId,
  roomName,
  areaName,
  slots,
  bookingDate,
  selectedDayLabel,
  initialSelectedTime,
  onBooked,
}: Props) {
  const router = useRouter();
  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.status !== "Đã Đặt" && slot.status !== "Hết chỗ"),
    [slots],
  );
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(initialSelectedTime ? [initialSelectedTime] : availableSlots[0]?.time ? [availableSlots[0].time] : []);
  const [bookingEndDate, setBookingEndDate] = useState(bookingDate ?? getTodayDate());
  const [bookingForm, setBookingForm] = useState<BookingFormState>(EMPTY_BOOKING_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const bookingStartDate = bookingDate ?? getTodayDate();

  useEffect(() => {
    if (initialSelectedTime) {
      setSelectedTimes((prev) => (prev.includes(initialSelectedTime) ? prev : [initialSelectedTime]));
    }
  }, [initialSelectedTime]);

  useEffect(() => {
    if (!bookingEndDate) {
      setBookingEndDate(bookingStartDate);
      return;
    }

    const start = parseLocalDateString(bookingStartDate);
    const end = parseLocalDateString(bookingEndDate);
    if (start && end && end.getTime() < start.getTime()) {
      setBookingEndDate(bookingStartDate);
    }
  }, [bookingStartDate, bookingEndDate]);

  const selectedSlotItems = useMemo(
    () => slots.filter((slot) => selectedTimes.includes(slot.time)),
    [slots, selectedTimes],
  );
  const selectedTimesLabel = selectedTimes.length > 0 ? selectedTimes.join(", ") : "Chưa chọn";
  const selectedDaysCount = countDaysInclusive(bookingStartDate, bookingEndDate) || 1;
  const selectedPrice = formatVnd(selectedSlotItems.reduce((sum, slot) => sum + parsePriceToVnd(slot.price), 0) * selectedDaysCount);
  const isBookingFormComplete = Boolean(
    selectedSlotItems.length > 0 &&
      bookingForm.guestName.trim() &&
      bookingForm.guestPhone.trim() &&
      bookingForm.guestEmail.trim() &&
      bookingForm.idCardFrontImage &&
      bookingForm.idCardBackImage &&
      bookingForm.acceptedTerms
  );

  const handleBook = async () => {
    if (selectedSlotItems.length === 0) {
      setMessage("Vui lòng chọn ít nhất một khung giờ.");
      return;
    }
    if (!parseLocalDateString(bookingStartDate) || !parseLocalDateString(bookingEndDate)) {
      setMessage("Vui lòng chọn ngày hợp lệ.");
      return;
    }
    if (parseLocalDateString(bookingEndDate)!.getTime() < parseLocalDateString(bookingStartDate)!.getTime()) {
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
      const response = await fetch(`${API_BASE}/bookings/room/${roomId}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInDate: bookingStartDate,
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
          branchName: areaName,
          selectedRoomName: roomName,
          selectedDayLabel: buildSelectedDayLabel(bookingStartDate, bookingEndDate),
          selectedSlotTime: selectedTimesLabel,
          selectedSlotPrice: selectedPrice,
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || "Đặt phòng thất bại");
      }

      const confirmationCode = extractConfirmationCode(text);
      const feedback = confirmationCode
        ? `Đặt phòng thành công. Mã xác nhận: ${confirmationCode}`
        : "Đặt phòng thành công.";
      setMessage(feedback);
      setBookingForm(EMPTY_BOOKING_FORM);
      setSelectedTimes([]);
      setBookingEndDate(bookingStartDate);
      setShowBookingForm(false);
      onBooked?.(feedback);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Đặt phòng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: "idCardFrontImage" | "idCardBackImage") => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setBookingForm((prev) => ({ ...prev, [field]: compressed }));
    } catch (error) {
      setMessage("Không thể tải ảnh lên");
    }
  };

  return (
    <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(122,84,47,0.08)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-bold text-[#8b5e3c] sm:text-lg">Khung giờ có sẵn</div>
          <p className="mt-1 text-xs text-[#9c7450] sm:text-sm">Xem các khung giờ còn trống và đặt ngay.</p>
        </div>
        <span className="rounded-full bg-[#f0dfc9] px-3 py-1 text-[11px] font-semibold text-[#7e5331]">{availableSlots.length} giờ</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        {slots.map((slot) => {
          const isDisabled = slot.status === "Đã Đặt" || slot.status === "Hết chỗ";
          const isSelected = selectedTimes.includes(slot.time);
          return (
            <button
              key={slot.time}
              type="button"
              disabled={isDisabled}
              onClick={() => setSelectedTimes((prev) => (prev.includes(slot.time) ? prev.filter((time) => time !== slot.time) : [...prev, slot.time]))}
              className={`rounded-[18px] px-3 py-3 text-center shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                isDisabled ? "bg-slate-200 text-slate-500" : isSelected ? "bg-[#8b5e3c] text-white" : "bg-[#f7efe4] text-[#8b5e3c]"
              }`}
            >
              <div className="text-sm font-semibold">{slot.time}</div>
              <div className="mt-1 text-xs font-bold">{slot.price}</div>
              <div className="mt-1 text-[11px] font-semibold">{slot.status}</div>
            </button>
          );
        })}
      </div>

      {!showBookingForm ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-[22px] bg-[#fffaf2] p-4">
            <div className="text-sm font-semibold text-[#8b5e3c]">Phòng bạn chọn:</div>
            <div className="mt-2 grid gap-2 text-sm text-slate-600">
              <div><span className="font-semibold">Phòng:</span> {roomName}</div>
              <div><span className="font-semibold">Khu vực:</span> {areaName}</div>
              <div><span className="font-semibold">Ngày nhận:</span> {formatLocalDateString(bookingStartDate)}</div>
              <div><span className="font-semibold">Ngày trả:</span> {formatLocalDateString(bookingEndDate)}</div>
              <div><span className="font-semibold">Khung giờ:</span> {selectedTimesLabel}</div>
              <div><span className="font-semibold">Số ngày:</span> {selectedDaysCount}</div>
              <div><span className="font-semibold">Tổng tiền:</span> {selectedPrice || "-"}</div>
            </div>
          </div>

          <button
            type="button"
            disabled={selectedSlotItems.length === 0}
            onClick={() => setShowBookingForm(true)}
            className="w-full rounded-2xl bg-[#8b5e3c] px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Đặt phòng ngay
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-[22px] bg-[#f3e2cd] p-4">
            <div className="text-sm font-bold uppercase tracking-wide text-[#7e5331]">Thông tin đặt phòng</div>
            <div className="mt-2 grid gap-2 text-sm text-[#6b4a2d]">
              <div><span className="font-semibold">Phòng bạn chọn:</span> {roomName} - {areaName}</div>
              <div><span className="font-semibold">Ngày nhận:</span> {formatLocalDateString(bookingStartDate)}</div>
              <div><span className="font-semibold">Ngày trả:</span> {formatLocalDateString(bookingEndDate)}</div>
              <div><span className="font-semibold">Khung giờ:</span> {selectedTimesLabel}</div>
              <div><span className="font-semibold">Số ngày:</span> {selectedDaysCount}</div>
              <div><span className="font-semibold">Tổng tiền:</span> {selectedPrice}</div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold text-[#8b5e3c]">Ngày nhận phòng *</label>
              <input
                type="date"
                value={bookingStartDate}
                disabled
                className="w-full rounded-xl border border-[#e2c9ab] bg-slate-100 px-3 py-2 outline-none ring-0"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-[#8b5e3c]">Ngày trả phòng *</label>
              <input
                type="date"
                min={bookingStartDate}
                value={bookingEndDate}
                onChange={(e) => setBookingEndDate(e.target.value)}
                className="w-full rounded-xl border border-[#e2c9ab] bg-white px-3 py-2 outline-none ring-0 focus:border-[#8b5e3c]"
              />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block font-semibold text-[#8b5e3c]">Họ tên: *</label>
              <input
                className="w-full rounded-xl border border-[#e2c9ab] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#8b5e3c]"
                value={bookingForm.guestName}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, guestName: e.target.value }))}
                placeholder="Nhập họ tên"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#8b5e3c]">Số điện thoại / Zalo: *</label>
              <input
                className="w-full rounded-xl border border-[#e2c9ab] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#8b5e3c]"
                value={bookingForm.guestPhone}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, guestPhone: e.target.value }))}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#8b5e3c]">Nhận thông tin đặt phòng qua email: *</label>
              <input
                className="w-full rounded-xl border border-[#e2c9ab] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#8b5e3c]"
                type="email"
                value={bookingForm.guestEmail}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, guestEmail: e.target.value }))}
                placeholder="Nhập email"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={bookingForm.receiveBookingEmail}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, receiveBookingEmail: e.target.checked }))}
              />
              Gửi thông tin booking vào email
            </label>

            <div>
              <label className="mb-1 block font-semibold text-[#8b5e3c]">Số lượng khách:</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBookingForm((prev) => ({ ...prev, guestCount: Math.max(1, prev.guestCount - 1) }))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7efe4] text-lg font-bold text-[#8b5e3c]"
                >
                  -
                </button>
                <input
                  type="number"
                  className="w-20 rounded-xl border border-[#e2c9ab] bg-white px-3 py-2 text-center outline-none ring-0 focus:border-[#8b5e3c]"
                  value={bookingForm.guestCount}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, guestCount: Math.max(1, Number(e.target.value)) }))}
                />
                <button
                  type="button"
                  onClick={() => setBookingForm((prev) => ({ ...prev, guestCount: prev.guestCount + 1 }))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7efe4] text-lg font-bold text-[#8b5e3c]"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#8b5e3c]">Bạn ghé home bằng phương tiện gì?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBookingForm((prev) => ({ ...prev, transportType: "Xe may" }))}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    bookingForm.transportType === "Xe may" ? "bg-[#8b5e3c] text-white" : "bg-[#f7efe4] text-[#8b5e3c]"
                  }`}
                >
                  Xe máy
                </button>
                <button
                  type="button"
                  onClick={() => setBookingForm((prev) => ({ ...prev, transportType: "Xe o to" }))}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    bookingForm.transportType === "Xe o to" ? "bg-[#8b5e3c] text-white" : "bg-[#f7efe4] text-[#8b5e3c]"
                  }`}
                >
                  Xe ô tô
                </button>
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-[#e2c9ab] bg-[#fffaf2] p-4">
              <label className="mb-2 block text-sm font-semibold text-[#8b5e3c]">Chứng minh nhân dân: *</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Mặt trước</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "idCardFrontImage")}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Mặt sau</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "idCardBackImage")}
                    className="w-full text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-[#e2c9ab] bg-[#fffaf2] p-4">
              <label className="mb-2 block text-sm font-semibold text-[#8b5e3c]">Mã giảm giá:</label>
              <input
                className="w-full rounded-xl border border-[#e2c9ab] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#8b5e3c]"
                value={bookingForm.discountCode}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, discountCode: e.target.value }))}
                placeholder="Nhập mã giảm giá (nếu có)"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#8b5e3c]">Ghi chú:</label>
              <textarea
                className="w-full rounded-xl border border-[#e2c9ab] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#8b5e3c]"
                rows={3}
                value={bookingForm.note}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Ghi chú thêm (nếu có)"
              />
            </div>

            <label className="flex items-start gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={bookingForm.acceptedTerms}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, acceptedTerms: e.target.checked }))}
                className="mt-0.5"
              />
              <span>Tôi xác nhận đã đọc và đồng ý với điều khoản và điều kiện của Fiin Home</span>
            </label>
          </div>

          {message ? (
            <p className={`text-sm ${isSuccessFeedback(message) ? "text-emerald-700" : "text-[#cb2f2f]"}`}>
              {message}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowBookingForm(false);
                setMessage(null);
              }}
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-transform active:scale-95"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={submitting || !isBookingFormComplete}
              onClick={() => void handleBook()}
                className="flex-1 rounded-2xl bg-[#8b5e3c] px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang gửi..." : "Đặt"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
