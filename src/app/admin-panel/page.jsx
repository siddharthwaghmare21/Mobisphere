"use client"

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { productData } from '@/app/components/common/ProductCart'
import { supabase } from '@/lib/supabase'
import { useProductContext } from '@/app/context/ProductContext'

// Storage Keys
const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const COUPON_STORAGE_KEY = 'mobisphereCoupons'
const SALE_CAMPAIGNS_STORAGE_KEY = 'mobisphereSaleCampaigns'
const ADMIN_USERS_KEY = 'mobisphereAdminUsers'
const CART_STORAGE_KEY = 'mobisphereCart'
const ORDERS_STORAGE_KEY = 'mobisphereOrders'
const ORDERS_TABLE_NAME = 'mobisphere_orders'
const COUPONS_TABLE_NAME = 'mobisphere_coupons'
const SALE_CAMPAIGNS_TABLE_NAME = 'mobisphere_sale_campaigns'
const ADMIN_ACCESS_KEY = 'ALT+SHIFT+A'

function loadJson(key) {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function saveJson(key, val) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(val))
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || file.size === 0) {
      resolve('')
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

function getStockQuantity(product) {
  return Math.max(Number(product?.stockQty ?? product?.stock ?? 0), 0)
}

function getMinStockAlert(product) {
  return Math.max(Number(product?.minStockAlert ?? 3), 0)
}

function getStockStatusDetails(product) {
  const stockQty = getStockQuantity(product)
  const minStockAlert = getMinStockAlert(product)

  if (stockQty <= 0) {
    return {
      label: 'Out of Stock',
      className: 'bg-rose-100 text-rose-800 border border-rose-200',
      dotClassName: 'bg-rose-500'
    }
  }

  if (stockQty <= minStockAlert) {
    return {
      label: 'Low Stock',
      className: 'bg-amber-100 text-amber-800 border border-amber-200',
      dotClassName: 'bg-amber-500'
    }
  }

  return {
    label: 'In Stock',
    className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    dotClassName: 'bg-emerald-500'
  }
}

function getOrderDate(order) {
  const rawDate = order?.date || order?.createdAt || order?.created_at || order?.orderDate
  const date = new Date(rawDate || 0)
  return Number.isNaN(date.getTime()) ? null : date
}

function isSameCalendarDay(dateA, dateB) {
  if (!dateA || !dateB) return false
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

function getRangeStart(range) {
  const now = new Date()
  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (range === 'week') {
    const date = new Date(now)
    date.setDate(now.getDate() - 7)
    date.setHours(0, 0, 0, 0)
    return date
  }
  if (range === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return null
}

function filterOrdersByRange(orders, range) {
  const safeOrders = Array.isArray(orders) ? orders : []
  const start = getRangeStart(range)

  if (!start || range === 'all') return safeOrders

  return safeOrders.filter((order) => {
    const date = getOrderDate(order)
    return date ? date >= start : false
  })
}

function getOrderCustomerName(order) {
  return order?.customer || order?.customerName || order?.fullName || 'Customer'
}

function getOrderMobile(order) {
  return order?.mobileNumber || order?.mobile || order?.phone || '—'
}

function getOrderAddress(order) {
  return order?.address || order?.deliveryAddress || '—'
}

function getOrderTotal(order) {
  return Number(order?.total || order?.totalAmount || order?.amount || 0)
}

function sanitizeCsvValue(value) {
  const text = String(value ?? '').replace(/"/g, '""')
  return `"${text}"`
}

function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function buildInvoiceText(order, orderProducts = []) {
  const lines = [
    'MOBISPHERE MOBILE SHOP',
    'Invoice / Order Bill',
    '----------------------------------------',
    `Order ID: ${order?.id || '—'}`,
    `Date: ${order?.date ? new Date(order.date).toLocaleString() : '—'}`,
    `Customer: ${getOrderCustomerName(order)}`,
    `Mobile: ${getOrderMobile(order)}`,
    `Address: ${getOrderAddress(order)}`,
    `Status: ${order?.status || 'Processing'}`,
    '----------------------------------------',
    'Products:'
  ]

  if (orderProducts.length === 0) {
    lines.push('Product list not available for this order.')
  } else {
    orderProducts.forEach((item, index) => {
      const qty = Math.max(Number(item.quantity || 1), 1)
      const price = Number(item.price || 0)
      lines.push(`${index + 1}. ${item.title || 'Mobisphere Product'} | Qty: ${qty} | Price: ₹${price.toLocaleString()} | Total: ₹${(price * qty).toLocaleString()}`)
    })
  }

  lines.push('----------------------------------------')
  lines.push(`Grand Total: ₹${getOrderTotal(order).toLocaleString()}`)
  lines.push('Payment Mode: Cash on Delivery')
  lines.push('Thank you for shopping with Mobisphere!')

  return lines.join('\n')
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10)
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

function getCampaignStatus(campaign) {
  if (!campaign || campaign.active === false) {
    return {
      label: 'Inactive',
      className: 'bg-slate-200 text-slate-600'
    }
  }

  if (isDateAfterToday(campaign.startDate)) {
    return {
      label: 'Scheduled',
      className: 'bg-blue-100 text-blue-700'
    }
  }

  if (isDateBeforeToday(campaign.endDate)) {
    return {
      label: 'Expired',
      className: 'bg-rose-100 text-rose-700'
    }
  }

  return {
    label: 'Live',
    className: 'bg-emerald-100 text-emerald-700'
  }
}

function formatCampaignDiscount(campaign) {
  if (!campaign) return '—'
  const value = Number(campaign.discountValue || 0)
  return campaign.discountType === 'flat'
    ? `₹${value.toLocaleString()} OFF`
    : `${value}% OFF`
}

function getCampaignScopeLabel(campaign) {
  if (!campaign) return '—'
  if (campaign.scope === 'brand') return `Brand: ${campaign.brand || 'Not selected'}`
  if (campaign.scope === 'product') return `Product: ${campaign.productTitle || campaign.productId || 'Not selected'}`
  return 'All products'
}


function getOrderProductArray(order) {
  const products = order?.products || order?.cartItems || order?.itemsList || []
  return Array.isArray(products) ? products : []
}

function getOrderItemsCount(order) {
  const products = getOrderProductArray(order)
  const productQuantity = products.reduce((sum, item) => {
    return sum + Math.max(Number(item?.quantity || 1), 1)
  }, 0)

  return Math.max(Number(order?.items ?? productQuantity ?? 0), 0)
}

function orderFromSupabase(row) {
  const products = Array.isArray(row?.products) ? row.products : []
  const total = Number(row?.total ?? row?.total_amount ?? 0)

  return {
    id: String(row?.id || `ORD-${Date.now().toString(36).toUpperCase().slice(-5)}`),
    customer: row?.customer || row?.customer_name || 'Customer',
    customerName: row?.customer || row?.customer_name || 'Customer',
    mobileNumber: row?.mobile_number || row?.mobileNumber || row?.mobile || '',
    address: row?.address || row?.delivery_address || '',
    date: row?.date || row?.created_at || new Date().toISOString(),
    createdAt: row?.created_at || row?.date || '',
    updatedAt: row?.updated_at || '',
    total,
    totalAmount: Number(row?.total_amount ?? total),
    status: row?.status || 'Processing',
    items: Number(row?.items ?? products.length ?? 0),
    products,
    originalItemsTotal: Number(row?.original_items_total || 0),
    saleDiscountAmount: Number(row?.sale_discount_amount || 0),
    subtotalAfterSale: Number(row?.subtotal_after_sale || 0),
    discountPercent: Number(row?.discount_percent || 0),
    couponCode: row?.coupon_code || '',
    couponDiscountAmount: Number(row?.coupon_discount_amount || 0),
    paymentMode: row?.payment_mode || 'Cash on Delivery',
    note: row?.note || '',
    stockRestored: row?.stock_restored === true,
    stockRestoredAt: row?.stock_restored_at || '',
    enquiryId: row?.enquiry_id || '',
  }
}

function orderToSupabase(order) {
  const products = getOrderProductArray(order)
  const total = getOrderTotal(order)
  const date = order?.date || order?.createdAt || new Date().toISOString()

  return {
    id: String(order?.id || `ORD-${Date.now().toString(36).toUpperCase().slice(-5)}`),
    customer: getOrderCustomerName(order),
    mobile_number: getOrderMobile(order) === '—' ? '' : getOrderMobile(order),
    address: getOrderAddress(order) === '—' ? '' : getOrderAddress(order),
    date,
    total,
    total_amount: Number(order?.totalAmount ?? total),
    status: order?.status || 'Processing',
    items: getOrderItemsCount(order),
    products,
    original_items_total: Number(order?.originalItemsTotal || order?.original_items_total || 0),
    sale_discount_amount: Number(order?.saleDiscountAmount || order?.sale_discount_amount || 0),
    subtotal_after_sale: Number(order?.subtotalAfterSale || order?.subtotal_after_sale || 0),
    discount_percent: Number(order?.discountPercent || order?.discount_percent || 0),
    coupon_code: order?.couponCode || order?.coupon_code || '',
    coupon_discount_amount: Number(order?.couponDiscountAmount || order?.coupon_discount_amount || 0),
    payment_mode: order?.paymentMode || order?.payment_mode || 'Cash on Delivery',
    note: order?.note || '',
    stock_restored: order?.stockRestored === true,
    stock_restored_at: order?.stockRestoredAt || order?.stock_restored_at || null,
    enquiry_id: order?.enquiryId || order?.enquiry_id || null,
    updated_at: new Date().toISOString(),
  }
}

function couponFromSupabase(row) {
  return {
    id: String(row?.id || Date.now().toString()),
    code: String(row?.code || '').toUpperCase(),
    discountPercent: Number(row?.discount_percent ?? row?.discountPercent ?? 0),
    active: row?.active !== false,
    expiresAt: row?.expires_at || row?.expiresAt || '',
    expiryDate: row?.expires_at || row?.expiryDate || '',
    createdAt: row?.created_at || row?.createdAt || new Date().toISOString(),
    updatedAt: row?.updated_at || row?.updatedAt || '',
  }
}

function couponToSupabase(coupon) {
  return {
    id: String(coupon?.id || Date.now().toString()),
    code: String(coupon?.code || '').toUpperCase(),
    discount_percent: Number(coupon?.discountPercent ?? coupon?.discount_percent ?? 0),
    active: coupon?.active !== false,
    expires_at: coupon?.expiresAt || coupon?.expiryDate || coupon?.expires_at || null,
    updated_at: new Date().toISOString(),
  }
}

function campaignFromSupabase(row) {
  return {
    id: String(row?.id || `SALE-${Date.now().toString(36).toUpperCase()}`),
    title: row?.title || 'Mobisphere Sale',
    discountType: row?.discount_type || row?.discountType || 'percent',
    discountValue: Number(row?.discount_value ?? row?.discountValue ?? 0),
    scope: row?.scope || 'all',
    brand: row?.brand || '',
    productId: row?.product_id || row?.productId || '',
    productTitle: row?.product_title || row?.productTitle || '',
    startDate: row?.start_date || row?.startDate || getTodayDateString(),
    endDate: row?.end_date || row?.endDate || '',
    active: row?.active !== false,
    createdAt: row?.created_at || row?.createdAt || new Date().toISOString(),
    updatedAt: row?.updated_at || row?.updatedAt || '',
  }
}

function campaignToSupabase(campaign) {
  return {
    id: String(campaign?.id || `SALE-${Date.now().toString(36).toUpperCase()}`),
    title: campaign?.title || 'Mobisphere Sale',
    discount_type: campaign?.discountType || campaign?.discount_type || 'percent',
    discount_value: Number(campaign?.discountValue ?? campaign?.discount_value ?? 0),
    scope: campaign?.scope || 'all',
    brand: campaign?.brand || '',
    product_id: campaign?.productId || campaign?.product_id || '',
    product_title: campaign?.productTitle || campaign?.product_title || '',
    start_date: campaign?.startDate || campaign?.start_date || getTodayDateString(),
    end_date: campaign?.endDate || campaign?.end_date || null,
    active: campaign?.active !== false,
    updated_at: new Date().toISOString(),
  }
}

export default function IntegratedAdminPanelDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [adminUsers, setAdminUsers] = useState([])

  // Admin Login / Signup states
  const [regName, setRegName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [adminAccessKey, setAdminAccessKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [customers, setCustomers] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [activeTab, setActiveTab] = useState(1)
  const [message, setMessage] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Product Inventory States (from global context)
  const {
    products: localProducts,
    setProducts: setLocalProducts,
    refreshProductsFromSupabase,
    isSyncingProducts,
    syncError: productSyncError,
  } = useProductContext()
  const [inventoryView, setInventoryView] = useState('brands') // 'brands', 'products', 'form'
  const [selectedBrand, setSelectedBrand] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [stockProduct, setStockProduct] = useState(null)
  const [stockAddQty, setStockAddQty] = useState('')
  const [stockSupplier, setStockSupplier] = useState('')
  const [stockNote, setStockNote] = useState('')
  const [stockPurchasePrice, setStockPurchasePrice] = useState('')

  const [coupons, setCoupons] = useState([])
  const [newCouponCode, setNewCouponCode] = useState('')
  const [newDiscountPercent, setNewDiscountPercent] = useState('')
  const [newCouponExpiryDate, setNewCouponExpiryDate] = useState('')

  const [saleCampaigns, setSaleCampaigns] = useState([])
  const [newCampaignTitle, setNewCampaignTitle] = useState('')
  const [newCampaignDiscountType, setNewCampaignDiscountType] = useState('percent')
  const [newCampaignDiscountValue, setNewCampaignDiscountValue] = useState('')
  const [newCampaignScope, setNewCampaignScope] = useState('all')
  const [newCampaignBrand, setNewCampaignBrand] = useState('')
  const [newCampaignProductId, setNewCampaignProductId] = useState('')
  const [newCampaignStartDate, setNewCampaignStartDate] = useState(getTodayDateString())
  const [newCampaignEndDate, setNewCampaignEndDate] = useState('')

  const [orders, setOrders] = useState([])
  const [orderFilter, setOrderFilter] = useState('All')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [salesReportRange, setSalesReportRange] = useState('all')

  // 🔄 Supabase Live Data Fetch
  const fetchData = useCallback(async (showFeedback = false) => {
    if (showFeedback === true) setIsSyncing(true)

    try {
      const { data: cData, error: cError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (cError) throw cError

      const { data: eData, error: eError } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false })

      if (eError) throw eError

      const { data: oData, error: oError } = await supabase
        .from(ORDERS_TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false })

      if (oError) throw oError

      const { data: couponData, error: couponError } = await supabase
        .from(COUPONS_TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false })

      if (couponError) throw couponError

      const { data: campaignData, error: campaignError } = await supabase
        .from(SALE_CAMPAIGNS_TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false })

      if (campaignError) throw campaignError

      const serverOrders = Array.isArray(oData) ? oData.map(orderFromSupabase) : []
      const storedOrders = loadJson(ORDERS_STORAGE_KEY)
      const localOrders = Array.isArray(storedOrders) ? storedOrders : []
      const nextOrders = serverOrders.length > 0 ? serverOrders : localOrders

      const serverCoupons = Array.isArray(couponData) ? couponData.map(couponFromSupabase) : []
      const storedCoupons = loadJson(COUPON_STORAGE_KEY)
      const localCoupons = Array.isArray(storedCoupons) ? storedCoupons : []
      const nextCoupons = serverCoupons.length > 0 ? serverCoupons : localCoupons

      const serverCampaigns = Array.isArray(campaignData) ? campaignData.map(campaignFromSupabase) : []
      const storedSaleCampaigns = loadJson(SALE_CAMPAIGNS_STORAGE_KEY)
      const localSaleCampaigns = Array.isArray(storedSaleCampaigns) ? storedSaleCampaigns : []
      const nextCampaigns = serverCampaigns.length > 0 ? serverCampaigns : localSaleCampaigns

      setCustomers(cData || [])
      setEnquiries(eData || [])
      setOrders(nextOrders)
      setCoupons(nextCoupons)
      setSaleCampaigns(nextCampaigns)

      saveJson(ORDERS_STORAGE_KEY, nextOrders)
      saveJson(COUPON_STORAGE_KEY, nextCoupons)
      saveJson(SALE_CAMPAIGNS_STORAGE_KEY, nextCampaigns)

      if (showFeedback === true) {
        setMessage('✅ Customers, enquiries, orders, coupons, and sale campaigns synced successfully!')
      }
    } catch (err) {
      console.error('Supabase fetch error:', err)

      const storedOrders = loadJson(ORDERS_STORAGE_KEY)
      const storedCoupons = loadJson(COUPON_STORAGE_KEY)
      const storedSaleCampaigns = loadJson(SALE_CAMPAIGNS_STORAGE_KEY)

      if (Array.isArray(storedOrders)) setOrders(storedOrders)
      if (Array.isArray(storedCoupons)) setCoupons(storedCoupons)
      if (Array.isArray(storedSaleCampaigns)) setSaleCampaigns(storedSaleCampaigns)

      if (showFeedback === true) {
        setMessage('❌ Failed to sync live data. Check Supabase tables and policies.')
      }
    } finally {
      if (showFeedback === true) {
        setIsSyncing(false)
        setTimeout(() => setMessage(''), 3000)
      }
    }
  }, [])

  const handleSyncAllData = useCallback(async (showFeedback = true) => {
    if (showFeedback === true) setIsSyncing(true)

    try {
      await fetchData(false)

      if (typeof refreshProductsFromSupabase === 'function') {
        await refreshProductsFromSupabase()
      }

      if (showFeedback === true) {
        setMessage('✅ Customers, enquiries, orders, products, coupons, and sale campaigns synced successfully!')
      }
    } catch (err) {
      console.error('Mobisphere full sync error:', err)
      if (showFeedback === true) {
        setMessage('❌ Failed to sync complete admin data. Check Supabase connection.')
      }
    } finally {
      if (showFeedback === true) {
        setIsSyncing(false)
        setTimeout(() => setMessage(''), 3000)
      }
    }
  }, [fetchData, refreshProductsFromSupabase])

  useEffect(() => {
    const session = loadJson(ADMIN_SESSION_KEY)
    const storedAdmins = loadJson(ADMIN_USERS_KEY)
    const storedCoupons = loadJson(COUPON_STORAGE_KEY) || []
    const storedSaleCampaigns = loadJson(SALE_CAMPAIGNS_STORAGE_KEY) || []
    const storedOrders = loadJson(ORDERS_STORAGE_KEY)

    queueMicrotask(() => {
      if (session) {
        setIsLoggedIn(true)
        setUsername(session.username || 'Admin')
      }
      setAdminUsers(Array.isArray(storedAdmins) ? storedAdmins : [])
      setCoupons(Array.isArray(storedCoupons) ? storedCoupons.map((coupon) => ({ active: coupon.active !== false, expiresAt: coupon.expiresAt || coupon.expiryDate || '', ...coupon })) : [])
      setSaleCampaigns(Array.isArray(storedSaleCampaigns) ? storedSaleCampaigns.map((campaign) => ({ active: campaign.active !== false, scope: campaign.scope || 'all', discountType: campaign.discountType || 'percent', ...campaign })) : [])
      if (Array.isArray(storedOrders) && storedOrders.length > 0) {
        setOrders(storedOrders)
      }
      setHydrated(true)
    })

    if (session) {
      queueMicrotask(() => fetchData())
    }
  }, [fetchData])

  // Analytics Graph Logic
  const chartAnalytics = useMemo(() => {
    if (!hydrated) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        shippedOrders: 0,
        totalProducts: 0,
        totalBrands: 0,
        totalStockUnits: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        cartItems: 0,
        todayOrders: 0,
        todayRevenue: 0,
        topProducts: [],
        kpiCards: [],
        statusSummary: [],
        recentOrders: [],
        lastUpdated: ''
      }
    }

    const cartData = loadJson(CART_STORAGE_KEY) || []
    const safeCart = Array.isArray(cartData) ? cartData : []
    const safeOrders = Array.isArray(orders) ? orders : []
    const safeProducts = Array.isArray(localProducts) ? localProducts : []

    const productCount = new Map()
    const productRevenue = new Map()

    if (safeCart.length > 0) {
      safeCart.forEach((item) => {
        const pid = item.productId || item.id || item.title
        if (!pid) return

        const quantity = Number(item.quantity || 1)
        const price = Number(item.price || 0)

        productCount.set(pid, (productCount.get(pid) || 0) + quantity)
        productRevenue.set(pid, (productRevenue.get(pid) || 0) + price * quantity)
      })
    } else {
      const fallbackProducts = safeProducts.length > 0
        ? safeProducts.slice(0, 6)
        : Object.entries(productData || {}).slice(0, 6).map(([id, product]) => ({ id, ...product }))

      fallbackProducts.forEach((product, index) => {
        const pid = product.id || index + 1
        const quantity = Math.max(12 - index * 2, 2)
        const price = Number(product.price || 45000)

        productCount.set(pid, quantity)
        productRevenue.set(pid, price * quantity)
      })
    }

    const sortedProducts = [...productCount.entries()].sort((a, b) => b[1] - a[1])
    const maxCount = Math.max(...[...productCount.values()], 1)

    const topProducts = sortedProducts.slice(0, 6).map(([pid, count]) => {
      const contextProduct =
        safeProducts.find((product) => String(product.id) === String(pid)) ||
        productData?.[pid] ||
        {}

      return {
        title: contextProduct?.title?.replace('iPhone ', 'iP ') || String(pid),
        count,
        revenue: productRevenue.get(pid) || 0,
        heightStr: `${Math.min(Math.round((count / maxCount) * 82 + 12), 96)}%`
      }
    })

    const orderTotal = (order) => Number(order.total || order.totalAmount || order.amount || 0)
    const totalRevenue = safeOrders.reduce((sum, order) => sum + orderTotal(order), 0)
    const fallbackRevenue = [...productRevenue.values()].reduce((sum, value) => sum + value, 0)
    const finalRevenue = totalRevenue > 0 ? totalRevenue : fallbackRevenue
    const today = new Date()
    const todayOrdersList = safeOrders.filter((order) => isSameCalendarDay(getOrderDate(order), today))
    const todayRevenue = todayOrdersList.reduce((sum, order) => sum + orderTotal(order), 0)

    const countStatus = (status) =>
      safeOrders.filter((order) => String(order.status || '').toLowerCase() === status.toLowerCase()).length

    const processingOrders = countStatus('Processing')
    const shippedOrders = countStatus('Shipped')
    const deliveredOrders = countStatus('Delivered')
    const cancelledOrders = countStatus('Cancelled')

    const totalBrands = new Set(safeProducts.map((product) => product.brand || 'Other Models')).size
    const totalStockUnits = safeProducts.reduce((sum, product) => sum + getStockQuantity(product), 0)
    const lowStockProducts = safeProducts.filter((product) => {
      const stockQty = getStockQuantity(product)
      return stockQty > 0 && stockQty <= getMinStockAlert(product)
    }).length
    const outOfStockProducts = safeProducts.filter((product) => getStockQuantity(product) <= 0).length

    const recentOrders = [...safeOrders]
      .sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || a.created_at || 0).getTime()
        const dateB = new Date(b.date || b.createdAt || b.created_at || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 4)

    const statusSummary = [
      {
        status: 'Processing',
        count: processingOrders,
        className: 'border-amber-200 bg-amber-50 text-amber-700',
        icon: '⏳'
      },
      {
        status: 'Shipped',
        count: shippedOrders,
        className: 'border-blue-200 bg-blue-50 text-blue-700',
        icon: '🚚'
      },
      {
        status: 'Delivered',
        count: deliveredOrders,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: '✅'
      },
      {
        status: 'Cancelled',
        count: cancelledOrders,
        className: 'border-rose-200 bg-rose-50 text-rose-700',
        icon: '✕'
      }
    ]

    return {
      totalRevenue: finalRevenue,
      totalOrders: safeOrders.length,
      pendingOrders: processingOrders,
      deliveredOrders,
      cancelledOrders,
      shippedOrders,
      totalProducts: safeProducts.length,
      totalBrands,
      totalStockUnits,
      lowStockProducts,
      outOfStockProducts,
      cartItems: safeCart.length,
      todayOrders: todayOrdersList.length,
      todayRevenue,
      topProducts,
      statusSummary,
      recentOrders,
      lastUpdated: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      kpiCards: [
        {
          label: 'Total Revenue',
          value: `₹${finalRevenue.toLocaleString()}`,
          helper: 'Based on saved orders',
          icon: '₹',
          accent: 'text-emerald-600'
        },
        {
          label: 'Today Revenue',
          value: `₹${todayRevenue.toLocaleString()}`,
          helper: `${todayOrdersList.length} orders today`,
          icon: '📅',
          accent: 'text-emerald-700'
        },
        {
          label: 'Today Orders',
          value: todayOrdersList.length.toLocaleString(),
          helper: 'Orders received today',
          icon: '🧾',
          accent: 'text-cyan-600'
        },
        {
          label: 'Total Orders',
          value: safeOrders.length.toLocaleString(),
          helper: `${processingOrders} processing now`,
          icon: '🛒',
          accent: 'text-slate-900'
        },
        {
          label: 'Total Products',
          value: safeProducts.length.toLocaleString(),
          helper: `${totalStockUnits} stock units • ${totalBrands} brands`,
          icon: '📦',
          accent: 'text-blue-600'
        },
        {
          label: 'Customers',
          value: customers.length.toLocaleString(),
          helper: `${enquiries.length} enquiries tracked`,
          icon: '👥',
          accent: 'text-violet-600'
        },
        {
          label: 'Delivered',
          value: deliveredOrders.toLocaleString(),
          helper: 'Completed orders',
          icon: '✅',
          accent: 'text-emerald-600'
        },
        {
          label: 'Low Stock',
          value: lowStockProducts.toLocaleString(),
          helper: 'Products need refill',
          icon: '⚠️',
          accent: 'text-amber-600'
        },
        {
          label: 'Out of Stock',
          value: outOfStockProducts.toLocaleString(),
          helper: 'Products unavailable',
          icon: '⛔',
          accent: 'text-rose-600'
        },
        {
          label: 'Coupons',
          value: coupons.length.toLocaleString(),
          helper: `${safeCart.length} local cart records`,
          icon: '🎫',
          accent: 'text-pink-600'
        }
      ]
    }
  }, [hydrated, orders, localProducts, customers.length, enquiries.length, coupons.length])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }, [])


  const salesReportOrders = useMemo(() => {
    return filterOrdersByRange(orders, salesReportRange)
  }, [orders, salesReportRange])

  const salesReportStats = useMemo(() => {
    const safeOrders = Array.isArray(salesReportOrders) ? salesReportOrders : []
    const revenue = safeOrders.reduce((sum, order) => sum + getOrderTotal(order), 0)
    const items = safeOrders.reduce((sum, order) => {
      const orderProducts = order?.products || order?.cartItems || order?.itemsList || []
      const fallbackItems = Array.isArray(orderProducts) ? orderProducts.length : 0
      return sum + Number(order.items ?? fallbackItems ?? 0)
    }, 0)
    const delivered = safeOrders.filter((order) => String(order.status || '').toLowerCase() === 'delivered').length
    const cancelled = safeOrders.filter((order) => String(order.status || '').toLowerCase() === 'cancelled').length

    return {
      revenue,
      orders: safeOrders.length,
      items,
      delivered,
      cancelled
    }
  }, [salesReportOrders])

  // Admin Sign Up / Login Logic
  const resetAuthForm = () => {
    setRegName('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setAdminAccessKey('')
    setShowPassword(false)
    setMessage('')
  }

  const switchAuthMode = (mode) => {
    setIsRegistering(mode === 'signup')
    resetAuthForm()
  }

  const handleAuthSubmit = (e) => {
    e.preventDefault()
    const uname = username.trim()
    const cleanName = regName.trim()
    const cleanAccessKey = adminAccessKey.trim().toUpperCase()

    if (!uname || !password) {
      setMessage('Please enter username and password.')
      return
    }

    if (isRegistering) {
      if (!cleanName) {
        setMessage('Please enter admin full name.')
        return
      }

      if (password.length < 6) {
        setMessage('Password must be at least 6 characters.')
        return
      }

      if (password !== confirmPassword) {
        setMessage('Passwords do not match.')
        return
      }

      if (cleanAccessKey !== ADMIN_ACCESS_KEY) {
        setMessage('Invalid admin access code.')
        return
      }

      const exists = adminUsers.some((admin) => String(admin.username || '').toLowerCase() === uname.toLowerCase())
      if (exists) {
        setMessage('This username already exists. Use another username.')
        return
      }

      const newAdmin = {
        id: Date.now().toString(),
        name: cleanName,
        username: uname,
        password,
        createdAt: new Date().toISOString()
      }
      const updatedAdmins = [...adminUsers, newAdmin]

      setAdminUsers(updatedAdmins)
      saveJson(ADMIN_USERS_KEY, updatedAdmins)
      saveJson(ADMIN_SESSION_KEY, { username: uname, name: cleanName })
      setIsLoggedIn(true)
      setUsername(uname)
      setMessage('')
      fetchData()
      return
    }

    if (!Array.isArray(adminUsers) || adminUsers.length === 0) {
      setMessage('No admin account found. Create admin account using Sign Up.')
      return
    }

    const validAdmin = adminUsers.find(
      (admin) => String(admin.username || '').toLowerCase() === uname.toLowerCase() && admin.password === password
    )

    if (!validAdmin) {
      setMessage('Invalid username or password.')
      return
    }

    saveJson(ADMIN_SESSION_KEY, { username: validAdmin.username, name: validAdmin.name || validAdmin.username })
    setIsLoggedIn(true)
    setUsername(validAdmin.username)
    setMessage('')
    fetchData()
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    setIsLoggedIn(false)
    resetAuthForm()
  }

  const handleCustomerDelete = async (id) => {
    await supabase.from('customers').delete().eq('id', id)
    setCustomers(customers.filter(c => c.id !== id))
    setMessage('Customer deleted successfully.')
  }

  const handleEnquiryFieldChange = (enquiryId, field, value) => {
    setEnquiries(enquiries.map((e) => (e.id === enquiryId ? { ...e, [field]: value } : e)))
  }

  const handleSaveEnquiry = async (id) => {
    const target = enquiries.find(e => e.id === id)
    if (!target) return
    await supabase.from('enquiries').update({
      status: target.status,
      admin_note: target.admin_note
    }).eq('id', id)
    setMessage(`✅ Progress Saved for Enquiry ID: ${id}`)
    alert('Changes saved to Supabase!')
  }

  const handleEnquiryDelete = async (id) => {
    await supabase.from('enquiries').delete().eq('id', id)
    setEnquiries(enquiries.filter(e => e.id !== id))
    setMessage('Enquiry removed.')
  }

  const handleCreateCoupon = async (e) => {
    e.preventDefault()
    const code = newCouponCode.trim().toUpperCase()
    const percent = Number(newDiscountPercent)
    if (!code || percent <= 0 || percent > 100) {
      setMessage('Please enter a valid coupon code and discount percent.')
      return
    }

    const newCoupon = {
      id: Date.now().toString(),
      code,
      discountPercent: percent,
      active: true,
      expiresAt: newCouponExpiryDate || '',
      expiryDate: newCouponExpiryDate || '',
      createdAt: new Date().toISOString()
    }

    const next = [newCoupon, ...coupons.filter((coupon) => String(coupon.code || '').toUpperCase() !== code)]
    setCoupons(next)
    saveJson(COUPON_STORAGE_KEY, next)

    try {
      const { error } = await supabase
        .from(COUPONS_TABLE_NAME)
        .upsert(couponToSupabase(newCoupon), { onConflict: 'id' })

      if (error) throw error
      setMessage('Coupon code saved to Supabase!')
    } catch (error) {
      console.error('Coupon save error:', error)
      setMessage('Coupon saved locally, but Supabase sync failed.')
    }

    setNewCouponCode('')
    setNewDiscountPercent('')
    setNewCouponExpiryDate('')
  }

  const handleToggleCouponActive = async (id) => {
    let updatedCoupon = null
    const next = coupons.map((coupon) => {
      if (coupon.id !== id) return coupon
      updatedCoupon = { ...coupon, active: coupon.active === false ? true : false }
      return updatedCoupon
    })

    setCoupons(next)
    saveJson(COUPON_STORAGE_KEY, next)

    if (!updatedCoupon) return

    try {
      const { error } = await supabase
        .from(COUPONS_TABLE_NAME)
        .update({ active: updatedCoupon.active, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setMessage('Coupon status updated on Supabase.')
    } catch (error) {
      console.error('Coupon status update error:', error)
      setMessage('Coupon status changed locally, but Supabase sync failed.')
    }
  }

  const handleDeleteCoupon = async (id) => {
    const next = coupons.filter(c => c.id !== id)
    setCoupons(next)
    saveJson(COUPON_STORAGE_KEY, next)

    try {
      const { error } = await supabase
        .from(COUPONS_TABLE_NAME)
        .delete()
        .eq('id', id)

      if (error) throw error
      setMessage('Coupon removed from Supabase.')
    } catch (error) {
      console.error('Coupon delete error:', error)
      setMessage('Coupon removed locally, but Supabase sync failed.')
    }
  }

  const resetSaleCampaignForm = () => {
    setNewCampaignTitle('')
    setNewCampaignDiscountType('percent')
    setNewCampaignDiscountValue('')
    setNewCampaignScope('all')
    setNewCampaignBrand('')
    setNewCampaignProductId('')
    setNewCampaignStartDate(getTodayDateString())
    setNewCampaignEndDate('')
  }

  const handleCreateSaleCampaign = async (e) => {
    e.preventDefault()

    const title = newCampaignTitle.trim()
    const discountValue = Number(newCampaignDiscountValue)

    if (!title) {
      setMessage('Please enter sale campaign title.')
      return
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setMessage('Please enter a valid discount value.')
      return
    }

    if (newCampaignDiscountType === 'percent' && discountValue > 100) {
      setMessage('Percentage discount cannot be more than 100%.')
      return
    }

    if (newCampaignScope === 'brand' && !newCampaignBrand) {
      setMessage('Please select a brand for this campaign.')
      return
    }

    if (newCampaignScope === 'product' && !newCampaignProductId) {
      setMessage('Please select a product for this campaign.')
      return
    }

    const selectedProduct = Array.isArray(localProducts)
      ? localProducts.find((product) => String(product.id) === String(newCampaignProductId))
      : null

    const newCampaign = {
      id: `SALE-${Date.now().toString(36).toUpperCase()}`,
      title,
      discountType: newCampaignDiscountType,
      discountValue,
      scope: newCampaignScope,
      brand: newCampaignScope === 'brand' ? newCampaignBrand : '',
      productId: newCampaignScope === 'product' ? newCampaignProductId : '',
      productTitle: newCampaignScope === 'product' ? selectedProduct?.title || '' : '',
      startDate: newCampaignStartDate || getTodayDateString(),
      endDate: newCampaignEndDate || '',
      active: true,
      createdAt: new Date().toISOString()
    }

    const next = [newCampaign, ...saleCampaigns]
    setSaleCampaigns(next)
    saveJson(SALE_CAMPAIGNS_STORAGE_KEY, next)

    try {
      const { error } = await supabase
        .from(SALE_CAMPAIGNS_TABLE_NAME)
        .upsert(campaignToSupabase(newCampaign), { onConflict: 'id' })

      if (error) throw error
      setMessage('Festival sale campaign saved to Supabase!')
    } catch (error) {
      console.error('Sale campaign save error:', error)
      setMessage('Sale campaign saved locally, but Supabase sync failed.')
    }

    resetSaleCampaignForm()
  }

  const handleToggleSaleCampaign = async (id) => {
    let updatedCampaign = null
    const next = saleCampaigns.map((campaign) => {
      if (campaign.id !== id) return campaign
      updatedCampaign = { ...campaign, active: campaign.active === false ? true : false }
      return updatedCampaign
    })

    setSaleCampaigns(next)
    saveJson(SALE_CAMPAIGNS_STORAGE_KEY, next)

    if (!updatedCampaign) return

    try {
      const { error } = await supabase
        .from(SALE_CAMPAIGNS_TABLE_NAME)
        .update({ active: updatedCampaign.active, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setMessage('Sale campaign status updated on Supabase.')
    } catch (error) {
      console.error('Sale campaign status update error:', error)
      setMessage('Sale campaign status changed locally, but Supabase sync failed.')
    }
  }

  const handleDeleteSaleCampaign = async (id) => {
    const next = saleCampaigns.filter((campaign) => campaign.id !== id)
    setSaleCampaigns(next)
    saveJson(SALE_CAMPAIGNS_STORAGE_KEY, next)

    try {
      const { error } = await supabase
        .from(SALE_CAMPAIGNS_TABLE_NAME)
        .delete()
        .eq('id', id)

      if (error) throw error
      setMessage('Sale campaign removed from Supabase.')
    } catch (error) {
      console.error('Sale campaign delete error:', error)
      setMessage('Sale campaign removed locally, but Supabase sync failed.')
    }
  }

  const handleExportStockReport = () => {
    const safeProducts = Array.isArray(localProducts) ? localProducts : []
    const rows = [
      ['Brand', 'Product', 'Selling Price', 'Purchase Price', 'Stock', 'Minimum Alert', 'Status', 'Supplier']
    ]

    safeProducts.forEach((product) => {
      rows.push([
        product.brand || 'Other Models',
        product.title || 'Mobisphere Product',
        Number(product.price || 0),
        Number(product.purchasePrice || 0),
        getStockQuantity(product),
        getMinStockAlert(product),
        getStockStatusDetails(product).label,
        product.supplierName || ''
      ])
    })

    const csv = rows.map((row) => row.map(sanitizeCsvValue).join(',')).join('\n')
    downloadTextFile(`mobisphere-stock-report-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
    setMessage('Stock report downloaded successfully.')
  }

  const handlePrintInvoice = (order) => {
    if (typeof window === 'undefined' || !order) return
    const orderProducts = getOrderProducts(order)
    const invoiceText = buildInvoiceText(order, orderProducts)
    const printWindow = window.open('', '_blank', 'width=800,height=900')

    if (!printWindow) {
      alert('Popup blocked. Please allow popups to print invoice.')
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            pre { white-space: pre-wrap; font-size: 14px; line-height: 1.7; }
          </style>
        </head>
        <body>
          <pre>${invoiceText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleDownloadInvoice = (order) => {
    if (!order) return
    const orderProducts = getOrderProducts(order)
    downloadTextFile(`mobisphere-invoice-${order.id || Date.now()}.txt`, buildInvoiceText(order, orderProducts))
  }

  const handleConvertEnquiryToCustomer = async (enquiry) => {
    if (!enquiry) return

    try {
      const newCustomer = {
        full_name: enquiry.full_name || 'Visitor',
        mobile_number: enquiry.mobile_number || '',
        address: enquiry.address || ''
      }

      const { data, error } = await supabase.from('customers').insert([newCustomer]).select()

      if (error) throw error

      const createdCustomer = Array.isArray(data) && data.length > 0 ? data[0] : { ...newCustomer, id: `local-${Date.now()}` }
      setCustomers((prev) => [createdCustomer, ...prev])
      setEnquiries((prev) => prev.map((item) => item.id === enquiry.id ? { ...item, status: 'Converted', admin_note: 'Converted to customer.' } : item))
      setMessage('✅ Enquiry converted to customer successfully.')
    } catch (error) {
      console.error('Convert enquiry error:', error)
      setMessage('❌ Could not convert enquiry to customer. Check Supabase customer table fields.')
    }
  }

  const handleCreateOrderFromEnquiry = async (enquiry) => {
    if (!enquiry) return

    const order = {
      id: `ORD-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      customer: enquiry.full_name || 'Visitor',
      mobileNumber: enquiry.mobile_number || '',
      address: enquiry.address || '',
      date: new Date().toISOString(),
      total: 0,
      totalAmount: 0,
      status: 'Processing',
      items: 0,
      products: [],
      enquiryId: enquiry.id,
      note: enquiry.message || 'Order created from enquiry.',
      paymentMode: 'Cash on Delivery'
    }

    const nextOrders = [order, ...(Array.isArray(orders) ? orders : [])]
    setOrders(nextOrders)
    saveJson(ORDERS_STORAGE_KEY, nextOrders)

    try {
      const { error } = await supabase
        .from(ORDERS_TABLE_NAME)
        .upsert([orderToSupabase(order)], { onConflict: 'id' })

      if (error) throw error

      setMessage(`✅ Order ${order.id} created from enquiry and synced to Supabase.`)
    } catch (error) {
      console.error('Create order from enquiry error:', error)
      setMessage(`⚠️ Order ${order.id} created locally. Supabase sync failed.`)
    }

    setEnquiries((prev) => prev.map((item) => item.id === enquiry.id ? { ...item, status: 'Converted to Order', admin_note: `Order ${order.id} created from enquiry.` } : item))
    setSelectedOrder(order)
  }


  // --- Product Inventory Logic ---
  const uniqueBrands = [...new Set(localProducts.map(p => p.brand || 'Other Models'))]

  const handleOpenStockModal = (product) => {
    setStockProduct(product)
    setStockAddQty('')
    setStockSupplier(product?.supplierName || '')
    setStockNote('')
    setStockPurchasePrice(product?.purchasePrice ? String(product.purchasePrice) : '')
  }

  const handleCloseStockModal = () => {
    setStockProduct(null)
    setStockAddQty('')
    setStockSupplier('')
    setStockNote('')
    setStockPurchasePrice('')
  }

  const handleAddStock = (e) => {
    e.preventDefault()

    if (!stockProduct) return

    const quantityToAdd = Number(stockAddQty)
    const purchasePrice = Number(stockPurchasePrice || stockProduct.purchasePrice || 0)

    if (!Number.isFinite(quantityToAdd) || quantityToAdd <= 0) {
      setMessage('Please enter a valid stock quantity.')
      return
    }

    const stockEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
      quantity: quantityToAdd,
      supplier: stockSupplier.trim() || 'Not specified',
      note: stockNote.trim() || 'New stock added',
      purchasePrice
    }

    setLocalProducts((prev) =>
      prev.map((product) => {
        if (String(product.id) !== String(stockProduct.id)) return product

        const currentStock = getStockQuantity(product)
        const nextStock = currentStock + quantityToAdd

        return {
          ...product,
          stockQty: nextStock,
          purchasePrice,
          supplierName: stockSupplier.trim() || product.supplierName || '',
          stockHistory: [...(Array.isArray(product.stockHistory) ? product.stockHistory : []), stockEntry],
          lastStockUpdatedAt: new Date().toISOString()
        }
      })
    )

    setMessage(`✅ ${quantityToAdd} units added to ${stockProduct.title}.`)
    handleCloseStockModal()
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const imageFile = formData.get('image')
    const uploadedImage = imageFile && imageFile.size > 0 ? await fileToDataUrl(imageFile) : ''
    const imageUrl = uploadedImage || editingProduct?.image || '/images/IPhone 16 Pro Max.png'
    const brand = String(formData.get('brand') || 'Other Models').trim()
    const title = String(formData.get('title') || 'Untitled Product').trim()
    const stockQty = Math.max(Number(formData.get('stockQty') || editingProduct?.stockQty || 0), 0)
    const minStockAlert = Math.max(Number(formData.get('minStockAlert') || editingProduct?.minStockAlert || 3), 0)
    const purchasePrice = Math.max(Number(formData.get('purchasePrice') || editingProduct?.purchasePrice || 0), 0)
    const supplierName = String(formData.get('supplierName') || editingProduct?.supplierName || '').trim()

    const newProd = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      title,
      brand,
      price: Number(formData.get('price')),
      purchasePrice,
      stockQty,
      minStockAlert,
      supplierName,
      stockHistory: editingProduct?.stockHistory || [],
      lastStockUpdatedAt: editingProduct?.lastStockUpdatedAt || new Date().toISOString(),
      description: String(formData.get('description') || '').trim(),
      image: imageUrl,
      alt: title,
      specs: {
        RAM: formData.get('ram'),
        Storage: formData.get('storage'),
        Camera: formData.get('camera'),
        Battery: formData.get('battery'),
        Processor: formData.get('processor'),
        Charger: formData.get('charger'),
        Tools: formData.get('tools')
      }
    }
    setLocalProducts(prev => editingProduct ? prev.map(p => p.id === newProd.id ? newProd : p) : [...prev, newProd])
    setSelectedBrand(brand)
    setInventoryView('products')
    setEditingProduct(null)
    setMessage(`Product ${editingProduct ? 'updated' : 'added'} successfully!`)
  }

  const handleDeleteProduct = (id) => {
    setLocalProducts(prev => prev.filter(p => p.id !== id))
    if (stockProduct && String(stockProduct.id) === String(id)) {
      handleCloseStockModal()
    }
    setMessage('Product deleted successfully.')
  }

  const getOrderProducts = (order) => getOrderProductArray(order)

  const restoreStockForCancelledOrder = (order) => {
    const orderProducts = getOrderProducts(order)

    if (orderProducts.length === 0) return false

    setLocalProducts((prevProducts) => {
      const safeProducts = Array.isArray(prevProducts) ? prevProducts : []

      return safeProducts.map((product) => {
        const matchedOrderItems = orderProducts.filter((item) =>
          String(item.productId || item.id) === String(product.id)
        )

        if (matchedOrderItems.length === 0) return product

        const restoreQuantity = matchedOrderItems.reduce((sum, item) => {
          return sum + Math.max(Number(item.quantity || 1), 1)
        }, 0)

        const nextStock = getStockQuantity(product) + restoreQuantity

        const stockEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          date: new Date().toISOString(),
          quantity: restoreQuantity,
          supplier: 'Order Cancellation',
          note: `Stock restored after order ${order.id} was cancelled.`,
          purchasePrice: Number(product.purchasePrice || 0),
          type: 'order-cancel-restock',
          orderId: order.id
        }

        return {
          ...product,
          stockQty: nextStock,
          stockHistory: [
            ...(Array.isArray(product.stockHistory) ? product.stockHistory : []),
            stockEntry
          ],
          lastStockUpdatedAt: new Date().toISOString()
        }
      })
    })

    return true
  }

  const handleOrderStatusChange = async (id, status) => {
    let restoredStock = false
    let changedOrder = null
    const safeOrders = Array.isArray(orders) ? orders : []

    const nextOrders = safeOrders.map(order => {
      if (order.id !== id) return order

      const oldStatus = String(order.status || '')
      const shouldRestoreStock =
        status === 'Cancelled' &&
        oldStatus !== 'Cancelled' &&
        order.stockRestored !== true

      if (shouldRestoreStock) {
        restoredStock = restoreStockForCancelledOrder(order)
      }

      changedOrder = {
        ...order,
        status,
        stockRestored: shouldRestoreStock ? restoredStock : order.stockRestored,
        stockRestoredAt: shouldRestoreStock && restoredStock ? new Date().toISOString() : order.stockRestoredAt,
        updatedAt: new Date().toISOString()
      }

      return changedOrder
    })

    setOrders(nextOrders)
    saveJson(ORDERS_STORAGE_KEY, nextOrders)

    if (selectedOrder && selectedOrder.id === id && changedOrder) {
      setSelectedOrder(changedOrder)
    }

    if (changedOrder) {
      try {
        const { error } = await supabase
          .from(ORDERS_TABLE_NAME)
          .upsert([orderToSupabase(changedOrder)], { onConflict: 'id' })

        if (error) throw error
      } catch (error) {
        console.error('Order status Supabase update error:', error)
        setMessage(`⚠️ Order ${id} status changed locally, but Supabase sync failed.`)
        return
      }
    }

    if (status === 'Cancelled') {
      setMessage(restoredStock ? `Order ${id} cancelled, stock restored, and Supabase synced!` : `Order ${id} cancelled and Supabase synced.`)
      return
    }

    setMessage(`Order ${id} status updated and synced to Supabase!`)
  }

  if (!hydrated) return null

  // Auth Interface
  if (!isLoggedIn) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 pb-12 pt-24 font-sans text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

        <section className="relative mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_460px]">
          <div className="hidden lg:block">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-300 shadow-2xl backdrop-blur">
              Mobisphere Admin Control
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-tight tracking-tight xl:text-6xl">
              Manage your mobile store like a premium brand.
            </h1>
            <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-slate-300">
              Product inventory, orders, customers, enquiries, coupons, and reports stay inside one hidden admin workspace.
            </p>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {[
                ['📦', 'Inventory'],
                ['🛒', 'Orders'],
                ['📩', 'Enquiries']
              ].map(([icon, label]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
                  <p className="text-3xl">{icon}</p>
                  <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full">
            <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-2xl sm:p-7 md:rounded-[2.5rem]">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-3xl shadow-xl">
                  🔐
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-emerald-300">Hidden Dashboard</p>
                <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                  {isRegistering ? 'Create Admin Account' : 'Admin Login'}
                </h1>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
                  Access shortcut remains <span className="font-black text-slate-200">Alt + Shift + A</span>.
                </p>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-950/70 p-1.5">
                <button
                  type="button"
                  onClick={() => switchAuthMode('login')}
                  className={`rounded-xl px-4 py-3 text-xs font-black transition ${!isRegistering ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode('signup')}
                  className={`rounded-xl px-4 py-3 text-xs font-black transition ${isRegistering ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Sign Up
                </button>
              </div>

              {message && (
                <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-center text-xs font-black text-rose-200">
                  {message}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {isRegistering && (
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Name</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
                    placeholder="Enter admin username"
                    autoComplete="username"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                  <div className="flex rounded-2xl border border-white/10 bg-slate-950/70 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-400/10">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent p-4 text-sm font-bold text-white outline-none placeholder:text-slate-600"
                      placeholder="Enter password"
                      autoComplete={isRegistering ? 'new-password' : 'current-password'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="px-4 text-xs font-black text-slate-400 hover:text-white"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {isRegistering && (
                  <>
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Access Code</label>
                      <input
                        type="password"
                        value={adminAccessKey}
                        onChange={(e) => setAdminAccessKey(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold uppercase tracking-widest text-white outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
                        placeholder="Enter admin shortcut code"
                        required
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-white py-4 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-emerald-300 active:translate-y-0"
                >
                  {isRegistering ? 'Create Admin Account' : 'Login to Dashboard'}
                </button>
              </form>

              <p className="mt-5 text-center text-[11px] font-semibold leading-5 text-slate-500">
                This is a local admin login system. For real production security, connect proper backend authentication later.
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 pt-28 sm:px-6 font-sans text-slate-900">

      {/* 👑 Welcome Header Banner */}
      <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-500 font-bold">● System Dashboard Live</p>
          <h1 className="text-4xl font-black text-slate-900 mt-2">✨ {greeting}, {username}! 👋</h1>
          <p className="text-sm text-slate-500 mt-2 italic">Use this panel to manage customers and enquiries. Shortcut: Alt + Shift + A</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg">
            Customers: {customers.length} • Enquiries: {enquiries.length}
          </div>
          <button onClick={handleLogout} className="text-xs font-bold text-rose-600 hover:underline">Logout Session</button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-xs font-bold text-slate-800 border border-slate-200">
          {message}
        </div>
      )}

      {productSyncError && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800">
          ⚠️ Product sync warning: {productSyncError}
        </div>
      )}

      {/* Main Layout Divided into Sidebar & Dashboard Panels */}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">

        {/* 📋 Sidebar Links (7 Tabs System) */}
        <aside className="space-y-2">
          <p className="text-[10px] font-black uppercase text-slate-400 px-4 mb-4 tracking-wider">Navigation Menu</p>
          {[
            { id: 1, icon: '📊', name: 'Dashboard & Analytics' },
            { id: 2, icon: '📦', name: 'Inventory & Stock' },
            { id: 3, icon: '🛒', name: 'Orders & Tracking' },
            { id: 4, icon: '👥', name: 'Customer Accounts' },
            { id: 5, icon: '🎫', name: 'Coupons & Offers' },
            { id: 6, icon: '📈', name: 'Sales Reports' },
            { id: 7, icon: '📩', name: 'Enquiry Center' },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMessage(''); }} className={`flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}>
              <span>{tab.icon}</span> {tab.name}
            </button>
          ))}

          {/* Dark Quick Actions Info Box */}
          <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
            <h3 className="text-sm font-bold border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
              Quick Actions <span className="text-[9px] text-emerald-400 font-mono bg-emerald-400/10 px-2 py-0.5 rounded-full">v2.3</span>
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-400">Control panel for adding devices, inventory analytics sync, and customer resolution pathways.</p>
          </div>
        </aside>

        {/* 💻 Active Workspace View */}
        <div className="space-y-8">

          {/* TAB 1: Dashboard & Analytics */}
          {activeTab === 1 && (
            <div className="space-y-7">
              <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-2xl">
                <div className="relative p-6 sm:p-8 lg:p-10">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

                  <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-2xl">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Dashboard & Analytics
                      </div>

                      <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                        Store command center
                      </h2>

                      <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-300">
                        Revenue, orders, stock alerts, customers, and quick actions in one clean admin view.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[380px]">
                      <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Today Revenue</p>
                        <p className="mt-2 text-2xl font-black text-emerald-300">₹{Number(chartAnalytics.todayRevenue || 0).toLocaleString()}</p>
                        <p className="mt-1 text-[11px] font-bold text-slate-400">{chartAnalytics.todayOrders} orders today</p>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Last Sync</p>
                        <p className="mt-2 text-lg font-black text-white">{chartAnalytics.lastUpdated || 'Just now'}</p>
                        <button
                          type="button"
                          onClick={() => handleSyncAllData(true)}
                          disabled={isSyncing || isSyncingProducts}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className={isSyncing || isSyncingProducts ? 'inline-block animate-spin' : 'inline-block'}>🔄</span>
                          {isSyncing || isSyncingProducts ? 'Syncing...' : 'Sync Data'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
                {[
                  { label: 'Total Revenue', value: `₹${Number(chartAnalytics.totalRevenue || 0).toLocaleString()}`, helper: 'Saved orders', icon: '₹', className: 'xl:col-span-2 bg-emerald-50 border-emerald-100 text-emerald-700' },
                  { label: 'Total Orders', value: chartAnalytics.totalOrders, helper: `${chartAnalytics.pendingOrders} processing`, icon: '🛒', className: 'bg-white border-slate-100 text-slate-900' },
                  { label: 'Products', value: chartAnalytics.totalProducts, helper: `${chartAnalytics.totalStockUnits} units`, icon: '📦', className: 'bg-white border-slate-100 text-blue-700' },
                  { label: 'Customers', value: customers.length, helper: `${enquiries.length} enquiries`, icon: '👥', className: 'bg-white border-slate-100 text-violet-700' },
                  { label: 'Live Sales', value: (Array.isArray(saleCampaigns) ? saleCampaigns.filter((campaign) => getCampaignStatus(campaign).label === 'Live').length : 0), helper: `${saleCampaigns.length} campaigns`, icon: '🔥', className: 'bg-orange-50 border-orange-100 text-orange-700' }
                ].map((card) => (
                  <article
                    key={card.label}
                    className={`rounded-[1.5rem] border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl sm:p-5 ${card.className}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-70 sm:text-[10px]">{card.label}</p>
                        <p className="mt-2 text-xl font-black sm:text-2xl">{card.value}</p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-xl shadow-inner">
                        {card.icon}
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-1 text-[11px] font-bold opacity-70">{card.helper}</p>
                  </article>
                ))}
              </section>

              {(chartAnalytics.lowStockProducts > 0 || chartAnalytics.outOfStockProducts > 0) && (
                <section className="rounded-[2rem] border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">Inventory Attention</p>
                      <h3 className="mt-2 text-2xl font-black text-slate-950">Stock needs review</h3>
                      <p className="mt-1 text-sm font-bold text-amber-800">
                        {chartAnalytics.lowStockProducts} low stock products • {chartAnalytics.outOfStockProducts} out of stock products
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(localProducts) ? localProducts : [])
                        .filter((product) => getStockQuantity(product) <= 0 || (getStockQuantity(product) > 0 && getStockQuantity(product) <= getMinStockAlert(product)))
                        .slice(0, 3)
                        .map((product) => (
                          <span key={product.id} className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 shadow-sm">
                            {product.title || 'Product'}
                          </span>
                        ))}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(2)
                          setInventoryView('brands')
                        }}
                        className="rounded-full bg-slate-950 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-slate-800"
                      >
                        Open Inventory
                      </button>
                    </div>
                  </div>
                </section>
              )}

              <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-7">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Performance</p>
                      <h3 className="mt-1 text-xl font-black text-slate-950">Top Product Activity</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Based on cart activity and saved order revenue.</p>
                    </div>
                    <span className="w-fit rounded-full bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white">
                      Live Analytics
                    </span>
                  </div>

                  <div className="space-y-4">
                    {chartAnalytics.topProducts.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                        <p className="text-sm font-black text-slate-900">No product activity yet.</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Cart and order activity will appear here.</p>
                      </div>
                    ) : chartAnalytics.topProducts.map((product, index) => (
                      <div key={`${product.title}-${index}`} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">{product.title}</p>
                            <p className="text-[11px] font-bold text-slate-500">{product.count} units activity</p>
                          </div>
                          <p className="text-xs font-black text-emerald-600">₹{Number(product.revenue || 0).toLocaleString()}</p>
                        </div>
                        <div className="h-2 rounded-full bg-white">
                          <div className="h-2 rounded-full bg-slate-950" style={{ width: product.heightStr }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-7">
                    <div className="mb-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Orders</p>
                      <h3 className="mt-1 text-xl font-black text-slate-950">Status Pipeline</h3>
                    </div>

                    <div className="grid gap-3">
                      {chartAnalytics.statusSummary.map((status) => {
                        const percent = chartAnalytics.totalOrders > 0 ? Math.round((status.count / chartAnalytics.totalOrders) * 100) : 0

                        return (
                          <div key={status.status} className={`rounded-2xl border p-4 ${status.className}`}>
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{status.icon}</span>
                                <span className="text-xs font-black uppercase tracking-wider">{status.status}</span>
                              </div>
                              <span className="text-lg font-black">{status.count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/70">
                              <div className="h-1.5 rounded-full bg-current" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-100 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">Quick Actions</p>
                    <h3 className="mt-2 text-xl font-black">Admin shortcuts</h3>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">Jump directly into the most used admin tasks.</p>

                    <div className="mt-5 grid gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null)
                          setInventoryView('form')
                          setActiveTab(2)
                        }}
                        className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-black transition hover:bg-white/15"
                      >
                        <span>Add new product</span>
                        <span>＋</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab(3)}
                        className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-black transition hover:bg-white/15"
                      >
                        <span>Manage orders</span>
                        <span>→</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab(5)}
                        className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-black transition hover:bg-white/15"
                      >
                        <span>Create festival sale</span>
                        <span>🔥</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSyncAllData(true)}
                        disabled={isSyncing || isSyncingProducts}
                        className="flex items-center justify-between rounded-2xl bg-emerald-400 px-4 py-3 text-left text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                      >
                        <span>{isSyncing || isSyncingProducts ? 'Syncing...' : 'Sync live data'}</span>
                        <span>🔄</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-7">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Orders</p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">Recent Orders</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Latest customer checkout activity.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab(3)}
                    className="w-fit rounded-full bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-slate-800"
                  >
                    View All Orders
                  </button>
                </div>

                {chartAnalytics.recentOrders.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-sm font-black text-slate-900">No recent orders yet.</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Orders will appear here after customers complete checkout.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-3xl border border-slate-100">
                    <table className="w-full min-w-[700px] text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="p-4 font-black">Order ID</th>
                          <th className="p-4 font-black">Customer</th>
                          <th className="p-4 font-black">Date</th>
                          <th className="p-4 font-black">Total</th>
                          <th className="p-4 font-black text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {chartAnalytics.recentOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50/70">
                            <td className="p-4 text-xs font-black text-slate-900">{order.id}</td>
                            <td className="p-4 text-xs font-bold text-slate-600">{getOrderCustomerName(order)}</td>
                            <td className="p-4 text-xs font-bold text-slate-500">{getOrderDate(order) ? getOrderDate(order).toLocaleDateString('en-IN') : '—'}</td>
                            <td className="p-4 text-xs font-black text-emerald-600">₹{getOrderTotal(order).toLocaleString()}</td>
                            <td className="p-4 text-right">
                              <span
                                className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${order.status === 'Delivered'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : order.status === 'Shipped'
                                      ? 'bg-blue-50 text-blue-700'
                                      : order.status === 'Cancelled'
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-amber-50 text-amber-700'
                                  }`}
                              >
                                {order.status || 'Processing'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* 👥 TAB 4: Registered Customers */}
          {activeTab === 4 && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <h2 className="text-2xl font-black mb-6">Registered Customers ({customers.length})</h2>
              {customers.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No accounts found in Supabase server.</p>
              ) : (
                <div className="grid gap-4">
                  {customers.map(c => {
                    const customerOrders = orders.filter((order) => {
                      const sameMobile = String(getOrderMobile(order) || '').trim() && String(getOrderMobile(order)).trim() === String(c.mobile_number || '').trim()
                      const sameName = String(getOrderCustomerName(order) || '').toLowerCase().trim() === String(c.full_name || '').toLowerCase().trim()
                      return sameMobile || sameName
                    })
                    const customerSpend = customerOrders.reduce((sum, order) => sum + getOrderTotal(order), 0)

                    return (
                      <div key={c.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div>
                            <p className="text-lg font-black text-slate-900">{c.full_name || 'No Name Provided'}</p>
                            <p className="text-sm font-bold text-slate-600">📞 {c.mobile_number || '—'} | 📍 {c.address || '—'}</p>
                            <p className="text-[10px] font-mono mt-1 text-slate-400">UUID: {c.id} | Joined: {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600">{customerOrders.length} Orders</span>
                            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">₹{customerSpend.toLocaleString()}</span>
                            <button onClick={() => handleCustomerDelete(c.id)} className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black hover:bg-rose-600 hover:text-white transition">Remove</button>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-white p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order History</p>
                          {customerOrders.length === 0 ? (
                            <p className="mt-2 text-xs font-bold text-slate-400">No orders found for this customer.</p>
                          ) : (
                            <div className="mt-3 space-y-2">
                              {customerOrders.slice(0, 4).map((order) => (
                                <button
                                  key={order.id}
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-left text-xs font-bold transition hover:bg-slate-100"
                                >
                                  <span>{order.id} • {order.status || 'Processing'}</span>
                                  <span className="font-black text-emerald-600">₹{getOrderTotal(order).toLocaleString()}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 🎫 TAB 5: Coupons & Offers */}
          {activeTab === 5 && (
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">
                      Coupons & Offers
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-950">
                      Festival sale manager
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                      Create coupon codes and automatic festival sale campaigns for all products, selected brands, or selected models.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
                    <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Coupons</p>
                      <p className="mt-1 text-2xl font-black text-emerald-800">{coupons.length}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950 p-4 text-center text-white">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-300">Sales</p>
                      <p className="mt-1 text-2xl font-black">{saleCampaigns.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="font-black text-slate-900 text-sm mb-4">Create System Coupon</h3>
                  <form onSubmit={handleCreateCoupon} className="space-y-3">
                    <input type="text" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} placeholder="COUPON CODE (e.g. IPHONE10)" className="w-full border p-3 text-xs uppercase font-bold rounded-xl text-slate-900 outline-none focus:border-slate-900" />
                    <input type="number" value={newDiscountPercent} onChange={(e) => setNewDiscountPercent(e.target.value)} placeholder="Discount Percentage %" className="w-full border p-3 text-xs rounded-xl text-slate-900 outline-none focus:border-slate-900" />
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Expiry Date</label>
                      <input type="date" value={newCouponExpiryDate} onChange={(e) => setNewCouponExpiryDate(e.target.value)} className="w-full border p-3 text-xs rounded-xl text-slate-900 outline-none focus:border-slate-900" />
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white py-3 text-xs font-bold rounded-xl hover:bg-slate-800">Generate Coupon</button>
                  </form>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="font-black text-slate-900 text-sm mb-4">Coupon Codes</h3>
                  <div className="overflow-y-auto max-h-[320px] divide-y">
                    {coupons.length === 0 ? <p className="text-xs text-slate-400 py-4">No active coupon parameters saved.</p> : coupons.map((coupon) => {
                      const expiryDate = coupon.expiresAt || coupon.expiryDate || ''
                      const isExpired = expiryDate ? new Date(expiryDate) < new Date(new Date().toDateString()) : false
                      const isActive = coupon.active !== false && !isExpired

                      return (
                        <div key={coupon.id} className="flex flex-col gap-2 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <span className="font-mono font-black text-slate-900 uppercase bg-slate-100 px-2 py-1 rounded-md">{coupon.code}</span>
                            <p className="mt-2 font-black text-emerald-700">{coupon.discountPercent}% OFF</p>
                            <p className="mt-1 text-[10px] font-bold text-slate-400">Expiry: {expiryDate || 'No expiry date'}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleCouponActive(coupon.id)}
                              className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                            >
                              {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                            </button>
                            <button onClick={() => handleDeleteCoupon(coupon.id)} className="rounded-full bg-rose-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-700 hover:bg-rose-600 hover:text-white">Remove</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[2rem] border border-slate-100 bg-slate-950 p-6 text-white shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">
                    Automatic Sale Campaign
                  </p>
                  <h3 className="mt-2 text-2xl font-black">Create festival sale</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
                    Use this for Diwali, New Year, Ganpati, shop anniversary, or limited time mobile offers.
                  </p>

                  <form onSubmit={handleCreateSaleCampaign} className="mt-5 space-y-3">
                    <input
                      value={newCampaignTitle}
                      onChange={(e) => setNewCampaignTitle(e.target.value)}
                      placeholder="Offer title e.g. Diwali Mega Sale"
                      className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-xs font-bold text-white outline-none placeholder:text-slate-500 focus:border-emerald-300"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newCampaignDiscountType}
                        onChange={(e) => setNewCampaignDiscountType(e.target.value)}
                        className="rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs font-bold text-white outline-none focus:border-emerald-300"
                      >
                        <option value="percent">Percentage %</option>
                        <option value="flat">Flat ₹ OFF</option>
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={newCampaignDiscountValue}
                        onChange={(e) => setNewCampaignDiscountValue(e.target.value)}
                        placeholder="Discount value"
                        className="rounded-2xl border border-white/10 bg-white/10 p-3 text-xs font-bold text-white outline-none placeholder:text-slate-500 focus:border-emerald-300"
                      />
                    </div>

                    <select
                      value={newCampaignScope}
                      onChange={(e) => {
                        setNewCampaignScope(e.target.value)
                        setNewCampaignBrand('')
                        setNewCampaignProductId('')
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs font-bold text-white outline-none focus:border-emerald-300"
                    >
                      <option value="all">Apply on all products</option>
                      <option value="brand">Apply on selected brand</option>
                      <option value="product">Apply on selected product</option>
                    </select>

                    {newCampaignScope === 'brand' && (
                      <select
                        value={newCampaignBrand}
                        onChange={(e) => setNewCampaignBrand(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs font-bold text-white outline-none focus:border-emerald-300"
                      >
                        <option value="">Select brand</option>
                        {uniqueBrands.map((brand) => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    )}

                    {newCampaignScope === 'product' && (
                      <select
                        value={newCampaignProductId}
                        onChange={(e) => setNewCampaignProductId(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs font-bold text-white outline-none focus:border-emerald-300"
                      >
                        <option value="">Select product</option>
                        {localProducts.map((product) => (
                          <option key={product.id} value={product.id}>{product.brand || 'Other'} — {product.title}</option>
                        ))}
                      </select>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Start Date</label>
                        <input
                          type="date"
                          value={newCampaignStartDate}
                          onChange={(e) => setNewCampaignStartDate(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-xs font-bold text-white outline-none focus:border-emerald-300"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">End Date</label>
                        <input
                          type="date"
                          value={newCampaignEndDate}
                          onChange={(e) => setNewCampaignEndDate(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-xs font-bold text-white outline-none focus:border-emerald-300"
                        />
                      </div>
                    </div>

                    <button type="submit" className="w-full rounded-2xl bg-emerald-400 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg transition hover:bg-emerald-300">
                      Create Sale Campaign
                    </button>
                  </form>
                </div>

                <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Sale Campaigns</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Automatic offer rules saved for customer side and checkout.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                      {saleCampaigns.length} Total
                    </span>
                  </div>

                  {saleCampaigns.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                      <p className="text-sm font-black text-slate-900">No sale campaign created yet.</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Create one for festival, seasonal, or shop anniversary offers.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {saleCampaigns.map((campaign) => {
                        const status = getCampaignStatus(campaign)

                        return (
                          <article key={campaign.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-950">{campaign.title}</h4>
                                  <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${status.className}`}>
                                    {status.label}
                                  </span>
                                </div>
                                <p className="mt-2 text-xl font-black text-emerald-600">{formatCampaignDiscount(campaign)}</p>
                                <p className="mt-1 text-xs font-bold text-slate-500">{getCampaignScopeLabel(campaign)}</p>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {campaign.startDate || 'No start'} → {campaign.endDate || 'No end date'}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSaleCampaign(campaign.id)}
                                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${campaign.active === false ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}
                                >
                                  {campaign.active === false ? 'Activate' : 'Disable'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSaleCampaign(campaign.id)}
                                  className="rounded-full bg-rose-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-700 hover:bg-rose-600 hover:text-white"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 📦 TAB 2: Inventory & Stock */}
          {activeTab === 2 && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {inventoryView === 'brands' ? 'Inventory & Stock' :
                      inventoryView === 'form' ? (editingProduct ? 'Edit Product & Stock' : 'Add New Product With Stock') :
                        `${selectedBrand} Products`}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Manage products, pricing, stock quantity, supplier details, and low-stock alerts.</p>
                </div>
                {inventoryView !== 'form' && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleExportStockReport} className="px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-sm hover:bg-emerald-600 hover:text-white transition font-bold text-xs flex items-center gap-2">
                      Export Stock Report
                    </button>
                    <button onClick={() => { setEditingProduct(null); setInventoryView('form'); }} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 transition font-bold text-xs flex items-center gap-2">
                      <span>+</span> Add New Product
                    </button>
                  </div>
                )}
              </div>

              {inventoryView === 'brands' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {uniqueBrands.map(brand => {
                    const brandProducts = localProducts.filter(p => (p.brand || 'Other Models') === brand)
                    const brandStock = brandProducts.reduce((sum, product) => sum + getStockQuantity(product), 0)
                    const brandLowStock = brandProducts.filter((product) => {
                      const qty = getStockQuantity(product)
                      return qty > 0 && qty <= getMinStockAlert(product)
                    }).length

                    return (
                      <button key={brand} onClick={() => { setSelectedBrand(brand); setInventoryView('products'); }} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl hover:bg-slate-900 hover:text-white transition group text-left shadow-sm">
                        <div className="text-3xl mb-3 opacity-80 group-hover:opacity-100">🏷️</div>
                        <h3 className="font-black text-lg">{brand}</h3>
                        <p className="text-xs mt-1 opacity-60">{brandProducts.length} Products • {brandStock} Units</p>
                        {brandLowStock > 0 && (
                          <p className="mt-2 w-fit rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-700 group-hover:bg-amber-300 group-hover:text-slate-950">
                            {brandLowStock} Low Stock
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {inventoryView === 'products' && (
                <div className="space-y-4">
                  <button onClick={() => setInventoryView('brands')} className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">← Back to Brands</button>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="p-4 font-black">ID</th>
                          <th className="p-4 font-black">Model Name</th>
                          <th className="p-4 font-black">Selling Price</th>
                          <th className="p-4 font-black text-center">Stock</th>
                          <th className="p-4 font-black text-center">Status</th>
                          <th className="p-4 font-black text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {localProducts.filter(p => (p.brand || 'Other Models') === selectedBrand).map((product) => {
                          const stockQty = getStockQuantity(product)
                          const minStockAlert = getMinStockAlert(product)
                          const stockStatus = getStockStatusDetails(product)

                          return (
                            <tr key={product.id} className="hover:bg-slate-50/80 transition group">
                              <td className="p-4 text-xs font-mono font-bold text-slate-400">#{product.id}</td>
                              <td className="p-4 text-sm font-bold text-slate-900">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 via-white to-slate-200 p-1 shadow-inner">
                                    {product.image ? <img src={product.image} alt={product.title} className="h-full max-h-full w-full max-w-full object-contain" /> : '📱'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="line-clamp-1">{product.title}</p>
                                    <p className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">{product.supplierName || 'Supplier not set'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-sm font-black text-emerald-600">₹{(Number(product.price) || 0).toLocaleString()}</td>
                              <td className="p-4 text-center">
                                <div className="inline-flex min-w-[90px] flex-col items-center rounded-2xl bg-slate-50 px-3 py-2">
                                  <span className="text-base font-black text-slate-950">{stockQty}</span>
                                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Min {minStockAlert}</span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider shadow-sm ${stockStatus.className}`}>
                                  <span className={`h-2 w-2 rounded-full ${stockStatus.dotClassName}`} />
                                  {stockStatus.label}
                                </span>
                              </td>
                              <td className="p-4 text-right opacity-80 group-hover:opacity-100 transition">
                                <div className="flex flex-wrap justify-end gap-2">
                                  <button onClick={() => handleOpenStockModal(product)} className="rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 hover:bg-emerald-600 hover:text-white">Add Stock</button>
                                  <button onClick={() => { setEditingProduct(product); setInventoryView('form'); }} className="rounded-full bg-blue-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-blue-700 hover:bg-blue-600 hover:text-white">Edit</button>
                                  <button onClick={() => handleDeleteProduct(product.id)} className="rounded-full bg-rose-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-rose-700 hover:bg-rose-600 hover:text-white">Delete</button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {inventoryView === 'form' && (
                <div>
                  <button onClick={() => setInventoryView(selectedBrand ? 'products' : 'brands')} className="text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-1">← Cancel & Go Back</button>
                  <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Company Name (Brand)</label>
                        <input name="brand" required defaultValue={editingProduct?.brand || ''} placeholder="e.g. Apple, Samsung" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Model Name (Title)</label>
                        <input name="title" required defaultValue={editingProduct?.title || ''} placeholder="e.g. iPhone 16 Pro" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Selling Price (₹)</label>
                        <input type="number" name="price" required defaultValue={editingProduct?.price || ''} placeholder="e.g. 120000" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Purchase Price (₹)</label>
                        <input type="number" name="purchasePrice" defaultValue={editingProduct?.purchasePrice || ''} placeholder="e.g. 78000" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Opening Stock Quantity</label>
                        <input type="number" min="0" name="stockQty" defaultValue={editingProduct?.stockQty || 0} placeholder="e.g. 10" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Minimum Stock Alert</label>
                        <input type="number" min="0" name="minStockAlert" defaultValue={editingProduct?.minStockAlert || 3} placeholder="e.g. 3" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Supplier / Dealer Name</label>
                        <input name="supplierName" defaultValue={editingProduct?.supplierName || ''} placeholder="e.g. Apple Dealer Sangli" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Product Description</label>
                        <textarea name="description" rows="4" defaultValue={editingProduct?.description || ''} placeholder="Describe the phone features..." className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white"></textarea>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Product Image (Local File)</label>
                        <div className="mt-1 flex items-center gap-4">
                          {editingProduct?.image && (
                            <img src={editingProduct.image} alt="Preview" className="h-12 w-12 rounded-lg border border-slate-200 bg-slate-50 object-contain p-1 shadow-sm" />
                          )}
                          <input type="file" name="image" accept="image/*" className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 bg-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400">Memory (Storage)</label>
                          <input name="storage" defaultValue={editingProduct?.specs?.Storage || ''} placeholder="e.g. 256GB" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400">RAM</label>
                          <input name="ram" defaultValue={editingProduct?.specs?.RAM || ''} placeholder="e.g. 8GB" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" />
                        </div>
                      </div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400">Processor</label><input name="processor" defaultValue={editingProduct?.specs?.Processor || ''} placeholder="e.g. A18 Bionic" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" /></div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400">Camera Specs</label><input name="camera" defaultValue={editingProduct?.specs?.Camera || ''} placeholder="e.g. 48MP Triple" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" /></div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400">Battery</label><input name="battery" defaultValue={editingProduct?.specs?.Battery || ''} placeholder="e.g. 4700mAh" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" /></div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400">Charger Info</label><input name="charger" defaultValue={editingProduct?.specs?.Charger || ''} placeholder="e.g. 30W Fast Charging" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" /></div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400">Additional Tools (In Box)</label><input name="tools" defaultValue={editingProduct?.specs?.Tools || ''} placeholder="e.g. Type-C Cable, SIM Tool" className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 text-slate-900 bg-white" /></div>
                    </div>

                    <div className="md:col-span-2 flex justify-end mt-4 pt-4 border-t border-slate-200">
                      <button type="submit" className="px-8 py-3 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 transition font-black text-sm">{editingProduct ? 'Save Changes' : 'Add Product'}</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* 🛒 TAB 3: Order Management */}
          {activeTab === 3 && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Order Management</h2>
                  <p className="text-sm text-slate-500 mt-1">Track, update, and manage customer orders.</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs outline-none focus:border-slate-900 cursor-pointer"
                  >
                    <option value="All">All Orders</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="p-4 font-black">Order ID</th>
                      <th className="p-4 font-black">Customer Name</th>
                      <th className="p-4 font-black">Date</th>
                      <th className="p-4 font-black text-center">Items</th>
                      <th className="p-4 font-black">Total Amount</th>
                      <th className="p-4 font-black text-center">Status</th>
                      <th className="p-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders
                      .filter(order => orderFilter === 'All' || order.status === orderFilter)
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition group">
                          <td className="p-4 text-xs font-mono font-bold text-slate-900">{order.id}</td>
                          <td className="p-4 text-sm font-bold text-slate-700">{order.customer}</td>
                          <td className="p-4 text-xs font-semibold text-slate-500">{order.date}</td>
                          <td className="p-4 text-sm font-bold text-slate-700 text-center">{order.items}</td>
                          <td className="p-4 text-sm font-black text-emerald-600">₹{order.total.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <select value={order.status} onChange={(e) => { handleOrderStatusChange(order.id, e.target.value); }} className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full outline-none cursor-pointer border-2 ${order.status === 'Processing' ? 'bg-amber-50 text-amber-700 border-amber-200' : order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' : order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4 text-right opacity-80 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-950 hover:text-white"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 📩 TAB 7: Enquiry Management Logs */}
          {activeTab === 7 && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <h2 className="text-2xl font-black mb-2">Enquiry Management</h2>
              <p className="text-sm text-slate-500 mb-6">Review input logs, modify resolution states and save internal records.</p>

              {enquiries.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No user enquiries tracked inside system logs.</p>
              ) : (
                <div className="space-y-6">
                  {enquiries.map(e => (
                    <div key={e.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div>
                          <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">{e.subject || 'iPhone Enquiry'}</span>
                          <h3 className="text-lg font-black text-slate-900 mt-2">{e.full_name || 'Visitor'} — <span className="font-mono font-medium text-slate-600 text-base">{e.mobile_number || '—'}</span></h3>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">Email: {e.email || '—'} | Received: {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}</p>
                          <p className="text-sm text-slate-900 font-medium italic mt-3 bg-white p-3 rounded-xl border border-slate-100">{e.message || '—'}</p>
                        </div>
                        <div className="flex gap-2 self-end sm:self-start">
                          <button onClick={() => handleSaveEnquiry(e.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 transition font-bold text-xs">Save Changes</button>
                          <button onClick={() => handleConvertEnquiryToCustomer(e)} className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition font-bold text-xs">Convert Customer</button>
                          <button onClick={() => handleCreateOrderFromEnquiry(e)} className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 transition font-bold text-xs">Create Order</button>
                          <button onClick={() => handleEnquiryDelete(e.id)} className="px-4 py-2 bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 transition font-bold text-xs">Delete</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200/80">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400">Status Selector</label>
                          <select value={e.status || 'New'} onChange={(el) => handleEnquiryFieldChange(e.id, 'status', el.target.value)} className="p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none bg-white text-slate-900">
                            <option value="New">New</option>
                            <option value="In progress">In progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400">Admin Response Note</label>
                          <input type="text" value={e.admin_note || ''} onChange={(el) => handleEnquiryFieldChange(e.id, 'admin_note', el.target.value)} className="p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none bg-white text-slate-900" placeholder="Add internal database comment..." />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 📈 TAB 6: Sales Reports */}
          {activeTab === 6 && (
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">
                      Sales Reports
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-950">
                      Business summary
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                      Revenue, order status, top products, and stock health with date filters.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      ['all', 'All'],
                      ['today', 'Today'],
                      ['week', 'This Week'],
                      ['month', 'This Month']
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSalesReportRange(value)}
                        className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider transition ${salesReportRange === value ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Revenue', `₹${salesReportStats.revenue.toLocaleString()}`, `${salesReportRange === 'all' ? 'All time' : salesReportRange} order value`, 'text-emerald-600'],
                  ['Orders', salesReportStats.orders.toLocaleString(), 'Filtered customer orders', 'text-slate-900'],
                  ['Items Sold', salesReportStats.items.toLocaleString(), 'Units in filtered orders', 'text-blue-600'],
                  ['Cancelled', salesReportStats.cancelled.toLocaleString(), 'Cancelled in selected range', 'text-rose-600']
                ].map(([label, value, helper, color]) => (
                  <div key={label} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                    <p className={`mt-2 text-2xl font-black ${color}`}>{value}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl">
                  <h3 className="text-lg font-black text-slate-900">Filtered orders</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Date range: {salesReportRange === 'all' ? 'All time' : salesReportRange}
                  </p>

                  <div className="mt-5 space-y-3">
                    {salesReportOrders.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">No orders found for this filter.</p>
                    ) : salesReportOrders.slice(0, 8).map((order) => (
                      <button key={order.id} type="button" onClick={() => setSelectedOrder(order)} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left transition hover:bg-slate-100">
                        <div>
                          <p className="text-sm font-black text-slate-900">{order.id}</p>
                          <p className="text-xs font-bold text-slate-500">{getOrderCustomerName(order)} • {getOrderDate(order)?.toLocaleDateString() || 'No date'}</p>
                        </div>
                        <p className="text-sm font-black text-emerald-600">₹{getOrderTotal(order).toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl">
                  <h3 className="text-lg font-black text-slate-900">Stock health report</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Products that need refill or are unavailable.
                  </p>

                  <div className="mt-5 space-y-3">
                    {localProducts
                      .filter((product) => getStockQuantity(product) <= getMinStockAlert(product))
                      .slice(0, 8)
                      .map((product) => {
                        const stockStatus = getStockStatusDetails(product)

                        return (
                          <div key={product.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                            <div className="min-w-0">
                              <p className="line-clamp-1 text-sm font-black text-slate-900">{product.title}</p>
                              <p className="text-xs font-bold text-slate-500">{product.brand || 'Other Models'} • {getStockQuantity(product)} units left</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${stockStatus.className}`}>
                              {stockStatus.label}
                            </span>
                          </div>
                        )
                      })}

                    {localProducts.filter((product) => getStockQuantity(product) <= getMinStockAlert(product)).length === 0 && (
                      <p className="rounded-2xl bg-emerald-50 p-5 text-sm font-bold text-emerald-700">
                        All products have healthy stock levels.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">
                  Order Details
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  {selectedOrder.id}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {selectedOrder.customer || selectedOrder.customerName || 'Customer'} • {selectedOrder.date ? new Date(selectedOrder.date).toLocaleString() : 'No date'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-600 transition hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Amount</p>
                <p className="mt-1 text-xl font-black text-emerald-600">₹{Number(selectedOrder.total || selectedOrder.totalAmount || 0).toLocaleString()}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Items</p>
                <p className="mt-1 text-xl font-black text-slate-950">{selectedOrder.items || getOrderProducts(selectedOrder).length}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</p>
                <p className="mt-1 text-xl font-black text-slate-950">{selectedOrder.status || 'Processing'}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Stock Restore</p>
                <p className={`mt-1 text-sm font-black ${selectedOrder.stockRestored ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {selectedOrder.stockRestored ? 'Done' : 'Not applied'}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Customer Information
              </h4>
              <div className="mt-3 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-2">
                <p>Name: {selectedOrder.customer || selectedOrder.customerName || '—'}</p>
                <p>Mobile: {selectedOrder.mobileNumber || selectedOrder.mobile || '—'}</p>
                <p className="sm:col-span-2">Address: {selectedOrder.address || '—'}</p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-white p-5">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Ordered Products
              </h4>

              {getOrderProducts(selectedOrder).length === 0 ? (
                <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                  Product list is not available for this older/demo order.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {getOrderProducts(selectedOrder).map((item, index) => (
                    <div key={`${item.productId || item.id || index}-${index}`} className="grid grid-cols-[64px_1fr] gap-4 rounded-2xl bg-slate-50 p-3">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-inner">
                        {item.image ? (
                          <img src={item.image} alt={item.title || 'Product'} className="h-full w-full object-contain" />
                        ) : (
                          <span>📱</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-black text-slate-950">{item.title || 'Mobisphere Product'}</p>
                        <p className="text-xs font-bold text-slate-500">{item.brand || 'Mobisphere'} • Qty: {item.quantity || 1}</p>
                        <p className="mt-1 text-sm font-black text-emerald-600">₹{Number(item.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => handlePrintInvoice(selectedOrder)}
                className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800"
              >
                Print Invoice
              </button>

              <button
                type="button"
                onClick={() => handleDownloadInvoice(selectedOrder)}
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-emerald-700"
              >
                Download Bill
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>

              {selectedOrder.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={() => handleOrderStatusChange(selectedOrder.id, 'Cancelled')}
                  className="rounded-2xl bg-rose-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-rose-700"
                >
                  Cancel Order & Restore Stock
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {stockProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">
                  Stock Management
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  Add New Stock
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {stockProduct.title}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseStockModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-600 transition hover:bg-slate-200"
                aria-label="Close stock modal"
              >
                ×
              </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Current Stock
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {getStockQuantity(stockProduct)}
                </p>
              </div>

              <div className={`rounded-2xl p-4 ${getStockStatusDetails(stockProduct).className}`}>
                <p className="text-[10px] font-black uppercase tracking-wider opacity-70">
                  Status
                </p>
                <p className="mt-1 text-lg font-black">
                  {getStockStatusDetails(stockProduct).label}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Add Stock Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockAddQty}
                  onChange={(e) => setStockAddQty(e.target.value)}
                  placeholder="e.g. 5"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Purchase Price Per Unit
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockPurchasePrice}
                  onChange={(e) => setStockPurchasePrice(e.target.value)}
                  placeholder="e.g. 78000"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Supplier / Dealer Name
                </label>
                <input
                  value={stockSupplier}
                  onChange={(e) => setStockSupplier(e.target.value)}
                  placeholder="e.g. ABC Mobile Dealer"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Stock Note
                </label>
                <textarea
                  rows="3"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  placeholder="e.g. New batch received"
                  className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseStockModal}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-emerald-700"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}