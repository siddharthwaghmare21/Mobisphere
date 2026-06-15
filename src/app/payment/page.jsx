"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useProductContext } from "@/app/context/ProductContext"

const CART_STORAGE_KEY = "mobisphereCart"
const ORDERS_STORAGE_KEY = "mobisphereOrders"
const COUPON_STORAGE_KEY = "mobisphereCoupons"
const SALE_CAMPAIGNS_STORAGE_KEY = "mobisphereSaleCampaigns"

const ORDERS_TABLE = "mobisphere_orders"
const COUPONS_TABLE = "mobisphere_coupons"
const SALE_CAMPAIGNS_TABLE = "mobisphere_sale_campaigns"

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

function saveJson(key, value) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
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

  return products.find((item) => String(item.id) === String(productId)) || null
}

function normalizeCoupon(coupon) {
  if (!coupon) return null

  return {
    id: coupon.id || String(coupon.code || Date.now()),
    code: String(coupon.code || "").trim().toUpperCase(),
    discountPercent: Number(coupon.discount_percent ?? coupon.discountPercent ?? 0) || 0,
    active: coupon.active !== false,
    expiresAt: coupon.expires_at || coupon.expiresAt || coupon.expiryDate || "",
    createdAt: coupon.created_at || coupon.createdAt || "",
  }
}

function normalizeCampaign(campaign) {
  if (!campaign) return null

  return {
    id: campaign.id || `SALE-${Date.now()}`,
    title: campaign.title || "Mobisphere Sale",
    discountType: campaign.discount_type || campaign.discountType || "percent",
    discountValue: Number(campaign.discount_value ?? campaign.discountValue ?? 0) || 0,
    scope: campaign.scope || campaign.applyOn || campaign.targetType || "all",
    brand: campaign.brand || campaign.targetBrand || "",
    productId: campaign.product_id || campaign.productId || campaign.selectedProductId || "",
    productTitle: campaign.product_title || campaign.productTitle || "",
    startDate: campaign.start_date || campaign.startDate || campaign.startsAt || "",
    endDate: campaign.end_date || campaign.endDate || campaign.expiresAt || "",
    active: campaign.active !== false,
    createdAt: campaign.created_at || campaign.createdAt || "",
  }
}

function isDateBeforeToday(dateText) {
  if (!dateText) return false

  const today = new Date(new Date().toDateString())
  const target = new Date(dateText)

  return !Number.isNaN(target.getTime()) && target < today
}

function isDateAfterToday(dateText) {
  if (!dateText) return false

  const today = new Date(new Date().toDateString())
  const target = new Date(dateText)

  return !Number.isNaN(target.getTime()) && target > today
}

function isCouponValid(coupon) {
  if (!coupon) return false
  if (!coupon.code) return false
  if (coupon.active === false) return false
  if (Number(coupon.discountPercent || 0) <= 0) return false
  if (Number(coupon.discountPercent || 0) > 100) return false
  if (isDateBeforeToday(coupon.expiresAt)) return false

  return true
}

function getCouponInvalidMessage(coupon) {
  if (!coupon) return "Invalid coupon code. Try another one."
  if (coupon.active === false) return "This coupon is currently inactive."
  if (isDateBeforeToday(coupon.expiresAt)) return "This coupon has expired."
  if (Number(coupon.discountPercent || 0) <= 0 || Number(coupon.discountPercent || 0) > 100) {
    return "This coupon is not valid."
  }

  return "This coupon is not valid."
}

function isCampaignLive(campaign) {
  if (!campaign) return false
  if (campaign.active === false) return false
  if (Number(campaign.discountValue || 0) <= 0) return false
  if (isDateAfterToday(campaign.startDate)) return false
  if (isDateBeforeToday(campaign.endDate)) return false

  return true
}

function campaignMatchesProduct(campaign, product) {
  if (!campaign || !product) return false

  const scope = String(campaign.scope || "all").toLowerCase()

  if (scope === "all" || scope === "all_products" || scope === "products") return true

  if (scope === "brand") {
    return String(campaign.brand || "").toLowerCase() === String(product.brand || "").toLowerCase()
  }

  if (scope === "product") {
    return String(campaign.productId || "") === String(product.id || product.productId || "")
  }

  return false
}

