# Deployment Guide

## Overview

This guide walks you through deploying the Indonesia E-Voting smart contract to Solana's Devnet for testing, and eventually to Mainnet for production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Testing](#local-testing)
4. [Deploying to Devnet](#deploying-to-devnet)
5. [Testing on Devnet](#testing-on-devnet)
6. [Deploying to Mainnet](#deploying-to-mainnet)
7. [Post-Deployment Tasks](#post-deployment-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Rust & Cargo** (1.75.0 or higher)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Solana CLI** (1.18.0 or higher)
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

3. **Anchor CLI** (0.31.1 - matches project version)
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor --tag v0.31.1 anchor-cli
   ```

4. **Node.js & npm** (for testing scripts)
   ```bash
   # macOS
   brew install node

   # Or download from https://nodejs.org/
   ```

### Verify Installation

```bash
# Check Rust
rustc --version
# Expected: rustc 1.75.0 or higher

# Check Solana
solana --version
# Expected: solana-cli 1.18.0 or higher

# Check Anchor
anchor --version
# Expected: anchor-cli 0.31.1

# Check Node
node --version
npm --version
```

---

## Environment Setup

### 1. Create Solana Wallets

**Development Wallet (for Devnet)**:
```bash
# Create new keypair
solana-keygen new --outfile ~/.config/solana/devnet.json

# View public key
solana-keygen pubkey ~/.config/solana/devnet.json
```

**Production Wallet (for Mainnet)**:
```bash
# IMPORTANT: Use hardware wallet or secure key management for production!
# For now, create a separate keypair
solana-keygen new --outfile ~/.config/solana/mainnet.json

# BACKUP THIS FILE SECURELY - You'll need it for production deployment
```

### 2. Get Devnet SOL

```bash
# Set to Devnet
solana config set --url https://api.devnet.solana.com

# Set your devnet wallet as default
solana config set --keypair ~/.config/solana/devnet.json

# Request airdrop (up to 5 SOL per request)
solana airdrop 2

# Check balance
solana balance
# Expected: 2 SOL
```

**Note**: If airdrop fails, try:
- Using the [Solana Faucet](https://faucet.solana.com/)
- Trying again after a few minutes
- Using a different RPC endpoint

### 3. Configure Anchor

Edit `anchor/Anchor.toml`:

```toml
[provider]
cluster = "Devnet"  # Change this for different deployments
wallet = "~/.config/solana/devnet.json"

[programs.devnet]
idngenelectevotingsolana = "YOUR_PROGRAM_ID_HERE"  # Will be generated on first deployment

[programs.mainnet]
idngenelectevotingsolana = "YOUR_MAINNET_PROGRAM_ID_HERE"  # For production
```

---

## Local Testing

Before deploying to Devnet, test locally with Anchor's built-in validator.

### 1. Start Local Validator

```bash
cd anchor

# Start Solana test validator in a separate terminal
solana-test-validator
```

Keep this terminal open. The validator must run continuously.

### 2. Configure for Local Testing

In a new terminal:

```bash
cd anchor

# Point to localhost
solana config set --url http://localhost:8899

# Build the program
anchor build

# Run tests
anchor test --skip-local-validator
```

### 3. Verify Tests Pass

You should see output like:

```
  idngenelectevotingsolana
    ✔ Initializes an election (234ms)
    ✔ Registers candidates (156ms)
    ✔ Verifies a voter (189ms)
    ✔ Casts a vote (203ms)
    ✔ Prevents double voting (145ms)

  5 passing (1s)
```

**If tests fail**, see [Troubleshooting](#troubleshooting) section.

---

## Deploying to Devnet

### 1. Build the Program

```bash
cd anchor

# Make sure you're on Devnet
solana config set --url https://api.devnet.solana.com
solana config set --keypair ~/.config/solana/devnet.json

# Build optimized program
anchor build
```

**Build Output**:
```
Compiling idngenelectevotingsolana v0.1.0
Finished release [optimized] target(s) in 2m 15s
```

### 2. Check Deployment Cost

```bash
# Check your balance
solana balance

# Estimate deployment cost (usually 3-5 SOL for initial deployment)
solana program show --programs

# Get more SOL if needed
solana airdrop 2
```

### 3. Deploy Program

```bash
# Deploy to Devnet
anchor deploy
```

**Expected Output**:
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: ~/.config/solana/devnet.json
Deploying program "idngenelectevotingsolana"...
Program path: target/deploy/idngenelectevotingsolana.so...
Program Id: Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe

Deploy success
```

**IMPORTANT**: Save the Program ID! You'll need it everywhere.

### 4. Verify Deployment

```bash
# Check program account
solana program show <YOUR_PROGRAM_ID>

# Expected output:
# Program Id: <YOUR_PROGRAM_ID>
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# ProgramData Address: <PROGRAM_DATA_ADDRESS>
# Authority: <YOUR_WALLET_ADDRESS>
# Last Deployed In Slot: 123456789
# Data Length: 403456 (0x62680) bytes
# Balance: 2.8 SOL
```

### 5. Update Configuration Files

**Update `Anchor.toml`**:
```toml
[programs.devnet]
idngenelectevotingsolana = "Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe"  # Your actual Program ID
```

**Update Frontend (when ready)**:
```typescript
// In your frontend config
export const PROGRAM_ID = new PublicKey(
  'Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe'  // Your Program ID
);

export const CLUSTER = 'devnet';
export const NETWORK = 'https://api.devnet.solana.com';
```

---

## Testing on Devnet

### 1. Initialize Election

Create a test script `anchor/scripts/init-election.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Idngenelectevotingsolana } from "../target/types/idngenelectevotingsolana";
import { PublicKey, Keypair } from "@solana/web3.js";

async function main() {
  // Configure provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Idngenelectevotingsolana as Program<Idngenelectevotingsolana>;

  // Election parameters
  const electionName = "Indonesia2024";
  const startTime = new anchor.BN(Math.floor(Date.now() / 1000));
  const endTime = new anchor.BN(Math.floor(Date.now() / 1000) + 86400 * 7); // 7 days

  // Commissioner addresses (use your wallet for testing)
  const commissioners = [provider.wallet.publicKey];
  const requiredSignatures = 1;

  // Derive election PDA
  const [electionPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("election"), Buffer.from(electionName)],
    program.programId
  );

  console.log("Election PDA:", electionPda.toString());

  // Create voting token mint
  const votingTokenMint = Keypair.generate();

  // Initialize election
  const tx = await program.methods
    .initializeElection(
      electionName,
      startTime,
      endTime,
      commissioners,
      requiredSignatures
    )
    .accounts({
      authority: provider.wallet.publicKey,
      election: electionPda,
      votingTokenMint: votingTokenMint.publicKey,
      // Other required accounts...
    })
    .signers([votingTokenMint])
    .rpc();

  console.log("Transaction signature:", tx);
  console.log("Election initialized successfully!");
  console.log("Explorer URL:", `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run the script:
```bash
cd anchor
anchor run init-election
```

### 2. Register Candidates

Create `anchor/scripts/register-candidates.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Idngenelectevotingsolana } from "../target/types/idngenelectevotingsolana";
import { PublicKey } from "@solana/web3.js";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Idngenelectevotingsolana as Program<Idngenelectevotingsolana>;

  const electionName = "Indonesia2024";

  // Derive election PDA
  const [electionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("election"), Buffer.from(electionName)],
    program.programId
  );

  // Register multiple candidates
  const candidates = [
    { id: 1, name: "Candidate A - Party 1" },
    { id: 2, name: "Candidate B - Party 2" },
    { id: 3, name: "Candidate C - Party 3" },
  ];

  for (const candidate of candidates) {
    // Derive candidate PDA
    const [candidatePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("candidate"),
        electionPda.toBuffer(),
        new anchor.BN(candidate.id).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    );

    const tx = await program.methods
      .registerCandidate(candidate.id, candidate.name)
      .accounts({
        authority: provider.wallet.publicKey,
        election: electionPda,
        candidate: candidatePda,
      })
      .rpc();

    console.log(`Registered: ${candidate.name}`);
    console.log(`TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  }

  console.log("All candidates registered successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run:
```bash
anchor run register-candidates
```

### 3. Test Voter Verification

Create `anchor/scripts/verify-voter.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Idngenelectevotingsolana } from "../target/types/idngenelectevotingsolana";
import { PublicKey, Keypair } from "@solana/web3.js";
import { createHash } from "crypto";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Idngenelectevotingsolana as Program<Idngenelectevotingsolana>;

  const electionName = "Indonesia2024";

  // Create test voter
  const voter = Keypair.generate();

  console.log("Test voter pubkey:", voter.publicKey.toString());

  // Derive PDAs
  const [electionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("election"), Buffer.from(electionName)],
    program.programId
  );

  const [voterCredentialPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("voter_credential"),
      electionPda.toBuffer(),
      voter.publicKey.toBuffer(),
    ],
    program.programId
  );

  // Test data (in production, this comes from biometric scanner + AI)
  const voterNik = "1234567890123456"; // 16 digits
  const biometricData = "test_biometric_data";
  const biometricHash = Array.from(
    createHash("sha256").update(biometricData).digest()
  );
  const photoIpfsHash = "QmTest123456789"; // Mock IPFS hash
  const timestamp = new anchor.BN(Math.floor(Date.now() / 1000));
  const aiScore = 95; // 95% confidence

  // Airdrop SOL to voter for testing
  const airdropTx = await provider.connection.requestAirdrop(
    voter.publicKey,
    1 * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropTx);

  console.log("Verifying voter...");

  const tx = await program.methods
    .verifyVoter(
      voterNik,
      biometricHash,
      photoIpfsHash,
      timestamp,
      aiScore
    )
    .accounts({
      voter: voter.publicKey,
      election: electionPda,
      voterCredential: voterCredentialPda,
      // Add other required accounts
    })
    .signers([voter])
    .rpc();

  console.log("Voter verified successfully!");
  console.log(`TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

  // Fetch and display voter credential
  const credential = await program.account.voterCredential.fetch(voterCredentialPda);
  console.log("\nVoter Credential:");
  console.log("- Verified:", credential.isVerified);
  console.log("- Verification Code:", credential.verificationCode);
  console.log("- AI Confidence:", credential.aiConfidenceScore);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 4. View Deployed Program

Explore your program on Solana Explorer:

**Devnet Explorer**:
```
https://explorer.solana.com/address/<YOUR_PROGRAM_ID>?cluster=devnet
```

Check:
- ✅ Program is deployed and funded
- ✅ Transactions are successful
- ✅ Accounts are being created correctly

---

## Deploying to Mainnet

### ⚠️ CRITICAL PRE-DEPLOYMENT CHECKLIST

**DO NOT deploy to Mainnet until**:
- ✅ All tests pass on Devnet
- ✅ Code has been audited by security professionals
- ✅ Multi-sig is properly configured
- ✅ You have sufficient SOL for deployment (~5-10 SOL)
- ✅ You have backup of all keypairs
- ✅ You understand upgrade authority implications
- ✅ Frontend is ready and tested on Devnet
- ✅ Monitoring and alerting is set up

### Security Audit

**Before Mainnet deployment**:
1. Hire professional auditors (OtterSec, Kudelski, Neodyme)
2. Run automated security tools
3. Conduct penetration testing
4. Set up bug bounty program

### 1. Prepare Mainnet Wallet

```bash
# NEVER use a development wallet for production!
# Use hardware wallet (Ledger) or secure key management

# For this guide, we'll show the process:
solana config set --url https://api.mainnet-beta.solana.com
solana config set --keypair ~/.config/solana/mainnet.json

# Check balance (you need 5-10 SOL)
solana balance

# If you need to fund this wallet, transfer from exchange
```

### 2. Update Configuration

**Update `Anchor.toml` for Mainnet**:
```toml
[provider]
cluster = "Mainnet"
wallet = "~/.config/solana/mainnet.json"

[programs.mainnet]
idngenelectevotingsolana = "YOUR_MAINNET_PROGRAM_ID"  # Will be set after deployment
```

### 3. Build for Production

```bash
cd anchor

# Clean previous builds
anchor clean

# Build with optimizations
anchor build --verifiable
```

### 4. Deploy to Mainnet

```bash
# FINAL CHECK - Make sure you're ready!
solana config get
# Should show: https://api.mainnet-beta.solana.com

# Deploy (THIS WILL COST REAL SOL)
anchor deploy
```

### 5. Transfer Upgrade Authority to Multi-Sig

**CRITICAL**: Immediately transfer upgrade authority to a multi-sig wallet!

```bash
# Deploy Squads multi-sig first (see Multi-Sig section)
# Then transfer authority:

solana program set-upgrade-authority \
  <YOUR_PROGRAM_ID> \
  --new-upgrade-authority <SQUADS_MULTISIG_ADDRESS>
```

### 6. Verify Mainnet Deployment

```bash
# Check program
solana program show <YOUR_PROGRAM_ID>

# Verify on Explorer
# https://explorer.solana.com/address/<YOUR_PROGRAM_ID>
```

---

## Post-Deployment Tasks

### 1. Document Program ID

Create `.env` file in root:
```bash
# Devnet
VITE_DEVNET_PROGRAM_ID=<YOUR_DEVNET_PROGRAM_ID>
VITE_DEVNET_RPC=https://api.devnet.solana.com

# Mainnet
VITE_MAINNET_PROGRAM_ID=<YOUR_MAINNET_PROGRAM_ID>
VITE_MAINNET_RPC=https://api.mainnet-beta.solana.com
```

### 2. Set Up Monitoring

**Solana RPC Monitoring**:
- Monitor program health
- Set up alerts for errors
- Track transaction success rate

**Recommended Tools**:
- [Helius](https://www.helius.dev/) - Enhanced RPC
- [QuickNode](https://www.quicknode.com/) - Infrastructure
- [Ironforge](https://www.ironforge.cloud/) - Analytics

### 3. Create Initial Election (Mainnet)

Use the same scripts from Devnet testing, but:
- Use real commissioner addresses
- Set actual election dates
- Use production IPFS service
- Test with small group first

### 4. Monitor First Transactions

```bash
# Watch logs in real-time
solana logs <YOUR_PROGRAM_ID>
```

### 5. Set Up Backup RPC

Configure multiple RPC endpoints for reliability:
```typescript
const connection = new Connection(
  process.env.VITE_PRIMARY_RPC || 'https://api.mainnet-beta.solana.com',
  {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  }
);

// Fallback RPC
const fallbackConnection = new Connection(
  process.env.VITE_FALLBACK_RPC || 'https://solana-api.projectserum.com'
);
```

---

## Troubleshooting

### Build Errors

**Error**: `anchor-lang version mismatch`
```bash
# Fix: Update Anchor.toml
[toolchain]
anchor_version = "0.31.1"
```

**Error**: `idl-build feature missing`
```bash
# Fix: Update Cargo.toml
[features]
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]
```

**Error**: `solana-program conflicts`
```bash
# Fix: Remove solana-program from Cargo.toml
# Use anchor_lang::solana_program instead
```

### Deployment Errors

**Error**: `Insufficient funds`
```bash
# Get more SOL
solana airdrop 2  # Devnet
# Or transfer from exchange (Mainnet)
```

**Error**: `Transaction simulation failed`
```bash
# Check:
# 1. Program size limit (max 10MB)
anchor build
ls -lh target/deploy/*.so

# If too large, optimize dependencies
```

**Error**: `Custom program error: 0x1`
```bash
# Usually insufficient account balance
# Solution: Ensure deployer has enough SOL
solana balance
```

### Runtime Errors

**Error**: `Account not found`
```bash
# Check if account exists
solana account <ACCOUNT_ADDRESS>

# Verify PDA derivation matches
```

**Error**: `Seeds constraint violated`
```bash
# PDA seeds don't match
# Verify:
# 1. Seed order is correct
# 2. Bump is stored and used correctly
# 3. Program ID matches deployed program
```

**Error**: `Cross-program invocation failed`
```bash
# Check:
# 1. Token program ID is correct
# 2. Account ownership is correct
# 3. Signers are provided
```

### Testing Issues

**Error**: Tests timeout
```bash
# Increase timeout in Anchor.toml
[provider]
timeout = 60000  # 60 seconds
```

**Error**: `AccountNotFound` in tests
```bash
# May need to wait for account creation
await connection.confirmTransaction(tx);
```

---

## Upgrading Deployed Program

### Devnet Upgrade

```bash
# Make changes to your code
# Build new version
anchor build

# Upgrade (keeps same Program ID)
anchor upgrade target/deploy/idngenelectevotingsolana.so \
  --program-id <YOUR_PROGRAM_ID>
```

### Mainnet Upgrade (with Multi-Sig)

```bash
# 1. Build new version
anchor build --verifiable

# 2. Create upgrade proposal in Squads
# Visit https://squads.so

# 3. Commissioners vote

# 4. Execute upgrade when threshold met
```

---

## Security Best Practices

### Development
- ✅ Always test on Devnet first
- ✅ Use separate wallets for dev/prod
- ✅ Never commit private keys
- ✅ Use environment variables

### Deployment
- ✅ Verify program hash matches build
- ✅ Use multi-sig for upgrade authority
- ✅ Start with small test election
- ✅ Monitor all transactions

### Production
- ✅ Regular security audits
- ✅ Bug bounty program
- ✅ Incident response plan
- ✅ Multiple RPC endpoints

---

## Useful Commands Reference

```bash
# Configuration
solana config get                     # View current config
solana config set --url <RPC_URL>    # Change network
solana config set --keypair <PATH>   # Change wallet

# Account Management
solana balance                        # Check balance
solana address                        # View address
solana airdrop <AMOUNT>              # Get devnet SOL

# Program Management
anchor build                          # Build program
anchor test                          # Run tests
anchor deploy                        # Deploy program
anchor upgrade <PATH> --program-id <ID>  # Upgrade program

# Program Information
solana program show <PROGRAM_ID>     # View program info
solana program dump <ID> <FILE>      # Download program
solana logs <PROGRAM_ID>             # Stream logs

# Transaction Management
solana confirm <SIGNATURE>           # Confirm transaction
solana transaction-history <ADDRESS> # View history
```

---

## Next Steps

After successful deployment:

1. **[Frontend Integration Guide](./frontend-integration.md)** - Connect your UI
2. **[Testing Guide](./testing.md)** - Comprehensive testing strategies
3. **[API Reference](../reference/api-reference.md)** - Full instruction documentation

---

## Support & Resources

- **Anchor Docs**: https://www.anchor-lang.com/
- **Solana Docs**: https://docs.solana.com/
- **Solana Stack Exchange**: https://solana.stackexchange.com/
- **Anchor Discord**: https://discord.gg/anchor

---

**Last Updated**: December 11, 2025
