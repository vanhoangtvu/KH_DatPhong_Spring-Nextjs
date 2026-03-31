"use client";

import { FormEvent, useEffect, useState } from "react";

type AdminRoom = {
  id: number;
  roomType: string;
  roomPrice: number;
  areaName: string;
  displayName: string;
  description: string;
  imageUrl: string;
  galleryCsv: string;
  videoUrl: string;
  showOnHome: boolean;
  homeOrder: number | null;
  featuresCsv: string;
  slotTimesCsv: string;
  slotPricesCsv: string;
  slotStatusesCsv: string;
  booked: boolean;
};

type BookingItem = {
  bookingId: number;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  receiveBookingEmail: boolean;
  numOfAdults: number;
  numOfChildren: number;
  totalNumOfGuests: number;
  bookingConfirmationCode: string;
  transportType: string;
  idCardFrontImage: string;
  idCardBackImage: string;
  discountCode: string;
  note: string;
  acceptedTerms: boolean;
  branchName: string;
  selectedRoomName: string;
  selectedDayLabel: string;
  selectedSlotTime: string;
  selectedSlotPrice: string;
  room: {
    id: number;
    roomType: string;
    roomPrice: number;
  };
};

type BookingSettings = {
  acceptingBookings: boolean;
  bookingNotice: string;
};

type FooterLinkRow = {
  label: string;
  url: string;
};

type HomePageConfigData = {
  brandName: string;
  brandSubtitle: string;
  hotline: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  introSectionTitle: string;
  introSectionDescription: string;
  areas: Array<{ name: string; subtitle: string }>;
  introCards: Array<{ title: string; subtitle: string; image: string }>;
  showcaseRooms: Array<{ title: string; cover: string; grid: string[]; times: string[] }>;
  days: string[];
  bookingSectionTitle: string;
  bookingSectionSubtitle: string;
  roomLists: Record<string, Array<{ roomId: number; name: string; image: string; gallery: string[]; videoUrl: string; features: string[]; slots: Array<{ time: string; price: string; status: string }> }>>;
  legend: Array<{ label: string; color: string }>;
  acceptingBookings: boolean;
  bookingNotice: string;
  footerDescription: string;
  footerTags: string[];
  footerLinks: string[];
  footerLinkUrls: string[];
};

type FooterForm = {
  hotline: string;
  footerDescription: string;
  footerTagsText: string;
  footerLinks: FooterLinkRow[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Không đọc được file ảnh"));
    reader.readAsDataURL(file);
  });

const splitImages = (value: string) =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

const EMPTY_ROOM = {
  roomType: "",
  roomPrice: 0,
  areaName: "",
  displayName: "",
  description: "",
  imageUrl: "",
  galleryCsv: "",
  videoUrl: "",
  showOnHome: false,
  homeOrder: 0,
  featuresCsv: "",
  slotTimesCsv: "",
  slotPricesCsv: "",
  slotStatusesCsv: "",
};

