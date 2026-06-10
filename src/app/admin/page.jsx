"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { productData } from '@/app/components/common/ProductCart'

const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const COUPON_STORAGE_KEY = 'mobisphereCoupons'
const CART_STORAGE_KEY = 'mobisphereCart'
const ENQUIRY_STORAGE_KEY = 'mobisphereEnquiries'

function getAllPossibleUsers() {
  if (typeof window === 'undefined') return []
  try {
    const keysToTry = ['mobisphereCustomers', 'customers', 'users', 'registeredUsers', 'userData', 'allUsers']
    for (const key of keysToTry) {
      const data = localStorage.getItem(key)
      if (data) {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    }
    return []
  } catch {
    return []
  }
}

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

  const [activeTab, setActiveTab] = useState(1)
  const [coupons, setCoupons] = useState([])
  const [newCouponCode, setNewCouponCode] = useState('')
  const [newDiscountPercent, setNewDiscountPercent] = useState('')
  const [couponAlert, setCouponAlert] = useState('')

  useEffect(() => {
    const session = loadJson(ADMIN_SESSION_KEY)
    const storedCustomers = getAllPossibleUsers()
    const EastonCoupons = loadJson(COUPON_STORAGE_KEY) || loadJson('coupons') || []
    const storedEnquiries = loadJson(ENQUIRY_STORAGE_KEY) || loadJson('enquiries') || loadJson('contactData') || loadJson('enquiry') || []
    
    queueMicrotask(() => {
      if (session) {
        setIsLoggedIn(true)
        setUsername(session.username || 'Admin')
      }

      setCustomers(storedCustomers.length ? storedCustomers : [
        { id: 'u1', fullName: 'Siddharth Waghmare', mobileNumber: '9850123456', password: 'user123', email: 'sid@gmail.com', address: 'Sangli, Maharashtra', isAdmin: false },
        { id: 'u2', fullName: 'Shubham Dabade', mobileNumber: '7770011223', password: 'pass777', email: 'shubham@gmail.com', address: 'Kolhapur, India', isAdmin: true }
      ])

      setCoupons(Array.isArray(EastonCoupons) ? EastonCoupons : [])
      
      setEnquiries(storedEnquiries.length ? storedEnquiries.map(e => ({
        ...e,
        status: e.status || 'Pending',
        date: e.date || '2026-06-10'
      })) : [
        { id: 'e1', name: 'Rahul Patil', mobile: '9876543210', email: 'rahul@gmail.com', message: 'Is that Mobile available in your shop?', date: '2026-06-10', status: 'Pending' },
        { id: 'e2', name: 'Amit Shinde', mobile: '8888888888', email: 'amit@shinde.com', message: 'Do you provide EMI on Credit Cards?', date: '2026-06-10', status: 'Resolved' }
      ])
      
      setHydrated(true)
    })
  }, [])

  // Chart Logic
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
      setError('Please enter both credentials.')
      return
    }
    if (username.trim().toLowerCase() === 'admin' && password === 'admin') {
      saveJson(ADMIN_SESSION_KEY, { username: 'System Admin' })
      setIsLoggedIn(true)
    } else {
      setError('Invalid admin credentials.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    setIsLoggedIn(false)
  }

  const handleDeleteCustomer = (id) => {
    const next = customers.filter((c) => c.id !== id)
    setCustomers(next)
    const keysToSync = ['mobisphereCustomers', 'customers', 'users', 'registeredUsers', 'userData', 'allUsers']
    keysToSync.forEach(k => { if(localStorage.getItem(k)) saveJson(k, next) })
  }

  const toggleEnquiryStatus = (id) => {
    const next = enquiries.map((e) => {
      if (e.id === id) {
        return { ...e, status: e.status === 'Pending' ? 'Resolved' : 'Pending' }
      }
      return e
    })
    setEnquiries(next)
    saveJson(ENQUIRY_STORAGE_KEY, next)
    saveJson('enquiries', next)
  }

  const handleDeleteEnquiry = (id) => {
    const next = enquiries.filter((e) => e.id !== id)
    setEnquiries(next)
    saveJson(ENQUIRY_STORAGE_KEY, next)
    saveJson('enquiries', next)
  }

  const handleCreateCoupon = (e) => {
    e.preventDefault()
    setCouponAlert('')
    const code = newCouponCode.trim().toUpperCase()
    const percent = Number(newDiscountPercent)
    if (!code || percent <= 0 || percent > 100) return
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

  if (!isLoggedIn) {
    return (
      <main className="mx-auto max-w-md px-4 py-32">
        <div className="rounded-[2rem] border border-slate-300 bg-white p-8 shadow-xl">
          <h1 className="text-center text-xl font-bold text-slate-900">MobiSphere Admin Login</h1>
          {error && <div className="mt-4 text-xs text-red-600 bg-red-50 p-2 rounded-xl">{error}</div>}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border-slate-300 border p-3 text-sm text-slate-900 outline-none" placeholder="admin" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border-slate-300 border p-3 text-sm text-slate-900 outline-none" placeholder="admin" />
            <button type="submit" className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white">Login</button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 pt-28 sm:px-6 space-y-6 text-slate-900">
      
      {/* Top Banner Header */}
      <div className="rounded-[2rem] bg-slate-900 p-6 shadow-md text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs uppercase text-emerald-400 font-bold">● Live Portal Active</p>
          <h1 className="text-2xl font-bold mt-1">Welcome back, Admin! 👋</h1>
        </div>
        <button onClick={handleLogout} className="rounded-full bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700">Log out</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
        
        {/* Navigation Sidebar Menu */}
        <div className="rounded-[2rem] border border-slate-300 bg-white p-4 h-fit shadow-sm space-y-1">
          <p className="text-[11px] uppercase font-black text-slate-900 px-3 mb-3 tracking-wider">Navigation Menu</p>
          {[
            { id: 1, name: '1) Dashboard & Analytics' },
            { id: 2, name: '2) Product Inventory' },
            { id: 3, name: '3) Order Management' },
            { id: 4, name: '4) User Accounts 👥' },
            { id: 5, name: '5) Coupons & Offers' },
            { id: 6, name: '6) Behavior Reports' },
            { id: 7, name: '7) Enquiries 📩' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left rounded-2xl px-4 py-3 text-xs font-black transition ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-800 hover:bg-slate-100'}`}>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Workspace Panels Container */}
        <div className="space-y-6">
          
          {/* TAB 1: GRAPH COMPONENT */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="grid gap-4 grid-cols-3">
                <div className="rounded-2xl border border-slate-300 p-4 bg-white shadow-sm"><p className="text-[10px] text-slate-900 uppercase font-black">Gross Revenue</p><p className="text-xl font-black text-slate-950">₹{chartAnalytics.totalRevenue.toLocaleString()}</p></div>
                <div className="rounded-2xl border border-slate-300 p-4 bg-white shadow-sm"><p className="text-[10px] text-slate-900 uppercase font-black">Users</p><p className="text-xl font-black text-slate-950">{customers.length}</p></div>
                <div className="rounded-2xl border border-slate-300 p-4 bg-white shadow-sm"><p className="text-[10px] text-slate-900 uppercase font-black">Enquiries</p><p className="text-xl font-black text-orange-600">{enquiries.length}</p></div>
              </div>
              <div className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Device Sales Metrics Graph</h2>
                <div className="flex h-48 items-end justify-between gap-2 border-b border-l border-slate-300 pb-2 pl-2 bg-slate-50 p-2 rounded-xl">
                  {chartAnalytics.topProducts.map((data, index) => (
                    <div key={index} className="flex h-full flex-col justify-end items-center flex-1">
                      <div style={{ height: data.heightStr }} className="w-full rounded-t bg-slate-900 hover:bg-emerald-600 transition-all cursor-pointer"></div>
                      <span className="mt-2 text-[10px] text-slate-900 font-bold truncate max-w-[40px] sm:max-w-none">{data.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2, 3, 6 Placeholders */}
          {(activeTab === 2 || activeTab === 3 || activeTab === 6) && (
            <div className="rounded-[2rem] border border-slate-300 bg-white p-8 text-center text-xs font-bold text-slate-900">Module deployed in core sync queue.</div>
          )}

          {/* 👥 TAB 4: USER ACCOUNTS - हायपर विजिबल टेक्स्ट रंगांसह */}
          {activeTab === 4 && (
            <div className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-950 mb-4">Registered System Users ({customers.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-900 uppercase font-black tracking-wider text-[11px]">
                      <th className="py-3 pr-2">Full Name</th>
                      <th className="py-3 pr-2">Contact Matrix</th>
                      <th className="py-3 pr-2">Address</th>
                      <th className="py-3 pr-2">Password</th>
                      <th className="py-3 pr-2">Role</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                    {customers.map((c, index) => (
                      <tr key={c.id || index} className="hover:bg-slate-50">
                        <td className="py-3 pr-2 font-black text-slate-950 text-sm">{c.fullName || c.name || c.username}</td>
                        <td className="py-3 pr-2 text-slate-900">
                          <div className="font-mono">{c.mobileNumber || c.mobile || c.phone}</div>
                          <div className="text-[10px] text-slate-700 font-semibold">{c.email || 'No Email Registered'}</div>
                        </td>
                        <td className="py-3 pr-2 text-slate-900 font-semibold max-w-[140px] truncate">{c.address || 'Sangli / Outstation'}</td>
                        <td className="py-3 pr-2 font-mono text-slate-900 font-bold">{c.password || '••••••'}</td>
                        <td className="py-3 pr-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${c.isAdmin ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-slate-100 text-slate-900 border-slate-300'}`}>
                            {c.isAdmin ? 'Admin' : 'Customer'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button onClick={() => handleDeleteCustomer(c.id)} className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700 hover:bg-red-200 transition">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CONFIG COUPONS */}
          {activeTab === 5 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-300 bg-white p-4">
                <h3 className="font-bold text-slate-900 text-xs mb-3">Create Coupon</h3>
                <form onSubmit={handleCreateCoupon} className="space-y-2">
                  <input type="text" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} placeholder="Code" className="w-full border border-slate-300 p-2 text-xs uppercase font-bold rounded-xl text-slate-900" />
                  <input type="number" value={newDiscountPercent} onChange={(e) => setNewDiscountPercent(e.target.value)} placeholder="Discount %" className="w-full border border-slate-300 p-2 text-xs rounded-xl text-slate-900" />
                  <button type="submit" className="w-full bg-slate-900 text-white py-2 text-xs font-bold rounded-xl">Generate</button>
                </form>
              </div>
              <div className="rounded-2xl border border-slate-300 bg-white p-4">
                <h3 className="font-bold text-slate-900 text-xs mb-3">Active Coupons</h3>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-200">
                    {coupons.map((coupon) => (
                      <tr key={coupon.id}><td className="py-2 font-mono font-bold text-slate-900 uppercase">{coupon.code}</td><td className="py-2 text-emerald-700 font-black">{coupon.discountPercent}% OFF</td><td className="py-2 text-right"><button onClick={() => handleDeleteCoupon(coupon.id)} className="text-red-600 font-bold">Remove</button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 📩 TAB 7: ENQUIRIES - डार्क कलर्स आणि फुल विजिबिलिटी */}
          {activeTab === 7 && (
            <div className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-950 mb-4">Customer Enquiries Logs ({enquiries.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-900 uppercase font-black tracking-wider text-[11px]">
                      <th className="py-3 pr-2">Date Logs</th>
                      <th className="py-3 pr-2">Sender Information</th>
                      <th className="py-3 pr-2">Message Body</th>
                      <th className="py-3 pr-2">Status Action</th>
                      <th className="py-3 text-right">System</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                    {enquiries.map((enq, index) => (
                      <tr key={enq.id || index} className="hover:bg-slate-50">
                        <td className="py-3 pr-2 font-mono text-[11px] text-slate-900 font-black">{enq.date}</td>
                        <td className="py-3 pr-3 text-slate-900">
                          <div className="font-black text-slate-950 text-sm">{enq.name || enq.fullName}</div>
                          <div className="text-[11px] text-slate-800 font-mono font-bold mt-0.5">{enq.mobile || enq.mobileNumber}</div>
                          <div className="text-[10px] text-slate-700 font-semibold">{enq.email || 'No email left'}</div>
                        </td>
                        <td className="py-3 pr-2 font-black text-slate-950 text-sm italic max-w-xs break-words">"{enq.message || enq.enquiryMessage}"</td>
                        <td className="py-3 pr-2">
                          <button 
                            onClick={() => toggleEnquiryStatus(enq.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black border transition shadow-sm ${
                              enq.status === 'Resolved' 
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200' 
                                : 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
                            }`}
                          >
                            {enq.status} 🔄
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <button onClick={() => handleDeleteEnquiry(enq.id)} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700 hover:bg-orange-200 transition">Dismiss</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}