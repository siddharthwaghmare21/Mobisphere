"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const CUSTOMER_STORAGE_KEY = 'mobisphereCustomers'
const COUPON_STORAGE_KEY = 'mobisphereCoupons'

function loadJson(key) {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function saveJson(key, val) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(val))
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState('')
  const [hydrated, setHydrated] = useState(false)

  // Default Active Tab: 1 (Dashboard Overview)
  const [activeTab, setActiveTab] = useState(1)

  // Coupons State
  const [coupons, setCoupons] = useState([])
  const [newCouponCode, setNewCouponCode] = useState('')
  const [newDiscountPercent, setNewDiscountPercent] = useState('')
  const [couponAlert, setCouponAlert] = useState('')

  useEffect(() => {
    const session = loadJson(ADMIN_SESSION_KEY)
    const storedCustomers = loadJson(CUSTOMER_STORAGE_KEY)
    const storedCoupons = loadJson(COUPON_STORAGE_KEY)
    
    queueMicrotask(() => {
      if (session) {
        setIsLoggedIn(true)
      }
      setCustomers(Array.isArray(storedCustomers) ? storedCustomers : [])
      setCoupons(Array.isArray(storedCoupons) ? storedCoupons : [])
      setHydrated(true)
    })
  }, [])

  const salesData = useMemo(() => [
    { month: 'Jan', sales: 450000, height: '45%' },
    { month: 'Feb', sales: 550000, height: '55%' },
    { month: 'Mar', sales: 650000, height: '65%' },
    { month: 'Apr', sales: 850000, height: '85%' },
    { month: 'May', sales: 700000, height: '70%' },
    { month: 'Jun', sales: 950000, height: '95%' },
  ], [])

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Please enter both username and password.')
      return
    }

    const cleanUser = username.trim().toLowerCase()
    const foundAdmin = customers.find(
      (c) => (c.fullName.toLowerCase() === cleanUser || c.mobileNumber === username.trim()) && c.isAdmin
    )

    if (foundAdmin) {
      if (foundAdmin.password === password) {
        const sessionData = { username: foundAdmin.fullName, loginAt: new Date().toISOString() }
        saveJson(ADMIN_SESSION_KEY, sessionData)
        setIsLoggedIn(true)
        return
      }
    }

    if (cleanUser === 'admin' && password === 'admin') {
      const sessionData = { username: 'System Admin', loginAt: new Date().toISOString() }
      saveJson(ADMIN_SESSION_KEY, sessionData)
      setIsLoggedIn(true)
      return
    }

    setError('Invalid admin credentials. Access denied.')
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
  }

  const handleDeleteCustomer = (id) => {
    const next = customers.filter((c) => c.id !== id)
    setCustomers(next)
    saveJson(CUSTOMER_STORAGE_KEY, next)
  }

  const handleCreateCoupon = (e) => {
    e.preventDefault()
    setCouponAlert('')

    const code = newCouponCode.trim().toUpperCase()
    const percent = Number(newDiscountPercent)

    if (!code || !newDiscountPercent) {
      setCouponAlert('Please fill out both coupon code and discount percentage.')
      return
    }

    if (percent <= 0 || percent > 100) {
      setCouponAlert('Discount percentage must be between 1 and 100.')
      return
    }

    if (coupons.some(c => c.code === code)) {
      setCouponAlert('This coupon code already exists.')
      return
    }

    const newCoupon = {
      id: Date.now().toString(),
      code: code,
      discountPercent: percent
    }

    const updatedCoupons = [...coupons, newCoupon]
    setCoupons(updatedCoupons)
    saveJson(COUPON_STORAGE_KEY, updatedCoupons)

    setNewCouponCode('')
    setNewDiscountPercent('')
    alert(`Coupon "${code}" created successfully!`)
  }

  const handleDeleteCoupon = (id) => {
    const updatedCoupons = coupons.filter(c => c.id !== id)
    setCoupons(updatedCoupons)
    saveJson(COUPON_STORAGE_KEY, updatedCoupons)
  }

  if (!hydrated) return null

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 pt-32">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Secure Gateway</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">Admin Portal</h1>
            <p className="mt-2 text-sm text-slate-600">Enter authorization credentials to view store analytics.</p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm text-slate-700">
              <span>Admin Username or Mobile</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Username or 10-digit number"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-full bg-slate-950 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Verify & Enter
            </button>
          </form>
        </div>
      </main>
    )
  }

  // LOGGED IN DASHBOARD
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 pt-28 sm:px-6 space-y-6">
      
      {/* GLOBAL HEADER - हे बटण आता नेहमी समोर दिसेल! */}
      <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">System Dashboard</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">MobiSphere Panel</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* हेच ते मुख्य बटण जे ओनर डॅशबोर्ड उघडेल */}
            <button
              type="button"
              onClick={() => router.push('/owner-dashboard')}
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
            >
              View Analytics Chart 📊
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Global Tabs Navigation */}
        <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-4 font-medium">
          {[
            { id: 1, name: '1) Dashboard Overview' },
            { id: 2, name: '2) Product Inventory' },
            { id: 3, name: '3) Order Management' },
            { id: 4, name: '4) User Accounts' },
            { id: 5, name: '5) Coupons & Offers' },
            { id: 6, name: '6) Big Data Reports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-xs transition ${
                activeTab === tab.id
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* --- TAB 1: OVERVIEW --- */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase font-semibold tracking-wider text-slate-500">Gross Revenue</p>
              <p className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">₹41,50,000</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase font-semibold tracking-wider text-slate-500">Products Sold</p>
              <p className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">84 Units</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase font-semibold tracking-wider text-slate-500">Total Store Clients</p>
              <p className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{customers.length} Accounts</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase font-semibold tracking-wider text-slate-500">Active Coupons</p>
              <p className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{coupons.length} Vouchers</p>
            </div>
          </div>

          {/* Mini CSS Chart */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950 mb-4">Sales Chart Preview</h2>
            <div className="flex h-48 items-end justify-between gap-2 border-b border-l border-slate-200 pb-2 pl-2">
              {salesData.map((data, index) => (
                <div key={index} className="flex h-full flex-col justify-end items-center flex-1">
                  <div style={{ height: data.height }} className="w-full rounded-t-sm bg-slate-950 hover:bg-emerald-600 transition-all"></div>
                  <span className="mt-2 text-[10px] font-semibold text-slate-500">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: INVENTORY --- */}
      {activeTab === 2 && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <p className="text-lg font-semibold text-slate-900">2) Product Management (Inventory)</p>
          <p className="mt-2">Inventory configuration block module arriving shortly.</p>
        </div>
      )}

      {/* --- TAB 3: ORDER --- */}
      {activeTab === 3 && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <p className="text-lg font-semibold text-slate-900">3) Order Management System</p>
          <p className="mt-2">Live transaction pipeline tracking coming up next.</p>
        </div>
      )}

      {/* --- TAB 4: USERS --- */}
      {activeTab === 4 && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-950 mb-6">Registered Store Accounts ({customers.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-xs">
                  <th className="py-4 font-semibold">Customer Metadata</th>
                  <th className="py-4 font-semibold">Security Pass</th>
                  <th className="py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="py-4">
                      <div className="font-semibold">{c.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono">{c.mobileNumber}</div>
                    </td>
                    <td className="py-4 font-mono text-xs">{c.password}</td>
                    <td className="py-4 text-right">
                      <button onClick={() => handleDeleteCustomer(c.id)} className="rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 5: COUPONS --- */}
      {activeTab === 5 && (
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">Create Store Coupon</h2>
            <form onSubmit={handleCreateCoupon} className="mt-6 space-y-4">
              <input
                type="text"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value)}
                placeholder="E.g., FESTIVAL20"
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase font-semibold"
              />
              <input
                type="number"
                value={newDiscountPercent}
                onChange={(e) => setNewDiscountPercent(e.target.value)}
                placeholder="Discount Percentage (%)"
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
              <button type="submit" className="w-full rounded-full bg-slate-950 py-3.5 text-sm font-semibold text-white">Generate Coupon</button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950 mb-6">Active Store Coupons ({coupons.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="py-4 font-mono font-bold uppercase">{coupon.code}</td>
                      <td className="py-4 text-emerald-600 font-bold">{coupon.discountPercent}% OFF</td>
                      <td className="py-4 text-right">
                        <button onClick={() => handleDeleteCoupon(coupon.id)} className="rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: REPORTS --- */}
      {activeTab === 6 && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <p className="text-lg font-semibold text-slate-900">6) User Behavior and Sales Reports</p>
          <p className="mt-2">Advanced Analytics portal coming soon.</p>
        </div>
      )}
    </main>
  )
}