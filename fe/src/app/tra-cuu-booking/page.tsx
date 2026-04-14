import type { Metadata } from "next";
import BookingLookupClient from "./BookingLookupClient";

export const metadata: Metadata = {
  title: "Fiin Home | Tra cứu lịch đặt phòng",
  description: "Tra cứu lịch đặt phòng theo họ tên và số điện thoại.",
};

export default function BookingLookupPage() {
  return <BookingLookupClient />;
}