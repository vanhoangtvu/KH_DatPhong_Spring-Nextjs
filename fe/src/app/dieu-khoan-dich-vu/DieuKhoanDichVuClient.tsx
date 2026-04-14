"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type HomePageResponse = {
  brandName: string;
  brandSubtitle: string;
  hotline: string;
  termsPageTitle: string;
  termsPageSubtitle: string;
  termsPageIntro: string;
  termsSectionTitle: string;
  termsSectionContent: string;
  servicesSectionTitle: string;
  servicesSectionContent: string;
  termsPageNote: string;
  footerDescription: string;
  footerTags: string[];
  footerLinks: string[];
  footerLinkUrls: string[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function DieuKhoanDichVuClient() {
  const router = useRouter();
  const [pageData, setPageData] = useState<HomePageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/public/home-page`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Không tải được nội dung điều khoản và dịch vụ.");
        }
        const data = (await response.json()) as HomePageResponse;
        setPageData(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Không tải được nội dung điều khoản và dịch vụ.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7f0e2_0%,#f1e2c8_55%,#ead5b5_100%)] px-4 py-10 text-[#6a4a2d]">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-[#e2c9ab] bg-[#fffaf2] p-6 shadow-[0_16px_50px_rgba(122,84,47,0.12)]">
          <p className="text-sm font-semibold text-[#8b5e3c]">Đang tải nội dung...</p>
        </div>
      </main>
    );
  }

  if (error || !pageData) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7f0e2_0%,#f1e2c8_55%,#ead5b5_100%)] px-4 py-10 text-[#6a4a2d]">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-[#e2c9ab] bg-[#fffaf2] p-6 shadow-[0_16px_50px_rgba(122,84,47,0.12)]">
          <h1 className="text-2xl font-black text-[#6b4a2d]">Điều khoản và dịch vụ</h1>
          <p className="mt-2 text-sm text-[#9c5c44]">{error ?? "Không có dữ liệu"}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={handleBack} className="inline-flex items-center gap-2 rounded-full bg-[#8b5e3c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#734a2d]">
              <ArrowLeft className="h-4 w-4" />
              Quay lại trang trước
            </button>
            <Link href="/" className="inline-flex rounded-full border border-[#e2c9ab] bg-white px-4 py-2 text-sm font-semibold text-[#8b5e3c] transition hover:bg-[#f0dfc9]">
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f0e2_0%,#f1e2c8_55%,#ead5b5_100%)] px-4 py-6 text-[#6a4a2d] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-[30px] border border-[#e2c9ab] bg-[#fffaf2]/95 p-5 shadow-[0_16px_50px_rgba(122,84,47,0.10)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold tracking-[0.08em] uppercase text-[#7e5331]">{pageData.brandName}</div>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#6b4a2d]">{pageData.termsPageTitle}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9c7450]">{pageData.termsPageSubtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleBack} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8b5e3c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#734a2d]">
                <ArrowLeft className="h-4 w-4" />
                Quay lại trang trước
              </button>
              <Link href="/" className="inline-flex items-center justify-center rounded-full border border-[#e2c9ab] bg-white px-4 py-2 text-sm font-semibold text-[#8b5e3c] transition hover:bg-[#f0dfc9]">
                Trang chủ
              </Link>
            </div>
          </div>
          <p className="mt-4 rounded-2xl bg-[#f0dfc9] px-4 py-3 text-sm leading-6 text-[#7e5331]">{pageData.termsPageIntro}</p>
        </header>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[28px] border border-[#e2c9ab] bg-white/85 p-6 shadow-[0_14px_40px_rgba(122,84,47,0.08)] backdrop-blur">
            <h2 className="text-2xl font-black text-[#6b4a2d]">{pageData.termsSectionTitle}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#7e5331]">{pageData.termsSectionContent}</p>
          </article>

          <article className="rounded-[28px] border border-[#e2c9ab] bg-white/85 p-6 shadow-[0_14px_40px_rgba(122,84,47,0.08)] backdrop-blur">
            <h2 className="text-2xl font-black text-[#6b4a2d]">{pageData.servicesSectionTitle}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#7e5331]">{pageData.servicesSectionContent}</p>
          </article>
        </section>

        <section className="mt-6 rounded-[28px] border border-[#e2c9ab] bg-[#fffaf2] p-6 shadow-[0_14px_40px_rgba(122,84,47,0.08)]">
          <h2 className="text-xl font-bold text-[#6b4a2d]">Liên hệ hỗ trợ</h2>
          <p className="mt-2 text-sm leading-6 text-[#9c7450]">{pageData.termsPageNote}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#7e5331]">
            <span className="rounded-full bg-[#f0dfc9] px-3 py-1 font-semibold">Hotline: {pageData.hotline}</span>
            {pageData.footerTags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full border border-[#e2c9ab] bg-white px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
