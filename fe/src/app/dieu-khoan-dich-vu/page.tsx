import type { Metadata } from "next";
import DieuKhoanDichVuClient from "./DieuKhoanDichVuClient";

export const metadata: Metadata = {
  title: "Fiin Home | Điều khoản và dịch vụ",
  description: "Trang điều khoản và dịch vụ của Fiin Home, có thể chỉnh sửa từ tab Cài đặt trong admin.",
};

export default function DieuKhoanDichVuPage() {
  return <DieuKhoanDichVuClient />;
}
