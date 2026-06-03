import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import Twilio from 'twilio'
import { createOtpToken, verifyOtpToken } from '@/lib/otpToken'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM = process.env.SENDGRID_FROM || 'Mobisphere <noreply@mobisphere.com>'
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM = process.env.TWILIO_FROM
const SHOW_OTPS = process.env.NEXT_PUBLIC_SHOW_OTP === 'true'

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

function createMessageBody(purpose, code) {
  return `Your Mobisphere ${purpose} OTP is ${code}. Use this code to complete verification.`
}

async function sendEmailOtp(email, code, purpose) {
  const debug = SHOW_OTPS ? code : null

  if (!SENDGRID_API_KEY) {
    return { debugCode: debug }
  }

  const msg = {
    to: email,
    from: SENDGRID_FROM,
    subject: `Mobisphere ${purpose} verification code`,
    text: createMessageBody(purpose, code),
    html: `<p>Your Mobisphere <strong>${purpose}</strong> OTP is <strong>${code}</strong>.</p>`,
  }
  await sgMail.send(msg)
  return { debugCode: debug }
}

async function sendSmsOtp(mobile, code, purpose) {
  const debug = SHOW_OTPS ? code : null

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    return { debugCode: debug }
  }

  const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  await client.messages.create({
    body: createMessageBody(purpose, code),
    from: TWILIO_FROM,
    to: mobile,
  })
  return { debugCode: debug }
}

export async function POST(request) {
  const body = await request.json()
  const action = body?.action

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 })
  }

  if (action === 'send') {
    const { type, destination, purpose, name } = body
    if (!type || !destination || !purpose) {
      return NextResponse.json({ error: 'Missing OTP send fields' }, { status: 400 })
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const token = createOtpToken({ destination, type, purpose, code, name })
    const res = type === 'email'
      ? await sendEmailOtp(destination, code, purpose)
      : await sendSmsOtp(destination, code, purpose)

    return NextResponse.json({ success: true, token, debugCode: res.debugCode })
  }

  if (action === 'verify') {
    const { token, code } = body
    if (!token || !code) {
      return NextResponse.json({ error: 'Missing OTP verification fields' }, { status: 400 })
    }

    try {
      const payload = verifyOtpToken(token)
      if (payload.code !== code) {
        return NextResponse.json({ error: 'OTP code does not match' }, { status: 400 })
      }
      return NextResponse.json({ success: true, payload })
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
