# Frontend Integration Guide

## Overview

This guide covers integrating the Indonesia E-Voting smart contract with a Next.js frontend application using Solana wallet adapters and the Anchor framework.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Wallet Integration](#wallet-integration)
4. [Program Integration](#program-integration)
5. [Building UI Components](#building-ui-components)
6. [Complete Voting Flow](#complete-voting-flow)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Deployment Considerations](#deployment-considerations)

---

## Prerequisites

### Required Knowledge
- React/Next.js fundamentals
- TypeScript basics
- Understanding of Solana concepts (from concept docs)

### Required Software
- Node.js 18+ and npm/yarn
- Deployed smart contract (see [Deployment Guide](./deployment.md))
- Program ID from deployment

### Your Project Structure
```
idn-genelect-evoting-solana/
├── anchor/                    # Smart contract
│   ├── target/
│   │   └── idl/
│   │       └── idngenelectevotingsolana.json  # Generated IDL
│   └── programs/
├── src/                       # Next.js frontend
│   ├── app/
│   ├── components/
│   └── features/
└── package.json
```

---

## Project Setup

### 1. Install Dependencies

```bash
# Core Solana packages
npm install @solana/web3.js @solana/spl-token

# Anchor client
npm install @coral-xyz/anchor

# Wallet adapter packages
npm install @solana/wallet-adapter-base \
            @solana/wallet-adapter-react \
            @solana/wallet-adapter-react-ui \
            @solana/wallet-adapter-wallets

# UI helpers (optional but recommended)
npm install @tanstack/react-query
```

### 2. Copy IDL to Frontend

```bash
# Copy the generated IDL to your frontend
cp anchor/target/idl/idngenelectevotingsolana.json src/lib/idl/

# Also copy TypeScript types
cp anchor/target/types/idngenelectevotingsolana.ts src/lib/types/
```

### 3. Configure Environment Variables

Create `.env.local`:

```bash
# Network Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Program Configuration
NEXT_PUBLIC_PROGRAM_ID=Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe

# IPFS Configuration (for photo uploads)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

---

## Wallet Integration

### 1. Create Wallet Context Provider

Create `src/providers/WalletProvider.tsx`:

```tsx
'use client';

import { FC, ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletProvider: FC<Props> = ({ children }) => {
  // Configure network
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'mainnet-beta';
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network),
    [network]
  );

  // Configure wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
```

### 2. Add Provider to App Layout

Update `src/app/layout.tsx`:

```tsx
import { WalletProvider } from '@/providers/WalletProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
```

### 3. Create Wallet Connect Button

Create `src/components/WalletButton.tsx`:

```tsx
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="flex items-center gap-4">
      <WalletMultiButton />
      {connected && publicKey && (
        <span className="text-sm text-gray-600">
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </span>
      )}
    </div>
  );
}
```

---

## Program Integration

### 1. Create Anchor Program Hook

Create `src/hooks/useProgram.ts`:

```typescript
'use client';

import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

// Import IDL
import idl from '@/lib/idl/idngenelectevotingsolana.json';
import { Idngenelectevotingsolana } from '@/lib/types/idngenelectevotingsolana';

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }

    return new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;

    return new Program<Idngenelectevotingsolana>(
      idl as Idl,
      PROGRAM_ID,
      provider
    );
  }, [provider]);

  return {
    program,
    provider,
    programId: PROGRAM_ID,
    connected: wallet.connected,
    publicKey: wallet.publicKey,
  };
}
```

### 2. Create PDA Derivation Utilities

Create `src/lib/pda.ts`:

```typescript
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

export function deriveElectionPDA(electionName: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('election'), Buffer.from(electionName)],
    PROGRAM_ID
  );
}

export function deriveCandidatePDA(
  electionPda: PublicKey,
  candidateId: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('candidate'),
      electionPda.toBuffer(),
      new anchor.BN(candidateId).toArrayLike(Buffer, 'le', 4),
    ],
    PROGRAM_ID
  );
}

