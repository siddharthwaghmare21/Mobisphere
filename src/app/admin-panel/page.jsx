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
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'products', name: 'Products' },
  { id: 'orders', name: 'Orders / Cart' },
  { id: 'customers', name: 'Customers' },
  { id: 'coupons', name: 'Coupons' },
  { id: 'reports', name: 'Reports' },
  { id: 'enquiries', name: 'Enquiries' },
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
    const localCoupons = (loadJson(COUPON_STORAGE_KEY, []) || []).map(normalizeCoupon)
    const localCart = (loadJson(CART_STORAGE_KEY, []) || []).map(normalizeCartItem)

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
    const totalRevenue = cartItems.reduce((sum, item) => sum + safeNumber(item.price), 0)
    const productCount = new Map()
    const productRevenue = new Map()

    for (const item of cartItems) {
      const productId = String(item.productId || item.title)
      productCount.set(productId, (productCount.get(productId) || 0) + 1)
      productRevenue.set(productId, (productRevenue.get(productId) || 0) + safeNumber(item.price))
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

    setMessage('Customer removed successfully.')
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
    } catch {
      // Local save keeps the admin note available when Supabase is offline.
    }

    setMessage('Enquiry progress saved.')
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
      <main className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
          <p className="text-center text-sm uppercase tracking-[0.3em] text-slate-500">Admin panel</p>
          <h1 className="mt-3 text-center text-2xl font-semibold text-slate-950">MobiSphere Admin Login</h1>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm text-slate-700">
              <span>Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                placeholder="admin"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
              <span>Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                placeholder="admin"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Login
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <section className="mb-6 rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Admin panel</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back, {adminName}</h1>
            <p className="mt-2 text-sm text-slate-300">
              Customers, enquiries, cart activity, coupons, products, and reports are now in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => refreshDashboardData(true)}
              disabled={loading}
              className="rounded-full border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </section>

      {message ? (
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Menu</p>
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === tab.id ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          {activeTab === 'dashboard' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">Rs. {analytics.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customers</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{customers.length}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enquiries</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{enquiries.length}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coupons</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{coupons.length}</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Device sales graph</h2>
                    <p className="mt-1 text-sm text-slate-500">Based on current cart/order activity.</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Cart items: {cartItems.length}</p>
                </div>

                <div className="flex h-64 items-end justify-between gap-2 rounded-2xl border-b border-l border-slate-200 bg-slate-50 p-4">
                  {analytics.topProducts.map((product) => (
                    <div key={product.id} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <div className="text-[10px] font-semibold text-slate-500">{product.count}</div>
                      <div
                        style={{ height: product.heightStr }}
                        className="w-full rounded-t-lg bg-slate-950 transition hover:bg-emerald-600"
                      />
                      <span className="w-full truncate text-center text-[10px] font-semibold text-slate-600">
                        {product.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {activeTab === 'products' ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-950">Product inventory ({productList.length})</h2>
                <p className="mt-1 text-sm text-slate-500">Products loaded from the current product catalog.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-3 pr-4">ID</th>
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 pr-4">Description</th>
                      <th className="py-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productList.map((product) => (
                      <tr key={product.id} className="text-slate-700">
                        <td className="py-3 pr-4 font-mono text-xs">{product.id}</td>
                        <td className="py-3 pr-4 font-semibold text-slate-950">{product.title}</td>
                        <td className="max-w-md py-3 pr-4 text-slate-600">{product.description}</td>
                        <td className="py-3 text-right font-semibold text-slate-950">
                          Rs. {product.price.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === 'orders' ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Cart and order activity ({cartItems.length})</h2>
                  <p className="mt-1 text-sm text-slate-500">Current local cart entries are shown as order activity.</p>
                </div>
                <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
                  Total: Rs. {analytics.totalRevenue.toLocaleString()}
                </p>
              </div>

              {cartItems.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  No cart items found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-3 pr-4">Cart ID</th>
                        <th className="py-3 pr-4">Product</th>
                        <th className="py-3 pr-4">Product ID</th>
                        <th className="py-3 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cartItems.map((item) => (
                        <tr key={item.id} className="text-slate-700">
                          <td className="max-w-[180px] truncate py-3 pr-4 font-mono text-xs">{item.id}</td>
                          <td className="py-3 pr-4 font-semibold text-slate-950">{item.title}</td>
                          <td className="py-3 pr-4 font-mono text-xs">{item.productId || '-'}</td>
                          <td className="py-3 text-right font-semibold text-slate-950">
                            Rs. {item.price.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'customers' ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-950">Registered customers ({customers.length})</h2>
                <p className="mt-1 text-sm text-slate-500">Customer data from Supabase and local account storage.</p>
              </div>

              {customers.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  No customer records are available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-3 pr-4">Name</th>
                        <th className="py-3 pr-4">Mobile</th>
                        <th className="py-3 pr-4">Email</th>
                        <th className="py-3 pr-4">Address</th>
                        <th className="py-3 pr-4">Role</th>
                        <th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="text-slate-700">
                          <td className="py-3 pr-4 font-semibold text-slate-950">{customer.fullName}</td>
                          <td className="py-3 pr-4 font-mono text-xs">{customer.mobileNumber}</td>
                          <td className="py-3 pr-4">{customer.email}</td>
                          <td className="max-w-[220px] truncate py-3 pr-4">{customer.address}</td>
                          <td className="py-3 pr-4">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                              {customer.isAdmin ? 'Admin' : 'Customer'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleCustomerDelete(customer.id)}
                              className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'coupons' ? (
            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Create coupon</h2>
                <form onSubmit={handleCreateCoupon} className="mt-5 space-y-4">
                  <label className="block space-y-2 text-sm text-slate-700">
                    <span>Coupon code</span>
                    <input
                      value={newCouponCode}
                      onChange={(event) => setNewCouponCode(event.target.value)}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold uppercase text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                      placeholder="FESTIVAL20"
                    />
                  </label>
                  <label className="block space-y-2 text-sm text-slate-700">
                    <span>Discount percent</span>
                    <input
                      value={newDiscountPercent}
                      onChange={(event) => setNewDiscountPercent(event.target.value)}
                      type="number"
                      min={1}
                      max={90}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <label className="block space-y-2 text-sm text-slate-700">
                    <span>Expiry date</span>
                    <input
                      value={newCouponExpiry}
                      onChange={(event) => setNewCouponExpiry(event.target.value)}
                      type="date"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Create Coupon
                  </button>
                </form>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Active coupons ({coupons.length})</h2>
                    <p className="mt-1 text-sm text-slate-500">Saved in the same coupon store used by the coupon page.</p>
                  </div>
                  <Link href="/discount-coupons" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                    Open page
                  </Link>
                </div>

                {coupons.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                    No coupons added yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coupons.map((coupon) => {
                      const expiry = coupon.expiresAt ? new Date(coupon.expiresAt) : null
                      const isExpired = expiry && !Number.isNaN(expiry.getTime()) && expiry.getTime() < currentTime

                      return (
                        <div
                          key={coupon.id}
                          className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-mono text-sm font-bold text-slate-950">{coupon.code}</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {coupon.discountPercent}% off - Expires {coupon.expiresAt ? formatDate(coupon.expiresAt) : '-'}
                            </p>
                            <p className={`mt-1 text-xs font-semibold ${isExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'reports' ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average cart value</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    Rs. {Math.round(analytics.averageCartValue).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top units</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">
                    {analytics.topByCount?.[0] ? productData?.[analytics.topByCount[0]]?.title || analytics.topByCount[0] : '-'}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top revenue</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">
                    {analytics.topByRevenue?.[0]
                      ? productData?.[analytics.topByRevenue[0]]?.title || analytics.topByRevenue[0]
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Behavior report</h2>
                    <p className="mt-1 text-sm text-slate-500">A compact report from customers, enquiries, coupons, and cart activity.</p>
                  </div>
                  <Link href="/advanced-reports" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                    Open reports
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    Customer to enquiry ratio: {customers.length}:{enquiries.length}
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    Cart to product ratio: {cartItems.length}:{productList.length}
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    Active coupons: {activeCouponCount}
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    Pending enquiries: {enquiries.filter((enquiry) => enquiry.status !== 'Completed' && enquiry.status !== 'Closed').length}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'enquiries' ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-950">Customer enquiries ({enquiries.length})</h2>
                <p className="mt-1 text-sm text-slate-500">Enquiries from Supabase and local fallback storage.</p>
              </div>

              {enquiries.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  No enquiries found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 pr-4">Subject</th>
                        <th className="py-3 pr-4">Customer</th>
                        <th className="py-3 pr-4">Message</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 pr-4">Admin note</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enquiries.map((enquiry) => (
                        <tr key={enquiry.id} className="align-top text-slate-700">
                          <td className="py-3 pr-4 font-mono text-xs">{enquiry.date}</td>
                          <td className="py-3 pr-4 font-semibold text-slate-950">{enquiry.subject}</td>
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-slate-900">{enquiry.name}</p>
                            <p className="font-mono text-xs text-slate-500">{enquiry.mobile}</p>
                            <p className="text-xs text-slate-500">{enquiry.email}</p>
                          </td>
                          <td className="max-w-[220px] py-3 pr-4">{enquiry.message}</td>
                          <td className="py-3 pr-4">
                            <select
                              value={enquiry.status}
                              onChange={(event) => handleEnquiryFieldChange(enquiry.id, 'status', event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                            >
                              <option value="New">New</option>
                              <option value="Pending">Pending</option>
                              <option value="In progress">In progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                          <td className="py-3 pr-4">
                            <input
                              value={enquiry.adminNote}
                              onChange={(event) => handleEnquiryFieldChange(enquiry.id, 'adminNote', event.target.value)}
                              className="w-full min-w-[180px] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                              placeholder="Progress note"
                            />
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveEnquiry(enquiry.id)}
                                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEnquiryDelete(enquiry.id)}
                                className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
