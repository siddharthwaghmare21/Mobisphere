"use client"

import React, { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useProductContext } from "@/app/context/ProductContext"
import ProductDisplayCard from "@/app/components/product/ProductDisplayCard"

const SALE_CAMPAIGN_STORAGE_KEY = "mobisphereSaleCampaigns"

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback

  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null")
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function formatINR(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return "—"
  return `₹${n.toLocaleString()}`
}

function getStockQuantity(product) {
  const value =
    product?.stockQty ??
    product?.stockQuantity ??
    product?.stock ??
    product?.quantity ??
    0

  const stock = Number(value)
  return Number.isFinite(stock) ? Math.max(stock, 0) : 0
}

function getMinimumStockAlert(product) {
  const value =
    product?.minStockAlert ??
    product?.minimumStockAlert ??
    product?.lowStockLimit ??
    3

  const minStock = Number(value)
  return Number.isFinite(minStock) ? Math.max(minStock, 1) : 3
}

function getStockStatus(product) {
  const stock = getStockQuantity(product)
  const minStock = getMinimumStockAlert(product)

  if (stock <= 0) {
    return {
      type: "out",
      label: "Out of Stock",
      helper: "Currently unavailable",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    }
  }

  if (stock <= minStock) {
    return {
      type: "low",
      label: "Low Stock",
      helper: `${stock} units left`,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    }
  }

  return {
    type: "in",
    label: "In Stock",
    helper: `${stock} units available`,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }
}


function getCampaignStartDate(campaign) {
  return campaign?.startDate || campaign?.startsAt || campaign?.fromDate || ""
}

function getCampaignEndDate(campaign) {
  return campaign?.endDate || campaign?.expiresAt || campaign?.expiryDate || campaign?.toDate || ""
}

function isCampaignDateActive(campaign) {
  const now = new Date()
  const startDate = getCampaignStartDate(campaign)
  const endDate = getCampaignEndDate(campaign)

  if (startDate) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    if (!Number.isNaN(start.getTime()) && now < start) {
      return false
    }
  }

  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    if (!Number.isNaN(end.getTime()) && now > end) {
      return false
    }
  }

  return true
}

function campaignMatchesProduct(campaign, product) {
  const applyOn = String(
    campaign?.applyOn ||
      campaign?.targetType ||
      campaign?.scope ||
      campaign?.offerScope ||
      "all"
  ).toLowerCase()

  if (applyOn === "all" || applyOn === "all-products" || applyOn === "allproducts") {
    return true
  }

  if (applyOn === "brand" || applyOn === "selected-brand" || applyOn === "selectedbrand") {
    const campaignBrand = String(
      campaign?.brand ||
        campaign?.targetBrand ||
        campaign?.selectedBrand ||
        ""
    )
      .toLowerCase()
      .trim()

    const productBrand = String(product?.brand || "Other Models")
      .toLowerCase()
      .trim()

    return Boolean(campaignBrand) && campaignBrand === productBrand
  }

  if (applyOn === "product" || applyOn === "selected-product" || applyOn === "selectedproduct") {
    const campaignProductId = String(
      campaign?.productId ||
        campaign?.targetProductId ||
        campaign?.selectedProductId ||
        ""
    ).trim()

    return Boolean(campaignProductId) && campaignProductId === String(product?.id)
  }

  return false
}

function calculateCampaignPrice(product, campaign) {
  const originalPrice = Number(product?.price) || 0
  const discountValue = Number(
    campaign?.discountValue ??
      campaign?.discount ??
      campaign?.discountPercent ??
      0
  )

  if (originalPrice <= 0 || discountValue <= 0) return null

  const discountType = String(
    campaign?.discountType ||
      campaign?.type ||
      "percentage"
  ).toLowerCase()

  let discountAmount = 0

  if (discountType === "percentage" || discountType === "percent" || discountType === "%") {
    discountAmount = Math.round((originalPrice * discountValue) / 100)
  } else {
    discountAmount = Math.round(discountValue)
  }

  const salePrice = Math.max(originalPrice - discountAmount, 0)

  if (salePrice >= originalPrice) return null

  return {
    campaignId: campaign?.id || "",
    title: campaign?.title || campaign?.name || campaign?.offerTitle || "Festival Sale",
    originalPrice,
    salePrice,
    discountAmount,
    discountValue,
    discountType,
    discountLabel:
      discountType === "percentage" || discountType === "percent" || discountType === "%"
        ? `${discountValue}% OFF`
        : `₹${discountAmount.toLocaleString()} OFF`,
    endsAt: getCampaignEndDate(campaign),
  }
}

