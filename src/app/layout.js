import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/common/Header";
import Footer from "@/app/components/common/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Mobisphere Mobile Shop",
  description: "Shop the latest mobile phones, accessories, and get fast local support in Sangli with Mobisphere.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Header />
        <main className="flex-1 pt-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
