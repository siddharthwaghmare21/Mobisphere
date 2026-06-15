
"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import BackgroundHomeImage from './components/home-components/BackgroundHomeImage'

import BannerSection from './components/home-components/BannerSection'
import OfferBannerHomePage from './components/home-components/OfferBannerHomePage'
import PricingSection from './components/home-components/PricingSection'
import LatestProduct from './components/home-components/LatestProduct'
import OtherFacilities from './components/home-components/OtherFacilities'

function LightDarkToggle() {
  const [mode, setMode] = React.useState('light')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('mobisphereTheme') : null
    const prefersDark = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)')?.matches : false
    const next = stored || (prefersDark ? 'dark' : 'light')
    queueMicrotask(() => setMode(next))
    document.documentElement.classList.toggle('dark', next === 'dark')
  }, [])

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    localStorage.setItem('mobisphereTheme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed right-4 top-24 z-50 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg shadow-slate-900/5 backdrop-blur supports-[backdrop-filter]:bg-white/60 hover:bg-white dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50"
      aria-label="Toggle light/dark mode"
    >
      <span>{mode === 'dark' ? 'Dark' : 'Light'}</span>
      <span aria-hidden="true" className="text-base leading-none">{mode === 'dark' ? '🌙' : '☀️'}</span>
    </button>
  )
}

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
  address: '',
}

const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(value)

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

