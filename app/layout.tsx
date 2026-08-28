import type { Metadata, Viewport } from "next";
import { Heebo, Assistant } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "S.O.M — ניהול הוצאות והכנסות",
  description: "אפליקציית ניהול הוצאות והכנסות לעצמאים",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/assets/icon-192.png",
    apple: "/assets/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2c1664",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${assistant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
