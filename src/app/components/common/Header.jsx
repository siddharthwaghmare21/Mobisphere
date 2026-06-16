"use client"

import Image from "next/image"
import Link from "next/link"
import { FaBars } from "react-icons/fa"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const ADMIN_SESSION_KEY = "mobisphereAdminSession"

function readJsonFromStorage(key) {
    if (typeof window === "undefined") return null

    try {
        return JSON.parse(localStorage.getItem(key) || "null")
    } catch {
        return null
    }
}

export default function Header() {
    const router = useRouter()
    const [menuOpen, setMenuOpen] = useState(false)

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev)
    }

    const closeMenu = () => {
        setMenuOpen(false)
    }

    useEffect(() => {
        const handleShortcut = (event) => {
            const isAdminShortcut =
                event.altKey === true &&
                event.shiftKey === true &&
                event.code === "KeyA"

            if (!isAdminShortcut) return

            const target = event.target
            const tagName = target?.tagName?.toLowerCase()

            const isTypingField =
                ["input", "textarea", "select"].includes(tagName) ||
                target?.isContentEditable

            if (isTypingField) return

            event.preventDefault()
            setMenuOpen(false)

            /*
              Admin hidden shortcut:
              Alt + Shift + A
              This opens admin-panel page.
              Login/signup protection is handled inside admin-panel/page.jsx.
            */
            router.push("/admin-panel")
        }

        window.addEventListener("keydown", handleShortcut)

        return () => {
            window.removeEventListener("keydown", handleShortcut)
        }
    }, [router])

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setMenuOpen(false)
            }
        }

        window.addEventListener("keydown", handleEscape)

        return () => {
            window.removeEventListener("keydown", handleEscape)
        }
    }, [])

    useEffect(() => {
        const handleStorageChange = () => {
            readJsonFromStorage(ADMIN_SESSION_KEY)
        }

        window.addEventListener("storage", handleStorageChange)
        window.addEventListener("mobisphereUserChanged", handleStorageChange)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
            window.removeEventListener("mobisphereUserChanged", handleStorageChange)
        }
    }, [])

    const navLinks = [
        { href: "/menu", label: "My Profile" },
        { href: "/", label: "Home" },
        { href: "/cart", label: "Cart" },
        { href: "/product", label: "Product" },
        { href: "/enquiry", label: "Enquiry" },
        { href: "/pricing", label: "Pricing" },
        { href: "/about-us", label: "About" },
    ]

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/90 shadow-[0_18px_60px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
            <nav className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                <Link
                    href="/"
                    onClick={closeMenu}
                    className="group flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-2 pr-4 shadow-2xl transition hover:border-emerald-300/30 hover:bg-white/[0.09]"
                >
                    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white shadow-lg shadow-emerald-500/10">
                        <Image
                            src="/images/MobisphereLogo.jpeg"
                            alt="Mobisphere Logo"
                            width={44}
                            height={44}
                            priority
                            className="h-11 w-11 rounded-full object-cover transition duration-300 group-hover:scale-110"
                        />
                    </div>

                    <div className="leading-none">
                        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-emerald-300">
                            Mobisphere
                        </p>
                        <span className="mt-1 block text-sm font-black tracking-wide text-white sm:text-base">
                            Mobile Shop
                        </span>
                    </div>
                </Link>

                <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-white shadow-lg transition hover:-translate-y-0.5 hover:border-emerald-300/40 hover:bg-emerald-400 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-300 md:hidden"
                    aria-controls="mobisphere-navbar"
                    aria-expanded={menuOpen}
                    aria-label="Toggle navigation menu"
                    onClick={toggleMenu}
                >
                    <FaBars />
                </button>

                <div
                    id="mobisphere-navbar"
                    className={`${menuOpen ? "block" : "hidden"} absolute left-4 right-4 top-[76px] md:static md:block md:w-auto`}
                >
                    <ul className="rounded-[1.7rem] border border-white/10 bg-slate-950/95 p-3 text-center text-sm font-bold text-slate-200 shadow-2xl backdrop-blur-2xl md:flex md:items-center md:gap-1 md:rounded-full md:bg-white/[0.06] md:p-1.5 md:shadow-none">
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    onClick={closeMenu}
                                    className="block rounded-full px-4 py-3 text-slate-200 transition hover:bg-white hover:text-slate-950 md:px-3 lg:px-4"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </header>
    )
}
