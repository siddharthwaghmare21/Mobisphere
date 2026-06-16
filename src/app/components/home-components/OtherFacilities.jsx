import React from 'react'

const cards = [
  { icon: '🚚', title: 'Free Shipping', detail: 'Fast delivery support on eligible orders across India.' },
  { icon: '🎧', title: 'Store Support', detail: 'Friendly guidance for products, orders, and enquiries.' },
  { icon: '↩️', title: 'Easy Assistance', detail: 'Helpful support for eligible return and service queries.' },
  { icon: '🔐', title: 'Secure Checkout', detail: 'Clean checkout flow with clear order summary.' },
  { icon: '📍', title: 'Fast Local Pickup', detail: 'Collect orders quickly from the Sangli store.' },
  { icon: '💡', title: 'Expert Consultation', detail: 'Practical phone advice from Mobisphere advisors.' },
]

export default function OtherFacilities() {
  return (
    <section className="bg-slate-950 py-16 text-white sm:py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300 sm:text-xs">Facilities</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Everything a mobile buyer needs</h2>
          <p className="mt-4 text-sm font-semibold leading-7 text-slate-400 sm:text-base">
            A simple service layer that makes shopping, pickup, support, and checkout feel professional.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="group rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.09]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-xl text-slate-950 shadow-xl transition group-hover:scale-105">
                {card.icon}
              </div>
              <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-white">{card.title}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">{card.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
