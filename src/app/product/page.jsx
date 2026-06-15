"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useProductContext } from "@/app/context/ProductContext"
import ProductDisplayCard from "@/app/components/product/ProductDisplayCard"

const SALE_CAMPAIGN_STORAGE_KEY = "mobisphereSaleCampaigns"

function getStockQuantity(product) {
  const value =
    product?.stockQty ??
    product?.stockQuantity ??
    product?.stock ??
    product?.quantity ??
    0

  const stock = Number(value)
  return Number.isFinite(stock) ? stock : 0
}

function getMinimumStockAlert(product) {
  const value =
    product?.minStockAlert ??
    product?.minimumStockAlert ??
    product?.lowStockLimit ??
    3

  const minStock = Number(value)
  return Number.isFinite(minStock) ? minStock : 3
}

function getStockStatus(product) {
  const stock = getStockQuantity(product)
  const minStock = getMinimumStockAlert(product)

  if (stock <= 0) {
    return {
      label: "Out of Stock",
      type: "out",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    }
  }

  if (stock <= minStock) {
    return {
      label: "Low Stock",
      type: "low",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    }
  }

  return {
    label: "In Stock",
    type: "in",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }
}

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback

  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null")
    return parsed ?? fallback
  } catch {
    return fallback
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
      campaign?.brand || campaign?.targetBrand || campaign?.selectedBrand || ""
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
      campaign?.productId || campaign?.targetProductId || campaign?.selectedProductId || ""
    ).trim()

    return campaignProductId && campaignProductId === String(product?.id)
  }

  return false
}

