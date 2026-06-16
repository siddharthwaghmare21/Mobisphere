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
    saveCart(cartItems.map((item) => item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item))
  }

  const removeItem = (cartItemId) => saveCart(cartItems.filter((item) => item.cartItemId !== cartItemId))
  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price || 0) * (item.quantity || 1)), 0)

  if (!isHydrated) {
    return <main className="flex min-h-[50vh] items-center justify-center font-black text-slate-500">Loading your cart...</main>
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-[2.2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Mobisphere checkout</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Your shopping cart</h1>
            <p className="mt-3 text-sm font-semibold text-slate-400">Review selected devices, update quantity, and continue to checkout.</p>
          </div>
          <div className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950">
            {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'} selected
          </div>
        </div>
      </section>

      {cartItems.length === 0 ? (
        <section className="rounded-[2rem] border border-slate-100 bg-white p-10 text-center shadow-xl sm:p-16">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-slate-950 text-4xl text-white">🛒</div>
          <h2 className="mt-6 text-3xl font-black text-slate-950">Your cart is empty</h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-slate-500">Add premium smartphones or accessories to your cart and checkout with Mobisphere support.</p>
          <Link href="/product" className="mt-8 inline-flex rounded-full bg-emerald-400 px-8 py-4 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-1 hover:bg-emerald-300">
            Start shopping
          </Link>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            {cartItems.map((item) => (
              <article key={item.cartItemId} className="grid gap-5 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-xl sm:grid-cols-[120px_1fr_auto] sm:items-center sm:p-5">
                <div className="flex h-28 w-full items-center justify-center rounded-[1.5rem] bg-slate-50 p-3 sm:w-28">
                  <img src={item.image || '/images/IPhone 16 Pro Max.png'} alt={item.title || 'Product'} className="h-full w-full object-contain" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Mobisphere product</p>
                  <h3 className="mt-2 text-xl font-black text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm font-bold text-slate-500">₹{Number(item.price || 0).toLocaleString()} per unit</p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                      <button type="button" onClick={() => updateQuantity(item.cartItemId, (item.quantity || 1) - 1)} className="px-4 py-2 font-black text-slate-600 hover:bg-slate-200">−</button>
                      <span className="border-x border-slate-200 bg-white px-4 py-2 text-sm font-black">{item.quantity || 1}</span>
                      <button type="button" onClick={() => updateQuantity(item.cartItemId, (item.quantity || 1) + 1)} className="px-4 py-2 font-black text-slate-600 hover:bg-slate-200">+</button>
                    </div>
                    <button type="button" onClick={() => removeItem(item.cartItemId)} className="rounded-full bg-rose-50 px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-100">Remove</button>
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-slate-50 p-4 text-left sm:text-right">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Item total</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                </div>
              </article>
            ))}
          </section>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-2xl">
              <h2 className="text-2xl font-black text-slate-950">Order summary</h2>
              <div className="mt-6 space-y-4 border-b border-slate-100 pb-6 text-sm font-bold text-slate-600">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-slate-950">₹{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Free</span></div>
                <div className="flex justify-between"><span>Support</span><span>Included</span></div>
              </div>

              <div className="mt-6 flex items-end justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total</span>
                <span className="text-3xl font-black text-slate-950">₹{subtotal.toLocaleString()}</span>
              </div>

              <button type="button" onClick={() => router.push('/payment?cart=1')} className="mt-7 w-full rounded-full bg-slate-950 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-slate-800">
                Proceed to checkout
              </button>
              <Link href="/product" className="mt-4 inline-flex w-full justify-center rounded-full bg-slate-50 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-100">
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}