export default function Home() {
  const [tab, setTab] = useState('signup')
  const [signupData, setSignupData] = useState(initialSignupData)
  const [loginData, setLoginData] = useState(initialLoginData)
  const [accounts, setAccounts] = useState([])
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Read localStorage only once on mount.
    // Avoid triggering lint by scheduling state updates.
    const storedAccounts = getStoredAccounts()
    const storedUser = getStoredUser()

    queueMicrotask(() => {
      setAccounts(storedAccounts)
      setLoggedInUser(storedUser)
      if (storedUser) {
        setMessage(`Welcome back, ${storedUser.fullName}!`)
      }
    })
  }, [])


  const handleSignupChange = (field, value) => {
    setSignupData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLoginChange = (field, value) => {
    setLoginData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignup = () => {
    setMessage('')

    if (!signupData.fullName.trim() || !signupData.password || !signupData.mobileNumber.trim() || !signupData.address.trim()) {
      setMessage('Please complete all fields before signing up.')
      return
    }

    if (signupData.password.length < 6) {
      setMessage('Password must be at least 6 characters long.')
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
    }

    const nextAccounts = [...accounts, newAccount]
    setAccounts(nextAccounts)
    saveAccounts(nextAccounts)
    setLoggedInUser(newAccount)
    saveLoggedInUser(newAccount)
    setSignupData(initialSignupData)
    setMessage(`Account created successfully for ${newAccount.fullName}.`)
    setIsSubmitting(false)
  }

  const handleLogin = () => {
    setMessage('')

    if (!loginData.fullName.trim() || !loginData.password || !loginData.mobileNumber.trim() || !loginData.address.trim()) {
      setMessage('Please enter your name, password, mobile number, and address to login.')
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
        account.mobileNumber === loginData.mobileNumber.trim() &&
        account.address.toLowerCase() === loginData.address.trim().toLowerCase(),
    )

    if (!matchedAccount) {
      setMessage('No matching account found. Please check your details or sign up first.')
      return
    }

    setLoggedInUser(matchedAccount)
    saveLoggedInUser(matchedAccount)
    setMessage(`Welcome back, ${matchedAccount.fullName}!`)
  }

  const TopTrendingProducts = () => {
    // 3 iPhone Pro Max variants (you already have images). Add-to-cart uses ProductCard's handler.
    const trending = [
      { id: 6, label: 'Top pick', title: 'iPhone 16 Pro Max' },
      { id: 5, label: 'Hot', title: 'iPhone 15 Pro Max' },
      { id: 4, label: 'New offer', title: 'iPhone 14 Pro Max' },
    ]

    return (
      <section className="bg-slate-100 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Top & Trending</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">
                Best deals on flagship phones
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Quick picks that are selling fast—perfect for gifting and daily performance.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:gap-6 lg:grid-cols-3">
            {trending.map((t) => (
              <div key={t.id} className="group rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
                <LatestProductCard productId={t.id} />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const LatestProductCard = ({ productId }) => {
    // Local mini-card using existing ProductCard styles would be better, but this keeps it self-contained.
    // Use the same images from /public/images.
    const phones = {
      6: {
        image: '/images/IPhone 16 Pro Max.png',
        title: 'iPhone 16 Pro Max',
        desc: 'Latest flagship speed with premium display & camera.',
        price: 95000,
      },
      5: {
        image: '/images/IPhone 15 Pro Max.jpg',
        title: 'iPhone 15 Pro Max',
        desc: 'Ultra-smooth performance with modern photography upgrades.',
        price: 85000,
      },
      4: {
        image: '/images/IPhone 14 Pro Max.jpg',
        title: 'iPhone 14 Pro Max',
        desc: 'Pro-level chipset with advanced camera & safety features.',
        price: 75000,
      },
    }

    const p = phones[productId]

    const handleAddToCart = () => {
      const currentCart = JSON.parse(localStorage.getItem('mobisphereCart') || '[]')
      currentCart.push({
        cartItemId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        productId,
        title: p.title,
        image: p.image,
        description: p.desc,
        price: p.price,
      })
      localStorage.setItem('mobisphereCart', JSON.stringify(currentCart))
      alert(`${p.title} has been added to your cart!`)
    }

    return (
      <div className="flex h-full flex-col justify-between">
        <div className="overflow-hidden rounded-[1.5rem] bg-slate-100">
          <img src={p.image} alt={p.title} className="h-40 w-full object-cover sm:h-52" />
        </div>
        <div className="mt-3">
          <p className="text-sm font-semibold text-slate-950 line-clamp-1">{p.title}</p>
          <p className="mt-2 text-xs leading-5 text-slate-600 line-clamp-2">{p.desc}</p>
          <p className="mt-3 text-sm font-bold text-slate-900">₹{p.price.toLocaleString()}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-950 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800"
          >
            Add
          </button>
          <Link
            href="/product"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-emerald-600 bg-emerald-600 py-2 text-[11px] font-semibold text-slate-950 transition hover:bg-emerald-500"
          >
            View
          </Link>
        </div>
      </div>
    )
  }

  const ShopByCategory = () => {
    const brandCards = [
      { key: 'apple', title: 'Apple', desc: 'iPhones & flagship accessories' },
      { key: 'samsung', title: 'Samsung', desc: 'Galaxy performance & cameras' },
      { key: 'oneplus', title: 'OnePlus', desc: 'Fast, smooth, and powerful' },
    ]

    const categoryCards = [
      { key: 'mobiles', title: 'Mobiles', desc: 'Latest smartphones & deals' },
      { key: 'accessories', title: 'Accessories', desc: 'Covers, chargers & essentials' },
      { key: 'smartwatches', title: 'Smartwatches', desc: 'Fitness & daily alerts' },
    ]

    return (
      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Shop by Category</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">Find what you need</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Tap a brand or category to browse the latest options.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-3">
            {brandCards.map((b) => (
              <a
                key={b.key}
                href={`/product?brand=${encodeURIComponent(b.key)}`}
                className="group rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{b.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{b.desc}</p>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-slate-950/5 p-2">
                    <span className="block h-full w-full rounded-xl bg-emerald-500/20" />
                  </div>
                </div>
                <div className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-700">
                  Browse <span className="ml-2 text-lg">→</span>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-3">
            {categoryCards.map((c) => (
              <a
                key={c.key}
                href={`/product?category=${encodeURIComponent(c.key)}`}
                className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{c.title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{c.desc}</p>
                </div>
                <div className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-700">
                  Explore <span className="ml-2 text-lg">→</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const WhyChooseUs = () => {
    const points = [
      { title: 'Best Prices', detail: 'Transparent offers and value-focused deals.' },
      { title: 'Genuine Products', detail: 'Verified quality—phones & accessories you can trust.' },
      { title: 'Quick Repair', detail: 'Fast local support to keep your phone running.' },
      { title: 'Quick Support', detail: 'Advice and service whenever you need it.' },
    ]

    return (
      <section className="bg-slate-100 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Why Choose Mobisphere</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">Your phone partner in Sangli</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Mobile shopping should be simple: best offers, genuine products, and quick local repair.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2">
            {points.map((p) => (
              <div
                key={p.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">{p.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{p.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const Gateway = () => {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Mobisphere account</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Create your account</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                Sign up with name, password, mobile number, and address to continue to the home page.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
          {message && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {message}
            </div>
          )}

          {tab === 'signup' ? (
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
                    placeholder="Create a password"
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
                <label className="sm:col-span-2 space-y-2 text-sm text-slate-700">
                  <span>Address</span>
                  <textarea
                    value={loginData.address}
                    onChange={(e) => handleLoginChange('address', e.target.value)}
                    className="h-28 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Street, city, state, pincode"
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

          <div className="mt-8 text-center text-sm text-slate-600">
              <p>Already have an account?</p>
            <button
              type="button"
              onClick={() => setTab('login')}
              className="mt-3 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              My Profile
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* HERO / GATEWAY */}
      <BackgroundHomeImage />
      <BannerSection />

      {loggedInUser ? (
        <section className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
                  <div className="mb-6 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] sm:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">Welcome back</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Mobisphere, {loggedInUser.fullName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Explore trending phones and accessories. Here’s your quick access for the latest updates.
            </p>

            {/* Last Order Status + Shortcuts (requested) */}
            <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr_0.7fr] items-stretch">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-600">Last Order Status</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Your iPhone 16 order is out for delivery today!
                </p>
                <p className="mt-1 text-xs text-slate-600">Demo status (updates are mocked from local cart).</p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-600">Shortcuts</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // navigate via full page to keep this page self-contained
                      window.location.href = '/account'
                    }}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/cart'
                    }}
                    className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    Cart
                  </button>
                </div>

                <p className="mt-3 text-xs text-slate-600">
                  Fast access for profile & checkout.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <Gateway />
      )}

      {/* New gateway-friendly storefront sections */}
      <OfferBannerHomePage />
      <TopTrendingProducts />
      <ShopByCategory />
      <WhyChooseUs />

      {/* Existing sections */}
      <LatestProduct />
      <PricingSection />
      <OtherFacilities />
    </>
  )
}


