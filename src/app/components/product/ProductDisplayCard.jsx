"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const SALE_CAMPAIGN_STORAGE_KEY = "mobisphereSaleCampaigns"
const SALE_CAMPAIGNS_TABLE = "mobisphere_sale_campaigns"

let saleCampaignCache = null
let saleCampaignPromise = null

function readJson(key, fallback) {
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

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage can fail in private mode; ignore safely.
  }
}

function normalizeSaleCampaign(campaign) {
  if (!campaign) return null

  return {
    id: campaign.id || `SALE-${Date.now()}`,
    title: campaign.title || campaign.name || campaign.offerTitle || "Festival Sale",
    discountType:
      campaign.discountType ||
      campaign.discount_type ||
      campaign.type ||
      "percent",
    discountValue: Number(
      campaign.discountValue ??
        campaign.discount_value ??
        campaign.discount ??
        campaign.discountPercent ??
        0
    ),
    scope:
      campaign.scope ||
      campaign.applyOn ||
      campaign.targetType ||
      campaign.offerScope ||
      "all",
    applyOn:
      campaign.applyOn ||
      campaign.scope ||
      campaign.targetType ||
      campaign.offerScope ||
      "all",
    brand:
      campaign.brand ||
      campaign.targetBrand ||
      campaign.selectedBrand ||
      "",
    productId: String(
      campaign.productId ??
        campaign.product_id ??
        campaign.targetProductId ??
        campaign.selectedProductId ??
        ""
    ),
    productTitle:
      campaign.productTitle ||
      campaign.product_title ||
      campaign.selectedProductTitle ||
      "",
    startDate:
      campaign.startDate ||
      campaign.start_date ||
      campaign.startsAt ||
      campaign.fromDate ||
      "",
    endDate:
      campaign.endDate ||
      campaign.end_date ||
      campaign.expiresAt ||
      campaign.expiryDate ||
      campaign.toDate ||
      "",
    active: campaign.active !== false,
    createdAt: campaign.createdAt || campaign.created_at || "",
  }
}

function readStoredSaleCampaigns() {
  const storedCampaigns = readJson(SALE_CAMPAIGN_STORAGE_KEY, [])
  return Array.isArray(storedCampaigns)
    ? storedCampaigns.map(normalizeSaleCampaign).filter(Boolean)
    : []
}

