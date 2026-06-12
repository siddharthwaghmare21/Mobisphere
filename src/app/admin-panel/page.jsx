"use client"

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { productData } from '@/app/components/common/ProductCart'
import { supabase } from '@/lib/supabase'
import { useProductContext } from '@/app/context/ProductContext'

// Storage Keys
const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const COUPON_STORAGE_KEY = 'mobisphereCoupons'
const ADMIN_USERS_KEY = 'mobisphereAdminUsers'
const CART_STORAGE_KEY = 'cart'

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

export default function IntegratedAdminPanelDashboard() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [adminUsers, setAdminUsers] = useState([{ username: 'admin', password: 'admin' }])
  
  // 🎯 साईन-अप फॉर्मसाठी आवश्यक स्टेट्स
  const [regName, setRegName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
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
    if (session) {
      setIsLoggedIn(true)
      setUsername(session.username || 'Admin')
      fetchData()
    }
    const storedAdmins = loadJson(ADMIN_USERS_KEY)
    if (storedAdmins && storedAdmins.length > 0) {
      setAdminUsers(storedAdmins)
    } else {
      saveJson(ADMIN_USERS_KEY, [{ username: 'admin', password: 'admin' }])
    }
    const storedCoupons = loadJson(COUPON_STORAGE_KEY) || []
    setCoupons(storedCoupons)

    setHydrated(true)
  }, [fetchData])

  // Analytics Graph Logic
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
      cartData.forEach(it => {
        const pid = Number(it.productId)
        if (!Number.isFinite(pid)) return
        productCount.set(pid, (productCount.get(pid) || 0) + 1)
        productRevenue.set(pid, (productRevenue.get(pid) || 0) + (Number(it.price) || 0))
      })
    }

    const sortedCount = [...productCount.entries()].sort((a, b) => b[1] - a[1])
    const maxCount = Math.max(...[...productCount.values()], 1)

    return {
      totalRevenue: [...productRevenue.values()].reduce((a, b) => a + b, 0),
      topProducts: sortedCount.slice(0, 6).map(([pid]) => ({
        title: productData?.[pid]?.title?.replace("iPhone ", "iP ") || `Product ${pid}`,
        heightStr: `${Math.min(Math.round((productCount.get(pid) / maxCount) * 80 + 10), 95)}%`
      }))
    }
  }, [hydrated])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  // 🎯 दुरुस्त केलेले साईन-अप आणि लॉगिन मॅनेजमेंट लॉजिक
  const handleAuthSubmit = (e) => {
    e.preventDefault()
    const uname = username.trim()
    
    if (!uname || !password) {
      setMessage("Please fill in all fields!")
      return
    }

    if (isRegistering) {
      // 📝 SIGN UP PROCESS
      if (password !== confirmPassword) {
        setMessage("❌ Passwords do not match!")
        return
      }
      if (!regName.trim()) {
        setMessage("❌ Please enter your name!")
        return
      }

      const exists = adminUsers.find(a => a.username.toLowerCase() === uname.toLowerCase())
      if (exists) {
        setMessage("❌ Username already exists. Choose another.")
      } else {
        const updatedAdmins = [...adminUsers, { name: regName, username: uname, password }]
        setAdminUsers(updatedAdmins)
        saveJson(ADMIN_USERS_KEY, updatedAdmins)
        saveJson(ADMIN_SESSION_KEY, { username: uname })
        setIsLoggedIn(true)
        fetchData()
        setMessage('')
        setRegName('')
        setConfirmPassword('')
      }
    } else {
      // 🔐 SIGN IN PROCESS
      const validAdmin = adminUsers.find(a => a.username.toLowerCase() === uname.toLowerCase() && a.password === password)
      if (validAdmin) {
        saveJson(ADMIN_SESSION_KEY, { username: validAdmin.username })
        setIsLoggedIn(true)
        fetchData()
        setMessage('')
      } else {
        setMessage("❌ Invalid Username or Password!")
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    setIsLoggedIn(false)
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

  const handleSaveProduct = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const imageFile = formData.get('image')
    let imageUrl = editingProduct?.image || ''
    if (imageFile && imageFile.size > 0) {
      imageUrl = URL.createObjectURL(imageFile)
    }

    const newProd = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      title: formData.get('title'),
      brand: formData.get('brand'),
      price: Number(formData.get('price')),
      description: formData.get('description'),
      image: imageUrl,
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
    setInventoryView(selectedBrand ? 'products' : 'brands')
    setEditingProduct(null)
    setMessage(`Product ${editingProduct ? 'updated' : 'added'} successfully!`)
  }

  const handleDeleteProduct = (id) => {
    setLocalProducts(prev => prev.filter(p => p.id !== id))
    setMessage('Product deleted successfully.')
  }

  if (!hydrated) return null

  // 🔒 AUTH INTERFACE (SIGN IN / SIGN UP FIXED)
  if (!isLoggedIn) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 font-sans">
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-2xl">
          <h1 className="text-center text-2xl font-black text-slate-900">
            {isRegistering ? 'Admin Sign Up' : 'Admin Login'}
          </h1>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl mt-6 mb-2">
            <button type="button" onClick={() => { setIsRegistering(false); setMessage(''); }} className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${!isRegistering ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Login</button>
            <button type="button" onClick={() => { setIsRegistering(true); setMessage(''); }} className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${isRegistering ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Sign Up</button>
          </div>

          {message && <div className="mt-4 text-xs text-center text-red-600 bg-red-50 p-2.5 rounded-xl font-bold">{message}</div>}
          
          <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
            {isRegistering && (
              <input type="text" value={regName} onChange={e => setRegName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none text-slate-900 text-sm font-bold focus:border-slate-900" placeholder="Name" required />
            )}
            
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none text-slate-900 text-sm font-bold focus:border-slate-900" placeholder="Username" required />
            
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none text-slate-900 text-sm font-bold focus:border-slate-900" placeholder="Password" required />
            
            {isRegistering && (
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none text-slate-900 text-sm font-bold focus:border-slate-900" placeholder="Confirm Password" required />
            )}
            
            <button type="submit" className="w-full rounded-full bg-slate-900 py-4 font-bold text-white hover:bg-slate-800 transition mt-2 shadow-md">
              {isRegistering ? 'Sign Up' : 'Login'}
            </button>
          </form>
        </div>
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
            { id: 1, icon: '📊', name: 'Dashboard Overview' },
            { id: 2, icon: '📦', name: 'Product Inventory' },
            { id: 3, icon: '🛒', name: 'Order Management' },
            { id: 4, icon: '👥', name: 'User Accounts' },
            { id: 5, icon: '🎫', name: 'Coupons & Offers' },
            { id: 6, icon: '📈', name: 'Sales Reports' },
            { id: 7, icon: '📩', name: 'Enquiries Log' },
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
          
          {/* TAB 1: Graphs & Summary Metrics */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Revenue Matrix</p>
                   <p className="text-2xl font-black mt-1">₹{chartAnalytics.totalRevenue.toLocaleString()}</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Tracked Enquiries</p>
                   <p className="text-2xl font-black mt-1 text-emerald-600">{enquiries.length}</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Live Database Users</p>
                   <p className="text-2xl font-black mt-1 text-blue-600">{customers.length}</p>
                 </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-black text-slate-900">Device Sales Bar Graph Analytics</h2>
                  <button onClick={() => fetchData(true)} disabled={isSyncing} className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg font-bold text-slate-900 hover:bg-slate-200 transition flex items-center gap-1 disabled:opacity-50">
                    <span className={isSyncing ? "animate-spin inline-block" : "inline-block"}>🔄</span> {isSyncing ? 'Syncing...' : 'Sync Live Server'}
                  </button>
                </div>
                <div className="flex h-56 items-end justify-between gap-2 border-b border-l border-slate-200 pb-2 pl-2 bg-slate-50/60 p-4 rounded-2xl">
                  {chartAnalytics.topProducts.map((p, i) => (
                    <div key={i} className="flex h-full flex-col justify-end items-center flex-1 group cursor-pointer">
                      <div style={{ height: p.heightStr }} className="w-full rounded-t-lg bg-slate-900 group-hover:bg-emerald-500 transition-all relative">
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-2 py-1 rounded-md shadow-md">{p.heightStr}</span>
                      </div>
                      <span className="mt-3 text-[9px] font-black text-slate-500 uppercase truncate w-full text-center">{p.title}</span>
                    </div>
                  ))}
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
                  <p className="text-sm text-slate-500 mt-1">Manage your store's products, pricing, and stock status.</p>
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
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg shadow-inner overflow-hidden">
                                {product.image ? <img src={product.image} alt={product.title} className="w-full h-full object-cover" /> : '📱'}
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
                            <img src={editingProduct.image} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-sm" />
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
                          <select value={order.status} onChange={(e) => { setOrders(orders.map(o => o.id === order.id ? { ...o, status: e.target.value } : o)); setMessage(`Order ${order.id} status updated!`); }} className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full outline-none cursor-pointer border-2 ${order.status === 'Processing' ? 'bg-amber-50 text-amber-700 border-amber-200' : order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' : order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
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
                           <p className="text-sm text-slate-900 font-medium italic mt-3 bg-white p-3 rounded-xl border border-slate-100">"{e.message || '—'}"</p>
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