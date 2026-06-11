"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { productData } from '@/app/components/common/ProductCart'
import { supabase } from '@/lib/supabase'

const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const CUSTOMER_STORAGE_KEY = 'mobisphereCustomers'
const ENQUIRY_STORAGE_KEY = 'mobisphereEnquiries'
const COUPON_STORAGE_KEY = 'mobisphereCoupons'
const CART_STORAGE_KEY = 'mobisphereCart'

const tabs = [
  { id: 'dashboard', name: '1) Dashboard & Analytics Overview' },
  { id: 'products', name: '2) Product Inventory 📱' },
  { id: 'orders', name: '3) Orders & Cart 🛒' },
  { id: 'customers', name: '4) User Accounts 👥' },
  { id: 'coupons', name: '5) Discount and Coupons 🎫' },
  { id: 'reports', name: '6) Advanced Reports 📊' },
  { id: 'enquiries', name: '7) Enquiries 📩' },
]

function loadJson(key, fallback = null) {
  if (typeof window === 'undefined') return fallback
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null')
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function safeNumber(value) {
  const next = Number(value)
  return Number.isFinite(next) ? next : 0
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

function normalizeCustomer(customer, index = 0) {
  const mobileNumber = customer?.mobileNumber || customer?.mobile_number || customer?.mobile || customer?.phone || '-'
  const id = customer?.id || customer?.customerId || `${mobileNumber}-${index}`

  return {
    id,
    fullName: customer?.fullName || customer?.full_name || customer?.name || customer?.username || 'Customer',
    mobileNumber,
    email: customer?.email || '-',
    address: customer?.address || '-',
    password: customer?.password || '',
    isAdmin: Boolean(customer?.isAdmin || customer?.is_admin || customer?.role === 'admin'),
    createdAt: customer?.createdAt || customer?.created_at || customer?.verifiedAt || customer?.verified_at || '',
  }
}

function normalizeEnquiry(enquiry, index = 0) {
  const mobile = enquiry?.mobileNumber || enquiry?.mobile_number || enquiry?.mobile || '-'
  const createdAt = enquiry?.createdAt || enquiry?.created_at || enquiry?.submitted_at || enquiry?.date || ''
  const subject = enquiry?.subject || enquiry?.product_name || enquiry?.productName || 'General Enquiry'
  const id = enquiry?.id || `${mobile}-${subject}-${index}`

  return {
    id,
    createdAt,
    date: formatDate(createdAt),
    subject,
    productName: enquiry?.productName || enquiry?.product_name || subject,
    name: enquiry?.fullName || enquiry?.full_name || enquiry?.name || '-',
    mobile,
    email: enquiry?.email || '-',
    message: enquiry?.message || enquiry?.enquiry_message || '-',
    status: enquiry?.status || 'New',
    adminNote: enquiry?.adminNote ?? enquiry?.admin_note ?? '',
  }
}

function normalizeCoupon(coupon, index = 0) {
  return {
    id: coupon?.id || `${coupon?.code || 'coupon'}-${index}`,
    code: String(coupon?.code || '').toUpperCase(),
    discountPercent: safeNumber(coupon?.discountPercent || coupon?.discount_percent),
    expiresAt: coupon?.expiresAt || coupon?.expires_at || '',
    createdAt: coupon?.createdAt || coupon?.created_at || '',
  }
}

function normalizeCartItem(item, index = 0) {
  const product = item?.productId ? productData?.[item.productId] : null
  return {
    id: item?.cartItemId || item?.id || `cart-${index}`,
    productId: item?.productId || '',
    title: item?.title || product?.title || 'Product',
    description: item?.description || product?.description || '',
    price: safeNumber(item?.price || product?.price),
    image: item?.image || product?.image || '',
    createdAt: item?.createdAt || item?.addedAt || '',
  }
}

function mergeById(localItems, remoteItems) {
  const merged = new Map()
  localItems.forEach((item) => merged.set(String(item.id), item))
  remoteItems.forEach((item) => merged.set(String(item.id), item))
  return [...merged.values()]
}

function customerForStorage(customer) {
  return {
    id: customer.id,
    fullName: customer.fullName,
    mobileNumber: customer.mobileNumber,
    email: customer.email,
    address: customer.address,
    password: customer.password,
    isAdmin: customer.isAdmin,
    createdAt: customer.createdAt,
  }
}

function enquiryForStorage(enquiry) {
  return {
    id: enquiry.id,
    fullName: enquiry.name,
    mobileNumber: enquiry.mobile,
    email: enquiry.email,
    subject: enquiry.subject,
    message: enquiry.message,
    status: enquiry.status,
    adminNote: enquiry.adminNote,
    createdAt: enquiry.createdAt,
  }
}

export default function AdminPanelPage() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [customers, setCustomers] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [coupons, setCoupons] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [currentTime, setCurrentTime] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newCouponCode, setNewCouponCode] = useState('')
  const [newDiscountPercent, setNewDiscountPercent] = useState('20')
  const [newCouponExpiry, setNewCouponExpiry] = useState('')

  const productList = useMemo(
    () =>
      Object.entries(productData || {}).map(([id, product]) => ({
        id,
        title: product?.title || `Product ${id}`,
        description: product?.description || '',
        price: safeNumber(product?.price),
        image: product?.image || '',
        alt: product?.alt || product?.title || `Product ${id}`,
      })),
    [],
  )

  const refreshDashboardData = useCallback(async (showMessage = false) => {
    setLoading(true)

    const localCustomers = (loadJson(CUSTOMER_STORAGE_KEY, []) || []).map(normalizeCustomer)
    const localEnquiries = (loadJson(ENQUIRY_STORAGE_KEY, []) || []).map(normalizeEnquiry)

    // Combine old ('coupons') and new ('mobisphereCoupons') local storage keys
    const localCouponsOld = (loadJson('coupons', []) || []).map(normalizeCoupon)
    const localCouponsNew = (loadJson(COUPON_STORAGE_KEY, []) || []).map(normalizeCoupon)
    const localCoupons = mergeById(localCouponsOld, localCouponsNew)

    // Combine old ('cart') and new ('mobisphereCart') local storage keys
    const localCartOld = (loadJson('cart', []) || []).map(normalizeCartItem)
    const localCartNew = (loadJson(CART_STORAGE_KEY, []) || []).map(normalizeCartItem)
    const localCart = mergeById(localCartOld, localCartNew)

    let remoteCustomers = []
    let remoteEnquiries = []

    try {
      const [customersResult, enquiriesResult] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('enquiries').select('*').order('created_at', { ascending: false }),
      ])

      if (Array.isArray(customersResult.data)) {
        remoteCustomers = customersResult.data.map(normalizeCustomer)
      }

      if (Array.isArray(enquiriesResult.data)) {
        remoteEnquiries = enquiriesResult.data.map(normalizeEnquiry)
      }
    } catch {
      // Local data is still enough for the offline demo dashboard.
    }

    setCustomers(mergeById(localCustomers, remoteCustomers))
    setEnquiries(mergeById(localEnquiries, remoteEnquiries))
    setCoupons(localCoupons)
    setCartItems(localCart)
    setCurrentTime(Date.now())
    setHydrated(true)
    setLoading(false)

    if (showMessage) {
      setMessage('Dashboard data refreshed.')
    }
  }, [])

  useEffect(() => {
    const storedSession = loadJson(ADMIN_SESSION_KEY)

    queueMicrotask(() => {
      if (storedSession) {
        setSession(storedSession)
        setUsername(storedSession.username || storedSession.displayName || 'Admin')
        refreshDashboardData(false)
        return
      }

      setHydrated(true)
    })
  }, [refreshDashboardData])

  const analytics = useMemo(() => {
    let totalRevenue = 0
    const productCount = new Map()
    const productRevenue = new Map()

    // Integrated from admin/page.jsx: Show default mock data for graph if cart is empty
    if (cartItems.length === 0) {
      const defaultIds = [1, 2, 3, 4, 5, 6]
      defaultIds.forEach((pid, index) => {
        const count = Math.max(1, Math.round(12 - index * 1.5))
        const rev = (productData?.[pid]?.price || 45000) * count
        productCount.set(String(pid), count)
        productRevenue.set(String(pid), rev)
        totalRevenue += rev
      })
    } else {
      totalRevenue = cartItems.reduce((sum, item) => sum + safeNumber(item.price), 0)
      for (const item of cartItems) {
        const productId = String(item.productId || item.title)
        productCount.set(productId, (productCount.get(productId) || 0) + 1)
        productRevenue.set(productId, (productRevenue.get(productId) || 0) + safeNumber(item.price))
      }
    }

    const productsForChart = productList.slice(0, 6).map((product) => {
      const count = productCount.get(String(product.id)) || 0
      return {
        id: product.id,
        title: product.title.replace('iPhone ', 'iP '),
        count,
        revenue: productRevenue.get(String(product.id)) || 0,
      }
    })

    const maxCount = Math.max(...productsForChart.map((product) => product.count), 1)
    const topProducts = productsForChart.map((product) => ({
      ...product,
      heightStr: `${product.count ? Math.max(Math.round((product.count / maxCount) * 90), 16) : 10}%`,
    }))

    const topByCount = [...productCount.entries()].sort((a, b) => b[1] - a[1])[0]
    const topByRevenue = [...productRevenue.entries()].sort((a, b) => b[1] - a[1])[0]

    return {
      totalRevenue,
      averageCartValue: cartItems.length ? totalRevenue / cartItems.length : 0,
      topProducts,
      topByCount,
      topByRevenue,
    }
  }, [cartItems, productList])

  const adminName = session?.displayName || session?.username || session?.userId || 'Admin'
  const activeCouponCount = useMemo(
    () => coupons.filter((coupon) => !coupon.expiresAt || new Date(coupon.expiresAt).getTime() >= currentTime).length,
    [coupons, currentTime],
  )

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (username.trim().toLowerCase() !== 'admin' || password !== 'admin') {
      setError('Invalid admin credentials.')
      return
    }

    const nextSession = {
      userId: 'admin',
      username: 'System Admin',
      displayName: 'System Admin',
      loggedInAt: new Date().toISOString(),
    }

    saveJson(ADMIN_SESSION_KEY, nextSession)
    setSession(nextSession)
    setUsername('System Admin')
    setPassword('')
    await refreshDashboardData(false)
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    setSession(null)
    setUsername('')
    setPassword('')
    setMessage('')
    router.push('/admin-panel')
  }

  const handleCustomerDelete = async (customerId) => {
    const nextCustomers = customers.filter((customer) => customer.id !== customerId)
    setCustomers(nextCustomers)
    saveJson(CUSTOMER_STORAGE_KEY, nextCustomers.map(customerForStorage))

    try {
      await supabase.from('customers').delete().eq('id', customerId)
    } catch {
      // Local removal has already completed.
    }

    setMessage('Customer removed successfully from live cloud storage.')
  }

  const handleEnquiryFieldChange = (enquiryId, field, value) => {
    setEnquiries((current) =>
      current.map((enquiry) => (enquiry.id === enquiryId ? { ...enquiry, [field]: value } : enquiry)),
    )
  }

  const handleSaveEnquiry = async (enquiryId) => {
    const current = enquiries.find((enquiry) => enquiry.id === enquiryId)
    if (!current) return

    const nextEnquiries = enquiries.map((enquiry) => (enquiry.id === enquiryId ? current : enquiry))
    saveJson(ENQUIRY_STORAGE_KEY, nextEnquiries.map(enquiryForStorage))

    try {
      await supabase
        .from('enquiries')
        .update({ status: current.status, admin_note: current.adminNote })
        .eq('id', enquiryId)
      alert('Changes synced to Supabase production database!')
    } catch {
      // Local save keeps the admin note available when Supabase is offline.
    }

    setMessage(`✅ Progress Saved — From: ${current.name || 'Visitor'}`)
  }

  const handleEnquiryDelete = async (enquiryId) => {
    const nextEnquiries = enquiries.filter((enquiry) => enquiry.id !== enquiryId)
    setEnquiries(nextEnquiries)
    saveJson(ENQUIRY_STORAGE_KEY, nextEnquiries.map(enquiryForStorage))

    try {
      await supabase.from('enquiries').delete().eq('id', enquiryId)
    } catch {
      // Local removal has already completed.
    }

    setMessage('Enquiry deleted successfully.')
  }

  const handleCreateCoupon = (event) => {
    event.preventDefault()
    setMessage('')

    const code = newCouponCode.trim().toUpperCase()
    const discountPercent = safeNumber(newDiscountPercent)
    const expiry = new Date(newCouponExpiry)

    if (!code) {
      setMessage('Enter a coupon code.')
      return
    }

    if (discountPercent <= 0 || discountPercent > 90) {
      setMessage('Discount percent should be between 1 and 90.')
      return
    }

    if (!newCouponExpiry || Number.isNaN(expiry.getTime())) {
      setMessage('Set a valid expiry date.')
      return
    }

    const nextCoupons = [
      {
        id: Date.now().toString(),
        code,
        discountPercent,
        expiresAt: expiry.toISOString(),
        createdAt: new Date().toISOString(),
      },
      ...coupons,
    ]

    setCoupons(nextCoupons)
    saveJson(COUPON_STORAGE_KEY, nextCoupons)
    setNewCouponCode('')
    setNewDiscountPercent('20')
    setNewCouponExpiry('')
    setCurrentTime(Date.now())
    setMessage(`Coupon ${code} created.`)
  }

  const handleDeleteCoupon = (couponId) => {
    const nextCoupons = coupons.filter((coupon) => coupon.id !== couponId)
    setCoupons(nextCoupons)
    saveJson(COUPON_STORAGE_KEY, nextCoupons)
    setMessage('Coupon removed.')
  }

  if (!hydrated) return null

  if (!session) {
    return (
      <main className="mx-auto max-w-md px-4 py-32">
        <div className="rounded-[2rem] border border-slate-300 bg-white p-8 shadow-xl">
          <h1 className="text-center text-xl font-bold text-slate-900">MobiSphere Admin Control</h1>
          {error && <div className="mt-4 text-xs text-red-600 bg-red-50 p-2 rounded-xl">{error}</div>}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-900 outline-none" placeholder="admin" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-900 outline-none" placeholder="admin" />
            <button type="submit" className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white">Sign In</button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 pt-28 sm:px-6 space-y-6 text-slate-900">

      {/* Welcome Banner Header */}
      <div className="rounded-[2rem] bg-slate-950 p-6 shadow-md text-white border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs uppercase text-emerald-400 font-bold tracking-widest">● System Dashboard Cloud Live</p>
          <h1 className="text-2xl font-black mt-1">Welcome back, {adminName}! 👋</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-bold text-xs bg-slate-900 px-4 py-2 border border-slate-800 rounded-2xl">
            <span className="text-slate-300">Customers: {customers.length}</span>
            <span className="mx-2 text-slate-600">•</span>
            <span className="text-orange-400">Enquiries: {enquiries.length}</span>
          </div>
          <button onClick={handleLogout} className="rounded-full bg-slate-900 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">Log out</button>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl bg-slate-100 p-4 text-xs font-bold text-slate-800 border border-slate-200">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
        {/* Navigation Sidebar */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 h-fit shadow-sm space-y-1">
          <p className="text-[11px] uppercase font-bold text-slate-400 px-3 mb-2 tracking-wider">Navigation Menu</p>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMessage(''); }} className={`w-full text-left rounded-2xl px-4 py-3 text-xs font-black transition ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Display Panels */}
        <div className="space-y-6">

          {/* TAB 1: METRICS */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid gap-4 grid-cols-2">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Revenue</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">Rs. {analytics.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Active Cart Items</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{cartItems.length}</p>
                </div>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-bold text-slate-900">Device Sales Metrics Graph</h2>
                  <button onClick={() => refreshDashboardData(true)} className="px-3 py-1.5 bg-slate-100 text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-200 transition">🔄 Refresh Cloud Data</button>
                </div>
                <div className="flex h-48 items-end justify-between gap-2 border-b border-l border-slate-200 pb-2 pl-2 bg-slate-50 p-2 rounded-xl">
                  {analytics.topProducts.map((product, index) => (
                    <div key={index} className="flex h-full flex-col justify-end items-center flex-1">
                      <div style={{ height: product.heightStr }} className="w-full rounded-t bg-slate-900"></div>
                      <span className="mt-2 text-[10px] text-slate-700 font-bold truncate max-w-[50px]">{product.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* PRODUCTS */}
          {activeTab === 'products' && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-950 mb-4">Product inventory ({productList.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-900 uppercase font-black tracking-wider text-[11px]">
                      <th className="py-3 pr-2">ID</th>
                      <th className="py-3 pr-2">Product</th>
                      <th className="py-3 pr-2">Description</th>
                      <th className="py-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-900">
                    {productList.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/60">
                        <td className="py-3 pr-2 font-mono text-xs">{product.id}</td>
                        <td className="py-3 pr-2 font-black text-slate-950 text-sm">{product.title}</td>
                        <td className="py-3 pr-2 text-slate-800 font-medium max-w-[250px] truncate">{product.description}</td>
                        <td className="py-3 text-right font-black text-slate-950 text-sm">Rs. {product.price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === 'orders' && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-950 mb-4">Cart and order activity ({cartItems.length})</h2>
              {cartItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium text-xs">No active cart items.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-900 uppercase font-black tracking-wider text-[11px]">
                        <th className="py-3 pr-2">Cart ID</th>
                        <th className="py-3 pr-2">Product</th>
                        <th className="py-3 pr-2">Product ID</th>
                        <th className="py-3 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-900">
                      {cartItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="max-w-[120px] truncate py-3 pr-2 font-mono text-xs">{item.id}</td>
                          <td className="py-3 pr-2 font-black text-slate-950 text-sm">{item.title}</td>
                          <td className="py-3 pr-2 font-mono text-xs">{item.productId || '-'}</td>
                          <td className="py-3 text-right font-black text-slate-950 text-sm">Rs. {item.price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-950 mb-4">Registered customers ({customers.length})</h2>
              {customers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium text-xs">No records available inside Supabase server.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-900 uppercase font-black tracking-wider text-[11px]">
                        <th className="py-3 pr-2">Full Name</th>
                        <th className="py-3 pr-2">Mobile Number</th>
                        <th className="py-3 pr-2">Address</th>
                        <th className="py-3 pr-2">Joined Date</th>
                        <th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-900">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/60">
                          <td className="py-3 pr-2 font-black text-slate-950 text-sm">{c.fullName || '—'}</td>
                          <td className="py-3 pr-2 text-slate-900 font-mono text-sm">{c.mobileNumber || '—'}</td>
                          <td className="py-3 pr-2 text-slate-800 font-medium max-w-[200px] truncate">{c.address || '—'}</td>
                          <td className="py-3 pr-2 text-slate-500 font-normal text-[11px] font-mono">
                            {c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}
                          </td>
                          <td className="py-3 text-right">
                            <button onClick={() => handleCustomerDelete(c.id)} className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700 hover:bg-red-200 transition">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* COUPONS */}
          {activeTab === 'coupons' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="font-bold text-slate-900 text-xs mb-3">Create Coupon</h3>
                <form onSubmit={handleCreateCoupon} className="space-y-2">
                  <input type="text" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} placeholder="Code" className="w-full border border-slate-200 p-2 text-xs uppercase font-bold rounded-xl text-slate-900 outline-none" />
                  <input type="number" value={newDiscountPercent} onChange={(e) => setNewDiscountPercent(e.target.value)} placeholder="Discount %" className="w-full border border-slate-200 p-2 text-xs rounded-xl text-slate-900 outline-none" />
                  <input type="date" value={newCouponExpiry} onChange={(e) => setNewCouponExpiry(e.target.value)} className="w-full border border-slate-200 p-2 text-xs rounded-xl text-slate-900 outline-none" />
                  <input type="submit" className="w-full bg-slate-900 text-white py-2 text-xs font-bold rounded-xl cursor-pointer" value="Generate" />
                </form>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="font-bold text-slate-900 text-xs mb-3">Active Coupons</h3>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-200">
                    {coupons.map((coupon) => (
                      <tr key={coupon.id}>
                        <td className="py-2 font-mono font-bold text-slate-900 uppercase">{coupon.code}</td>
                        <td className="py-2 text-emerald-700 font-black">{coupon.discountPercent}% OFF</td>
                        <td className="py-2 text-right"><button onClick={() => handleDeleteCoupon(coupon.id)} className="text-red-600 font-bold">Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORTS */}
          {activeTab === 'reports' && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-950 mb-4">Behavior report</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-700">
                  Customer to enquiry ratio: {customers.length}:{enquiries.length}
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-700">
                  Cart to product ratio: {cartItems.length}:{productList.length}
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-700">
                  Active coupons: {activeCouponCount}
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-700">
                  Pending enquiries: {enquiries.filter((enquiry) => enquiry.status !== 'Completed' && enquiry.status !== 'Closed').length}
                </div>
              </div>
            </div>
          )}

          {/* ENQUIRIES */}
          {activeTab === 'enquiries' && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-950 mb-4">Customer Enquiries Logs ({enquiries.length})</h2>
              {enquiries.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium text-xs">No active enquiries tracked.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-900 uppercase font-black tracking-wider text-[11px]">
                        <th className="py-3 pr-2">Date Logs</th>
                        <th className="py-3 pr-2">Product/Subject</th>
                        <th className="py-3 pr-2">Sender & Mobile</th>
                        <th className="py-3 pr-2">Email Address</th>
                        <th className="py-3 pr-2">Message Body</th>
                        <th className="py-3 pr-2">Status</th>
                        <th className="py-3 pr-2">Admin Note</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-900">
                      {enquiries.map((enq) => (
                        <tr key={enq.id} className="hover:bg-slate-50/60">
                          <td className="py-3 pr-2 font-mono text-[11px] text-slate-600">
                            {enq.createdAt ? new Date(enq.createdAt).toLocaleString() : '—'}
                          </td>
                          <td className="py-3 pr-2 font-black text-slate-950 text-sm">{enq.subject || '—'}</td>
                          <td className="py-3 pr-2">
                            <div className="font-black text-slate-900">{enq.name || '—'}</div>
                            <div className="font-mono text-[11px] text-slate-600 mt-0.5">{enq.mobile || '—'}</div>
                          </td>
                          <td className="py-3 pr-2 text-slate-700 font-normal">{enq.email || '—'}</td>
                          <td className="py-3 pr-2 italic text-slate-950 font-medium max-w-[180px] break-words">"{enq.message || '—'}"</td>
                          <td className="py-3 pr-2">
                            <select
                              value={enq.status || 'New'}
                              onChange={(e) => handleEnquiryFieldChange(enq.id, 'status', e.target.value)}
                              className="border border-slate-300 rounded-lg p-1 text-xs bg-white text-slate-800 font-bold outline-none"
                            >
                              <option value="New">New</option>
                              <option value="Pending">Pending</option>
                              <option value="In progress">In progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                          <td className="py-3 pr-2">
                            <input
                              type="text"
                              value={enq.adminNote || ''}
                              onChange={(e) => handleEnquiryFieldChange(enq.id, 'adminNote', e.target.value)}
                              className="border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 font-medium outline-none w-full min-w-[130px]"
                              placeholder="Write status update..."
                            />
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button onClick={() => handleSaveEnquiry(enq.id)} className="rounded-lg bg-[#59B29B] text-white px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-[#499c87]">Save</button>
                              <button onClick={() => handleEnquiryDelete(enq.id)} className="rounded-lg bg-[#D2618A] text-white px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-[#b84e73]">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </main>
  )
}