function calculateCampaignPrice(product, campaign) {
  const originalPrice = Number(product?.price) || 0
  const discountValue = Number(
    campaign?.discountValue ?? campaign?.discount ?? campaign?.discountPercent ?? 0
  )

  if (originalPrice <= 0 || discountValue <= 0) return null

  const discountType = String(campaign?.discountType || campaign?.type || "percentage").toLowerCase()
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

function getActiveSaleCampaigns(campaigns) {
  return (Array.isArray(campaigns) ? campaigns : [])
    .filter((campaign) => campaign?.active !== false)
    .filter((campaign) => isCampaignDateActive(campaign))
}

function getBestSaleForProduct(product, campaigns) {
  const validSales = getActiveSaleCampaigns(campaigns)
    .filter((campaign) => campaignMatchesProduct(campaign, product))
    .map((campaign) => calculateCampaignPrice(product, campaign))
    .filter(Boolean)
    .sort((a, b) => b.discountAmount - a.discountAmount)

  return validSales[0] || null
}

export default function ProductPage() {
  const { products, hydrated } = useProductContext()

  const [view, setView] = useState("brands")
  const [selectedBrand, setSelectedBrand] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortOrder, setSortOrder] = useState("none")
  const [stockFilter, setStockFilter] = useState("all")
  const [saleFilter, setSaleFilter] = useState("all")
  const [saleCampaigns, setSaleCampaigns] = useState([])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchTerm])


  useEffect(() => {
    if (typeof window === "undefined") return

    const syncSaleCampaigns = () => {
      const storedCampaigns = readJson(SALE_CAMPAIGN_STORAGE_KEY, [])
      setSaleCampaigns(Array.isArray(storedCampaigns) ? storedCampaigns : [])
    }

    syncSaleCampaigns()
    window.addEventListener("storage", syncSaleCampaigns)

    return () => window.removeEventListener("storage", syncSaleCampaigns)
  }, [])

  const safeProducts = useMemo(() => {
    return Array.isArray(products) ? products : []
  }, [products])


  const activeSaleCampaigns = useMemo(() => {
    return getActiveSaleCampaigns(saleCampaigns)
  }, [saleCampaigns])

  const stockSummary = useMemo(() => {
    const totalStockUnits = safeProducts.reduce((sum, product) => {
      return sum + getStockQuantity(product)
    }, 0)

    const inStock = safeProducts.filter(
      (product) => getStockStatus(product).type === "in"
    ).length

    const lowStock = safeProducts.filter(
      (product) => getStockStatus(product).type === "low"
    ).length

    const outOfStock = safeProducts.filter(
      (product) => getStockStatus(product).type === "out"
    ).length

    const saleProducts = safeProducts.filter((product) => {
      return Boolean(getBestSaleForProduct(product, activeSaleCampaigns))
    }).length

    const bestSaving = safeProducts.reduce((max, product) => {
      const saleInfo = getBestSaleForProduct(product, activeSaleCampaigns)
      return Math.max(max, saleInfo?.discountAmount || 0)
    }, 0)

    return {
      totalProducts: safeProducts.length,
      totalStockUnits,
      inStock,
      lowStock,
      outOfStock,
      saleProducts,
      activeSales: activeSaleCampaigns.length,
      bestSaving,
    }
  }, [safeProducts, activeSaleCampaigns])

  const uniqueBrands = useMemo(() => {
    return [
      ...new Set(
        safeProducts.map((product) => product.brand || "Other Models")
      ),
    ].sort((a, b) => a.localeCompare(b))
  }, [safeProducts])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase()
    let result = []

    if (normalizedSearch) {
      result = safeProducts.filter((product) => {
        const title = product.title?.toLowerCase() || ""
        const brand = product.brand?.toLowerCase() || ""
        const description = product.description?.toLowerCase() || ""

        return (
          title.includes(normalizedSearch) ||
          brand.includes(normalizedSearch) ||
          description.includes(normalizedSearch)
        )
      })
    } else if (saleFilter === "sale") {
      result = safeProducts
    } else if (view === "products" && selectedBrand) {
      result = safeProducts.filter(
        (product) => (product.brand || "Other Models") === selectedBrand
      )
    } else {
      return []
    }

    if (stockFilter !== "all") {
      result = result.filter((product) => {
        return getStockStatus(product).type === stockFilter
      })
    }

    if (saleFilter === "sale") {
      result = result.filter((product) => {
        return Boolean(getBestSaleForProduct(product, activeSaleCampaigns))
      })
    }

    const sorted = [...result]

    if (sortOrder === "asc") {
      sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
    }

    if (sortOrder === "desc") {
      sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
    }

    if (sortOrder === "name-asc") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    }

    if (sortOrder === "name-desc") {
      sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""))
    }

    if (sortOrder === "stock-high") {
      sorted.sort((a, b) => getStockQuantity(b) - getStockQuantity(a))
    }

    if (sortOrder === "stock-low") {
      sorted.sort((a, b) => getStockQuantity(a) - getStockQuantity(b))
    }

    if (sortOrder === "sale-high") {
      sorted.sort((a, b) => {
        const saleA = getBestSaleForProduct(a, activeSaleCampaigns)?.discountAmount || 0
        const saleB = getBestSaleForProduct(b, activeSaleCampaigns)?.discountAmount || 0
        return saleB - saleA
      })
    }

    return sorted
  }, [
    safeProducts,
    view,
    selectedBrand,
    debouncedSearch,
    sortOrder,
    stockFilter,
    saleFilter,
    activeSaleCampaigns,
  ])

  const hasSearchTerm = searchTerm.trim().length > 0
  const isSearchingUI = searchTerm !== debouncedSearch
  const showProductGrid =
    hasSearchTerm || saleFilter === "sale" || (view === "products" && selectedBrand)

  const showNoResults =
    !isSearchingUI &&
    (hasSearchTerm || stockFilter !== "all" || saleFilter !== "all") &&
    (debouncedSearch.trim().length > 0 || stockFilter !== "all" || saleFilter !== "all") &&
    filteredProducts.length === 0 &&
    showProductGrid

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand)
    setView("products")
    setSearchTerm("")
    setDebouncedSearch("")
    setSortOrder("none")
    setStockFilter("all")
    setSaleFilter("all")
  }

  const handleBackToBrands = () => {
    setView("brands")
    setSelectedBrand("")
    setSortOrder("none")
    setStockFilter("all")
    setSaleFilter("all")
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    setDebouncedSearch("")
    setSortOrder("none")
    setStockFilter("all")
    setSaleFilter("all")
  }

  if (!hydrated) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">
            Loading Products
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10">
      <header className="mb-5 rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-xl sm:mb-8 sm:rounded-[2rem] sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 sm:text-xs">
              Mobisphere Store
            </p>

            <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-4xl">
              {isSearchingUI && hasSearchTerm
                ? "Searching..."
                : hasSearchTerm
                  ? "Search Results"
                  : view === "brands"
                    ? "Browse by Brand"
                    : `Mobiles from ${selectedBrand}`}
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
              {isSearchingUI && hasSearchTerm
                ? `Looking up ${searchTerm}...`
                : hasSearchTerm
                  ? `Showing results for ${debouncedSearch}`
                  : view === "brands"
                    ? "Select a company to see all available models with live stock status."
                    : "Explore smartphones with product photos, stock quantity, and availability status."}
            </p>
          </div>

          <div className="w-full md:max-w-md">
            <div className="relative flex h-12 w-full items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition-all duration-300 focus-within:border-slate-400 focus-within:shadow-md sm:h-14">
              <div className="grid h-full w-12 shrink-0 place-items-center text-slate-400 sm:w-14">
                {isSearchingUI && hasSearchTerm ? (
                  <svg
                    className="h-5 w-5 animate-spin text-emerald-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
              </div>

              <input
                className="h-full w-full min-w-0 bg-transparent text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
                type="text"
                placeholder="Search smartphones, brands..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              {(hasSearchTerm || stockFilter !== "all" || saleFilter !== "all") && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="grid h-full w-12 shrink-0 place-items-center text-slate-400 transition-colors hover:text-slate-700 sm:w-14"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Products
            </p>
            <p className="mt-1 text-lg font-black text-slate-950">
              {stockSummary.totalProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-orange-600">
              Sale Products
            </p>
            <p className="mt-1 text-lg font-black text-orange-700">
              {stockSummary.saleProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
              Stock Units
            </p>
            <p className="mt-1 text-lg font-black text-emerald-700">
              {stockSummary.totalStockUnits}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">
              Low Stock
            </p>
            <p className="mt-1 text-lg font-black text-amber-700">
              {stockSummary.lowStock}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-rose-600">
              Out of Stock
            </p>
            <p className="mt-1 text-lg font-black text-rose-700">
              {stockSummary.outOfStock}
            </p>
          </div>
        </div>
      </header>

      {activeSaleCampaigns.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-[1.75rem] border border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-emerald-50 p-5 shadow-xl sm:mb-8 sm:rounded-[2rem] sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-700">
                Festival Sale Live
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                {activeSaleCampaigns[0]?.title || activeSaleCampaigns[0]?.name || "Mobisphere Sale"}
              </h2>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-600 sm:text-sm">
                {stockSummary.saleProducts} products have active sale pricing.
                {stockSummary.bestSaving > 0 ? ` Best saving up to ₹${stockSummary.bestSaving.toLocaleString()}.` : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSaleFilter("sale")
                setSearchTerm("")
                setDebouncedSearch("")
              }}
              className="w-fit rounded-full bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-slate-800"
            >
              View Sale Products
            </button>
          </div>
        </div>
      )}

      {!showNoResults && showProductGrid && (
        <div
          className={`mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row ${
            view === "products" && !hasSearchTerm
              ? "items-start justify-between sm:items-center"
              : "items-start justify-end sm:items-center"
          }`}
        >
          {view === "products" && !hasSearchTerm && (
            <button
              type="button"
              onClick={handleBackToBrands}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-800 shadow-sm transition hover:bg-slate-200 sm:px-5 sm:text-sm"
            >
              ← Back to All Brands
            </button>
          )}

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-start">
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <label
                htmlFor="stockFilter"
                className="text-[10px] font-black uppercase tracking-wider text-slate-400"
              >
                Stock
              </label>

              <select
                id="stockFilter"
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900 sm:px-4 sm:text-xs"
              >
                <option value="all">All Stock</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <label
                htmlFor="saleFilter"
                className="text-[10px] font-black uppercase tracking-wider text-slate-400"
              >
                Sale
              </label>

              <select
                id="saleFilter"
                value={saleFilter}
                onChange={(event) => setSaleFilter(event.target.value)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900 sm:px-4 sm:text-xs"
              >
                <option value="all">All Products</option>
                <option value="sale">Sale Products</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <label
                htmlFor="sort"
                className="text-[10px] font-black uppercase tracking-wider text-slate-400"
              >
                Sort By
              </label>

              <select
                id="sort"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900 sm:px-4 sm:text-xs"
              >
                <option value="none">Featured</option>
                <option value="asc">Price: Low to High</option>
                <option value="desc">Price: High to Low</option>
                <option value="stock-high">Stock: High to Low</option>
                <option value="stock-low">Stock: Low to High</option>
                <option value="sale-high">Biggest Sale Saving</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {hasSearchTerm || (showProductGrid && (stockFilter !== "all" || saleFilter !== "all")) ? (
        showNoResults ? (
          <div className="mt-6 rounded-[1.75rem] border border-rose-100 bg-rose-50 p-8 text-center shadow-sm sm:mt-8 sm:rounded-[2rem] sm:p-16">
            <div className="mb-4 text-4xl opacity-80 sm:mb-5 sm:text-5xl">
              🔍
            </div>

            <p className="text-lg font-black text-rose-900 sm:text-xl">
              No products found
            </p>

            <p className="mt-2 text-xs font-bold text-rose-700 sm:text-sm">
              Nothing matched your search or stock filter.
            </p>

            <button
              type="button"
              onClick={handleClearSearch}
              className="mt-6 rounded-full bg-rose-600 px-6 py-2 text-xs font-black text-white shadow-md transition hover:bg-rose-700"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 items-stretch gap-3 transition-opacity duration-300 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
              isSearchingUI ? "opacity-50" : "opacity-100"
            }`}
          >
            {filteredProducts.map((product) => (
              <ProductDisplayCard key={product.id} product={product} />
            ))}
          </div>
        )
      ) : view === "brands" ? (
        uniqueBrands.length === 0 ? (
          <div className="rounded-[1.75rem] border border-slate-100 bg-white p-8 text-center shadow-sm sm:rounded-[2rem] sm:p-16">
            <p className="text-xl font-black text-slate-900">
              No brands available
            </p>
            <p className="mt-2 text-sm font-bold text-slate-500">
              Add products from the admin panel first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {uniqueBrands.map((brand) => {
              const brandProducts = safeProducts.filter(
                (product) => (product.brand || "Other Models") === brand
              )

              const brandProductCount = brandProducts.length
              const brandStockUnits = brandProducts.reduce((sum, product) => {
                return sum + getStockQuantity(product)
              }, 0)

              const brandLowStock = brandProducts.filter(
                (product) => getStockStatus(product).type === "low"
              ).length

              const brandOutOfStock = brandProducts.filter(
                (product) => getStockStatus(product).type === "out"
              ).length

              const brandSaleProducts = brandProducts.filter((product) => {
                return Boolean(getBestSaleForProduct(product, activeSaleCampaigns))
              }).length

              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandSelect(brand)}
                  className="group min-h-[155px] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-h-[205px] sm:rounded-3xl sm:p-8 sm:hover:-translate-y-1.5 sm:hover:shadow-2xl"
                >
                  <div className="mb-3 text-3xl opacity-80 group-hover:opacity-100 sm:mb-4 sm:text-4xl">
                    📱
                  </div>

                  <h3 className="line-clamp-1 text-base font-black text-slate-900 sm:text-2xl">
                    {brand}
                  </h3>

                  <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 group-hover:text-emerald-600 sm:text-sm">
                    {brandProductCount} Models Available
                  </p>

                  {brandSaleProducts > 0 && (
                    <p className="mt-2 w-fit rounded-full bg-orange-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-orange-700">
                      {brandSaleProducts} Sale Deals
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                      {brandStockUnits} Units
                    </span>

                    <span
                      className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${
                        brandOutOfStock > 0
                          ? "bg-rose-50 text-rose-700"
                          : brandLowStock > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {brandOutOfStock > 0
                        ? `${brandOutOfStock} Out`
                        : brandLowStock > 0
                          ? `${brandLowStock} Low`
                          : "Healthy"}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-8 text-center shadow-sm sm:rounded-[2rem] sm:p-16">
          <p className="text-xl font-black text-slate-900">
            No products available
          </p>
          <p className="mt-2 text-sm font-bold text-slate-500">
            This brand has no products yet.
          </p>
          <button
            type="button"
            onClick={handleBackToBrands}
            className="mt-6 rounded-full bg-slate-900 px-6 py-2 text-xs font-black text-white shadow-md transition hover:bg-slate-800"
          >
            Back to Brands
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductDisplayCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}