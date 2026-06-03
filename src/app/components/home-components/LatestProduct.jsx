import React from 'react'

const offers = [
    {
        title: 'iPhone 11 Pro Max Offer',
        image: '/images/IPhone 11 Pro Max.jpeg',
        subtitle: 'Special discount on classic flagship power',
    },
    {
        title: 'iPhone 12 Pro Max Offer',
        image: '/images/IPhone 12 Pro Max.jpeg',
        subtitle: 'Save on the Pro Max camera experience',
    },
    {
        title: 'iPhone 13 Pro Max Offer',
        image: '/images/IPhone 13 Pro Max.jpeg',
        subtitle: 'Limited-time deal on the A15 performance model',
    },
    {
        title: 'iPhone 14 Pro Max Offer',
        image: '/images/IPhone 14 Pro Max.jpeg',
        subtitle: 'Grab the advanced camera and safety features',
    },
    {
        title: 'iPhone 15 Pro Max Offer',
        image: '/images/IPhone 15 Pro Max.jpeg',
        subtitle: 'Premium design and speed at a great value',
    },
    {
        title: 'iPhone 16 Pro Max Offer',
        image: '/images/IPhone 16 Pro Max.png',
        subtitle: 'Latest flagship with cutting-edge performance',
    },
]

export default function LatestProduct() {
    return (
        <section id="products" className="bg-slate-100 py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Featured offers</p>
                            <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Exclusive iPhone offers</h2>
                        </div>
                        <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                            Browse our latest offers for the top iPhone Pro Max models, designed for both mobile and desktop users.
                        </p>
                    </div>

                    <div className="mt-10 grid grid-cols-2 gap-6">
                        {offers.map((offer) => (
                            <div key={offer.title} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
                                <div className="relative h-72 overflow-hidden bg-slate-900">
                                    <img
                                        src={offer.image}
                                        alt={offer.title}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 to-transparent px-5 py-5 text-white">
                                        <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Offer</p>
                                        <h3 className="mt-2 text-xl font-semibold">{offer.title}</h3>
                                        <p className="mt-2 text-sm text-slate-100/90">{offer.subtitle}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
