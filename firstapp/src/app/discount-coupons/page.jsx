"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_SESSION_KEY = 'mobisphereAdminSession'

function loadJson(key) {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function saveJson(key, value) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

const COUPONS_KEY = 'mobisphereCoupons'

const initialCoupon = {
  code: '',
  discountPercent: '20',
  expiresAt: '',
}

export default function DiscountCouponsPage() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [coupons, setCoupons] = useState([])

  const [form, setForm] = useState(initialCoupon)
  const [message, setMessage] = useState('')
  const [nowMs, setNowMs] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedSession = loadJson(ADMIN_SESSION_KEY)
    if (!storedSession) {
      router.replace('/admin-panel')
      return
    }
    const storedCoupons = loadJson(COUPONS_KEY)
    queueMicrotask(() => {
      setSession(storedSession)
      setCoupons(Array.isArray(storedCoupons) ? storedCoupons : [])
      setNowMs(Date.now())
    })
  }, [router])

  const normalizedCode = useMemo(() => form.code.trim().toUpperCase(), [form.code])
  const normalizedPercent = useMemo(() => {
    const n = Number(form.discountPercent)
    return Number.isFinite(n) ? n : 0
  }, [form.discountPercent])

  if (!session) return null

  const handleAddCoupon = () => {
    setMessage('')

    if (!normalizedCode) {
      setMessage('Enter a coupon code (e.g. FESTIVAL20).')
      return
    }

    if (normalizedPercent <= 0 || normalizedPercent > 90) {
      setMessage('Discount percent should be between 1 and 90.')
      return
    }

    if (!form.expiresAt) {
      setMessage('Set an expiration date for the coupon.')
      return
    }

    const expiry = new Date(form.expiresAt)
    if (Number.isNaN(expiry.getTime())) {
      setMessage('Expiration date is invalid.')
      return
    }

    const next = [
      {
        id: Date.now().toString(),
        code: normalizedCode,
        discountPercent: normalizedPercent,
        expiresAt: expiry.toISOString(),
        createdAt: new Date().toISOString(),
      },
      ...coupons,
    ]

    saveJson(COUPONS_KEY, next)
    setCoupons(next)
    setForm(initialCoupon)
    setMessage(`Coupon ${normalizedCode} added successfully.`)
  }

  const handleRemove = (id) => {
    const next = coupons.filter((c) => c.id !== id)
    saveJson(COUPONS_KEY, next)
    setCoupons(next)
    setMessage('Coupon removed.')
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Coupons & Discounts</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Discount Management</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
          Create coupon codes for festival season or offers. Example: FESTIVAL20 gives 20% discount until expiry.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{message}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Create a new coupon</h2>

          <div className="mt-6 grid gap-4">
            <label className="space-y-2 text-sm text-slate-700">
              <span>Coupon code</span>
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                placeholder="FESTIVAL20"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Discount percent</span>
              <input
                value={form.discountPercent}
                onChange={(e) => setForm((p) => ({ ...p, discountPercent: e.target.value }))}
                type="number"
                min={1}
                max={90}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Expiration date</span>
              <input
                value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                type="date"
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddCoupon}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Create Coupon
            </button>
            <button
              type="button"
              onClick={() => {
                setMessage('')
                setForm(initialCoupon)
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-50 p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Existing coupons</h2>
          <p className="mt-2 text-sm text-slate-600">Total: {coupons.length}</p>

          <div className="mt-6 space-y-4">
            {coupons.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700">No coupons added yet.</div>
            ) : (
              coupons.map((c) => {
                const expiry = new Date(c.expiresAt)
                const isExpired = nowMs > 0 && expiry.getTime() < nowMs
                return (
                  <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.code}</p>
                        <p className="mt-1 text-sm text-slate-700">{c.discountPercent}% off</p>
                        <p className="mt-1 text-xs text-slate-500">Expires: {expiry.toLocaleDateString()}</p>
                        {isExpired ? (
                          <p className="mt-2 text-xs font-semibold text-rose-600">Expired</p>
                        ) : (
                          <p className="mt-2 text-xs font-semibold text-emerald-600">Active</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(c.id)}
                        className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