function getBestSaleForProduct(product) {
  const campaigns = readJson(SALE_CAMPAIGN_STORAGE_KEY, [])

  if (!Array.isArray(campaigns) || campaigns.length === 0 || !product) {
    return null
  }

  const validSales = campaigns
    .filter((campaign) => campaign?.active !== false)
    .filter((campaign) => isCampaignDateActive(campaign))
    .filter((campaign) => campaignMatchesProduct(campaign, product))
    .map((campaign) => calculateCampaignPrice(product, campaign))
    .filter(Boolean)
    .sort((a, b) => b.discountAmount - a.discountAmount)

  return validSales[0] || null
}

function addProductToCart(product, saleInfo) {
  if (typeof window === "undefined" || !product) return false

  const stock = getStockQuantity(product)

  if (stock <= 0) {
    alert("This product is currently out of stock.")
    return false
  }

  let currentCart = []

  try {
    const storedCart = JSON.parse(localStorage.getItem("mobisphereCart") || "[]")
    currentCart = Array.isArray(storedCart) ? storedCart : []
  } catch {
    currentCart = []
  }

  const originalPrice = Number(product.price) || 0
  const finalPrice = saleInfo?.salePrice ?? originalPrice

  currentCart.push({
    cartItemId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    productId: product.id,
    title: product.title,
    brand: product.brand || "Mobisphere",
    image: product.image || "/images/IPhone 16 Pro Max.png",
    description: product.description || "",
    price: Number(finalPrice) || 0,
    originalPrice,
    salePrice: saleInfo?.salePrice || null,
    saleDiscountAmount: saleInfo?.discountAmount || 0,
    saleDiscountLabel: saleInfo?.discountLabel || "",
    saleCampaignId: saleInfo?.campaignId || "",
    saleCampaignTitle: saleInfo?.title || "",
    quantity: 1,
    stockQty: stock,
    minStockAlert: getMinimumStockAlert(product),
  })

  localStorage.setItem("mobisphereCart", JSON.stringify(currentCart))
  return true
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { products, hydrated } = useProductContext()

  const productId = params?.id
  const [cartMessage, setCartMessage] = useState("")

  const product = useMemo(() => {
    if (!Array.isArray(products)) return null
    return products.find((item) => String(item.id) === String(productId)) || null
  }, [products, productId])

  const specs = useMemo(() => {
    const s = product?.specs || {}

    return {
      RAM: s.RAM,
      Storage: s.Storage,
      Camera: s.Camera,
      Display: s.Display,
      Battery: s.Battery,
      Processor: s.Processor,
      Charger: s.Charger,
      Tools: s.Tools,
    }
  }, [product])

  const recommendedProducts = useMemo(() => {
    if (!Array.isArray(products)) return []

    return products
      .filter((item) => String(item.id) !== String(productId))
      .slice(0, 4)
  }, [products, productId])

  const stockQuantity = getStockQuantity(product)
  const minimumStockAlert = getMinimumStockAlert(product)
  const stockStatus = getStockStatus(product)
  const isOutOfStock = stockStatus.type === "out"

  const handleAddToCart = () => {
    if (!product) return

    if (isOutOfStock) {
      alert("This product is currently out of stock.")
      return
    }

    const saved = addProductToCart(product, saleInfo)

    if (!saved) return

    setCartMessage(`${product.title} added to cart!`)

    window.setTimeout(() => {
      setCartMessage("")
    }, 1500)
  }

  const handleBuyNow = () => {
    if (!product) return

    if (isOutOfStock) {
      alert("This product is currently out of stock.")
      return
    }

    router.push(`/payment?productId=${product.id}`)
  }

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-center">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-10 shadow-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />

          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">
            Loading Product
          </p>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 pt-28 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">
            Product not found
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-500">
            This product may have been removed or edited from the admin panel.
          </p>

          <button
            type="button"
            onClick={() => router.push("/product")}
            className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Back to products
          </button>
        </div>
      </main>
    )
  }

  const productImage = product.image || "/images/IPhone 16 Pro Max.png"
  const productTitle = product.title || "Mobisphere Product"
  const productPrice = Number(product.price) || 0
  const saleInfo = getBestSaleForProduct(product)
  const hasSale = Boolean(saleInfo) && !isOutOfStock
  const finalPrice = saleInfo?.salePrice ?? productPrice

  return (
    <main className="mx-auto max-w-6xl px-3 py-8 pt-28 sm:px-6 sm:py-10 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div className="w-full">
            <div className="relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-100 via-white to-slate-200 p-5 sm:h-[460px] sm:p-8 lg:h-[520px]">
              <div
                className={`absolute left-4 top-4 z-10 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-wider shadow-sm sm:text-xs ${stockStatus.className}`}
              >
                {stockStatus.label}
              </div>

              {hasSale && (
                <div className="absolute right-4 top-4 z-10 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-orange-700 shadow-sm sm:text-xs">
                  {saleInfo.discountLabel}
                </div>
              )}

              <img
                src={productImage}
                alt={product.alt || productTitle}
                className={`h-full max-h-full w-full max-w-full object-contain transition duration-500 hover:scale-105 ${
                  isOutOfStock ? "opacity-55 grayscale" : ""
                }`}
              />
            </div>
          </div>

          <div className="w-full">
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-600 sm:text-sm sm:tracking-[0.3em]">
                {product.brand || "Mobisphere Mobile Shop"}
              </p>

              <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                {productTitle}
              </h1>

              <p className="text-sm font-medium leading-7 text-slate-600 sm:text-base">
                {product.description || "Premium smartphone available at Mobisphere."}
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[1.75rem] bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                    Price
                  </p>

                  {hasSale ? (
                    <div className="mt-2">
                      <div className="flex flex-wrap items-end gap-3">
                        <p className="text-3xl font-black text-emerald-700 sm:text-4xl">
                          {formatINR(finalPrice)}
                        </p>

                        <p className="pb-1 text-sm font-black text-slate-400 line-through sm:text-base">
                          {formatINR(productPrice)}
                        </p>
                      </div>

                      <p className="mt-2 text-xs font-black uppercase tracking-wider text-orange-600">
                        {saleInfo.title} • You save {formatINR(saleInfo.discountAmount)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                      {formatINR(productPrice)}
                    </p>
                  )}
                </div>

                <div className={`rounded-[1.75rem] border p-5 ${stockStatus.className}`}>
                  <p className="text-xs font-black uppercase tracking-[0.24em]">
                    Availability
                  </p>

                  <p className="mt-2 text-2xl font-black">
                    {stockStatus.label}
                  </p>

                  <p className="mt-1 text-xs font-black uppercase tracking-wider">
                    {stockStatus.helper}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Current Stock
                  </p>

                  <p className="mt-1 text-xl font-black text-slate-950">
                    {stockQuantity} Units
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Low Stock Alert
                  </p>

                  <p className="mt-1 text-xl font-black text-slate-950">
                    {minimumStockAlert} Units
                  </p>
                </div>
              </div>

              {hasSale ? (
                <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-800">
                  <p className="font-black uppercase tracking-wider">Limited Time Offer</p>
                  <p className="mt-1">
                    {saleInfo.title} is active on this product. Offer price: {formatINR(finalPrice)}.
                  </p>
                  {saleInfo.endsAt ? (
                    <p className="mt-1 text-xs font-black uppercase tracking-wider">
                      Offer ends on {new Date(saleInfo.endsAt).toLocaleDateString("en-IN")}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {cartMessage ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                  {cartMessage}
                </div>
              ) : null}

              {isOutOfStock ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                  This product is currently out of stock. Please check other models
                  or contact Mobisphere support.
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-black transition ${
                    isOutOfStock
                      ? "cursor-not-allowed bg-slate-200 text-slate-500"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  {isOutOfStock ? "Unavailable" : "Add to cart"}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className={`inline-flex w-full items-center justify-center rounded-full border px-6 py-3 text-sm font-black transition ${
                    isOutOfStock
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                      : "border-emerald-600 bg-emerald-600 text-slate-950 hover:bg-emerald-500"
                  }`}
                >
                  {isOutOfStock ? "Out of Stock" : "Buy now"}
                </button>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Specifications
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Object.entries(specs)
                    .filter(([, value]) => Boolean(value))
                    .map(([key, value]) => (
                      <div key={key} className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          {key}
                        </p>

                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {value}
                        </p>
                      </div>
                    ))}
                </div>

                {Object.entries(specs).filter(([, value]) => Boolean(value)).length === 0 && (
                  <p className="mt-4 text-sm font-bold text-slate-400">
                    No specifications added yet.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => router.push("/product")}
                className="text-sm font-black text-slate-700 underline underline-offset-4 transition hover:text-slate-950"
              >
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      </div>

      {recommendedProducts.length > 0 && (
        <div className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
                Recommended
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                Customers also viewed
              </h2>
            </div>

            <button
              type="button"
              onClick={() => router.push("/product")}
              className="hidden rounded-full bg-slate-100 px-5 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-200 sm:inline-flex"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
            {recommendedProducts.map((item) => (
              <ProductDisplayCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </main>
  )
}