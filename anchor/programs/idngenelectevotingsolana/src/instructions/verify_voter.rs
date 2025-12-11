use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::{Election, VoterCredential};
use crate::errors::ErrorCode;
use crate::utils::generate_verification_code;

/// Verify voter biometrics and mint Voter Credential NFT
/// Stores cryptographic hashes on-chain, actual biometric data off-chain (IPFS)
pub fn verify_voter(
    ctx: Context<VerifyVoter>,
    voter_nik: String,
    biometric_hash: [u8; 32],
    photo_ipfs_hash: String,
    verification_timestamp: i64,
    ai_confidence_score: u8,
) -> Result<()> {
    require!(voter_nik.len() == 16, ErrorCode::InvalidNIK);
    require!(photo_ipfs_hash.len() <= 100, ErrorCode::InvalidIPFSHash);
    require!(
        ai_confidence_score <= 100,
        ErrorCode::InvalidConfidenceScore
    );

    let election = &ctx.accounts.election;
    let clock = Clock::get()?;

    // Check election hasn't started yet (registration phase)
    require!(
        clock.unix_timestamp < election.start_time,
        ErrorCode::RegistrationClosed
    );

    let voter_credential = &mut ctx.accounts.voter_credential;
    voter_credential.election = ctx.accounts.election.key();
    voter_credential.voter_authority = ctx.accounts.voter.key();
    voter_credential.voter_nik_hash = solana_program::hash::hash(voter_nik.as_bytes()).to_bytes();
    voter_credential.biometric_hash = biometric_hash;
    voter_credential.photo_ipfs_hash = photo_ipfs_hash;
    voter_credential.is_verified = true;
    voter_credential.has_voted = false;
    voter_credential.verification_timestamp = verification_timestamp;
    voter_credential.ai_confidence_score = ai_confidence_score;
    voter_credential.verification_code = generate_verification_code(
        *ctx.accounts.voter.key,
        &voter_nik,
        verification_timestamp,
    );
    voter_credential.bump = ctx.bumps.voter_credential;

    // Mint non-transferable voting token (1 token = 1 vote right)
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
    token::mint_to(cpi_ctx, 1)?;

    // Increment registered voters count
    let election_mut = &mut ctx.accounts.election;
    election_mut.total_registered_voters = election_mut
        .total_registered_voters
        .checked_add(1)
        .ok_or(ErrorCode::Overflow)?;

    Ok(())
}

#[derive(Accounts)]
pub struct VerifyVoter<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"election", election.election_name.as_bytes()],
        bump = election.bump
    )]
    pub election: Account<'info, Election>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoterCredential::INIT_SPACE,
        seeds = [b"voter_credential", election.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub voter_credential: Account<'info, VoterCredential>,

    #[account(
        mut,
        seeds = [b"voting_token_mint", election.key().as_ref()],
        bump,
    )]
    pub voting_token_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = voter,
        associated_token::mint = voting_token_mint,
        associated_token::authority = voter
    )]
    pub voter_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
