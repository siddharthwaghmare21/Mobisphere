import React from 'react'
import Link from 'next/link'

const pricingPlans = [
  {
    title: 'Starter Accessory Pack',
    price: '₹699',
    subtitle: 'For new smartphone users',
    features: ['Essential charger/accessory guidance', 'Same-day Sangli pickup support', 'Basic local support included'],
  },
  {
    title: 'Premium Protection Bundle',
    price: '₹1,299',
    subtitle: 'Most popular customer bundle',
    features: ['Accessory combo recommendation', 'Priority stock update', 'Screen protection support'],
    featured: true,
  },
  {
    title: 'Business / Bulk Support',
    price: 'Custom',
    subtitle: 'For multiple device requirements',
    features: ['Bulk order guidance', 'Dedicated consultation', 'Delivery and billing assistance'],
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600 sm:text-xs">Bundles & services</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Choose a support bundle</h2>
          <p className="mt-4 text-sm font-semibold leading-7 text-slate-500 sm:text-base">
            Instead of confusing pricing plans, Mobisphere shows practical bundles that fit mobile shoppers.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.title}
              className={`rounded-[2rem] border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl sm:p-7 ${
                plan.featured ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-100 bg-white text-slate-950'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${plan.featured ? 'text-emerald-300' : 'text-emerald-600'}`}>{plan.title}</p>
                  <p className="mt-4 text-4xl font-black tracking-tight">{plan.price}</p>
                </div>
                {plan.featured && (
                  <span className="rounded-full bg-emerald-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-950">Popular</span>
                )}
              </div>

              <p className={`mt-3 text-sm font-semibold leading-6 ${plan.featured ? 'text-slate-300' : 'text-slate-500'}`}>{plan.subtitle}</p>

              <ul className={`mt-7 space-y-3 text-sm font-semibold leading-6 ${plan.featured ? 'text-slate-200' : 'text-slate-600'}`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-black text-slate-950">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/enquiry"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-black transition ${
                  plan.featured ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300' : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}
              >
                Enquire now
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
