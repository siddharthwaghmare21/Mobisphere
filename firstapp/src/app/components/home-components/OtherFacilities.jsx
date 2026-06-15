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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* मोबाईल रिस्पॉन्सिव्हिटीसाठी grid-cols-1 आणि sm:grid-cols-2 केले */}
                    {cards.map((card) => (
                        <div key={card.title} className="flex h-full flex-col justify-center rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
                            {/* १. सेवेचे शीर्षक */}
                            <p className="text-sm sm:text-base md:text-lg font-semibold uppercase tracking-[0.2em] text-slate-950">
                                {card.title}
                            </p>

                            {/* २. सेवेचा तपशील (हा नवीन पॅराग्राफ आपण ॲड केला आहे) */}
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                                {card.detail}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
