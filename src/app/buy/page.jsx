"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

const initialBuyer = {
  fullName: "",
  email: "",
  mobileNumber: "",
  address: "",
}

const paymentMethods = [
  { key: "upi", label: "UPI" },
  { key: "credit_card", label: "Credit Card" },
  { key: "net_banking", label: "Net Banking" },
  { key: "emi", label: "EMI" },
  { key: "cod", label: "Cash on Delivery" },
]

function isValidIndianMobile(value) {
  return /^[6-9]\d{9}$/.test(value)
}

function safeParseJSON(value, fallback) {
  try {
    return JSON.parse(value ?? "")
  } catch {
    return fallback
  }
}

const BUY_ENTRY_KEY = "mobisphereBuyEntry"

export default function BuyPage() {
  const router = useRouter()

  const [buyer, setBuyer] = useState(initialBuyer)
  const [selectedPayment, setSelectedPayment] = useState("upi")
  const [message, setMessage] = useState("")

  const cartItems = useMemo(() => {
    if (typeof window === "undefined") return []
    const storedCart = safeParseJSON(localStorage.getItem("mobisphereCart"), [])
    return Array.isArray(storedCart) ? storedCart : []
  }, [])

  const total = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0)
  }, [cartItems])

  useEffect(() => {
    // Gate access: only allow opening if user clicked "Buy Product" recently.
    // (We set a flag in localStorage on the cart page when they click the button.)
    // Important: do NOT clear the flag until after the page is mounted,
    // otherwise React strict-mode / fast remount can redirect immediately.
    const entry = safeParseJSON(localStorage.getItem(BUY_ENTRY_KEY), null)

    if (!entry?.allowed) {
      router.replace('/cart')
      return
    }

    setMessage('')

    const t = window.setTimeout(() => {
      try {
        localStorage.removeItem(BUY_ENTRY_KEY)
      } catch {
        // ignore
      }
    }, 150)

    return () => window.clearTimeout(t)
  }, [router])

  const handleChange = (field, value) => {
    setBuyer((prev) => ({ ...prev, [field]: value }))
  }

  const handlePlaceOrder = () => {
    setMessage("")

    if (!buyer.fullName.trim()) {
      setMessage("Please enter your full name.")
      return
    }

    if (!buyer.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim())) {
      setMessage("Please enter a valid email address.")
      return
    }

    if (!buyer.mobileNumber.trim() || !isValidIndianMobile(buyer.mobileNumber.trim())) {
      setMessage("Please enter a valid 10-digit Indian mobile number.")
      return
    }

    if (!buyer.address.trim()) {
      setMessage("Please enter your address.")
      return
    }

    if (cartItems.length === 0) {
      setMessage("Your cart is empty. Add products before checkout.")
      return
    }

    const order = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      buyer: {
        fullName: buyer.fullName.trim(),
        email: buyer.email.trim(),
        mobileNumber: buyer.mobileNumber.trim(),
        address: buyer.address.trim(),
      },
      payment: {
        method: selectedPayment,
      },
      items: cartItems,
      totalPrice: total,
      status: "Placed",
    }

    try {
      const key = "mobisphereOrders"
      const stored = safeParseJSON(localStorage.getItem(key), [])
      const next = Array.isArray(stored) ? [...stored, order] : [order]
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // demo persistence only
    }

    // Clear cart after placing order (demo)
    try {
      localStorage.setItem("mobisphereCart", JSON.stringify([]))
    } catch {
      // ignore
    }

    setMessage("Order placed successfully. Our team will contact you shortly.")

    queueMicrotask(() => {
      setTimeout(() => router.push("/product"), 1400)
    })

    try {
      localStorage.removeItem(BUY_ENTRY_KEY)
    } catch {
      // ignore
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 pt-28 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Payment</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">Complete Payment</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Enter delivery details and choose a payment method.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Cart items: <span className="font-semibold text-slate-900">{cartItems.length}</span>
          </div>
          <div className="text-lg font-semibold text-emerald-700">Total: ₹{total.toLocaleString()}</div>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Your cart is empty</h2>
          <p className="mt-2 text-sm text-slate-600">Add products to checkout.</p>
          <button
            type="button"
            onClick={() => router.push("/product")}
            className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Go to products
          </button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-950">Delivery details</h2>
              <p className="mt-2 text-sm text-slate-600">We’ll use this to contact you and deliver your mobile.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                <span>Full name</span>
                <input
                  value={buyer.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                  placeholder="Enter full name"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Email</span>
                <input
                  value={buyer.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  type="email"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                  placeholder="example@mail.com"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Mobile number</span>
                <input
                  value={buyer.mobileNumber}
                  onChange={(e) => handleChange("mobileNumber", e.target.value)}
                  type="tel"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                  placeholder="10-digit Indian mobile"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                <span>Address</span>
                <textarea
                  value={buyer.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="h-28 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                  placeholder="Street, city, state, pincode"
                />
              </label>
            </div>

            <div className="mt-10">
              <h2 className="text-2xl font-semibold text-slate-950">Payment method</h2>
              <p className="mt-2 text-sm text-slate-600">Choose one of the options below.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {paymentMethods.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSelectedPayment(m.key)}
                    className={`rounded-3xl border px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                      selectedPayment === m.key
                        ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-[2rem] bg-slate-50 p-6">
                <p className="text-sm text-slate-700">
                  Selected:{' '}
                  <span className="font-semibold text-slate-900">
                    {paymentMethods.find((x) => x.key === selectedPayment)?.label}
                  </span>
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  This is a demo checkout. Payment is simulated and stored locally.
                </p>
              </div>
            </div>

            {message ? (
              <div
                className={`mt-6 rounded-3xl border p-4 text-sm ${message.includes("success") ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}
              >
                {message}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handlePlaceOrder}
              className="mt-7 w-full rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Place order ({paymentMethods.find((x) => x.key === selectedPayment)?.label})
            </button>
          </section>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-slate-950">Order summary</h2>
            <p className="mt-2 text-sm text-slate-600">Review items before placing order.</p>

            <div className="mt-6 space-y-4">
              {cartItems.map((it) => (
                <div key={it.cartItemId} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white">
                      <img src={it.image} alt={it.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="line-clamp-1 text-sm font-semibold text-slate-900">{it.title}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-slate-600">{it.description}</div>
                      <div className="mt-2 text-sm font-bold text-slate-900">₹{Number(it.price).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.75rem] bg-slate-50 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Total</span>
                <span className="font-semibold text-slate-900">₹{total.toLocaleString()}</span>
              </div>
              <div className="mt-3 text-xs text-slate-500">Taxes and shipping can be configured later.</div>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}

