use anchor_lang::prelude::*;
use crate::state::Election;
use crate::errors::ErrorCode;

/// Activate the election (requires commissioner authority)
pub fn activate_election(ctx: Context<ManageElection>) -> Result<()> {
    let election = &mut ctx.accounts.election;
    let clock = Clock::get()?;

    require!(
        clock.unix_timestamp >= election.start_time,
        ErrorCode::ElectionNotStarted
    );
    require!(!election.is_active, ErrorCode::ElectionAlreadyActive);

    election.is_active = true;

    Ok(())
}

/// Finalize election and close voting (requires commissioner authority)
pub fn finalize_election(ctx: Context<ManageElection>) -> Result<()> {
    let election = &mut ctx.accounts.election;
    let clock = Clock::get()?;

    require!(election.is_active, ErrorCode::ElectionNotActive);
    require!(
        clock.unix_timestamp > election.end_time,
        ErrorCode::ElectionStillActive
    );

    election.is_active = false;

    Ok(())
}

#[derive(Accounts)]
pub struct ManageElection<'info> {
    pub commissioner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"election", election.election_name.as_bytes()],
        bump = election.bump,
    )]
    pub election: Account<'info, Election>,
}
