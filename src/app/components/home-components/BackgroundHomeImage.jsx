import React from 'react'
import Link from 'next/link'

const heroStats = [
  { value: 'Same-day', label: 'Sangli pickup' },
  { value: 'Premium', label: 'phones & accessories' },
  { value: 'Trusted', label: 'local support' },
]

export default function BackgroundHomeImage() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 pt-28 text-white sm:pt-32">
      <div className="absolute inset-0 -z-20 bg-[url('/images/MobisphereHomeImage.jpeg')] bg-cover bg-center bg-no-repeat opacity-45" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.32),transparent_34%),linear-gradient(115deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.88)_48%,rgba(2,6,23,0.72)_100%)]" />
      <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-1/2 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="mx-auto grid min-h-[620px] max-w-screen-xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20">
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200 shadow-2xl backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
            Mobisphere premium store
          </div>

          <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Premium mobiles, trusted deals, and local support in one place.
          </h1>

          <p className="mt-6 max-w-2xl text-sm font-semibold leading-7 text-slate-200 sm:text-base lg:text-lg">
            Explore latest smartphones, accessories, offers, and fast Sangli pickup with a clean Mobisphere shopping experience.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/product"
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-7 py-4 text-sm font-black text-slate-950 shadow-2xl shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:bg-emerald-300"
            >
              Shop products
            </Link>
            <Link
              href="/enquiry"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-7 py-4 text-sm font-black text-white shadow-2xl backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              Send enquiry
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
            {heroStats.map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-2xl backdrop-blur">
                <p className="text-lg font-black text-white sm:text-2xl">{item.value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -inset-5 rounded-[3rem] bg-gradient-to-br from-emerald-400/25 via-white/10 to-blue-400/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-2xl">
            <div className="overflow-hidden rounded-[2.5rem] bg-slate-900">
              <img
                src="/images/IPhone 16 Pro Max.png"
                alt="Premium smartphone"
                className="h-[470px] w-full object-cover transition duration-700 hover:scale-105"
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white p-5 text-slate-950">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Featured</p>
                <p className="mt-2 text-xl font-black">iPhone deals</p>
              </div>
              <div className="rounded-3xl bg-emerald-400 p-5 text-slate-950">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/70">Support</p>
                <p className="mt-2 text-xl font-black">Store advice</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
