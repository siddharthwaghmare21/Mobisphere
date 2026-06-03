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

          <div className="mt-8 space-y-6 text-slate-700">
            <p className="text-lg leading-8">
              Mobisphere delivers a premium retail experience in Sangli with a focus on verified devices, trusted accessories, and responsive customer care.
            </p>
            <p className="text-sm leading-7 text-slate-600">
              With over 23 years of experience in the mobile retail industry, our team blends product expertise and local service to help every customer find the right mobile solution.
            </p>
          </div>
        </section>

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
