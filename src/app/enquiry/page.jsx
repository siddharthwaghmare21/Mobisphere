"use client"

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const initialEnquiry = {
  fullName: '',
  email: '',
  mobileNumber: '',
  subject: '',
  message: '',
}

const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(value)

const loadJson = (key) => {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

const saveJson = (key, value) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export default function EnquiryPage() {
  const [enquiry, setEnquiry] = useState(initialEnquiry)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setSubmitted(false))
  }, [])

  const handleChange = (field, value) => {
    setEnquiry((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setMessage('')

    if (
      !enquiry.fullName.trim() ||
      !enquiry.email.trim() ||
      !enquiry.mobileNumber.trim() ||
      !enquiry.subject.trim() ||
      !enquiry.message.trim()
    ) {
      setMessage('Please fill in all enquiry fields before submitting.')
      return
    }

    if (!isValidIndianMobile(enquiry.mobileNumber.trim())) {
      setMessage('Mobile number must be a valid 10-digit Indian number.')
      return
    }

    try {
      const { error } = await supabase.from('enquiries').insert({
        //id: Date.now().toString(),
        full_name: enquiry.fullName.trim(),
        email: enquiry.email.trim(),
        mobile_number: enquiry.mobileNumber.trim(),
        subject: enquiry.subject.trim(),
        message: enquiry.message.trim(),
        status: 'New',
        admin_note: '',
      })

      if (error) {
        setMessage('Something went wrong. Please try again.')
        return
      }

      setSubmitted(true)
      setMessage('Your enquiry has been submitted successfully!')
      setEnquiry(initialEnquiry)
    } catch {
      // If Supabase fails (or not configured), fall back to localStorage for the demo
      const nextEnquiry = {
        
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
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Service & Enquiry</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">Repairs along with mobile sales</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Screens, batteries, software issues, and accessories—book a repair slot or send a quick enquiry. Our team will follow up and update you.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-950">List of Services</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>• Screen replacement (LCD/Glass)</li>
              <li>• Battery change</li>
              <li>• Software updates & troubleshooting</li>
              <li>• Charging & power button issues</li>
              <li>• Diagnostics & preventive checks</li>
            </ul>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-950">Book an Appointment</h2>
            <p className="mt-3 text-sm text-slate-700">
              Use the form below to request a preferred time slot. We’ll confirm via your enquiry details.
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Tip: Mention your device model and issue in the Subject/Message.
            </p>
          </div>
        </div>


        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            <span>Name</span>
            <input
              value={enquiry.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              placeholder="Full Name"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            <span>Email</span>
            <input
              value={enquiry.email}
              onChange={(e) => handleChange('email', e.target.value)}
              type="email"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              placeholder="example@mail.com"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            <span>Mobile Number</span>
            <input
              value={enquiry.mobileNumber}
              onChange={(e) => handleChange('mobileNumber', e.target.value)}
              type="tel"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              placeholder="10-digit Indian mobile"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            <span>Subject</span>
            <input
              value={enquiry.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              placeholder="What is your enquiry about?"
            />
          </label>
          <label className="sm:col-span-2 space-y-2 text-sm text-slate-700">
            <span>Message</span>
            <textarea
              value={enquiry.message}
              onChange={(e) => handleChange('message', e.target.value)}
              className="h-40 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              placeholder="Tell us how we can help"
            />
          </label>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Submit Enquiry
          </button>
          {submitted && (
            <span className="self-center text-sm text-slate-700">Enquiry saved. Admins can now review it.</span>
          )}
        </div>

        {message && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {message}
          </div>
        )}
      </div>
    </section>
  )
}
