use anchor_lang::prelude::*;

/// Main Election account storing election metadata and configuration
#[account]
#[derive(InitSpace)]
pub struct Election {
    pub authority: Pubkey,
    #[max_len(100)]
    pub election_name: String,
    pub start_time: i64,
    pub end_time: i64,
    pub is_active: bool,
    pub total_registered_voters: u64,
    pub total_votes_cast: u64,
    #[max_len(10)]
    pub commissioners: Vec<Pubkey>,
    pub required_signatures: u8,
    pub bump: u8,
}

/// Candidate account for election participants
#[account]
#[derive(InitSpace)]
pub struct Candidate {
    pub election: Pubkey,
    pub candidate_id: u32,
    #[max_len(100)]
    pub candidate_name: String,
    pub vote_count: u64,
    pub bump: u8,
}

/// Voter Credential NFT - stores cryptographic proofs, not raw biometric data
/// Acts as proof of identity verification
#[account]
#[derive(InitSpace)]
pub struct VoterCredential {
    pub election: Pubkey,
    pub voter_authority: Pubkey,
    /// SHA-256 hash of voter NIK (National Identity Number)
    pub voter_nik_hash: [u8; 32],
    /// SHA-256 hash of combined biometric data (retina + face + fingerprint)
    pub biometric_hash: [u8; 32],
    /// IPFS hash pointing to encrypted selfie photo + ID card
    #[max_len(100)]
    pub photo_ipfs_hash: String,
    pub is_verified: bool,
    pub has_voted: bool,
    pub verification_timestamp: i64,
    pub vote_timestamp: Option<i64>,
    /// AI confidence score (0-100) for audit purposes
    pub ai_confidence_score: u8,
    /// Unique verification code for voter to confirm their registration
    #[max_len(64)]
    pub verification_code: String,
    pub bump: u8,
}

/// Anonymous ballot record
/// Deliberately separates voter identity from vote choice
#[account]
#[derive(InitSpace)]
pub struct Ballot {
    pub election: Pubkey,
    pub candidate: Pubkey,
    /// Encrypted vote data for additional privacy layer
    pub encrypted_vote_data: [u8; 32],
    pub timestamp: i64,
    /// Sequential ballot number for counting verification
    pub ballot_sequence: u64,
    /// Receipt hash that voter can use to verify their vote was counted
    #[max_len(64)]
    pub verification_receipt: String,
    pub bump: u8,
}

/// Audit data returned for commissioner review (testing AI integrity)
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AuditData {
    pub voter_nik_hash: [u8; 32],
    pub biometric_hash: [u8; 32],
    pub ai_confidence_score: u8,
    pub verification_timestamp: i64,
    pub has_voted: bool,
    pub is_verified: bool,
}

/// Receipt verification response for voters
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ReceiptVerification {
    pub is_valid: bool,
    pub ballot_sequence: u64,
    pub timestamp: i64,
    pub verification_code: String,
}
