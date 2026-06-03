import crypto from 'crypto'

const SECRET = process.env.OTP_SECRET || 'change-this-secret'
const EXPIRATION_MS = 1000 * 60 * 10 // 10 minutes

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url')
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

export function createOtpToken(payload) {
  const data = {
    ...payload,
    exp: Date.now() + EXPIRATION_MS,
  }
  const serialized = JSON.stringify(data)
  const signature = crypto.createHmac('sha256', SECRET).update(serialized).digest('base64url')
  return `${base64UrlEncode(serialized)}.${signature}`
}

export function verifyOtpToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    throw new Error('Invalid OTP token')
  }

  const [serializedB64, signature] = token.split('.')
  const serialized = base64UrlDecode(serializedB64)
  const expected = crypto.createHmac('sha256', SECRET).update(serialized).digest('base64url')

  if (signature !== expected) {
    throw new Error('Invalid OTP signature')
  }

  const payload = JSON.parse(serialized)
  if (payload.exp < Date.now()) {
    throw new Error('OTP code expired')
  }

  return payload
}
