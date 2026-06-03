import React from 'react'
import Link from 'next/link'

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Contact page</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">Contact details moved</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            The About page now includes our full contact and location information in one place.
          </p>
        </div>

        <div className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">All contact details are now on the About page.</p>
          <Link
            href="/about-us"
            className="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View About & Contact Info
          </Link>
        </div>
      </div>
    </main>
  )
}
