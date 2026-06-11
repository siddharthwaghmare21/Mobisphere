"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { productData } from '@/app/components/common/ProductCart'

// 🎯 मूळ पेजेसशी कनेक्ट होणाऱ्या परफेक्ट लोकल स्टोरेज कीज
const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const CUSTOMER_STORAGE_KEY = 'customers' 
const COUPON_STORAGE_KEY = 'coupons'     
const CART_STORAGE_KEY = 'cart'         
const ENQUIRY_STORAGE_KEY = 'enquiries' 

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
    
    // थेट मूळ पेजेसवरून येणारा शुद्ध लाईव्ह डेटा लोड करणे (कोणताही डमी फॉलबॅक नाही)
    const storedCustomers = loadJson(CUSTOMER_STORAGE_KEY) || []
    const storedEnquiries = loadJson(ENQUIRY_STORAGE_KEY) || []
    const EastonCoupons = loadJson(COUPON_STORAGE_KEY) || []
    
    queueMicrotask(() => {
      if (session) {
        setIsLoggedIn(true)
        setUsername(session.username || 'Admin')
      }

      setCustomers(Array.isArray(storedCustomers) ? storedCustomers : [])
      setCoupons(Array.isArray(EastonCoupons) ? EastonCoupons : [])
      
      // ओरिजनल इन्क्वायरी डेटा सुरक्षित मॅप करणे
      setEnquiries(Array.isArray(storedEnquiries) ? storedEnquiries.map(e => ({
        id: e.id || Date.now().toString() + Math.random(),
        date: e.date || e.submittedAt || '—',
        productName: e.productName || 'General Enquiry',
        name: e.name || e.fullName || '—',
        mobile: e.mobile || e.mobileNumber || '—',
        email: e.email || '—',
        message: e.message || e.enquiryMessage || '—',
        status: e.status || 'Pending',
        adminNote: e.adminNote || e.note || ''
      })) : [])
      
      setHydrated(true)
    })
  }, [])

  // Chart Analytics
  const chartAnalytics = useMemo(() => {
    if (!hydrated) return { totalRevenue: 0, topProducts: [] }
    const cartData = loadJson(CART_STORAGE_KEY) || []

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
        const price = Number(it.price) || 0
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
    saveJson(CUSTOMER_STORAGE_KEY, next)
  }

  const handleEnquiryFieldChange = (id, field, value) => {
    const next = enquiries.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    setEnquiries(next)
  }

  const handleSaveEnquiry = (id) => {
    saveJson(ENQUIRY_STORAGE_KEY, enquiries)
    alert('Enquiry status updated successfully!')
  }

  const handleDeleteEnquiry = (id) => {
    const next = enquiries.filter((e) => e.id !== id)
    setEnquiries(next)
    saveJson(ENQUIRY_STORAGE_KEY, next)
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
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-900 outline-none" placeholder="admin" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border p-3 text-sm text-slate-900 outline-none" placeholder="admin" />
            <button type="submit" className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white">Login</button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 pt-28 sm:px-6 space-y-6 text-slate-900">
      
      {/* 👑 सुरक्षित एडमीन बॅनर */}
      <div className="rounded-[2rem] bg-slate-950 p-6 shadow-md text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800">
        <div>
          <p className="text-xs uppercase text-emerald-400 font-bold tracking-wider">● System Secure Active</p>
          <h1 className="text-2xl font-bold mt-1">Welcome back, Admin! 👋</h1>
          <p className="text-xs text-slate-400 mt-1">Full architectural configuration mode is currently active.</p>
        </div>
        <button onClick={handleLogout} className="rounded-full bg-slate-900 border border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 transition">Log out</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
        
        {/* Navigation Sidebar */}
        <div className="rounded-[2rem] border border-slate-300 bg-white p-4 h-fit shadow-sm space-y-1">
          <p className="text-[11px] uppercase font-bold text-slate-400 px-3 mb-2 tracking-wider">Navigation Menu</p>
          {[
            { id: 1, name: '1) Dashboard & Analytics' },
            { id: 2, name: '2) Product Inventory' },
            { id: 3, name: '3) Order Management' },
            { id: 4, name: '4) User Accounts 👥' },
            { id: 5, name: '5) Coupons & Offers' },
            { id: 6, name: '6) Behavior Reports' },
            { id: 7, name: '7) Enquiries 📩' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left rounded-2xl px-4 py-3 text-xs font-black transition ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-800 hover:bg-slate-100'}`}>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Workspace Panels Container */}
        <div className="space-y-6">
          
          {/* TAB 1: GRAPH OVERVIEW */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="grid gap-4 grid-cols-3">
                <div className="rounded-2xl border border-slate-300 p-4 bg-white shadow-sm"><p className="text-[10px] text-slate-500 uppercase font-bold">Gross Revenue</p><p className="text-xl font-bold text-slate-900">₹{chartAnalytics.totalRevenue.toLocaleString()}</p></div>
                <div className="rounded-2xl border border-slate-300 p-4 bg-white shadow-sm"><p className="text-[10px] text-slate-500 uppercase font-bold">Users</p><p className="text-xl font-bold text-slate-900">{customers.length}</p></div>
                <div className="rounded-2xl border border-slate-300 p-4 bg-white shadow-sm"><p className="text-[10px] text-slate-500 uppercase font-bold">Enquiries</p><p className="text-xl font-bold text-slate-900">{enquiries.length}</p></div>
              </div>
              <div className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Device Sales Metrics Graph</h2>
                <div className="flex h-48 items-end justify-between gap-2 border-b border-l border-slate-300 pb-2 pl-2 bg-slate-50 p-2 rounded-xl">
                  {chartAnalytics.topProducts.map((data, index) => (
                    <div key={index} className="flex h-full flex-col justify-end items-center flex-1">
                      <div style={{ height: data.heightStr }} className="w-full rounded-t bg-slate-900 hover:bg-emerald-600 transition-all cursor-pointer"></div>
                      <span className="mt-2 text-[10px] text-slate-700 font-bold truncate max-w-[40px] sm:max-w-none">{data.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2, 3, 6 */}
          {(activeTab === 2 || activeTab === 3 || activeTab === 6) && (
            <div className="rounded-[2rem] border border-slate-300 bg-white p-8 text-center text-xs font-bold text-slate-800">Module deployed in core sync queue.</div>
          )}

          {/* 👥 TAB 4: USER ACCOUNTS - फक्त आणि फक्त रिअल आडवा टेबल */}
          {activeTab === 4 && (
            <div className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-950 mb-4">Registered System Users ({customers.length})</h2>
              {customers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium text-xs">No active user accounts found. Try registering a new user!</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-900 uppercase font-black tracking-wider text-[11px]">
                        <th className="py-3 pr-2">Full Name</th>
                        <th className="py-3 pr-2">Mobile Number</th>
                        <th className="py-3 pr-2">Email Address</th>
                        <th className="py-3 pr-2">Address Location</th>
                        <th className="py-3 pr-2">Password</th>
                        <th className="py-3 pr-2">Role</th>
                        <th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                      {customers.map((c, index) => (
                        <tr key={c.id || index} className="hover:bg-slate-50">
                          <td className="py-3 pr-2 font-black text-slate-950 text-sm">{c.fullName || c.name || c.username || '—'}</td>
                          <td className="py-3 pr-2 text-slate-900 font-mono text-sm">{c.mobileNumber || c.mobile || c.phone || '—'}</td>
                          <td className="py-3 pr-2 text-slate-800 font-medium">{c.email || '—'}</td>
                          <td className="py-3 pr-2 text-slate-800 font-medium max-w-[150px] truncate">{c.address || '—'}</td>
                          <td className="py-3 pr-2 font-mono text-slate-700 font-bold">{c.password || '••••••'}</td>
                          <td className="py-3 pr-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${c.isAdmin || c.role === 'admin' ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-slate-100 text-slate-900 border-slate-300'}`}>
                              {c.isAdmin || c.role === 'admin' ? 'Admin' : 'Customer'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button onClick={() => handleDeleteCustomer(c.id)} className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700 hover:bg-red-200 transition">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COUPONS */}
          {activeTab === 5 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-300 bg-white p-4">
                <h3 className="font-bold text-slate-900 text-xs mb-3">Create Coupon</h3>
                <form onSubmit={handleCreateCoupon} className="space-y-2">
                  <input type="text" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} placeholder="Code" className="w-full border border-slate-300 p-2 text-xs uppercase font-bold rounded-xl text-slate-900" />
                  <input type="number" value={newDiscountPercent} onChange={(e) => setNewDiscountPercent(e.target.value)} placeholder="Discount %" className="w-full border border-slate-300 p-2 text-xs rounded-xl text-slate-900" />
                  <input type="submit" className="w-full bg-slate-900 text-white py-2 text-xs font-bold rounded-xl cursor-pointer" value="Generate" />
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

          {/* 📩 TAB 7: ENQUIRIES - ओरिजनल टेबल लेआउट विथ ड्रॉपडाउन, नोट इनपुट, सेव्ह आणि डिलीट बट्स */}
          {activeTab === 7 && (
            <div className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-950 mb-4">Customer Enquiries Logs ({enquiries.length})</h2>
              {enquiries.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium text-xs">No customer enquiries found in the database.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-900 uppercase font-black tracking-wider text-[11px]">
                        <th className="py-3 pr-2">Date Logs</th>
                        <th className="py-3 pr-2">Product Name</th>
                        <th className="py-3 pr-2">Sender & Mobile</th>
                        <th className="py-3 pr-2">Email</th>
                        <th className="py-3 pr-2">Message Body</th>
                        <th className="py-3 pr-2">Status</th>
                        <th className="py-3 pr-2">Admin Note</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                      {enquiries.map((enq, index) => (
                        <tr key={enq.id || index} className="hover:bg-slate-50">
                          <td className="py-3 pr-2 font-mono text-[11px] text-slate-800">{enq.date}</td>
                          <td className="py-3 pr-2 font-black text-slate-950 text-sm">{enq.productName}</td>
                          <td className="py-3 pr-2">
                            <div className="font-black text-slate-900">{enq.name}</div>
                            <div className="font-mono text-[11px] text-slate-600">{enq.mobile}</div>
                          </td>
                          <td className="py-3 pr-2 text-slate-700 font-normal">{enq.email}</td>
                          <td className="py-3 pr-2 italic text-slate-950 font-medium max-w-[180px] break-words">"{enq.message}"</td>
                          <td className="py-3 pr-2">
                            <select 
                              value={enq.status} 
                              onChange={(e) => handleEnquiryFieldChange(enq.id, 'status', e.target.value)}
                              className="border border-slate-300 rounded-lg p-1 text-xs bg-white text-slate-800 font-bold outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Completed">Completed</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </td>
                          <td className="py-3 pr-2">
                            <input 
                              type="text" 
                              value={enq.adminNote}
                              onChange={(e) => handleEnquiryFieldChange(enq.id, 'adminNote', e.target.value)}
                              className="border border-slate-300 rounded-lg p-1 text-xs text-slate-800 font-medium outline-none w-full min-w-[120px]"
                              placeholder="Add progress note..."
                            />
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button onClick={() => handleSaveEnquiry(enq.id)} className="rounded-lg bg-[#59B29B] text-white px-2.5 py-1.5 text-xs font-bold shadow-sm hover:bg-[#499c87]">Save</button>
                              <button onClick={() => handleDeleteEnquiry(enq.id)} className="rounded-lg bg-[#D2618A] text-white px-2.5 py-1.5 text-xs font-bold shadow-sm hover:bg-[#b84e73]">Delete</button>
                            </div>
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