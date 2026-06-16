"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CUSTOMER_STORAGE_KEY = 'mobisphereCustomers'
const LOGGED_IN_USER_KEY = 'mobisphereLoggedIn'

const initialSignupData = {
  fullName: '',
  email: '',
  password: '',
  mobileNumber: '',
  address: '',
}

const initialLoginData = {
  email: '',
  password: '',
  mobileNumber: '',
}

const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(value)

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const isValidPassword = (value) => {
  const hasMinLength = value.length >= 8
  const hasNumber = /\d/.test(value)
  const hasSymbol = /[{}[\]:;.,.<>?~`|!"#$%&'()*+=\-/_^@]/.test(value)
  const hasLetter = /[a-z]/.test(value)
  const hasCapital = /[A-Z]/.test(value)
  return hasMinLength && hasNumber && hasSymbol && hasLetter && hasCapital
}

const getSiteOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return 'http://localhost:3000'
}

const getMenuRedirectUrl = () => `${getSiteOrigin()}/menu`

const isEmailVerified = (user) => Boolean(user?.email_confirmed_at || user?.confirmed_at)

const getReadableAuthError = (error) => {
  const message = String(error?.message || '')
  const lower = message.toLowerCase()

  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    return 'Please verify your email first. Check your inbox and click the Mobisphere verification link.'
  }

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password.'
  }

  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'This email is already registered. Please login or resend the verification email.'
  }

  return message || 'Authentication failed. Please try again.'
}

const getStoredAccounts = () => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

const getStoredUser = () => {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(LOGGED_IN_USER_KEY) || 'null')
  } catch {
    return null
  }
}

const saveAccounts = (accounts) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(accounts))
}

const saveLoggedInUser = (user) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('mobisphereUserChanged'))
}

const removeLoggedInUser = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LOGGED_IN_USER_KEY)
  window.dispatchEvent(new Event('mobisphereUserChanged'))
}

const buildCustomerFromAuth = (authUser, fallback = {}) => {
  const metadata = authUser?.user_metadata || {}

  return {
    id: fallback.id || authUser?.id || Date.now().toString(),
    authUserId: authUser?.id || fallback.authUserId || '',
    fullName: fallback.fullName || metadata.full_name || 'Mobisphere Customer',
    email: fallback.email || authUser?.email || metadata.email || '',
    mobileNumber: fallback.mobileNumber || metadata.mobile_number || '',
    address: fallback.address || metadata.address || '',
    verifiedAt: authUser?.email_confirmed_at || authUser?.confirmed_at || fallback.verifiedAt || new Date().toISOString(),
    isAdmin: false,
  }
}

const saveCustomerToSupabase = async (customer) => {
  if (!customer?.email) return

  const row = {
    id: customer.id,
    auth_user_id: customer.authUserId || customer.id,
    full_name: customer.fullName,
    email: customer.email,
    mobile_number: customer.mobileNumber,
    address: customer.address,
    is_admin: false,
    verified_at: customer.verifiedAt || null,
    email_verified_at: customer.verifiedAt || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('customers')
    .upsert(row, { onConflict: 'id' })

  if (error) throw error
}

const fetchCustomerProfile = async (authUser) => {
  if (!authUser?.id && !authUser?.email) return null

  const byAuthId = authUser?.id
    ? await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle()
    : { data: null, error: null }

  if (byAuthId.error) throw byAuthId.error
  if (byAuthId.data) return byAuthId.data

  const byEmail = authUser?.email
    ? await supabase
        .from('customers')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle()
    : { data: null, error: null }

  if (byEmail.error) throw byEmail.error
  return byEmail.data || null
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
    let isMounted = true

    const loadUser = async () => {
      const nextAccounts = getStoredAccounts()
      const nextUser = getStoredUser()

      setAccounts(nextAccounts)
      setLoggedInUser(nextUser)

      try {
        const { data } = await supabase.auth.getSession()
        const authUser = data?.session?.user

        if (!authUser) return

        if (!isEmailVerified(authUser)) {
          await supabase.auth.signOut()
          removeLoggedInUser()
          if (isMounted) {
            setLoggedInUser(null)
            setMessage('Please verify your email first. Check your inbox for the Mobisphere verification link.')
          }
          return
        }

        const customerRow = await fetchCustomerProfile(authUser)
        const customer = buildCustomerFromAuth(authUser, {
          id: customerRow?.id || authUser.id,
          authUserId: customerRow?.auth_user_id || authUser.id,
          fullName: customerRow?.full_name,
          email: customerRow?.email,
          mobileNumber: customerRow?.mobile_number,
          address: customerRow?.address,
          verifiedAt: customerRow?.email_verified_at || customerRow?.verified_at,
        })

        await saveCustomerToSupabase(customer)

        if (isMounted) {
          setLoggedInUser(customer)
          saveLoggedInUser(customer)
        }
      } catch (error) {
        console.error('Customer session check error:', error)
      }
    }

    queueMicrotask(loadUser)

    return () => {
      isMounted = false
    }
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
      setMessage('You are already logged in to an active verified account.')
      return
    }

    const fullName = signupData.fullName.trim()
    const email = signupData.email.trim().toLowerCase()
    const mobileNumber = signupData.mobileNumber.trim()
    const address = signupData.address.trim()

    if (!fullName || !email || !signupData.password || !mobileNumber || !address) {
      setMessage('Please complete all fields before signing up.')
      return
    }

    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address.')
      return
    }

    if (!isValidPassword(signupData.password)) {
      setMessage('Password must be at least 8 characters long and contain at least one uppercase letter, lowercase letter, number, and symbol.')
      return
    }

    if (!isValidIndianMobile(mobileNumber)) {
      setMessage('Mobile number must be a valid 10-digit Indian number.')
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: signupData.password,
        options: {
          emailRedirectTo: getMenuRedirectUrl(),
          data: {
            full_name: fullName,
            mobile_number: mobileNumber,
            address,
            role: 'customer',
          },
        },
      })

      if (error) throw error

      const authUser = data?.user

      const pendingCustomer = {
        id: authUser?.id || Date.now().toString(),
        authUserId: authUser?.id || '',
        fullName,
        email,
        mobileNumber,
        address,
        verifiedAt: null,
        emailVerified: false,
        isAdmin: false,
      }

      setAccounts((prev) => {
        const withoutDuplicate = prev.filter((account) => String(account.email || '').toLowerCase() !== email)
        const next = [...withoutDuplicate, pendingCustomer]
        saveAccounts(next)
        return next
      })

      try {
        await saveCustomerToSupabase(pendingCustomer)
      } catch (profileError) {
        console.error('Customer profile save error:', profileError)
      }

      await supabase.auth.signOut()
      removeLoggedInUser()
      setLoggedInUser(null)
      setSignupData(initialSignupData)
      setTab('login')
      setMessage(`✅ Verification link sent to ${email}. Please verify your email, then login.`)
    } catch (error) {
      console.error('Customer signup error:', error)
      setMessage(getReadableAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async () => {
    setMessage('')

    const email = loginData.email.trim().toLowerCase()
    const mobileNumber = loginData.mobileNumber.trim()

    if (!email || !loginData.password || !mobileNumber) {
      setMessage('Please enter your email, password, and mobile number to login.')
      return
    }

    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address.')
      return
    }

    if (!isValidIndianMobile(mobileNumber)) {
      setMessage('Please provide a valid 10-digit Indian mobile number to login.')
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: loginData.password,
      })

      if (error) throw error

      const authUser = data?.user

      if (!authUser?.id) {
        setMessage('Login failed. Please try again.')
        return
      }

      if (!isEmailVerified(authUser)) {
        await supabase.auth.signOut()
        removeLoggedInUser()
        setMessage('Please verify your email first. Check your inbox for the Mobisphere verification link.')
        return
      }

      const customerRow = await fetchCustomerProfile(authUser)
      const customer = buildCustomerFromAuth(authUser, {
        id: customerRow?.id || authUser.id,
        authUserId: customerRow?.auth_user_id || authUser.id,
        fullName: customerRow?.full_name,
        email: customerRow?.email || email,
        mobileNumber: customerRow?.mobile_number || mobileNumber,
        address: customerRow?.address,
        verifiedAt: customerRow?.email_verified_at || customerRow?.verified_at || authUser.email_confirmed_at || authUser.confirmed_at,
      })

      if (customer.mobileNumber && customer.mobileNumber !== mobileNumber) {
        await supabase.auth.signOut()
        removeLoggedInUser()
        setMessage('Mobile number does not match this email account.')
        return
      }

      await saveCustomerToSupabase({
        ...customer,
        mobileNumber,
        verifiedAt: authUser.email_confirmed_at || authUser.confirmed_at || customer.verifiedAt,
      })

      const verifiedCustomer = {
        ...customer,
        mobileNumber,
        verifiedAt: authUser.email_confirmed_at || authUser.confirmed_at || customer.verifiedAt,
        emailVerified: true,
      }

      setAccounts((prev) => {
        const withoutDuplicate = prev.filter((account) => String(account.email || '').toLowerCase() !== email)
        const next = [...withoutDuplicate, verifiedCustomer]
        saveAccounts(next)
        return next
      })

      setLoggedInUser(verifiedCustomer)
      saveLoggedInUser(verifiedCustomer)
      setLoginData(initialLoginData)
      setMessage(`Welcome back, ${verifiedCustomer.fullName}!`)
      router.push('/')
    } catch (error) {
      console.error('Customer login error:', error)
      setMessage(getReadableAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendVerification = async () => {
    const email = (tab === 'signup' ? signupData.email : loginData.email).trim().toLowerCase()

    if (!email || !isValidEmail(email)) {
      setMessage('Enter your email first, then click resend verification email.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: getMenuRedirectUrl(),
        },
      })

      if (error) throw error

      setMessage(`✅ Verification link resent to ${email}. Check your inbox.`)
    } catch (error) {
      console.error('Customer verification resend error:', error)
      setMessage(getReadableAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Customer logout error:', error)
    }

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
            Create your account with email verification. You can login only after confirming your email from your inbox.
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
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              {message}
            </div>
          )}

          {tab === 'signup' ? (
            loggedInUser ? (
              <div className="space-y-4 py-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-600">
                  ✓
                </div>
                <p className="text-base font-semibold text-slate-900">You are already logged in to your verified account.</p>
                <p className="text-sm text-slate-500">There is no need to create a new profile. You can continue shopping directly.</p>
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
                    <span>Email</span>
                    <input
                      value={signupData.email}
                      onChange={(e) => handleSignupChange('email', e.target.value)}
                      type="email"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                      placeholder="you@example.com"
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Password</span>
                    <input
                      value={signupData.password}
                      onChange={(e) => handleSignupChange('password', e.target.value)}
                      type="password"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                      placeholder="Min 8 chars (A-z, 0-9, symbol)"
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

                  <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
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
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSubmitting ? 'Sending verification...' : 'Sign up & verify email'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    Resend verification email
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Email</span>
                  <input
                    value={loginData.email}
                    onChange={(e) => handleLoginChange('email', e.target.value)}
                    type="email"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="you@example.com"
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
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? 'Checking...' : 'Log in'}
                </button>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  Resend verification email
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
                <p className="mt-2 text-sm text-slate-400">people registered on Mobisphere</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Account security</p>
                <h2 className="mt-2 text-2xl font-semibold">Email verification required</h2>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              <li>• Signup sends a verification link to email</li>
              <li>• Login works only after email confirmation</li>
              <li>• Verified accounts are saved in Supabase customers</li>
              <li>• Password is handled by Supabase Auth</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">My Account</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">Account details on this page</h2>
          <p className="mt-2 text-sm text-slate-600">After email verification and login, your profile details appear below.</p>
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
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Email</p>
                  <p className="mt-2 text-sm text-slate-900">{loggedInUser.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mobile</p>
                  <p className="mt-2 text-sm text-slate-900">{loggedInUser.mobileNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Verification</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-700">Email verified ✓</p>
                </div>
                <div className="rounded-3xl bg-white p-4 shadow-sm sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Address</p>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-900">{loggedInUser.address}</p>
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
            <p className="text-sm text-slate-600">Sign up, verify your email, and log in above to access your profile details.</p>
          </div>
        )}
      </div>

      <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
        <h2 className="text-lg font-semibold text-slate-900">Account guide</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-900">Sign up</p>
            <p>Enter full name, email, password, mobile number, and address. Click the verification link sent to your inbox.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Login</p>
            <p>After verification, use your email, password, and mobile number to access your account.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
