# Multi-Signature (Multi-Sig)

## Overview

Multi-signature (multi-sig) is like requiring **multiple keys to open a safe**. Instead of one person having full control, several people must agree before an action happens.

---

## Table of Contents
1. [What is Multi-Sig?](#what-is-multi-sig)
2. [The Analogy](#the-analogy)
3. [How Multi-Sig Works](#how-multi-sig-works)
4. [Implementation in Our E-Voting](#implementation-in-our-e-voting)
5. [Real-World Multi-Sig Scenarios](#real-world-multi-sig-scenarios)
6. [Multi-Sig Tools for Solana](#multi-sig-tools-for-solana)

---

## What is Multi-Sig?

Multi-signature (multi-sig) is like requiring **multiple keys to open a safe**. Instead of one person having full control, several people must agree before an action happens.

---

## The Analogy

### Traditional Single Signature

```
Bank Vault with ONE key:
┌─────────────┐
│   🔐 CEO    │ ← Only CEO can open
│  (1 key)    │
└─────────────┘
❌ If CEO goes rogue: Problem!
❌ If key is lost: Problem!
```

### Multi-Signature (2-of-3)

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

---

## How Multi-Sig Works

### Configuration Example (2-of-3)

```
Election Commission Setup:
├─ Commissioner A (Public Key: AAA...)
├─ Commissioner B (Public Key: BBB...)
└─ Commissioner C (Public Key: CCC...)

Rule: ANY 2 of these 3 must sign to take action
```

### Transaction Flow

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

---

## Implementation in Our E-Voting

### Setup Multi-Sig Election

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

### Protected Operations

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

---

## Real-World Multi-Sig Scenarios

### Scenario 1: Starting an Election

```
5 Commissioners, need 3 signatures:

Commissioner 1: "Start election" ✅ (1/3)
Commissioner 2: "I agree" ✅ (2/3)
Commissioner 3: "I agree" ✅ (3/3) ← Executes!

Result: Election starts automatically
```

### Scenario 2: Preventing Fraud

```
3 Commissioners, need 2 signatures:

Bad Commissioner: "Give myself 1000 votes" ✅ (1/2)
Honest Commissioner: ❌ "I refuse to sign"
Honest Commissioner: ❌ "I refuse to sign"

Result: ❌ Transaction fails (threshold not met)
```

---

## Multi-Sig vs Single Authority

| Aspect | Single Authority | Multi-Sig |
|--------|-----------------|-----------|
| **Security** | Low (single point) | High (distributed) |
| **Speed** | Fast | Slower (need coordination) |
| **Fraud Risk** | High | Low |
| **Key Loss** | Critical problem | Can continue with remaining keys |
| **Use Case** | Personal accounts | Organizations, governance |

---

## Types of Multi-Sig Configurations

### M-of-N Configurations

```
1-of-1: Traditional (no multi-sig)
2-of-2: Both must agree (no flexibility)
2-of-3: 2 out of 3 (recommended for small teams)
3-of-5: 3 out of 5 (recommended for larger teams)
5-of-9: 5 out of 9 (for large organizations)
```

### Election Commission Example

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

---

## Multi-Sig Tools for Solana

### 1. Squads Protocol (Recommended)

**What**: Most popular multi-sig solution on Solana
**Features**:
- Web-based interface
- Transaction proposals and voting
- Audit trail
- Battle-tested with billions in TVL

**Usage**:
```typescript
// Create Squads multi-sig
const squad = await squads.create({
    threshold: 2,
    members: [
        commissionerA.publicKey,
        commissionerB.publicKey,
        commissionerC.publicKey,
    ],
});

// Propose transaction
const proposal = await squad.propose({
    instruction: activateElectionIx,
});

// Vote on proposal
await squad.vote(proposal, true);
await squad.vote(proposal, true); // 2nd vote → executes!
```

### 2. Goki Smart Wallet

**What**: Smart wallet with multi-sig capabilities
**Features**:
- Programmable permissions
- Time-locked transactions
- Delegate permissions

### 3. Custom Implementation

**What**: Build your own multi-sig logic
**When**: Need custom business logic
**Complexity**: Advanced

---

## Implementation Pattern

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

## Production Setup with Squads

### Step 1: Create Squads Wallet

```bash
# Visit https://squads.so
# Connect wallet
# Create new Squad
# Add commissioner addresses
# Set threshold (e.g., 7 of 10)
```

### Step 2: Transfer Election Authority

```rust
// Initialize election with Squads address as authority
await program.methods
    .initializeElection(
        "Indonesia2024",
        startTime,
        endTime,
        [], // Empty - Squads manages this
        0   // Not used - Squads manages threshold
    )
    .accounts({
        authority: squadsWallet.publicKey, // 👈 Squads address
        // ... other accounts
    })
    .rpc();
```

### Step 3: Propose Actions via Squads

```typescript
// Create proposal to activate election
const activateIx = await program.methods
    .activateElection()
    .accounts({
        commissioner: squadsWallet.publicKey,
        election: electionPda,
    })
    .instruction();

// Submit to Squads for multi-sig
await squads.propose({
    instructions: [activateIx],
    title: "Activate Indonesia 2024 Election",
});
```

### Step 4: Commissioners Vote

```
Commissioner 1: ✅ Approves via Squads UI
Commissioner 2: ✅ Approves via Squads UI
Commissioner 3: ✅ Approves via Squads UI
...
Commissioner 7: ✅ Approves (threshold met!)

→ Transaction executes automatically
```

---

## Security Best Practices

### 1. Choose Appropriate Threshold

```
❌ Too Low (2-of-10):
- Easy to compromise
- Only 2 malicious actors needed

✅ Balanced (7-of-10):
- Strong security
- Can operate with 3 absent

❌ Too High (10-of-10):
- Can't operate if 1 unavailable
- No fault tolerance
```

### 2. Distribute Commissioner Keys

```
✅ Good Distribution:
- Different physical locations
- Different people
- Different security practices
- Geographic diversity

❌ Bad Distribution:
- All in same office
- Same person holds multiple keys
- Keys stored together
```

### 3. Regular Key Rotation

```rust
// Allow updating commissioners
pub fn update_commissioners(
    ctx: Context<UpdateCommissioners>,
    new_commissioners: Vec<Pubkey>,
) -> Result<()> {
    // Only executable via multi-sig
    let election = &mut ctx.accounts.election;
    election.commissioners = new_commissioners;
    Ok(())
}
```

### 4. Audit Trail

```rust
// Log all multi-sig actions
#[event]
pub struct MultiSigAction {
    pub action: String,
    pub signer: Pubkey,
    pub timestamp: i64,
    pub threshold_met: bool,
}

emit!(MultiSigAction {
    action: "activate_election".to_string(),
    signer: ctx.accounts.commissioner.key(),
    timestamp: Clock::get()?.unix_timestamp,
    threshold_met: true,
});
```

---

## Common Pitfalls

### Pitfall 1: Single Point of Failure

```
❌ Problem:
- 1 person holds multiple keys
- If compromised, threshold easily met

✅ Solution:
- Each key held by different person
- Hardware wallet for each key
```

### Pitfall 2: No Backup Plan

```
❌ Problem:
- Threshold too high (e.g., 10-of-10)
- If 1 key lost, system locked forever

✅ Solution:
- Set threshold to 70-80%
- Maintain key recovery procedures
```

### Pitfall 3: Poor Coordination

```
❌ Problem:
- Commissioners don't check proposals
- Transactions stuck waiting for signatures

✅ Solution:
- Use Squads notifications
- Set up Discord/Telegram alerts
- Regular commissioner meetings
```

---

## Testing Multi-Sig

### Unit Test Example

```typescript
it("Requires multiple commissioners to activate", async () => {
    // Initialize with 3 commissioners, need 2 signatures
    await program.methods
        .initializeElection(
            "TestElection",
            startTime,
            endTime,
            [commA.publicKey, commB.publicKey, commC.publicKey],
            2 // threshold
        )
        .rpc();

    // Try with only 1 signature - should fail
    try {
        await program.methods
            .activateElection()
            .accounts({
                commissioner: commA.publicKey,
                election: electionPda,
            })
            .signers([commA])
            .rpc();
        assert.fail("Should have required 2 signatures");
    } catch (error) {
        // Expected to fail
    }

    // With proper multi-sig (2 signatures) - should succeed
    // (In practice, use Squads for this)
});
```

---

## Summary

### Multi-Sig Benefits
✅ **Security**: Prevents single point of failure
✅ **Fraud Prevention**: Requires collusion, not just one bad actor
✅ **Key Backup**: Can lose keys without losing access
✅ **Transparency**: All signers see and approve actions

### In Our E-Voting System
- **Election Setup**: Multi-sig controls initialization
- **Activation**: Requires commissioner consensus
- **Finalization**: Multiple commissioners must agree
- **Emergency Actions**: Protected by multi-sig

### Key Takeaway
Multi-sig transforms critical operations from "one person decides" to "group consensus required" - essential for democratic elections.

---

## Further Reading

- [Squads Protocol](https://squads.so)
- [Goki Smart Wallet](https://goki.so)
- [Solana Multi-Sig Guide](https://docs.solana.com/developing/programming-model/accounts#multisig)

---

**Last Updated**: December 11, 2025
