"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { productData } from '@/app/components/common/ProductCart'

const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const CUSTOMER_STORAGE_KEY = 'mobisphereCustomers'
const COUPON_STORAGE_KEY = 'mobisphereCoupons'
const CART_STORAGE_KEY = 'mobisphereCart'
const ENQUIRY_STORAGE_KEY = 'mobisphereEnquiries'

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

function safeNumber(n) {
  const x = Number(n)
  return Number.isFinite(x) ? x : 0
}

export default function UnifiedAdminDashboard() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [customers, setCustomers] = useState([])
  const [enquiries, setEnquiries] = useState([])
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
    const storedCustomers = loadJson(CUSTOMER_STORAGE_KEY) || loadJson('customers') || []
    const storedCoupons = loadJson(COUPON_STORAGE_KEY) || loadJson('coupons') || []
    
    // इन्क्वायरीसाठी सर्व संभाव्य बॅकअप की तपासणे
    const storedEnquiries = loadJson(ENQUIRY_STORAGE_KEY) || loadJson('enquiries') || loadJson('contactData') || loadJson('enquiry') || []
    
    queueMicrotask(() => {
      if (session) {
        setIsLoggedIn(true)
        setUsername(session.username || 'Admin')
      }
      setCustomers(Array.isArray(storedCustomers) ? storedCustomers : [])
      setCoupons(Array.isArray(storedCoupons) ? storedCoupons : [])
      setEnquiries(Array.isArray(storedEnquiries) ? storedEnquiries : [])
      setHydrated(true)
    })
  }, [])

  // CSS Chart Sales Performance Metrics
  const chartAnalytics = useMemo(() => {
    if (!hydrated) return { totalRevenue: 0, topProducts: [] }
    const cartData = loadJson(CART_STORAGE_KEY) || loadJson('cart') || []

    const productCount = new Map()
    const productRevenue = new Map()

    const defaultIds = [1, 2, 3, 4, 5, 6]
    defaultIds.forEach((pid, index) => {
      productCount.set(pid, 12 - index * 1.5)
      productRevenue.set(pid, (productData?.[pid]?.price || 45000) * (12 - index * 1.5))
    })

    if (Array.isArray(cartData) && cartData.length > 0) {
      productCount.clear()
      productRevenue.clear()
      for (const it of cartData) {
        const pid = Number(it.productId)
        if (!Number.isFinite(pid)) continue
        const price = safeNumber(it.price)
        productCount.set(pid, (productCount.get(pid) || 0) + 1)
        productRevenue.set(pid, (productRevenue.get(pid) || 0) + price)
      }
    }

    const sortedCount = [...productCount.entries()].sort((a, b) => b[1] - a[1])
    const totalRevenue = [...productRevenue.values()].reduce((a, b) => a + b, 0)
    const maxCount = Math.max(...[...productCount.values()], 1)

    const topProducts = sortedCount.slice(0, 6).map(([pid]) => {
      const count = productCount.get(pid) || 0
      const barHeightPct = Math.min(Math.round((count / maxCount) * 80 + 10), 95)
      return {
        pid,
        title: productData?.[pid]?.title ? productData[pid].title.replace("iPhone ", "iP ") : `Product ${pid}`,
        count,
        revenue: productRevenue.get(pid) || 0,
        heightStr: `${barHeightPct}%`
      }
    })

    return { totalRevenue, topProducts }
  }, [hydrated])

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

    if (foundAdmin && foundAdmin.password === password) {
      saveJson(ADMIN_SESSION_KEY, { username: foundAdmin.fullName })
      setIsLoggedIn(true)
      return
    }

    if (cleanUser === 'admin' && password === 'admin') {
      saveJson(ADMIN_SESSION_KEY, { username: 'System Admin' })
      setIsLoggedIn(true)
      return
    }

    setError('Invalid admin credentials. Access denied.')
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    setIsLoggedIn(false)
  }

  const handleDeleteCustomer = (id) => {
    const next = customers.filter((c) => c.id !== id)
    setCustomers(next)
    saveJson(CUSTOMER_STORAGE_KEY, next)
    saveJson('customers', next) // Backup sync
  }

  const handleDeleteEnquiry = (id) => {
    const next = enquiries.filter((e) => e.id !== id)
    setEnquiries(next)
    saveJson(ENQUIRY_STORAGE_KEY, next)
    saveJson('enquiries', next) // Backup sync
  }

  const handleCreateCoupon = (e) => {
    e.preventDefault()
    setCouponAlert('')
    const code = newCouponCode.trim().toUpperCase()
    const percent = Number(newDiscountPercent)

    if (!code || !newDiscountPercent || percent <= 0 || percent > 100) {
      setCouponAlert('Invalid coupon details.')
      return
    }

    const newCoupon = { id: Date.now().toString(), code, discountPercent: percent }
    const next = [...coupons, newCoupon]
    setCoupons(next)
    saveJson(COUPON_STORAGE_KEY, next)
    setNewCouponCode('')
    setNewDiscountPercent('')
  }

  const handleDeleteCoupon = (id) => {
    const next = coupons.filter(c => c.id !== id)
    setCoupons(next)
    saveJson(COUPON_STORAGE_KEY, next)
  }

  if (!hydrated) return null

  // 🔐 LOGIN IF NOT AUTHORIZED
  if (!isLoggedIn) {
    return (
      <main className="mx-auto max-w-md px-4 py-32">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Control Room</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">MobiSphere Admin</h1>
          </div>
          {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border p-3 text-sm outline-none" placeholder="Username" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border p-3 text-sm outline-none" placeholder="Password" />
            <button type="submit" className="w-full rounded-full bg-slate-950 py-3 text-sm font-semibold text-white">Enter Panel</button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 pt-28 sm:px-6 space-y-6">
      
      {/* Top Controller Header */}
      <div className="rounded-[2rem] bg-slate-950 p-6 shadow-md text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold">● System Secure Live</p>
          <h1 className="text-2xl font-bold mt-1">Welcome back, Admin! 👋</h1>
        </div>
        <button onClick={handleLogout} className="rounded-full border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800">
          Secure Log out
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
        
        {/* Navigation Sidebar (नवीन ऑप्शन्स आणि ७ नंबर टॅब जोडला) */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 h-fit shadow-sm space-y-1">
          <p className="text-[11px] uppercase font-bold text-slate-400 px-3 mb-3 tracking-wider">Navigation Menu</p>
          {[
            { id: 1, name: '1) Dashboard & Analytics view' },
            { id: 2, name: '2) Product Management (Inventory)' },
            { id: 3, name: '3) Order Management System' },
            { id: 4, name: '4) User Accounts' }, // साईन-अप केलेले युझर्स
            { id: 5, name: '5) Coupons & Offers' },
            { id: 6, name: '6) User Behavior & Reports' },
            { id: 7, name: '7) Enquiries 📩' }, // नवीन ७ नंबरचा टॅब
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left rounded-2xl px-4 py-3 text-xs font-semibold transition ${
                activeTab === tab.id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Dynamic Screens Workspace */}
        <div className="space-y-6">
          
          {/* TAB 1: CHART OVERVIEW */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] uppercase font-bold text-slate-400">Gross Value Revenue</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">₹{chartAnalytics.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] uppercase font-bold text-slate-400">Total Users</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{customers.length} Profiles</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] uppercase font-bold text-slate-400">User Enquiries</p>
                  <p className="mt-1 text-2xl font-bold text-orange-600">{enquiries.length} Logs</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-bold text-slate-950 mb-2">Device Sales Volume Distribution</h2>
                <div className="flex h-64 items-end justify-between gap-2 border-b border-l border-slate-200 pb-2 pl-2 pt-6 bg-slate-50/50 rounded-br-2xl p-4">
                  {chartAnalytics.topProducts.map((data, index) => (
                    <div key={index} className="group flex h-full flex-col justify-end items-center flex-1">
                      <div className="mb-1 opacity-0 transform translate-y-1 transition duration-150 group-hover:opacity-100 group-hover:translate-y-0 text-[9px] bg-slate-950 text-white px-1.5 py-0.5 rounded font-mono text-center">
                        {data.count} units
                      </div>
                      <div style={{ height: data.heightStr }} className="w-full rounded-t bg-slate-950 transition-all hover:bg-emerald-600 cursor-pointer shadow-sm"></div>
                      <span className="mt-2 text-[10px] font-bold text-slate-500 text-center truncate max-w-[50px] sm:max-w-none">{data.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2 & 3 & 6 Placeholders */}
          {(activeTab === 2 || activeTab === 3 || activeTab === 6) && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              This module section is queued for deployment.
            </div>
          )}

          {/* TAB 4: USER ACCOUNTS (सामील केलेला साईन-अप डेटा) */}
          {activeTab === 4 && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-slate-950 mb-2">Registered User Accounts ({customers.length})</h2>
              <p className="text-xs text-slate-400 mb-6">All clients who signed up or logged into the system portal storefront.</p>
              
              {customers.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400">
                  No registered active users found in local storage pipeline.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-3 font-bold">Full Name & Metadata</th>
                        <th className="py-3 font-bold">Security Password</th>
                        <th className="py-3 font-bold text-right">System Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-slate-900">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 pr-2">
                            <div className="font-bold text-slate-950 text-sm">{c.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.mobileNumber}</div>
                            {c.address && <div className="text-[10px] text-slate-500 truncate max-w-xs font-normal mt-0.5">{c.address}</div>}
                          </td>
                          <td className="py-3 font-mono text-slate-600 font-semibold">{c.password}</td>
                          <td className="py-3 text-right">
                            <button onClick={() => handleDeleteCustomer(c.id)} className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition">Remove Account</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COUPONS & OFFERS */}
          {activeTab === 5 && (
            <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">Create Store Coupon</h2>
                <form onSubmit={handleCreateCoupon} className="mt-4 space-y-3">
                  <input type="text" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} placeholder="E.g., SAVE30" className="w-full rounded-2xl border p-3 text-xs uppercase font-bold" />
                  <input type="number" value={newDiscountPercent} onChange={(e) => setNewDiscountPercent(e.target.value)} placeholder="Discount %" className="w-full rounded-2xl border p-3 text-xs" />
                  <button type="submit" className="w-full rounded-full bg-slate-950 py-3 text-xs font-bold text-white">Generate</button>
                </form>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950 mb-4">Active Coupons ({coupons.length})</h2>
                <table className="w-full text-xs">
                  <tbody className="divide-y font-semibold">
                    {coupons.map((coupon) => (
                      <tr key={coupon.id}>
                        <td className="py-3 font-mono uppercase">{coupon.code}</td>
                        <td className="py-3 text-emerald-600">{coupon.discountPercent}% OFF</td>
                        <td className="py-3 text-right"><button onClick={() => handleDeleteCoupon(coupon.id)} className="text-red-600 hover:underline">Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: USER ENQUIRIES (नवीन स्वतंत्र टॅब) */}
          {activeTab === 7 && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-slate-950 mb-2">User Enquiries Panel ({enquiries.length})</h2>
              <p className="text-xs text-slate-400 mb-6">Live messages submitted by clients through contact forms on the store front.</p>
              
              {enquiries.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400">
                  No client message logs or enquiries found in storage pipeline.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-3 font-bold">Client Sender Info</th>
                        <th className="py-3 font-bold">Message Text</th>
                        <th className="py-3 text-right font-bold">System Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-slate-900">
                      {enquiries.map((enq) => (
                        <tr key={enq.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 pr-4">
                            <div className="font-bold text-slate-950 text-sm">{enq.name || enq.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{enq.mobile || enq.mobileNumber}</div>
                            {enq.email && <div className="text-[10px] text-slate-500 font-normal">{enq.email}</div>}
                          </td>
                          <td className="py-3 text-slate-700 max-w-xs sm:max-w-md break-words">
                            <p className="italic font-normal">"{enq.message || enq.enquiryMessage}"</p>
                            {enq.date && <span className="text-[9px] text-slate-400 block mt-1 font-mono">{enq.date}</span>}
                          </td>
                          <td className="py-3 text-right">
                            <button onClick={() => handleDeleteEnquiry(enq.id)} className="rounded-full bg-orange-50 px-3 py-1.5 font-bold text-orange-600 hover:bg-orange-100 transition">Dismiss Log</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  )
}