"use client"

import { Inter } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/common/Header";
import Footer from "@/app/components/common/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// टीप: Next.js App Router मध्ये "use client" वापरल्यावर metadata आणि viewport 
// चे नियम बदलतात, म्हणून आपण ते सुरक्षित ठेवले आहेत.

export default function RootLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + Shift + A दाबल्यावर थेट नवीन /admin पेजवर नेईल
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        router.push('/admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans dark:bg-slate-950 dark:text-slate-50">
        <Header />
        <main className="flex-1 pt-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}