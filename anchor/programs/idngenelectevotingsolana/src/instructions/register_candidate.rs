use anchor_lang::prelude::*;
use crate::state::{Election, Candidate};
use crate::errors::ErrorCode;

/// Register a candidate for the election (requires commissioner authority)
pub fn register_candidate(
    ctx: Context<RegisterCandidate>,
    candidate_name: String,
    candidate_id: u32,
) -> Result<()> {
    require!(candidate_name.len() <= 100, ErrorCode::NameTooLong);

    let election = &ctx.accounts.election;
    require!(!election.is_active, ErrorCode::ElectionAlreadyActive);

    let candidate = &mut ctx.accounts.candidate;
    candidate.election = ctx.accounts.election.key();
    candidate.candidate_id = candidate_id;
    candidate.candidate_name = candidate_name;
    candidate.vote_count = 0;
    candidate.bump = ctx.bumps.candidate;

    Ok(())
}

#[derive(Accounts)]
#[instruction(candidate_name: String, candidate_id: u32)]
pub struct RegisterCandidate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"election", election.election_name.as_bytes()],
        bump = election.bump,
        has_one = authority
    )]
    pub election: Account<'info, Election>,

    #[account(
        init,
        payer = authority,
        space = 8 + Candidate::INIT_SPACE,
        seeds = [b"candidate", election.key().as_ref(), &candidate_id.to_le_bytes()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,

    pub system_program: Program<'info, System>,
}
