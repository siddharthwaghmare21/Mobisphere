import React from 'react'

export default function Footer() {
    return (
        <footer className="bg-[#7acc47] px-4 pt-10 lg:pt-12 text-slate-950">
            <div className="mx-auto max-w-screen-xl space-y-10 p-6 lg:p-8">
                <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:items-start">
                    <div className="max-w-md">
                        <a href="/" className="inline-flex items-center gap-3">
                            <img
                                src="/images/MobisphereLogo.jpeg"
                                alt="Mobisphere Logo"
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-2xl object-cover"
                            />
                            <span className="text-2xl font-semibold tracking-tight text-slate-950">
                                Mobisphere Mobile Shop
                            </span>
                        </a>
                        <p className="mt-4 text-sm leading-6 text-slate-950/85">
                            Trusted mobile store in Sangli with fast delivery, expert advice, and premium mobile accessories.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                        <div>
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950">Explore</h2>
                            <ul className="space-y-3 text-sm font-medium text-slate-950/90">
                                <li>
                                    <a href="/product" className="transition hover:text-slate-950 hover:underline">
                                        Products
                                    </a>
                                </li>
                                <li>
                                    <a href="/about-us" className="transition hover:text-slate-950 hover:underline">
                                        About us
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950">Support</h2>
                            <ul className="space-y-3 text-sm font-medium text-slate-950/90">
                                <li>
                                    <a href="/contact" className="transition hover:text-slate-950 hover:underline">
                                        Contact
                                    </a>
                                </li>
                                <li>
                                    <a href="mailto:support@mobisphere.com" className="transition hover:text-slate-950 hover:underline">
                                        Email support
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950">Legal</h2>
                            <ul className="space-y-3 text-sm font-medium text-slate-950/90">
                                <li>
                                    <a href="#" className="transition hover:text-slate-950 hover:underline">
                                        Privacy policy
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="transition hover:text-slate-950 hover:underline">
                                        Terms & conditions
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <hr className="my-6 border-slate-950/20 sm:mx-auto lg:my-8" />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-slate-950/80 sm:text-center">
                        © 2026 <a href="/" className="font-semibold text-slate-950 hover:underline">Mobisphere Mobile Shop</a>. All Rights Reserved.
                    </span>
                    <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start">
                        <a href="#" className="text-slate-950/80 transition hover:text-slate-950">
                            <span className="sr-only">Facebook page</span>
                            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M13.135 6H15V3h-1.865a4.147 4.147 0 0 0-4.142 4.142V9H7v3h2v9.938h3V12h2.021l.592-3H12V6.591A.6.6 0 0 1 12.592 6h.543Z" clipRule="evenodd" />
                            </svg>
                        </a>
                        <a href="#" className="text-slate-950/80 transition hover:text-slate-950">
                            <span className="sr-only">Discord community</span>
                            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.942 5.556a16.3 16.3 0 0 0-4.126-1.3 12.04 12.04 0 0 0-.529 1.1 15.175 15.175 0 0 0-4.573 0 11.586 11.586 0 0 0-.535-1.1 16.274 16.274 0 0 0-4.129 1.3 17.392 17.392 0 0 0-2.868 11.662 15.785 15.785 0 0 0 4.963 2.521c.41-.564.773-1.16 1.084-1.785a10.638 10.638 0 0 1-1.706-.83c.143-.106.283-.217.418-.331a11.664 11.664 0 0 0 10.118 0c.137.114.277.225.418.331-.544.328-1.116.606-1.71.832a12.58 12.58 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595 17.286 17.286 0 0 0-2.973-11.59ZM8.678 14.813a1.94 1.94 0 0 1-1.8-2.045 1.93 1.93 0 0 1 1.8-2.047 1.918 1.918 0 0 1 1.8 2.047 1.929 1.929 0 0 1-1.8 2.045Zm6.644 0a1.94 1.94 0 0 1-1.8-2.045 1.93 1.93 0 0 1 1.8-2.047 1.919 1.919 0 0 1 1.8 2.047 1.93 1.93 0 0 1-1.8 2.045Z" />
                            </svg>
                        </a>
                        <a href="#" className="text-slate-950/80 transition hover:text-slate-950">
                            <span className="sr-only">Twitter page</span>
                            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13.795 10.533 20.68 2h-3.073l-5.255 6.517L7.69 2H1l7.806 10.91L1.47 22h3.074l5.705-7.07L15.31 22H22l-8.205-11.467Zm-2.38 2.95L9.97 11.464 4.36 3.627h2.31l4.528 6.317 1.443 2.02 6.018 8.409h-2.31l-4.934-6.89Z" />
                            </svg>
                        </a>
                        <a href="#" className="text-slate-950/80 transition hover:text-slate-950">
                            <span className="sr-only">GitHub account</span>
                            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.393 6.17 10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418c.504.095.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621.317.044.62.163.885.346.266.183.487.426.647.71.135.253.318.476.538.655a2.079 2.079 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37-2.219-.259-4.554-1.138-4.554-5.07a4.022 4.022 0 0 1 1.031-2.75 3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05.37.858.406 1.828.101 2.713a4.017 4.017 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.471 2.471 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814 0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421 10.473 10.473 0 0 0 1.313-6.948A10.32 10.32 0 0 0 12.007 2Z" clipRule="evenodd" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
