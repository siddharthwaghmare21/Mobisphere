"use client"

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const initialEnquiry = { fullName: '', email: '', mobileNumber: '', subject: '', message: '' }
const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(value)
const loadJson = (key) => {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}
const saveJson = (key, value) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export default function EnquiryPage() {
  const [enquiry, setEnquiry] = useState(initialEnquiry)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { queueMicrotask(() => setSubmitted(false)) }, [])
  const handleChange = (field, value) => setEnquiry((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    setMessage('')
    if (!enquiry.fullName.trim() || !enquiry.email.trim() || !enquiry.mobileNumber.trim() || !enquiry.subject.trim() || !enquiry.message.trim()) {
      setMessage('Please fill in all enquiry fields before submitting.')
      return
    }
    if (!isValidIndianMobile(enquiry.mobileNumber.trim())) {
      setMessage('Mobile number must be a valid 10-digit Indian number.')
      return
    }

    try {
      const { error } = await supabase.from('enquiries').insert({
        id: Date.now().toString(),
        full_name: enquiry.fullName.trim(),
        email: enquiry.email.trim(),
        mobile_number: enquiry.mobileNumber.trim(),
        subject: enquiry.subject.trim(),
        message: enquiry.message.trim(),
        status: 'New',
        admin_note: '',
      })
      if (error) { setMessage('Something went wrong. Please try again.'); return }
      setSubmitted(true)
      setMessage('Your enquiry has been submitted successfully!')
      setEnquiry(initialEnquiry)
    } catch {
      const nextEnquiry = {
        id: Date.now().toString(),
        fullName: enquiry.fullName.trim(),
        email: enquiry.email.trim(),
        mobileNumber: enquiry.mobileNumber.trim(),
        subject: enquiry.subject.trim(),
        message: enquiry.message.trim(),
        status: 'New',
        adminNote: '',
        createdAt: new Date().toISOString(),
      }
      const stored = loadJson('mobisphereEnquiries')
      const nextList = Array.isArray(stored) ? [...stored, nextEnquiry] : [nextEnquiry]
      saveJson('mobisphereEnquiries', nextList)
      setSubmitted(true)
      setMessage('Your enquiry has been submitted. The admin can review and manage it from the admin panel.')
      setEnquiry(initialEnquiry)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-[2.2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Service & enquiry</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Tell us what you need. We&apos;ll guide you.</h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-400">Send product, repair, accessory, pricing or delivery questions directly to Mobisphere. Our admin team can complete your enquiry and notify you by email.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-black text-white">Popular support topics</p>
            <div className="mt-4 grid gap-2 text-xs font-bold text-slate-300">
              {['Screen replacement', 'Battery check', 'Product recommendation', 'Delivery support'].map((item) => <span key={item} className="rounded-full bg-slate-950/50 px-4 py-2">{item}</span>)}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="space-y-4">
          {[
            ['🔧', 'Repairs & service', 'Screens, batteries, charging, software and diagnostics.'],
            ['📱', 'Phone buying help', 'Tell us your budget and usage; we will suggest options.'],
            ['🎧', 'Accessories support', 'Cases, guards, chargers and daily mobile accessories.'],
          ].map(([icon, title, text]) => (
            <div key={title} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="text-3xl">{icon}</div>
              <h2 className="mt-4 text-xl font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{text}</p>
            </div>
          ))}
        </aside>

        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Enquiry form</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Send your request</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input value={enquiry.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Full name" />
            <input value={enquiry.email} onChange={(e) => handleChange('email', e.target.value)} type="email" className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Email address" />
            <input value={enquiry.mobileNumber} onChange={(e) => handleChange('mobileNumber', e.target.value)} type="tel" className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="10-digit Indian mobile" />
            <input value={enquiry.subject} onChange={(e) => handleChange('subject', e.target.value)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Subject" />
            <textarea value={enquiry.message} onChange={(e) => handleChange('message', e.target.value)} className="h-40 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:col-span-2" placeholder="Tell us how we can help" />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={handleSubmit} className="rounded-full bg-emerald-400 px-7 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-300">
              Submit enquiry
            </button>
            {submitted && <span className="text-sm font-bold text-emerald-700">Enquiry saved. Admins can now review it.</span>}
          </div>

          {message && <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700">{message}</div>}
        </section>
      </div>
    </main>
  )
}
