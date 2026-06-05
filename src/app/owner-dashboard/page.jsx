"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { productData } from '@/app/components/common/ProductCard'


// Load chart lib only on client
const Chart = dynamic(() => import('react-chartjs-2').then((m) => m.Line), { ssr: false })
const ChartJS = dynamic(() => import('chart.js/auto'), { ssr: false })

const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const CUSTOMER_STORAGE_KEY = 'mobisphereCustomers'
const CART_STORAGE_KEY = 'mobisphereCart'

function loadJson(key) {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function safeNumber(n) {
  const x = Number(n)
  return Number.isFinite(x) ? x : 0
}

function monthKey(d) {
  // e.g. 2026-06
  const yy = d.getFullYear()
  const mm = `${d.getMonth() + 1}`.padStart(2, '0')
  return `${yy}-${mm}`
}

export default function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState('analytics')
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [customers, setCustomers] = useState([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedSession = loadJson(ADMIN_SESSION_KEY)
    if (!storedSession) {
      router.replace('/admin')
      return
    }

    const storedCustomers = loadJson(CUSTOMER_STORAGE_KEY)
    // Avoid cascading renders flagged by eslint: defer state updates.
    queueMicrotask(() => {
      setSession(storedSession)
      setCustomers(Array.isArray(storedCustomers) ? storedCustomers : [])
      setHydrated(true)
    })
  }, [router])

  const analytics = useMemo(() => {
    if (!hydrated) {
      return {
        totalRevenue: 0,
        topByCount: null,
        topByRevenue: null,
        topProducts: [],
        generatedAt: new Date().toISOString(),
      }
    }

    const cart = loadJson(CART_STORAGE_KEY)
    const items = Array.isArray(cart) ? cart : []

    const productCount = new Map()
    const productRevenue = new Map()

    for (const it of items) {
      const pid = Number(it.productId)
      if (!Number.isFinite(pid)) continue
      const price = safeNumber(it.price)

      productCount.set(pid, (productCount.get(pid) || 0) + 1)
      productRevenue.set(pid, (productRevenue.get(pid) || 0) + price)
    }

    const sortedCount = [...productCount.entries()].sort((a, b) => b[1] - a[1])
    const sortedRevenue = [...productRevenue.entries()].sort((a, b) => b[1] - a[1])

    const topByCount = sortedCount[0]?.[0] ?? null
    const topByRevenue = sortedRevenue[0]?.[0] ?? null

    const totalRevenue = [...productRevenue.values()].reduce((a, b) => a + b, 0)

    const topLabels = sortedCount.slice(0, 6).map(([pid]) => pid)
    const topProducts = topLabels.map((pid) => ({
      pid,
      title: productData?.[pid]?.title ?? `Product ${pid}`,
      count: productCount.get(pid) || 0,
      revenue: productRevenue.get(pid) || 0,
    }))

    return {
      totalRevenue,
      topByCount,
      topByRevenue,
      topProducts,
      generatedAt: new Date().toISOString(),
    }
  }, [hydrated])

  const chartData = useMemo(() => {
    const labels = analytics.topProducts.map((p) => p.title)
    const data = analytics.topProducts.map((p) => p.count)

    return {
      labels,
      datasets: [
        {
          label: 'Units in cart (proxy for sales this month)',
          data,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          tension: 0.35,
          pointRadius: 4,
        },
      ],
    }
  }, [analytics.topProducts])

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    }
  }, [])

  if (!session || !hydrated) return null

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] dark:bg-slate-900 dark:text-slate-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Owner analytics</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
              Dashboard (Owner)
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
              Chart is generated from local cart data (demo mode). In a real store, connect this page to order history.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50">
            Customers: {customers.length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] bg-slate-50 p-6 shadow-sm dark:bg-slate-800">
          <p className="text-sm font-semibold text-slate-700">Revenue (proxy)</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">₹{analytics.totalRevenue.toLocaleString()}</p>
          <p className="mt-2 text-xs text-slate-500">Generated at {new Date(analytics.generatedAt).toLocaleString()}</p>
        </div>
        <div className="rounded-[2rem] bg-slate-50 p-6 shadow-sm dark:bg-slate-800">
          <p className="text-sm font-semibold text-slate-700">Top by units</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
            {analytics.topByCount ? productData?.[analytics.topByCount]?.title ?? `Product ${analytics.topByCount}` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Units from cart</p>
        </div>
        <div className="rounded-[2rem] bg-slate-50 p-6 shadow-sm dark:bg-slate-800">
          <p className="text-sm font-semibold text-slate-700">Top by revenue</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
            {analytics.topByRevenue ? productData?.[analytics.topByRevenue]?.title ?? `Product ${analytics.topByRevenue}` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Price sum from cart</p>
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Top products (this month)</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              This demo uses cart data as a proxy for “sold this month”. Replace with real orders for accurate analytics.
            </p>
          </div>
        </div>

        <div className="mt-6">
          {/* Ensure chart.js is loaded */}
          <ChartJS />
          <Chart data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
        <p className="font-semibold">Note</p>
        <p className="mt-2">
          This owner dashboard is stored under <span className="font-mono">/owner-dashboard</span>. It can be linked/hidden from public UI as needed.
        </p>
      </div>
    </section>
  )
}