const splitTextToList = (value: string) =>
  value
    .split(/\||\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const buildFooterLinkRows = (labels: string[], urls: string[]) => {
  const rowCount = Math.max(labels.length, urls.length, 1);
  return Array.from({ length: rowCount }, (_, index) => ({
    label: labels[index] ?? "",
    url: urls[index] ?? "",
  }));
};

const formatBookingDate = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("vi-VN");
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [settings, setSettings] = useState<BookingSettings>({
    acceptingBookings: true,
    bookingNotice: "",
  });
  const [homePageConfig, setHomePageConfig] = useState<HomePageConfigData | null>(null);
  const [footerForm, setFooterForm] = useState<FooterForm>({
    hotline: "",
    footerDescription: "",
    footerTagsText: "",
    footerLinks: [{ label: "", url: "" }],
  });

  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [galleryItems, setGalleryItems] = useState<string[]>([""]);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const branchOptions = Array.from(new Set(rooms.map((room) => room.areaName).filter(Boolean))).sort();
  const branchGroups = branchOptions.map((branch) => {
    const branchRooms = rooms.filter((room) => room.areaName === branch);
    return {
      branch,
      count: branchRooms.length,
      roomNames: branchRooms.map((room) => room.displayName || room.roomType),
    };
  });
  const visibleRooms = selectedBranch ? rooms.filter((room) => room.areaName === selectedBranch) : rooms;
  const totalRooms = rooms.length;
  const featuredRooms = rooms.filter((room) => room.showOnHome).length;
  const bookedRooms = rooms.filter((room) => room.booked).length;
  const totalBookings = bookings.length;

  useEffect(() => {
    const localToken = window.localStorage.getItem("adminToken") ?? "";
    setToken(localToken);
  }, []);

  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const loadAdminData = async () => {
    if (!token) return;
    try {
      setMessage("Đang tải dữ liệu admin...");
      const [roomRes, bookingRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/rooms`, { headers: authHeaders }),
        fetch(`${API_BASE}/bookings/all-bookings`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/admin/home-page/booking-settings`, { headers: authHeaders }),
      ]);

      if (!roomRes.ok || !bookingRes.ok || !settingsRes.ok) {
        throw new Error("Token không hợp lệ hoặc không có quyền admin");
      }

      const [roomsData, bookingsData, settingsData] = await Promise.all([
        roomRes.json(),
        bookingRes.json(),
        settingsRes.json(),
      ]);

      const homePageRes = await fetch(`${API_BASE}/api/public/home-page`);
      const homePageData = homePageRes.ok ? ((await homePageRes.json()) as HomePageConfigData) : null;

      setRooms(roomsData as AdminRoom[]);
      setBookings(bookingsData as BookingItem[]);
      setSettings(settingsData as BookingSettings);
      setHomePageConfig(homePageData);
      if (homePageData) {
        setFooterForm({
          hotline: homePageData.hotline ?? "",
          footerDescription: homePageData.footerDescription ?? "",
          footerTagsText: (homePageData.footerTags ?? []).join(" | "),
          footerLinks: buildFooterLinkRows(homePageData.footerLinks ?? [], homePageData.footerLinkUrls ?? []),
        });
      }
      setMessage("Tải dữ liệu admin thành công");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu admin");
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, [token]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error("Đăng nhập thất bại");
      }
      const data = (await response.json()) as { token: string };
      setToken(data.token);
      window.localStorage.setItem("adminToken", data.token);
      setMessage("Đăng nhập admin thành công");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không đăng nhập được");
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/home-page/booking-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error("Không lưu được cấu hình nhận booking");
      }
      setMessage("Đã cập nhật cấu hình nhận booking");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu cấu hình thất bại");
    }
  };

  const handleSaveFooter = async () => {
    if (!homePageConfig) {
      setMessage("Không có dữ liệu trang chủ để cập nhật footer");
      return;
    }
    try {
      const payload: HomePageConfigData = {
        ...homePageConfig,
        hotline: footerForm.hotline,
        footerDescription: footerForm.footerDescription,
        footerTags: splitTextToList(footerForm.footerTagsText),
        footerLinks: footerForm.footerLinks.map((row) => row.label.trim()),
        footerLinkUrls: footerForm.footerLinks.map((row) => row.url.trim()),
      };

      const response = await fetch(`${API_BASE}/api/admin/home-page/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Không lưu được footer");
      }

      const updated = (await response.json()) as HomePageConfigData;
      setHomePageConfig(updated);
      setFooterForm({
        hotline: updated.hotline ?? "",
        footerDescription: updated.footerDescription ?? "",
        footerTagsText: (updated.footerTags ?? []).join(" | "),
        footerLinks: buildFooterLinkRows(updated.footerLinks ?? [], updated.footerLinkUrls ?? []),
      });
      setMessage("Đã cập nhật footer thành công");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu footer thất bại");
    }
  };

  const handleSubmitRoom = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const galleryCsv = galleryItems
        .map((item) => item.trim())
        .filter(Boolean)
        .join("|");
      const endpoint =
        editingRoomId == null
          ? `${API_BASE}/api/admin/rooms`
          : `${API_BASE}/api/admin/rooms/${editingRoomId}`;
      const method = editingRoomId == null ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ ...roomForm, galleryCsv }),
      });

      if (!response.ok) {
        throw new Error("Không lưu được phòng");
      }

        setRoomForm(EMPTY_ROOM);
        setGalleryItems([""]);
      setEditingRoomId(null);
      setShowRoomForm(false);
      setMessage("Lưu phòng thành công");
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu phòng thất bại");
    }
  };

  const handleEditRoom = (room: AdminRoom) => {
    setSelectedBranch(room.areaName || null);
    setEditingRoomId(room.id);
    setShowRoomForm(true);
    setGalleryItems(splitImages(room.galleryCsv).length > 0 ? splitImages(room.galleryCsv) : [""]);
    setRoomForm({
      roomType: room.roomType,
      roomPrice: room.roomPrice,
      areaName: room.areaName,
      displayName: room.displayName,
      description: room.description,
      imageUrl: room.imageUrl,
      galleryCsv: room.galleryCsv,
      videoUrl: room.videoUrl,
      showOnHome: room.showOnHome,
      homeOrder: room.homeOrder ?? 0,
      featuresCsv: room.featuresCsv,
      slotTimesCsv: room.slotTimesCsv,
      slotPricesCsv: room.slotPricesCsv,
      slotStatusesCsv: room.slotStatusesCsv,
    });
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/rooms/${roomId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error("Không xóa được phòng");
      }
      setMessage("Đã xóa phòng");
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Xóa phòng thất bại");
    }
  };

  const handleDeleteBooking = async (bookingId: number) => {
    try {
      const response = await fetch(`${API_BASE}/bookings/booking/${bookingId}/delete`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error("Không xóa được booking");
      }
      setMessage("Đã xóa booking");
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Xóa booking thất bại");
    }
  };

  const openBookingDetail = (booking: BookingItem) => {
    setSelectedBooking(booking);
  };

  const handleMainImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setRoomForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setIsUploadingMedia(true);
    try {
      const uploaded = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setGalleryItems((prev) => [...prev, ...uploaded]);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const addGalleryField = () => {
    setGalleryItems((prev) => [...prev, ""]);
  };

  const updateGalleryField = (index: number, value: string) => {
    setGalleryItems((prev) => prev.map((item, currentIndex) => (currentIndex === index ? value : item)));
  };

  const removeGalleryField = (index: number) => {
    setGalleryItems((prev) => {
      const next = prev.filter((_, currentIndex) => currentIndex !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const addFooterLinkRow = () => {
    setFooterForm((prev) => ({
      ...prev,
      footerLinks: [...prev.footerLinks, { label: "", url: "" }],
    }));
  };

  const updateFooterLinkRow = (index: number, field: keyof FooterLinkRow, value: string) => {
    setFooterForm((prev) => ({
      ...prev,
      footerLinks: prev.footerLinks.map((row, currentIndex) =>
        currentIndex === index ? { ...row, [field]: value } : row,
      ),
    }));
  };

  const removeFooterLinkRow = (index: number) => {
    setFooterForm((prev) => ({
      ...prev,
      footerLinks: prev.footerLinks.length > 1
        ? prev.footerLinks.filter((_, currentIndex) => currentIndex !== index)
        : [{ label: "", url: "" }],
    }));
  };

  return (
    <main className="min-h-screen bg-[#f4f5f7] p-4 text-[#25335a] sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-black">Admin Hotel</h1>
              <p className="mt-1 text-sm text-slate-500">Thiết lập nhận booking, quản lý phòng, xem và xóa booking.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">{totalRooms} phòng</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{branchOptions.length} chi nhánh</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{featuredRooms} nổi bật</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{totalBookings} booking</span>
            </div>
          </div>
          {message ? <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-[#1f4ca2]">{message}</p> : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Tổng phòng</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{totalRooms}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Phòng nổi bật</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{featuredRooms}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Phòng đã đặt</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{bookedRooms}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Booking</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{totalBookings}</p>
          </div>
        </section>

        {!token ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Đăng nhập Admin</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={handleLogin}>
              <input
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <input
                type="password"
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Mật khẩu"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button className="rounded-xl bg-[#355eb7] px-4 py-2 font-semibold text-white" type="submit">
                Đăng nhập
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Thiết lập tiếp nhận đặt phòng</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.acceptingBookings}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, acceptingBookings: event.target.checked }))
                    }
                  />
                  Đang nhận booking
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Thông báo khi tắt nhận booking"
                  value={settings.bookingNotice ?? ""}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, bookingNotice: event.target.value }))
                  }
                />
                <button className="rounded-xl bg-[#355eb7] px-4 py-2 text-sm font-semibold text-white" onClick={handleSaveSettings}>
                  Lưu cấu hình
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Cấu hình Footer trang chủ</h2>
              <p className="mt-1 text-sm text-slate-500">Các trường này sẽ hiển thị trực tiếp ở phần footer ngoài trang khách hàng.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">Hotline</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={footerForm.hotline}
                    onChange={(event) => setFooterForm((prev) => ({ ...prev, hotline: event.target.value }))}
                    placeholder="Ví dụ: 1900 2026"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">Mô tả footer</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={footerForm.footerDescription}
                    onChange={(event) => setFooterForm((prev) => ({ ...prev, footerDescription: event.target.value }))}
                    placeholder="Mô tả ngắn ở footer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Footer tags</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={footerForm.footerTagsText}
                    onChange={(event) => setFooterForm((prev) => ({ ...prev, footerTagsText: event.target.value }))}
                    placeholder="Phân tách bằng | hoặc dấu phẩy"
                  />
                </div>
                <div className="sm:col-span-2 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-semibold text-slate-700">Footer buttons</label>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={addFooterLinkRow}
                    >
                      Thêm nút
                    </button>
                  </div>
                  <div className="space-y-3">
                    {footerForm.footerLinks.map((row, index) => (
                      <div key={`${index}-${row.label}`} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1.2fr_auto] sm:items-center">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Nhãn nút</label>
                          <input
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                            value={row.label}
                            onChange={(event) => updateFooterLinkRow(index, "label", event.target.value)}
                            placeholder="Ví dụ: Facebook"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">URL</label>
                          <input
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                            value={row.url}
                            onChange={(event) => updateFooterLinkRow(index, "url", event.target.value)}
                            placeholder="Ví dụ: https://facebook.com hoặc /bang-gia"
                          />
                        </div>
                        <button
                          type="button"
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white sm:mt-6"
                          onClick={() => removeFooterLinkRow(index)}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Mỗi dòng là một nút riêng. Nếu để trống URL, nút vẫn hiển thị nhưng không dẫn link.</p>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    className="rounded-xl bg-[#355eb7] px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => void handleSaveFooter()}
                  >
                    Lưu footer
                  </button>
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold">Chi nhánh</h2>
                    <p className="mt-1 text-sm text-slate-500">Chọn chi nhánh để xem danh sách phòng thuộc nhóm đó.</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1 font-semibold transition ${selectedBranch === null ? "bg-[#355eb7] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                      onClick={() => setSelectedBranch(null)}
                    >
                      Tất cả chi nhánh
                    </button>
                    {branchOptions.map((branch) => (
                      <button
                        key={branch}
                        type="button"
                        className={`rounded-full px-3 py-1 font-semibold transition ${selectedBranch === branch ? "bg-[#355eb7] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                        onClick={() => setSelectedBranch(branch)}
                      >
                        {branch}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3">
                    {branchGroups.map((group) => (
                      <button
                        key={group.branch}
                        type="button"
                        className={`w-full rounded-2xl border p-4 text-left transition ${selectedBranch === group.branch ? "border-[#355eb7] bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"}`}
                        onClick={() => setSelectedBranch(group.branch)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">{group.branch}</h3>
                            <p className="text-sm text-slate-500">{group.count} phòng</p>
                          </div>
                          <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm">Nhóm chi nhánh</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {group.roomNames.map((name) => (
                            <span key={`${group.branch}-${name}`} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 shadow-sm">
                              {name}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">Quản lý phòng</h2>
                      <p className="text-sm text-slate-500">
                        {selectedBranch ? `Đang xem: ${selectedBranch} • ${visibleRooms.length} phòng` : `Đang xem tất cả • ${totalRooms} phòng`}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl bg-[#355eb7] px-4 py-2 text-sm font-semibold text-white"
                      onClick={() => {
                        setEditingRoomId(null);
                        setRoomForm(selectedBranch ? { ...EMPTY_ROOM, areaName: selectedBranch } : EMPTY_ROOM);
                        setGalleryItems([""]);
                        setShowRoomForm((prev) => !prev);
                      }}
                    >
                      {showRoomForm ? "Đóng form" : "Thêm phòng mới"}
                    </button>
                  </div>

                  {selectedBranch ? (
                    <>
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        Mọi thao tác thêm hoặc sửa phòng sẽ gắn với chi nhánh <span className="font-semibold text-slate-900">{selectedBranch}</span>.
                      </div>

                      {showRoomForm ? (
                        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmitRoom}>
                          <div className="space-y-1">
                            <label className="block text-sm font-semibold text-slate-700">Loại phòng</label>
                            <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Ví dụ: Luxury, Deluxe..." value={roomForm.roomType} onChange={(e) => setRoomForm((p) => ({ ...p, roomType: e.target.value }))} />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-semibold text-slate-700">Giá phòng</label>
                            <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Nhập giá" type="number" value={roomForm.roomPrice} onChange={(e) => setRoomForm((p) => ({ ...p, roomPrice: Number(e.target.value) }))} />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700">Chi nhánh đang áp dụng</label>
                            <input className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600" value={selectedBranch ?? ""} disabled />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-semibold text-slate-700">Tên hiển thị</label>
                            <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Tên hiển thị trên website" value={roomForm.displayName} onChange={(e) => setRoomForm((p) => ({ ...p, displayName: e.target.value }))} />
                          </div>

                          <div className="rounded-xl border border-slate-300 p-3 sm:col-span-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-700">Ảnh chính của phòng</p>
                              <span className="text-xs text-slate-500">Ảnh sẽ hiện ở vị trí đầu tiên</span>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
                              <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Link ảnh chính / base64</label>
                                <input className="min-w-0 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Dán link ảnh hoặc base64" value={roomForm.imageUrl} onChange={(e) => setRoomForm((p) => ({ ...p, imageUrl: e.target.value }))} />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Tải ảnh chính từ máy</label>
                                <input type="file" accept="image/*" className="w-full rounded-xl border border-slate-300 px-3 py-2" onChange={handleMainImageUpload} />
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                                {roomForm.imageUrl ? <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${roomForm.imageUrl}")` }} /> : null}
                              </div>
                              <div className="min-w-0 text-sm text-slate-600">
                                <div className="font-semibold text-slate-700">Xem trước ảnh chính</div>
                                <p className="truncate text-xs text-slate-500">{roomForm.imageUrl || "Chưa có ảnh chính"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-300 p-3 sm:col-span-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-700">Ảnh phụ / gallery</p>
                                <p className="text-xs text-slate-500">Mỗi ô là 1 ảnh phụ, có thể thêm dần từng ảnh</p>
                              </div>
                              <div className="flex gap-2">
                                <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={addGalleryField}>
                                  + Thêm 1 ảnh
                                </button>
                                <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
                                  Up nhiều ảnh
                                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
                                </label>
                              </div>
                            </div>

                            <div className="mt-3 space-y-3">
                              {galleryItems.map((item, index) => (
                                <div key={`${index}-${item.slice(0, 20)}`} className="flex flex-col gap-3 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#dfe9ff] text-xs font-bold text-[#4361af]">
                                    {index + 1}
                                  </div>
                                  <div className="flex h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
                                    {item ? (
                                      <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${item}")` }} title={`Ảnh phụ ${index + 1}`} />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">Chưa có ảnh</div>
                                    )}
                                  </div>
                                  <input className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder={`Ảnh phụ ${index + 1} (link hoặc base64)`} value={item} onChange={(e) => updateGalleryField(index, e.target.value)} />
                                  <button type="button" className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600" onClick={() => removeGalleryField(index)}>
                                    Xóa
                                  </button>
                                </div>
                              ))}
                            </div>

                            <p className="mt-3 text-xs text-slate-500">Ảnh phụ sẽ được lưu vào CSDL bằng dấu | và hiển thị dưới ảnh chính.</p>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700">Video URL</label>
                            <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Dán link video" value={roomForm.videoUrl} onChange={(e) => setRoomForm((p) => ({ ...p, videoUrl: e.target.value }))} />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700">Mô tả phòng</label>
                            <textarea className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Nhập mô tả chi tiết" value={roomForm.description} onChange={(e) => setRoomForm((p) => ({ ...p, description: e.target.value }))} />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-300 px-3 py-2 sm:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input type="checkbox" checked={roomForm.showOnHome} onChange={(e) => setRoomForm((p) => ({ ...p, showOnHome: e.target.checked }))} />
                              Hiển thị ở đầu trang
                            </label>
                            <div className="space-y-1">
                              <label className="block text-xs font-semibold text-slate-700">Thứ tự hiển thị</label>
                              <input className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm" type="number" min={0} placeholder="Thứ tự" value={roomForm.homeOrder} onChange={(e) => setRoomForm((p) => ({ ...p, homeOrder: Number(e.target.value) }))} />
                            </div>
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700">Tiện ích CSV</label>
                            <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Phân tách bằng |" value={roomForm.featuresCsv} onChange={(e) => setRoomForm((p) => ({ ...p, featuresCsv: e.target.value }))} />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-semibold text-slate-700">Giờ slot CSV</label>
                            <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Ví dụ: 08:00|12:00" value={roomForm.slotTimesCsv} onChange={(e) => setRoomForm((p) => ({ ...p, slotTimesCsv: e.target.value }))} />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-semibold text-slate-700">Giá slot CSV</label>
                            <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Ví dụ: 420k|520k" value={roomForm.slotPricesCsv} onChange={(e) => setRoomForm((p) => ({ ...p, slotPricesCsv: e.target.value }))} />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700">Trạng thái slot CSV</label>
                            <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Ví dụ: Còn trống|Đang chọn" value={roomForm.slotStatusesCsv} onChange={(e) => setRoomForm((p) => ({ ...p, slotStatusesCsv: e.target.value }))} />
                          </div>
                          <div className="flex gap-2 sm:col-span-2">
                            <button className="rounded-xl bg-[#355eb7] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" type="submit" disabled={isUploadingMedia}>
                              {editingRoomId == null ? "Thêm phòng" : "Cập nhật phòng"}
                            </button>
                            {editingRoomId != null ? (
                              <button
                                type="button"
                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
                                onClick={() => {
                                  setEditingRoomId(null);
                                  setRoomForm(selectedBranch ? { ...EMPTY_ROOM, areaName: selectedBranch } : EMPTY_ROOM);
                                  setGalleryItems([""]);
                                }}
                              >
                                Hủy sửa
                              </button>
                            ) : null}
                          </div>
                        </form>
                      ) : (
                        <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Nhấn “Thêm phòng mới” để mở form.</p>
                      )}

                      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50 text-left text-slate-600">
                            <tr>
                              <th className="px-3 py-3">ID</th>
                              <th className="px-3 py-3">Chi nhánh</th>
                              <th className="px-3 py-3">Tên phòng</th>
                              <th className="px-3 py-3">Nổi bật</th>
                              <th className="px-3 py-3">Ảnh / Video</th>
                              <th className="px-3 py-3">Giá</th>
                              <th className="px-3 py-3">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleRooms.map((room) => (
                              <tr key={room.id} className="border-t">
                                <td className="px-3 py-3">{room.id}</td>
                                <td className="px-3 py-3">{room.areaName}</td>
                                <td className="px-3 py-3">{room.displayName || room.roomType}</td>
                                <td className="px-3 py-3">
                                  <div className="flex flex-col gap-1 text-xs">
                                    <span className={`inline-flex w-fit rounded-full px-2 py-1 font-semibold ${room.showOnHome ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                      {room.showOnHome ? "Home" : "Ẩn"}
                                    </span>
                                    <span className="text-slate-500">Thứ tự: {room.homeOrder ?? "-"}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-xs text-slate-500">
                                  <div>Ảnh chính: {room.imageUrl ? "Có" : "Không"}</div>
                                  <div>Gallery: {room.galleryCsv ? room.galleryCsv.split("|").filter(Boolean).length : 0} ảnh</div>
                                  <div>Video: {room.videoUrl ? "Có" : "Không"}</div>
                                </td>
                                <td className="px-3 py-3">{room.roomPrice}</td>
                                <td className="px-3 py-3">
                                  <div className="flex gap-2">
                                    <button type="button" className="rounded-lg border px-2 py-1" onClick={() => handleEditRoom(room)}>
                                      Sửa
                                    </button>
                                    <button type="button" className="rounded-lg border border-red-300 px-2 py-1 text-red-600" onClick={() => void handleDeleteRoom(room.id)}>
                                      Xóa
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {visibleRooms.length === 0 ? (
                              <tr>
                                <td className="px-3 py-4 text-center text-slate-500" colSpan={7}>
                                  Không có phòng nào trong chi nhánh này.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Hãy chọn một chi nhánh bên trái để thêm, sửa hoặc xóa phòng của chi nhánh đó.</p>
                  )}
                </section>
              </div>

            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Danh sách booking</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="px-2 py-2">Mã</th>
                      <th className="px-2 py-2">Khách</th>
                      <th className="px-2 py-2">Email</th>
                      <th className="px-2 py-2">Phòng</th>
                      <th className="px-2 py-2">Ngày</th>
                      <th className="px-2 py-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking.bookingId}
                        className="cursor-pointer border-b transition hover:bg-slate-50"
                        onClick={() => openBookingDetail(booking)}
                      >
                        <td className="px-2 py-2">{booking.bookingConfirmationCode}</td>
                        <td className="px-2 py-2">{booking.guestName}</td>
                        <td className="px-2 py-2">{booking.guestEmail}</td>
                        <td className="px-2 py-2">{booking.room?.roomType}</td>
                        <td className="px-2 py-2">
                          {formatBookingDate(booking.checkInDate)} - {formatBookingDate(booking.checkOutDate)}
                        </td>
                        <td className="px-2 py-2">
                          <button
                            className="rounded-lg border border-red-300 px-2 py-1 text-red-600"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteBooking(booking.bookingId);
                            }}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {selectedBooking ? (
              <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-3xl rounded-[28px] bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.25)] sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7f8ec6]">Chi tiết booking</div>
                      <h3 className="mt-1 text-2xl font-black text-[#4f67b0]">{selectedBooking.bookingConfirmationCode}</h3>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      onClick={() => setSelectedBooking(null)}
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-sm font-bold text-slate-700">Khách hàng</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div><span className="font-semibold">Tên:</span> {selectedBooking.guestName}</div>
                        <div><span className="font-semibold">Email:</span> {selectedBooking.guestEmail}</div>
                        <div><span className="font-semibold">SĐT:</span> {selectedBooking.guestPhone || "-"}</div>
                        <div><span className="font-semibold">Gửi email:</span> {selectedBooking.receiveBookingEmail ? "Có" : "Không"}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-sm font-bold text-slate-700">Thông tin đặt phòng</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div><span className="font-semibold">Phòng:</span> {selectedBooking.selectedRoomName || selectedBooking.room?.roomType || "-"}</div>
                        <div><span className="font-semibold">Chi nhánh:</span> {selectedBooking.branchName || "-"}</div>
                        <div><span className="font-semibold">Ngày:</span> {formatBookingDate(selectedBooking.checkInDate)} - {formatBookingDate(selectedBooking.checkOutDate)}</div>
                        <div><span className="font-semibold">Khung giờ:</span> {selectedBooking.selectedSlotTime || "-"}</div>
                        <div><span className="font-semibold">Giá giờ:</span> {selectedBooking.selectedSlotPrice || "-"}</div>
                        <div><span className="font-semibold">Ngày chọn:</span> {selectedBooking.selectedDayLabel || "-"}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-sm font-bold text-slate-700">Số lượng</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div><span className="font-semibold">Người lớn:</span> {selectedBooking.numOfAdults}</div>
                        <div><span className="font-semibold">Trẻ em:</span> {selectedBooking.numOfChildren}</div>
                        <div><span className="font-semibold">Tổng khách:</span> {selectedBooking.totalNumOfGuests}</div>
                        <div><span className="font-semibold">Phương tiện:</span> {selectedBooking.transportType || "-"}</div>
                        <div><span className="font-semibold">Đồng ý điều khoản:</span> {selectedBooking.acceptedTerms ? "Có" : "Không"}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-sm font-bold text-slate-700">Khuyến mãi & ghi chú</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div><span className="font-semibold">Mã giảm giá:</span> {selectedBooking.discountCode || "-"}</div>
                        <div><span className="font-semibold">Ghi chú:</span> {selectedBooking.note || "-"}</div>
                        <div><span className="font-semibold">Ảnh CCCD trước:</span> {selectedBooking.idCardFrontImage ? "Có" : "Không"}</div>
                        <div><span className="font-semibold">Ảnh CCCD sau:</span> {selectedBooking.idCardBackImage ? "Có" : "Không"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-700">Ảnh CCCD đầy đủ</div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mặt trước</div>
                        {selectedBooking.idCardFrontImage ? (
                          <a
                            href={selectedBooking.idCardFrontImage}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5"
                          >
                            <div
                              className="aspect-[16/10] w-full bg-cover bg-center"
                              style={{ backgroundImage: `url("${selectedBooking.idCardFrontImage}")` }}
                            />
                            <div className="border-t border-slate-200 px-3 py-2 text-center text-xs font-semibold text-[#4361af]">
                              Bấm để mở ảnh gốc
                            </div>
                          </a>
                        ) : (
                          <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
                            Chưa có ảnh mặt trước
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mặt sau</div>
                        {selectedBooking.idCardBackImage ? (
                          <a
                            href={selectedBooking.idCardBackImage}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5"
                          >
                            <div
                              className="aspect-[16/10] w-full bg-cover bg-center"
                              style={{ backgroundImage: `url("${selectedBooking.idCardBackImage}")` }}
                            />
                            <div className="border-t border-slate-200 px-3 py-2 text-center text-xs font-semibold text-[#4361af]">
                              Bấm để mở ảnh gốc
                            </div>
                          </a>
                        ) : (
                          <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
                            Chưa có ảnh mặt sau
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
