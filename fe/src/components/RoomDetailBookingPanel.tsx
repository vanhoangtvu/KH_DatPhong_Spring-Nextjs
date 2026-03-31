"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const getTodayDate = () => new Date().toISOString().slice(0, 10);

export default function RoomDetailBookingPanel({ roomId, roomName, areaName, slots }: Props) {
  const router = useRouter();
  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.status !== "Đã Đặt" && slot.status !== "Hết chỗ"),
    [slots],
  );
  const [selectedTime, setSelectedTime] = useState(availableSlots[0]?.time ?? "");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedSlot = slots.find((slot) => slot.time === selectedTime);
  const selectedPrice = selectedSlot?.price ?? "";
  const canSubmit = !!selectedSlot && selectedSlot.status !== "Đã Đặt" && guestName.trim() && guestPhone.trim() && guestEmail.trim() && acceptedTerms;

  const handleBook = async () => {
    if (!selectedSlot) {
      setMessage("Vui lòng chọn khung giờ.");
      return;
    }
    if (selectedSlot.status === "Đã Đặt" || selectedSlot.status === "Hết chỗ") {
      setMessage("Khung giờ này đã được đặt.");
      return;
    }
    if (!guestName.trim() || !guestPhone.trim() || !guestEmail.trim()) {
      setMessage("Vui lòng nhập đầy đủ họ tên, số điện thoại và email.");
      return;
    }
    if (!acceptedTerms) {
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
          guestName,
          guestEmail,
          guestPhone,
          receiveBookingEmail: true,
          numOfAdults: 1,
          numOfChildren: 0,
          transportType: "Xe may",
          idCardFrontImage: "",
          idCardBackImage: "",
          discountCode: "",
          note: "",
          acceptedTerms: true,
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
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Đặt phòng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(70,98,172,0.06)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-bold text-[#4f67b0] sm:text-lg">Đặt khung giờ</div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Bấm vào một khung giờ bên dưới để chọn và đặt ngay.</p>
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

      <div className="mt-4 rounded-[22px] bg-[#f8faff] p-4">
        <div className="text-sm font-semibold text-[#4f67b0]">Khung giờ đã chọn</div>
        <div className="mt-2 grid gap-2 text-sm text-slate-600">
          <div><span className="font-semibold">Phòng:</span> {roomName}</div>
          <div><span className="font-semibold">Khu vực:</span> {areaName}</div>
          <div><span className="font-semibold">Giờ:</span> {selectedSlot?.time || "Chưa chọn"}</div>
          <div><span className="font-semibold">Giá:</span> {selectedPrice || "-"}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <label className="mb-1 block font-semibold text-[#4f67b0]">Họ tên *</label>
          <input
            className="w-full rounded-xl border border-[#d7e3ff] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#4361af]"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="Nhập họ tên"
          />
        </div>
        <div>
          <label className="mb-1 block font-semibold text-[#4f67b0]">Số điện thoại *</label>
          <input
            className="w-full rounded-xl border border-[#d7e3ff] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#4361af]"
            value={guestPhone}
            onChange={(event) => setGuestPhone(event.target.value)}
            placeholder="Nhập số điện thoại"
          />
        </div>
        <div>
          <label className="mb-1 block font-semibold text-[#4f67b0]">Email *</label>
          <input
            className="w-full rounded-xl border border-[#d7e3ff] bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-[#4361af]"
            type="email"
            value={guestEmail}
            onChange={(event) => setGuestEmail(event.target.value)}
            placeholder="Nhập email"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
          Xác nhận điều khoản và điều kiện
        </label>
      </div>

      {message ? <p className="mt-3 text-sm text-[#cb2f2f]">{message}</p> : null}

      <button
        type="button"
        disabled={!canSubmit || submitting}
        onClick={() => void handleBook()}
        className="mt-4 w-full rounded-2xl bg-[#425ca7] px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Đang gửi đặt phòng..." : "Đặt ngay khung giờ này"}
      </button>
    </div>
  );
}
