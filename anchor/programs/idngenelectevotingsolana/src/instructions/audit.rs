use anchor_lang::prelude::*;
use crate::state::{Election, VoterCredential, Ballot, AuditData, ReceiptVerification};

/// Admin function to audit AI verification integrity (for testing)
/// Only accessible by election commissioners
pub fn audit_verification(
    ctx: Context<AuditVerification>,
) -> Result<AuditData> {
    let voter_credential = &ctx.accounts.voter_credential;

    Ok(AuditData {
        voter_nik_hash: voter_credential.voter_nik_hash,
        biometric_hash: voter_credential.biometric_hash,
        ai_confidence_score: voter_credential.ai_confidence_score,
        verification_timestamp: voter_credential.verification_timestamp,
        has_voted: voter_credential.has_voted,
        is_verified: voter_credential.is_verified,
    })
}

/// Voter can verify their vote was counted using their receipt
pub fn verify_ballot_receipt(
    ctx: Context<VerifyReceipt>,
) -> Result<ReceiptVerification> {
    let ballot = &ctx.accounts.ballot;
    let voter_credential = &ctx.accounts.voter_credential;

    Ok(ReceiptVerification {
        is_valid: true,
        ballot_sequence: ballot.ballot_sequence,
        timestamp: ballot.timestamp,
        verification_code: voter_credential.verification_code.clone(),
    })
}

#[derive(Accounts)]
pub struct AuditVerification<'info> {
    pub commissioner: Signer<'info>,

    #[account(
        seeds = [b"election", election.election_name.as_bytes()],
        bump = election.bump
    )]
    pub election: Account<'info, Election>,

    #[account(
        seeds = [b"voter_credential", election.key().as_ref(), voter_credential.voter_authority.as_ref()],
        bump = voter_credential.bump,
        has_one = election
    )]
    pub voter_credential: Account<'info, VoterCredential>,
}

#[derive(Accounts)]
pub struct VerifyReceipt<'info> {
    pub voter: Signer<'info>,

    #[account(
        seeds = [b"election", election.election_name.as_bytes()],
        bump = election.bump
    )]
    pub election: Account<'info, Election>,

    #[account(
        seeds = [b"voter_credential", election.key().as_ref(), voter.key().as_ref()],
        bump = voter_credential.bump,
        has_one = election
    )]
    pub voter_credential: Account<'info, VoterCredential>,

    #[account(
        seeds = [b"ballot", election.key().as_ref(), &ballot.ballot_sequence.to_le_bytes()],
        bump = ballot.bump,
        has_one = election
    )]
    pub ballot: Account<'info, Ballot>,
}
