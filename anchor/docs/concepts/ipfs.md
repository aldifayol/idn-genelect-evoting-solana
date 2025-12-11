# IPFS (InterPlanetary File System)

## Overview

IPFS is a **distributed file storage system** that works like a decentralized Google Drive. Instead of storing files on one central server, IPFS spreads them across many computers around the world.

---

## Table of Contents
1. [What is IPFS?](#what-is-ipfs)
2. [Key Concepts](#key-concepts)
3. [Why Use IPFS for E-Voting?](#why-use-ipfs-for-e-voting)
4. [Implementation in Our E-Voting System](#implementation-in-our-e-voting-system)
5. [IPFS vs Blockchain Storage](#ipfs-vs-blockchain-storage)
6. [Popular IPFS Services](#popular-ipfs-services)

---

## What is IPFS?

IPFS is a **distributed file storage system** that works like a decentralized Google Drive. Instead of storing files on one central server, IPFS spreads them across many computers around the world.

---

## Key Concepts

### 1. Content Addressing

**Traditional Web (Location-based)**:
```
https://server.com/photos/voter123.jpg
↑ Tells you WHERE the file is
```

**IPFS (Content-based)**:
```
QmXx5h3D4kj9... (hash of the file content)
↑ Tells you WHAT the file is
```

### 2. How It Works

```
┌─────────────┐
│  Your File  │
│  (photo.jpg)│
└──────┬──────┘
       │
       ├─> Hash the content
       │
┌──────▼──────┐
│   Hash ID   │
│QmXx5h3D4... │ ← This is the IPFS address
└──────┬──────┘
       │
       ├─> Distribute to IPFS network
       │
┌──────▼──────────────────────┐
│  Multiple nodes store it    │
│  [Node1] [Node2] [Node3]... │
└─────────────────────────────┘
```

### 3. Content Permanence

- **Same Content = Same Hash**: If you upload the same file twice, you get the same hash
- **Different Content = Different Hash**: Change one pixel, get a completely new hash
- **No Central Point of Failure**: File exists as long as someone hosts it

---

## Why Use IPFS for E-Voting?

### Problem Without IPFS

```
Traditional Server Storage:
❌ Single point of failure
❌ Can be tampered with
❌ Expensive to scale
❌ Trust the server operator
```

### Solution With IPFS

```
IPFS Storage:
✅ Distributed (no single failure point)
✅ Content-verified (hash proves authenticity)
✅ Cost-effective (shared storage)
✅ Trustless (math proves integrity)
```

---

## Implementation in Our E-Voting System

### Step-by-Step Process

**1. Voter Takes Selfie**
```typescript
// Frontend captures photo
const photo = captureFromCamera();
const idCard = captureIdCard();
```

**2. Encrypt the Photo**
```typescript
// Encrypt before uploading (privacy!)
const encryptedPhoto = encrypt(photo, encryptionKey);
// Only election commission has decryption key
```

**3. Upload to IPFS**
```typescript
const ipfsHash = await ipfs.add(encryptedPhoto);
// Returns: "QmXx5h3D4kj9..."
```

**4. Store Hash on Blockchain**
```rust
pub struct VoterCredential {
    pub photo_ipfs_hash: String,  // Store only the hash
    // Actual photo is on IPFS, encrypted
}
```

**5. Later Verification**
```typescript
// Anyone can retrieve using hash
const encryptedPhoto = await ipfs.get("QmXx5h3D4kj9...");
// But only election commission can decrypt it
const originalPhoto = decrypt(encryptedPhoto, decryptionKey);
```

---

## IPFS vs Blockchain Storage

| Aspect | Blockchain | IPFS |
|--------|-----------|------|
| **Cost** | Very expensive | Very cheap |
| **Speed** | Slower | Faster |
| **Size Limit** | Small (KB) | Large (GB+) |
| **Best For** | Critical data, hashes | Files, media, documents |
| **Mutability** | Immutable | Immutable (by hash) |

### Real-World Example

**Storing Voter Photo**:

```
Option A: On Blockchain
- Photo size: 2 MB
- Cost: ~500 SOL (very expensive!)
- Speed: Very slow
- Privacy: Everyone can see it ❌

Option B: IPFS + Blockchain
- Photo on IPFS: ~0.001 SOL
- Hash on blockchain: ~0.00001 SOL
- Speed: Fast
- Privacy: Encrypted, only hash visible ✅
```

---

## Popular IPFS Services

1. **Pinata** - Easy-to-use IPFS service
   - Website: https://pinata.cloud
   - Best for: Quick integration
   - Pricing: Free tier available

2. **NFT.Storage** - Free for NFT projects
   - Website: https://nft.storage
   - Best for: NFT metadata and assets
   - Pricing: Free

3. **Infura IPFS** - Reliable commercial service
   - Website: https://infura.io
   - Best for: Production applications
   - Pricing: Paid plans

4. **Self-hosted** - Run your own IPFS node
   - Best for: Full control and privacy
   - Requires: Technical expertise

---

## Integration Example

### Using Pinata in Your E-Voting App

```typescript
import axios from 'axios';

// Configure Pinata
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

// Upload encrypted photo to IPFS
async function uploadToIPFS(encryptedPhoto: Buffer): Promise<string> {
    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

    const formData = new FormData();
    formData.append('file', encryptedPhoto);

    const response = await axios.post(url, formData, {
        headers: {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
    });

    // Returns IPFS hash: "QmXx5h3D4kj9..."
    return response.data.IpfsHash;
}

// Retrieve photo from IPFS
async function retrieveFromIPFS(ipfsHash: string): Promise<Buffer> {
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    const response = await axios.get(url, {
        responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
}
```

### Smart Contract Integration

```rust
// In verify_voter instruction
pub fn verify_voter(
    ctx: Context<VerifyVoter>,
    voter_nik: String,
    biometric_hash: [u8; 32],
    photo_ipfs_hash: String,  // 👈 IPFS hash from frontend
    verification_timestamp: i64,
    ai_confidence_score: u8,
) -> Result<()> {
    // Store only the IPFS hash on-chain
    let voter_credential = &mut ctx.accounts.voter_credential;
    voter_credential.photo_ipfs_hash = photo_ipfs_hash;

    // ... rest of verification logic

    Ok(())
}
```

---

## Security Best Practices

### 1. Always Encrypt Before Upload

```typescript
// ❌ BAD: Upload raw photo
const ipfsHash = await ipfs.add(rawPhoto);

// ✅ GOOD: Encrypt first
const encryptedPhoto = await encrypt(rawPhoto, commissionKey);
const ipfsHash = await ipfs.add(encryptedPhoto);
```

### 2. Validate IPFS Hash Format

```rust
// Check IPFS hash format
require!(
    photo_ipfs_hash.len() <= 100 && photo_ipfs_hash.starts_with("Qm"),
    ErrorCode::InvalidIPFSHash
);
```

### 3. Pin Important Files

```typescript
// Pin to ensure file stays available
await pinata.pinByHash(ipfsHash, {
    pinataMetadata: {
        name: `voter_${voterId}_photo`,
        keyvalues: {
            election: "Indonesia2024",
            type: "voter_credential"
        }
    }
});
```

### 4. Use Multiple Gateways

```typescript
// Fallback to multiple gateways for reliability
const gateways = [
    'https://gateway.pinata.cloud',
    'https://ipfs.io',
    'https://cloudflare-ipfs.com',
];

async function fetchFromIPFS(hash: string): Promise<Buffer> {
    for (const gateway of gateways) {
        try {
            const response = await fetch(`${gateway}/ipfs/${hash}`);
            if (response.ok) {
                return await response.arrayBuffer();
            }
        } catch (error) {
            continue; // Try next gateway
        }
    }
    throw new Error('Failed to fetch from all gateways');
}
```

---

## Troubleshooting

### Issue: File Not Found

**Problem**: Can't retrieve file from IPFS
**Solutions**:
1. Ensure file is pinned (not garbage collected)
2. Try multiple gateways
3. Wait for network propagation (can take minutes)

### Issue: Slow Retrieval

**Problem**: File takes too long to load
**Solutions**:
1. Use dedicated IPFS gateway (Pinata, Infura)
2. Pin file on multiple nodes
3. Use CDN in front of IPFS gateway

### Issue: Large Files

**Problem**: Files are too large for quick upload/download
**Solutions**:
1. Compress images before encryption
2. Use progressive loading
3. Consider video compression for video files

---

## Summary

### IPFS Advantages
✅ **Decentralized**: No single point of failure
✅ **Cost-effective**: Much cheaper than on-chain storage
✅ **Content-addressed**: Hash proves authenticity
✅ **Scalable**: Can store files of any size

### In Our E-Voting System
- **Voter Photos**: Encrypted and stored on IPFS
- **Biometric Data**: Encrypted and stored on IPFS
- **Only Hash On-Chain**: Blockchain stores IPFS hash only
- **Privacy Preserved**: Encryption ensures only authorized parties can decrypt

### Key Takeaway
IPFS + Blockchain = Best of both worlds:
- Blockchain for immutability and verification
- IPFS for cost-effective file storage

---

## Further Reading

- [IPFS Documentation](https://docs.ipfs.io/)
- [Pinata Cloud](https://docs.pinata.cloud/)
- [NFT.Storage](https://nft.storage/docs/)
- [IPFS Best Practices](https://docs.ipfs.io/how-to/best-practices-for-nft-data/)

---

**Last Updated**: December 11, 2025
