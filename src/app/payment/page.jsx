"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as ProductModule from '@/app/components/common/ProductCart'

const initialForm = {
  fullName: '',
  mobileNumber: '',
  address: '',
  couponCode: '',
}

export default function PaymentPage() {
  const router = useRouter()
  const [formData, setFormData] = useState(initialForm)
  const [product, setProduct] = useState(null)
  const [discount, setDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const queryParams = new URLSearchParams(window.location.search)
    const rawPid = queryParams.get('productId')
    
    let dataSource = ProductModule.productData || ProductModule.default || []
    let foundProduct = null

    if (dataSource) {
      if (rawPid) {
        const pidNum = Number(rawPid)
        
        if (typeof dataSource.find === 'function') {
          foundProduct = dataSource.find(p => p && (p.id === pidNum || p.id === rawPid || p.productId === pidNum || p.productId === rawPid))
        }
        
        if (!foundProduct && dataSource[rawPid]) {
          foundProduct = dataSource[rawPid]
        }
        if (!foundProduct && dataSource[pidNum]) {
          foundProduct = dataSource[pidNum]
        }

        if (!foundProduct) {
          const entries = Object.entries(dataSource)
          const match = entries.find(([key]) => key === rawPid || Number(key) === pidNum)
          if (match) {
            foundProduct = match[1]
          }
        }
      }

      if (!foundProduct) {
        const values = Object.values(dataSource)
        if (values && values.length > 0) {
          foundProduct = typeof values[0] === 'object' ? values[0] : dataSource[0]
        }
      }
    }

    if (foundProduct) {
      setProduct(foundProduct)
    }

    const loggedInUser = JSON.parse(localStorage.getItem('mobisphereLoggedIn') || 'null')
    if (loggedInUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: loggedInUser.fullName || '',
        mobileNumber: loggedInUser.mobileNumber || '',
        address: loggedInUser.address || '',
      }))
    }
  }, [])

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

    const storedCoupons = JSON.parse(localStorage.getItem('mobisphereCoupons') || '[]')
    const found = storedCoupons.find((c) => c.code.toUpperCase() === code)

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

    setOrderPlaced(true)
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 pt-32 text-center">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Loading catalog connection...</p>
          <button
            onClick={() => router.push('/product')}
            className="mt-4 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Browse Products
          </button>
        </div>
      </main>
    )
  }

  const basePrice = Number(product.price) || 0
  const discountAmount = (basePrice * discount) / 100
  const finalPrice = basePrice - discountAmount

  if (orderPlaced) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 pt-32 text-center">
        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-8 shadow-sm text-emerald-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl font-bold">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-bold">Order Placed!</h1>
          <p className="mt-2 text-sm text-emerald-700">
            Thank you, {formData.fullName}. Your order for {product.title} has been received and is being processed.
          </p>
          <button
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
                placeholder="Receiver's name"
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

            <div className="rounded-[1.5rem] bg-slate-50 p-5 text-xs text-slate-500 leading-5">
              <p className="font-semibold text-slate-800 uppercase tracking-wider mb-1">Cash on Delivery Available</p>
              By placing this order, you agree to pay the final amount upon hand-delivery by our store representative.
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
            
            <div className="mt-4 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
              <img src={product.image} alt={product.title} className="h-16 w-16 rounded-xl object-cover bg-white" />
              <div>
                <h3 className="text-sm font-bold text-slate-950">{product.title}</h3>
                <p className="mt-1 text-xs text-slate-500">Qty: 1 Unit</p>
              </div>
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Apply Store Coupon</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.couponCode}
                onChange={(e) => handleInputChange('couponCode', e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs uppercase font-semibold tracking-wider text-slate-900 outline-none focus:border-slate-400"
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

            {couponError && <p className="mt-2 text-xs font-medium text-red-600 pl-2">{couponError}</p>}
            {couponSuccess && <p className="mt-2 text-xs font-medium text-emerald-600 pl-2">{couponSuccess}</p>}
          </div>
        </aside>
      </div>
    </main>
  )
}