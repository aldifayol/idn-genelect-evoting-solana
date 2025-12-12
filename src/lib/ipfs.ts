/**
 * IPFS utilities for photo upload and retrieval
 * Uses Pinata as the IPFS pinning service
 */

const PINATA_API_URL = 'https://api.pinata.cloud'
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'

interface PinataUploadResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

/**
 * Upload a file to IPFS via Pinata
 * Returns the IPFS hash (CID)
 */
export async function uploadToIPFS(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
  const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY

  if (!apiKey || !secretKey) {
    throw new Error('Pinata API keys not configured')
  }

  const formData = new FormData()
  formData.append('file', file)

  // Add metadata
  const metadata = JSON.stringify({
    name: `voter_photo_${Date.now()}`,
    keyvalues: {
      type: 'voter_verification',
      timestamp: new Date().toISOString(),
    },
  })
  formData.append('pinataMetadata', metadata)

  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload to IPFS: ${error}`)
  }

  const result: PinataUploadResponse = await response.json()
  return result.IpfsHash
}

/**
 * Upload JSON data to IPFS
 * Useful for metadata or structured data
 */
export async function uploadJSONToIPFS(data: object): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
  const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY

  if (!apiKey || !secretKey) {
    throw new Error('Pinata API keys not configured')
  }

  const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: JSON.stringify({
      pinataContent: data,
      pinataMetadata: {
        name: `evoting_data_${Date.now()}`,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload JSON to IPFS: ${error}`)
  }

  const result: PinataUploadResponse = await response.json()
  return result.IpfsHash
}

/**
 * Get the full IPFS URL for a given hash
 */
export function getIPFSUrl(hash: string): string {
  if (!hash) return ''
  // Handle both raw hashes and full URLs
  if (hash.startsWith('http')) return hash
  if (hash.startsWith('ipfs://')) return `${PINATA_GATEWAY}${hash.slice(7)}`
  return `${PINATA_GATEWAY}${hash}`
}

/**
 * Fetch content from IPFS
 */
export async function fetchFromIPFS<T = unknown>(hash: string): Promise<T> {
  const url = getIPFSUrl(hash)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Validate IPFS hash format
 * CIDv0 starts with "Qm" and is 46 characters
 * CIDv1 starts with "b" and varies in length
 */
export function isValidIPFSHash(hash: string): boolean {
  if (!hash) return false
  // CIDv0
  if (hash.startsWith('Qm') && hash.length === 46) return true
  // CIDv1 (base32)
  if (hash.startsWith('b') && hash.length >= 50) return true
  return false
}

/**
 * Placeholder IPFS hash for testing/development
 * Use this when Pinata is not configured
 */
export const PLACEHOLDER_IPFS_HASH = 'QmPlaceholderHash000000000000000000000000'

/**
 * Upload with fallback to placeholder (for development)
 */
export async function uploadToIPFSWithFallback(file: File): Promise<string> {
  try {
    return await uploadToIPFS(file)
  } catch (error) {
    console.warn('IPFS upload failed, using placeholder:', error)
    return PLACEHOLDER_IPFS_HASH
  }
}
