import React from 'react'
import Link from 'next/link'

const features = [
    {
        title: 'Fast delivery',
        description: 'Same-day pickup in Sangli and fast nationwide delivery for orders placed today.',
    },
    {
        title: 'Verified quality',
        description: 'Genuine phones and accessories with professional checks before dispatch.',
    },
    {
        title: 'Trusted support',
        description: 'Phone, email, and in-store support available throughout the week.',
    },
]

export default function BannerSection() {
    return (
        <section className="bg-slate-950 py-16">
            <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
                        <span className="inline-flex rounded-full bg-emerald-400/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                            Trusted mobile store
                        </span>
                        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                            Your reliable source for mobiles, accessories, and local service.
                        </h2>
                        <p className="mt-6 text-base leading-7 text-slate-200/80 sm:text-lg">
                            Mobisphere Mobile Shop brings a premium shopping experience to Sangli with professional product advice, verified stock, and easy support.
                        </p>
                        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Link
                                href="/product"
                                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                            >
                                Shop now
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                Contact support
                            </Link>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        {features.map((feature) => (
                            <div key={feature.title} className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
                                <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">{feature.title}</p>
                                <p className="mt-3 text-base leading-7 text-slate-700">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
