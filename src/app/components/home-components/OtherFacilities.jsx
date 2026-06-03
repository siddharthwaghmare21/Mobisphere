import React from 'react'

export default function OtherFacilities() {
    const cards = [
        { title: 'Free Shipping', detail: 'Fast delivery on every order across India.' },
        { title: '24/7 Support', detail: 'Always available to help with product questions and orders.' },
        { title: 'Money Back Guarantee', detail: 'Hassle-free returns on eligible devices and accessories.' },
        { title: 'Secure Payment', detail: 'Easy checkout with trusted payment methods.' },
        { title: 'Fast Local Pickup', detail: 'Collect your order quickly from our Sangli store.' },
        { title: 'Expert Consultation', detail: 'Advice from experienced mobile advisors.' },
    ]

    return (
        <section className="bg-slate-100 py-12">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-4">
                    {cards.map((card) => (
                        <div key={card.title} className="flex h-full items-center rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
                            <p className="text-sm sm:text-base md:text-lg font-semibold uppercase tracking-[0.28em] text-slate-950">
                                {card.title}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
