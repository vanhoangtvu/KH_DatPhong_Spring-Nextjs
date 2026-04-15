"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Mail, MapPin, Phone, ReceiptText, Ticket, Users } from "lucide-react";
import { compressImageFileToDataUrl } from "@/lib/imageCompression";
import AdminChatPanel from "@/components/AdminChatPanel";

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

type Branch = {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  active: boolean;
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
  bookingStatus?: string;
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
  discountCode: string;
  discountPercent: number;
  termsPageTitle: string;
  termsPageSubtitle: string;
  termsPageIntro: string;
  termsSectionTitle: string;
  termsSectionContent: string;
  servicesSectionTitle: string;
  servicesSectionContent: string;
  termsPageNote: string;
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

type LegalForm = {
  termsPageTitle: string;
  termsPageSubtitle: string;
  termsPageIntro: string;
  termsSectionTitle: string;
  termsSectionContent: string;
  servicesSectionTitle: string;
  servicesSectionContent: string;
  termsPageNote: string;
};

type PromotionForm = {
  discountCode: string;
  discountPercent: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Không đọc được file ảnh"));
    reader.readAsDataURL(file);
  });

const splitImages = (value: string) =>
  (value && typeof value === "string" ? value : "")
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
  if (!value || typeof value !== "string") return "-";
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return value;
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("vi-VN");
};

const normalizeBookingStatus = (value?: string) => value?.trim() || "Đã đặt";

const BOOKING_STATUS_OPTIONS = [
  "Đã đặt",
  "Đã xác nhận",
  "Đã check-in",
  "Đã check-out",
  "Đã hoàn thành",
  "Đã hủy",
];

const getBookingStatusBadgeClass = (value?: string) => {
  const status = normalizeBookingStatus(value);
  if (status === "Đã hoàn thành") return "bg-emerald-100 text-emerald-700";
  if (status === "Đã hủy") return "bg-rose-100 text-rose-700";
  if (status === "Đã check-in") return "bg-sky-100 text-sky-700";
  if (status === "Đã check-out") return "bg-indigo-100 text-indigo-700";
  if (status === "Đã xác nhận") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
};

