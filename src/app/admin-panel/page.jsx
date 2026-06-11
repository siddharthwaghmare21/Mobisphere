"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_SESSION_KEY = 'mobisphereAdminSession'

function loadJson(key) {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

export default function AdminPanelRedirect() {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const session = loadJson(ADMIN_SESSION_KEY)
    setHydrated(true)

    // If admin is logged in, forward to unified admin page.
    if (session) {
      router.replace('/admin')
    } else {
      router.replace('/admin')
    }
  }, [router])

  if (!hydrated) return null
  return null
}

