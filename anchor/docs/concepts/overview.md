# Technical Concepts Explained

## Overview
This document provides clear explanations of key technical concepts used in the e-voting smart contract project. Each concept is explained from basics to implementation details.

---

## Table of Contents
1. [IPFS (InterPlanetary File System)](#ipfs-interplanetary-file-system)
2. [Multi-Signature (Multi-Sig)](#multi-signature-multi-sig)
3. [PDA (Program Derived Addresses)](#pda-program-derived-addresses)

---

## IPFS (InterPlanetary File System)

### What is IPFS?

IPFS is a **distributed file storage system** that works like a decentralized Google Drive. Instead of storing files on one central server, IPFS spreads them across many computers around the world.

### Key Concepts

#### 1. Content Addressing
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

#### 2. How It Works

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

#### 3. Content Permanence
- **Same Content = Same Hash**: If you upload the same file twice, you get the same hash
- **Different Content = Different Hash**: Change one pixel, get a completely new hash
- **No Central Point of Failure**: File exists as long as someone hosts it

### Why Use IPFS for E-Voting?

#### Problem Without IPFS
```
Traditional Server Storage:
❌ Single point of failure
❌ Can be tampered with
❌ Expensive to scale
❌ Trust the server operator
```

#### Solution With IPFS
```
IPFS Storage:
✅ Distributed (no single failure point)
✅ Content-verified (hash proves authenticity)
✅ Cost-effective (shared storage)
✅ Trustless (math proves integrity)
```

### Implementation in Our E-Voting System

#### Step-by-Step Process

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

### IPFS vs Blockchain Storage

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

### Popular IPFS Services

1. **Pinata** - Easy-to-use IPFS service
2. **NFT.Storage** - Free for NFT projects
3. **Infura IPFS** - Reliable commercial service
4. **Self-hosted** - Run your own IPFS node

---

## Multi-Signature (Multi-Sig)

### What is Multi-Sig?

Multi-signature (multi-sig) is like requiring **multiple keys to open a safe**. Instead of one person having full control, several people must agree before an action happens.

### The Analogy

#### Traditional Single Signature
```
Bank Vault with ONE key:
┌─────────────┐
│   🔐 CEO    │ ← Only CEO can open
│  (1 key)    │
└─────────────┘
❌ If CEO goes rogue: Problem!
❌ If key is lost: Problem!
```

#### Multi-Signature (2-of-3)
```
Bank Vault with MULTIPLE keys:
┌─────────────┐
│ 🔐 CEO      │ ← Need ANY 2
│ 🔐 CFO      │    of these 3
│ 🔐 Director │    to open
└─────────────┘
✅ Protection from single bad actor
✅ Backup if one key is lost
```

### How Multi-Sig Works

#### Configuration Example (2-of-3)
```
Election Commission Setup:
├─ Commissioner A (Public Key: AAA...)
├─ Commissioner B (Public Key: BBB...)
└─ Commissioner C (Public Key: CCC...)

Rule: ANY 2 of these 3 must sign to take action
```

#### Transaction Flow

**1. Proposal**
```
Commissioner A: "Let's start the election"
└─> Creates transaction proposal
```

**2. Signing**
```
Commissioner A: ✅ Signs (1/2 needed)
Commissioner B: ✅ Signs (2/2 needed) ← Threshold met!
Commissioner C: (optional, not needed)
```

**3. Execution**
```
✅ Transaction executes automatically
   (start_election() runs on blockchain)
```

### Implementation in Our E-Voting

#### Setup Multi-Sig Election
```rust
pub fn initialize_election(
    election_name: String,
    commissioners: Vec<Pubkey>,    // [AAA..., BBB..., CCC...]
    required_signatures: u8,        // 2 (out of 3)
) -> Result<()> {
    require!(
        commissioners.len() >= required_signatures,
        ErrorCode::InvalidCommissionerCount
    );
    // Store in election account
}
```

#### Protected Operations

**❌ Without Multi-Sig**:
```rust
pub fn activate_election(ctx: Context<Activate>) -> Result<()> {
    // Anyone with authority can activate
    election.is_active = true;  // Dangerous!
}
```

**✅ With Multi-Sig**:
```rust
pub fn activate_election(ctx: Context<ManageElection>) -> Result<()> {
    // Must be signed by commissioner
    let election = &ctx.accounts.election;

    // Verify signer is a commissioner
    require!(
        election.commissioners.contains(&ctx.accounts.commissioner.key()),
        ErrorCode::Unauthorized
    );

    // In practice, you'd use Squads or similar for multi-sig coordination
    election.is_active = true;
}
```

### Real-World Multi-Sig Scenarios

#### Scenario 1: Starting an Election
```
5 Commissioners, need 3 signatures:

Commissioner 1: "Start election" ✅ (1/3)
Commissioner 2: "I agree" ✅ (2/3)
Commissioner 3: "I agree" ✅ (3/3) ← Executes!

Result: Election starts automatically
```

#### Scenario 2: Preventing Fraud
```
3 Commissioners, need 2 signatures:

Bad Commissioner: "Give myself 1000 votes" ✅ (1/2)
Honest Commissioner: ❌ "I refuse to sign"
Honest Commissioner: ❌ "I refuse to sign"

Result: ❌ Transaction fails (threshold not met)
```

### Multi-Sig vs Single Authority

| Aspect | Single Authority | Multi-Sig |
|--------|-----------------|-----------|
| **Security** | Low (single point) | High (distributed) |
| **Speed** | Fast | Slower (need coordination) |
| **Fraud Risk** | High | Low |
| **Key Loss** | Critical problem | Can continue with remaining keys |
| **Use Case** | Personal accounts | Organizations, governance |

### Types of Multi-Sig Configurations

#### M-of-N Configurations
```
1-of-1: Traditional (no multi-sig)
2-of-2: Both must agree (no flexibility)
2-of-3: 2 out of 3 (recommended for small teams)
3-of-5: 3 out of 5 (recommended for larger teams)
5-of-9: 5 out of 9 (for large organizations)
```

#### Election Commission Example
```
Indonesia Election Commission:
- 10 Commissioners total
- Require 7 signatures (70% threshold)
- Configuration: 7-of-10 multi-sig

Benefits:
✅ Prevents single commissioner fraud
✅ Can operate if 3 commissioners unavailable
✅ Requires strong consensus (70%)
```

### Multi-Sig Tools for Solana

1. **Squads Protocol** - Popular Solana multi-sig
2. **Goki** - Smart wallet with multi-sig
3. **Custom Implementation** - Build your own (advanced)

### Implementation Pattern

```rust
// Store multi-sig config
pub struct Election {
    pub commissioners: Vec<Pubkey>,
    pub required_signatures: u8,
    pub pending_signatures: Vec<Pubkey>,  // Who has signed
}

// Check if threshold met
fn verify_multi_sig(
    election: &Election,
    signer: &Pubkey,
) -> Result<bool> {
    // 1. Check if signer is a commissioner
    if !election.commissioners.contains(signer) {
        return Err(ErrorCode::Unauthorized);
    }

    // 2. Add signature
    election.pending_signatures.push(*signer);

    // 3. Check if threshold met
    if election.pending_signatures.len() >= election.required_signatures {
        return Ok(true);  // Can execute!
    }

    Ok(false)  // Need more signatures
}
```

---

## PDA (Program Derived Addresses)

### What is a PDA?

PDA stands for **Program Derived Address**. Think of it as a **deterministic** address that's created using a mathematical formula, not a private key.

### The Key Difference

#### Regular Address (Keypair)
```
┌──────────────┐
│ Private Key  │ ← You generate randomly
└──────┬───────┘
       │
       ├─> Math magic
       │
┌──────▼───────┐
│ Public Key   │ ← Your address
└──────────────┘

Problem: Need to store private key somewhere
```

#### PDA (Deterministic)
```
┌──────────────┐
│ Program ID   │ ← Fixed
│ + Seeds      │ ← Predictable inputs
└──────┬───────┘
       │
       ├─> Math magic
       │
┌──────▼───────┐
│ PDA Address  │ ← Deterministic result
└──────────────┘

Benefit: No private key needed! Can always recreate
```

### How PDAs Work

#### The Formula
```rust
PDA = hash(
    program_id +        // Your program's ID
    seeds +             // Your chosen seeds (like "election", "voter123")
    bump               // Special byte to make it valid
)
```

#### Visual Example

**Creating an Election PDA**:
```
Input Seeds:
├─ Program ID: "YourProgramID123..."
├─ String seed: "election"
├─ String seed: "Indonesia2024"
└─ Bump: 255

↓ Hash Function

Output PDA: "A1b2C3d4E5..." (deterministic)
```

**Every time you use these same seeds → Same PDA!**

### Why PDAs are Revolutionary

#### Traditional Approach (Pre-PDA)
```
Problem: How to store voter data for "voter123"?

Bad Solution:
1. Generate random keypair for voter storage
2. Store the keypair somewhere
3. Hope you don't lose it ❌

Issues:
❌ Need to store keypair
❌ Can lose access
❌ Hard to find later
```

#### PDA Approach
```
Solution: Derive address from voter ID!

Good Solution:
1. PDA = derive("voter_data", "voter123")
2. Always get same address
3. No storage needed! ✅

Benefits:
✅ No keypairs to store
✅ Can't lose access
✅ Easy to find (just derive again)
```

### PDAs in Our E-Voting System

#### 1. Election Account PDA
```rust
// Create election PDA
seeds = [
    b"election",                    // Literal "election"
    election_name.as_bytes(),       // "Indonesia2024"
]

// Solana will find the right bump automatically
let (election_pda, bump) = Pubkey::find_program_address(
    &seeds,
    &program_id,
);

// Result: Same PDA every time for "Indonesia2024" election!
```

**Benefit**: Can always find the election account using just its name.

#### 2. Voter Credential PDA
```rust
// Create voter credential PDA
seeds = [
    b"voter_credential",            // Type identifier
    election.key().as_ref(),        // Which election
    voter.key().as_ref(),           // Which voter
]

// Result: Unique PDA for each voter in each election
```

**Benefit**: Given a voter and election, can instantly find their credential.

#### 3. Ballot PDA
```rust
// Create ballot PDA
seeds = [
    b"ballot",                      // Type identifier
    election.key().as_ref(),        // Which election
    &ballot_number.to_le_bytes(),   // Ballot sequence
]

// Result: Sequential ballot addresses
```

**Benefit**: Can iterate through all ballots in order for counting.

### PDA Use Cases

#### 1. Data Organization
```
Election "Indonesia2024":
├─ PDA("election", "Indonesia2024") → Election data
├─ PDA("candidate", election, 1) → Candidate 1
├─ PDA("candidate", election, 2) → Candidate 2
├─ PDA("voter", election, voter1) → Voter 1 credential
└─ PDA("voter", election, voter2) → Voter 2 credential

All organized hierarchically!
```

#### 2. Access Control
```rust
#[account(
    mut,
    seeds = [b"voter_credential", election.key(), voter.key()],
    bump = voter_credential.bump,
    has_one = election  // Must belong to this election
)]
pub voter_credential: Account<'info, VoterCredential>,
```

**Security**: Only the correct voter can access their credential PDA.

#### 3. State Isolation
```
Different Elections = Different PDAs:
├─ PDA("election", "2024") → Separate state
├─ PDA("election", "2029") → Separate state
└─ PDA("election", "2034") → Separate state

Can't interfere with each other!
```

### PDA Properties

#### 1. Deterministic
```
Same Seeds → Always Same PDA
seeds("voter", election1, alice) = "Addr_xyz..."
seeds("voter", election1, alice) = "Addr_xyz..." (same!)
```

#### 2. Unique
```
Different Seeds → Different PDA
seeds("voter", election1, alice) = "Addr_xyz..."
seeds("voter", election1, bob)   = "Addr_abc..." (different!)
seeds("voter", election2, alice) = "Addr_def..." (different!)
```

#### 3. No Private Key
```
Regular Account:
Private Key → Public Key
Need private key to sign ✍️

PDA:
Program ID + Seeds → PDA
Program can "sign" for PDA (Cross-Program Invocation)
```

### PDA vs Regular Accounts

| Feature | Regular Account | PDA |
|---------|----------------|-----|
| **Created By** | Keypair generation | Deterministic derivation |
| **Private Key** | Yes | No (program owns it) |
| **Signing** | Owner signs with key | Program signs via CPI |
| **Finding** | Store address | Re-derive from seeds |
| **Cost** | Same | Same |
| **Security** | Key management | Seed design |

### PDA Implementation Example

```rust
// 1. Define the seeds
#[derive(Accounts)]
pub struct CreateVoterCredential<'info> {
    #[account(
        init,
        payer = voter,
        space = 8 + VoterCredential::INIT_SPACE,
        seeds = [
            b"voter_credential",
            election.key().as_ref(),
            voter.key().as_ref()
        ],
        bump  // Anchor finds this automatically
    )]
    pub voter_credential: Account<'info, VoterCredential>,
}

// 2. Anchor automatically:
//    - Derives the PDA from seeds
//    - Finds the correct bump
//    - Creates the account at that PDA
//    - Stores the bump for later use

// 3. Later, to find the same account:
let seeds = [
    b"voter_credential",
    election_key,
    voter_key,
];
let (expected_pda, _bump) = Pubkey::find_program_address(
    &seeds,
    &program_id,
);
// expected_pda will match the original!
```

### Common PDA Patterns

#### Pattern 1: Single Instance
```rust
// Global config (one per program)
seeds = [b"config"]
```

#### Pattern 2: Per User
```rust
// User profile (one per user)
seeds = [b"profile", user.key()]
```

#### Pattern 3: Per User Per Resource
```rust
// User's item in a specific collection
seeds = [b"item", collection.key(), user.key(), item_id]
```

#### Pattern 4: Sequential
```rust
// Sequential records
seeds = [b"record", &index.to_le_bytes()]
```

### PDA Benefits Summary

✅ **No Key Management**: Don't need to store private keys
✅ **Deterministic**: Always know where data is
✅ **Organized**: Hierarchical structure
✅ **Secure**: Program controls access
✅ **Scalable**: Can create unlimited PDAs
✅ **Predictable**: Can calculate address before creation

### PDA Pitfalls to Avoid

❌ **Don't use sensitive data as seeds**: Seeds are public!
```rust
// BAD: Password visible in seeds
seeds = [b"user", password.as_bytes()]  // ❌

// GOOD: Use hash of password
seeds = [b"user", &hash(password)]  // ✅
```

❌ **Don't make seeds too complex**: Keep it simple
```rust
// BAD: Too many seeds
seeds = [a, b, c, d, e, f, g, h]  // ❌

// GOOD: Combine or use hash
seeds = [b"data", &hash([a,b,c,d,e,f,g,h])]  // ✅
```

❌ **Don't forget to store the bump**: Need it for later
```rust
#[account]
pub struct MyAccount {
    pub bump: u8,  // ✅ Store this!
    // ... other fields
}
```

---

## Summary

### IPFS
- **What**: Distributed file storage system
- **Why**: Cheap, fast, and verifiable storage for large files
- **Use**: Storing encrypted voter photos off-chain

### Multi-Sig
- **What**: Requiring multiple signatures for actions
- **Why**: Security and fraud prevention
- **Use**: Protecting critical election operations

### PDA
- **What**: Deterministically derived addresses
- **Why**: No private keys, easy to find, organized
- **Use**: All account addresses in the smart contract

---

## Need More Explanations?

This document will be updated with new concepts as you request them. Just ask about any term or concept you'd like explained!

**Last Updated**: December 11, 2025
