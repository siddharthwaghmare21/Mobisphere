"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AdvancedReportsPage() {
  const router = useRouter()
  const [session, setSession] = useState(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = JSON.parse(localStorage.getItem("mobisphereAdminSession") || "null")
      if (!stored) {
        router.replace("/admin-panel")
        return
      }
      queueMicrotask(() => setSession(stored))
    } catch {
      router.replace("/admin-panel")
    }
  }, [router])

  if (!session) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Advanced Reports</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          User Behavior & Sales Reports
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
          Reports UI will be enabled after syncing the dashboard data model.
        </p>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
        Data export + analytics cards are temporarily disabled due to a JSX build issue while writing this file.
      </div>
    </section>
  )
}
