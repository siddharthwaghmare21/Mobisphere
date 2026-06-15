"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function readCart() {
  if (typeof window === 'undefined') return []
  try {
    const storedCart = JSON.parse(localStorage.getItem('mobisphereCart') || '[]')
    return Array.isArray(storedCart) ? storedCart : []
  } catch {
    return []
  }
}

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      setCartItems(readCart())
      setIsHydrated(true)
    })
  }, [])

  const saveCart = (items) => {
    setCartItems(items)
    localStorage.setItem('mobisphereCart', JSON.stringify(items))
  }

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return
    const updated = cartItems.map((item) =>
      item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item,
    )
    saveCart(updated)
  }

  const removeItem = (cartItemId) => {
    const updated = cartItems.filter((item) => item.cartItemId !== cartItemId)
    saveCart(updated)
  }

  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price || 0) * (item.quantity || 1)), 0)

  if (!isHydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center font-bold text-slate-500">
        Loading your cart...
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-col justify-between gap-4 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Your Shopping Cart</h1>
          <p className="mt-2 text-sm text-slate-500">Review your selected items and proceed to checkout.</p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-5 py-2 text-sm font-bold text-emerald-700">
          {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
        </div>
      </header>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center rounded-[2rem] border border-slate-100 bg-white p-16 text-center shadow-sm">
          <div className="mb-4 text-6xl opacity-80">🛒</div>
          <h2 className="text-2xl font-black text-slate-900">Your cart is empty</h2>
          <p className="mb-8 mt-2 font-medium text-slate-500">You have not added any products to your cart yet.</p>
          <Link href="/product" className="rounded-full bg-emerald-600 px-8 py-3 font-bold text-white shadow-md transition hover:bg-emerald-700">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {cartItems.map((item) => (
              <div key={item.cartItemId} className="flex flex-col items-center gap-6 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:p-6">
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 p-2 shadow-inner sm:h-28 sm:w-28">
                  <img src={item.image || '/images/IPhone 16 Pro Max.png'} alt={item.title || 'Product'} className="h-full w-full rounded-xl object-cover" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm font-bold text-emerald-600">₹{Number(item.price || 0).toLocaleString()}</p>

                  <div className="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-start">
                    <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm">
                      <button type="button" onClick={() => updateQuantity(item.cartItemId, (item.quantity || 1) - 1)} className="px-4 py-1.5 font-black text-slate-600 transition hover:bg-slate-200 hover:text-slate-900">-</button>
                      <span className="border-x border-slate-200 bg-white px-4 py-1.5 text-sm font-bold">{item.quantity || 1}</span>
                      <button type="button" onClick={() => updateQuantity(item.cartItemId, (item.quantity || 1) + 1)} className="px-4 py-1.5 font-black text-slate-600 transition hover:bg-slate-200 hover:text-slate-900">+</button>
                    </div>
                    <button type="button" onClick={() => removeItem(item.cartItemId)} className="text-xs font-bold text-rose-500 transition hover:text-rose-700 hover:underline">Remove</button>
                  </div>
                </div>
                <div className="hidden border-l border-slate-100 pl-6 text-right sm:block">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Total</p>
                  <p className="text-xl font-black text-slate-900">₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl">
              <h3 className="mb-6 text-xl font-black text-slate-900">Order Summary</h3>
              <div className="mb-6 space-y-4 border-b border-slate-100 pb-6 text-sm font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-black uppercase text-emerald-600">Free</span>
                </div>
              </div>
              <div className="mb-8 flex items-end justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Total Amount</span>
                <span className="text-3xl font-black text-slate-900">₹{subtotal.toLocaleString()}</span>
              </div>
              <button type="button" onClick={() => router.push('/payment?cart=1')} className="w-full rounded-full bg-slate-900 py-4 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:scale-95">
                Proceed to Checkout
              </button>
              <div className="mt-4 text-center">
                <Link href="/product" className="text-xs font-bold text-slate-500 transition hover:text-slate-900 hover:underline">
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
