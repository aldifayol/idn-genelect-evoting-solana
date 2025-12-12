/**
 * Crypto utilities for e-voting
 * Uses Web Crypto API for browser-compatible cryptography
 */

/**
 * Generate SHA-256 hash of data (async, uses Web Crypto API)
 * Returns a Uint8Array of 32 bytes
 */
export async function sha256(data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  return new Uint8Array(hashBuffer)
}

/**
 * Generate SHA-256 hash of NIK (National Identity Number)
 * Used for voter identity verification on-chain
 */
export async function hashNIK(nik: string): Promise<Uint8Array> {
  if (nik.length !== 16) {
    throw new Error('NIK must be exactly 16 digits')
  }
  if (!/^\d+$/.test(nik)) {
    throw new Error('NIK must contain only digits')
  }
  return sha256(nik)
}

/**
 * Generate biometric hash from combined biometric data
 * In production, this would combine retina, face, and fingerprint data
 */
export async function hashBiometricData(
  retinaData?: string,
  faceData?: string,
  fingerprintData?: string
): Promise<Uint8Array> {
  // Combine all biometric data with delimiters
  const combined = [retinaData || '', faceData || '', fingerprintData || ''].join('|biometric|')
  return sha256(combined)
}

/**
 * Generate a verification code for voter registration
 * Creates a random alphanumeric string
 */
export function generateVerificationCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  return Array.from(randomValues)
    .map((v) => chars[v % chars.length])
    .join('')
}

/**
 * Generate encrypted vote data
 * In production, this would use proper encryption
 */
export async function encryptVoteData(
  candidateId: number,
  voterPubkey: string,
  timestamp: number
): Promise<Uint8Array> {
  const data = `vote_${candidateId}_${voterPubkey}_${timestamp}`
  return sha256(data)
}

/**
 * Convert Uint8Array to hex string
 */
export function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to Uint8Array
 */
export function fromHexString(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g)
  if (!matches) return new Uint8Array()
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)))
}
