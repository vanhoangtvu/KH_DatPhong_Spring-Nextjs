"use client";

import { useMemo, useState } from "react";
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

const getTodayDate = () => new Date().toISOString().slice(0, 10);

export default function RoomDetailBookingPanel({ roomId, roomName, areaName, slots }: Props) {
  const router = useRouter();
  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.status !== "Đã Đặt" && slot.status !== "Hết chỗ"),
    [slots],
  );
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTime, setSelectedTime] = useState(availableSlots[0]?.time ?? "");
  const [bookingForm, setBookingForm] = useState<BookingFormState>(EMPTY_BOOKING_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedSlot = slots.find((slot) => slot.time === selectedTime);
  const selectedPrice = selectedSlot?.price ?? "";
  const isBookingFormComplete = Boolean(
    selectedSlot &&
      bookingForm.guestName.trim() &&
      bookingForm.guestPhone.trim() &&
      bookingForm.guestEmail.trim() &&
      bookingForm.idCardFrontImage &&
      bookingForm.idCardBackImage &&
      bookingForm.acceptedTerms
  );

  const handleBook = async () => {
    if (!selectedSlot) {
      setMessage("Vui lòng chọn khung giờ.");
      return;
    }
    if (selectedSlot.status === "Đã Đặt" || selectedSlot.status === "Hết chỗ") {
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
      const bookingDate = getTodayDate();
      const response = await fetch(`${API_BASE}/bookings/room/${roomId}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          branchName: areaName,
          selectedRoomName: roomName,
          selectedDayLabel: "Hôm nay",
          selectedSlotTime: selectedSlot.time,
          selectedSlotPrice: selectedPrice,
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || "Đặt phòng thất bại");
      }

      setMessage(text || "Đặt phòng thành công");
      setBookingForm(EMPTY_BOOKING_FORM);
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
    <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(70,98,172,0.06)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-bold text-[#4f67b0] sm:text-lg">Khung giờ có sẵn</div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Xem các khung giờ còn trống và đặt ngay.</p>
        </div>
        <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-[11px] font-semibold text-[#4361af]">{availableSlots.length} giờ</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        {slots.map((slot) => {
          const isDisabled = slot.status === "Đã Đặt" || slot.status === "Hết chỗ";
          const isSelected = selectedTime === slot.time;
          return (
            <button
              key={slot.time}
              type="button"
              disabled={isDisabled}
              onClick={() => setSelectedTime(slot.time)}
              className={`rounded-[18px] px-3 py-3 text-center shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                isDisabled ? "bg-slate-200 text-slate-500" : isSelected ? "bg-[#4c67b2] text-white" : "bg-[#eef3ff] text-[#4361af]"
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
          <div className="rounded-[22px] bg-[#f8faff] p-4">
            <div className="text-sm font-semibold text-[#4f67b0]">Phòng bạn chọn:</div>
            <div className="mt-2 grid gap-2 text-sm text-slate-600">
              <div><span className="font-semibold">Phòng:</span> {roomName}</div>
              <div><span className="font-semibold">Khu vực:</span> {areaName}</div>
              <div><span className="font-semibold">Giờ nhận phòng:</span> {selectedSlot?.time || "Chưa chọn"}</div>
              <div><span className="font-semibold">Tổng tiền:</span> {selectedPrice || "-"}</div>
            </div>
          </div>

          <button
            type="button"
            disabled={!selectedSlot || selectedSlot.status === "Đã Đặt" || selectedSlot.status === "Hết chỗ"}
            onClick={() => setShowBookingForm(true)}
            className="w-full rounded-2xl bg-[#425ca7] px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Đặt phòng ngay
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-[22px] bg-[#dfe9ff] p-4">
            <div className="text-sm font-bold uppercase tracking-wide text-[#324a91]">Thông tin đặt phòng</div>
            <div className="mt-2 grid gap-2 text-sm text-[#4f67b0]">
              <div><span className="font-semibold">Phòng bạn chọn:</span> {roomName} - {areaName}</div>
              <div><span className="font-semibold">Giờ nhận phòng:</span> {selectedSlot?.time} ngày {new Date().toLocaleDateString("vi-VN")}</div>
              <div><span className="font-semibold">Tổng tiền:</span> {selectedPrice}</div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block font-semibold text-[#4f67b0]">Họ tên: *</label>
              <input
                className="w-full rounded-xl border border-[#d7e3ff] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#4361af]"
                value={bookingForm.guestName}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, guestName: e.target.value }))}
                placeholder="Nhập họ tên"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#4f67b0]">Số điện thoại / Zalo: *</label>
              <input
                className="w-full rounded-xl border border-[#d7e3ff] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#4361af]"
                value={bookingForm.guestPhone}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, guestPhone: e.target.value }))}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#4f67b0]">Nhận thông tin đặt phòng qua email: *</label>
              <input
                className="w-full rounded-xl border border-[#d7e3ff] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#4361af]"
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
              <label className="mb-1 block font-semibold text-[#4f67b0]">Số lượng khách:</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBookingForm((prev) => ({ ...prev, guestCount: Math.max(1, prev.guestCount - 1) }))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3ff] text-lg font-bold text-[#4361af]"
                >
                  -
                </button>
                <input
                  type="number"
                  className="w-20 rounded-xl border border-[#d7e3ff] bg-white px-3 py-2 text-center outline-none ring-0 focus:border-[#4361af]"
                  value={bookingForm.guestCount}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, guestCount: Math.max(1, Number(e.target.value)) }))}
                />
                <button
                  type="button"
                  onClick={() => setBookingForm((prev) => ({ ...prev, guestCount: prev.guestCount + 1 }))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3ff] text-lg font-bold text-[#4361af]"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#4f67b0]">Bạn ghé home bằng phương tiện gì?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBookingForm((prev) => ({ ...prev, transportType: "Xe may" }))}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    bookingForm.transportType === "Xe may" ? "bg-[#4c67b2] text-white" : "bg-[#eef3ff] text-[#4361af]"
                  }`}
                >
                  Xe máy
                </button>
                <button
                  type="button"
                  onClick={() => setBookingForm((prev) => ({ ...prev, transportType: "Xe o to" }))}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    bookingForm.transportType === "Xe o to" ? "bg-[#4c67b2] text-white" : "bg-[#eef3ff] text-[#4361af]"
                  }`}
                >
                  Xe ô tô
                </button>
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-[#d7e3ff] bg-[#f8faff] p-4">
              <label className="mb-2 block text-sm font-semibold text-[#4f67b0]">Chứng minh nhân dân: *</label>
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

            <div className="rounded-xl border-2 border-dashed border-[#d7e3ff] bg-[#f8faff] p-4">
              <label className="mb-2 block text-sm font-semibold text-[#4f67b0]">Mã giảm giá:</label>
              <input
                className="w-full rounded-xl border border-[#d7e3ff] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#4361af]"
                value={bookingForm.discountCode}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, discountCode: e.target.value }))}
                placeholder="Nhập mã giảm giá (nếu có)"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#4f67b0]">Ghi chú:</label>
              <textarea
                className="w-full rounded-xl border border-[#d7e3ff] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#4361af]"
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

          {message ? <p className="text-sm text-[#cb2f2f]">{message}</p> : null}

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
              className="flex-1 rounded-2xl bg-[#425ca7] px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang gửi..." : "Đặt"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
