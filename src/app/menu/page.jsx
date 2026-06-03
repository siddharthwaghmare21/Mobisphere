"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

async function sendOtpRequest(body) {
  const response = await fetch('/api/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json()
}

export default function MenuPage() {
  const router = useRouter()
  const [tab, setTab] = useState('signup')
  const [signupData, setSignupData] = useState(initialSignupData)
  const [signupStage, setSignupStage] = useState('form')
  const [emailOtpToken, setEmailOtpToken] = useState('')
  const [mobileOtpToken, setMobileOtpToken] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [mobileOtp, setMobileOtp] = useState('')
  const [debugEmailOtp, setDebugEmailOtp] = useState('')
  const [debugMobileOtp, setDebugMobileOtp] = useState('')
  const [accounts, setAccounts] = useState([])
  const [signupMessage, setSignupMessage] = useState('')
  const [loginData, setLoginData] = useState(initialLoginData)
  const [loginStage, setLoginStage] = useState('form')
  const [loginOtpToken, setLoginOtpToken] = useState('')
  const [loginOtp, setLoginOtp] = useState('')
  const [debugLoginOtp, setDebugLoginOtp] = useState('')
  const [loginMessage, setLoginMessage] = useState('')
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedAccounts = localStorage.getItem('mobisphereCustomers')
    const storedUser = localStorage.getItem('mobisphereLoggedIn')
    if (storedAccounts) {
      setAccounts(JSON.parse(storedAccounts))
    }
    if (storedUser) {
      setLoggedInUser(JSON.parse(storedUser))
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('mobisphereCustomers', JSON.stringify(accounts))
  }, [accounts])

  const handleSignupChange = (field, value) => {
    setSignupData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLoginChange = (value) => {
    setLoginData({ emailOrMobile: value })
  }

  const saveLoggedInUser = (account) => {
    setLoggedInUser(account)
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobisphereLoggedIn', JSON.stringify(account))
    }
  }

  const sendSignupOtps = async () => {
    setSignupMessage('')
    if (!signupData.fullName || !signupData.email || !signupData.mobileNumber || !signupData.address) {
      setSignupMessage('Please complete all required fields before requesting OTPs.')
      return
    }

    setIsSubmitting(true)
    try {
      const emailResponse = await sendOtpRequest({
        action: 'send',
        type: 'email',
        destination: signupData.email,
        purpose: 'signup',
        name: signupData.fullName,
      })

      const mobileResponse = await sendOtpRequest({
        action: 'send',
        type: 'sms',
        destination: signupData.mobileNumber,
        purpose: 'signup',
        name: signupData.fullName,
      })

      if (!emailResponse.success || !mobileResponse.success) {
        setSignupMessage(emailResponse.error || mobileResponse.error || 'Unable to send OTP codes.')
        return
      }

      setEmailOtpToken(emailResponse.token)
      setMobileOtpToken(mobileResponse.token)
      setDebugEmailOtp(emailResponse.debugCode || '')
      setDebugMobileOtp(mobileResponse.debugCode || '')
      setSignupStage('verify')
      setSignupMessage('OTP codes sent to your email and mobile number. Enter the codes below to verify both.')
    } catch (error) {
      setSignupMessage('Unable to send OTP codes. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifySignupOtps = async () => {
    setSignupMessage('')
    if (!emailOtpToken || !mobileOtpToken) {
      setSignupMessage('Please request OTP codes first.')
      return
    }
    if (!emailOtp || !mobileOtp) {
      setSignupMessage('Please enter both OTP codes for verification.')
      return
    }

    setIsSubmitting(true)
    try {
      const emailVerify = await sendOtpRequest({ action: 'verify', token: emailOtpToken, code: emailOtp })
      const mobileVerify = await sendOtpRequest({ action: 'verify', token: mobileOtpToken, code: mobileOtp })

      if (!emailVerify.success || !mobileVerify.success) {
        setSignupMessage(emailVerify.error || mobileVerify.error || 'OTP verification failed.')
        return
      }

      const newAccount = {
        ...signupData,
        id: Date.now(),
        verifiedAt: new Date().toISOString(),
      }

      setAccounts((prev) => [...prev, newAccount])
      setSignupMessage('Your account has been created and verified successfully. Please switch to login.')
      setSignupStage('complete')
      setEmailOtp('')
      setMobileOtp('')
      setEmailOtpToken('')
      setMobileOtpToken('')
      setDebugEmailOtp('')
      setDebugMobileOtp('')
      setSignupData(initialSignupData)
    } catch (error) {
      setSignupMessage('Unable to verify OTP codes. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetSignup = () => {
    setSignupData(initialSignupData)
    setSignupStage('form')
    setEmailOtpToken('')
    setMobileOtpToken('')
    setEmailOtp('')
    setMobileOtp('')
    setDebugEmailOtp('')
    setDebugMobileOtp('')
    setSignupMessage('')
  }

  const sendLoginOtp = async () => {
    setLoginMessage('')
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

    setIsSubmitting(true)
    try {
      const type = loginData.emailOrMobile.includes('@') ? 'email' : 'sms'
      const loginResponse = await sendOtpRequest({
        action: 'send',
        type,
        destination: loginData.emailOrMobile,
        purpose: 'login',
      })

      if (!loginResponse.success) {
        setLoginMessage(loginResponse.error || 'Unable to send login OTP.')
        return
      }

      setLoginOtpToken(loginResponse.token)
      setDebugLoginOtp(loginResponse.debugCode || '')
      setLoginStage('verify')
      setLoginMessage('Login OTP sent. Please enter the code to continue.')
    } catch (error) {
      setLoginMessage('Unable to send login OTP at the moment. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyLoginOtp = async () => {
    setLoginMessage('')
    if (!loginOtpToken) {
      setLoginMessage('Please request an OTP first.')
      return
    }
    if (!loginOtp) {
      setLoginMessage('Please enter the OTP code.')
      return
    }

    setIsSubmitting(true)
    try {
      const verifyResponse = await sendOtpRequest({ action: 'verify', token: loginOtpToken, code: loginOtp })
      if (!verifyResponse.success) {
        setLoginMessage(verifyResponse.error || 'OTP verification failed.')
        return
      }

      const matchedAccount = accounts.find(
        (account) => account.email === loginData.emailOrMobile || account.mobileNumber === loginData.emailOrMobile,
      )

      if (!matchedAccount) {
        setLoginMessage('No matching account was found. Please sign up first.')
        return
      }

      saveLoggedInUser(matchedAccount)
      setLoginMessage(`Welcome back, ${matchedAccount.fullName}! You are now logged in.`)
      setLoginStage('complete')
      setLoginOtp('')
      setLoginOtpToken('')
      router.push('/account')
    } catch (error) {
      setLoginMessage('Unable to verify OTP. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetLogin = () => {
    setLoginStage('form')
    setLoginOtpToken('')
    setLoginOtp('')
    setDebugLoginOtp('')
    setLoginMessage('')
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Mobisphere account</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Login & Sign Up
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Create your account, verify email and mobile with OTP, and manage your data from My Account.
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
        <div className="space-y-6 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
          {(signupMessage || (tab === 'login' && loginMessage)) && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {tab === 'signup' ? signupMessage : loginMessage}
            </div>
          )}

          {tab === 'signup' ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Name</span>
                  <input
                    value={signupData.fullName}
                    onChange={(e) => handleSignupChange('fullName', e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Full Name"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Email</span>
                  <input
                    value={signupData.email}
                    onChange={(e) => handleSignupChange('email', e.target.value)}
                    type="email"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="example@mail.com"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Mobile Number</span>
                  <input
                    value={signupData.mobileNumber}
                    onChange={(e) => handleSignupChange('mobileNumber', e.target.value)}
                    type="tel"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Mobile number"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Phone Number</span>
                  <input
                    value={signupData.phoneNumber}
                    onChange={(e) => handleSignupChange('phoneNumber', e.target.value)}
                    type="tel"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Alternate phone"
                  />
                </label>
                <label className="sm:col-span-2 space-y-2 text-sm text-slate-700">
                  <span>Address</span>
                  <textarea
                    value={signupData.address}
                    onChange={(e) => handleSignupChange('address', e.target.value)}
                    className="h-28 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Street, city, state, pincode"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {signupStage === 'form' ? (
                  <button
                    type="button"
                    onClick={sendSignupOtps}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
                          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                          placeholder="Enter email OTP"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700">
                        <span>Mobile OTP</span>
                        <input
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value)}
                          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                          placeholder="Enter mobile OTP"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={verifySignupOtps}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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

                    {(debugEmailOtp || debugMobileOtp) && (
                      <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-900">
                        <p className="font-semibold">Demo OTP values</p>
                        <p>Email OTP: <span className="font-medium text-emerald-700">{debugEmailOtp || 'sent'}</span></p>
                        <p>Mobile OTP: <span className="font-medium text-emerald-700">{debugMobileOtp || 'sent'}</span></p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                    Account created successfully! Please switch to the Login tab to continue.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Email or Mobile</span>
                  <input
                    value={loginData.emailOrMobile}
                    onChange={(e) => handleLoginChange(e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Your registered email or mobile"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {loginStage === 'form' ? (
                  <button
                    type="button"
                    onClick={sendLoginOtp}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                        placeholder="Enter one-time code"
                      />
                    </label>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={verifyLoginOtp}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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

                    {debugLoginOtp && (
                      <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-900">
                        <p className="font-semibold">Demo login OTP</p>
                        <p>Login OTP: <span className="font-medium text-emerald-700">{debugLoginOtp}</span></p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                    {loggedInUser ? (
                      <>
                        <p className="font-semibold">Logged in successfully</p>
                        <p>Welcome back, {loggedInUser.fullName}.</p>
                        <p className="mt-2 text-sm text-slate-600">You registered with {loggedInUser.email} and mobile {loggedInUser.mobileNumber}.</p>
                        <Link href="/account" className="mt-4 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                          Go to My Account
                        </Link>
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

        <aside className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
          <div className="space-y-5">
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
              <p className="mt-3 text-slate-400">This demo uses a backend OTP API for email and SMS delivery. Set your SendGrid and Twilio keys in environment variables to send real codes.</p>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
        <h2 className="text-lg font-semibold text-slate-900">Account guide</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-900">Sign up</p>
            <p>Fill in your details, request OTPs, and verify both email and mobile codes to create an account.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Login</p>
            <p>Use your registered email or mobile number and verify the OTP code to access your account page.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
