"use client";

import React from 'react'

export default function EnquiryForm() {
    const openEnquireModel = () => {
        console.log('Enquiry model clicked')
    }

    return (
        <section id="contact" className="py-16 bg-slate-50">
            <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl sm:p-10">
                        <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Contact us</p>
                        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                            Have a question? We’re ready to help.
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                            Whether you need product advice, stock information, or fast local support, our team is available to guide you through every step.
                        </p>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-3xl bg-slate-800/70 p-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-100">Store address</p>
                                <p className="mt-3 text-sm leading-6 text-slate-300">
                                    Near Sangli Municipal Corporation, Sangli, Maharashtra.
                                </p>
                            </div>
                            <div className="rounded-3xl bg-slate-800/70 p-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-100">Phone</p>
                                <p className="mt-3 text-sm leading-6 text-slate-300">+91 72497 38821</p>
                            </div>
                            <div className="rounded-3xl bg-slate-800/70 p-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-100">Email</p>
                                <p className="mt-3 text-sm leading-6 text-slate-300">support@adhirajmobile.com</p>
                            </div>
                            <div className="rounded-3xl bg-slate-800/70 p-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-100">Hours</p>
                                <p className="mt-3 text-sm leading-6 text-slate-300">Mon - Sat, 10:00 AM - 10:00 PM</p>
                            </div>
                        </div>
                    </div>

                    <form className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
                        <h3 className="text-xl font-semibold text-slate-950">Send an enquiry</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Share your product questions and we’ll respond quickly with available stock, pricing, and support options.
                        </p>
                        <div className="mt-8 space-y-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                                    Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Your name"
                                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    rows={5}
                                    placeholder="Tell us what you need help with"
                                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={openEnquireModel}
                            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            Send enquiry
                        </button>
                    </form>
                </div>
            </div>
        </section>
    )
}
