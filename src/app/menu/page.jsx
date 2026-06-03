"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

const initialSignupData = {
  fullName: '',
  email: '',
  mobileNumber: '',
  phoneNumber: '',
  address: '',
}

const initialLoginData = {
  emailOrMobile: '',
}

export default function MenuPage() {
  const [tab, setTab] = useState('signup')
  const [signupData, setSignupData] = useState(initialSignupData)
  const [signupStage, setSignupStage] = useState('form')
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('')
  const [generatedMobileOtp, setGeneratedMobileOtp] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [mobileOtp, setMobileOtp] = useState('')
  const [accounts, setAccounts] = useState([])
  const [signupMessage, setSignupMessage] = useState('')
  const [loginData, setLoginData] = useState(initialLoginData)
  const [loginStage, setLoginStage] = useState('form')
  const [generatedLoginOtp, setGeneratedLoginOtp] = useState('')
  const [loginOtp, setLoginOtp] = useState('')
  const [loginMessage, setLoginMessage] = useState('')
  const [loggedInUser, setLoggedInUser] = useState(null)

  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem('mobisphereCustomers')
    if (stored) {
      setAccounts(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobisphereCustomers', JSON.stringify(accounts))
    }
  }, [accounts])

  const handleSignupChange = (field, value) => {
    setSignupData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLoginChange = (value) => {
    setLoginData({ emailOrMobile: value })
  }

  const sendSignupOtps = () => {
    if (!signupData.fullName || !signupData.email || !signupData.mobileNumber || !signupData.address) {
      setSignupMessage('Please complete all required fields before requesting OTPs.')
      return
    }

    const emailCode = generateOtp()
    const mobileCode = generateOtp()
    setGeneratedEmailOtp(emailCode)
    setGeneratedMobileOtp(mobileCode)
    setSignupStage('verify')
    setSignupMessage('OTP codes sent to your email and mobile number. Enter the codes below to verify both.')
  }

  const verifySignupOtps = () => {
    if (emailOtp !== generatedEmailOtp || mobileOtp !== generatedMobileOtp) {
      setSignupMessage('The OTP codes do not match. Please check both email and mobile codes and try again.')
      return
    }

    const newAccount = {
      ...signupData,
      id: Date.now(),
      verifiedAt: new Date().toISOString(),
    }

    setAccounts((prev) => [...prev, newAccount])
    setSignupMessage('Your account has been created and verified successfully. You can now log in using email or mobile number.')
    setSignupStage('complete')
    setEmailOtp('')
    setMobileOtp('')
    setGeneratedEmailOtp('')
    setGeneratedMobileOtp('')
    setSignupData(initialSignupData)
  }

  const resetSignup = () => {
    setSignupData(initialSignupData)
    setSignupStage('form')
    setGeneratedEmailOtp('')
    setGeneratedMobileOtp('')
    setEmailOtp('')
    setMobileOtp('')
    setSignupMessage('')
  }

  const sendLoginOtp = () => {
    if (!loginData.emailOrMobile) {
      setLoginMessage('Enter the email address or mobile number associated with your account.')
      return
    }

    const accountExists = accounts.some(
      (account) => account.email === loginData.emailOrMobile || account.mobileNumber === loginData.emailOrMobile,
    )

    if (!accountExists) {
      setLoginMessage('No account found for that email or mobile number. Please sign up first.')
      return
    }

    setGeneratedLoginOtp(generateOtp())
    setLoginStage('verify')
    setLoginMessage('OTP sent to your registered email or mobile. Enter it below to complete login.')
  }

  const verifyLoginOtp = () => {
    if (loginOtp !== generatedLoginOtp) {
      setLoginMessage('Incorrect OTP. Please enter the correct code sent to your email or phone.')
      return
    }

    const matchedAccount = accounts.find(
      (account) => account.email === loginData.emailOrMobile || account.mobileNumber === loginData.emailOrMobile,
    )

    if (!matchedAccount) {
      setLoginMessage('No matching account was found. Please sign up first.')
      return
    }

    setLoggedInUser(matchedAccount)
    setLoginMessage(`Welcome back, ${matchedAccount.fullName}! You are now logged in.`)
    setLoginStage('complete')
    setLoginOtp('')
    setGeneratedLoginOtp('')
    setLoginData(initialLoginData)
  }

  const resetLogin = () => {
    setLoginStage('form')
    setGeneratedLoginOtp('')
    setLoginOtp('')
    setLoginMessage('')
    setLoggedInUser(null)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Mobisphere account</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Login & Sign Up
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Create an account with your name, email, mobile number, address, and phone number. Verify both email and mobile with OTPs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`rounded-full px-5 py-3 text-sm font-medium transition ${tab === 'login' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`rounded-full px-5 py-3 text-sm font-medium transition ${tab === 'signup' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Sign Up
          </button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/50">
          {tab === 'signup' ? (
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Name</span>
                  <input
                    value={signupData.fullName}
                    onChange={(e) => handleSignupChange('fullName', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Full Name"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Email</span>
                  <input
                    value={signupData.email}
                    onChange={(e) => handleSignupChange('email', e.target.value)}
                    type="email"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="example@mail.com"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Mobile Number</span>
                  <input
                    value={signupData.mobileNumber}
                    onChange={(e) => handleSignupChange('mobileNumber', e.target.value)}
                    type="tel"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Mobile number"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Phone Number</span>
                  <input
                    value={signupData.phoneNumber}
                    onChange={(e) => handleSignupChange('phoneNumber', e.target.value)}
                    type="tel"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Alternate phone"
                  />
                </label>
                <label className="sm:col-span-2 space-y-2 text-sm text-slate-700">
                  <span>Address</span>
                  <textarea
                    value={signupData.address}
                    onChange={(e) => handleSignupChange('address', e.target.value)}
                    className="h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Street, city, state, pincode"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {signupStage === 'form' ? (
                  <button
                    type="button"
                    onClick={sendSignupOtps}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Send Verification OTPs
                  </button>
                ) : signupStage === 'verify' ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 text-sm text-slate-700">
                        <span>Email OTP</span>
                        <input
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                          placeholder="Enter email OTP"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700">
                        <span>Mobile OTP</span>
                        <input
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                          placeholder="Enter mobile OTP"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={verifySignupOtps}
                        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Verify & Create Account
                      </button>
                      <button
                        type="button"
                        onClick={resetSignup}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Reset Form
                      </button>
                    </div>
                    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Demo OTP codes</p>
                      <p>Email OTP: <span className="font-medium text-emerald-700">{generatedEmailOtp || '—'}</span></p>
                      <p>Mobile OTP: <span className="font-medium text-emerald-700">{generatedMobileOtp || '—'}</span></p>
                      <p className="mt-2 text-xs text-slate-500">These codes are generated for demo verification in this app.</p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                    Account created successfully! Please switch to the Login tab to access your account.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="space-y-4">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Email or Mobile</span>
                  <input
                    value={loginData.emailOrMobile}
                    onChange={(e) => handleLoginChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Your registered email or mobile"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {loginStage === 'form' ? (
                  <button
                    type="button"
                    onClick={sendLoginOtp}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Send Login OTP
                  </button>
                ) : loginStage === 'verify' ? (
                  <>
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Enter OTP</span>
                      <input
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                        placeholder="Enter one-time code"
                      />
                    </label>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={verifyLoginOtp}
                        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Verify OTP
                      </button>
                      <button
                        type="button"
                        onClick={resetLogin}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Reset Login
                      </button>
                    </div>
                    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Demo OTP code</p>
                      <p>Login OTP: <span className="font-medium text-emerald-700">{generatedLoginOtp || '—'}</span></p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                    {loggedInUser ? (
                      <>
                        <p className="font-semibold">Logged in successfully</p>
                        <p>Welcome back, {loggedInUser.fullName}.</p>
                        <p className="mt-2 text-sm text-slate-600">You registered with {loggedInUser.email} and mobile {loggedInUser.mobileNumber}.</p>
                      </>
                    ) : (
                      <p>Login completed. You may close this page or switch to another tab.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm shadow-slate-500/20">
          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Why create an account?</p>
              <h2 className="mt-2 text-2xl font-semibold">Secure account access</h2>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-slate-300">
              <li>✔ Save your order details and shipping address</li>
              <li>✔ Verify both email and mobile with OTP</li>
              <li>✔ Access faster support and exclusive offers</li>
              <li>✔ Keep your account details safe in your browser</li>
            </ul>
            <div className="rounded-3xl bg-slate-900/90 p-5 text-sm text-slate-300">
              <p className="font-semibold text-white">How it works</p>
              <p className="mt-3 text-slate-400">This demo generates OTPs inside the browser and saves accounts to local storage. In a real app, email and SMS verification would be handled by a backend service.</p>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 className="text-lg font-semibold text-slate-900">Account guide</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-900">Sign up</p>
            <p>Fill in your details, request OTPs, then verify both email and mobile codes to create a new account.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Login</p>
            <p>Use your registered email or mobile number and verify the OTP code to access your account.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