export function deriveVoterCredentialPDA(
  electionPda: PublicKey,
  voterPubkey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('voter_credential'),
      electionPda.toBuffer(),
      voterPubkey.toBuffer(),
    ],
    PROGRAM_ID
  );
}

export function deriveBallotPDA(
  electionPda: PublicKey,
  ballotSequence: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('ballot'),
      electionPda.toBuffer(),
      new anchor.BN(ballotSequence).toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_ID
  );
}
```

### 3. Create Election Data Hook

Create `src/hooks/useElection.ts`:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from './useProgram';
import { deriveElectionPDA, deriveCandidatePDA } from '@/lib/pda';

interface Election {
  authority: PublicKey;
  electionName: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  totalRegisteredVoters: number;
  totalVotesCast: number;
  commissioners: PublicKey[];
  requiredSignatures: number;
}

interface Candidate {
  election: PublicKey;
  candidateId: number;
  candidateName: string;
  voteCount: number;
}

export function useElection(electionName: string) {
  const { program } = useProgram();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [electionPda] = deriveElectionPDA(electionName);

  const fetchElection = useCallback(async () => {
    if (!program) return;

    setLoading(true);
    setError(null);

    try {
      const electionAccount = await program.account.election.fetch(electionPda);

      setElection({
        authority: electionAccount.authority,
        electionName: electionAccount.electionName,
        startTime: electionAccount.startTime.toNumber(),
        endTime: electionAccount.endTime.toNumber(),
        isActive: electionAccount.isActive,
        totalRegisteredVoters: electionAccount.totalRegisteredVoters.toNumber(),
        totalVotesCast: electionAccount.totalVotesCast.toNumber(),
        commissioners: electionAccount.commissioners,
        requiredSignatures: electionAccount.requiredSignatures,
      });

      // Fetch all candidates for this election
      const candidateAccounts = await program.account.candidate.all([
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: electionPda.toBase58(),
          },
        },
      ]);

      setCandidates(
        candidateAccounts.map((c) => ({
          election: c.account.election,
          candidateId: c.account.candidateId,
          candidateName: c.account.candidateName,
          voteCount: c.account.voteCount.toNumber(),
        }))
      );
    } catch (err: any) {
      console.error('Error fetching election:', err);
      setError(err.message || 'Failed to fetch election');
    } finally {
      setLoading(false);
    }
  }, [program, electionPda]);

  useEffect(() => {
    fetchElection();
  }, [fetchElection]);

  return {
    election,
    candidates,
    electionPda,
    loading,
    error,
    refetch: fetchElection,
  };
}
```

### 4. Create Voter Credential Hook

Create `src/hooks/useVoterCredential.ts`:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from './useProgram';
import { deriveVoterCredentialPDA, deriveElectionPDA } from '@/lib/pda';

interface VoterCredential {
  election: PublicKey;
  voterAuthority: PublicKey;
  isVerified: boolean;
  hasVoted: boolean;
  verificationTimestamp: number;
  voteTimestamp: number | null;
  aiConfidenceScore: number;
  verificationCode: string;
}

