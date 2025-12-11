#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe");

// E-voting modules
pub mod state;
pub mod instructions;
pub mod errors;
pub mod utils;

use instructions::*;
use state::{AuditData, ReceiptVerification};

#[program]
pub mod idngenelectevotingsolana {
    use super::*;

    // ========================================================================
    // COUNTER FUNCTIONALITY (Original)
    // ========================================================================

    pub fn close(_ctx: Context<CloseIdngenelectevotingsolana>) -> Result<()> {
        Ok(())
    }

    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.idngenelectevotingsolana.count = ctx.accounts.idngenelectevotingsolana.count.checked_sub(1).unwrap();
        Ok(())
    }

    pub fn increment(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.idngenelectevotingsolana.count = ctx.accounts.idngenelectevotingsolana.count.checked_add(1).unwrap();
        Ok(())
    }

    pub fn initialize(_ctx: Context<InitializeIdngenelectevotingsolana>) -> Result<()> {
        Ok(())
    }

    pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
        ctx.accounts.idngenelectevotingsolana.count = value.clone();
        Ok(())
    }

    // ========================================================================
    // E-VOTING FUNCTIONALITY
    // ========================================================================

    /// Initialize a new election with multi-sig commissioners
    pub fn initialize_election(
        ctx: Context<InitializeElection>,
        election_name: String,
        start_time: i64,
        end_time: i64,
        commissioners: Vec<Pubkey>,
        required_signatures: u8,
    ) -> Result<()> {
        instructions::initialize_election::initialize_election(
            ctx,
            election_name,
            start_time,
            end_time,
            commissioners,
            required_signatures,
        )
    }

    /// Register a candidate for the election (requires commissioner authority)
    pub fn register_candidate(
        ctx: Context<RegisterCandidate>,
        candidate_name: String,
        candidate_id: u32,
    ) -> Result<()> {
        instructions::register_candidate::register_candidate(ctx, candidate_name, candidate_id)
    }

    /// Verify voter biometrics and mint Voter Credential NFT
    /// Stores cryptographic hashes on-chain, actual biometric data off-chain
    pub fn verify_voter(
        ctx: Context<VerifyVoter>,
        voter_nik: String,
        biometric_hash: [u8; 32],
        photo_ipfs_hash: String,
        verification_timestamp: i64,
        ai_confidence_score: u8,
    ) -> Result<()> {
        instructions::verify_voter::verify_voter(
            ctx,
            voter_nik,
            biometric_hash,
            photo_ipfs_hash,
            verification_timestamp,
            ai_confidence_score,
        )
    }

    /// Cast an anonymous vote
    /// Separates voter identity from vote choice for ballot secrecy
    pub fn cast_vote(
        ctx: Context<CastVote>,
        encrypted_vote_data: [u8; 32],
    ) -> Result<()> {
        instructions::cast_vote::cast_vote(ctx, encrypted_vote_data)
    }

    /// Activate the election (requires commissioner authority)
    pub fn activate_election(ctx: Context<ManageElection>) -> Result<()> {
        instructions::manage_election::activate_election(ctx)
    }

    /// Finalize election and close voting (requires commissioner authority)
    pub fn finalize_election(ctx: Context<ManageElection>) -> Result<()> {
        instructions::manage_election::finalize_election(ctx)
    }

    /// Admin function to audit AI verification integrity (for testing)
    /// Only accessible by election commissioners
    pub fn audit_verification(
        ctx: Context<AuditVerification>,
    ) -> Result<AuditData> {
        instructions::audit::audit_verification(ctx)
    }

    /// Voter can verify their vote was counted using their receipt
    pub fn verify_ballot_receipt(
        ctx: Context<VerifyReceipt>,
    ) -> Result<ReceiptVerification> {
        instructions::audit::verify_ballot_receipt(ctx)
    }
}

// ============================================================================
// COUNTER ACCOUNT STRUCTURES (Original)
// ============================================================================

#[derive(Accounts)]
pub struct InitializeIdngenelectevotingsolana<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        space = 8 + Idngenelectevotingsolana::INIT_SPACE,
        payer = payer
    )]
    pub idngenelectevotingsolana: Account<'info, Idngenelectevotingsolana>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseIdngenelectevotingsolana<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        close = payer,
    )]
    pub idngenelectevotingsolana: Account<'info, Idngenelectevotingsolana>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub idngenelectevotingsolana: Account<'info, Idngenelectevotingsolana>,
}

#[account]
#[derive(InitSpace)]
pub struct Idngenelectevotingsolana {
    count: u8,
}