function calculateCampaignSale(product, campaign) {
  const originalPrice = Number(product?.price || 0)
  const discountValue = Number(campaign?.discountValue || 0)

  if (!Number.isFinite(originalPrice) || originalPrice <= 0) return null
  if (!Number.isFinite(discountValue) || discountValue <= 0) return null

  const discountType = String(campaign?.discountType || "percent").toLowerCase()
  const discountAmount = discountType === "flat"
    ? Math.min(discountValue, originalPrice)
    : Math.min(Math.round((originalPrice * discountValue) / 100), originalPrice)

  if (discountAmount <= 0) return null

  const salePrice = Math.max(originalPrice - discountAmount, 0)

  return {
    campaignId: campaign.id || "",
    campaignTitle: campaign.title || "Mobisphere Sale",
    originalPrice,
    salePrice,
    discountAmount,
    discountLabel: discountType === "flat"
      ? `₹${discountValue.toLocaleString()} OFF`
      : `${discountValue}% OFF`,
    endDate: campaign.endDate || "",
  }
}

function getBestSaleForProduct(product, campaigns) {
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : []

  return safeCampaigns
    .filter((campaign) => isCampaignLive(campaign) && campaignMatchesProduct(campaign, product))
    .map((campaign) => calculateCampaignSale(product, campaign))
    .filter(Boolean)
    .sort((a, b) => b.discountAmount - a.discountAmount)[0] || null
}

function normalizeCartItem(item, latestProduct = null, saleCampaigns = []) {
  const productId = item.productId || item.id || latestProduct?.id
  const source = latestProduct || item
  const quantity = Math.max(Number(item.quantity) || 1, 1)
  const stockQty = getStockQuantity(source)
  const minStockAlert = getMinimumStockAlert(source)
  const stockStatus = getStockStatusFromNumbers(stockQty, minStockAlert)
  const originalPrice = Number(latestProduct?.price ?? item.originalPrice ?? item.price) || 0
  const saleInfo = getBestSaleForProduct(
    {
      ...source,
      id: source?.id ?? productId,
      productId,
      price: originalPrice,
    },
    saleCampaigns
  )
  const finalUnitPrice = saleInfo ? saleInfo.salePrice : originalPrice

  return {
    id: productId,
    productId,
    title: latestProduct?.title || item.title || "Mobisphere Product",
    brand: latestProduct?.brand || item.brand || "Mobisphere",
    image: latestProduct?.image || item.image || "/images/IPhone 16 Pro Max.png",
    description: latestProduct?.description || item.description || "",
    price: finalUnitPrice,
    originalPrice,
    salePrice: saleInfo?.salePrice || null,
    saleDiscountAmount: saleInfo?.discountAmount || 0,
    saleDiscountLabel: saleInfo?.discountLabel || "",
    saleCampaignId: saleInfo?.campaignId || "",
    saleCampaignTitle: saleInfo?.campaignTitle || "",
    saleCampaignEndDate: saleInfo?.endDate || "",
    quantity,
    stockQty,
    minStockAlert,
    stockStatus: stockStatus.label,
    stockStatusType: stockStatus.type,
  }
}

function buildCheckoutItems({ cartMode, cartItems, products, productId, saleCampaigns }) {
  if (cartMode) {
    return (Array.isArray(cartItems) ? cartItems : []).map((item) => {
      const itemProductId = item.productId || item.id
      const latestProduct = findProductById(products, itemProductId)

      return normalizeCartItem(item, latestProduct, saleCampaigns)
    })
  }

  const selectedProduct = findProductById(products, productId)

  return selectedProduct
    ? [normalizeCartItem(selectedProduct, selectedProduct, saleCampaigns)]
    : []
}