export function useVoterCredential(electionName: string) {
  const { program, publicKey } = useProgram();
  const [credential, setCredential] = useState<VoterCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [electionPda] = deriveElectionPDA(electionName);

  const fetchCredential = useCallback(async () => {
    if (!program || !publicKey) {
      setCredential(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [voterCredentialPda] = deriveVoterCredentialPDA(electionPda, publicKey);

      const credentialAccount = await program.account.voterCredential.fetch(
        voterCredentialPda
      );

      setCredential({
        election: credentialAccount.election,
        voterAuthority: credentialAccount.voterAuthority,
        isVerified: credentialAccount.isVerified,
        hasVoted: credentialAccount.hasVoted,
        verificationTimestamp: credentialAccount.verificationTimestamp.toNumber(),
        voteTimestamp: credentialAccount.voteTimestamp?.toNumber() || null,
        aiConfidenceScore: credentialAccount.aiConfidenceScore,
        verificationCode: credentialAccount.verificationCode,
      });
    } catch (err: any) {
      // Account doesn't exist = voter not registered
      if (err.message?.includes('Account does not exist')) {
        setCredential(null);
      } else {
        console.error('Error fetching credential:', err);
        setError(err.message || 'Failed to fetch voter credential');
      }
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, electionPda]);

  useEffect(() => {
    fetchCredential();
  }, [fetchCredential]);

  return {
    credential,
    loading,
    error,
    refetch: fetchCredential,
    isRegistered: credential !== null,
    canVote: credential?.isVerified && !credential?.hasVoted,
  };
}
```

---

## Building UI Components

### 1. Election Info Card

Create `src/components/election/ElectionCard.tsx`:

```tsx
'use client';

import { useElection } from '@/hooks/useElection';

interface ElectionCardProps {
  electionName: string;
}

export function ElectionCard({ electionName }: ElectionCardProps) {
  const { election, candidates, loading, error } = useElection(electionName);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-48" />
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-600">Election not found</p>
      </div>
    );
  }

  const now = Date.now() / 1000;
  const status = !election.isActive
    ? 'Not Active'
    : now < election.startTime
    ? 'Upcoming'
    : now > election.endTime
    ? 'Ended'
    : 'Active';

  const statusColor = {
    'Not Active': 'bg-gray-100 text-gray-600',
    'Upcoming': 'bg-blue-100 text-blue-600',
    'Active': 'bg-green-100 text-green-600',
    'Ended': 'bg-red-100 text-red-600',
  }[status];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold">{election.electionName}</h2>
        <span className={`px-3 py-1 rounded-full text-sm ${statusColor}`}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-gray-500 text-sm">Registered Voters</p>
          <p className="text-xl font-semibold">
            {election.totalRegisteredVoters.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Votes Cast</p>
          <p className="text-xl font-semibold">
            {election.totalVotesCast.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Start Time</p>
          <p className="text-sm">
            {new Date(election.startTime * 1000).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">End Time</p>
          <p className="text-sm">
            {new Date(election.endTime * 1000).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Candidates */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Candidates</h3>
        <div className="space-y-2">
          {candidates
            .sort((a, b) => b.voteCount - a.voteCount)
            .map((candidate) => (
              <div
                key={candidate.candidateId}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <span>{candidate.candidateName}</span>
                <span className="font-semibold">
                  {candidate.voteCount.toLocaleString()} votes
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
```

### 2. Voter Registration Component

Create `src/components/voter/VoterRegistration.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { useProgram } from '@/hooks/useProgram';
import { useVoterCredential } from '@/hooks/useVoterCredential';
import { deriveElectionPDA, deriveVoterCredentialPDA } from '@/lib/pda';
import { uploadToIPFS } from '@/lib/ipfs';
import { sha256 } from '@/lib/crypto';

interface VoterRegistrationProps {
  electionName: string;
  onSuccess?: () => void;
}

export function VoterRegistration({
  electionName,
  onSuccess,
}: VoterRegistrationProps) {
  const { program, publicKey } = useProgram();
  const { credential, isRegistered, refetch } = useVoterCredential(electionName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [nik, setNik] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [biometricData, setBiometricData] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!program || !publicKey) {
      setError('Please connect your wallet');
      return;
    }

    if (nik.length !== 16) {
      setError('NIK must be exactly 16 digits');
      return;
    }

    if (!photo) {
      setError('Please upload your photo with ID card');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload photo to IPFS
      const photoIpfsHash = await uploadToIPFS(photo);
      console.log('Photo uploaded to IPFS:', photoIpfsHash);

      // 2. Create biometric hash
      const biometricHash = sha256(biometricData || `biometric_${publicKey.toString()}`);

      // 3. Derive PDAs
      const [electionPda] = deriveElectionPDA(electionName);
      const [voterCredentialPda] = deriveVoterCredentialPDA(electionPda, publicKey);

      // 4. Get timestamp
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000));

      // 5. Call verify_voter instruction
      const tx = await program.methods
        .verifyVoter(
          nik,
          biometricHash,
          photoIpfsHash,
          timestamp,
          95 // AI confidence score (in production, this comes from AI service)
        )
        .accounts({
          voter: publicKey,
          election: electionPda,
          voterCredential: voterCredentialPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log('Registration transaction:', tx);

      // 6. Refetch credential
      await refetch();
      onSuccess?.();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          ✅ You are registered!
        </h3>
        <p className="text-green-600 mb-4">
          Your verification code:{' '}
          <code className="bg-green-100 px-2 py-1 rounded">
            {credential?.verificationCode}
          </code>
        </p>
        <p className="text-sm text-green-600">
          AI Confidence Score: {credential?.aiConfidenceScore}%
        </p>
        {credential?.hasVoted && (
          <p className="text-sm text-green-600 mt-2">
            You have already voted in this election.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          NIK (National Identity Number)
        </label>
        <input
          type="text"
          value={nik}
          onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
          placeholder="Enter 16-digit NIK"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          maxLength={16}
          required
        />
        <p className="text-xs text-gray-500 mt-1">{nik.length}/16 digits</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Photo with ID Card
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Take a selfie holding your ID card
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Biometric Data (Optional)
        </label>
        <input
          type="text"
          value={biometricData}
          onChange={(e) => setBiometricData(e.target.value)}
          placeholder="Biometric verification data"
          className="w-full px-4 py-2 border rounded-lg"
        />
        <p className="text-xs text-gray-500 mt-1">
          In production, this comes from biometric scanner
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !publicKey}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white ${
          loading || !publicKey
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Registering...' : 'Register as Voter'}
      </button>

      {!publicKey && (
        <p className="text-center text-sm text-gray-500">
          Please connect your wallet to register
        </p>
      )}
    </form>
  );
}
```

### 3. Voting Component

Create `src/components/voter/VotingBooth.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { useProgram } from '@/hooks/useProgram';
import { useElection } from '@/hooks/useElection';
import { useVoterCredential } from '@/hooks/useVoterCredential';
import {
  deriveElectionPDA,
  deriveCandidatePDA,
  deriveVoterCredentialPDA,
  deriveBallotPDA,
} from '@/lib/pda';
import { sha256 } from '@/lib/crypto';

interface VotingBoothProps {
  electionName: string;
  onVoteSuccess?: (receipt: string) => void;
}

export function VotingBooth({ electionName, onVoteSuccess }: VotingBoothProps) {
  const { program, publicKey } = useProgram();
  const { election, candidates, electionPda, refetch: refetchElection } = useElection(electionName);
  const { credential, canVote, refetch: refetchCredential } = useVoterCredential(electionName);

  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);

  const handleVote = async () => {
    if (!program || !publicKey || selectedCandidate === null) {
      setError('Please select a candidate');
      return;
    }

    if (!canVote) {
      setError('You are not eligible to vote');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Derive PDAs
      const [voterCredentialPda] = deriveVoterCredentialPDA(electionPda, publicKey);
      const [candidatePda] = deriveCandidatePDA(electionPda, selectedCandidate);

      // Get current ballot sequence
      const ballotSequence = election?.totalVotesCast || 0;
      const [ballotPda] = deriveBallotPDA(electionPda, ballotSequence);

      // Create encrypted vote data
      const encryptedVoteData = sha256(
        `vote_${selectedCandidate}_${publicKey.toString()}_${Date.now()}`
      );

      // Cast vote
      const tx = await program.methods
        .castVote(encryptedVoteData)
        .accounts({
          voter: publicKey,
          election: electionPda,
          voterCredential: voterCredentialPda,
          candidate: candidatePda,
          ballot: ballotPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('Vote transaction:', tx);

      // Fetch ballot to get receipt
      const ballot = await program.account.ballot.fetch(ballotPda);
      const ballotReceipt = ballot.verificationReceipt;

      setReceipt(ballotReceipt);
      onVoteSuccess?.(ballotReceipt);

      // Refetch data
      await Promise.all([refetchElection(), refetchCredential()]);
    } catch (err: any) {
      console.error('Voting error:', err);
      setError(err.message || 'Failed to cast vote');
    } finally {
      setLoading(false);
    }
  };

  // Already voted
  if (credential?.hasVoted) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold text-blue-800 mb-2">
          🗳️ Vote Recorded
        </h3>
        <p className="text-blue-600 mb-4">
          You have already cast your vote in this election.
        </p>
        <p className="text-sm text-blue-500">
          Thank you for participating in democracy!
        </p>
      </div>
    );
  }

  // Not registered
  if (!credential?.isVerified) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold text-yellow-800 mb-2">
          ⚠️ Not Registered
        </h3>
        <p className="text-yellow-600">
          You need to register and verify your identity before voting.
        </p>
      </div>
    );
  }

  // Vote success
  if (receipt) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold text-green-800 mb-4">
          ✅ Vote Cast Successfully!
        </h3>
        <div className="bg-white rounded p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2">Your Ballot Receipt:</p>
          <code className="text-lg font-mono break-all">{receipt}</code>
        </div>
        <p className="text-sm text-green-600">
          Save this receipt to verify your vote was counted.
        </p>
      </div>
    );
  }

  // Voting booth
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Select Your Candidate</h3>

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <button
            key={candidate.candidateId}
            onClick={() => setSelectedCandidate(candidate.candidateId)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedCandidate === candidate.candidateId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedCandidate === candidate.candidateId
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedCandidate === candidate.candidateId && (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </div>
              <span className="font-medium">{candidate.candidateName}</span>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleVote}
        disabled={loading || selectedCandidate === null}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white ${
          loading || selectedCandidate === null
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {loading ? 'Casting Vote...' : 'Cast Vote'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your vote is anonymous and cannot be changed after submission.
      </p>
    </div>
  );
}
```

### 4. Ballot Receipt Verification

Create `src/components/voter/VerifyReceipt.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useProgram } from '@/hooks/useProgram';
import { deriveElectionPDA, deriveBallotPDA } from '@/lib/pda';

interface VerifyReceiptProps {
  electionName: string;
}

export function VerifyReceipt({ electionName }: VerifyReceiptProps) {
  const { program } = useProgram();
  const [receipt, setReceipt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    timestamp?: number;
    ballotSequence?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!program || !receipt) {
      setError('Please enter your ballot receipt');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const [electionPda] = deriveElectionPDA(electionName);

      // Search through ballots (in production, use indexed search)
      const ballots = await program.account.ballot.all([
        {
          memcmp: {
            offset: 8,
            bytes: electionPda.toBase58(),
          },
        },
      ]);

      const matchingBallot = ballots.find(
        (b) => b.account.verificationReceipt === receipt
      );

      if (matchingBallot) {
        setResult({
          found: true,
          timestamp: matchingBallot.account.timestamp.toNumber(),
          ballotSequence: matchingBallot.account.ballotSequence.toNumber(),
        });
      } else {
        setResult({ found: false });
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Verify Your Vote</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ballot Receipt
        </label>
        <input
          type="text"
          value={receipt}
          onChange={(e) => setReceipt(e.target.value)}
          placeholder="Enter your 32-character receipt"
          className="w-full px-4 py-2 border rounded-lg font-mono"
        />
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || !receipt}
        className={`w-full py-2 px-4 rounded-lg font-semibold text-white ${
          loading || !receipt
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Verifying...' : 'Verify Receipt'}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg p-4 ${
            result.found
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {result.found ? (
            <>
              <p className="font-semibold text-green-800">
                ✅ Vote Verified!
              </p>
              <p className="text-sm text-green-600 mt-2">
                Ballot #{result.ballotSequence} was recorded on{' '}
                {new Date(result.timestamp! * 1000).toLocaleString()}
              </p>
              <p className="text-xs text-green-500 mt-1">
                Note: The candidate you voted for is not revealed for privacy.
              </p>
            </>
          ) : (
            <p className="font-semibold text-red-800">
              ❌ Receipt not found. Please check and try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Helper Utilities

### IPFS Upload Helper

Create `src/lib/ipfs.ts`:

```typescript
export async function uploadToIPFS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY!,
      'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload to IPFS');
  }

  const result = await response.json();
  return result.IpfsHash;
}

export function getIPFSUrl(hash: string): string {
  return `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${hash}`;
}
```

### Crypto Helper

Create `src/lib/crypto.ts`:

```typescript
export function sha256(data: string): number[] {
  // Using Web Crypto API (browser-compatible)
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // For synchronous use, we'll use a simple implementation
  // In production, use the actual Web Crypto API with async/await
  return Array.from(
    new Uint8Array(
      // Simple hash for demo - use proper crypto in production
      dataBuffer.reduce((hash, byte) => {
        hash = ((hash << 5) - hash) + byte;
        return hash & hash;
      }, 0)
    ).buffer
  ).slice(0, 32);
}

// Async version using Web Crypto API
export async function sha256Async(data: string): Promise<number[]> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer));
}
```

---

## Complete Voting Page

Create `src/app/vote/[election]/page.tsx`:

```tsx
'use client';

import { use } from 'react';
import { WalletButton } from '@/components/WalletButton';
import { ElectionCard } from '@/components/election/ElectionCard';
import { VoterRegistration } from '@/components/voter/VoterRegistration';
import { VotingBooth } from '@/components/voter/VotingBooth';
import { VerifyReceipt } from '@/components/voter/VerifyReceipt';
import { useVoterCredential } from '@/hooks/useVoterCredential';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

interface PageProps {
  params: Promise<{ election: string }>;
}

export default function VotePage({ params }: PageProps) {
  const { election: electionName } = use(params);
  const { connected } = useWallet();
  const { isRegistered, canVote, credential } = useVoterCredential(electionName);
  const [activeTab, setActiveTab] = useState<'vote' | 'register' | 'verify'>('vote');

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Indonesia E-Voting</h1>
          <WalletButton />
        </div>

        {/* Election Info */}
        <div className="mb-8">
          <ElectionCard electionName={electionName} />
        </div>

        {/* Not Connected */}
        {!connected && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your Solana wallet to participate in the election.
            </p>
            <WalletButton />
          </div>
        )}

        {/* Connected - Show tabs */}
        {connected && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('vote')}
                className={`flex-1 py-4 px-6 font-medium ${
                  activeTab === 'vote'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Vote
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-4 px-6 font-medium ${
                  activeTab === 'register'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Register
              </button>
              <button
                onClick={() => setActiveTab('verify')}
                className={`flex-1 py-4 px-6 font-medium ${
                  activeTab === 'verify'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Verify
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'vote' && (
                <VotingBooth electionName={electionName} />
              )}
              {activeTab === 'register' && (
                <VoterRegistration
                  electionName={electionName}
                  onSuccess={() => setActiveTab('vote')}
                />
              )}
              {activeTab === 'verify' && (
                <VerifyReceipt electionName={electionName} />
              )}
            </div>
          </div>
        )}

        {/* Status Bar */}
        {connected && (
          <div className="mt-4 text-center text-sm text-gray-500">
            {isRegistered ? (
              <span className="text-green-600">✅ Registered</span>
            ) : (
              <span className="text-yellow-600">⚠️ Not Registered</span>
            )}
            {' | '}
            {credential?.hasVoted ? (
              <span className="text-blue-600">🗳️ Voted</span>
            ) : canVote ? (
              <span className="text-green-600">✅ Can Vote</span>
            ) : (
              <span className="text-gray-600">Cannot Vote</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Error Handling

### Create Error Decoder

Create `src/lib/errors.ts`:

```typescript
// Map program error codes to user-friendly messages
export const ERROR_MESSAGES: Record<string, string> = {
  InvalidCommissionerCount: 'Invalid number of election commissioners',
  InvalidElectionPeriod: 'Election end time must be after start time',
  NameTooLong: 'Name exceeds maximum length of 100 characters',
  ElectionAlreadyActive: 'This election is already active',
  ElectionNotActive: 'This election is not currently active',
  ElectionNotStarted: 'The election has not started yet',
  ElectionStillActive: 'The election is still active',
  InvalidNIK: 'NIK must be exactly 16 digits',
  InvalidIPFSHash: 'Invalid IPFS hash format',
  InvalidConfidenceScore: 'AI confidence score must be between 0 and 100',
  RegistrationClosed: 'Voter registration is closed',
  AlreadyVoted: 'You have already voted in this election',
  VoterNotVerified: 'You must be verified before voting',
  VotingPeriodInvalid: 'Voting is not allowed at this time',
  Overflow: 'Arithmetic overflow error',
  Unauthorized: 'You are not authorized to perform this action',
};

export function decodeError(error: any): string {
  // Check for Anchor error
  if (error?.error?.errorCode?.code) {
    const code = error.error.errorCode.code;
    return ERROR_MESSAGES[code] || `Error: ${code}`;
  }

  // Check for transaction error
  if (error?.logs) {
    const errorLog = error.logs.find((log: string) =>
      log.includes('Error Code:')
    );
    if (errorLog) {
      const match = errorLog.match(/Error Code: (\w+)/);
      if (match) {
        return ERROR_MESSAGES[match[1]] || `Error: ${match[1]}`;
      }
    }
  }

  // Default message
  return error.message || 'An unexpected error occurred';
}
```

### Use in Components

```tsx
import { decodeError } from '@/lib/errors';

try {
  // ... transaction code
} catch (err: any) {
  setError(decodeError(err));
}
```

---

## Best Practices

### 1. Transaction Confirmation

```typescript
// Wait for confirmation before updating UI
const tx = await program.methods.instruction().rpc();
await connection.confirmTransaction(tx, 'confirmed');
```

### 2. Preflight Checks

```typescript
// Simulate transaction before sending
const tx = await program.methods
  .instruction()
  .accounts({...})
  .transaction();

const simulation = await connection.simulateTransaction(tx);
if (simulation.value.err) {
  throw new Error(`Simulation failed: ${simulation.value.err}`);
}
```

### 3. Loading States

```tsx
// Always show loading states
{loading ? (
  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
) : (
  <ComponentContent />
)}
```

### 4. Optimistic Updates

```typescript
// Update UI immediately, then verify
setOptimisticState(newValue);

try {
  await program.methods.instruction().rpc();
} catch {
  // Revert on failure
  setOptimisticState(previousValue);
}
```

---

## Deployment Considerations

### Environment Variables for Production

```bash
# .env.production
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://your-mainnet-rpc.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_MAINNET_PROGRAM_ID
```

### RPC Rate Limiting

```typescript
// Use connection pooling and caching
const connection = new Connection(endpoint, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  disableRetryOnRateLimit: false,
});
```

### Security Headers

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

---

## Testing Frontend

### Unit Tests

```typescript
// __tests__/hooks/useElection.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useElection } from '@/hooks/useElection';

describe('useElection', () => {
  it('should fetch election data', async () => {
    const { result } = renderHook(() => useElection('TestElection'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.election).toBeDefined();
  });
});
```

### E2E Tests

```typescript
// cypress/e2e/voting.cy.ts
describe('Voting Flow', () => {
  it('should complete full voting flow', () => {
    cy.visit('/vote/TestElection');
    cy.get('[data-testid="wallet-connect"]').click();
    // ... continue test
  });
});
```

---

## Next Steps

After frontend integration:

1. **User Testing** - Test with real users on Devnet
2. **Security Audit** - Review frontend security
3. **Performance Optimization** - Optimize bundle size and loading
4. **Accessibility** - Ensure WCAG compliance
5. **Monitoring** - Set up error tracking (Sentry, etc.)

---

## Resources

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Anchor Client Docs](https://www.anchor-lang.com/docs/client)
- [Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- [Next.js Docs](https://nextjs.org/docs)

---

**Last Updated**: December 12, 2025
