import React from 'react'
import Link from 'next/link'

const offers = [
  {
    title: 'iPhone 11 Pro Max',
    image: '/images/IPhone 11 Pro Max.jpeg',
    subtitle: 'Classic flagship power with a strong value offer.',
  },
  {
    title: 'iPhone 12 Pro Max',
    image: '/images/IPhone 12 Pro Max.jpeg',
    subtitle: 'Pro Max camera experience with premium build quality.',
  },
  {
    title: 'iPhone 13 Pro Max',
    image: '/images/IPhone 13 Pro Max.jpeg',
    subtitle: 'Smooth performance and battery life for daily use.',
  },
  {
    title: 'iPhone 14 Pro Max',
    image: '/images/IPhone 14 Pro Max.jpeg',
    subtitle: 'Advanced camera, display, and safety features.',
  },
  {
    title: 'iPhone 15 Pro Max',
    image: '/images/IPhone 15 Pro Max.jpeg',
    subtitle: 'Premium speed and design with modern upgrades.',
  },
  {
    title: 'iPhone 16 Pro Max',
    image: '/images/IPhone 16 Pro Max.png',
    subtitle: 'Latest flagship performance and stunning display.',
  },
]

export default function LatestProduct() {
  return (
    <section id="products" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600 sm:text-xs">Featured products</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Exclusive iPhone offers</h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-500 sm:text-base">
              Premium product cards are used where they matter most — for mobile products and offers.
            </p>
          </div>
          <Link
            href="/product"
            className="inline-flex w-fit rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            View all products
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <article key={offer.title} className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="relative h-72 overflow-hidden bg-slate-100 sm:h-80">
                <img
                  src={offer.image}
                  alt={offer.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-lg backdrop-blur">
                  Offer
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-black text-slate-950">{offer.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{offer.subtitle}</p>
                <Link href="/product" className="mt-5 inline-flex text-sm font-black text-emerald-700 transition hover:text-emerald-600">
                  Explore product →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
