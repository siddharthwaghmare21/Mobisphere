"use client"

import React, { useEffect, useRef, useState } from 'react'

const slides = [
  {
    title: 'Amazing Deals',
    subtitle: 'Save big on top smartphones today',
    image: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=1080',
  },
  {
    title: 'Limited-Time Offers',
    subtitle: 'Hot prices on accessories and bundles',
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=1080',
  },
  {
    title: 'Great Value',
    subtitle: 'Premium phones with extra savings',
    image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=1080',
  },
  {
    title: 'Offer Zone',
    subtitle: 'Top deals on newest mobile launches',
    image: 'https://images.unsplash.com/photo-1592899677974-c466c4f5dc1b?auto=format&fit=crop&q=80&w=1080',
  },
  {
    title: 'Deal Spotlight',
    subtitle: 'Exclusive offers for loyal customers',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1080',
  },
  {
    title: 'Best Offers',
    subtitle: 'Discounts on flagship phones and accessories',
    image: 'https://images.unsplash.com/photo-1605236453806-6ff3685e22c8?auto=format&fit=crop&q=80&w=1080',
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
    if (delta > 0) {
      goToIndex(activeIndex - 1)
    } else {
      goToIndex(activeIndex + 1)
    }
  }

  return (
    <section className="bg-slate-950 py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Offers & Great Deals</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Hot offers banner</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Swipe or wait for the next deal to appear. We refresh images every few seconds so you never miss the latest offer.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm text-slate-100">
            <span className="text-emerald-300">Autoplay</span>
            <span className="text-slate-400">•</span>
            <span>Swipe friendly</span>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
        >
          <div className="relative h-[180px] sm:h-[280px] md:h-[360px] lg:h-[460px]">
            <img
              src={slides[activeIndex].image}
              alt={slides[activeIndex].title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-3 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
              <div className="max-w-full rounded-2xl border border-white/10 bg-slate-950/75 p-4 shadow-2xl backdrop-blur-xl sm:rounded-[1.5rem] sm:p-6 lg:max-w-3xl lg:p-8">
                <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300 sm:text-sm">{slides[activeIndex].title}</p>
                <h3 className="mt-1 text-lg font-semibold text-white sm:mt-3 sm:text-3xl lg:text-4xl">
                  {slides[activeIndex].subtitle}
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-300 sm:mt-3 sm:text-sm sm:leading-7 lg:text-base">
                  Grab the latest offer now before it changes. These deals are curated for customers looking for the best value in mobile shopping.
                </p>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute left-0 top-1/2 hidden -translate-y-1/2 px-2 sm:block">
            <button
              type="button"
              onClick={() => goToIndex(activeIndex - 1)}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white transition hover:bg-slate-900"
              aria-label="Previous offer"
            >
              ‹
            </button>
          </div>
          <div className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 px-2 sm:block">
            <button
              type="button"
              onClick={() => goToIndex(activeIndex + 1)}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white transition hover:bg-slate-900"
              aria-label="Next offer"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {slides.map((_, slideIndex) => (
            <button
              key={slideIndex}
              type="button"
              onClick={() => goToIndex(slideIndex)}
              className={`h-3 w-3 rounded-full transition ${slideIndex === activeIndex ? 'bg-emerald-300' : 'bg-white/40'}`}
              aria-label={`Go to slide ${slideIndex + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}