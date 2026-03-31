import Link from "next/link";
import RoomSwipeShell from "@/components/RoomSwipeShell";
import RoomSwipeArea from "@/components/RoomSwipeArea";
import RoomDetailBookingPanel from "@/components/RoomDetailBookingPanel";

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type HomePageResponse = {
  roomLists: Record<string, { roomId: number; name: string }[]>;
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

export default async function RoomDetailPage({ params }: { params: { roomId: string } }) {
  const rawRoomParam = decodeURIComponent(params.roomId);
  let roomId = Number(rawRoomParam);

  if (Number.isNaN(roomId)) {
    const homeResponse = await fetch(`${API_BASE}/api/public/home-page`, { cache: "no-store" });
    if (homeResponse.ok) {
      const homeData = (await homeResponse.json()) as HomePageResponse;
      const allRooms = Object.values(homeData.roomLists).flat();
      const matched = allRooms.find((item) => slugify(item.name) === slugify(rawRoomParam));
      roomId = matched?.roomId ?? allRooms[0]?.roomId ?? NaN;
    }
  }

  if (Number.isNaN(roomId)) {
    return (
      <main className="min-h-screen bg-[#f4f5f7] px-4 py-8 text-[#25335a]">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-[#4f67b0]">Không tìm thấy phòng</h1>
          <p className="mt-2 text-sm text-slate-500">Chưa có phòng nào để hiển thị.</p>
          <Link href="/" className="mt-4 inline-flex rounded-full border border-[#cfe0ff] bg-white px-4 py-2 text-sm font-semibold text-[#4361af]">
            ← Quay lại trang chủ
          </Link>
        </div>
      </main>
    );
  }

  const response = await fetch(`${API_BASE}/api/public/rooms/${roomId}`, { cache: "no-store" });

  if (!response.ok) {
    return (
      <main className="min-h-screen bg-[#f4f5f7] px-4 py-8 text-[#25335a]">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-[#4f67b0]">Không tìm thấy phòng</h1>
          <p className="mt-2 text-sm text-slate-500">Phòng này chưa có trong dữ liệu hệ thống.</p>
          <Link href="/" className="mt-4 inline-flex rounded-full border border-[#cfe0ff] bg-white px-4 py-2 text-sm font-semibold text-[#4361af]">
            ← Quay lại trang chủ
          </Link>
        </div>
      </main>
    );
  }

  const room = (await response.json()) as RoomDetailResponse;
  const homeResponse = await fetch(`${API_BASE}/api/public/home-page`, { cache: "no-store" });
  const homeData: HomePageResponse | null = homeResponse.ok ? (await homeResponse.json()) as HomePageResponse : null;
  const allRooms = homeData ? Object.values(homeData.roomLists).flat() : [];
  const selectedBranchRooms = homeData?.roomLists[room.areaName] ?? [];
  const navigationRooms = allRooms.length > 1 ? allRooms : selectedBranchRooms;

  const currentIndex = navigationRooms.findIndex((item) => item.roomId === room.roomId);
  const previousRoom = currentIndex > 0 ? navigationRooms[currentIndex - 1] : navigationRooms[navigationRooms.length - 1];
  const nextRoom = currentIndex >= 0 && currentIndex < navigationRooms.length - 1 ? navigationRooms[currentIndex + 1] : navigationRooms[0];
  const previousHref = previousRoom ? `/room/${previousRoom.roomId}` : null;
  const nextHref = nextRoom ? `/room/${nextRoom.roomId}` : null;
  const gallery = [room.imageUrl, ...room.gallery].filter((value, index, arr) => value && arr.indexOf(value) === index);
  const embedUrl = getYoutubeEmbedUrl(room.videoUrl);
  const roomPriceLabel = typeof room.roomPrice === "number" ? room.roomPrice.toLocaleString("vi-VN") : String(room.roomPrice);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4f5f7_0%,#eef2ff_100%)] px-4 py-4 text-[#25335a] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <RoomSwipeShell
          previousHref={previousHref}
          nextHref={nextHref}
          previousLabel={previousRoom?.name ?? null}
          nextLabel={nextRoom?.name ?? null}
        >
          <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_50px_rgba(72,93,160,0.12)]">
            <div className="bg-[radial-gradient(circle_at_top_left,_rgba(67,97,175,0.18),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex rounded-full bg-[#d7e3ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4361af] sm:text-xs">
                    Chi tiết phòng
                  </div>
                  <h1 className="mt-2 text-2xl font-black leading-tight text-[#324a91] sm:text-4xl">
                    {room.displayName || room.roomType}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500 sm:text-base">Khu vực: {room.areaName}</p>
                </div>
                <Link href="/" className="rounded-full border border-[#cfe0ff] bg-white px-4 py-2 text-sm font-semibold text-[#4361af] shadow-sm">
                  ← Quay lại
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#eef3ff] px-3 py-1.5 text-xs font-semibold text-[#4361af]">{room.roomType}</span>
                <span className="rounded-full bg-[#eef3ff] px-3 py-1.5 text-xs font-semibold text-[#4361af]">{roomPriceLabel}</span>
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${room.booked ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>
                  {room.booked ? "Đã có booking" : "Còn nhận booking"}
                </span>
              </div>
            </div>
          </div>

          {room.description ? (
            <section className="rounded-[26px] bg-white/90 p-4 shadow-[0_10px_30px_rgba(70,98,172,0.06)] backdrop-blur-sm sm:p-5">
              <div className="text-base font-bold text-[#4f67b0] sm:text-lg">Mô tả chi tiết</div>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                {room.description}
              </p>
            </section>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <RoomSwipeArea
              previousHref={previousHref}
              nextHref={nextHref}
              previousLabel={previousRoom?.name ?? null}
              nextLabel={nextRoom?.name ?? null}
            >
            <div className="overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_16px_50px_rgba(72,93,160,0.15)] sm:p-4">
              <div className="overflow-hidden rounded-[24px] bg-slate-200">
                <div className="aspect-[16/11] bg-cover bg-center sm:aspect-[16/10]" style={{ backgroundImage: `url("${gallery[0]}")` }} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
                {gallery.slice(1, 4).map((img, index) => (
                  <div key={`${img}-${index}`} className="aspect-square overflow-hidden rounded-[16px] bg-slate-200 sm:rounded-[18px]">
                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${img}")` }} />
                  </div>
                ))}
              </div>

              {embedUrl ? (
                <div className="mt-4 overflow-hidden rounded-[22px] bg-black shadow-sm">
                  <iframe
                    className="aspect-video w-full"
                    src={embedUrl}
                    title={`Video ${room.displayName || room.roomType}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : room.videoUrl ? (
                <a
                  className="mt-4 block rounded-[18px] border border-[#cfe0ff] bg-[#eef3ff] px-4 py-3 text-sm font-semibold text-[#4361af] shadow-sm"
                  href={room.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở video của phòng
                </a>
              ) : null}
            </div>
            </RoomSwipeArea>

            <aside className="grid gap-4 sm:grid-cols-2 lg:block">
              <div className="rounded-[26px] bg-[#f8f9f5] p-4 shadow-[0_10px_30px_rgba(70,98,172,0.06)] sm:p-5">
                <div className="text-base font-bold text-[#4f67b0] sm:text-lg">Thông tin phòng</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-1">
                  <div className="rounded-2xl bg-white px-3 py-2 shadow-sm"><span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Loại phòng</span>{room.roomType}</div>
                  <div className="rounded-2xl bg-white px-3 py-2 shadow-sm"><span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tên hiển thị</span>{room.displayName || room.roomType}</div>
                  <div className="rounded-2xl bg-white px-3 py-2 shadow-sm"><span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Khu vực</span>{room.areaName}</div>
                  <div className="rounded-2xl bg-white px-3 py-2 shadow-sm"><span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Giá</span>{roomPriceLabel}</div>
                </div>
              </div>

              <div className="rounded-[26px] bg-white p-4 shadow-[0_10px_30px_rgba(70,98,172,0.06)] sm:p-5">
                <div className="text-base font-bold text-[#4f67b0] sm:text-lg">Tiện ích</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {room.features.length > 0 ? room.features.map((feature) => (
                    <span key={feature} className="rounded-full bg-[#dfe9ff] px-3 py-2 text-sm font-semibold text-[#4361af] shadow-sm">
                      {feature}
                    </span>
                  )) : <p className="text-sm text-slate-500">Chưa có tiện ích.</p>}
                </div>
              </div>

              <RoomDetailBookingPanel
                roomId={room.roomId}
                roomName={room.displayName || room.roomType}
                areaName={room.areaName}
                slots={room.slots}
              />
            </aside>
          </section>
        </RoomSwipeShell>
      </div>
    </main>
  );
}
