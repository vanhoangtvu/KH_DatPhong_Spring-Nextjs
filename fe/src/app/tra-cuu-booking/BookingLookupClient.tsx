"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Phone, Search, User, Ticket } from "lucide-react";

type RoomSummary = {
  id: number;
  roomType: string;
  roomPrice: number;
  isBooked?: boolean;
  photo?: string | null;
};

type BookingLookupItem = {
  bookingId: number;
  bookingConfirmationCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  branchName: string;
  selectedRoomName: string;
  selectedDayLabel: string;
  selectedSlotTime: string;
  selectedSlotPrice: string;
  bookingStatus?: string;
  transportType?: string;
  note?: string | null;
  discountCode?: string | null;
  room?: RoomSummary | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const normalizePhone = (value: string) => value.replace(/\D/g, "").trim();

const normalizeBookingStatus = (value?: string) => value?.trim() || "Đã đặt";

const getBookingStatusBadgeClass = (value?: string) => {
  const status = normalizeBookingStatus(value);
  if (status === "Đã hoàn thành") return "bg-emerald-100 text-emerald-700";
  if (status === "Đã hủy") return "bg-rose-100 text-rose-700";
  if (status === "Đã check-in") return "bg-sky-100 text-sky-700";
  if (status === "Đã check-out") return "bg-indigo-100 text-indigo-700";
  if (status === "Đã xác nhận") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
};

export default function BookingLookupClient() {
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BookingLookupItem[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = guestName.trim();
    const trimmedPhone = guestPhone.trim();

    if (!trimmedName || !trimmedPhone) {
      setError("Vui lòng nhập đầy đủ họ tên và số điện thoại.");
      setResults([]);
      setSearched(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);

      const params = new URLSearchParams({
        guestName: trimmedName,
        guestPhone: normalizePhone(trimmedPhone) || trimmedPhone,
      });

      const response = await fetch(`${API_BASE}/bookings/lookup?${params.toString()}`, {
        cache: "no-store",
      });

      const payload = await response.text();
      if (!response.ok) {
        throw new Error(payload || "Không thể tra cứu booking.");
      }

      const data = payload ? (JSON.parse(payload) as BookingLookupItem[]) : [];
      setResults(data);
      if (data.length === 0) {
        setError("Không tìm thấy booking phù hợp với thông tin đã nhập.");
      }
    } catch (searchError) {
      setResults([]);
      setError(searchError instanceof Error ? searchError.message : "Không thể tra cứu booking.");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setGuestName("");
    setGuestPhone("");
    setError(null);
    setResults([]);
    setSearched(false);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f0e2_0%,#f1e2c8_52%,#ead5b5_100%)] px-4 py-6 text-[#6a4a2d] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[28px] border border-[#e2c9ab] bg-[#fffaf2]/95 px-4 py-3 shadow-[0_12px_40px_rgba(122,84,47,0.10)] backdrop-blur sm:px-5">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[#e2c9ab] bg-white px-3 py-2 text-sm font-semibold text-[#8b5e3c] transition hover:bg-[#f0dfc9]">
            <ArrowLeft className="h-4 w-4" />
            Trang chủ
          </Link>
          <div className="text-right">
            <div className="text-sm font-bold tracking-[0.08em] uppercase text-[#7e5331] sm:text-base">Fiin Home</div>
            <div className="text-xs text-[#9c7450] sm:text-sm">Tra cứu lịch đặt phòng theo tên và số điện thoại</div>
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
          <div className="rounded-[30px] border border-[#e2c9ab] bg-[#fff8ef]/95 p-6 shadow-[0_16px_50px_rgba(122,84,47,0.12)]">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f0dfc9] px-4 py-2 text-sm font-semibold text-[#7e5331]">
              <Search className="h-4 w-4" />
              Tra cứu booking
            </div>
            <h1 className="mt-4 text-3xl font-black leading-[1.08] tracking-[-0.03em] text-[#6b4a2d] sm:text-4xl">
              Xem lại lịch đặt phòng của khách hàng
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#9c7450] sm:text-base">
              Nhập đúng họ tên và số điện thoại đã dùng khi đặt phòng để hệ thống trả về các booking tương ứng.
            </p>

            <form onSubmit={handleSearch} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#8b5e3c]">Họ tên</label>
                <div className="flex items-center gap-3 rounded-2xl border border-[#e2c9ab] bg-[#fffaf2] px-4 py-3">
                  <User className="h-5 w-5 shrink-0 text-[#8b5e3c]" />
                  <input
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#c39a73]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#8b5e3c]">Số điện thoại</label>
                <div className="flex items-center gap-3 rounded-2xl border border-[#e2c9ab] bg-[#fffaf2] px-4 py-3">
                  <Phone className="h-5 w-5 shrink-0 text-[#8b5e3c]" />
                  <input
                    value={guestPhone}
                    onChange={(event) => setGuestPhone(event.target.value)}
                    placeholder="0912 345 678"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#c39a73]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#8b5e3c] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#734a2d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Search className="h-4 w-4" />
                  {loading ? "Đang tra cứu..." : "Tra cứu lịch đặt phòng"}
                </button>
                <button
                  type="button"
                  onClick={clearForm}
                  className="rounded-2xl border border-[#e2c9ab] bg-[#fffaf2] px-4 py-3 text-sm font-semibold text-[#8b5e3c] transition hover:bg-[#f0dfc9]"
                >
                  Làm mới
                </button>
              </div>
            </form>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#fffaf2] p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#8b5e3c]">
                  <CheckCircle2 className="h-4 w-4" />
                  Cách dùng
                </div>
                <p className="mt-2 text-sm leading-6 text-[#9c7450]">Họ tên và số điện thoại nên khớp với thông tin đã nhập khi đặt phòng.</p>
              </div>
              <div className="rounded-2xl bg-[#fffaf2] p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#8b5e3c]">
                  <Ticket className="h-4 w-4" />
                  Dữ liệu trả về
                </div>
                <p className="mt-2 text-sm leading-6 text-[#9c7450]">Hiển thị mã booking, chi nhánh, phòng, ngày, khung giờ và giá.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-[#e2c9ab] bg-white/80 p-5 shadow-[0_16px_50px_rgba(122,84,47,0.10)] backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-[#6b4a2d]">Kết quả tra cứu</h2>
              {searched ? <span className="rounded-full bg-[#f0dfc9] px-3 py-1 text-xs font-semibold text-[#7e5331]">{results.length} booking</span> : null}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-[#f0c7bc] bg-[#fff5f2] p-4 text-sm text-[#9c5c44]">
                {error}
              </div>
            ) : null}

            {!searched ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-[#e2c9ab] bg-[#fffaf2] p-6 text-center">
                <MapPin className="mx-auto h-10 w-10 text-[#8b5e3c]" />
                <p className="mt-3 text-sm leading-6 text-[#9c7450]">
                  Sau khi tra cứu, các booking phù hợp sẽ hiển thị ở đây để khách xem lại lịch đặt phòng của mình.
                </p>
              </div>
            ) : null}

            {results.length > 0 ? (
              <div className="mt-5 space-y-4">
                {results.map((booking) => (
                  <article key={booking.bookingId} className="rounded-[26px] border border-[#eadcc9] bg-[#fffaf2] p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-bold text-[#6b4a2d]">{booking.selectedRoomName}</div>
                        <div className="mt-1 text-sm text-[#9c7450]">{booking.branchName}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBookingStatusBadgeClass(booking.bookingStatus)}`}>
                          {normalizeBookingStatus(booking.bookingStatus)}
                        </span>
                        <span className="rounded-full bg-[#f0dfc9] px-3 py-1 text-xs font-semibold text-[#7e5331]">
                          {booking.bookingConfirmationCode}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white p-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#8b5e3c]">
                          <CalendarDays className="h-4 w-4" />
                          Lịch đặt
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-[#7e5331]">
                          <p><span className="font-semibold">Ngày:</span> {booking.selectedDayLabel}</p>
                          <p><span className="font-semibold">Khung giờ:</span> {booking.selectedSlotTime}</p>
                          <p><span className="font-semibold">Giá:</span> {booking.selectedSlotPrice}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#8b5e3c]">
                          <User className="h-4 w-4" />
                          Thông tin khách
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-[#7e5331]">
                          <p><span className="font-semibold">Họ tên:</span> {booking.guestName}</p>
                          <p><span className="font-semibold">SĐT:</span> {booking.guestPhone}</p>
                          <p><span className="font-semibold">Email:</span> {booking.guestEmail}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      {booking.transportType ? <span className="rounded-full bg-[#f0dfc9] px-3 py-1 text-[#7e5331]">{booking.transportType}</span> : null}
                      {booking.discountCode ? <span className="rounded-full bg-[#fff1df] px-3 py-1 text-[#8b5e3c]">Mã giảm giá: {booking.discountCode}</span> : null}
                    </div>

                    {booking.note ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-[#e2c9ab] bg-[#fffaf2] p-3 text-sm text-[#7e5331]">
                        <div className="font-semibold text-[#8b5e3c]">Ghi chú</div>
                        <p className="mt-1 leading-6">{booking.note}</p>
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-sm text-[#9c7450]">Check-in: {booking.checkInDate} • Check-out: {booking.checkOutDate}</p>
                      {booking.room?.id ? (
                        <Link
                          href={`/room/${booking.room.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[#e2c9ab] bg-white px-3 py-2 text-sm font-semibold text-[#8b5e3c] transition hover:bg-[#f0dfc9]"
                        >
                          Xem phòng
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : searched && !loading && !error ? (
              <div className="mt-6 rounded-[24px] border border-[#e2c9ab] bg-[#fffaf2] p-6 text-center text-sm text-[#9c7450]">
                Không có booking nào phù hợp với thông tin đã nhập.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}