async function fetchSaleCampaigns() {
  const fallbackCampaigns = readStoredSaleCampaigns()

  if (saleCampaignCache) {
    return saleCampaignCache
  }

  if (saleCampaignPromise) {
    return saleCampaignPromise
  }

  saleCampaignPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from(SALE_CAMPAIGNS_TABLE)
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      const campaigns = Array.isArray(data)
        ? data.map(normalizeSaleCampaign).filter(Boolean)
        : []

      saleCampaignCache = campaigns.length > 0 ? campaigns : fallbackCampaigns
      saveJson(SALE_CAMPAIGN_STORAGE_KEY, saleCampaignCache)

      return saleCampaignCache
    } catch (error) {
      console.error("Sale campaigns fetch error:", error)
      saleCampaignCache = fallbackCampaigns
      return fallbackCampaigns
    } finally {
      saleCampaignPromise = null
    }
  })()

  return saleCampaignPromise
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

    return campaignBrand && campaignBrand === productBrand
  }

  if (applyOn === "product" || applyOn === "selected-product" || applyOn === "selectedproduct") {
    const campaignProductId = String(
      campaign?.productId ||
        campaign?.targetProductId ||
        campaign?.selectedProductId ||
        ""
    ).trim()

    return campaignProductId && campaignProductId === String(product?.id)
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

  if (originalPrice <= 0 || discountValue <= 0) {
    return null
  }

  const discountType = String(
    campaign?.discountType ||
      campaign?.type ||
      "percent"
  ).toLowerCase()

  let discountAmount = 0

  if (
    discountType === "percentage" ||
    discountType === "percent" ||
    discountType === "%"
  ) {
    discountAmount = Math.round((originalPrice * discountValue) / 100)
  } else {
    discountAmount = Math.round(discountValue)
  }

  const salePrice = Math.max(originalPrice - discountAmount, 0)

  if (salePrice >= originalPrice) {
    return null
  }

  return {
    campaignId: campaign?.id || "",
    title:
      campaign?.title ||
      campaign?.name ||
      campaign?.offerTitle ||
      "Festival Sale",
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

function getBestSaleForProduct(product, campaigns) {
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
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

function saveCartItem(product, saleInfo) {
  if (typeof window === "undefined") return false

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

  const finalPrice = saleInfo?.salePrice ?? Number(product.price) ?? 0

  const cartItem = {
    cartItemId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    productId: product.id,
    id: product.id,
    title: product.title,
    brand: product.brand || "Mobisphere",
    image: product.image || "/images/IPhone 16 Pro Max.png",
    description: product.description || "",
    price: Number(finalPrice) || 0,
    originalPrice: Number(product.price) || 0,
    salePrice: saleInfo?.salePrice || null,
    saleDiscountAmount: saleInfo?.discountAmount || 0,
    saleDiscountLabel: saleInfo?.discountLabel || "",
    saleCampaignId: saleInfo?.campaignId || "",
    saleCampaignTitle: saleInfo?.title || "",
    saleCampaignEndDate: saleInfo?.endsAt || "",
    quantity: 1,
    stockQty: stock,
    minStockAlert: getMinimumStockAlert(product),
  }

  currentCart.push(cartItem)
  localStorage.setItem("mobisphereCart", JSON.stringify(currentCart))

  return true
}

export default function ProductDisplayCard({ product }) {
  const router = useRouter()
  const [saleCampaigns, setSaleCampaigns] = useState(() => readStoredSaleCampaigns())

  useEffect(() => {
    let isMounted = true

    fetchSaleCampaigns().then((campaigns) => {
      if (isMounted) {
        setSaleCampaigns(campaigns)
      }
    })

    const handleSaleCampaignChange = () => {
      saleCampaignCache = null
      fetchSaleCampaigns().then((campaigns) => {
        if (isMounted) {
          setSaleCampaigns(campaigns)
        }
      })
    }

    window.addEventListener("storage", handleSaleCampaignChange)
    window.addEventListener("mobisphereSaleCampaignsChanged", handleSaleCampaignChange)

    return () => {
      isMounted = false
      window.removeEventListener("storage", handleSaleCampaignChange)
      window.removeEventListener("mobisphereSaleCampaignsChanged", handleSaleCampaignChange)
    }
  }, [])

  if (!product) return null

  const productImage = product.image || "/images/IPhone 16 Pro Max.png"
  const productTitle = product.title || "Mobisphere Product"
  const productBrand = product.brand || "Mobisphere"
  const productPrice = Number(product.price) || 0
  const stockStatus = getStockStatus(product)
  const isOutOfStock = stockStatus.type === "out"
  const saleInfo = getBestSaleForProduct(product, saleCampaigns)
  const finalPrice = saleInfo?.salePrice ?? productPrice
  const hasSale = Boolean(saleInfo)

  const goToDetails = () => {
    router.push(`/product/${product.id}`)
  }

  const handleAddToCart = (event) => {
    event.stopPropagation()

    if (isOutOfStock) {
      alert("This product is currently out of stock.")
      return
    }

    const saved = saveCartItem(product, saleInfo)

    if (saved) {
      alert(`${productTitle} has been added to your cart!`)
    }
  }

  const handleBuyNow = (event) => {
    event.stopPropagation()

    if (isOutOfStock) {
      alert("This product is currently out of stock.")
      return
    }

    router.push(`/payment?productId=${product.id}`)
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={goToDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          goToDetails()
        }
      }}
      className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-[2rem] sm:p-4"
    >
      <div className="relative flex h-[155px] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 via-white to-slate-200 p-3 sm:h-[260px] sm:rounded-[1.5rem] sm:p-5 lg:h-[285px]">
        <div
          className={`absolute left-2 top-2 z-10 rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-wider shadow-sm sm:left-3 sm:top-3 sm:text-[10px] ${stockStatus.className}`}
        >
          {stockStatus.label}
        </div>

        {hasSale && !isOutOfStock && (
          <div className="absolute right-2 top-2 z-10 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-orange-700 shadow-sm sm:right-3 sm:top-3 sm:text-[10px]">
            {saleInfo.discountLabel}
          </div>
        )}

        <img
          src={productImage}
          alt={product.alt || productTitle}
          loading="lazy"
          className={`h-full max-h-full w-full max-w-full object-contain transition duration-500 group-hover:scale-105 ${
            isOutOfStock ? "opacity-55 grayscale" : ""
          }`}
        />
      </div>

      <div className="mt-3 flex flex-1 flex-col sm:mt-5">
        <p className="line-clamp-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600 sm:text-xs sm:tracking-[0.25em]">
          {productBrand}
        </p>

        <h3 className="mt-1 line-clamp-2 min-h-[38px] text-[13px] font-black leading-5 text-slate-950 sm:mt-2 sm:min-h-[56px] sm:text-xl sm:leading-7">
          {productTitle}
        </h3>

        <p className="hidden sm:mt-1 sm:line-clamp-2 sm:block sm:min-h-[44px] sm:text-sm sm:leading-6 sm:text-slate-600">
          {product.description || "Premium smartphone available at Mobisphere."}
        </p>

        <div className="mt-2 flex flex-col gap-1 sm:mt-4">
          {hasSale && !isOutOfStock ? (
            <>
              <div className="flex flex-wrap items-end gap-2">
                <p className="text-sm font-black text-emerald-700 sm:text-2xl">
                  ₹{finalPrice.toLocaleString()}
                </p>

                <p className="text-[11px] font-black text-slate-400 line-through sm:text-sm">
                  ₹{productPrice.toLocaleString()}
                </p>
              </div>

              <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 sm:text-xs">
                {saleInfo.title} • You save ₹{saleInfo.discountAmount.toLocaleString()}
              </p>
            </>
          ) : (
            <p className="text-sm font-black text-slate-900 sm:text-2xl">
              ₹{productPrice.toLocaleString()}
            </p>
          )}

          <p
            className={`text-[10px] font-black uppercase tracking-wider sm:text-xs ${
              isOutOfStock
                ? "text-rose-600"
                : stockStatus.type === "low"
                  ? "text-amber-600"
                  : "text-emerald-600"
            }`}
          >
            {isOutOfStock ? "Currently unavailable" : stockStatus.helper}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`rounded-xl px-2 py-2 text-[10px] font-black transition sm:rounded-full sm:px-4 sm:py-3 sm:text-xs ${
            isOutOfStock
              ? "cursor-not-allowed bg-slate-200 text-slate-500"
              : "bg-slate-950 text-white hover:bg-slate-800"
          }`}
        >
          {isOutOfStock ? "Unavailable" : "Add Cart"}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className={`rounded-xl border px-2 py-2 text-[10px] font-black transition sm:rounded-full sm:px-4 sm:py-3 sm:text-xs ${
            isOutOfStock
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
              : "border-emerald-600 bg-emerald-600 text-slate-950 hover:bg-emerald-500"
          }`}
        >
          {isOutOfStock ? "Out of Stock" : "Buy Now"}
        </button>
      </div>
    </article>
  )
}
