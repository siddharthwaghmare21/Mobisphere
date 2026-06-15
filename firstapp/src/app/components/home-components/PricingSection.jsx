import React from 'react'

const pricingPlans = [
  {
    title: 'Starter Pack',
    price: '₹699',
    subtitle: 'Best for first-time buyers',
    features: ['Affordable phone and charger bundle', 'Same-day Sangli pickup', 'Local support included'],
  },
  {
    title: 'Business Bundle',
    price: '₹1,299',
    subtitle: 'Perfect for frequent upgrade seekers',
    features: ['Premium accessory combo', 'Priority stock alerts', 'Express delivery'],
    featured: true,
  },
  {
    title: 'Premium Bundle',
    price: '₹2,499',
    subtitle: 'For customers who want the best',
    features: ['Top-tier smartphone package', 'Extended warranty support', 'Dedicated consultation'],
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="py-16 bg-slate-100">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Pricing plans</p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Simple plans for every mobile shopper.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Transparent pricing with clear benefits so you can choose the right package for your mobile purchase and accessories.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.title}
              className={`rounded-[2rem] border p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl ${
                plan.featured ? 'border-emerald-500 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-950'
              }`}
            >
              <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${plan.featured ? 'text-emerald-200' : 'text-emerald-600'}`}>
                {plan.title}
              </p>
              <p className="mt-5 text-4xl font-bold tracking-tight">{plan.price}</p>
              <p className={`mt-3 text-sm ${plan.featured ? 'text-slate-300' : 'text-slate-600'}`}>{plan.subtitle}</p>

              <ul className={`mt-8 space-y-3 text-sm leading-6 ${plan.featured ? 'text-slate-200' : 'text-slate-700'}`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                plan.featured ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300' : 'bg-slate-950 text-white hover:bg-slate-800'
              }`}>
                Choose plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
