"use client"

import React from "react"
import Link from "next/link"

export default function LastOrderStatus() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-2 sm:px-6">
      <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.2)]">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-700">Last order status</p>
        <p className="mt-2 text-sm leading-6 font-semibold text-slate-900">
          Your last order status will show up here (demo).
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/account"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          Account
        </Link>
        <Link
          href="/cart"
          className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          Cart
        </Link>
      </div>
    </section>
  )
}
