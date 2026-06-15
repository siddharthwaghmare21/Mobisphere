"use client"

import React from 'react'
import { ProductProvider } from '@/app/context/ProductContext'

export default function ClientProviders({ children }) {
  return <ProductProvider>{children}</ProductProvider>
}
