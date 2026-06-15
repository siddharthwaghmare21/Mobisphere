"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AccountPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('mobisphereLoggedIn')
    if (!stored) return
    queueMicrotask(() => {
      setUser(JSON.parse(stored))
    })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('mobisphereLoggedIn')
    setUser(null)
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] sm:p-10">
        <div className="mb-8 rounded-3xl bg-slate-950 p-8 text-white shadow-lg shadow-slate-900/20">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Mobisphere Account</p>
          <h1 className="mt-4 text-3xl font-semibold">My Account</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Access your account details, review your profile, and sign out securely.
          </p>
        </div>

        {user ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-900">
              <h2 className="text-xl font-semibold">Welcome back, {user.fullName}</h2>
              <p className="mt-2 text-sm text-slate-600">Your verified account information is shown below.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mobile</p>
                  <p className="mt-2 text-sm text-slate-900">{user.mobileNumber}</p>
                </div>
                <div className="sm:col-span-2 rounded-3xl bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Address</p>
                  <p className="mt-2 text-sm text-slate-900 whitespace-pre-line">{user.address}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Account verification</h3>
                <p className="mt-2 text-sm text-slate-600">Your account is verified and stored locally in your browser for this demo.</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-900">
            <h2 className="text-xl font-semibold">Use the combined Menu page</h2>
            <p className="mt-2 text-sm text-slate-600">Account management is now available directly on the Menu page.</p>
            <Link
              href="/menu"
              className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Go to Menu
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
