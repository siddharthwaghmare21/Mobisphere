"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProductContext } from '@/app/context/ProductContext'

const initialForm = {
  fullName: '',
  mobileNumber: '',
  address: '',
  couponCode: '',
}

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
        setFormData((prev) => ({
          ...prev,
          fullName: loggedInUser.fullName || '',
          mobileNumber: loggedInUser.mobileNumber || '',
          address: loggedInUser.address || '',
        }))
      }
      setIsHydrated(true)
    })
  }, [])

  const selectedProduct = useMemo(() => {
    if (!checkoutMode.productId) return null
    return products.find((item) => String(item.id) === String(checkoutMode.productId)) || null
  }, [checkoutMode.productId, products])

  const checkoutItems = useMemo(() => {
    if (checkoutMode.cart) return cartItems
    return selectedProduct ? [normalizeCartItem(selectedProduct)] : []
  }, [cartItems, checkoutMode.cart, selectedProduct])

  const basePrice = checkoutItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
  const discountAmount = Math.round((basePrice * discount) / 100)
  const finalPrice = Math.max(basePrice - discountAmount, 0)

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const applyCoupon = () => {
    setCouponError('')
    setCouponSuccess('')
    const code = formData.couponCode.trim().toUpperCase()

    if (!code) {
      setCouponError('Please enter a coupon code.')
      return
    }

    const storedCoupons = safeJson('mobisphereCoupons', [])
    const found = Array.isArray(storedCoupons) ? storedCoupons.find((c) => String(c.code).toUpperCase() === code) : null

    if (!found) {
      setCouponError('Invalid coupon code. Try another one.')
      setDiscount(0)
      return
    }

    const percent = Number(found.discountPercent) || 0
    setDiscount(percent)
    setCouponSuccess(`Coupon applied! You got ${percent}% off.`)
  }

  const handlePlaceOrder = (e) => {
    e.preventDefault()

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
    return <main className="px-4 py-20 text-center font-bold text-slate-500">Loading checkout...</main>
  }

  if (checkoutItems.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 pt-32 text-center">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">No product selected</p>
          <button
            type="button"
            onClick={() => router.push('/product')}
            className="mt-4 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Browse Products
          </button>
        </div>
      </main>
    )
  }

  if (orderPlaced) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 pt-32 text-center">
        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-8 text-emerald-900 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-600">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-bold">Order Placed!</h1>
          <p className="mt-2 text-sm text-emerald-700">
            Thank you, {formData.fullName}. Your order {lastOrder?.id} has been received.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Return Home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 pt-28 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Checkout details</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Shipping & Payment</h1>

          <form onSubmit={handlePlaceOrder} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm text-slate-700">
              <span>Full Name</span>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Receiver name"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
              <span>Mobile Number</span>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="10-digit delivery contact"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
              <span>Delivery Address</span>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Complete street address, landmarks, pincode"
              />
            </label>

            <div className="rounded-[1.5rem] bg-slate-50 p-5 text-xs leading-5 text-slate-500">
              <p className="mb-1 font-semibold uppercase tracking-wider text-slate-800">Cash on Delivery Available</p>
              By placing this order, you agree to pay the final amount upon hand delivery by our store representative.
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Confirm & Place Order
            </button>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">Order Summary</h2>

            <div className="mt-4 space-y-3">
              {checkoutItems.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <img src={item.image} alt={item.title} className="h-16 w-16 rounded-xl bg-white object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">Qty: {item.quantity || 1} Unit</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-b border-slate-100 pb-4 text-sm font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Items total</span>
                <span>₹{basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping fee</span>
                <span className="text-emerald-600">FREE</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Coupon discount</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-between text-base font-bold text-slate-950">
              <span>Total cost</span>
              <span>₹{finalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900">Apply Store Coupon</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.couponCode}
                onChange={(e) => handleInputChange('couponCode', e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-900 outline-none focus:border-slate-400"
                placeholder="PROMO20"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="rounded-full bg-slate-950 px-5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Apply
              </button>
            </div>

            {couponError && <p className="mt-2 pl-2 text-xs font-medium text-red-600">{couponError}</p>}
            {couponSuccess && <p className="mt-2 pl-2 text-xs font-medium text-emerald-600">{couponSuccess}</p>}
          </div>
        </aside>
      </div>
    </main>
  )
}
