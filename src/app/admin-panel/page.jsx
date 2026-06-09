"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ADMIN_SESSION_KEY = 'mobisphereAdminSession'
const CUSTOMER_STORAGE_KEY = 'mobisphereCustomers'
const ENQUIRY_STORAGE_KEY = 'mobisphereEnquiries'

function loadJson(key) {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function saveJson(key, value) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export default function AdminPanelPage() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [customers, setCustomers] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedSession = loadJson(ADMIN_SESSION_KEY)
    if (!storedSession) {
      router.replace('/admin')
      return
    }

    const fetchData = async () => {
      setSession(storedSession)

      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: enquiriesData } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false })

      setCustomers(customersData || [])
      setEnquiries(enquiriesData || [])
    }

    fetchData()
  }, [router])

  const saveCustomers = (nextCustomers) => {
    setCustomers(nextCustomers)
    saveJson(CUSTOMER_STORAGE_KEY, nextCustomers)
  }

  const saveEnquiries = (nextEnquiries) => {
    setEnquiries(nextEnquiries)
    saveJson(ENQUIRY_STORAGE_KEY, nextEnquiries)
  }

  const handleCustomerDelete = async (customerId) => {
    await supabase.from('customers').delete().eq('id', customerId)
    const next = customers.filter((customer) => customer.id !== customerId)
    setCustomers(next)
    setMessage('Customer removed successfully.')
  }

  const handleEnquiryDelete = (enquiryId) => {
    const next = enquiries.filter((enquiry) => enquiry.id !== enquiryId)
    saveEnquiries(next)
    setMessage('Enquiry removed successfully.')
  }

  const handleEnquiryChange = (enquiryId, field, value) => {
    const next = enquiries.map((entry) =>
      entry.id === enquiryId ? { ...entry, [field]: value } : entry,
    )
    saveEnquiries(next)
  }

  const handleRefresh = () => {
    const storedCustomers = loadJson(CUSTOMER_STORAGE_KEY)
    const storedEnquiries = loadJson(ENQUIRY_STORAGE_KEY)
    setCustomers(Array.isArray(storedCustomers) ? storedCustomers : [])
    setEnquiries(Array.isArray(storedEnquiries) ? storedEnquiries : [])
    setMessage('Dashboard refreshed.')
  }

  const adminName = session?.displayName || session?.userId || 'Admin'

  if (!session) {
    return null
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Admin dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Welcome back, {adminName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Use this panel to manage customers and enquiries. Shortcut: Alt+Shift+A.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900">
            Customers: {customers.length} • Enquiries: {enquiries.length}
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {message}
        </div>
      )}

      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-slate-600">Admin-only control panel. Enquiry submissions are saved locally and are only visible here.</p>
          <p className="text-sm text-slate-600">Press Alt+Shift+A to open this page once you are logged in as admin.</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Refresh data
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-10">
          <section className="rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">Admin Menu (Owner)</h2>
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">1) Dashboard / Analytics Overview</p>
                <p className="mt-1">Graphs and key business figures.</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">2) Product Management (Inventory)</p>
                <p className="mt-1">Add / edit / delete products and stock alerts.</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">3) Order Management</p>
                <p className="mt-1">Order list + status updates.</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">4) User Management</p>
                <p className="mt-1">User list + role assignment (admin/block).</p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                <Link href="/discount-coupons" onClick={() => router.replace('/discount-coupons')} className="block font-semibold">
                  5) Discount and Coupon Management
                </Link>
                <p className="mt-1 text-emerald-900/80">Coupons &amp; Discounts • Create FESTIVAL20-style codes • Set expiration date</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <Link href="/advanced-reports" className="block font-semibold">
                  6) User Behavior and Sales Reports
                </Link>
                <p className="mt-1">Advanced Reports / Big Data • Top-selling products • Most viewed categories • Export CSV/Excel</p>
              </div>
            </div>


            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Registered customers</h2>
                <p className="mt-2 text-sm text-slate-600">Review and remove user accounts when needed.</p>
              </div>
            </div>
            {customers.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">No customer records are available.</div>
            ) : (
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div key={customer.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{customer.full_name}</p>
                        <p className="text-sm">Mobile: {customer.mobile_number}</p>
                        <p className="text-sm">Address: {customer.address}</p>
                        <p className="text-xs text-slate-500">Joined on {customer.created_at ? new Date(customer.created_at).toLocaleString() : '—'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCustomerDelete(customer.id)}
                        className="inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-900">Enquiry management</h2>
              <p className="mt-2 text-sm text-slate-600">Only admins can view, update, and delete enquiries submitted by visitors.</p>
            </div>
            {enquiries.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">No enquiries have been received yet.</div>
            ) : (
              <div className="space-y-4">
                {enquiries.map((enquiry) => (
                  <div key={enquiry.id} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{enquiry.subject}</p>
                        <p className="text-sm">From: {enquiry.fullName} • {enquiry.mobileNumber}</p>
                        <p className="text-sm">Email: {enquiry.email}</p>
                        <p className="text-xs text-slate-500">Submitted on {new Date(enquiry.createdAt).toLocaleString()}</p>
                        <p className="text-sm text-slate-700">Message: {enquiry.message}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEnquiryDelete(enquiry.id)}
                        className="inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 text-sm text-slate-700">
                        <span>Status</span>
                        <select
                          value={enquiry.status}
                          onChange={(e) => handleEnquiryChange(enquiry.id, 'status', e.target.value)}
                          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                        >
                          <option>New</option>
                          <option>In progress</option>
                          <option>Completed</option>
                          <option>Closed</option>
                        </select>
                      </label>
                      <label className="space-y-2 text-sm text-slate-700">
                        <span>Admin note</span>
                        <textarea
                          value={enquiry.adminNote}
                          onChange={(e) => handleEnquiryChange(enquiry.id, 'adminNote', e.target.value)}
                          className="h-24 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                          placeholder="Add an admin response or internal note"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
          <div className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Admin quick actions</p>
              <h2 className="mt-2 text-2xl font-semibold">Admin Dashboard (Contact Us)</h2>
              <p className="mt-2 text-sm text-slate-300">
                This panel can be hidden from the public navigation using <span className="font-semibold">Alt + Shift + A</span>.
              </p>
            </div>
            <div className="space-y-4 text-sm leading-7 text-slate-300">
              <p>• Control panel for adding new mobiles, removing old ones, and changing prices.</p>
              <p>• Place to check incoming inquiries and orders.</p>
              <p>• Use Alt+Shift+A shortcut to return here quickly.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
