import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/common/Header";
import Footer from "@/app/components/common/Footer";
import ClientProviders from "@/app/components/common/ClientProviders";
import GoToTopButton from "@/app/components/common/GoToTopButton";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Mobisphere",
  description: "Premium mobile shop website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans dark:bg-slate-950 dark:text-slate-50">
        <ClientProviders>
          <Header />
          <main className="flex-1 pt-24">{children}</main>
          <Footer />
          <GoToTopButton />
        </ClientProviders>
      </body>
    </html>
  );
}
