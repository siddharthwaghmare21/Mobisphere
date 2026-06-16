"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProductContext } from '@/app/context/ProductContext'

const initialForm = { fullName: '', mobileNumber: '', address: '', couponCode: '' }

function safeJson(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null')
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function normalizeCartItem(item) {
  return {
    productId: item.productId,
    title: item.title || 'Product',
    image: item.image || '/images/IPhone 16 Pro Max.png',
    description: item.description || '',
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
  }
}

function makeOrderId() {
  return `ORD-${Date.now().toString(36).toUpperCase().slice(-5)}`
}

export default function PaymentPage() {
  const router = useRouter()
  const { products, hydrated: productsHydrated } = useProductContext()
  const [formData, setFormData] = useState(initialForm)
  const [checkoutMode, setCheckoutMode] = useState({ cart: false, productId: null })
  const [cartItems, setCartItems] = useState([])
  const [discount, setDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const queryParams = new URLSearchParams(window.location.search)
    const rawPid = queryParams.get('productId')
    const cartMode = queryParams.get('cart') === '1'
    const loggedInUser = safeJson('mobisphereLoggedIn', null)
    const storedCart = safeJson('mobisphereCart', [])

    queueMicrotask(() => {
      setCheckoutMode({ cart: cartMode, productId: rawPid })
      setCartItems(Array.isArray(storedCart) ? storedCart.map(normalizeCartItem) : [])
      if (loggedInUser) {
        setFormData((prev) => ({ ...prev, fullName: loggedInUser.fullName || '', mobileNumber: loggedInUser.mobileNumber || '', address: loggedInUser.address || '' }))
      }
      setIsHydrated(true)
    })
  }, [])

  const selectedProduct = useMemo(() => {
    if (!checkoutMode.productId) return null
    return products.find((item) => String(item.id) === String(checkoutMode.productId)) || null
  }, [checkoutMode.productId, products])

  const checkoutItems = useMemo(() => checkoutMode.cart ? cartItems : selectedProduct ? [normalizeCartItem(selectedProduct)] : [], [cartItems, checkoutMode.cart, selectedProduct])
  const basePrice = checkoutItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
  const discountAmount = Math.round((basePrice * discount) / 100)
  const finalPrice = Math.max(basePrice - discountAmount, 0)

  const handleInputChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleApplyCoupon = () => {
    setCouponError('')
    setCouponSuccess('')
    const code = formData.couponCode.trim().toUpperCase()
    if (!code) {
      setCouponError('Please enter a coupon code.')
      return
    }
    const storedCoupons = safeJson('mobisphereCoupons', [])
    const found = Array.isArray(storedCoupons) ? storedCoupons.find((c) => String(c.code).toUpperCase() === code && c.active !== false) : null
    if (!found) {
      setCouponError('Invalid coupon code. Try another one.')
      setDiscount(0)
      return
    }
    const percent = Number(found.discountPercent) || 0
    setDiscount(percent)
    setCouponSuccess(`Coupon applied! You got ${percent}% off.`)
  }

  const handlePlaceOrder = (event) => {
    event.preventDefault()
    if (!formData.fullName.trim() || !formData.mobileNumber.trim() || !formData.address.trim()) {
      alert('Please fill out your name, mobile number, and delivery address.')
      return
    }
    if (checkoutItems.length === 0) {
      alert('No product selected for checkout.')
      return
    }

    const order = {
      id: makeOrderId(),
      customer: formData.fullName.trim(),
      mobileNumber: formData.mobileNumber.trim(),
      address: formData.address.trim(),
      date: new Date().toISOString(),
      total: finalPrice,
      status: 'Processing',
      items: checkoutItems.length,
      products: checkoutItems,
      discountPercent: discount,
    }

    const existingOrders = safeJson('mobisphereOrders', [])
    const nextOrders = Array.isArray(existingOrders) ? [order, ...existingOrders] : [order]
    localStorage.setItem('mobisphereOrders', JSON.stringify(nextOrders))
    if (checkoutMode.cart) {
      localStorage.setItem('mobisphereCart', JSON.stringify([]))
      setCartItems([])
    }
    setLastOrder(order)
    setOrderPlaced(true)
  }

  if (!isHydrated || !productsHydrated) {
    return <main className="px-4 py-24 text-center font-black text-slate-500">Loading checkout...</main>
  }

  if (checkoutItems.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-10 shadow-xl">
          <p className="text-5xl">🛍️</p>
          <h1 className="mt-4 text-2xl font-black text-slate-950">No product selected</h1>
          <button type="button" onClick={() => router.push('/product')} className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800">Browse products</button>
        </div>
      </main>
    )
  }

  if (orderPlaced) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white text-center shadow-2xl">
          <div className="bg-slate-950 p-8 text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400 text-3xl font-black text-slate-950">✓</div>
            <h1 className="mt-5 text-3xl font-black">Order placed successfully</h1>
            <p className="mt-2 text-sm font-semibold text-slate-400">Thank you, {formData.fullName}. Your order is now in processing.</p>
          </div>
          <div className="p-8">
            <div className="rounded-[1.5rem] bg-slate-50 p-5 text-left">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Order ID</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{lastOrder?.id}</p>
              <p className="mt-3 text-sm font-semibold text-slate-600">Total: ₹{Number(lastOrder?.total || 0).toLocaleString()}</p>
            </div>
            <button type="button" onClick={() => router.push('/')} className="mt-7 rounded-full bg-slate-950 px-7 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800">Return home</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-[2.2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Secure checkout</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Details → Review → Confirm</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-400">Complete your delivery details and confirm your Mobisphere order with cash on delivery support.</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_410px]">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {['1 Details', '2 Review', '3 Confirm'].map((step, index) => (
              <div key={step} className={`rounded-full px-4 py-3 text-center text-xs font-black uppercase tracking-wider ${index === 0 ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-500'}`}>{step}</div>
            ))}
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-5">
            <label className="block space-y-2 text-sm font-bold text-slate-700">
              <span>Full name</span>
              <input type="text" value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Receiver name" />
            </label>
            <label className="block space-y-2 text-sm font-bold text-slate-700">
              <span>Mobile number</span>
              <input type="tel" value={formData.mobileNumber} onChange={(e) => handleInputChange('mobileNumber', e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="10-digit delivery contact" />
            </label>
            <label className="block space-y-2 text-sm font-bold text-slate-700">
              <span>Delivery address</span>
              <textarea value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className="h-28 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Complete street address, landmarks, pincode" />
            </label>

            <div className="rounded-[1.5rem] bg-slate-50 p-5 text-xs font-semibold leading-6 text-slate-500">
              <p className="mb-1 font-black uppercase tracking-wider text-slate-900">Cash on delivery available</p>
              Confirm the order now and pay the final amount when your product is delivered or picked up.
            </div>

            <button type="submit" className="w-full rounded-full bg-emerald-400 py-4 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-1 hover:bg-emerald-300">
              Confirm & place order
            </button>
          </form>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-black text-slate-950">Order summary</h2>
            <div className="mt-5 space-y-3">
              {checkoutItems.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <img src={item.image} alt={item.title} className="h-16 w-16 rounded-xl object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Qty {item.quantity}</p>
                    <p className="mt-1 text-sm font-black text-emerald-700">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 p-3">
              <div className="flex gap-2">
                <input value={formData.couponCode} onChange={(e) => handleInputChange('couponCode', e.target.value)} className="min-w-0 flex-1 rounded-full bg-slate-50 px-4 py-3 text-xs font-bold uppercase outline-none" placeholder="Coupon code" />
                <button type="button" onClick={handleApplyCoupon} className="rounded-full bg-slate-950 px-4 py-3 text-xs font-black text-white">Apply</button>
              </div>
              {couponError && <p className="mt-2 text-xs font-bold text-rose-600">{couponError}</p>}
              {couponSuccess && <p className="mt-2 text-xs font-bold text-emerald-700">{couponSuccess}</p>}
            </div>

            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm font-bold text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span className="text-slate-950">₹{basePrice.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="text-emerald-700">− ₹{discountAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>Free</span></div>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Final amount</span>
              <span className="text-3xl font-black text-slate-950">₹{finalPrice.toLocaleString()}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
