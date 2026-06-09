"use client"

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

const initialEnquiry = {
  fullName: '',
  email: '',
  mobileNumber: '',
  subject: '',
  message: '',
}

const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(value)

export default function EnquiryPage() {
  const [enquiry, setEnquiry] = useState(initialEnquiry)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field, value) => {
    setEnquiry((prev) => ({ ...prev, [field]: value }))
  }

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

    if (error) {
      setMessage('Something went wrong. Please try again.')
      return
    }

    setSubmitted(true)
    setMessage('Your enquiry has been submitted successfully!')
    setEnquiry(initialEnquiry)
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Service & Enquiry</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">Repairs along with mobile sales</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Screens, batteries, software issues, and accessories—book a repair slot or send a quick enquiry.
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