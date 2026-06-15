"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const initialSignupData = {
  fullName: '',
  password: '',
  mobileNumber: '',
  address: '',
}

const initialLoginData = {
  fullName: '',
  password: '',
  mobileNumber: '',
}

const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(value)

const isValidPassword = (value) => {
  const hasMinLength = value.length >= 8
  const hasNumber = /\d/.test(value)
  const hasSymbol = /[{}[\]:;.,.<>?~`|!"#$%&'()*+=\-/_^@]/.test(value)
  const hasLetter = /[a-z]/.test(value)
  const hasCapital = /[A-Z]/.test(value)
  return hasMinLength && hasNumber && hasSymbol && hasLetter && hasCapital
}

const getStoredAccounts = () => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('mobisphereCustomers') || '[]')
  } catch {
    return []
  }
}

const getStoredUser = () => {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem('mobisphereLoggedIn') || 'null')
  } catch {
    return null
  }
}

const saveAccounts = (accounts) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('mobisphereCustomers', JSON.stringify(accounts))
}

const saveLoggedInUser = (user) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('mobisphereLoggedIn', JSON.stringify(user))
  window.dispatchEvent(new Event('mobisphereUserChanged'))
}

const removeLoggedInUser = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('mobisphereLoggedIn')
  window.dispatchEvent(new Event('mobisphereUserChanged'))
}

const checkAdminAccount = (account) => {
  return account?.mobileNumber === '9999999999' || account?.fullName?.toLowerCase() === 'admin'
}

export default function MenuPage() {
  const router = useRouter()
  const [tab, setTab] = useState('signup')
  const [signupData, setSignupData] = useState(initialSignupData)
  const [loginData, setLoginData] = useState(initialLoginData)
  const [accounts, setAccounts] = useState([])
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const nextAccounts = getStoredAccounts()
    const nextUser = getStoredUser()
    queueMicrotask(() => {
      setAccounts(nextAccounts)
      setLoggedInUser(nextUser)
    })
  }, [])

  const handleSignupChange = (field, value) => {
    setSignupData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLoginChange = (field, value) => {
    setLoginData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignup = async () => {
    setMessage('')

    if (loggedInUser) {
      setMessage("You are already logged in to an active account.")
      return
    }

    if (!signupData.fullName.trim() || !signupData.password || !signupData.mobileNumber.trim() || !signupData.address.trim()) {
      setMessage('Please complete all fields before signing up.')
      return
    }

    if (!isValidPassword(signupData.password)) {
      setMessage('Password must be at least 8 characters long and contain at least one uppercase letter, lowercase letter, number, and symbol.')
      return
    }

    if (!isValidIndianMobile(signupData.mobileNumber.trim())) {
      setMessage('Mobile number must be a valid 10-digit Indian number.')
      return
    }

    setIsSubmitting(true)

    const normalizedMobile = signupData.mobileNumber.trim()
    const newAccount = {
      id: Date.now().toString(),
      fullName: signupData.fullName.trim(),
      password: signupData.password,
      mobileNumber: normalizedMobile,
      address: signupData.address.trim(),
      verifiedAt: new Date().toISOString(),
      isAdmin: checkAdminAccount({ fullName: signupData.fullName, mobileNumber: normalizedMobile }),
    }

    setAccounts((prev) => {
      const next = [...prev, newAccount]
      saveAccounts(next)
      return next
    })

    setLoggedInUser(newAccount)
    saveLoggedInUser(newAccount)
    setSignupData(initialSignupData)
    setMessage(`Account created successfully for ${newAccount.fullName}.`)
    setIsSubmitting(false)

    await supabase.from('customers').insert({
      id: newAccount.id,
      full_name: newAccount.fullName,
      mobile_number: newAccount.mobileNumber,
      address: newAccount.address,
      password: newAccount.password,
      is_admin: newAccount.isAdmin || false,
      verified_at: newAccount.verifiedAt,
    })

    router.push('/')
  }

  const handleLogin = () => {
    setMessage('')

    if (!loginData.fullName.trim() || !loginData.password || !loginData.mobileNumber.trim()) {
      setMessage('Please enter your name, password, and mobile number to login.')
      return
    }

    if (!isValidIndianMobile(loginData.mobileNumber.trim())) {
      setMessage('Please provide a valid 10-digit Indian mobile number to login.')
      return
    }

    const matchedAccount = accounts.find(
      (account) =>
        account.fullName.toLowerCase() === loginData.fullName.trim().toLowerCase() &&
        account.password === loginData.password &&
        account.mobileNumber === loginData.mobileNumber.trim()
    )

    if (!matchedAccount) {
      setMessage('No matching account found. Please check your details or sign up first.')
      return
    }

    setLoggedInUser(matchedAccount)
    saveLoggedInUser(matchedAccount)
    setMessage(`Welcome back, ${matchedAccount.fullName}!`)
    router.push('/')
  }

  const handleLogout = () => {
    setLoggedInUser(null)
    removeLoggedInUser()
    setMessage('You have been logged out.')
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Mobisphere account</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Login & Sign Up</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Create your account with name, password, mobile number, and address. The new account will appear on the admin page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`rounded-full px-5 py-3 text-sm font-medium transition ${tab === 'login' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            My Profile
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`rounded-full px-5 py-3 text-sm font-medium transition ${tab === 'signup' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Sign Up
          </button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
          {message && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {message}
            </div>
          )}

          {tab === 'signup' ? (
            loggedInUser ? (
              <div className="space-y-4 text-center py-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl">
                  ✓
                </div>
                <p className="text-base font-semibold text-slate-900">
                  You are already logged in to your account.
                </p>
                <p className="text-sm text-slate-500">
                  There is no need to create a new profile. You can continue shopping directly.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="mt-2 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Go to Home Page
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Name</span>
                    <input
                      value={signupData.fullName}
                      onChange={(e) => handleSignupChange('fullName', e.target.value)}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                      placeholder="Full Name"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Password</span>
                    <input
                      value={signupData.password}
                      onChange={(e) => handleSignupChange('password', e.target.value)}
                      type="password"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                      placeholder="Min 8 chars (1 uppercase, numbers & symbols)"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Mobile Number</span>
                    <input
                      value={signupData.mobileNumber}
                      onChange={(e) => handleSignupChange('mobileNumber', e.target.value)}
                      type="tel"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                      placeholder="10-digit Indian mobile"
                    />
                  </label>
                  <label className="sm:col-span-2 space-y-2 text-sm text-slate-700">
                    <span>Address</span>
                    <textarea
                      value={signupData.address}
                      onChange={(e) => handleSignupChange('address', e.target.value)}
                      className="h-28 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                      placeholder="Street, city, state, pincode"
                    />
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSignup}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Name</span>
                  <input
                    value={loginData.fullName}
                    onChange={(e) => handleLoginChange('fullName', e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Full Name"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Password</span>
                  <input
                    value={loginData.password}
                    onChange={(e) => handleLoginChange('password', e.target.value)}
                    type="password"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Password"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Mobile Number</span>
                  <input
                    value={loginData.mobileNumber}
                    onChange={(e) => handleLoginChange('mobileNumber', e.target.value)}
                    type="tel"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="10-digit Indian mobile"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Log in
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Registered customers</p>
                <p className="mt-3 text-5xl font-semibold">{accounts.length}</p>
                <p className="mt-2 text-sm text-slate-400">people already registered on Mobisphere</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Why create an account?</p>
                <h2 className="mt-2 text-2xl font-semibold">Secure account access</h2>
              </div>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-slate-300 mt-4">
              <li>• Save your details locally for this demo</li>
              <li>• Login with name, password, and mobile number</li>
              <li>• Accounts appear on the admin page automatically</li>
              <li>• No email verification is required for new customers</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">My Account</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">Account details on this page</h2>
          <p className="mt-2 text-sm text-slate-600">After signing up or logging in, your profile details appear below.</p>
        </div>

        {loggedInUser ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-900">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Name</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{loggedInUser.fullName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mobile</p>
                  <p className="mt-2 text-sm text-slate-900">{loggedInUser.mobileNumber}</p>
                </div>
                <div className="sm:col-span-2 rounded-3xl bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Address</p>
                  <p className="mt-2 text-sm text-slate-900 whitespace-pre-line">{loggedInUser.address}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-900">
            <p className="text-sm text-slate-600">Sign up or log in above to access your profile details directly on this page.</p>
          </div>
        )}
      </div>

      <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
        <h2 className="text-lg font-semibold text-slate-900">Account guide</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-900">Sign up</p>
            <p>Enter full name, password (min 8 chars, 1 uppercase, lowercase, numbers & symbols), mobile number, and address, then click Sign up to create your account.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Login</p>
            <p>Use your name, password, and mobile number to access your account.</p>
          </div>
        </div>
      </div>
    </section>
  )
}