function validateStock(items) {
  const quantityByProduct = new Map()
  const itemByProduct = new Map()

  items.forEach((item) => {
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
}

function makeOrderId() {
  return `ORD-${Date.now().toString(36).toUpperCase().slice(-5)}`
}

function mapOrderForSupabase(order) {
  return {
    id: order.id,
    customer: order.customer,
    mobile_number: order.mobileNumber,
    address: order.address,
    date: order.date,
    total: order.total,
    total_amount: order.total,
    status: order.status,
    items: order.items,
    products: order.products,
    original_items_total: order.originalItemsTotal,
    sale_discount_amount: order.saleDiscountAmount,
    subtotal_after_sale: order.subtotalAfterSale,
    discount_percent: order.discountPercent,
    coupon_code: order.couponCode || "",
    coupon_discount_amount: order.couponDiscountAmount,
    payment_mode: order.paymentMode,
    note: order.note || "",
    updated_at: new Date().toISOString(),
  }
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
  const [coupons, setCoupons] = useState([])
  const [saleCampaigns, setSaleCampaigns] = useState([])
  const [discount, setDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState("")
  const [couponSuccess, setCouponSuccess] = useState("")
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [syncStatus, setSyncStatus] = useState("")
  const [isHydrated, setIsHydrated] = useState(false)
  const [isOffersHydrated, setIsOffersHydrated] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  const loadPromotions = async () => {
    const localCoupons = safeJson(COUPON_STORAGE_KEY, [])
    const localCampaigns = safeJson(SALE_CAMPAIGNS_STORAGE_KEY, [])

    const fallbackCoupons = Array.isArray(localCoupons)
      ? localCoupons.map(normalizeCoupon).filter(Boolean)
      : []
    const fallbackCampaigns = Array.isArray(localCampaigns)
      ? localCampaigns.map(normalizeCampaign).filter(Boolean)
      : []

    let nextCoupons = fallbackCoupons
    let nextCampaigns = fallbackCampaigns

    try {
      const [{ data: couponData, error: couponErrorResult }, { data: campaignData, error: campaignErrorResult }] = await Promise.all([
        supabase
          .from(COUPONS_TABLE)
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from(SALE_CAMPAIGNS_TABLE)
          .select("*")
          .order("created_at", { ascending: false }),
      ])

      if (!couponErrorResult && Array.isArray(couponData)) {
        nextCoupons = couponData.map(normalizeCoupon).filter(Boolean)
        saveJson(COUPON_STORAGE_KEY, nextCoupons)
      }

      if (!campaignErrorResult && Array.isArray(campaignData)) {
        nextCampaigns = campaignData.map(normalizeCampaign).filter(Boolean)
        saveJson(SALE_CAMPAIGNS_STORAGE_KEY, nextCampaigns)
      }
    } catch (error) {
      console.error("Promotions sync error:", error)
    }

    setCoupons(nextCoupons)
    setSaleCampaigns(nextCampaigns)
    setIsOffersHydrated(true)

    return {
      coupons: nextCoupons,
      saleCampaigns: nextCampaigns,
    }
  }

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

    loadPromotions()
  }, [])

  const checkoutItems = useMemo(() => {
    return buildCheckoutItems({
      cartMode: checkoutMode.cart,
      cartItems,
      products,
      productId: checkoutMode.productId,
      saleCampaigns,
    })
  }, [cartItems, checkoutMode.cart, checkoutMode.productId, products, saleCampaigns])

  const stockValidation = useMemo(() => validateStock(checkoutItems), [checkoutItems])

  const originalItemsTotal = checkoutItems.reduce((sum, item) => {
    return sum + Number(item.originalPrice ?? item.price ?? 0) * Number(item.quantity || 1)
  }, 0)

  const saleDiscountAmount = checkoutItems.reduce((sum, item) => {
    return sum + Number(item.saleDiscountAmount || 0) * Number(item.quantity || 1)
  }, 0)

  const subtotalAfterSale = checkoutItems.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 1)
  }, 0)

  const discountAmount = Math.round((subtotalAfterSale * discount) / 100)
  const finalPrice = Math.max(subtotalAfterSale - discountAmount, 0)

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

  const applyCoupon = async () => {
    setCouponError("")
    setCouponSuccess("")

    const code = formData.couponCode.trim().toUpperCase()

    if (!code) {
      setCouponError("Please enter a coupon code.")
      return
    }

    const latestPromotions = await loadPromotions()
    const latestCoupons = latestPromotions.coupons
    const found = Array.isArray(latestCoupons)
      ? latestCoupons.find((coupon) => String(coupon.code).toUpperCase() === code)
      : null

    if (!found || !isCouponValid(found)) {
      setCouponError(getCouponInvalidMessage(found))
      setDiscount(0)
      setAppliedCoupon(null)
      return
    }

    const percent = Number(found.discountPercent) || 0

    setDiscount(percent)
    setAppliedCoupon(found)
    setCouponSuccess(`Coupon applied! You got ${percent}% off.`)
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
          lastStockUpdatedAt: new Date().toISOString(),
        }
      })
    })
  }

  const saveOrderLocalFallback = (order) => {
    const existingOrders = safeJson(ORDERS_STORAGE_KEY, [])
    const nextOrders = Array.isArray(existingOrders)
      ? [order, ...existingOrders]
      : [order]

    saveJson(ORDERS_STORAGE_KEY, nextOrders)
  }

  const saveOrderToSupabase = async (order) => {
    const { error } = await supabase
      .from(ORDERS_TABLE)
      .insert([mapOrderForSupabase(order)])

    if (error) throw error
  }

  const handlePlaceOrder = async (event) => {
    event.preventDefault()

    if (isPlacingOrder) return

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

    setIsPlacingOrder(true)

    try {
      const latestPromotions = await loadPromotions()
      const freshCheckoutItems = buildCheckoutItems({
        cartMode: checkoutMode.cart,
        cartItems,
        products,
        productId: checkoutMode.productId,
        saleCampaigns: latestPromotions.saleCampaigns,
      })

      const freshStockValidation = validateStock(freshCheckoutItems)

      if (freshCheckoutItems.length === 0) {
        alert("No product selected for checkout.")
        return
      }

      if (freshStockValidation.hasIssue) {
        alert(freshStockValidation.issues.join("\n"))
        return
      }

      let finalCoupon = appliedCoupon
      let finalDiscountPercent = discount

      if (appliedCoupon?.code) {
        const freshCoupon = latestPromotions.coupons.find(
          (coupon) => String(coupon.code).toUpperCase() === String(appliedCoupon.code).toUpperCase()
        )

        if (!freshCoupon || !isCouponValid(freshCoupon)) {
          setCouponError(getCouponInvalidMessage(freshCoupon))
          setCouponSuccess("")
          setDiscount(0)
          setAppliedCoupon(null)
          alert("Applied coupon is no longer valid. Please check coupon again.")
          return
        }

        finalCoupon = freshCoupon
        finalDiscountPercent = Number(freshCoupon.discountPercent || 0)
      }

      const freshOriginalItemsTotal = freshCheckoutItems.reduce((sum, item) => {
        return sum + Number(item.originalPrice ?? item.price ?? 0) * Number(item.quantity || 1)
      }, 0)

      const freshSaleDiscountAmount = freshCheckoutItems.reduce((sum, item) => {
        return sum + Number(item.saleDiscountAmount || 0) * Number(item.quantity || 1)
      }, 0)

      const freshSubtotalAfterSale = freshCheckoutItems.reduce((sum, item) => {
        return sum + Number(item.price || 0) * Number(item.quantity || 1)
      }, 0)

      const freshCouponDiscountAmount = Math.round((freshSubtotalAfterSale * finalDiscountPercent) / 100)
      const freshFinalPrice = Math.max(freshSubtotalAfterSale - freshCouponDiscountAmount, 0)

      const orderProducts = freshCheckoutItems.map((item) => ({
        ...item,
        availableStockBeforeOrder: item.stockQty,
      }))

      const order = {
        id: makeOrderId(),
        customer: formData.fullName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        address: formData.address.trim(),
        date: new Date().toISOString(),
        total: freshFinalPrice,
        status: "Processing",
        items: orderProducts.reduce(
          (sum, item) => sum + Number(item.quantity || 1),
          0
        ),
        products: orderProducts,
        originalItemsTotal: freshOriginalItemsTotal,
        saleDiscountAmount: freshSaleDiscountAmount,
        subtotalAfterSale: freshSubtotalAfterSale,
        discountPercent: finalDiscountPercent,
        couponCode: finalCoupon?.code || "",
        couponDiscountAmount: freshCouponDiscountAmount,
        paymentMode: "Cash on Delivery",
        note: checkoutMode.cart ? "Cart checkout" : "Buy now checkout",
      }

      saveOrderLocalFallback(order)

      try {
        await saveOrderToSupabase(order)
        setSyncStatus("Order synced with Supabase server.")
      } catch (error) {
        console.error("Order Supabase save error:", error)
        setSyncStatus("Order saved locally. Supabase sync failed.")
      }

      reduceProductStock(orderProducts)

      if (checkoutMode.cart) {
        saveJson(CART_STORAGE_KEY, [])
        setCartItems([])
      }

      setLastOrder(order)
      setOrderPlaced(true)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (!isHydrated || !productsHydrated || !isOffersHydrated) {
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

            {lastOrder?.couponCode && (
              <p className="mt-1">
                Coupon: {lastOrder.couponCode} (-₹{Number(lastOrder?.couponDiscountAmount || 0).toLocaleString()})
              </p>
            )}

            <p className="mt-1">
              {syncStatus || "Stock updated automatically after order confirmation."}
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
            Fill delivery details carefully. This checkout uses Cash on Delivery.
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
              disabled={stockValidation.hasIssue || isPlacingOrder}
              className={`w-full rounded-full py-3.5 text-sm font-black transition ${
                stockValidation.hasIssue || isPlacingOrder
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {stockValidation.hasIssue
                ? "Cannot Place Order"
                : isPlacingOrder
                  ? "Placing Order..."
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
                const originalPrice = Number(item.originalPrice || price)
                const itemTotal = price * quantity
                const originalTotal = originalPrice * quantity
                const image = item.image || "/images/IPhone 16 Pro Max.png"
                const stockQty = getStockQuantity(item)
                const minStockAlert = getMinimumStockAlert(item)
                const stockStatus = getStockStatusFromNumbers(
                  stockQty,
                  minStockAlert
                )
                const hasSale = Number(item.saleDiscountAmount || 0) > 0

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

                        {hasSale && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-rose-700">
                            {item.saleDiscountLabel || "SALE"}
                          </span>
                        )}
                      </div>

                      <h3 className="line-clamp-2 text-sm font-black leading-5 text-slate-950">
                        {item.title || "Mobisphere Product"}
                      </h3>

                      {hasSale && item.saleCampaignTitle && (
                        <p className="mt-1 line-clamp-1 text-[10px] font-black uppercase tracking-wider text-rose-600">
                          {item.saleCampaignTitle}
                        </p>
                      )}

                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Qty: {quantity} Unit
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Available Stock: {stockQty} Unit
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {hasSale && (
                          <span className="text-xs font-black text-slate-400 line-through">
                            ₹{originalTotal.toLocaleString()}
                          </span>
                        )}
                        <span className="text-sm font-black text-slate-900">
                          ₹{itemTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 space-y-3 border-b border-slate-100 pb-4 text-sm font-bold">
              <div className="flex justify-between gap-4 text-slate-600">
                <span>MRP total</span>
                <span>₹{originalItemsTotal.toLocaleString()}</span>
              </div>

              {saleDiscountAmount > 0 && (
                <div className="flex justify-between gap-4 text-rose-600">
                  <span>Festival sale savings</span>
                  <span>-₹{saleDiscountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between gap-4 text-slate-600">
                <span>Items subtotal</span>
                <span>₹{subtotalAfterSale.toLocaleString()}</span>
              </div>

              <div className="flex justify-between gap-4 text-slate-600">
                <span>Shipping fee</span>
                <span className="text-emerald-600">FREE</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between gap-4 text-red-600">
                  <span>Coupon discount {appliedCoupon?.code ? `(${appliedCoupon.code})` : ""}</span>
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

            <p className="mt-3 text-[11px] font-bold leading-5 text-slate-400">
              Coupons are verified from Supabase live offers before checkout.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
