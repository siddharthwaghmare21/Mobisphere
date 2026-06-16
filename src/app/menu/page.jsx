"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const initialSignupData = { fullName: '', password: '', mobileNumber: '', address: '' }
const initialLoginData = { fullName: '', password: '', mobileNumber: '' }

const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(value)
const isValidPassword = (value) => value.length >= 8 && /\d/.test(value) && /[{}[\]:;.,.<>?~`|!"#$%&'()*+=\-/_^@]/.test(value) && /[a-z]/.test(value) && /[A-Z]/.test(value)

const getStoredAccounts = () => {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('mobisphereCustomers') || '[]') } catch { return [] }
}
const getStoredUser = () => {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('mobisphereLoggedIn') || 'null') } catch { return null }
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
const checkAdminAccount = (account) => account?.mobileNumber === '9999999999' || account?.fullName?.toLowerCase() === 'admin'

export default function MenuPage() {
  const router = useRouter()
  const [tab, setTab] = useState('login')
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
      setTab(nextUser ? 'profile' : 'login')
    })
  }, [])

  const handleSignupChange = (field, value) => setSignupData((prev) => ({ ...prev, [field]: value }))
  const handleLoginChange = (field, value) => setLoginData((prev) => ({ ...prev, [field]: value }))

  const handleSignup = async () => {
    setMessage('')
    if (loggedInUser) { setMessage('You are already logged in to an active account.'); return }
    if (!signupData.fullName.trim() || !signupData.password || !signupData.mobileNumber.trim() || !signupData.address.trim()) { setMessage('Please complete all fields before signing up.'); return }
    if (!isValidPassword(signupData.password)) { setMessage('Password must be at least 8 characters long and contain uppercase, lowercase, number, and symbol.'); return }
    if (!isValidIndianMobile(signupData.mobileNumber.trim())) { setMessage('Mobile number must be a valid 10-digit Indian number.'); return }

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
    const nextAccounts = [...accounts, newAccount]
    setAccounts(nextAccounts)
    saveAccounts(nextAccounts)
    setLoggedInUser(newAccount)
    saveLoggedInUser(newAccount)
    setSignupData(initialSignupData)
    setTab('profile')
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
  }

  const handleLogin = () => {
    setMessage('')
    if (!loginData.fullName.trim() || !loginData.password || !loginData.mobileNumber.trim()) { setMessage('Please enter your name, password, and mobile number to login.'); return }
    if (!isValidIndianMobile(loginData.mobileNumber.trim())) { setMessage('Please provide a valid 10-digit Indian mobile number to login.'); return }

    const matchedAccount = accounts.find((account) =>
      account.fullName.toLowerCase() === loginData.fullName.trim().toLowerCase() &&
      account.password === loginData.password &&
      account.mobileNumber === loginData.mobileNumber.trim()
    )

    if (!matchedAccount) { setMessage('No matching account found. Please check your details or sign up first.'); return }
    setLoggedInUser(matchedAccount)
    saveLoggedInUser(matchedAccount)
    setTab('profile')
    setMessage(`Welcome back, ${matchedAccount.fullName}!`)
  }

  const handleLogout = () => {
    setLoggedInUser(null)
    removeLoggedInUser()
    setTab('login')
    setMessage('You have been logged out.')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-[2.2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Mobisphere account</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Your profile dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-400">Login, save delivery information, and manage your Mobisphere shopping flow from one clean space.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-full border border-white/10 bg-white/10 p-1.5 backdrop-blur">
            {[
              ['login', 'Login'],
              ['signup', 'Sign up'],
              ['profile', 'Profile'],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-4 py-2.5 text-xs font-black uppercase tracking-wider transition ${tab === id ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
          {message && <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700">{message}</div>}

          {tab === 'profile' ? (
            loggedInUser ? (
              <div>
                <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-400 text-2xl font-black text-slate-950">{loggedInUser.fullName?.charAt(0) || 'M'}</div>
                  <h2 className="mt-5 text-3xl font-black">Welcome, {loggedInUser.fullName}</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-400">Your account is ready for faster checkout.</p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Mobile</p><p className="mt-2 font-black text-slate-950">{loggedInUser.mobileNumber}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Verified at</p><p className="mt-2 font-black text-slate-950">{loggedInUser.verifiedAt ? new Date(loggedInUser.verifiedAt).toLocaleDateString() : 'Saved'}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-5 sm:col-span-2"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Address</p><p className="mt-2 font-bold text-slate-700">{loggedInUser.address || 'Not saved'}</p></div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={() => router.push('/product')} className="rounded-full bg-emerald-400 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-300">Shop products</button>
                  <button type="button" onClick={() => router.push('/cart')} className="rounded-full bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:-translate-y-1 hover:bg-slate-800">Open cart</button>
                  <button type="button" onClick={handleLogout} className="rounded-full bg-rose-50 px-6 py-3 text-xs font-black uppercase tracking-wider text-rose-600 hover:bg-rose-100">Logout</button>
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <h2 className="text-2xl font-black text-slate-950">No active profile</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">Login or create an account to view your profile dashboard.</p>
                <button type="button" onClick={() => setTab('login')} className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-wider text-white">Login now</button>
              </div>
            )
          ) : tab === 'signup' ? (
            <div className="space-y-5">
              <h2 className="text-3xl font-black text-slate-950">Create your Mobisphere account</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={signupData.fullName} onChange={(e) => handleSignupChange('fullName', e.target.value)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Full name" />
                <input value={signupData.mobileNumber} onChange={(e) => handleSignupChange('mobileNumber', e.target.value)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="10-digit mobile" />
                <input type="password" value={signupData.password} onChange={(e) => handleSignupChange('password', e.target.value)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Strong password" />
                <textarea value={signupData.address} onChange={(e) => handleSignupChange('address', e.target.value)} className="h-28 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:col-span-2" placeholder="Delivery address" />
              </div>
              <button type="button" disabled={isSubmitting} onClick={handleSignup} className="w-full rounded-full bg-emerald-400 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-300 disabled:opacity-60">{isSubmitting ? 'Creating...' : 'Create account'}</button>
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-3xl font-black text-slate-950">Login to your account</h2>
              <div className="grid gap-4">
                <input value={loginData.fullName} onChange={(e) => handleLoginChange('fullName', e.target.value)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Full name" />
                <input value={loginData.mobileNumber} onChange={(e) => handleLoginChange('mobileNumber', e.target.value)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="10-digit mobile" />
                <input type="password" value={loginData.password} onChange={(e) => handleLoginChange('password', e.target.value)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Password" />
              </div>
              <button type="button" onClick={handleLogin} className="w-full rounded-full bg-slate-950 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-slate-800">Login account</button>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Account benefits</p>
            <div className="mt-5 space-y-3 text-sm font-semibold text-slate-300">
              {['Faster checkout details', 'Cart and order flow support', 'Enquiry follow-up readiness', 'Local pickup convenience'].map((item) => (
                <div key={item} className="rounded-2xl bg-white/10 px-4 py-3">✓ {item}</div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
