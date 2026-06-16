import React from 'react'

const features = [
  {
    icon: '🚚',
    title: 'Fast delivery',
    description: 'Same-day pickup in Sangli and fast delivery support for Mobisphere customers.',
  },
  {
    icon: '✅',
    title: 'Verified quality',
    description: 'Genuine mobiles and accessories checked before customer handover.',
  },
  {
    icon: '💬',
    title: 'Trusted support',
    description: 'Helpful product guidance, enquiry support, and after-sale assistance.',
  },
]

export default function BannerSection() {
  return (
    <section className="bg-white py-8 sm:py-10">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-[2rem] border border-slate-100 bg-slate-50 p-3 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.35)] sm:grid-cols-3 sm:p-4">
          {features.map((feature) => (
            <div key={feature.title} className="group rounded-[1.5rem] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xl text-white shadow-lg transition group-hover:bg-emerald-500 group-hover:text-slate-950">
                  {feature.icon}
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-950">{feature.title}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
