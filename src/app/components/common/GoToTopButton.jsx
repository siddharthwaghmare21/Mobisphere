"use client"

import React, { useEffect, useState } from "react"

export default function GoToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 350)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const goToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <button
      type="button"
      onClick={goToTop}
      aria-label="Go to top"
      className={`fixed bottom-5 right-4 z-[60] inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/95 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-slate-900/25 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-500 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 sm:bottom-7 sm:right-7 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-5 opacity-0"
      }`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-sm">
        ↑
      </span>
      <span className="hidden sm:inline">Go to Top</span>
      <span className="sm:hidden">Top</span>
    </button>
  )
}
