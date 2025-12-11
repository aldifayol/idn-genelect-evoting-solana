# Indonesia General Election E-Voting Smart Contract

## Overview

This is a comprehensive Solana smart contract built with Anchor framework for conducting general elections in Indonesia with blockchain-based voter verification and anonymous voting.

## Architecture

### Key Features

1. **Anonymous Voting with Public Verification**
   - Voter identity is cryptographically separated from vote choice
   - Each voter receives a unique verification code to confirm their vote was counted
   - Ballot receipts allow voters to verify their participation without revealing their choice

2. **Biometric Verification with NFT Credentials**
   - Stores cryptographic hashes on-chain (not raw biometric data)
   - Supports retina scan, face recognition, and fingerprint verification
   - Voter selfie + ID card photo stored on IPFS (encrypted)
   - AI confidence score tracked for audit purposes

3. **NFT-Based Voting Tokens**
   - One non-transferable voting token per verified voter
   - Token is burned when vote is cast (prevents double-voting)
   - SPL Token standard ensures compatibility with Solana ecosystem

4. **Multi-Signature Election Management**
   - Critical operations require multiple election commissioners
   - Transparent initialization and finalization procedures
   - Support for re-elections by starting new election periods

## Smart Contract Structure

### Core Modules

```
anchor/programs/idngenelectevotingsolana/src/
├── lib.rs                          # Main entry point with counter (preserved)
├── state.rs                        # Account structures and data models
├── errors.rs                       # Custom error definitions
├── utils.rs                        # Helper functions
└── instructions/
    ├── initialize_election.rs      # Election setup
    ├── register_candidate.rs       # Candidate registration
    ├── verify_voter.rs             # Biometric verification & NFT minting
    ├── cast_vote.rs                # Anonymous ballot casting
    ├── manage_election.rs          # Activate/finalize election
    └── audit.rs                    # Commissioner audit functions
```

### Account Structures

#### 1. Election
Main election configuration and state.
```rust
pub struct Election {
    pub authority: Pubkey,
    pub election_name: String,          // Max 100 chars
    pub start_time: i64,
    pub end_time: i64,
    pub is_active: bool,
    pub total_registered_voters: u64,
    pub total_votes_cast: u64,
    pub commissioners: Vec<Pubkey>,     // Max 10 commissioners
    pub required_signatures: u8,
    pub bump: u8,
}
```

#### 2. Candidate
Represents a candidate in the election.
```rust
pub struct Candidate {
    pub election: Pubkey,
    pub candidate_id: u32,
    pub candidate_name: String,         // Max 100 chars
    pub vote_count: u64,
    pub bump: u8,
}
```

#### 3. VoterCredential (NFT)
Proof of voter identity verification.
```rust
pub struct VoterCredential {
    pub election: Pubkey,
    pub voter_authority: Pubkey,
    pub voter_nik_hash: [u8; 32],      // SHA-256 of NIK
    pub biometric_hash: [u8; 32],       // SHA-256 of biometric data
    pub photo_ipfs_hash: String,        // IPFS hash (encrypted photo)
    pub is_verified: bool,
    pub has_voted: bool,
    pub verification_timestamp: i64,
    pub vote_timestamp: Option<i64>,
    pub ai_confidence_score: u8,        // 0-100
    pub verification_code: String,      // 16-char code for voter
    pub bump: u8,
}
```

#### 4. Ballot
Anonymous vote record.
```rust
pub struct Ballot {
    pub election: Pubkey,
    pub candidate: Pubkey,
    pub encrypted_vote_data: [u8; 32],  // Additional encryption layer
    pub timestamp: i64,
    pub ballot_sequence: u64,           // For verification
    pub verification_receipt: String,    // 32-char receipt
    pub bump: u8,
}
```

## Instruction Flow

### Phase 1: Election Setup

```
1. initialize_election()
   - Authority: Election Commission
   - Creates election account and voting token mint
   - Sets election period and commissioners

2. register_candidate()
   - Authority: Election Commissioner
   - Can only be done before election activation
   - Multiple candidates can be registered
```

### Phase 2: Voter Registration

```
3. verify_voter()
   - Authority: Individual Voter
   - Submits biometric hash and IPFS photo hash
   - Receives:
     * VoterCredential NFT
     * 1 Voting Token
     * Unique 16-character verification code
   - Can only register before election starts
```

### Phase 3: Voting Period

```
4. activate_election()
   - Authority: Commissioner
   - Can only activate after start_time
   - Opens voting period

5. cast_vote()
   - Authority: Verified Voter
   - Burns voting token (prevents double-voting)
   - Creates anonymous ballot
   - Increments candidate vote count
   - Returns 32-character ballot receipt

6. verify_ballot_receipt()
   - Authority: Voter
   - Allows voter to verify their vote was counted
   - Does NOT reveal vote choice
```

