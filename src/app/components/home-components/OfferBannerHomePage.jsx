"use client"

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const slides = [
  {
    title: 'Flagship Festival',
    subtitle: 'Premium phones with Mobisphere offers',
    image: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=1080',
  },
  {
    title: 'Accessory Combo',
    subtitle: 'Upgrade your setup with useful add-ons',
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=1080',
  },
  {
    title: 'Great Value Picks',
    subtitle: 'Smart choices for daily performance',
    image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=1080',
  },
  {
    title: 'Offer Zone',
    subtitle: 'Deals curated for local customers',
    image: 'https://images.unsplash.com/photo-1592899677974-c466c4f5dc1b?auto=format&fit=crop&q=80&w=1080',
  },
]

export default function OfferBannerHomePage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef(null)
  const touchEndX = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [])

  const goToIndex = (index) => {
    setActiveIndex((index + slides.length) % slides.length)
  }

  const handlePointerDown = (event) => {
    touchStartX.current = event.clientX || event.touches?.[0]?.clientX
  }

  const handlePointerUp = (event) => {
    touchEndX.current = event.clientX || event.changedTouches?.[0]?.clientX
    const start = touchStartX.current
    const end = touchEndX.current
    if (start === null || end === null) return
    const delta = end - start
    if (Math.abs(delta) < 50) return
    goToIndex(delta > 0 ? activeIndex - 1 : activeIndex + 1)
  }

  const slide = slides[activeIndex]

  return (
    <section className="bg-slate-950 py-16 text-white sm:py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300 sm:text-xs">Offers & great deals</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Today’s Mobisphere spotlight</h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300 sm:text-base">
              Clean, premium offer banners for phones, accessories, and store bundles.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300" /> Auto sliding offers
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl sm:rounded-[3rem]"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
        >
          <div className="relative h-[360px] sm:h-[430px] lg:h-[520px]">
            <img src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-950/20" />
            <div className="absolute inset-0 flex items-end p-5 sm:p-8 lg:items-center lg:p-12">
              <div className="max-w-2xl rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300 sm:text-xs">{slide.title}</p>
                <h3 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">{slide.subtitle}</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
                  Explore active offers, product availability, and quick customer support from Mobisphere.
                </p>
                <Link
                  href="/product"
                  className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-300"
                >
                  Browse offers
                </Link>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => goToIndex(activeIndex - 1)}
            className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-2xl text-white backdrop-blur transition hover:bg-white hover:text-slate-950 sm:inline-flex"
            aria-label="Previous offer"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goToIndex(activeIndex + 1)}
            className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-2xl text-white backdrop-blur transition hover:bg-white hover:text-slate-950 sm:inline-flex"
            aria-label="Next offer"
          >
            ›
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {slides.map((_, slideIndex) => (
            <button
              key={slideIndex}
              type="button"
              onClick={() => goToIndex(slideIndex)}
              className={`h-2.5 rounded-full transition-all ${slideIndex === activeIndex ? 'w-9 bg-emerald-300' : 'w-2.5 bg-white/35 hover:bg-white/60'}`}
              aria-label={`Go to offer slide ${slideIndex + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
