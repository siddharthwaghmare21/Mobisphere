"use client"
import Image from 'next/image'
import Link from 'next/link'
import { FaBars } from 'react-icons/fa'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const router = useRouter()

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev)
    }

    const getLoggedInUser = () => {
        if (typeof window === 'undefined') return null
        try {
            return JSON.parse(localStorage.getItem('mobisphereLoggedIn') || 'null')
        } catch {
            return null
        }
    }

    useEffect(() => {
        const updateAdminState = () => {
            const storedAdminSession = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('mobisphereAdminSession') || 'null') : null
            const user = getLoggedInUser()
            setIsAdmin(Boolean(user?.isAdmin || storedAdminSession?.userId))
        }

        updateAdminState()
        window.addEventListener('mobisphereUserChanged', updateAdminState)
        window.addEventListener('storage', updateAdminState)
        return () => {
            window.removeEventListener('mobisphereUserChanged', updateAdminState)
            window.removeEventListener('storage', updateAdminState)
        }
    }, [])

    useEffect(() => {
        

        const handleShortcut = (event) => {
            console.log("shortcut pressed");
            if (!event.altKey || !event.shiftKey || event.key.toLowerCase() !== 'a') return
            const target = event.target
            const tagName = target?.tagName?.toLowerCase()
            if (['input', 'textarea', 'select'].includes(tagName) || target?.isContentEditable) return
            event.preventDefault()
            router.push('/admin-panel')
        }

        window.addEventListener('keydown', handleShortcut)
        return () => window.removeEventListener('keydown', handleShortcut)
    }, [isAdmin, router])

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-xl">
            <nav className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between px-4 py-4 sm:px-6">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-950 shadow-lg overflow-hidden">
                        <Image
                            src="/images/MobisphereLogo.jpeg"
                            alt="Mobisphere Logo"
                            width={40}
                            height={40}
                            className="h-9 w-9 object-cover"
                        />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mobisphere</p>
                        <span className="text-lg font-semibold text-slate-950">Mobile Shop</span>
                    </div>
                </Link>

                <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 md:hidden hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    aria-controls="navbar-default"
                    aria-expanded={menuOpen}
                    onClick={toggleMenu}
                >
                    <span className="sr-only">Toggle navigation</span>
                    <FaBars />
                </button>

                <div className={`${menuOpen ? 'block' : 'hidden'} w-full md:block md:w-auto`} id="navbar-default">
                    <ul className="space-y-3 rounded-3xl border border-slate-200/80 bg-white/95 p-4 text-center text-base font-medium text-slate-700 shadow-sm md:flex md:space-y-0 md:space-x-4 md:border md:border-slate-200/50 md:bg-white/90 md:p-3 lg:px-4 lg:py-3">
                        <li>
                            <Link href="/" className="block rounded-full py-2 px-3 text-slate-700 transition hover:bg-slate-100 md:hover:bg-slate-100 md:p-2">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link href="/about-us" className="block rounded-full py-2 px-3 text-slate-700 transition hover:bg-slate-100 md:hover:bg-slate-100 md:p-2">
                                About
                            </Link>
                        </li>
                        <li>
                            <Link href="/product" className="block rounded-full py-2 px-3 text-slate-700 transition hover:bg-slate-100 md:hover:bg-slate-100 md:p-2">
                                Product
                            </Link>
                        </li>
                        <li>
                            <Link href="/pricing" className="block rounded-full py-2 px-3 text-slate-700 transition hover:bg-slate-100 md:hover:bg-slate-100 md:p-2">
                                Pricing
                            </Link>
                        </li>
                        <li>
                            <Link href="/menu" className="block rounded-full py-2 px-3 text-slate-700 transition hover:bg-slate-100 md:hover:bg-slate-100 md:p-2">
                                Account
                            </Link>
                        </li>
                        <li>
                            <Link href="/enquiry" className="block rounded-full py-2 px-3 text-slate-700 transition hover:bg-slate-100 md:hover:bg-slate-100 md:p-2">
                                Enquiry
                            </Link>
                        </li>
                        {isAdmin && (
                            <li>
                                <Link href="/admin-panel" className="block rounded-full py-2 px-3 text-slate-700 transition hover:bg-slate-100 md:hover:bg-slate-100 md:p-2">
                                    Admin
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </nav>
        </header>
    )
}
