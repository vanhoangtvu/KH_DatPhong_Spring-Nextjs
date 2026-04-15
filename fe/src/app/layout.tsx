import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import CustomerChatWidget from "@/components/CustomerChatWidget";
import "./globals.css";

const beVietnamSans = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fiin Home | Đặt phòng khách sạn hiện đại",
  description:
    "Fiin Home - Hệ thống đặt phòng khách sạn hiện đại, tối ưu mobile với hiệu ứng chuyển động mượt mà.",
  icons: {
    icon: "/LOGO%20FIIN.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${beVietnamSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <CustomerChatWidget />
      </body>
    </html>
  );
}
