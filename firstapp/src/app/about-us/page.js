import React from 'react'

export default function AboutUs() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-10">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">About Mobisphere</h1>
            <p className="mt-4 text-lg font-semibold text-emerald-600">Siddharth Raju Waghmare</p>
            <p className="mt-2 text-sm uppercase tracking-[0.28em] text-slate-500">Chairman & Managing Director</p>
          </div>

          {/* Introduction */}
          <div className="mt-8 space-y-6 text-slate-700">
            <div className="rounded-[2rem] bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Introduction</p>
              <p className="mt-3 text-lg leading-8">
                Mobisphere started with a simple idea—make mobile shopping in Sangli trustworthy, fast, and helpful.
                From the beginning, we focused on verified devices, genuine accessories, and customer-first service.
              </p>
            </div>

            {/* Mission / Vision */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] bg-white p-6 border border-slate-200">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Mission</p>
                <p className="mt-3 text-base leading-7 text-slate-700">
                  Our goal is to provide customers with the best technology and service—phones that match your needs,
                  plus guidance you can rely on.
                </p>
              </div>
              <div className="rounded-[2rem] bg-white p-6 border border-slate-200">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Vision</p>
                <p className="mt-3 text-base leading-7 text-slate-700">
                  To be Sangli’s most trusted mobile partner for genuine products, transparent pricing, and quick local support.
                </p>
              </div>
            </div>

            {/* Values / Experience */}
            <div className="rounded-[2rem] bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">What we stand for</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                With over 23 years of experience in the mobile retail industry, our team blends product expertise and local service.
                We help you choose the right phone, set it up smoothly, and support you after purchase—because the sale is only the beginning.
              </p>
            </div>
          </div>
        </section>

        {/* Team/Owner info */}
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Team & Owner Info</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">Meet the team behind Mobisphere</h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 lg:col-span-2">
              <h3 className="text-xl font-semibold text-slate-900">Local expertise, personal support</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                We believe customers feel confident when they’re treated like people—not just transactions.
                Our owner and team bring hands-on knowledge to help you choose the right technology, accessories,
                and after-sales support.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Mobisphere is led by <span className="font-semibold text-slate-900">Siddharth Raju Waghmare</span>,
                with a strong commitment to genuine products and responsive service.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Core focus</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Verified stock</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Clear guidance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Quick support</span>
                </li>
              </ul>
              <div className="mt-6">
                <a
                  href="/enquiry"
                  className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Existing Contact & Location */}
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Contact & Location</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">Reach out to Mobisphere</h2>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-[2rem] bg-slate-50 p-8 text-slate-950">
              <h3 className="text-xl font-semibold">Contact details</h3>
              <div className="mt-6 space-y-6 text-sm leading-7 text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">Address</p>
                  <p>Near Sangli Municipal Corporation, Sangli, Maharashtra</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Phone</p>
                  <p>+91 72497 38821</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Email</p>
                  <p>support@mobisphere.com</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Hours</p>
                  <p>Mon - Sat, 10:00 AM - 10:00 PM</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
              <div className="bg-slate-950 px-6 py-5 text-white">
                <p className="text-sm uppercase tracking-[0.3em]">Visit us</p>
                <h3 className="mt-3 text-2xl font-semibold">Sangli store location</h3>
              </div>
              <iframe
                title="Mobisphere Sangli Location"
                src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d61094.935553644216!2d74.58410011673539!3d16.854438372008616!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1ssangli%20municipal%20corporation!5e0!3m2!1sen!2sin!4v1780394066872!5m2!1sen!2sin"
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