### Phase 4: Election Closure

```
7. finalize_election()
   - Authority: Commissioner
   - Can only finalize after end_time
   - Closes voting period
   - Results remain on-chain permanently

8. audit_verification() [Optional]
   - Authority: Commissioner only
   - Reviews AI confidence scores
   - Checks verification integrity
   - For testing AI verification system
```

## Security Features

### Privacy Protection
- **Ballot Secrecy**: Vote choice is cryptographically separated from voter identity
- **No Raw Biometric Data**: Only SHA-256 hashes stored on-chain
- **Encrypted Off-Chain Storage**: Photos and biometric data encrypted on IPFS
- **Anonymous Ballot Records**: No link between ballot and voter identity

### Anti-Fraud Measures
- **One-Person-One-Vote**: Enforced by burning voting tokens
- **Token-Based Access Control**: Only verified voters can cast votes
- **Time-Bound Operations**: Registration and voting have strict time windows
- **Multi-Signature Controls**: Critical operations require multiple commissioners

### Audit Trail
- **Verification Timestamps**: Every action timestamped
- **AI Confidence Scores**: Track biometric verification quality
- **Sequential Ballot Numbers**: Enables vote counting verification
- **Commissioner Audit Access**: Special functions for integrity checks

## Data Privacy Compliance

### On-Chain Data
- NIK (National Identity Number): SHA-256 hash only
- Biometric Data: SHA-256 hash only
- Photo: IPFS hash (pointer to encrypted data)
- Voter Identity: Public key only

### Off-Chain Data (IPFS)
- Selfie photo: Encrypted
- ID card photo: Encrypted
- Raw biometric data: Encrypted
- Decryption keys: Managed by election commission

## Testing & Deployment

### Build
```bash
cd anchor
anchor build
```

### Test
```bash
anchor test
```

### Deploy
```bash
# Local testing
anchor localnet

# Devnet
anchor deploy --provider.cluster devnet

# Mainnet (Production)
anchor deploy --provider.cluster mainnet
```

## Integration Guide

### Frontend Requirements

1. **Biometric Capture**
   - Implement retina scan, face recognition, fingerprint capture
   - Combine into single hash using SHA-256
   - Store raw data encrypted on IPFS

2. **Photo Capture**
   - Take selfie with ID card
   - Encrypt photo
   - Upload to IPFS
   - Submit IPFS hash to smart contract

3. **Vote Casting UI**
   - Display candidates
   - Confirm vote choice
   - Show ballot receipt after voting
   - Allow receipt verification

### Backend Requirements

1. **IPFS Node**
   - Set up IPFS node or use Pinata/NFT.Storage
   - Implement encryption for sensitive data
   - Manage decryption keys securely

2. **AI Verification Service**
   - Implement biometric verification AI
   - Return confidence score (0-100)
   - Integrate with smart contract

3. **Election Commission Dashboard**
   - Multi-sig transaction coordination
   - Audit interface for commissioners
   - Real-time election monitoring

## Error Codes

```rust
InvalidCommissionerCount        // Not enough commissioners specified
InvalidElectionPeriod          // End time before start time
NameTooLong                    // Name exceeds 100 characters
ElectionAlreadyActive          // Trying to modify active election
ElectionNotActive              // Trying to vote in inactive election
ElectionNotStarted             // Trying to activate before start time
ElectionStillActive            // Trying to finalize before end time
InvalidNIK                     // NIK not exactly 16 digits
InvalidIPFSHash                // IPFS hash format invalid
InvalidConfidenceScore         // AI score not between 0-100
RegistrationClosed             // Trying to register after election starts
AlreadyVoted                   // Voter has already cast a vote
VoterNotVerified               // Voter credential not verified
VotingPeriodInvalid           // Current time outside voting period
Overflow                       // Arithmetic overflow detected
```

## Future Enhancements (Noted for Reference)

### Zero-Knowledge Proofs
- Implement ZK-SNARKs for ultimate privacy
- Verify eligibility without revealing identity
- Requires circom or similar ZK framework

### Re-Election Support
- Current design supports multiple election instances
- Just initialize new election with different name
- Preserves historical election data

### Advanced Audit Features
- Vote tallying verification
- Real-time statistical analysis
- Fraud detection algorithms

## Notes

- The original counter functionality has been preserved in lib.rs
- All warnings about `anchor-debug` cfg values are framework-related and can be ignored
- Program ID: `Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe`
- Built with Anchor 0.31.1 and Solana SDK 2.2.1

## Support

For issues or questions about the smart contract:
1. Review the code in `anchor/programs/idngenelectevotingsolana/src/`
2. Check error messages in `errors.rs`
3. Refer to Anchor documentation: https://www.anchor-lang.com/
4. Solana developer documentation: https://docs.solana.com/

---

**Generated with Claude Code**
Built for Indonesia General Election E-Voting System
