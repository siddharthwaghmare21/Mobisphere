"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const CUSTOMER_STORAGE_KEY = 'mobisphereCustomers'

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

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState('')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const session = loadJson(ADMIN_SESSION_KEY)
    const storedCustomers = loadJson(CUSTOMER_STORAGE_KEY)
    
    queueMicrotask(() => {
      if (session) {
        setIsLoggedIn(true)
      }
      setCustomers(Array.isArray(storedCustomers) ? storedCustomers : [])
      setHydrated(true)
    })
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Please enter both username and password.')
      return
    }

    const cleanUser = username.trim().toLowerCase()
    const foundAdmin = customers.find(
      (c) => (c.fullName.toLowerCase() === cleanUser || c.mobileNumber === username.trim()) && c.isAdmin
    )

    if (foundAdmin) {
      if (foundAdmin.password === password) {
        const sessionData = { username: foundAdmin.fullName, loginAt: new Date().toISOString() }
        saveJson(ADMIN_SESSION_KEY, sessionData)
        setIsLoggedIn(true)
        return
      }
    }

    if (cleanUser === 'admin' && password === 'admin') {
      const sessionData = { username: 'System Admin', loginAt: new Date().toISOString() }
      saveJson(ADMIN_SESSION_KEY, sessionData)
      setIsLoggedIn(true)
      return
    }

    setError('Invalid admin credentials. Access denied.')
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
  }

  const handleDeleteCustomer = (id) => {
    const next = customers.filter((c) => c.id !== id)
    setCustomers(next)
    saveJson(CUSTOMER_STORAGE_KEY, next)
  }

  if (!hydrated) return null

  if (!isLoggedIn) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 pt-32">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Secure Gateway</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">Admin Portal</h1>
            <p className="mt-2 text-sm text-slate-600">Enter authorization credentials to view store analytics.</p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm text-slate-700">
              <span>Admin Username or Mobile</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Username or 10-digit number"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-full bg-slate-950 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Verify & Enter
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 pt-28 sm:px-6">
      <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Management control</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Review all system customer accounts registered on this storefront.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push('/owner-dashboard')}
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              View Analytics Chart
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-slate-950 mb-6">Registered Store Accounts ({customers.length})</h2>
        
        {customers.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No system profiles have been created yet. New signs ups on the account page will be logged here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-xs">
                  <th className="py-4 font-semibold">Customer Metadata</th>
                  <th className="py-4 font-semibold">Security Pass</th>
                  <th className="py-4 font-semibold">Role</th>
                  <th className="py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-slate-950">{c.fullName}</div>
                      <div className="mt-1 text-xs text-slate-500 font-mono">{c.mobileNumber}</div>
                      <div className="mt-1 max-w-xs truncate text-xs text-slate-400 font-normal">{c.address}</div>
                    </td>
                    <td className="py-4 font-mono text-xs text-slate-600">{c.password}</td>
                    <td className="py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>
                        {c.isAdmin ? 'Admin' : 'Customer'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(c.id)}
                        className="rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}