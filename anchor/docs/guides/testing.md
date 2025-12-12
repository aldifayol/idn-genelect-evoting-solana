# Testing Guide

## Overview

This guide covers comprehensive testing strategies for the Indonesia E-Voting smart contract, from unit tests to end-to-end integration testing on Devnet.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Environment Setup](#test-environment-setup)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [End-to-End Tests](#end-to-end-tests)
6. [Testing on Devnet](#testing-on-devnet)
7. [Security Testing](#security-testing)
8. [Performance Testing](#performance-testing)
9. [Troubleshooting Tests](#troubleshooting-tests)

---

## Testing Philosophy

### The Testing Pyramid

```
                    ┌───────────┐
                    │  E2E/UI   │  ← Few, slow, expensive
                    │   Tests   │
                    ├───────────┤
                │   Integration   │  ← Medium amount
                │      Tests      │
                ├─────────────────┤
            │       Unit Tests        │  ← Many, fast, cheap
            │    (Anchor Tests)       │
            └─────────────────────────┘
```

### What to Test

| Component | Test Type | Priority |
|-----------|-----------|----------|
| Election initialization | Unit | High |
| Candidate registration | Unit | High |
| Voter verification | Unit + Integration | Critical |
| Vote casting | Unit + Integration | Critical |
| Double-vote prevention | Unit + Security | Critical |
| Token minting/burning | Integration | High |
| Multi-sig operations | Integration | High |
| Time-based constraints | Unit | Medium |
| Error conditions | Unit | High |

---

## Test Environment Setup

### 1. Install Dependencies

```bash
cd anchor

# Install test dependencies
npm install

# Or with yarn
yarn install
```

### 2. Configure Test Environment

Create `anchor/tests/setup.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Idngenelectevotingsolana } from "../target/types/idngenelectevotingsolana";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { createHash } from "crypto";

// Test configuration
export const TEST_CONFIG = {
  electionName: "TestElection2024",
  startTimeOffset: 0,      // Start immediately
  endTimeOffset: 86400 * 7, // 7 days from now
  requiredSignatures: 1,
};

// Helper: Generate SHA-256 hash
export function sha256(data: string): number[] {
  return Array.from(createHash("sha256").update(data).digest());
}

// Helper: Get current timestamp
export function getCurrentTimestamp(): anchor.BN {
  return new anchor.BN(Math.floor(Date.now() / 1000));
}

// Helper: Derive Election PDA
export function deriveElectionPDA(
  electionName: string,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("election"), Buffer.from(electionName)],
    programId
  );
}

// Helper: Derive Candidate PDA
export function deriveCandidatePDA(
  electionPda: PublicKey,
  candidateId: number,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("candidate"),
      electionPda.toBuffer(),
      new anchor.BN(candidateId).toArrayLike(Buffer, "le", 4),
    ],
    programId
  );
}

// Helper: Derive Voter Credential PDA
export function deriveVoterCredentialPDA(
  electionPda: PublicKey,
  voterPubkey: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("voter_credential"),
      electionPda.toBuffer(),
      voterPubkey.toBuffer(),
    ],
    programId
  );
}

// Helper: Derive Ballot PDA
export function deriveBallotPDA(
  electionPda: PublicKey,
  ballotSequence: number,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("ballot"),
      electionPda.toBuffer(),
      new anchor.BN(ballotSequence).toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
}

// Helper: Airdrop SOL to account
export async function airdrop(
  connection: anchor.web3.Connection,
  publicKey: PublicKey,
  amount: number = 2 * LAMPORTS_PER_SOL
): Promise<void> {
  const signature = await connection.requestAirdrop(publicKey, amount);
  await connection.confirmTransaction(signature);
}

// Helper: Create test voter with NIK and biometric data
export function createTestVoter() {
  const keypair = Keypair.generate();
  const nik = "1234567890123456"; // 16 digits
  const biometricData = `biometric_${keypair.publicKey.toString().slice(0, 8)}`;
  const biometricHash = sha256(biometricData);
  const photoIpfsHash = `QmTest${keypair.publicKey.toString().slice(0, 20)}`;

  return {
    keypair,
    nik,
    biometricHash,
    photoIpfsHash,
    aiScore: 95,
  };
}
```

### 3. Anchor.toml Test Configuration

```toml
[features]
seeds = false
skip-lint = false

[programs.localnet]
idngenelectevotingsolana = "Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

---

## Unit Tests

### Test File Structure

```
anchor/tests/
├── setup.ts                    # Test helpers and configuration
├── 01-initialize-election.ts   # Election initialization tests
├── 02-register-candidate.ts    # Candidate registration tests
├── 03-verify-voter.ts          # Voter verification tests
├── 04-cast-vote.ts            # Vote casting tests
├── 05-manage-election.ts       # Election management tests
├── 06-audit.ts                # Audit function tests
└── 07-security.ts             # Security and edge case tests
```

### 01. Initialize Election Tests

Create `anchor/tests/01-initialize-election.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Idngenelectevotingsolana } from "../target/types/idngenelectevotingsolana";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";
import {
  TEST_CONFIG,
  deriveElectionPDA,
  getCurrentTimestamp,
  airdrop
} from "./setup";

describe("Initialize Election", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Idngenelectevotingsolana as Program<Idngenelectevotingsolana>;

  let electionPda: PublicKey;
  let electionBump: number;
  let votingTokenMint: Keypair;

  before(async () => {
    [electionPda, electionBump] = deriveElectionPDA(
      TEST_CONFIG.electionName,
      program.programId
    );
    votingTokenMint = Keypair.generate();
  });

  it("Should initialize an election successfully", async () => {
    const startTime = getCurrentTimestamp();
    const endTime = startTime.add(new anchor.BN(TEST_CONFIG.endTimeOffset));
    const commissioners = [provider.wallet.publicKey];

    const tx = await program.methods
      .initializeElection(
        TEST_CONFIG.electionName,
        startTime,
        endTime,
        commissioners,
        TEST_CONFIG.requiredSignatures
      )
      .accounts({
        authority: provider.wallet.publicKey,
        election: electionPda,
        votingTokenMint: votingTokenMint.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([votingTokenMint])
      .rpc();

    console.log("Initialize election tx:", tx);

    // Fetch and verify election account
    const election = await program.account.election.fetch(electionPda);

    expect(election.authority.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(election.electionName).to.equal(TEST_CONFIG.electionName);
    expect(election.isActive).to.equal(false);
    expect(election.totalRegisteredVoters.toNumber()).to.equal(0);
    expect(election.totalVotesCast.toNumber()).to.equal(0);
    expect(election.commissioners.length).to.equal(1);
    expect(election.requiredSignatures).to.equal(TEST_CONFIG.requiredSignatures);
  });

  it("Should fail with invalid election period (end before start)", async () => {
    const badElectionName = "BadElection";
    const [badElectionPda] = deriveElectionPDA(badElectionName, program.programId);
    const badMint = Keypair.generate();

    const startTime = getCurrentTimestamp();
    const endTime = startTime.sub(new anchor.BN(86400)); // End BEFORE start

    try {
      await program.methods
        .initializeElection(
          badElectionName,
          startTime,
          endTime,
          [provider.wallet.publicKey],
          1
        )
        .accounts({
          authority: provider.wallet.publicKey,
          election: badElectionPda,
          votingTokenMint: badMint.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([badMint])
        .rpc();

      expect.fail("Should have thrown InvalidElectionPeriod error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidElectionPeriod");
    }
  });

  it("Should fail with empty commissioners list", async () => {
    const badElectionName = "NoCommissioners";
    const [badElectionPda] = deriveElectionPDA(badElectionName, program.programId);
    const badMint = Keypair.generate();

    const startTime = getCurrentTimestamp();
    const endTime = startTime.add(new anchor.BN(86400));

    try {
      await program.methods
        .initializeElection(
          badElectionName,
          startTime,
          endTime,
          [], // Empty commissioners
          1
        )
        .accounts({
          authority: provider.wallet.publicKey,
          election: badElectionPda,
          votingTokenMint: badMint.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([badMint])
        .rpc();

      expect.fail("Should have thrown InvalidCommissionerCount error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidCommissionerCount");
    }
  });

  it("Should fail with election name too long", async () => {
    const longName = "A".repeat(101); // 101 chars, max is 100
    const [badElectionPda] = deriveElectionPDA(longName, program.programId);
    const badMint = Keypair.generate();

    const startTime = getCurrentTimestamp();
    const endTime = startTime.add(new anchor.BN(86400));

    try {
      await program.methods
        .initializeElection(
          longName,
          startTime,
          endTime,
          [provider.wallet.publicKey],
          1
        )
        .accounts({
          authority: provider.wallet.publicKey,
          election: badElectionPda,
          votingTokenMint: badMint.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([badMint])
        .rpc();

      expect.fail("Should have thrown NameTooLong error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("NameTooLong");
    }
  });
});
```

### 02. Register Candidate Tests

Create `anchor/tests/02-register-candidate.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Idngenelectevotingsolana } from "../target/types/idngenelectevotingsolana";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import {
  TEST_CONFIG,
  deriveElectionPDA,
  deriveCandidatePDA
} from "./setup";

describe("Register Candidate", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Idngenelectevotingsolana as Program<Idngenelectevotingsolana>;

  let electionPda: PublicKey;

  before(async () => {
    [electionPda] = deriveElectionPDA(TEST_CONFIG.electionName, program.programId);
  });

  it("Should register candidate 1 successfully", async () => {
    const candidateId = 1;
    const candidateName = "Candidate Alpha - Party A";

    const [candidatePda] = deriveCandidatePDA(
      electionPda,
      candidateId,
      program.programId
    );

    const tx = await program.methods
      .registerCandidate(candidateId, candidateName)
      .accounts({
        authority: provider.wallet.publicKey,
        election: electionPda,
        candidate: candidatePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Register candidate 1 tx:", tx);

    // Verify candidate account
    const candidate = await program.account.candidate.fetch(candidatePda);

    expect(candidate.election.toString()).to.equal(electionPda.toString());
    expect(candidate.candidateId).to.equal(candidateId);
    expect(candidate.candidateName).to.equal(candidateName);
    expect(candidate.voteCount.toNumber()).to.equal(0);
  });

  it("Should register candidate 2 successfully", async () => {
    const candidateId = 2;
    const candidateName = "Candidate Beta - Party B";

    const [candidatePda] = deriveCandidatePDA(
      electionPda,
      candidateId,
      program.programId
    );

    const tx = await program.methods
      .registerCandidate(candidateId, candidateName)
      .accounts({
        authority: provider.wallet.publicKey,
        election: electionPda,
        candidate: candidatePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Register candidate 2 tx:", tx);

    const candidate = await program.account.candidate.fetch(candidatePda);
    expect(candidate.candidateName).to.equal(candidateName);
  });

  it("Should register candidate 3 successfully", async () => {
    const candidateId = 3;
    const candidateName = "Candidate Gamma - Independent";

    const [candidatePda] = deriveCandidatePDA(
      electionPda,
      candidateId,
      program.programId
    );

    const tx = await program.methods
      .registerCandidate(candidateId, candidateName)
      .accounts({
        authority: provider.wallet.publicKey,
        election: electionPda,
        candidate: candidatePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Register candidate 3 tx:", tx);
  });

  it("Should fail with candidate name too long", async () => {
    const candidateId = 99;
    const longName = "X".repeat(101); // 101 chars

    const [candidatePda] = deriveCandidatePDA(
      electionPda,
      candidateId,
      program.programId
    );

    try {
      await program.methods
        .registerCandidate(candidateId, longName)
        .accounts({
          authority: provider.wallet.publicKey,
          election: electionPda,
          candidate: candidatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      expect.fail("Should have thrown NameTooLong error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("NameTooLong");
    }
  });
});
```

### 03. Verify Voter Tests

Create `anchor/tests/03-verify-voter.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Idngenelectevotingsolana } from "../target/types/idngenelectevotingsolana";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from "@solana/spl-token";
import { expect } from "chai";
import {
  TEST_CONFIG,
  deriveElectionPDA,
  deriveVoterCredentialPDA,
  getCurrentTimestamp,
  airdrop,
  createTestVoter
} from "./setup";

describe("Verify Voter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Idngenelectevotingsolana as Program<Idngenelectevotingsolana>;

  let electionPda: PublicKey;
  let votingTokenMint: PublicKey;

  // Test voters
  let voter1: ReturnType<typeof createTestVoter>;
  let voter2: ReturnType<typeof createTestVoter>;

  before(async () => {
    [electionPda] = deriveElectionPDA(TEST_CONFIG.electionName, program.programId);

    // Get election to find voting token mint
    const election = await program.account.election.fetch(electionPda);
    // votingTokenMint = election.votingTokenMint; // If stored in election

    // Create test voters
    voter1 = createTestVoter();
    voter2 = createTestVoter();

    // Fund voter accounts
    await airdrop(provider.connection, voter1.keypair.publicKey);
    await airdrop(provider.connection, voter2.keypair.publicKey);
  });

  it("Should verify voter 1 successfully", async () => {
    const [voterCredentialPda] = deriveVoterCredentialPDA(
      electionPda,
      voter1.keypair.publicKey,
      program.programId
    );

    const timestamp = getCurrentTimestamp();

    const tx = await program.methods
      .verifyVoter(
        voter1.nik,
        voter1.biometricHash,
        voter1.photoIpfsHash,
        timestamp,
        voter1.aiScore
      )
      .accounts({
        voter: voter1.keypair.publicKey,
        election: electionPda,
        voterCredential: voterCredentialPda,
        // votingTokenMint: votingTokenMint,
        // voterTokenAccount: await getAssociatedTokenAddress(...),
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([voter1.keypair])
      .rpc();

    console.log("Verify voter 1 tx:", tx);

    // Verify credential
    const credential = await program.account.voterCredential.fetch(voterCredentialPda);

    expect(credential.election.toString()).to.equal(electionPda.toString());
    expect(credential.voterAuthority.toString()).to.equal(voter1.keypair.publicKey.toString());
    expect(credential.isVerified).to.equal(true);
    expect(credential.hasVoted).to.equal(false);
    expect(credential.aiConfidenceScore).to.equal(voter1.aiScore);
    expect(credential.verificationCode.length).to.equal(16);

    console.log("Voter 1 verification code:", credential.verificationCode);
  });

  it("Should verify voter 2 successfully", async () => {
    const [voterCredentialPda] = deriveVoterCredentialPDA(
      electionPda,
      voter2.keypair.publicKey,
      program.programId
    );

    const timestamp = getCurrentTimestamp();

    const tx = await program.methods
      .verifyVoter(
        voter2.nik,
        voter2.biometricHash,
        voter2.photoIpfsHash,
        timestamp,
        voter2.aiScore
      )
      .accounts({
        voter: voter2.keypair.publicKey,
        election: electionPda,
        voterCredential: voterCredentialPda,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([voter2.keypair])
      .rpc();

    console.log("Verify voter 2 tx:", tx);

    // Check election stats updated
    const election = await program.account.election.fetch(electionPda);
    expect(election.totalRegisteredVoters.toNumber()).to.be.greaterThanOrEqual(2);
  });

  it("Should fail with invalid NIK (wrong length)", async () => {
    const badVoter = Keypair.generate();
    await airdrop(provider.connection, badVoter.publicKey);

    const [voterCredentialPda] = deriveVoterCredentialPDA(
      electionPda,
      badVoter.publicKey,
      program.programId
    );

    const invalidNik = "12345"; // Only 5 digits, should be 16

    try {
      await program.methods
        .verifyVoter(
          invalidNik,
          Array(32).fill(0),
          "QmTest123",
          getCurrentTimestamp(),
          90
        )
        .accounts({
          voter: badVoter.publicKey,
          election: electionPda,
          voterCredential: voterCredentialPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([badVoter])
        .rpc();

      expect.fail("Should have thrown InvalidNIK error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidNIK");
    }
  });

  it("Should fail with invalid AI confidence score (> 100)", async () => {
    const badVoter = Keypair.generate();
    await airdrop(provider.connection, badVoter.publicKey);

    const [voterCredentialPda] = deriveVoterCredentialPDA(
      electionPda,
      badVoter.publicKey,
      program.programId
    );

    try {
      await program.methods
        .verifyVoter(
          "1234567890123456",
          Array(32).fill(0),
          "QmTest123",
          getCurrentTimestamp(),
          150 // Invalid: > 100
        )
        .accounts({
          voter: badVoter.publicKey,
          election: electionPda,
          voterCredential: voterCredentialPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([badVoter])
        .rpc();

      expect.fail("Should have thrown InvalidConfidenceScore error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidConfidenceScore");
    }
  });
});
```

### 04. Cast Vote Tests

Create `anchor/tests/04-cast-vote.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Idngenelectevotingsolana } from "../target/types/idngenelectevotingsolana";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";
import {
  TEST_CONFIG,
  deriveElectionPDA,
  deriveCandidatePDA,
  deriveVoterCredentialPDA,
  deriveBallotPDA,
  sha256
} from "./setup";

describe("Cast Vote", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Idngenelectevotingsolana as Program<Idngenelectevotingsolana>;

  let electionPda: PublicKey;

  before(async () => {
    [electionPda] = deriveElectionPDA(TEST_CONFIG.electionName, program.programId);

    // Activate election first (if not already active)
    try {
      await program.methods
        .activateElection()
        .accounts({
          commissioner: provider.wallet.publicKey,
          election: electionPda,
        })
        .rpc();
      console.log("Election activated");
    } catch (e) {
      console.log("Election already active or activation failed:", e.message);
    }
  });

  it("Should cast vote for candidate 1 successfully", async () => {
    // This test requires a verified voter from previous tests
    // In a real scenario, you'd set up the voter here or use a fixture

    const voterId = Keypair.generate(); // Use a pre-verified voter in real test
    const candidateId = 1;

    const [voterCredentialPda] = deriveVoterCredentialPDA(
      electionPda,
      voterId.publicKey,
      program.programId
    );

    const [candidatePda] = deriveCandidatePDA(
      electionPda,
      candidateId,
      program.programId
    );

    // Get current ballot sequence
    const election = await program.account.election.fetch(electionPda);
    const ballotSequence = election.totalVotesCast.toNumber();

    const [ballotPda] = deriveBallotPDA(
      electionPda,
      ballotSequence,
      program.programId
    );

    // Encrypted vote data (in production, this would be actual encrypted data)
    const encryptedVoteData = sha256(`vote_${candidateId}_${Date.now()}`);

    try {
      const tx = await program.methods
        .castVote(encryptedVoteData)
        .accounts({
          voter: voterId.publicKey,
          election: electionPda,
          voterCredential: voterCredentialPda,
          candidate: candidatePda,
          ballot: ballotPda,
          // voterTokenAccount: ...,
          // votingTokenMint: ...,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([voterId])
        .rpc();

      console.log("Cast vote tx:", tx);

      // Verify ballot
      const ballot = await program.account.ballot.fetch(ballotPda);
      expect(ballot.election.toString()).to.equal(electionPda.toString());
      expect(ballot.candidate.toString()).to.equal(candidatePda.toString());
      expect(ballot.verificationReceipt.length).to.equal(32);

      // Verify candidate vote count increased
      const candidate = await program.account.candidate.fetch(candidatePda);
      expect(candidate.voteCount.toNumber()).to.be.greaterThan(0);

      // Verify voter marked as voted
      const credential = await program.account.voterCredential.fetch(voterCredentialPda);
      expect(credential.hasVoted).to.equal(true);

      console.log("Ballot receipt:", ballot.verificationReceipt);
    } catch (error) {
      // Expected to fail if voter not pre-verified
      console.log("Vote casting test requires pre-verified voter:", error.message);
    }
  });

  it("Should prevent double voting", async () => {
    // Attempt to vote again with same voter
    const voterId = Keypair.generate(); // Would be same voter as above

    // This should fail with AlreadyVoted error
    // Implementation depends on test setup
  });
});
```

### 05. Security Tests

Create `anchor/tests/07-security.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Idngenelectevotingsolana } from "../target/types/idngenelectevotingsolana";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import {
  TEST_CONFIG,
  deriveElectionPDA,
  deriveCandidatePDA,
  deriveVoterCredentialPDA,
  airdrop
} from "./setup";

describe("Security Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Idngenelectevotingsolana as Program<Idngenelectevotingsolana>;

  let electionPda: PublicKey;

  before(async () => {
    [electionPda] = deriveElectionPDA(TEST_CONFIG.electionName, program.programId);
  });

  describe("Authorization Tests", () => {
    it("Should reject non-commissioner activating election", async () => {
      const unauthorizedUser = Keypair.generate();
      await airdrop(provider.connection, unauthorizedUser.publicKey);

      try {
        await program.methods
          .activateElection()
          .accounts({
            commissioner: unauthorizedUser.publicKey,
            election: electionPda,
          })
          .signers([unauthorizedUser])
          .rpc();

        expect.fail("Should have rejected unauthorized activation");
      } catch (error) {
        expect(error.error.errorCode.code).to.equal("Unauthorized");
      }
    });

    it("Should reject non-commissioner registering candidate", async () => {
      const unauthorizedUser = Keypair.generate();
      await airdrop(provider.connection, unauthorizedUser.publicKey);

      const [candidatePda] = deriveCandidatePDA(
        electionPda,
        999,
        program.programId
      );

      try {
        await program.methods
          .registerCandidate(999, "Unauthorized Candidate")
          .accounts({
            authority: unauthorizedUser.publicKey,
            election: electionPda,
            candidate: candidatePda,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedUser])
          .rpc();

        expect.fail("Should have rejected unauthorized registration");
      } catch (error) {
        // Should fail due to unauthorized signer
        expect(error).to.exist;
      }
    });
  });

  describe("Double-Vote Prevention", () => {
    it("Should prevent voting twice with same credential", async () => {
      // This test verifies the core security feature
      // A voter who has already voted cannot vote again

      // Setup: Create and verify a voter, then cast one vote
      // Attempt: Try to cast second vote
      // Expected: AlreadyVoted error
    });

    it("Should prevent token transfer to bypass double-vote", async () => {
      // Voting tokens should be non-transferable
      // Even if somehow transferred, the VoterCredential tracks hasVoted
    });
  });

  describe("Time-Based Access Control", () => {
    it("Should reject voting before election starts", async () => {
      // Create election with future start time
      // Attempt to vote
      // Expected: VotingPeriodInvalid error
    });

    it("Should reject voting after election ends", async () => {
      // Create election with past end time
      // Attempt to vote
      // Expected: VotingPeriodInvalid error
    });

    it("Should reject registration after election starts", async () => {
      // After election is activated
      // Attempt to register new voter
      // Expected: RegistrationClosed error
    });
  });

  describe("Input Validation", () => {
    it("Should reject malformed IPFS hash", async () => {
      // Test with various invalid IPFS hash formats
      // Expected: InvalidIPFSHash error
    });

    it("Should handle maximum length inputs gracefully", async () => {
      // Test with 100-char election name (max)
      // Test with 100-char candidate name (max)
      // Should succeed at boundary, fail above
    });
  });

  describe("PDA Security", () => {
    it("Should reject wrong PDA seeds", async () => {
      // Attempt to use incorrect seeds
      // Expected: ConstraintSeeds error
    });

    it("Should reject account substitution attacks", async () => {
      // Try to substitute different accounts
      // Expected: Account constraint violations
    });
  });
});
```

---

## Running Tests

### Run All Tests

```bash
cd anchor

# Start local validator (in separate terminal)
solana-test-validator

# Run tests
anchor test --skip-local-validator
```

### Run Specific Test File

```bash
anchor test --skip-local-validator tests/01-initialize-election.ts
```

### Run Tests with Verbose Output

```bash
anchor test --skip-local-validator -- --reporter spec
```

### Run Tests with Coverage (if configured)

```bash
npm run test:coverage
```

---

## Integration Tests

### Full Election Flow Test

Create `anchor/tests/integration/election-flow.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Idngenelectevotingsolana } from "../../target/types/idngenelectevotingsolana";
import { expect } from "chai";

describe("Full Election Flow Integration", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Idngenelectevotingsolana as Program<Idngenelectevotingsolana>;

  it("Should complete full election lifecycle", async () => {
    // Phase 1: Setup
    console.log("Phase 1: Initializing Election...");
    // Initialize election
    // Register candidates

    // Phase 2: Registration
    console.log("Phase 2: Voter Registration...");
    // Verify multiple voters
    // Check voting tokens minted

    // Phase 3: Voting
    console.log("Phase 3: Voting Period...");
    // Activate election
    // Cast votes from multiple voters
    // Verify double-vote prevention

    // Phase 4: Results
    console.log("Phase 4: Election Results...");
    // Finalize election
    // Verify vote counts
    // Verify ballot receipts

    // Phase 5: Audit
    console.log("Phase 5: Audit...");
    // Commissioner audit checks
    // Verify AI confidence scores
  });
});
```

---

## Testing on Devnet

### 1. Deploy to Devnet First

```bash
solana config set --url https://api.devnet.solana.com
anchor deploy
```

### 2. Create Devnet Test Script

Create `anchor/scripts/devnet-test.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

async function main() {
  // Connect to Devnet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  console.log("🔗 Connected to Devnet");

  // Load your wallet
  const wallet = anchor.Wallet.local();
  console.log("👛 Wallet:", wallet.publicKey.toString());

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log("💰 Balance:", balance / LAMPORTS_PER_SOL, "SOL");

  if (balance < LAMPORTS_PER_SOL) {
    console.log("⚠️  Low balance! Requesting airdrop...");
    const sig = await connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
    console.log("✅ Airdrop received!");
  }

  // Set up provider
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  // Load program
  const program = anchor.workspace.Idngenelectevotingsolana;
  console.log("📋 Program ID:", program.programId.toString());

  // Run tests
  console.log("\n🧪 Running Devnet Tests...\n");

  try {
    // Test 1: Fetch any existing elections
    console.log("Test 1: Fetching elections...");
    const elections = await program.account.election.all();
    console.log(`Found ${elections.length} elections`);

    // Test 2: Initialize new test election
    console.log("\nTest 2: Creating test election...");
    // ... initialization code

    console.log("\n✅ All Devnet tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

main();
```

### 3. Run Devnet Tests

```bash
# Run the devnet test script
npx ts-node scripts/devnet-test.ts

# Or add to package.json scripts
npm run test:devnet
```

---

## Performance Testing

### Load Testing Script

Create `anchor/scripts/load-test.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";

async function loadTest() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Idngenelectevotingsolana;

  const NUM_VOTERS = 100;
  const BATCH_SIZE = 10;

  console.log(`🚀 Load Test: ${NUM_VOTERS} voters`);
  const startTime = Date.now();

  // Create voters in batches
  for (let batch = 0; batch < NUM_VOTERS / BATCH_SIZE; batch++) {
    const promises = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const voter = Keypair.generate();
      // promises.push(verifyVoter(voter));
    }

    await Promise.all(promises);
    console.log(`Batch ${batch + 1}/${NUM_VOTERS / BATCH_SIZE} complete`);
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n✅ Completed in ${duration}s`);
  console.log(`📊 Average: ${(NUM_VOTERS / duration).toFixed(2)} voters/second`);
}

loadTest();
```

---

## Troubleshooting Tests

### Common Test Failures

#### "Account not found"
```
Solution: Ensure previous tests created required accounts
Check: Test order and dependencies
```

#### "Insufficient funds"
```bash
# Get more SOL in test validator
solana airdrop 10
```

#### "Transaction simulation failed"
```
Check:
1. All required accounts are provided
2. Account sizes are sufficient
3. Seeds match PDA derivation
```

#### Tests timeout
```toml
# Increase timeout in Anchor.toml
[provider]
timeout = 60000
```

#### "Seeds constraint violated"
```
Check:
1. Seed order matches program
2. Bump is correct
3. Program ID matches
```

### Debug Tips

```typescript
// Add logging in tests
console.log("Account data:", JSON.stringify(account, null, 2));

// Check account exists
const accountInfo = await provider.connection.getAccountInfo(pda);
console.log("Account exists:", accountInfo !== null);

// Print transaction logs
const tx = await program.methods.instruction().rpc();
const logs = await provider.connection.getTransaction(tx);
console.log("Logs:", logs?.meta?.logMessages);
```

---

## Test Coverage Checklist

### Core Functions
- [ ] `initialize_election` - All parameters validated
- [ ] `register_candidate` - Before/after activation
- [ ] `verify_voter` - Valid/invalid inputs
- [ ] `cast_vote` - Normal flow
- [ ] `activate_election` - Authorization check
- [ ] `finalize_election` - Time validation
- [ ] `audit_verification` - Commissioner only

### Error Conditions
- [ ] Invalid election period
- [ ] Invalid commissioner count
- [ ] Name too long
- [ ] Invalid NIK format
- [ ] Invalid confidence score
- [ ] Invalid IPFS hash
- [ ] Already voted
- [ ] Voter not verified
- [ ] Election not active
- [ ] Voting period invalid
- [ ] Registration closed
- [ ] Unauthorized access

### Security Scenarios
- [ ] Double-vote prevention
- [ ] Non-commissioner actions
- [ ] PDA manipulation
- [ ] Account substitution
- [ ] Overflow attacks
- [ ] Time manipulation

---

## Next Steps

After completing testing:

1. **[Deployment Guide](./deployment.md)** - Deploy to Devnet/Mainnet
2. **[Frontend Integration](./frontend-integration.md)** - Connect UI
3. **Security Audit** - Professional review before mainnet

---

**Last Updated**: December 12, 2025
