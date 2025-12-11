# Program Derived Addresses (PDA)

## Overview

PDA stands for **Program Derived Address**. Think of it as a **deterministic** address that's created using a mathematical formula, not a private key.

---

## Table of Contents
1. [What is a PDA?](#what-is-a-pda)
2. [The Key Difference](#the-key-difference)
3. [How PDAs Work](#how-pdas-work)
4. [Why PDAs are Revolutionary](#why-pdas-are-revolutionary)
5. [PDAs in Our E-Voting System](#pdas-in-our-e-voting-system)
6. [PDA Properties](#pda-properties)
7. [Common PDA Patterns](#common-pda-patterns)
8. [PDA Pitfalls to Avoid](#pda-pitfalls-to-avoid)

---

## What is a PDA?

PDA stands for **Program Derived Address**. Think of it as a **deterministic** address that's created using a mathematical formula, not a private key.

---

## The Key Difference

### Regular Address (Keypair)

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

### PDA (Deterministic)

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

---

## How PDAs Work

### The Formula

```rust
PDA = hash(
    program_id +        // Your program's ID
    seeds +             // Your chosen seeds (like "election", "voter123")
    bump               // Special byte to make it valid
)
```

### Visual Example

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

---

## Why PDAs are Revolutionary

### Traditional Approach (Pre-PDA)

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

### PDA Approach

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

---

## PDAs in Our E-Voting System

### 1. Election Account PDA

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

### 2. Voter Credential PDA

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

### 3. Ballot PDA

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

---

## PDA Use Cases

### 1. Data Organization

```
Election "Indonesia2024":
├─ PDA("election", "Indonesia2024") → Election data
├─ PDA("candidate", election, 1) → Candidate 1
├─ PDA("candidate", election, 2) → Candidate 2
├─ PDA("voter", election, voter1) → Voter 1 credential
└─ PDA("voter", election, voter2) → Voter 2 credential

All organized hierarchically!
```

### 2. Access Control

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

### 3. State Isolation

```
Different Elections = Different PDAs:
├─ PDA("election", "2024") → Separate state
├─ PDA("election", "2029") → Separate state
└─ PDA("election", "2034") → Separate state

Can't interfere with each other!
```

---

## PDA Properties

### 1. Deterministic

```
Same Seeds → Always Same PDA
seeds("voter", election1, alice) = "Addr_xyz..."
seeds("voter", election1, alice) = "Addr_xyz..." (same!)
```

### 2. Unique

```
Different Seeds → Different PDA
seeds("voter", election1, alice) = "Addr_xyz..."
seeds("voter", election1, bob)   = "Addr_abc..." (different!)
seeds("voter", election2, alice) = "Addr_def..." (different!)
```

### 3. No Private Key

```
Regular Account:
Private Key → Public Key
Need private key to sign ✍️

PDA:
Program ID + Seeds → PDA
Program can "sign" for PDA (Cross-Program Invocation)
```

---

## PDA vs Regular Accounts

| Feature | Regular Account | PDA |
|---------|----------------|-----|
| **Created By** | Keypair generation | Deterministic derivation |
| **Private Key** | Yes | No (program owns it) |
| **Signing** | Owner signs with key | Program signs via CPI |
| **Finding** | Store address | Re-derive from seeds |
| **Cost** | Same | Same |
| **Security** | Key management | Seed design |

---

## PDA Implementation Example

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

---

## Common PDA Patterns

### Pattern 1: Single Instance

```rust
// Global config (one per program)
seeds = [b"config"]
```

### Pattern 2: Per User

```rust
// User profile (one per user)
seeds = [b"profile", user.key()]
```

### Pattern 3: Per User Per Resource

```rust
// User's item in a specific collection
seeds = [b"item", collection.key(), user.key(), item_id]
```

### Pattern 4: Sequential

```rust
// Sequential records
seeds = [b"record", &index.to_le_bytes()]
```

---

## PDA Benefits Summary

✅ **No Key Management**: Don't need to store private keys
✅ **Deterministic**: Always know where data is
✅ **Organized**: Hierarchical structure
✅ **Secure**: Program controls access
✅ **Scalable**: Can create unlimited PDAs
✅ **Predictable**: Can calculate address before creation

---

## PDA Pitfalls to Avoid

### Pitfall 1: Don't Use Sensitive Data as Seeds

Seeds are public!

```rust
// ❌ BAD: Password visible in seeds
seeds = [b"user", password.as_bytes()]

// ✅ GOOD: Use hash of password
seeds = [b"user", &hash(password)]
```

### Pitfall 2: Don't Make Seeds Too Complex

Keep it simple:

```rust
// ❌ BAD: Too many seeds
seeds = [a, b, c, d, e, f, g, h]

// ✅ GOOD: Combine or use hash
seeds = [b"data", &hash([a,b,c,d,e,f,g,h])]
```

### Pitfall 3: Don't Forget to Store the Bump

Need it for later:

```rust
#[account]
pub struct MyAccount {
    pub bump: u8,  // ✅ Store this!
    // ... other fields
}
```

---

## Advanced: Understanding the Bump

### What is the Bump?

The bump is a number (0-255) that ensures the PDA is NOT on the Ed25519 curve (has no private key).

```rust
// Solana tries bumps starting from 255
for bump in (0..=255).rev() {
    let potential_pda = hash(program_id + seeds + bump);
    if is_off_curve(potential_pda) {
        return (potential_pda, bump);  // Found it!
    }
}
```

### Why Do We Need It?

```
Regular Public Key:
- Has corresponding private key
- Someone could sign for it

PDA (off-curve):
- No private key exists
- Only program can "sign" via CPI
```

### Canonical Bump

The first valid bump (starting from 255) is called the "canonical bump":

```rust
// Anchor always finds canonical bump
#[account(
    seeds = [...],
    bump  // Finds and uses canonical bump
)]

// Store it for later use
my_account.bump = bump;
```

---

## Frontend Integration

### Deriving PDAs from Frontend

```typescript
import { PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';

// Find election PDA
const [electionPda, electionBump] = PublicKey.findProgramAddressSync(
    [
        Buffer.from("election"),
        Buffer.from("Indonesia2024"),
    ],
    program.programId
);

console.log("Election PDA:", electionPda.toString());

// Find voter credential PDA
const [voterCredentialPda, voterBump] = PublicKey.findProgramAddressSync(
    [
        Buffer.from("voter_credential"),
        electionPda.toBuffer(),
        voter.publicKey.toBuffer(),
    ],
    program.programId
);

console.log("Voter Credential PDA:", voterCredentialPda.toString());
```

### Using PDAs in Transactions

```typescript
// Call verify_voter with derived PDA
await program.methods
    .verifyVoter(
        voterNik,
        biometricHash,
        ipfsHash,
        timestamp,
        aiScore
    )
    .accounts({
        voter: voter.publicKey,
        election: electionPda,  // ← Derived PDA
        voterCredential: voterCredentialPda,  // ← Derived PDA
        // ... other accounts
    })
    .rpc();
```

---

## Debugging PDAs

### Common Issues

#### Issue 1: Seeds Don't Match

```
Error: "seeds constraint violated"

Cause: Provided seeds don't match stored bump

Solution: Double-check seed order and values
```

#### Issue 2: Bump Not Stored

```
Error: Can't find account later

Cause: Forgot to store bump in account

Solution: Always store bump field
```

#### Issue 3: Wrong Program ID

```
Error: PDA doesn't match expected

Cause: Using wrong program ID to derive

Solution: Verify program ID matches deployed program
```

### Debugging Tips

```rust
// Log PDA details
msg!("Expected PDA: {}", expected_pda);
msg!("Provided PDA: {}", ctx.accounts.my_pda.key());
msg!("Bump: {}", my_account.bump);

// Verify PDA
let (derived_pda, bump) = Pubkey::find_program_address(
    &seeds,
    ctx.program_id,
);
require!(
    derived_pda == ctx.accounts.my_pda.key(),
    ErrorCode::InvalidPDA
);
```

---

## Summary

### PDA Advantages
✅ **Deterministic**: Always know where to find data
✅ **Secure**: No private keys to steal
✅ **Organized**: Hierarchical data structure
✅ **Efficient**: No need to store addresses

### In Our E-Voting System
- **Election Account**: PDA("election", name)
- **Candidates**: PDA("candidate", election, id)
- **Voter Credentials**: PDA("voter_credential", election, voter)
- **Ballots**: PDA("ballot", election, sequence)

### Key Takeaway
PDAs transform address generation from "random with keys to manage" to "deterministic and secure" - essential for organized, secure blockchain applications.

---

## Further Reading

- [Solana PDA Documentation](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)
- [Anchor PDA Guide](https://www.anchor-lang.com/docs/pdas)
- [Understanding PDAs](https://solanacookbook.com/core-concepts/pdas.html)

---

**Last Updated**: December 11, 2025
