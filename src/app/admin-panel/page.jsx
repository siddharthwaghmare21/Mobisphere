"use client"

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { productData } from '@/app/components/common/ProductCart'
import { supabase } from '@/lib/supabase'
import { useProductContext } from '@/app/context/ProductContext'

// Storage Keys
const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const COUPON_STORAGE_KEY = 'mobisphereCoupons'
const ADMIN_USERS_KEY = 'mobisphereAdminUsers'
const CART_STORAGE_KEY = 'mobisphereCart'
const ORDERS_STORAGE_KEY = 'mobisphereOrders'
const ADMIN_ACCESS_KEY = 'ALT+SHIFT+A'

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

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || file.size === 0) {
      resolve('')
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

export default function IntegratedAdminPanelDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [adminUsers, setAdminUsers] = useState([])

  // Admin Login / Signup states
  const [regName, setRegName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [adminAccessKey, setAdminAccessKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [customers, setCustomers] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [activeTab, setActiveTab] = useState(1)
  const [message, setMessage] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Product Inventory States (from global context)
  const { products: localProducts, setProducts: setLocalProducts } = useProductContext()
  const [inventoryView, setInventoryView] = useState('brands') // 'brands', 'products', 'form'
  const [selectedBrand, setSelectedBrand] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)

  const [coupons, setCoupons] = useState([])
  const [newCouponCode, setNewCouponCode] = useState('')
  const [newDiscountPercent, setNewDiscountPercent] = useState('')

  const [orders, setOrders] = useState([
    { id: 'ORD-8X91', customer: 'Rahul Sharma', date: '2024-05-12', total: 125000, status: 'Processing', items: 2 },
    { id: 'ORD-7V22', customer: 'Sneha Patil', date: '2024-05-11', total: 85000, status: 'Shipped', items: 1 },
    { id: 'ORD-4M55', customer: 'Amit Desai', date: '2024-05-10', total: 45000, status: 'Delivered', items: 1 },
    { id: 'ORD-9K33', customer: 'Pooja Joshi', date: '2024-05-09', total: 155000, status: 'Cancelled', items: 2 }
  ])
  const [orderFilter, setOrderFilter] = useState('All')

  // 🔄 Supabase Live Data Fetch
  const fetchData = useCallback(async (showFeedback = false) => {
    if (showFeedback === true) setIsSyncing(true)
    try {
      const { data: cData } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: eData } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false })

      setCustomers(cData || [])
      setEnquiries(eData || [])
      if (showFeedback === true) {
         setMessage('✅ Live server data synced successfully!')
      }
    } catch (err) {
      console.error("Supabase fetch error:", err)
      if (showFeedback === true) {
         setMessage('❌ Failed to sync data with server.')
      }
    } finally {
      if (showFeedback === true) {
         setIsSyncing(false)
         setTimeout(() => setMessage(''), 3000)
      }
    }
  }, [])

  useEffect(() => {
    const session = loadJson(ADMIN_SESSION_KEY)
    const storedAdmins = loadJson(ADMIN_USERS_KEY)
    const storedCoupons = loadJson(COUPON_STORAGE_KEY) || []
    const storedOrders = loadJson(ORDERS_STORAGE_KEY)

    queueMicrotask(() => {
      if (session) {
        setIsLoggedIn(true)
        setUsername(session.username || 'Admin')
      }
      setAdminUsers(Array.isArray(storedAdmins) ? storedAdmins : [])
      setCoupons(storedCoupons)
      if (Array.isArray(storedOrders) && storedOrders.length > 0) {
        setOrders(storedOrders)
      }
      setHydrated(true)
    })

    if (session) {
      queueMicrotask(() => fetchData())
    }
  }, [fetchData])

  // Analytics Graph Logic
  const chartAnalytics = useMemo(() => {
    if (!hydrated) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        shippedOrders: 0,
        totalProducts: 0,
        totalBrands: 0,
        cartItems: 0,
        topProducts: [],
        kpiCards: [],
        statusSummary: [],
        recentOrders: [],
        lastUpdated: ''
      }
    }

    const cartData = loadJson(CART_STORAGE_KEY) || []
    const safeCart = Array.isArray(cartData) ? cartData : []
    const safeOrders = Array.isArray(orders) ? orders : []
    const safeProducts = Array.isArray(localProducts) ? localProducts : []

    const productCount = new Map()
    const productRevenue = new Map()

    if (safeCart.length > 0) {
      safeCart.forEach((item) => {
        const pid = item.productId || item.id || item.title
        if (!pid) return

        const quantity = Number(item.quantity || 1)
        const price = Number(item.price || 0)

        productCount.set(pid, (productCount.get(pid) || 0) + quantity)
        productRevenue.set(pid, (productRevenue.get(pid) || 0) + price * quantity)
      })
    } else {
      const fallbackProducts = safeProducts.length > 0
        ? safeProducts.slice(0, 6)
        : Object.entries(productData || {}).slice(0, 6).map(([id, product]) => ({ id, ...product }))

      fallbackProducts.forEach((product, index) => {
        const pid = product.id || index + 1
        const quantity = Math.max(12 - index * 2, 2)
        const price = Number(product.price || 45000)

        productCount.set(pid, quantity)
        productRevenue.set(pid, price * quantity)
      })
    }

    const sortedProducts = [...productCount.entries()].sort((a, b) => b[1] - a[1])
    const maxCount = Math.max(...[...productCount.values()], 1)

    const topProducts = sortedProducts.slice(0, 6).map(([pid, count]) => {
      const contextProduct =
        safeProducts.find((product) => String(product.id) === String(pid)) ||
        productData?.[pid] ||
        {}

      return {
        title: contextProduct?.title?.replace('iPhone ', 'iP ') || String(pid),
        count,
        revenue: productRevenue.get(pid) || 0,
        heightStr: `${Math.min(Math.round((count / maxCount) * 82 + 12), 96)}%`
      }
    })

    const orderTotal = (order) => Number(order.total || order.totalAmount || order.amount || 0)
    const totalRevenue = safeOrders.reduce((sum, order) => sum + orderTotal(order), 0)
    const fallbackRevenue = [...productRevenue.values()].reduce((sum, value) => sum + value, 0)
    const finalRevenue = totalRevenue > 0 ? totalRevenue : fallbackRevenue

    const countStatus = (status) =>
      safeOrders.filter((order) => String(order.status || '').toLowerCase() === status.toLowerCase()).length

    const processingOrders = countStatus('Processing')
    const shippedOrders = countStatus('Shipped')
    const deliveredOrders = countStatus('Delivered')
    const cancelledOrders = countStatus('Cancelled')

    const totalBrands = new Set(safeProducts.map((product) => product.brand || 'Other Models')).size

    const recentOrders = [...safeOrders]
      .sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || a.created_at || 0).getTime()
        const dateB = new Date(b.date || b.createdAt || b.created_at || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 4)

    const statusSummary = [
      {
        status: 'Processing',
        count: processingOrders,
        className: 'border-amber-200 bg-amber-50 text-amber-700',
        icon: '⏳'
      },
      {
        status: 'Shipped',
        count: shippedOrders,
        className: 'border-blue-200 bg-blue-50 text-blue-700',
        icon: '🚚'
      },
      {
        status: 'Delivered',
        count: deliveredOrders,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: '✅'
      },
      {
        status: 'Cancelled',
        count: cancelledOrders,
        className: 'border-rose-200 bg-rose-50 text-rose-700',
        icon: '✕'
      }
    ]

    return {
      totalRevenue: finalRevenue,
      totalOrders: safeOrders.length,
      pendingOrders: processingOrders,
      deliveredOrders,
      cancelledOrders,
      shippedOrders,
      totalProducts: safeProducts.length,
      totalBrands,
      cartItems: safeCart.length,
      topProducts,
      statusSummary,
      recentOrders,
      lastUpdated: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      kpiCards: [
        {
          label: 'Total Revenue',
          value: `₹${finalRevenue.toLocaleString()}`,
          helper: 'Based on saved orders',
          icon: '₹',
          accent: 'text-emerald-600'
        },
        {
          label: 'Total Orders',
          value: safeOrders.length.toLocaleString(),
          helper: `${processingOrders} processing now`,
          icon: '🛒',
          accent: 'text-slate-900'
        },
        {
          label: 'Total Products',
          value: safeProducts.length.toLocaleString(),
          helper: `${totalBrands} active brands`,
          icon: '📦',
          accent: 'text-blue-600'
        },
        {
          label: 'Customers',
          value: customers.length.toLocaleString(),
          helper: `${enquiries.length} enquiries tracked`,
          icon: '👥',
          accent: 'text-violet-600'
        },
        {
          label: 'Delivered',
          value: deliveredOrders.toLocaleString(),
          helper: 'Completed orders',
          icon: '✅',
          accent: 'text-emerald-600'
        },
        {
          label: 'Pending',
          value: processingOrders.toLocaleString(),
          helper: 'Needs attention',
          icon: '⏳',
          accent: 'text-amber-600'
        },
        {
          label: 'Coupons',
          value: coupons.length.toLocaleString(),
          helper: 'Active offer codes',
          icon: '🎫',
          accent: 'text-pink-600'
        },
        {
          label: 'Cart Activity',
          value: safeCart.length.toLocaleString(),
          helper: 'Local cart records',
          icon: '🧾',
          accent: 'text-cyan-600'
        }
      ]
    }
  }, [hydrated, orders, localProducts, customers.length, enquiries.length, coupons.length])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  // Admin Sign Up / Login Logic
  const resetAuthForm = () => {
    setRegName('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setAdminAccessKey('')
    setShowPassword(false)
    setMessage('')
  }

  const switchAuthMode = (mode) => {
    setIsRegistering(mode === 'signup')
    resetAuthForm()
  }

  const handleAuthSubmit = (e) => {
    e.preventDefault()
    const uname = username.trim()
    const cleanName = regName.trim()
    const cleanAccessKey = adminAccessKey.trim().toUpperCase()

    if (!uname || !password) {
      setMessage('Please enter username and password.')
      return
    }

    if (isRegistering) {
      if (!cleanName) {
        setMessage('Please enter admin full name.')
        return
      }

      if (password.length < 6) {
        setMessage('Password must be at least 6 characters.')
        return
      }

      if (password !== confirmPassword) {
        setMessage('Passwords do not match.')
        return
      }

      if (cleanAccessKey !== ADMIN_ACCESS_KEY) {
        setMessage('Invalid admin access code.')
        return
      }

      const exists = adminUsers.some((admin) => String(admin.username || '').toLowerCase() === uname.toLowerCase())
      if (exists) {
        setMessage('This username already exists. Use another username.')
        return
      }

      const newAdmin = {
        id: Date.now().toString(),
        name: cleanName,
        username: uname,
        password,
        createdAt: new Date().toISOString()
      }
      const updatedAdmins = [...adminUsers, newAdmin]

      setAdminUsers(updatedAdmins)
      saveJson(ADMIN_USERS_KEY, updatedAdmins)
      saveJson(ADMIN_SESSION_KEY, { username: uname, name: cleanName })
      setIsLoggedIn(true)
      setUsername(uname)
      setMessage('')
      fetchData()
      return
    }

    if (!Array.isArray(adminUsers) || adminUsers.length === 0) {
      setMessage('No admin account found. Create admin account using Sign Up.')
      return
    }

    const validAdmin = adminUsers.find(
      (admin) => String(admin.username || '').toLowerCase() === uname.toLowerCase() && admin.password === password
    )

    if (!validAdmin) {
      setMessage('Invalid username or password.')
      return
    }

    saveJson(ADMIN_SESSION_KEY, { username: validAdmin.username, name: validAdmin.name || validAdmin.username })
    setIsLoggedIn(true)
    setUsername(validAdmin.username)
    setMessage('')
    fetchData()
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    setIsLoggedIn(false)
    resetAuthForm()
  }

  const handleCustomerDelete = async (id) => {
    await supabase.from('customers').delete().eq('id', id)
    setCustomers(customers.filter(c => c.id !== id))
    setMessage('Customer deleted successfully.')
  }

  const handleEnquiryFieldChange = (enquiryId, field, value) => {
    setEnquiries(enquiries.map((e) => (e.id === enquiryId ? { ...e, [field]: value } : e)))
  }

  const handleSaveEnquiry = async (id) => {
    const target = enquiries.find(e => e.id === id)
    if (!target) return
    await supabase.from('enquiries').update({
      status: target.status,
      admin_note: target.admin_note
    }).eq('id', id)
    setMessage(`✅ Progress Saved for Enquiry ID: ${id}`)
    alert('Changes saved to Supabase!')
  }

  const handleEnquiryDelete = async (id) => {
    await supabase.from('enquiries').delete().eq('id', id)
    setEnquiries(enquiries.filter(e => e.id !== id))
    setMessage('Enquiry removed.')
  }

  const handleCreateCoupon = (e) => {
    e.preventDefault()
    const code = newCouponCode.trim().toUpperCase()
    const percent = Number(newDiscountPercent)
    if (!code || percent <= 0 || percent > 100) return
    const newCoupon = { id: Date.now().toString(), code, discountPercent: percent }
    const next = [...coupons, newCoupon]
    setCoupons(next)
    saveJson(COUPON_STORAGE_KEY, next)
    setNewCouponCode('')
    setNewDiscountPercent('')
    setMessage('Coupon code activated!')
  }

  const handleDeleteCoupon = (id) => {
    const next = coupons.filter(c => c.id !== id)
    setCoupons(next)
    saveJson(COUPON_STORAGE_KEY, next)
  }

  // --- Product Inventory Logic ---
  const uniqueBrands = [...new Set(localProducts.map(p => p.brand || 'Other Models'))]

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const imageFile = formData.get('image')
    const uploadedImage = imageFile && imageFile.size > 0 ? await fileToDataUrl(imageFile) : ''
    const imageUrl = uploadedImage || editingProduct?.image || '/images/IPhone 16 Pro Max.png'
    const brand = String(formData.get('brand') || 'Other Models').trim()
    const title = String(formData.get('title') || 'Untitled Product').trim()

    const newProd = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      title,
      brand,
      price: Number(formData.get('price')),
      description: String(formData.get('description') || '').trim(),
      image: imageUrl,
      alt: title,
      specs: {
        RAM: formData.get('ram'),
        Storage: formData.get('storage'),
        Camera: formData.get('camera'),
        Battery: formData.get('battery'),
        Processor: formData.get('processor'),
        Charger: formData.get('charger'),
        Tools: formData.get('tools')
      }
    }
    setLocalProducts(prev => editingProduct ? prev.map(p => p.id === newProd.id ? newProd : p) : [...prev, newProd])
    setSelectedBrand(brand)
    setInventoryView('products')
    setEditingProduct(null)
    setMessage(`Product ${editingProduct ? 'updated' : 'added'} successfully!`)
  }

  const handleDeleteProduct = (id) => {
    setLocalProducts(prev => prev.filter(p => p.id !== id))
    setMessage('Product deleted successfully.')
  }

  const handleOrderStatusChange = (id, status) => {
    setOrders(prev => {
      const next = prev.map(order => order.id === id ? { ...order, status } : order)
      saveJson(ORDERS_STORAGE_KEY, next)
      return next
    })
    setMessage(`Order ${id} status updated!`)
  }

  if (!hydrated) return null

  // Auth Interface
  if (!isLoggedIn) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 pb-12 pt-24 font-sans text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

        <section className="relative mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_460px]">
          <div className="hidden lg:block">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-300 shadow-2xl backdrop-blur">
              Mobisphere Admin Control
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-tight tracking-tight xl:text-6xl">
              Manage your mobile store like a premium brand.
            </h1>
            <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-slate-300">
              Product inventory, orders, customers, enquiries, coupons, and reports stay inside one hidden admin workspace.
            </p>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {[
                ['📦', 'Inventory'],
                ['🛒', 'Orders'],
                ['📩', 'Enquiries']
              ].map(([icon, label]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
                  <p className="text-3xl">{icon}</p>
                  <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full">
            <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-2xl sm:p-7 md:rounded-[2.5rem]">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-3xl shadow-xl">
                  🔐
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-emerald-300">Hidden Dashboard</p>
                <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                  {isRegistering ? 'Create Admin Account' : 'Admin Login'}
                </h1>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
                  Access shortcut remains <span className="font-black text-slate-200">Alt + Shift + A</span>.
                </p>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-950/70 p-1.5">
                <button
                  type="button"
                  onClick={() => switchAuthMode('login')}
                  className={`rounded-xl px-4 py-3 text-xs font-black transition ${!isRegistering ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode('signup')}
                  className={`rounded-xl px-4 py-3 text-xs font-black transition ${isRegistering ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Sign Up
                </button>
              </div>

              {message && (
                <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-center text-xs font-black text-rose-200">
                  {message}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {isRegistering && (
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Name</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
                    placeholder="Enter admin username"
                    autoComplete="username"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                  <div className="flex rounded-2xl border border-white/10 bg-slate-950/70 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-400/10">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent p-4 text-sm font-bold text-white outline-none placeholder:text-slate-600"
                      placeholder="Enter password"
                      autoComplete={isRegistering ? 'new-password' : 'current-password'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="px-4 text-xs font-black text-slate-400 hover:text-white"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {isRegistering && (
                  <>
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Access Code</label>
                      <input
                        type="password"
                        value={adminAccessKey}
                        onChange={(e) => setAdminAccessKey(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold uppercase tracking-widest text-white outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
                        placeholder="Enter admin shortcut code"
                        required
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-white py-4 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-emerald-300 active:translate-y-0"
                >
                  {isRegistering ? 'Create Admin Account' : 'Login to Dashboard'}
                </button>
              </form>

              <p className="mt-5 text-center text-[11px] font-semibold leading-5 text-slate-500">
                This is a local admin login system. For real production security, connect proper backend authentication later.
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 pt-28 sm:px-6 font-sans text-slate-900">
      
      {/* 👑 Welcome Header Banner */}
      <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-500 font-bold">● System Dashboard Live</p>
          <h1 className="text-4xl font-black text-slate-900 mt-2">✨ {greeting}, {username}! 👋</h1>
          <p className="text-sm text-slate-500 mt-2 italic">Use this panel to manage customers and enquiries. Shortcut: Alt + Shift + A</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg">
            Customers: {customers.length} • Enquiries: {enquiries.length}
          </div>
          <button onClick={handleLogout} className="text-xs font-bold text-rose-600 hover:underline">Logout Session</button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-xs font-bold text-slate-800 border border-slate-200">
          {message}
        </div>
      )}

      {/* Main Layout Divided into Sidebar & Dashboard Panels */}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        
        {/* 📋 Sidebar Links (7 Tabs System) */}
        <aside className="space-y-2">
          <p className="text-[10px] font-black uppercase text-slate-400 px-4 mb-4 tracking-wider">Navigation Menu</p>
          {[
            { id: 1, icon: '📊', name: 'Dashboard & Analytics' },
            { id: 2, icon: '📦', name: 'Product Inventory' },
            { id: 3, icon: '🛒', name: 'Orders & Tracking' },
            { id: 4, icon: '👥', name: 'Customer Accounts' },
            { id: 5, icon: '🎫', name: 'Coupons & Offers' },
            { id: 6, icon: '📈', name: 'Sales Reports' },
            { id: 7, icon: '📩', name: 'Enquiry Center' },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMessage(''); }} className={`flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}>
              <span>{tab.icon}</span> {tab.name}
            </button>
          ))}

          {/* Dark Quick Actions Info Box */}
          <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
             <h3 className="text-sm font-bold border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
               Quick Actions <span className="text-[9px] text-emerald-400 font-mono bg-emerald-400/10 px-2 py-0.5 rounded-full">v2.2</span>
             </h3>
             <p className="text-[11px] leading-relaxed text-slate-400">Control panel for adding devices, inventory analytics sync, and customer resolution pathways.</p>
          </div>
        </aside>

        {/* 💻 Active Workspace View */}
        <div className="space-y-8">
          
          {/* TAB 1: Dashboard & Analytics */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">
                      Dashboard & Analytics
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                      Store performance overview
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                      Track revenue, orders, inventory, customers, enquiries, and live store activity from one screen.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Last Updated
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {chartAnalytics.lastUpdated || 'Just now'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchData(true)}
                      disabled={isSyncing}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-xs font-black text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className={isSyncing ? 'inline-block animate-spin' : 'inline-block'}>🔄</span>
                      {isSyncing ? 'Syncing...' : 'Sync Live Server'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {chartAnalytics.kpiCards.map((card) => (
                  <article
                    key={card.label}
                    className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 sm:text-[10px]">
                          {card.label}
                        </p>
                        <p className={`mt-2 text-xl font-black sm:text-2xl ${card.accent}`}>
                          {card.value}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-xl shadow-inner">
                        {card.icon}
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-1 text-[11px] font-bold text-slate-500">
                      {card.helper}
                    </p>
                  </article>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-7">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        Top Product Performance
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Based on cart activity and saved order revenue.
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      Live Analytics
                    </span>
                  </div>

                  <div className="flex h-64 items-end justify-between gap-2 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    {chartAnalytics.topProducts.map((product, index) => (
                      <div
                        key={`${product.title}-${index}`}
                        className="group flex h-full flex-1 flex-col items-center justify-end"
                      >
                        <div
                          style={{ height: product.heightStr }}
                          className="relative w-full rounded-t-2xl bg-slate-950 transition-all duration-300 group-hover:bg-emerald-500"
                        >
                          <span className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-[10px] font-black text-white shadow-md group-hover:block">
                            {product.count} units
                          </span>
                        </div>
                        <p className="mt-3 w-full truncate text-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                          {product.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-7">
                  <div className="mb-5">
                    <h3 className="text-lg font-black text-slate-900">
                      Order Status
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Quick view of current delivery pipeline.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {chartAnalytics.statusSummary.map((status) => (
                      <div
                        key={status.status}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${status.className}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{status.icon}</span>
                          <span className="text-xs font-black uppercase tracking-wider">
                            {status.status}
                          </span>
                        </div>
                        <span className="text-lg font-black">
                          {status.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-7">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        Recent Orders
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Latest order activity from your store.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab(3)}
                      className="rounded-full bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-slate-800"
                    >
                      View All
                    </button>
                  </div>

                  {chartAnalytics.recentOrders.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                      <p className="text-sm font-black text-slate-900">No recent orders yet.</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Orders will appear here after customers complete checkout.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full min-w-[620px] text-left">
                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="p-4 font-black">Order ID</th>
                            <th className="p-4 font-black">Customer</th>
                            <th className="p-4 font-black">Total</th>
                            <th className="p-4 font-black text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {chartAnalytics.recentOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/70">
                              <td className="p-4 text-xs font-black text-slate-900">
                                {order.id}
                              </td>
                              <td className="p-4 text-xs font-bold text-slate-600">
                                {order.customer || order.customerName || 'Customer'}
                              </td>
                              <td className="p-4 text-xs font-black text-emerald-600">
                                ₹{Number(order.total || order.totalAmount || 0).toLocaleString()}
                              </td>
                              <td className="p-4 text-right">
                                <span
                                  className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                                    order.status === 'Delivered'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : order.status === 'Shipped'
                                        ? 'bg-blue-50 text-blue-700'
                                        : order.status === 'Cancelled'
                                          ? 'bg-rose-50 text-rose-700'
                                          : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {order.status || 'Processing'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] border border-slate-100 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
                  <div className="mb-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">
                      Admin Shortcuts
                    </p>
                    <h3 className="mt-2 text-xl font-black">
                      Quick Actions
                    </h3>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
                      Jump directly to important admin work without searching through tabs.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null)
                        setInventoryView('form')
                        setActiveTab(2)
                      }}
                      className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-black transition hover:bg-white/15"
                    >
                      <span>Add New Product</span>
                      <span>＋</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab(3)}
                      className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-black transition hover:bg-white/15"
                    >
                      <span>Manage Orders</span>
                      <span>→</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab(5)}
                      className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-black transition hover:bg-white/15"
                    >
                      <span>Create Coupon</span>
                      <span>🎫</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fetchData(true)}
                      disabled={isSyncing}
                      className="flex items-center justify-between rounded-2xl bg-emerald-400 px-4 py-3 text-left text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                    >
                      <span>{isSyncing ? 'Syncing...' : 'Sync Live Data'}</span>
                      <span>🔄</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 👥 TAB 4: Registered Customers */}
          {activeTab === 4 && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <h2 className="text-2xl font-black mb-6">Registered Customers ({customers.length})</h2>
              {customers.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No accounts found in Supabase server.</p>
              ) : (
                <div className="grid gap-4">
                  {customers.map(c => (
                    <div key={c.id} className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-5 rounded-3xl border border-slate-100">
                      <div>
                        <p className="text-lg font-black text-slate-900">{c.full_name || 'No Name Provided'}</p>
                        <p className="text-sm font-bold text-slate-600">📞 {c.mobile_number || '—'} | 📍 {c.address || '—'}</p>
                        <p className="text-[10px] font-mono mt-1 text-slate-400">UUID: {c.id} | Joined: {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}</p>
                      </div>
                      <button onClick={() => handleCustomerDelete(c.id)} className="mt-4 sm:mt-0 px-6 py-2 bg-rose-100 text-rose-600 rounded-full text-xs font-black hover:bg-rose-600 hover:text-white transition">Remove Account</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 🎫 TAB 5: Coupons & Offers */}
          {activeTab === 5 && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="font-black text-slate-900 text-sm mb-4">Create System Coupon</h3>
                <form onSubmit={handleCreateCoupon} className="space-y-3">
                  <input type="text" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} placeholder="COUPON CODE (e.g. IPHONE10)" className="w-full border p-3 text-xs uppercase font-bold rounded-xl text-slate-900 outline-none focus:border-slate-900" />
                  <input type="number" value={newDiscountPercent} onChange={(e) => setNewDiscountPercent(e.target.value)} placeholder="Discount Percentage %" className="w-full border p-3 text-xs rounded-xl text-slate-900 outline-none focus:border-slate-900" />
                  <button type="submit" className="w-full bg-slate-900 text-white py-3 text-xs font-bold rounded-xl hover:bg-slate-800">Generate Coupon</button>
                </form>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="font-black text-slate-900 text-sm mb-4">Active Coupons</h3>
                <div className="overflow-y-auto max-h-[220px] divide-y">
                  {coupons.length === 0 ? <p className="text-xs text-slate-400 py-4">No active coupon parameters saved.</p> : coupons.map((coupon) => (
                    <div key={coupon.id} className="flex justify-between items-center py-2 text-xs">
                      <span className="font-mono font-black text-slate-900 uppercase bg-slate-100 px-2 py-1 rounded-md">{coupon.code}</span>
                      <span className="text-emerald-700 font-black">{coupon.discountPercent}% OFF</span>
                      <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-rose-600 font-bold hover:underline">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 📦 TAB 2: Product Inventory */}
          {activeTab === 2 && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {inventoryView === 'brands' ? 'Brands Inventory' : 
                     inventoryView === 'form' ? (editingProduct ? 'Edit Product' : 'Add New Product') :
                     `${selectedBrand} Products`}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Manage your store products, pricing, and stock status.</p>
                </div>
                {inventoryView !== 'form' && (
                  <button onClick={() => { setEditingProduct(null); setInventoryView('form'); }} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 transition font-bold text-xs flex items-center gap-2">
                    <span>+</span> Add New Product
                  </button>
                )}
              </div>

              {inventoryView === 'brands' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {uniqueBrands.map(brand => (
                    <button key={brand} onClick={() => { setSelectedBrand(brand); setInventoryView('products'); }} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl hover:bg-slate-900 hover:text-white transition group text-left shadow-sm">
                      <div className="text-3xl mb-3 opacity-80 group-hover:opacity-100">🏷️</div>
                      <h3 className="font-black text-lg">{brand}</h3>
                      <p className="text-xs mt-1 opacity-60">{localProducts.filter(p => (p.brand || 'Other Models') === brand).length} Products</p>
                    </button>
                  ))}
                </div>
              )}

              {inventoryView === 'products' && (
                <div className="space-y-4">
                  <button onClick={() => setInventoryView('brands')} className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">← Back to Brands</button>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="p-4 font-black">ID</th>
                          <th className="p-4 font-black">Model Name</th>
                          <th className="p-4 font-black">Base Price</th>
                          <th className="p-4 font-black text-center">Status</th>
                          <th className="p-4 font-black text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {localProducts.filter(p => (p.brand || 'Other Models') === selectedBrand).map((product) => (
                          <tr key={product.id} className="hover:bg-slate-50/80 transition group">
                            <td className="p-4 text-xs font-mono font-bold text-slate-400">#{product.id}</td>
                            <td className="p-4 text-sm font-bold text-slate-900 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 via-white to-slate-200 p-1 shadow-inner">
                                {product.image ? <img src={product.image} alt={product.title} className="h-full max-h-full w-full max-w-full object-contain" /> : '📱'}
                              </div>
                              {product.title}
                            </td>
                            <td className="p-4 text-sm font-black text-emerald-600">₹{(Number(product.price) || 0).toLocaleString()}</td>
                            <td className="p-4 text-center">
                              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-wider shadow-sm">In Stock</span>
                            </td>
                            <td className="p-4 text-right space-x-3 opacity-80 group-hover:opacity-100 transition">
                              <button onClick={() => { setEditingProduct(product); setInventoryView('form'); }} className="text-blue-600 font-bold hover:underline text-[11px] uppercase tracking-wide">Edit</button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="text-rose-600 font-bold hover:underline text-[11px] uppercase tracking-wide">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {inventoryView === 'form' && (
                <div>
                  <button onClick={() => setInventoryView(selectedBrand ? 'products' : 'brands')} className="text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-1">← Cancel & Go Back</button>
                  <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Company Name (Brand)</label>
                        <input name="brand" required defaultValue={editingProduct?.brand || ''} placeholder="e.g. Apple, Samsung" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Model Name (Title)</label>
                        <input name="title" required defaultValue={editingProduct?.title || ''} placeholder="e.g. iPhone 16 Pro" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Base Price (₹)</label>
                        <input type="number" name="price" required defaultValue={editingProduct?.price || ''} placeholder="e.g. 120000" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Product Description</label>
                        <textarea name="description" rows="4" defaultValue={editingProduct?.description || ''} placeholder="Describe the phone features..." className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white"></textarea>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Product Image (Local File)</label>
                        <div className="mt-1 flex items-center gap-4">
                          {editingProduct?.image && (
                            <img src={editingProduct.image} alt="Preview" className="h-12 w-12 rounded-lg border border-slate-200 bg-slate-50 object-contain p-1 shadow-sm" />
                          )}
                          <input type="file" name="image" accept="image/*" className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 bg-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400">Memory (Storage)</label>
                          <input name="storage" defaultValue={editingProduct?.specs?.Storage || ''} placeholder="e.g. 256GB" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400">RAM</label>
                          <input name="ram" defaultValue={editingProduct?.specs?.RAM || ''} placeholder="e.g. 8GB" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                        </div>
                      </div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400">Processor</label><input name="processor" defaultValue={editingProduct?.specs?.Processor || ''} placeholder="e.g. A18 Bionic" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" /></div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400">Camera Specs</label><input name="camera" defaultValue={editingProduct?.specs?.Camera || ''} placeholder="e.g. 48MP Triple" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" /></div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400">Battery</label><input name="battery" defaultValue={editingProduct?.specs?.Battery || ''} placeholder="e.g. 4700mAh" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" /></div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400">Charger Info</label><input name="charger" defaultValue={editingProduct?.specs?.Charger || ''} placeholder="e.g. 30W Fast Charging" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" /></div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400">Additional Tools (In Box)</label><input name="tools" defaultValue={editingProduct?.specs?.Tools || ''} placeholder="e.g. Type-C Cable, SIM Tool" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" /></div>
                    </div>
                    
                    <div className="md:col-span-2 flex justify-end mt-4 pt-4 border-t border-slate-200">
                      <button type="submit" className="px-8 py-3 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 transition font-black text-sm">{editingProduct ? 'Save Changes' : 'Add Product'}</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* 🛒 TAB 3: Order Management */}
          {activeTab === 3 && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Order Management</h2>
                  <p className="text-sm text-slate-500 mt-1">Track, update, and manage customer orders.</p>
                </div>
                <div className="flex items-center gap-3">
                  <select 
                    value={orderFilter} 
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs outline-none focus:border-slate-900 cursor-pointer"
                  >
                    <option value="All">All Orders</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="p-4 font-black">Order ID</th>
                      <th className="p-4 font-black">Customer Name</th>
                      <th className="p-4 font-black">Date</th>
                      <th className="p-4 font-black text-center">Items</th>
                      <th className="p-4 font-black">Total Amount</th>
                      <th className="p-4 font-black text-center">Status</th>
                      <th className="p-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders
                      .filter(order => orderFilter === 'All' || order.status === orderFilter)
                      .map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition group">
                        <td className="p-4 text-xs font-mono font-bold text-slate-900">{order.id}</td>
                        <td className="p-4 text-sm font-bold text-slate-700">{order.customer}</td>
                        <td className="p-4 text-xs font-semibold text-slate-500">{order.date}</td>
                        <td className="p-4 text-sm font-bold text-slate-700 text-center">{order.items}</td>
                        <td className="p-4 text-sm font-black text-emerald-600">₹{order.total.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <select value={order.status} onChange={(e) => { handleOrderStatusChange(order.id, e.target.value); }} className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full outline-none cursor-pointer border-2 ${order.status === 'Processing' ? 'bg-amber-50 text-amber-700 border-amber-200' : order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' : order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4 text-right opacity-80 group-hover:opacity-100 transition"><button className="text-slate-600 font-bold hover:text-slate-900 text-[11px] uppercase tracking-wide">View Details</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 📩 TAB 7: Enquiry Management Logs */}
          {activeTab === 7 && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <h2 className="text-2xl font-black mb-2">Enquiry Management</h2>
              <p className="text-sm text-slate-500 mb-6">Review input logs, modify resolution states and save internal records.</p>
              
              {enquiries.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No user enquiries tracked inside system logs.</p>
              ) : (
                <div className="space-y-6">
                  {enquiries.map(e => (
                    <div key={e.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                         <div>
                           <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">{e.subject || 'iPhone Enquiry'}</span>
                           <h3 className="text-lg font-black text-slate-900 mt-2">{e.full_name || 'Visitor'} — <span className="font-mono font-medium text-slate-600 text-base">{e.mobile_number || '—'}</span></h3>
                           <p className="text-xs text-slate-500 font-mono mt-0.5">Email: {e.email || '—'} | Received: {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}</p>
                           <p className="text-sm text-slate-900 font-medium italic mt-3 bg-white p-3 rounded-xl border border-slate-100">{e.message || '—'}</p>
                         </div>
                         <div className="flex gap-2 self-end sm:self-start">
                           <button onClick={() => handleSaveEnquiry(e.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 transition font-bold text-xs">Save Changes</button>
                           <button onClick={() => handleEnquiryDelete(e.id)} className="px-4 py-2 bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 transition font-bold text-xs">Delete</button>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200/80">
                         <div className="flex flex-col gap-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400">Status Selector</label>
                           <select value={e.status || 'New'} onChange={(el) => handleEnquiryFieldChange(e.id, 'status', el.target.value)} className="p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none bg-white text-slate-900">
                             <option value="New">New</option>
                             <option value="In progress">In progress</option>
                             <option value="Completed">Completed</option>
                             <option value="Closed">Closed</option>
                           </select>
                         </div>
                         <div className="flex flex-col gap-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400">Admin Response Note</label>
                           <input type="text" value={e.admin_note || ''} onChange={(el) => handleEnquiryFieldChange(e.id, 'admin_note', el.target.value)} className="p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none bg-white text-slate-900" placeholder="Add internal database comment..." />
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Placeholders */}
          {([6].includes(activeTab)) && (
            <div className="bg-white p-20 rounded-[2rem] border border-slate-100 shadow-xl text-center">
              <p className="text-4xl">🚧</p>
              <h2 className="text-xl font-black mt-4">Module Integration Pending</h2>
              <p className="text-sm text-slate-400 mt-2">This dashboard slice is ready for dynamic backend routing hooks.</p>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}