"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const ADMIN_PROFILE_KEY = 'mobisphereAdminProfile'
const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const CUSTOMER_STORAGE_KEY = 'mobisphereCustomers'

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

function removeJson(key) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

export default function AdminPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [customers, setCustomers] = useState([])
  const [mode, setMode] = useState('create')
  const [form, setForm] = useState({ userId: '', password: '', confirmPassword: '', displayName: '' })
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedProfile = loadJson(ADMIN_PROFILE_KEY)
    const storedSession = loadJson(ADMIN_SESSION_KEY)
    const storedCustomers = loadJson(CUSTOMER_STORAGE_KEY)

    setProfile(storedProfile)
    setSession(storedSession)
    setCustomers(Array.isArray(storedCustomers) ? storedCustomers : [])
    setMode(storedProfile ? 'login' : 'create')
  }, [])

  const saveCustomers = (nextCustomers) => {
    setCustomers(nextCustomers)
    saveJson(CUSTOMER_STORAGE_KEY, nextCustomers)
  }

  const saveProfile = (nextProfile) => {
    setProfile(nextProfile)
    saveJson(ADMIN_PROFILE_KEY, nextProfile)
  }

  const saveSession = (adminProfile) => {
    setSession(adminProfile)
    saveJson(ADMIN_SESSION_KEY, adminProfile)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mobisphereUserChanged'))
    }
  }

  const clearSession = () => {
    setSession(null)
    removeJson(ADMIN_SESSION_KEY)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mobisphereUserChanged'))
    }
  }

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateProfile = () => {
    setMessage('')
    if (!form.userId || !form.password || !form.confirmPassword || !form.displayName) {
      setMessage('Please complete all fields to create an admin profile.')
      return
    }
    if (form.password.length < 6) {
      setMessage('Password must be at least 6 characters long.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setMessage('Password and confirmation do not match.')
      return
    }

    const nextProfile = {
      userId: form.userId.trim(),
      displayName: form.displayName.trim(),
      password: form.password,
      createdAt: new Date().toISOString(),
    }

    saveProfile(nextProfile)
    setMessage('Admin profile created successfully. Please log in now.')
    setMode('login')
    setForm({ userId: '', password: '', confirmPassword: '', displayName: '' })
  }

  const handleLogin = () => {
    setMessage('')
    if (!profile) {
      setMessage('No admin profile found. Please create one first.')
      setMode('create')
      return
    }
    if (!form.userId || !form.password) {
      setMessage('Enter your user ID and password to log in.')
      return
    }
    if (form.userId.trim() !== profile.userId || form.password !== profile.password) {
      setMessage('Invalid admin user ID or password.')
      return
    }

    saveSession(profile)
    setMessage(`Welcome, ${profile.displayName}. You are now signed in as admin.`)
    setForm({ userId: '', password: '', confirmPassword: '', displayName: '' })
    router.push('/admin-panel')
  }

  const handleLogout = () => {
    clearSession()
    setMessage('Admin logged out.')
    setMode(profile ? 'login' : 'create')
  }

  const handleDeleteCustomer = (customerId) => {
    const nextCustomers = customers.filter((customer) => customer.id !== customerId)
    saveCustomers(nextCustomers)
    setMessage('Customer removed from the list.')
  }

  const handleClearCustomers = () => {
    saveCustomers([])
    setMessage('All customer records have been cleared.')
  }

  const handleRefreshCustomers = () => {
    const storedCustomers = loadJson(CUSTOMER_STORAGE_KEY)
    setCustomers(Array.isArray(storedCustomers) ? storedCustomers : [])
    setMessage('Customer list refreshed.')
  }

  const isLoggedIn = Boolean(session)

  const adminCountText = useMemo(() => {
    if (!profile) return 'No admin profile set'
    if (isLoggedIn) return `Signed in as ${profile.displayName}`
    return `Admin profile ready: ${profile.userId}`
  }, [profile, isLoggedIn])

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Admin access</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Admin panel login & controls
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Create an admin profile or log in with an existing admin ID. After login, you can manage registered customers.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900">
            {adminCountText}
          </div>
        </div>
      </div>

      {!isLoggedIn ? (
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="mb-6 flex flex-wrap gap-3">
              {profile ? (
                <>                  
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition ${mode === 'login' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('create')}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition ${mode === 'create' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Create Profile
                  </button>
                </>
              ) : (
                <span className="inline-flex rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">
                  Create your admin profile
                </span>
              )}
            </div>

            <div className="space-y-6">
              {mode === 'create' ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>User ID</span>
                      <input
                        value={form.userId}
                        onChange={(e) => handleFormChange('userId', e.target.value)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                        placeholder="Enter admin user ID"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Display Name</span>
                      <input
                        value={form.displayName}
                        onChange={(e) => handleFormChange('displayName', e.target.value)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                        placeholder="Admin name"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Password</span>
                      <input
                        value={form.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                        type="password"
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                        placeholder="Choose a password"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Confirm Password</span>
                      <input
                        value={form.confirmPassword}
                        onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                        type="password"
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                        placeholder="Confirm password"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateProfile}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Create Admin Profile
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>User ID</span>
                      <input
                        value={form.userId}
                        onChange={(e) => handleFormChange('userId', e.target.value)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                        placeholder="Enter admin user ID"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Password</span>
                      <input
                        value={form.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                        type="password"
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                        placeholder="Enter password"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Log In as Admin
                  </button>
                </div>
              )}

              {message && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {message}
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Admin guidance</p>
                <h2 className="mt-2 text-2xl font-semibold">Admin access control</h2>
              </div>
              <div>
                <p className="text-sm text-slate-300">Create a profile if you are a new admin. Existing admins can log in with their User ID and password.</p>
              </div>
            </div>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-300">
              <li>✔ Create a new admin profile with user ID and password</li>
              <li>✔ Log in to unlock the admin dashboard</li>
              <li>✔ Delete or clear customer records from local storage</li>
              <li>✔ Keep this page open while managing customer data</li>
            </ul>
          </aside>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Admin dashboard</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Welcome, {session.displayName}
                </h2>
                <p className="mt-3 text-sm text-slate-600">Manage your customer data directly from the admin page.</p>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <button
                  type="button"
                  onClick={handleRefreshCustomers}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Refresh List
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Customer management</h2>
                  <p className="mt-3 text-sm text-slate-600">View and manipulate currently registered customers stored in the browser.</p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCustomers}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Clear All Customers
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {customers.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                    No customer data available. Use the Menu page to create new customer records.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customers.map((customer) => (
                      <div key={customer.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{customer.fullName}</p>
                            <p className="text-sm">Mobile: {customer.mobileNumber}</p>
                            <p className="text-sm">Address: {customer.address}</p>
                            <p className="text-xs text-slate-500">Added on {new Date(customer.verifiedAt).toLocaleString()}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
              <div className="space-y-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Admin controls</p>
                  <h2 className="mt-2 text-2xl font-semibold">Manage data</h2>
                </div>
                <div className="space-y-4 text-sm leading-7 text-slate-300">
                  <p>Delete individual customer records using the Remove button.</p>
                  <p>Clear all stored customer data with the button above.</p>
                  <p>Refresh the list after changes to ensure the latest stored data is shown.</p>
                </div>
              </div>
            </aside>
          </div>

          {message && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {message}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
