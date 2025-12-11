# Cross-Program Invocation (CPI)

## Overview

**Cross-Program Invocation (CPI)** is how one Solana program calls another program. Think of it as one smart contract asking another smart contract to do something on its behalf.

---

## Table of Contents
1. [What is CPI?](#what-is-cpi)
2. [Why Use CPI?](#why-use-cpi)
3. [How CPI Works](#how-cpi-works)
4. [CPI in Our E-Voting System](#cpi-in-our-e-voting-system)
5. [Regular CPI vs CPI with Signers](#regular-cpi-vs-cpi-with-signers)
6. [Common CPI Patterns](#common-cpi-patterns)
7. [CPI Security Considerations](#cpi-security-considerations)
8. [Troubleshooting CPI](#troubleshooting-cpi)

---

## What is CPI?

### The Simple Analogy

Imagine you're at a restaurant:

```
Without CPI (Do Everything Yourself):
You: Cook food, serve yourself, clean dishes
└─> You need to know how to do EVERYTHING ❌

With CPI (Call Specialists):
You: "Chef, please cook me a steak" → Chef cooks
You: "Waiter, please serve it" → Waiter serves
You: "Dishwasher, clean this" → Dishwasher cleans
└─> Each specialist does their job ✅
```

### In Blockchain Terms

```
Without CPI:
Your Program: Implements token logic from scratch
└─> Reinvent the wheel, prone to bugs ❌

With CPI:
Your Program: "SPL Token Program, mint a token for me"
└─> Use battle-tested code ✅
```

---

## Why Use CPI?

### 1. **Code Reusability**
```
❌ Without CPI:
Program A: Implements tokens (5000 lines)
Program B: Implements tokens (5000 lines)
Program C: Implements tokens (5000 lines)
Total: 15,000 lines of duplicate code

✅ With CPI:
SPL Token Program: Implements tokens (5000 lines)
Program A: Calls SPL Token (10 lines)
Program B: Calls SPL Token (10 lines)
Program C: Calls SPL Token (10 lines)
Total: 5,030 lines
```

### 2. **Security**
```
✅ SPL Token Program:
- Audited by multiple security firms
- Battle-tested with billions of dollars
- Maintained by Solana Labs

❌ Your custom token implementation:
- Might have undiscovered bugs
- Not audited
- Untested at scale
```

### 3. **Composability**
```
Your E-Voting Program can combine:
├─> SPL Token Program (for voting tokens)
├─> Metaplex Program (for NFT metadata)
├─> Oracle Program (for random verification)
└─> Governance Program (for proposals)

All working together through CPI!
```

---

## How CPI Works

### The Flow

```
┌─────────────────┐
│  Your Program   │
│   (E-Voting)    │
└────────┬────────┘
         │
         │ 1. Prepare CPI call
         │    - Target program
         │    - Instruction data
         │    - Accounts needed
         │
         ├─> 2. invoke() or invoke_signed()
         │
┌────────▼────────┐
│  Target Program │
│  (SPL Token)    │
└────────┬────────┘
         │
         │ 3. Executes instruction
         │
         ├─> 4. Returns result
         │
┌────────▼────────┐
│  Your Program   │
│  (continues)    │
└─────────────────┘
```

### The Code Structure

```rust
// Step 1: Define what you need from target program
let cpi_accounts = TargetInstruction {
    account1: ctx.accounts.account1.to_account_info(),
    account2: ctx.accounts.account2.to_account_info(),
    // ... more accounts
};

// Step 2: Get the program to call
let cpi_program = ctx.accounts.target_program.to_account_info();

// Step 3: Create CPI context
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

// Step 4: Call the instruction
target_program::instruction_name(cpi_ctx, args)?;
```

---

## CPI in Our E-Voting System

### Example 1: Minting Voting Tokens

When a voter gets verified, we mint them a voting token using CPI:

```rust
pub fn verify_voter(
    ctx: Context<VerifyVoter>,
    voter_nik: String,
    biometric_hash: [u8; 32],
    // ... other params
) -> Result<()> {
    // ... verification logic ...

    // 🔥 CPI CALL: Mint a voting token
    let cpi_accounts = MintTo {
        mint: ctx.accounts.voting_token_mint.to_account_info(),
        to: ctx.accounts.voter_token_account.to_account_info(),
        authority: ctx.accounts.election.to_account_info(),
    };

    let election_seeds = &[
        b"election",
        election.election_name.as_bytes(),
        &[election.bump],
    ];
    let signer = &[&election_seeds[..]];

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::mint_to(cpi_ctx, 1)?;  // 👈 This is the CPI!

    Ok(())
}
```

**What's happening:**
1. We prepare accounts for the SPL Token program's `mint_to` instruction
2. We provide PDA seeds so the program can sign
3. We call `token::mint_to` which invokes SPL Token Program
4. SPL Token Program mints 1 token to the voter's account

### Example 2: Burning Voting Tokens

When a voter casts their vote, we burn their token using CPI:

```rust
pub fn cast_vote(
    ctx: Context<CastVote>,
    encrypted_vote_data: [u8; 32],
) -> Result<()> {
    // ... vote validation ...

    // 🔥 CPI CALL: Burn the voting token
    let cpi_accounts = Burn {
        mint: ctx.accounts.voting_token_mint.to_account_info(),
        from: ctx.accounts.voter_token_account.to_account_info(),
        authority: ctx.accounts.voter.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::burn(cpi_ctx, 1)?;  // 👈 This is the CPI!

    // ... record vote ...

    Ok(())
}
```

**What's happening:**
1. We prepare accounts for the SPL Token program's `burn` instruction
2. The voter is the authority (they sign the transaction)
3. We call `token::burn` which invokes SPL Token Program
4. SPL Token Program burns 1 token from the voter's account

### Visual Breakdown

```
Voter Registration Flow:
┌───────────────┐
│ E-Voting      │
│ Program       │
└───────┬───────┘
        │
        │ verify_voter()
        │
        ├─────────────────────┐
        │                     │
        │ CPI: mint_to()      │
        │                     │
┌───────▼────────┐            │
│ SPL Token      │            │
│ Program        │            │
└───────┬────────┘            │
        │                     │
        │ Token minted! ✅    │
        │                     │
        └─────────────────────┘
        │
┌───────▼────────┐
│ Voter Token    │
│ Account        │
│ Balance: 1     │
└────────────────┘
```

```
Voting Flow:
┌───────────────┐
│ E-Voting      │
│ Program       │
└───────┬───────┘
        │
        │ cast_vote()
        │
        ├─────────────────────┐
        │                     │
        │ CPI: burn()         │
        │                     │
┌───────▼────────┐            │
│ SPL Token      │            │
│ Program        │            │
└───────┬────────┘            │
        │                     │
        │ Token burned! ✅    │
        │                     │
        └─────────────────────┘
        │
┌───────▼────────┐
│ Voter Token    │
│ Account        │
│ Balance: 0     │
└────────────────┘
```

---

## Regular CPI vs CPI with Signers

### Regular CPI: `invoke()`

**Used when**: The transaction signer is already the authority

```rust
// User signs the transaction, so they can authorize the burn
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
token::burn(cpi_ctx, 1)?;
```

**Example in our code**:
```rust
// Voter signs transaction, burns their own token
pub fn cast_vote(ctx: Context<CastVote>, ...) -> Result<()> {
    let cpi_accounts = Burn {
        // ... voter is authority
        authority: ctx.accounts.voter.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::burn(cpi_ctx, 1)?;  // ✅ Voter authorized it
}
```

### CPI with Signers: `invoke_signed()`

**Used when**: Your program (via PDA) needs to be the authority

```rust
// Program signs on behalf of a PDA
let seeds = &[b"election", name.as_bytes(), &[bump]];
let signer = &[&seeds[..]];

let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
token::mint_to(cpi_ctx, 1)?;
```

**Example in our code**:
```rust
// Election PDA is mint authority, needs program to sign
pub fn verify_voter(ctx: Context<VerifyVoter>, ...) -> Result<()> {
    let cpi_accounts = MintTo {
        // ... election PDA is authority
        authority: ctx.accounts.election.to_account_info(),
    };

    // Program provides PDA seeds to sign
    let election_seeds = &[
        b"election",
        election.election_name.as_bytes(),
        &[election.bump],
    ];
    let signer = &[&election_seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        cpi_program,
        cpi_accounts,
        signer  // 👈 Program signs for PDA
    );

    token::mint_to(cpi_ctx, 1)?;  // ✅ Program authorized it
}
```

### The Key Difference

```
Regular CPI (invoke):
User → Your Program → Target Program
      └─ User's signature passed through

CPI with Signers (invoke_signed):
User → Your Program → Target Program
      └─ Program creates signature for PDA
```

---

## Common CPI Patterns

### Pattern 1: Token Operations

```rust
// Minting tokens
use anchor_spl::token::{self, MintTo, Token};

let cpi_ctx = CpiContext::new_with_signer(
    token_program,
    MintTo {
        mint: mint_account,
        to: destination_account,
        authority: mint_authority,
    },
    signer_seeds,
);
token::mint_to(cpi_ctx, amount)?;

// Transferring tokens
use anchor_spl::token::Transfer;

let cpi_ctx = CpiContext::new(
    token_program,
    Transfer {
        from: from_account,
        to: to_account,
        authority: owner,
    },
);
token::transfer(cpi_ctx, amount)?;

// Burning tokens
use anchor_spl::token::Burn;

let cpi_ctx = CpiContext::new(
    token_program,
    Burn {
        mint: mint_account,
        from: source_account,
        authority: owner,
    },
);
token::burn(cpi_ctx, amount)?;
```

### Pattern 2: Creating Token Accounts

```rust
use anchor_spl::associated_token::AssociatedToken;

// Associated Token Account (recommended)
#[account(
    init_if_needed,
    payer = payer,
    associated_token::mint = mint,
    associated_token::authority = authority
)]
pub token_account: Account<'info, TokenAccount>,
```

### Pattern 3: Calling Custom Programs

```rust
// Your own custom program
let cpi_accounts = CustomInstruction {
    account1: ctx.accounts.some_account.to_account_info(),
    account2: ctx.accounts.another_account.to_account_info(),
};

let cpi_program = ctx.accounts.custom_program.to_account_info();
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

custom_program::cpi::custom_instruction(cpi_ctx, args)?;
```

---

## CPI Security Considerations

### 1. **Verify the Program ID**

```rust
// ❌ BAD: Trust any program
pub target_program: AccountInfo<'info>,

// ✅ GOOD: Verify it's the right program
#[account(address = spl_token::ID)]
pub token_program: Program<'info, Token>,
```

### 2. **Check Account Ownership**

```rust
// ❌ BAD: Assume account is valid
pub some_account: AccountInfo<'info>,

// ✅ GOOD: Verify ownership and type
pub some_account: Account<'info, SomeType>,
```

### 3. **Validate Signer Seeds**

```rust
// ❌ BAD: Trust any PDA
let seeds = user_provided_seeds;  // Could be malicious!

// ✅ GOOD: Use fixed, validated seeds
let seeds = &[
    b"election",
    election.election_name.as_bytes(),  // Validated
    &[election.bump],  // Stored in account
];
```

### 4. **Check Return Values**

```rust
// ❌ BAD: Ignore errors
let _ = token::mint_to(cpi_ctx, amount);

// ✅ GOOD: Handle errors
token::mint_to(cpi_ctx, amount)?;
```

### 5. **Limit Program Invocation Depth**

Solana limits CPI depth to 4 levels:

```
Your Program
  └─> Program A (depth 1)
      └─> Program B (depth 2)
          └─> Program C (depth 3)
              └─> Program D (depth 4)
                  └─> Program E ❌ Too deep!
```

---

## Troubleshooting CPI

### Common Errors

#### Error: "Program failed to complete"
```
Cause: Target program rejected the CPI
Solution: Check if all required accounts are provided
```

#### Error: "Cross-program invocation with unauthorized signer"
```
Cause: Wrong signer seeds or missing signer
Solution: Verify PDA seeds and use new_with_signer()
```

#### Error: "Account not owned by program"
```
Cause: Trying to modify account you don't own
Solution: Use CPI to ask the owner program to modify it
```

#### Error: "Insufficient funds"
```
Cause: Not enough lamports for rent or operation
Solution: Add more SOL or check token balance
```

### Debugging Tips

1. **Enable Logging**
```rust
msg!("About to call CPI");
msg!("Amount: {}", amount);
token::mint_to(cpi_ctx, amount)?;
msg!("CPI successful");
```

2. **Check Program IDs**
```rust
msg!("Token Program ID: {}", ctx.accounts.token_program.key());
msg!("Expected: {}", spl_token::ID);
```

3. **Verify Account States**
```rust
msg!("Mint authority: {}", mint.mint_authority);
msg!("Current supply: {}", mint.supply);
```

---

## Best Practices

### 1. Use Anchor's CPI Module
```rust
// ✅ GOOD: Use Anchor's helpers
use anchor_spl::token::{self, Token, MintTo};

token::mint_to(ctx, amount)?;

// ❌ AVOID: Manual invoke calls
invoke(&instruction, &accounts)?;
```

### 2. Keep CPI Logic Simple
```rust
// ✅ GOOD: One CPI per function when possible
pub fn mint_voting_token(...) -> Result<()> {
    token::mint_to(ctx, 1)?;
    Ok(())
}

// ⚠️ AVOID: Too many CPIs in one function
pub fn complex_operation(...) -> Result<()> {
    token::mint_to(ctx1, 1)?;
    token::transfer(ctx2, 1)?;
    token::burn(ctx3, 1)?;
    custom_program::call(ctx4)?;
    // Hard to debug!
}
```

### 3. Document CPI Calls
```rust
/// Mints a voting token to the verified voter
///
/// CPI: Calls SPL Token Program's mint_to instruction
/// Authority: Election PDA signs via program
pub fn verify_voter(...) -> Result<()> {
    // ... code
}
```

### 4. Test CPI Interactions
```typescript
// Test that CPI works correctly
it("Mints voting token via CPI", async () => {
    await program.methods.verifyVoter(...).rpc();

    const tokenAccount = await getTokenAccount(...);
    assert.equal(tokenAccount.amount, 1);
});
```

---

## Real-World CPI Use Cases

### 1. DeFi Protocols
```
Lending Protocol:
├─> CPI to Token Program (transfer collateral)
├─> CPI to Oracle Program (get price)
└─> CPI to Token Program (mint loan tokens)
```

### 2. NFT Marketplaces
```
Marketplace:
├─> CPI to Token Program (transfer payment)
├─> CPI to Metaplex (transfer NFT)
└─> CPI to Metaplex (update metadata)
```

### 3. Governance Systems
```
Governance:
├─> CPI to Token Program (lock voting tokens)
├─> CPI to Timer Program (schedule execution)
└─> CPI to Target Program (execute proposal)
```

### 4. Our E-Voting System
```
E-Voting:
├─> CPI to Token Program (mint voting tokens)
├─> CPI to Token Program (burn voting tokens)
└─> (Future) CPI to Oracle (verify biometrics)
```

---

## Summary

### CPI Enables:
✅ **Composability**: Programs work together
✅ **Code Reuse**: Don't reinvent the wheel
✅ **Security**: Use audited programs
✅ **Modularity**: Each program does one thing well

### Key Takeaways:
1. CPI = one program calling another
2. Use `CpiContext::new()` for regular CPI
3. Use `CpiContext::new_with_signer()` when PDA needs to sign
4. Always verify program IDs and account ownership
5. Anchor makes CPI much easier than raw Solana

### In Our E-Voting:
- **Minting**: CPI to create voting tokens
- **Burning**: CPI to prevent double-voting
- **Security**: SPL Token Program is battle-tested

---

## Further Reading

- [Solana CPI Documentation](https://docs.solana.com/developing/programming-model/calling-between-programs)
- [Anchor CPI Guide](https://www.anchor-lang.com/docs/cross-program-invocations)
- [SPL Token Program](https://spl.solana.com/token)

---

**Last Updated**: December 11, 2025