const getBookingStatusRingClass = (value?: string) => {
  const status = normalizeBookingStatus(value);
  if (status === "Đã hoàn thành") return "ring-emerald-200 bg-emerald-50/70";
  if (status === "Đã hủy") return "ring-rose-200 bg-rose-50/70";
  if (status === "Đã check-in") return "ring-sky-200 bg-sky-50/70";
  if (status === "Đã check-out") return "ring-indigo-200 bg-indigo-50/70";
  if (status === "Đã xác nhận") return "ring-blue-200 bg-blue-50/70";
  return "ring-amber-200 bg-amber-50/70";
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "branches" | "rooms" | "bookings" | "chat" | "settings">("overview");
  const [token, setToken] = useState("");
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingItem | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    active: true,
  });
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
  const [promotionForm, setPromotionForm] = useState<PromotionForm>({
    discountCode: "",
    discountPercent: 10,
  });
  const [legalForm, setLegalForm] = useState<LegalForm>({
    termsPageTitle: "",
    termsPageSubtitle: "",
    termsPageIntro: "",
    termsSectionTitle: "",
    termsSectionContent: "",
    servicesSectionTitle: "",
    servicesSectionContent: "",
    termsPageNote: "",
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
    const expiryStr = window.localStorage.getItem("adminTokenExpiry");
    setToken(localToken);
    if (expiryStr) {
      setTokenExpiry(parseInt(expiryStr, 10));
    }
  }, []);

  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const handleLogout = () => {
    setToken("");
    setTokenExpiry(null);
    window.localStorage.removeItem("adminToken");
    window.localStorage.removeItem("adminTokenExpiry");
    setEmail("");
    setPassword("");
    setRooms([]);
    setBranches([]);
    setBookings([]);
    setSettings({ acceptingBookings: true, bookingNotice: "" });
    setHomePageConfig(null);
    setPromotionForm({ discountCode: "", discountPercent: 10 });
    setLegalForm({
      termsPageTitle: "",
      termsPageSubtitle: "",
      termsPageIntro: "",
      termsSectionTitle: "",
      termsSectionContent: "",
      servicesSectionTitle: "",
      servicesSectionContent: "",
      termsPageNote: "",
    });
    setMessage("Đã đăng xuất thành công");
  };

  const loadAdminData = async () => {
    if (!token) return;
    try {
      setMessage("Đang tải dữ liệu admin...");
      const [branchRes, roomRes, bookingRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/public/branches`, {
          headers: { ...authHeaders, "Cache-Control": "no-cache" },
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/admin/rooms`, {
          headers: { ...authHeaders, "Cache-Control": "no-cache" },
          cache: "no-store",
        }),
        fetch(`${API_BASE}/bookings/all-bookings`, {
          headers: { ...authHeaders, "Cache-Control": "no-cache" },
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/admin/home-page/booking-settings`, {
          headers: { ...authHeaders, "Cache-Control": "no-cache" },
          cache: "no-store",
        }),
      ]);

      // Check for 401 on any request
      if (branchRes.status === 401 || roomRes.status === 401 || bookingRes.status === 401 || settingsRes.status === 401) {
        setMessage("Token hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
        return;
      }

      if (!branchRes.ok || !roomRes.ok || !bookingRes.ok || !settingsRes.ok) {
        throw new Error("Token không hợp lệ hoặc không có quyền admin");
      }

      const [branchesData, roomsData, bookingsData, settingsData] = await Promise.all([
        branchRes.json(),
        roomRes.json(),
        bookingRes.json(),
        settingsRes.json(),
      ]);

      const homePageRes = await fetch(`${API_BASE}/api/public/home-page`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const homePageData = homePageRes.ok ? ((await homePageRes.json()) as HomePageConfigData) : null;

      setBranches(branchesData as Branch[]);
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
        setPromotionForm({
          discountCode: homePageData.discountCode ?? "",
          discountPercent: homePageData.discountPercent ?? 10,
        });
        setLegalForm({
          termsPageTitle: homePageData.termsPageTitle ?? "",
          termsPageSubtitle: homePageData.termsPageSubtitle ?? "",
          termsPageIntro: homePageData.termsPageIntro ?? "",
          termsSectionTitle: homePageData.termsSectionTitle ?? "",
          termsSectionContent: homePageData.termsSectionContent ?? "",
          servicesSectionTitle: homePageData.servicesSectionTitle ?? "",
          servicesSectionContent: homePageData.servicesSectionContent ?? "",
          termsPageNote: homePageData.termsPageNote ?? "",
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

  // Check token expiry and show warning
  useEffect(() => {
    if (!token || !tokenExpiry) return;
    
    const checkExpiry = () => {
      const now = Date.now();
      const timeLeft = tokenExpiry - now;
      
      // If less than 30 minutes left, show warning
      if (timeLeft > 0 && timeLeft < 1800000) {
        const minutesLeft = Math.floor(timeLeft / 60000);
        setMessage(`⚠️ Token sẽ hết hạn sau ${minutesLeft} phút. Vui lòng lưu công việc.`);
      }
      
      // If expired, logout
      if (timeLeft <= 0) {
        setMessage("Token đã hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
      }
    };
    
    // Check immediately
    checkExpiry();
    
    // Check every minute
    const interval = setInterval(checkExpiry, 60000);
    
    return () => clearInterval(interval);
  }, [token, tokenExpiry]);

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
      const expiryTime = Date.now() + 28800000; // 8 hours from now
      setToken(data.token);
      setTokenExpiry(expiryTime);
      window.localStorage.setItem("adminToken", data.token);
      window.localStorage.setItem("adminTokenExpiry", expiryTime.toString());
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
      if (response.status === 401) {
        setMessage("Token hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
        return;
      }
      if (!response.ok) {
        throw new Error("Không lưu được cấu hình nhận booking");
      }
      setMessage("Đã cập nhật cấu hình nhận booking");
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu cấu hình thất bại");
    }
  };

  const saveHomePageContent = async (successMessage: string, failureMessage: string) => {
    if (!homePageConfig) {
      setMessage("Không có dữ liệu trang chủ để cập nhật");
      return;
    }
    try {
      const payload: HomePageConfigData = {
        ...homePageConfig,
        hotline: footerForm.hotline,
        footerDescription: footerForm.footerDescription,
        discountCode: promotionForm.discountCode.trim().toUpperCase(),
        discountPercent: Number.isFinite(promotionForm.discountPercent) ? promotionForm.discountPercent : 0,
        termsPageTitle: legalForm.termsPageTitle,
        termsPageSubtitle: legalForm.termsPageSubtitle,
        termsPageIntro: legalForm.termsPageIntro,
        termsSectionTitle: legalForm.termsSectionTitle,
        termsSectionContent: legalForm.termsSectionContent,
        servicesSectionTitle: legalForm.servicesSectionTitle,
        servicesSectionContent: legalForm.servicesSectionContent,
        termsPageNote: legalForm.termsPageNote,
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
      if (response.status === 401) {
        setMessage("Token hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
        return;
      }
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
      setPromotionForm({
        discountCode: updated.discountCode ?? "",
        discountPercent: updated.discountPercent ?? 10,
      });
      setLegalForm({
        termsPageTitle: updated.termsPageTitle ?? "",
        termsPageSubtitle: updated.termsPageSubtitle ?? "",
        termsPageIntro: updated.termsPageIntro ?? "",
        termsSectionTitle: updated.termsSectionTitle ?? "",
        termsSectionContent: updated.termsSectionContent ?? "",
        servicesSectionTitle: updated.servicesSectionTitle ?? "",
        servicesSectionContent: updated.servicesSectionContent ?? "",
        termsPageNote: updated.termsPageNote ?? "",
      });
      setMessage(successMessage);
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : failureMessage);
    }
  };

  const handleSaveFooter = async () => {
    await saveHomePageContent("Đã cập nhật footer thành công", "Lưu footer thất bại");
  };

  const handleSavePromotion = async () => {
    await saveHomePageContent("Đã cập nhật mã giảm giá", "Lưu mã giảm giá thất bại");
  };

  const handleSaveLegalContent = async () => {
    await saveHomePageContent("Đã cập nhật điều khoản và dịch vụ", "Lưu điều khoản và dịch vụ thất bại");
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

      if (response.status === 401) {
        setMessage("Token hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
        return;
      }
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
    setActiveTab("rooms");
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("Bạn có chắc muốn xóa phòng này?")) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/rooms/${roomId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (response.status === 401) {
        setMessage("Token hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
        return;
      }
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
    if (!confirm("Bạn có chắc muốn xóa booking này?")) return;
    try {
      const response = await fetch(`${API_BASE}/bookings/booking/${bookingId}/delete`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (response.status === 401) {
        setMessage("Token hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
        return;
      }
      if (!response.ok) {
        throw new Error("Không xóa được booking");
      }
      setMessage("Đã xóa booking");
      setSelectedBooking(null);
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Xóa booking thất bại");
    }
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;
    try {
      const response = await fetch(`${API_BASE}/bookings/booking/${editingBooking.bookingId}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          guestName: editingBooking.guestName,
          guestEmail: editingBooking.guestEmail,
          guestPhone: editingBooking.guestPhone,
          numOfAdults: editingBooking.numOfAdults,
          numOfChildren: editingBooking.numOfChildren,
          checkInDate: editingBooking.checkInDate,
          checkOutDate: editingBooking.checkOutDate,
          selectedDayLabel: editingBooking.selectedDayLabel,
          selectedSlotTime: editingBooking.selectedSlotTime,
          note: editingBooking.note,
          transportType: editingBooking.transportType,
          idCardFrontImage: editingBooking.idCardFrontImage,
          idCardBackImage: editingBooking.idCardBackImage,
          bookingStatus: normalizeBookingStatus(editingBooking.bookingStatus),
        }),
      });
      if (response.status === 401) {
        setMessage("Token hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
        return;
      }
      if (!response.ok) {
        throw new Error("Không cập nhật được booking");
      }
      setMessage("Đã cập nhật booking thành công");
      setEditingBooking(null);
      setSelectedBooking(null);
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cập nhật booking thất bại");
    }
  };

  const handleSubmitBranch = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const endpoint =
        editingBranchId == null
          ? `${API_BASE}/api/admin/branches`
          : `${API_BASE}/api/admin/branches/${editingBranchId}`;
      const method = editingBranchId == null ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(branchForm),
      });

      if (response.status === 401) {
        setMessage("Token hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
        return;
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Không lưu được chi nhánh");
      }

      setBranchForm({ name: "", description: "", address: "", phone: "", active: true });
      setEditingBranchId(null);
      setShowBranchForm(false);
      setMessage("Lưu chi nhánh thành công");
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu chi nhánh thất bại");
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setShowBranchForm(true);
    setBranchForm({
      name: branch.name,
      description: branch.description,
      address: branch.address,
      phone: branch.phone,
      active: branch.active,
    });
    setActiveTab("branches");
  };

  const handleDeleteBranch = async (branchId: number) => {
    if (!confirm("Bạn có chắc muốn xóa chi nhánh này? Tất cả phòng thuộc chi nhánh cũng sẽ bị xóa.")) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/branches/${branchId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (response.status === 401) {
        setMessage("Token hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
        return;
      }
      if (!response.ok) {
        throw new Error("Không xóa được chi nhánh");
      }
      setMessage("Đã xóa chi nhánh và các phòng liên quan");
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Xóa chi nhánh thất bại");
    }
  };

  const handleToggleBranch = async (branchId: number, active: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/branches/${branchId}/toggle?active=${active}`, {
        method: "PATCH",
        headers: authHeaders,
      });
      if (response.status === 401) {
        setMessage("Token hết hạn. Vui lòng đăng nhập lại.");
        handleLogout();
        return;
      }
      if (!response.ok) {
        throw new Error("Không thay đổi được trạng thái chi nhánh");
      }
      setMessage(active ? "Đã kích hoạt chi nhánh" : "Đã tạm dừng chi nhánh");
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Thay đổi trạng thái thất bại");
    }
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

  const handleBookingImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "idCardFrontImage" | "idCardBackImage"
  ) => {
    const file = event.target.files?.[0];
    if (!file || !editingBooking) return;
    setIsUploadingMedia(true);
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setEditingBooking((prev) => (prev ? { ...prev, [field]: compressed } : prev));
      setMessage("Đã nén và cập nhật ảnh CCCD trong form sửa booking");
    } catch {
      setMessage("Không thể tải ảnh CCCD lên");
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

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f7f0e2] via-[#f1e2c8] to-[#ead5b5] p-4 text-[#6b4a2d]">
          <section className="w-full max-w-md rounded-3xl border border-[#e2c9ab] bg-[#fffaf2]/90 p-8 shadow-[0_18px_60px_rgba(122,84,47,0.12)]">
          <div className="mb-6 text-center">
              <h1 className="text-3xl font-black text-[#7e5331]">Fiin Home Admin</h1>
              <p className="mt-2 text-sm text-[#9c7450]">Đăng nhập để quản lý hệ thống</p>
          </div>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#7e5331]">Email</label>
              <input
                type="email"
                className="w-full rounded-xl border border-[#e2c9ab] bg-white px-4 py-3 focus:border-[#8b5e3c] focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/20"
                placeholder="admin@hotel.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#7e5331]">Mật khẩu</label>
              <input
                type="password"
                className="w-full rounded-xl border border-[#e2c9ab] bg-white px-4 py-3 focus:border-[#8b5e3c] focus:outline-none focus:ring-2 focus:ring-[#8b5e3c]/20"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <button 
              className="w-full rounded-xl bg-[#8b5e3c] px-4 py-3 font-semibold text-white transition hover:bg-[#734a2d] active:scale-[0.98]" 
              type="submit"
            >
              Đăng nhập
            </button>
          </form>
          {message && (
            <p className="mt-4 rounded-xl bg-[#f0dfc9] px-3 py-2 text-center text-sm text-[#7e5331]">{message}</p>
          )}
        </section>
      </main>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Tổng quan", icon: "📊" },
    { id: "branches" as const, label: "Chi nhánh", icon: "🏢" },
    { id: "rooms" as const, label: "Quản lý phòng", icon: "🏠" },
    { id: "bookings" as const, label: "Đặt phòng", icon: "📅" },
    { id: "chat" as const, label: "Chat", icon: "💬" },
    { id: "settings" as const, label: "Cài đặt", icon: "⚙️" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7f0e2] via-[#f1e2c8] to-[#ead5b5] p-4 text-[#6b4a2d] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-[#e2c9ab] bg-[#fffaf2]/90 p-6 shadow-[0_18px_60px_rgba(122,84,47,0.10)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-[#7e5331]">Fiin Home Admin</h1>
              <p className="mt-1 text-sm text-[#9c7450]">Quản lý hệ thống đặt phòng khách sạn</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#f0dfc9] px-3 py-1.5 text-xs font-semibold text-[#7e5331]">
                {totalRooms} phòng
              </span>
              <span className="rounded-full bg-[#f0dfc9] px-3 py-1.5 text-xs font-semibold text-[#7e5331]">
                {totalBookings} booking
              </span>
              <span className="rounded-full bg-[#f0dfc9] px-3 py-1.5 text-xs font-semibold text-[#7e5331]">
                {branchOptions.length} chi nhánh
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-[#ecd3be] px-4 py-1.5 text-xs font-semibold text-[#7e5331] transition hover:bg-[#e5c5a5] active:scale-95"
              >
                Đăng xuất
              </button>
            </div>
          </div>
          {message && (
            <div className="mt-4 rounded-xl bg-[#f0dfc9] px-4 py-3 text-sm text-[#7e5331]">
              {message}
            </div>
          )}
        </header>

        {/* Tabs Navigation */}
        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[#e2c9ab] bg-[#fffaf2]/90 p-2 shadow-[0_12px_40px_rgba(122,84,47,0.08)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-[#8b5e3c] text-white shadow-md"
                  : "text-[#7e5331] hover:bg-[#f0dfc9]"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-gradient-to-br from-[#8b5e3c] to-[#a57146] p-6 text-white shadow-lg">
                <p className="text-sm font-medium opacity-90">Tổng phòng</p>
                <p className="mt-2 text-4xl font-black">{totalRooms}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#9c7450] to-[#b08964] p-6 text-white shadow-lg">
                <p className="text-sm font-medium opacity-90">Phòng nổi bật</p>
                <p className="mt-2 text-4xl font-black">{featuredRooms}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#c08457] to-[#d39a66] p-6 text-white shadow-lg">
                <p className="text-sm font-medium opacity-90">Phòng đã đặt</p>
                <p className="mt-2 text-4xl font-black">{bookedRooms}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#7e5331] to-[#8b5e3c] p-6 text-white shadow-lg">
                <p className="text-sm font-medium opacity-90">Tổng booking</p>
                <p className="mt-2 text-4xl font-black">{totalBookings}</p>
              </div>
            </div>

            {/* Branch Overview */}
            <section className="rounded-2xl border border-[#e2c9ab] bg-[#fffaf2]/90 p-6 shadow-[0_12px_40px_rgba(122,84,47,0.08)]">
              <h2 className="text-xl font-bold">Chi nhánh</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {branchGroups.map((group) => (
                  <div
                    key={group.branch}
                    className="rounded-xl border-2 border-[#e2c9ab] bg-[#fff8ef] p-4 transition hover:border-[#8b5e3c] hover:shadow-md"
                  >
                    <h3 className="font-bold text-[#7e5331]">{group.branch}</h3>
                    <p className="mt-1 text-sm text-[#9c7450]">{group.count} phòng</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.roomNames.slice(0, 3).map((name) => (
                        <span key={name} className="rounded-lg bg-white px-2 py-1 text-xs text-[#7e5331] shadow-sm">
                          {name}
                        </span>
                      ))}
                      {group.roomNames.length > 3 && (
                        <span className="rounded-lg bg-[#f0dfc9] px-2 py-1 text-xs text-[#7e5331]">
                          +{group.roomNames.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Bookings */}
            <section className="rounded-2xl border border-[#e2c9ab] bg-[#fffaf2]/90 p-6 shadow-[0_12px_40px_rgba(122,84,47,0.08)]">
              <h2 className="text-xl font-bold">Booking gần đây</h2>
              <div className="mt-4 space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.bookingId}
                    className="flex items-center justify-between rounded-xl border border-[#e2c9ab] bg-[#fff8ef] p-4"
                  >
                    <div>
                      <p className="font-semibold">{booking.guestName}</p>
                      <p className="text-sm text-[#9c7450]">
                        {booking.selectedRoomName} • {formatBookingDate(booking.checkInDate)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setActiveTab("bookings");
                      }}
                      className="rounded-lg bg-[#8b5e3c] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#734a2d]"
                    >
                      Xem
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "branches" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#e2c9ab] bg-[#fffaf2]/90 p-6 shadow-[0_12px_40px_rgba(122,84,47,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Quản lý chi nhánh</h2>
                  <p className="text-sm text-slate-500">Tổng {branches.length} chi nhánh</p>
                </div>
                <button
                  onClick={() => {
                    setEditingBranchId(null);
                    setBranchForm({ name: "", description: "", address: "", phone: "", active: true });
                    setShowBranchForm(!showBranchForm);
                  }}
                  className="rounded-xl bg-[#8b5e3c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#734a2d] active:scale-95"
                >
                  {showBranchForm ? "Đóng form" : "+ Thêm chi nhánh"}
                </button>
              </div>

              {/* Branch Form */}
              {showBranchForm && (
                <form onSubmit={handleSubmitBranch} className="mt-6 rounded-xl border-2 border-[#e2c9ab] bg-[#fffaf2] p-6">
                  <h3 className="mb-4 text-lg font-bold">{editingBranchId ? "Sửa chi nhánh" : "Thêm chi nhánh mới"}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Tên chi nhánh</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={branchForm.name}
                        onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={branchForm.phone}
                        onChange={(e) => setBranchForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={branchForm.address}
                        onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
                      <textarea
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        rows={3}
                        value={branchForm.description}
                        onChange={(e) => setBranchForm((p) => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={branchForm.active}
                          onChange={(e) => setBranchForm((p) => ({ ...p, active: e.target.checked }))}
                          className="h-5 w-5 rounded"
                        />
                        <span className="font-semibold">Chi nhánh đang hoạt động</span>
                      </label>
                      <p className="mt-1 text-xs text-slate-600">
                        Khi tắt, tất cả phòng thuộc chi nhánh này sẽ không hiển thị ở trang chủ
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#8b5e3c] px-6 py-2.5 font-semibold text-white transition hover:bg-[#734a2d]"
                    >
                      Lưu chi nhánh
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBranchForm(false)}
                      className="rounded-lg border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}

              {/* Branch List */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {branches.map((branch) => {
                  const branchRoomCount = rooms.filter((room) => room.areaName === branch.name).length;
                  return (
                    <div key={branch.id} className="rounded-xl border border-[#eadcc9] bg-[#fffaf2] p-4 shadow-sm">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-bold">{branch.name}</h3>
                          <p className="text-sm text-slate-600">{branchRoomCount} phòng</p>
                        </div>
                        {branch.active ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            ✓ Hoạt động
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                            ✕ Tạm dừng
                          </span>
                        )}
                      </div>
                      {branch.address && <p className="mt-2 text-xs text-slate-600">📍 {branch.address}</p>}
                      {branch.phone && <p className="mt-1 text-xs text-slate-600">📞 {branch.phone}</p>}
                      {branch.description && <p className="mt-2 text-sm text-slate-700">{branch.description}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEditBranch(branch)}
                          className="flex-1 rounded-lg bg-[#f0dfc9] px-3 py-2 text-sm font-semibold text-[#8b5e3c] transition hover:bg-[#e5c5a5]"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleToggleBranch(branch.id, !branch.active)}
                          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            branch.active
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          }`}
                        >
                          {branch.active ? "Tạm dừng" : "Kích hoạt"}
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
                          className="rounded-lg bg-[#f7e1dd] px-3 py-2 text-sm font-semibold text-[#a24d3c] transition hover:bg-[#efc7be]"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === "rooms" && (
          <div className="space-y-6">
            <section className="rounded-2xl bg-white p-6 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Quản lý phòng</h2>
                  <p className="text-sm text-slate-500">
                    {selectedBranch ? `${selectedBranch} • ${visibleRooms.length} phòng` : `Tất cả • ${totalRooms} phòng`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingRoomId(null);
                    setRoomForm(selectedBranch ? { ...EMPTY_ROOM, areaName: selectedBranch } : EMPTY_ROOM);
                    setGalleryItems([""]);
                    setShowRoomForm(!showRoomForm);
                  }}
                  className="rounded-xl bg-[#8b5e3c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#734a2d] active:scale-95"
                >
                  {showRoomForm ? "Đóng form" : "+ Thêm phòng"}
                </button>
              </div>

              {/* Branch Filter */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedBranch(null)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedBranch === null
                      ? "bg-[#8b5e3c] text-white"
                      : "bg-[#f0dfc9] text-[#7e5331] hover:bg-[#e5c5a5]"
                  }`}
                >
                  Tất cả
                </button>
                {branchOptions.map((branch) => (
                  <button
                    key={branch}
                    onClick={() => setSelectedBranch(branch)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selectedBranch === branch
                        ? "bg-[#8b5e3c] text-white"
                        : "bg-[#f0dfc9] text-[#7e5331] hover:bg-[#e5c5a5]"
                    }`}
                  >
                    {branch}
                  </button>
                ))}
              </div>

              {/* Room Form */}
              {showRoomForm && (
                <form onSubmit={handleSubmitRoom} className="mt-6 rounded-xl border-2 border-[#e2c9ab] bg-[#fffaf2] p-6">
                  <h3 className="mb-4 text-lg font-bold">{editingRoomId ? "Sửa phòng" : "Thêm phòng mới"}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Loại phòng</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={roomForm.roomType}
                        onChange={(e) => setRoomForm((p) => ({ ...p, roomType: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Giá phòng</label>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={roomForm.roomPrice}
                        onChange={(e) => setRoomForm((p) => ({ ...p, roomPrice: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Chi nhánh</label>
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={roomForm.areaName}
                        onChange={(e) => setRoomForm((p) => ({ ...p, areaName: e.target.value }))}
                        required
                      >
                        <option value="">-- Chọn chi nhánh --</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.name}>
                            {branch.name} {!branch.active && "(Tạm dừng)"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Tên hiển thị</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={roomForm.displayName}
                        onChange={(e) => setRoomForm((p) => ({ ...p, displayName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
                      <textarea
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        rows={3}
                        value={roomForm.description}
                        onChange={(e) => setRoomForm((p) => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">URL ảnh chính</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={roomForm.imageUrl}
                        onChange={(e) => setRoomForm((p) => ({ ...p, imageUrl: e.target.value }))}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageUpload}
                        className="mt-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">URL video</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={roomForm.videoUrl}
                        onChange={(e) => setRoomForm((p) => ({ ...p, videoUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Tiện nghi (CSV)</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="WiFi|TV|Điều hòa"
                        value={roomForm.featuresCsv}
                        onChange={(e) => setRoomForm((p) => ({ ...p, featuresCsv: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Khung giờ (CSV)</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="8h-12h|13h-17h"
                        value={roomForm.slotTimesCsv}
                        onChange={(e) => setRoomForm((p) => ({ ...p, slotTimesCsv: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Giá khung giờ (CSV)</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="200k|250k"
                        value={roomForm.slotPricesCsv}
                        onChange={(e) => setRoomForm((p) => ({ ...p, slotPricesCsv: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái slot (CSV)</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Còn Trống|Đã Đặt"
                        value={roomForm.slotStatusesCsv}
                        onChange={(e) => setRoomForm((p) => ({ ...p, slotStatusesCsv: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="rounded-xl border-2 border-dashed border-[#eadcc9] bg-[#fffaf2] p-4">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={roomForm.showOnHome}
                            onChange={(e) => setRoomForm((p) => ({ ...p, showOnHome: e.target.checked }))}
                            className="mt-1 h-5 w-5 rounded"
                          />
                          <div className="flex-1">
                            <span className="font-bold text-[#6a4a2d]">Hiển thị ở Trang giới thiệu</span>
                            <p className="mt-1 text-xs text-slate-600">
                              Phòng này sẽ xuất hiện trong phần "Trang giới thiệu" ở trang chủ. Tất cả phòng được tick sẽ hiển thị theo thứ tự ưu tiên.
                            </p>
                          </div>
                        </label>
                        {roomForm.showOnHome && (
                          <div className="mt-3">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                              Thứ tự ưu tiên (số nhỏ hơn hiển thị trước)
                            </label>
                            <input
                              type="number"
                              placeholder="Ví dụ: 1, 2, 3..."
                              className="w-full rounded-lg border border-[#eadcc9] px-3 py-2"
                              value={roomForm.homeOrder}
                              onChange={(e) => setRoomForm((p) => ({ ...p, homeOrder: Number(e.target.value) }))}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      disabled={isUploadingMedia}
                      className="rounded-lg bg-[#8b5e3c] px-6 py-2.5 font-semibold text-white transition hover:bg-[#734a2d] disabled:opacity-50"
                    >
                      {isUploadingMedia ? "Đang tải..." : "Lưu phòng"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRoomForm(false)}
                      className="rounded-lg border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}

              {/* Room List */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleRooms.map((room) => (
                  <div key={room.id} className="rounded-xl border border-[#eadcc9] bg-[#fffaf2] p-4 shadow-sm">
                    {room.imageUrl && (
                      <div className="mb-3 h-32 overflow-hidden rounded-lg bg-slate-200">
                        <img src={room.imageUrl} alt={room.displayName} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold">{room.displayName || room.roomType}</h3>
                        <p className="text-sm text-slate-600">{room.areaName}</p>
                      </div>
                      {room.showOnHome && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          ✓ Trang giới thiệu
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-lg font-bold text-[#8b5e3c]">{room.roomPrice.toLocaleString()}đ</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleEditRoom(room)}
                        className="flex-1 rounded-lg bg-[#f0dfc9] px-3 py-2 text-sm font-semibold text-[#8b5e3c] transition hover:bg-[#e5c5a5]"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="flex-1 rounded-lg bg-[#f7e1dd] px-3 py-2 text-sm font-semibold text-[#a24d3c] transition hover:bg-[#efc7be]"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[28px] border border-[#e2c9ab] bg-[#fffaf2] shadow-[0_18px_48px_rgba(122,84,47,0.10)]">
              <div className="border-b border-[#eadcc9] bg-[linear-gradient(135deg,#fffaf2_0%,#f5e7d1_100%)] px-6 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b5e3c] ring-1 ring-[#e2c9ab]">
                      <ReceiptText className="h-3.5 w-3.5" />
                      Booking management
                    </div>
                    <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#6b4a2d]">Danh sách đặt phòng</h2>
                    <p className="mt-1 text-sm text-[#9c7450]">Tổng {totalBookings} booking đang được quản lý</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-[280px]">
                    <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-[#eadcc9]">
                      <div className="font-semibold text-[#8b5e3c]">Tổng</div>
                      <div className="mt-1 text-lg font-black text-[#6b4a2d]">{totalBookings}</div>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-[#eadcc9]">
                      <div className="font-semibold text-[#8b5e3c]">Phòng</div>
                      <div className="mt-1 text-lg font-black text-[#6b4a2d]">{bookedRooms}</div>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-[#eadcc9]">
                      <div className="font-semibold text-[#8b5e3c]">Đang mở</div>
                      <div className="mt-1 text-lg font-black text-[#6b4a2d]">{settings.acceptingBookings ? "Yes" : "No"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-6">
                {bookings.map((booking) => (
                  <article
                    key={booking.bookingId}
                    className={`rounded-[24px] border border-[#eadcc9] bg-white p-4 shadow-[0_10px_30px_rgba(122,84,47,0.06)] ring-1 ${getBookingStatusRingClass(booking.bookingStatus)}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black text-[#6b4a2d]">{booking.guestName}</h3>
                              <span className="rounded-full bg-[#f0dfc9] px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-[#7e5331]">
                                {booking.bookingConfirmationCode}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-[#9c7450]">{booking.selectedRoomName} · {booking.branchName}</p>
                          </div>

                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBookingStatusBadgeClass(booking.bookingStatus)}`}>
                            {normalizeBookingStatus(booking.bookingStatus)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl bg-[#fffaf2] p-3 ring-1 ring-[#eadcc9]">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c]">
                              <Users className="h-3.5 w-3.5" />
                              Khách hàng
                            </div>
                            <div className="mt-2 space-y-1 text-sm text-[#6b4a2d]">
                              <p className="font-semibold">{booking.guestEmail}</p>
                              <p>{booking.guestPhone}</p>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-[#fffaf2] p-3 ring-1 ring-[#eadcc9]">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c]">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Lịch đặt
                            </div>
                            <div className="mt-2 space-y-1 text-sm text-[#6b4a2d]">
                              <p>{formatBookingDate(booking.checkInDate)}</p>
                              <p className="text-xs text-[#9c7450]">Nhãn ngày: {booking.selectedDayLabel}</p>
                              <p>{booking.selectedSlotTime}</p>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-[#fffaf2] p-3 ring-1 ring-[#eadcc9]">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c]">
                              <MapPin className="h-3.5 w-3.5" />
                              Vị trí
                            </div>
                            <div className="mt-2 space-y-1 text-sm text-[#6b4a2d]">
                              <p>{booking.branchName}</p>
                              <p>{booking.selectedRoomName}</p>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-[#fffaf2] p-3 ring-1 ring-[#eadcc9]">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c]">
                              <Ticket className="h-3.5 w-3.5" />
                              Giá
                            </div>
                            <div className="mt-2 text-xl font-black text-[#6b4a2d]">{booking.selectedSlotPrice}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row gap-2 lg:flex-col lg:min-w-[136px] lg:items-stretch">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#e2c9ab] bg-white px-4 py-2.5 text-sm font-semibold text-[#8b5e3c] transition hover:bg-[#f0dfc9]"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => setEditingBooking(booking)}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#8b5e3c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#734a2d]"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking.bookingId)}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#fff1ef] px-4 py-2.5 text-sm font-semibold text-[#b94e3a] transition hover:bg-[#ffe1db]"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Edit Booking Modal */}
            {editingBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingBooking(null)}>
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">Sửa booking</h3>
                      <p className="text-sm text-slate-500">Mã: {editingBooking.bookingConfirmationCode}</p>
                    </div>
                    <button
                      onClick={() => setEditingBooking(null)}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      Hủy
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Họ tên</label>
                        <input
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          value={editingBooking.guestName}
                          onChange={(e) => setEditingBooking({...editingBooking, guestName: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          value={editingBooking.guestEmail}
                          onChange={(e) => setEditingBooking({...editingBooking, guestEmail: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                        <input
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          value={editingBooking.guestPhone}
                          onChange={(e) => setEditingBooking({...editingBooking, guestPhone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Phương tiện</label>
                        <select
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          value={editingBooking.transportType}
                          onChange={(e) => setEditingBooking({...editingBooking, transportType: e.target.value})}
                        >
                          <option value="Xe may">Xe máy</option>
                          <option value="Xe o to">Xe ô tô</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái booking</label>
                        <select
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          value={normalizeBookingStatus(editingBooking.bookingStatus)}
                          onChange={(e) => setEditingBooking({...editingBooking, bookingStatus: e.target.value})}
                        >
                          {BOOKING_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số người lớn</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          value={editingBooking.numOfAdults}
                          onChange={(e) => setEditingBooking({...editingBooking, numOfAdults: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số trẻ em</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          value={editingBooking.numOfChildren}
                          onChange={(e) => setEditingBooking({...editingBooking, numOfChildren: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày check-in</label>
                        <input
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          value={editingBooking.checkInDate}
                          onChange={(e) => setEditingBooking({...editingBooking, checkInDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nhãn ngày</label>
                        <input
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          value={editingBooking.selectedDayLabel}
                          onChange={(e) => setEditingBooking({...editingBooking, selectedDayLabel: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Khung giờ</label>
                        <input
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          value={editingBooking.selectedSlotTime}
                          onChange={(e) => setEditingBooking({...editingBooking, selectedSlotTime: e.target.value})}
                        />
                      </div>
                      <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <label className="block text-sm font-semibold text-slate-700">Ảnh CCCD/CMND</label>
                          <span className="text-xs text-slate-500">Tải ảnh mới để thay thế dữ liệu hiện tại</span>
                        </div>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-600">Mặt trước</label>
                            {editingBooking.idCardFrontImage ? (
                              <img
                                src={editingBooking.idCardFrontImage}
                                alt="CCCD mặt trước"
                                className="h-40 w-full rounded-xl border border-slate-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-40 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs text-slate-400">
                                Chưa có ảnh
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => void handleBookingImageUpload(e, "idCardFrontImage")}
                              className="block w-full text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-600">Mặt sau</label>
                            {editingBooking.idCardBackImage ? (
                              <img
                                src={editingBooking.idCardBackImage}
                                alt="CCCD mặt sau"
                                className="h-40 w-full rounded-xl border border-slate-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-40 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs text-slate-400">
                                Chưa có ảnh
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => void handleBookingImageUpload(e, "idCardBackImage")}
                              className="block w-full text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú</label>
                        <textarea
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          rows={3}
                          value={editingBooking.note || ""}
                          onChange={(e) => setEditingBooking({...editingBooking, note: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateBooking}
                        className="flex-1 rounded-lg bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600"
                      >
                        Lưu thay đổi
                      </button>
                      <button
                        onClick={() => setEditingBooking(null)}
                        className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Detail Modal */}
            {selectedBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedBooking(null)}>
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">Chi tiết booking</h3>
                      <p className="text-sm text-slate-500">Mã: {selectedBooking.bookingConfirmationCode}</p>
                    </div>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      Đóng
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <h4 className="font-bold text-slate-900">Thông tin khách</h4>
                      <div className="mt-2 grid gap-2 text-sm">
                        <p><span className="font-semibold">Họ tên:</span> {selectedBooking.guestName}</p>
                        <p><span className="font-semibold">Email:</span> {selectedBooking.guestEmail}</p>
                        <p><span className="font-semibold">SĐT:</span> {selectedBooking.guestPhone}</p>
                        <p><span className="font-semibold">Số người:</span> {selectedBooking.totalNumOfGuests} ({selectedBooking.numOfAdults} người lớn, {selectedBooking.numOfChildren} trẻ em)</p>
                        <p><span className="font-semibold">Phương tiện:</span> {selectedBooking.transportType}</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <h4 className="font-bold text-slate-900">Thông tin đặt phòng</h4>
                      <div className="mt-2 grid gap-2 text-sm">
                        <p><span className="font-semibold">Chi nhánh:</span> {selectedBooking.branchName}</p>
                        <p><span className="font-semibold">Phòng:</span> {selectedBooking.selectedRoomName}</p>
                        <p><span className="font-semibold">Ngày check-in:</span> {formatBookingDate(selectedBooking.checkInDate)}</p>
                        <p><span className="font-semibold">Nhãn ngày:</span> {selectedBooking.selectedDayLabel}</p>
                        <p><span className="font-semibold">Khung giờ:</span> {selectedBooking.selectedSlotTime}</p>
                        <p><span className="font-semibold">Giá:</span> <span className="text-lg font-bold text-green-600">{selectedBooking.selectedSlotPrice}</span></p>
                        <p><span className="font-semibold">Check-out:</span> {formatBookingDate(selectedBooking.checkOutDate)}</p>
                      </div>
                    </div>

                    {selectedBooking.note && (
                      <div className="rounded-xl bg-slate-50 p-4">
                        <h4 className="font-bold text-slate-900">Ghi chú</h4>
                        <p className="mt-2 text-sm text-slate-700">{selectedBooking.note}</p>
                      </div>
                    )}

                    {selectedBooking.discountCode && (
                      <div className="rounded-xl bg-slate-50 p-4">
                        <h4 className="font-bold text-slate-900">Mã giảm giá</h4>
                        <p className="mt-2 text-sm font-mono text-slate-700">{selectedBooking.discountCode}</p>
                      </div>
                    )}

                    <div className="rounded-xl bg-slate-50 p-4">
                      <h4 className="font-bold text-slate-900">Ảnh CCCD/CMND</h4>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Mặt trước</p>
                          {selectedBooking.idCardFrontImage ? (
                            <img
                              src={selectedBooking.idCardFrontImage}
                              alt="CCCD mặt trước"
                              className="h-44 w-full rounded-xl border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
                              Chưa có ảnh
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Mặt sau</p>
                          {selectedBooking.idCardBackImage ? (
                            <img
                              src={selectedBooking.idCardBackImage}
                              alt="CCCD mặt sau"
                              className="h-44 w-full rounded-xl border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
                              Chưa có ảnh
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDeleteBooking(selectedBooking.bookingId)}
                        className="flex-1 rounded-lg bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
                      >
                        Xóa booking này
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Terms & Services Settings */}
            <section className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="text-xl font-bold">Điều khoản và dịch vụ</h2>
              <p className="text-sm text-slate-500">Nội dung hiển thị ở trang công khai /dieu-khoan-dich-vu</p>

              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Tiêu đề trang</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-4 py-2"
                      value={legalForm.termsPageTitle}
                      onChange={(e) => setLegalForm((prev) => ({ ...prev, termsPageTitle: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Dòng mô tả ngắn</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-4 py-2"
                      value={legalForm.termsPageSubtitle}
                      onChange={(e) => setLegalForm((prev) => ({ ...prev, termsPageSubtitle: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Mở đầu trang</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                    rows={3}
                    value={legalForm.termsPageIntro}
                    onChange={(e) => setLegalForm((prev) => ({ ...prev, termsPageIntro: e.target.value }))}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Tiêu đề điều khoản</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-4 py-2"
                      value={legalForm.termsSectionTitle}
                      onChange={(e) => setLegalForm((prev) => ({ ...prev, termsSectionTitle: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Tiêu đề dịch vụ</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-4 py-2"
                      value={legalForm.servicesSectionTitle}
                      onChange={(e) => setLegalForm((prev) => ({ ...prev, servicesSectionTitle: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Nội dung điều khoản</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                    rows={5}
                    value={legalForm.termsSectionContent}
                    onChange={(e) => setLegalForm((prev) => ({ ...prev, termsSectionContent: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Nội dung dịch vụ</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                    rows={5}
                    value={legalForm.servicesSectionContent}
                    onChange={(e) => setLegalForm((prev) => ({ ...prev, servicesSectionContent: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Ghi chú cuối trang</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                    rows={3}
                    value={legalForm.termsPageNote}
                    onChange={(e) => setLegalForm((prev) => ({ ...prev, termsPageNote: e.target.value }))}
                  />
                </div>

                <button
                  onClick={handleSaveLegalContent}
                  className="rounded-lg bg-[#8b5e3c] px-6 py-2.5 font-semibold text-white transition hover:bg-[#734a2d]"
                >
                  Lưu điều khoản và dịch vụ
                </button>
              </div>
            </section>

            {/* Booking Settings */}
            <section className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="text-xl font-bold">Mã giảm giá</h2>
              <p className="text-sm text-slate-500">Áp dụng mã do admin quy định khi khách nhập đúng trên form đặt phòng</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Mã giảm giá</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                    value={promotionForm.discountCode}
                    onChange={(e) => setPromotionForm((prev) => ({ ...prev, discountCode: e.target.value.toUpperCase() }))}
                    placeholder="FIIN10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Phần trăm giảm</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                    value={promotionForm.discountPercent}
                    onChange={(e) => setPromotionForm((prev) => ({ ...prev, discountPercent: Number(e.target.value) }))}
                    placeholder="10"
                  />
                </div>
              </div>

              <button
                onClick={handleSavePromotion}
                className="mt-4 rounded-lg bg-[#8b5e3c] px-6 py-2.5 font-semibold text-white transition hover:bg-[#734a2d]"
              >
                Lưu mã giảm giá
              </button>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="text-xl font-bold">Cài đặt nhận booking</h2>
              <p className="text-sm text-slate-500">Bật/tắt chức năng đặt phòng trên website</p>
              
              <div className="mt-4 space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.acceptingBookings}
                    onChange={(e) => setSettings((prev) => ({ ...prev, acceptingBookings: e.target.checked }))}
                    className="h-5 w-5 rounded"
                  />
                  <span className="font-semibold">Đang nhận booking</span>
                </label>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Thông báo khi tắt booking
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                    placeholder="Ví dụ: Hệ thống tạm ngưng nhận booking"
                    value={settings.bookingNotice}
                    onChange={(e) => setSettings((prev) => ({ ...prev, bookingNotice: e.target.value }))}
                  />
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="rounded-lg bg-[#8b5e3c] px-6 py-2.5 font-semibold text-white transition hover:bg-[#734a2d]"
                >
                  Lưu cài đặt
                </button>
              </div>
            </section>

            {/* Footer Settings */}
            <section className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="text-xl font-bold">Cài đặt Footer</h2>
              <p className="text-sm text-slate-500">Thông tin hiển thị ở footer trang chủ</p>
              
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Hotline</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                    placeholder="1900 2026"
                    value={footerForm.hotline}
                    onChange={(e) => setFooterForm((prev) => ({ ...prev, hotline: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả footer</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                    rows={3}
                    placeholder="Mô tả ngắn về khách sạn"
                    value={footerForm.footerDescription}
                    onChange={(e) => setFooterForm((prev) => ({ ...prev, footerDescription: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tags (phân tách bằng |)</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-4 py-2"
                    placeholder="Khách sạn | Đặt phòng | Giá tốt"
                    value={footerForm.footerTagsText}
                    onChange={(e) => setFooterForm((prev) => ({ ...prev, footerTagsText: e.target.value }))}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-700">Footer Links</label>
                    <button
                      onClick={addFooterLinkRow}
                      className="rounded-lg bg-[#f0dfc9] px-3 py-1.5 text-sm font-semibold text-[#8b5e3c] transition hover:bg-[#e5c5a5]"
                    >
                      + Thêm link
                    </button>
                  </div>
                  <div className="space-y-3">
                    {footerForm.footerLinks.map((row, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
                          placeholder="Nhãn"
                          value={row.label}
                          onChange={(e) => updateFooterLinkRow(index, "label", e.target.value)}
                        />
                        <input
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
                          placeholder="URL"
                          value={row.url}
                          onChange={(e) => updateFooterLinkRow(index, "url", e.target.value)}
                        />
                        <button
                          onClick={() => removeFooterLinkRow(index)}
                          className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveFooter}
                  className="rounded-lg bg-[#8b5e3c] px-6 py-2.5 font-semibold text-white transition hover:bg-[#734a2d]"
                >
                  Lưu footer
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="space-y-6">
            <AdminChatPanel adminToken={token} />
          </div>
        )}
      </div>
    </main>
  );
}
