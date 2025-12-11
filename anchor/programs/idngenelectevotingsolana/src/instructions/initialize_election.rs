use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use crate::state::Election;
use crate::errors::ErrorCode;

/// Initialize a new election with multi-sig commissioners
pub fn initialize_election(
    ctx: Context<InitializeElection>,
    election_name: String,
    start_time: i64,
    end_time: i64,
    commissioners: Vec<Pubkey>,
    required_signatures: u8,
) -> Result<()> {
    require!(
        commissioners.len() >= required_signatures as usize,
        ErrorCode::InvalidCommissionerCount
    );
    require!(start_time < end_time, ErrorCode::InvalidElectionPeriod);
    require!(election_name.len() <= 100, ErrorCode::NameTooLong);

    let election = &mut ctx.accounts.election;
    election.authority = ctx.accounts.authority.key();
    election.election_name = election_name;
    election.start_time = start_time;
    election.end_time = end_time;
    election.is_active = false;
    election.total_registered_voters = 0;
    election.total_votes_cast = 0;
    election.commissioners = commissioners;
    election.required_signatures = required_signatures;
    election.bump = ctx.bumps.election;

    Ok(())
}

#[derive(Accounts)]
#[instruction(election_name: String)]
pub struct InitializeElection<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Election::INIT_SPACE,
        seeds = [b"election", election_name.as_bytes()],
        bump
    )]
    pub election: Account<'info, Election>,

    #[account(
        init,
        payer = authority,
        seeds = [b"voting_token_mint", election.key().as_ref()],
        bump,
        mint::decimals = 0,
        mint::authority = election,
    )]
    pub voting_token_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
