"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useProductContext } from "@/app/context/ProductContext"

const CART_STORAGE_KEY = "mobisphereCart"
const ORDERS_STORAGE_KEY = "mobisphereOrders"

const initialForm = {
  fullName: "",
  mobileNumber: "",
  address: "",
  couponCode: "",
}

function safeJson(key, fallback) {
  if (typeof window === "undefined") return fallback

  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null")
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function getStockQuantity(product) {
  const value =
    product?.stockQty ??
    product?.stockQuantity ??
    product?.stockAvailable ??
    product?.stock ??
    0

  const stock = Number(value)
  return Number.isFinite(stock) ? Math.max(stock, 0) : 0
}

function getMinimumStockAlert(product) {
  const value =
    product?.minStockAlert ??
    product?.minimumStockAlert ??
    product?.minStock ??
    product?.lowStockLimit ??
    3

  const minStock = Number(value)
  return Number.isFinite(minStock) ? Math.max(minStock, 1) : 3
}

function getStockStatusFromNumbers(stock, minStock) {
  if (stock <= 0) {
    return {
      type: "out",
      label: "Out of Stock",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    }
  }

  if (stock <= minStock) {
    return {
      type: "low",
      label: "Low Stock",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    }
  }

  return {
    type: "in",
    label: "In Stock",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }
}

function findProductById(products, productId) {
  if (!Array.isArray(products)) return null

  return (
    products.find((item) => String(item.id) === String(productId)) || null
  )
}

function normalizeCartItem(item, latestProduct = null) {
  const productId = item.productId || item.id || latestProduct?.id
  const source = latestProduct || item
  const quantity = Math.max(Number(item.quantity) || 1, 1)
  const stockQty = getStockQuantity(source)
  const minStockAlert = getMinimumStockAlert(source)
  const stockStatus = getStockStatusFromNumbers(stockQty, minStockAlert)

  return {
    productId,
    title: latestProduct?.title || item.title || "Mobisphere Product",
    brand: latestProduct?.brand || item.brand || "Mobisphere",
    image:
      latestProduct?.image ||
      item.image ||
      "/images/IPhone 16 Pro Max.png",
    description: latestProduct?.description || item.description || "",
    price: Number(latestProduct?.price ?? item.price) || 0,
    quantity,
    stockQty,
    minStockAlert,
    stockStatus: stockStatus.label,
    stockStatusType: stockStatus.type,
  }
}

function makeOrderId() {
  return `ORD-${Date.now().toString(36).toUpperCase().slice(-5)}`
}

function getCouponCode(coupon) {
  return String(coupon?.code || coupon?.couponCode || "").trim().toUpperCase()
}

function getCouponDiscount(coupon) {
  const value =
    coupon?.discountPercent ??
    coupon?.discount ??
    coupon?.percent ??
    coupon?.discount_percentage ??
    0

  const percent = Number(value)
  return Number.isFinite(percent) ? percent : 0
}

function isCouponActive(coupon) {
  if (!coupon) return false

  if (typeof coupon.isActive === "boolean") return coupon.isActive
  if (typeof coupon.active === "boolean") return coupon.active
  if (typeof coupon.enabled === "boolean") return coupon.enabled

  const status = String(coupon.status || "active").toLowerCase()
  return !["inactive", "disabled", "expired", "blocked"].includes(status)
}

function getCouponExpiryDate(coupon) {
  const rawExpiry =
    coupon?.expiryDate ??
    coupon?.expiresAt ??
    coupon?.validUntil ??
    coupon?.expireDate ??
    coupon?.expiry ??
    ""

  if (!rawExpiry) return null

  const expiryDate = new Date(rawExpiry)
  if (Number.isNaN(expiryDate.getTime())) return null

  const rawString = String(rawExpiry)
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(rawString)

  if (isDateOnly) {
    expiryDate.setHours(23, 59, 59, 999)
  }

  return expiryDate
}

function isCouponExpired(coupon) {
  const expiryDate = getCouponExpiryDate(coupon)
  if (!expiryDate) return false
  return expiryDate.getTime() < Date.now()
}

function formatCouponExpiry(coupon) {
  const expiryDate = getCouponExpiryDate(coupon)
  if (!expiryDate) return "No expiry"

  return expiryDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function PaymentPage() {
  const router = useRouter()
  const {
    products,
    setProducts,
    hydrated: productsHydrated,
  } = useProductContext()

  const [formData, setFormData] = useState(initialForm)
  const [checkoutMode, setCheckoutMode] = useState({
    cart: false,
    productId: null,
  })
  const [cartItems, setCartItems] = useState([])
  const [discount, setDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState("")
  const [couponSuccess, setCouponSuccess] = useState("")
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const queryParams = new URLSearchParams(window.location.search)
    const rawPid = queryParams.get("productId")
    const cartMode = queryParams.get("cart") === "1"

    const loggedInUser = safeJson("mobisphereLoggedIn", null)
    const storedCart = safeJson(CART_STORAGE_KEY, [])

    queueMicrotask(() => {
      setCheckoutMode({
        cart: cartMode,
        productId: rawPid,
      })

      setCartItems(Array.isArray(storedCart) ? storedCart : [])

      if (loggedInUser) {
        setFormData((prev) => ({
          ...prev,
          fullName: loggedInUser.fullName || "",
          mobileNumber: loggedInUser.mobileNumber || "",
          address: loggedInUser.address || "",
        }))
      }

      setIsHydrated(true)
    })
  }, [])

  const selectedProduct = useMemo(() => {
    if (!checkoutMode.productId || !Array.isArray(products)) return null

    return findProductById(products, checkoutMode.productId)
  }, [checkoutMode.productId, products])

  const checkoutItems = useMemo(() => {
    if (checkoutMode.cart) {
      return cartItems.map((item) => {
        const productId = item.productId || item.id
        const latestProduct = findProductById(products, productId)

        return normalizeCartItem(item, latestProduct)
      })
    }

    return selectedProduct
      ? [normalizeCartItem(selectedProduct, selectedProduct)]
      : []
  }, [cartItems, checkoutMode.cart, selectedProduct, products])

  const stockValidation = useMemo(() => {
    const quantityByProduct = new Map()
    const itemByProduct = new Map()

    checkoutItems.forEach((item) => {
      if (!item.productId) return

      const key = String(item.productId)
      const quantity = Number(item.quantity || 1)

      quantityByProduct.set(key, (quantityByProduct.get(key) || 0) + quantity)

      if (!itemByProduct.has(key)) {
        itemByProduct.set(key, item)
      }
    })

    const issues = []

    quantityByProduct.forEach((orderedQuantity, productId) => {
      const item = itemByProduct.get(productId)
      const availableStock = getStockQuantity(item)

      if (availableStock <= 0) {
        issues.push(`${item?.title || "Product"} is out of stock.`)
        return
      }

      if (orderedQuantity > availableStock) {
        issues.push(
          `${item?.title || "Product"} has only ${availableStock} units available.`
        )
      }
    })

    return {
      hasIssue: issues.length > 0,
      issues,
    }
  }, [checkoutItems])

  const basePrice = checkoutItems.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 1)
  }, 0)

  const discountAmount = Math.round((basePrice * discount) / 100)
  const finalPrice = Math.max(basePrice - discountAmount, 0)

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (field === "couponCode") {
      setCouponError("")
      setCouponSuccess("")
      setDiscount(0)
      setAppliedCoupon(null)
    }
  }

  const applyCoupon = () => {
    setCouponError("")
    setCouponSuccess("")
    setDiscount(0)
    setAppliedCoupon(null)

    const code = formData.couponCode.trim().toUpperCase()

    if (!code) {
      setCouponError("Please enter a coupon code.")
      return
    }

    const storedCoupons = safeJson("mobisphereCoupons", [])

    const found = Array.isArray(storedCoupons)
      ? storedCoupons.find((coupon) => getCouponCode(coupon) === code)
      : null

    if (!found) {
      setCouponError("Invalid coupon code. Try another one.")
      return
    }

    if (!isCouponActive(found)) {
      setCouponError("This coupon is currently inactive.")
      return
    }

    if (isCouponExpired(found)) {
      setCouponError("This coupon has expired.")
      return
    }

    const percent = getCouponDiscount(found)

    if (percent <= 0 || percent > 100) {
      setCouponError("This coupon discount is not valid.")
      return
    }

    setDiscount(percent)
    setAppliedCoupon(found)
    setCouponSuccess(
      `Coupon applied! You got ${percent}% off. Expiry: ${formatCouponExpiry(found)}.`
    )
  }

  const reduceProductStock = (orderedItems) => {
    if (typeof setProducts !== "function") return

    const quantityByProduct = new Map()

    orderedItems.forEach((item) => {
      if (!item.productId) return

      const key = String(item.productId)
      const quantity = Math.max(Number(item.quantity) || 1, 1)

      quantityByProduct.set(key, (quantityByProduct.get(key) || 0) + quantity)
    })

    setProducts((prevProducts) => {
      const safeProducts = Array.isArray(prevProducts) ? prevProducts : []

      return safeProducts.map((product) => {
        const orderedQuantity = quantityByProduct.get(String(product.id))

        if (!orderedQuantity) return product

        const currentStock = getStockQuantity(product)
        const minStockAlert = getMinimumStockAlert(product)
        const nextStock = Math.max(currentStock - orderedQuantity, 0)
        const nextStatus = getStockStatusFromNumbers(nextStock, minStockAlert)

        return {
          ...product,
          stockQty: nextStock,
          minStockAlert,
          minStock: minStockAlert,
          stockStatus: nextStatus.label,
          stockUpdatedAt: new Date().toISOString(),
        }
      })
    })
  }

  const handlePlaceOrder = (event) => {
    event.preventDefault()

    if (
      !formData.fullName.trim() ||
      !formData.mobileNumber.trim() ||
      !formData.address.trim()
    ) {
      alert("Please fill out your name, mobile number, and delivery address.")
      return
    }

    if (checkoutItems.length === 0) {
      alert("No product selected for checkout.")
      return
    }

    if (stockValidation.hasIssue) {
      alert(stockValidation.issues.join("\n"))
      return
    }

    if (appliedCoupon) {
      if (!isCouponActive(appliedCoupon)) {
        alert("Applied coupon is inactive. Please remove or apply another coupon.")
        setDiscount(0)
        setAppliedCoupon(null)
        setCouponError("Applied coupon is inactive.")
        setCouponSuccess("")
        return
      }

      if (isCouponExpired(appliedCoupon)) {
        alert("Applied coupon has expired. Please remove or apply another coupon.")
        setDiscount(0)
        setAppliedCoupon(null)
        setCouponError("Applied coupon has expired.")
        setCouponSuccess("")
        return
      }
    }

    const orderProducts = checkoutItems.map((item) => ({
      ...item,
      availableStockBeforeOrder: item.stockQty,
    }))

    const order = {
      id: makeOrderId(),
      customer: formData.fullName.trim(),
      mobileNumber: formData.mobileNumber.trim(),
      address: formData.address.trim(),
      date: new Date().toISOString(),
      total: finalPrice,
      status: "Processing",
      items: orderProducts.reduce(
        (sum, item) => sum + Number(item.quantity || 1),
        0
      ),
      products: orderProducts,
      couponCode: appliedCoupon ? getCouponCode(appliedCoupon) : "",
      discountPercent: discount,
      discountAmount,
    }

    const existingOrders = safeJson(ORDERS_STORAGE_KEY, [])
    const nextOrders = Array.isArray(existingOrders)
      ? [order, ...existingOrders]
      : [order]

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(nextOrders))

    reduceProductStock(orderProducts)

    if (checkoutMode.cart) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]))
      setCartItems([])
    }

    setLastOrder(order)
    setOrderPlaced(true)
  }

  if (!isHydrated || !productsHydrated) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 pt-32 text-center">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-10 shadow-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />

          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">
            Loading Checkout
          </p>
        </div>
      </main>
    )
  }

  if (checkoutItems.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 pt-32 text-center">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 text-5xl">🛒</div>

          <p className="text-xl font-black text-slate-950">
            No product selected
          </p>

          <p className="mt-2 text-sm font-bold text-slate-500">
            Select a product or checkout from cart.
          </p>

          <button
            type="button"
            onClick={() => router.push("/product")}
            className="mt-6 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl font-black text-emerald-600">
            ✓
          </div>

          <h1 className="mt-4 text-2xl font-black">Order Placed!</h1>

          <p className="mt-2 text-sm font-bold text-emerald-700">
            Thank you, {formData.fullName}. Your order {lastOrder?.id} has been
            received.
          </p>

          <div className="mt-5 rounded-2xl bg-white/70 p-4 text-left text-xs font-bold text-emerald-900">
            <p>Order ID: {lastOrder?.id}</p>

            <p className="mt-1">
              Total: ₹{Number(lastOrder?.total || 0).toLocaleString()}
            </p>

            {lastOrder?.couponCode ? (
              <p className="mt-1">
                Coupon: {lastOrder.couponCode} ({lastOrder.discountPercent}% off)
              </p>
            ) : null}

            <p className="mt-1">
              Stock updated automatically after order confirmation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
          >
            Return Home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-3 py-8 pt-28 sm:px-6 sm:py-10 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-600 sm:text-sm">
            Checkout Details
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
            Shipping & Payment
          </h1>

          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Fill delivery details carefully. This demo checkout uses Cash on
            Delivery.
          </p>

          {stockValidation.hasIssue && (
            <div className="mt-5 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
              <p className="font-black uppercase tracking-wider">
                Stock issue found
              </p>

              <ul className="mt-2 list-disc space-y-1 pl-5">
                {stockValidation.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm font-bold text-slate-700">
              <span>Full Name</span>

              <input
                type="text"
                value={formData.fullName}
                onChange={(event) =>
                  handleInputChange("fullName", event.target.value)
                }
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Receiver name"
              />
            </label>

            <label className="block space-y-2 text-sm font-bold text-slate-700">
              <span>Mobile Number</span>

              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(event) =>
                  handleInputChange("mobileNumber", event.target.value)
                }
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="10-digit delivery contact"
              />
            </label>

            <label className="block space-y-2 text-sm font-bold text-slate-700">
              <span>Delivery Address</span>

              <textarea
                value={formData.address}
                onChange={(event) =>
                  handleInputChange("address", event.target.value)
                }
                className="h-24 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Complete street address, landmarks, pincode"
              />
            </label>

            <div className="rounded-[1.5rem] bg-slate-50 p-5 text-xs font-bold leading-5 text-slate-500">
              <p className="mb-1 font-black uppercase tracking-wider text-slate-800">
                Cash on Delivery Available
              </p>
              By placing this order, you agree to pay the final amount upon hand
              delivery by our store representative.
            </div>

            <button
              type="submit"
              disabled={stockValidation.hasIssue}
              className={`w-full rounded-full py-3.5 text-sm font-black transition ${
                stockValidation.hasIssue
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {stockValidation.hasIssue
                ? "Cannot Place Order"
                : "Confirm & Place Order"}
            </button>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-8">
            <h2 className="text-xl font-black text-slate-950">
              Order Summary
            </h2>

            <div className="mt-4 space-y-3">
              {checkoutItems.map((item, index) => {
                const quantity = Number(item.quantity || 1)
                const price = Number(item.price || 0)
                const itemTotal = price * quantity
                const image = item.image || "/images/IPhone 16 Pro Max.png"
                const stockQty = getStockQuantity(item)
                const minStockAlert = getMinimumStockAlert(item)
                const stockStatus = getStockStatusFromNumbers(
                  stockQty,
                  minStockAlert
                )

                return (
                  <div
                    key={`${item.productId}-${index}`}
                    className="grid grid-cols-[82px_1fr] gap-4 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[92px_1fr] sm:p-4"
                  >
                    <div className="flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-white to-slate-200 p-2 shadow-inner sm:h-[92px] sm:w-[92px]">
                      <img
                        src={image}
                        alt={item.title || "Product"}
                        className={`h-full max-h-full w-full max-w-full object-contain ${
                          stockStatus.type === "out" ? "opacity-50 grayscale" : ""
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="line-clamp-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                          {item.brand || "Mobisphere"}
                        </p>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${stockStatus.className}`}
                        >
                          {stockStatus.label}
                        </span>
                      </div>

                      <h3 className="line-clamp-2 text-sm font-black leading-5 text-slate-950">
                        {item.title || "Mobisphere Product"}
                      </h3>

                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Qty: {quantity} Unit
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Available Stock: {stockQty} Unit
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-900">
                        ₹{itemTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 space-y-3 border-b border-slate-100 pb-4 text-sm font-bold">
              <div className="flex justify-between gap-4 text-slate-600">
                <span>Items total</span>
                <span>₹{basePrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between gap-4 text-slate-600">
                <span>Shipping fee</span>
                <span className="text-emerald-600">FREE</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between gap-4 text-red-600">
                  <span>
                    Coupon discount
                    {appliedCoupon ? ` (${getCouponCode(appliedCoupon)})` : ""}
                  </span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-between gap-4 text-base font-black text-slate-950">
              <span>Total cost</span>
              <span>₹{finalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-900">
              Apply Store Coupon
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={formData.couponCode}
                onChange={(event) =>
                  handleInputChange("couponCode", event.target.value)
                }
                className="w-full min-w-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-900 outline-none focus:border-slate-400"
                placeholder="PROMO20"
              />

              <button
                type="button"
                onClick={applyCoupon}
                className="shrink-0 rounded-full bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800"
              >
                Apply
              </button>
            </div>

            {couponError && (
              <p className="mt-2 pl-2 text-xs font-bold text-red-600">
                {couponError}
              </p>
            )}

            {couponSuccess && (
              <p className="mt-2 pl-2 text-xs font-bold text-emerald-600">
                {couponSuccess}
              </p>
            )}

            <p className="mt-3 pl-2 text-[10px] font-bold leading-4 text-slate-400">
              Expired or inactive coupons cannot be applied at checkout.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
