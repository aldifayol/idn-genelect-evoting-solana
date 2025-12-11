use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Burn};
use crate::state::{Election, VoterCredential, Candidate, Ballot};
use crate::errors::ErrorCode;
use crate::utils::generate_ballot_receipt;

/// Cast an anonymous vote
/// Separates voter identity from vote choice for ballot secrecy
pub fn cast_vote(
    ctx: Context<CastVote>,
    encrypted_vote_data: [u8; 32],
) -> Result<()> {
    let election = &ctx.accounts.election;
    let clock = Clock::get()?;

    // Verify election is active and within voting period
    require!(election.is_active, ErrorCode::ElectionNotActive);
    require!(
        clock.unix_timestamp >= election.start_time
            && clock.unix_timestamp <= election.end_time,
        ErrorCode::VotingPeriodInvalid
    );

    // Verify voter hasn't voted yet
    let voter_credential = &mut ctx.accounts.voter_credential;
    require!(!voter_credential.has_voted, ErrorCode::AlreadyVoted);
    require!(voter_credential.is_verified, ErrorCode::VoterNotVerified);

    // Burn the voting token (prevents double voting)
    let cpi_accounts = Burn {
        mint: ctx.accounts.voting_token_mint.to_account_info(),
        from: ctx.accounts.voter_token_account.to_account_info(),
        authority: ctx.accounts.voter.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::burn(cpi_ctx, 1)?;

    // Mark voter as having voted (without revealing vote choice)
    voter_credential.has_voted = true;
    voter_credential.vote_timestamp = Some(clock.unix_timestamp);

    // Record anonymous ballot
    let ballot = &mut ctx.accounts.ballot;
    ballot.election = ctx.accounts.election.key();
    ballot.candidate = ctx.accounts.candidate.key();
    ballot.encrypted_vote_data = encrypted_vote_data;
    ballot.timestamp = clock.unix_timestamp;
    ballot.ballot_sequence = election.total_votes_cast;
    ballot.verification_receipt = generate_ballot_receipt(
        *ctx.accounts.voter.key,
        &voter_credential.verification_code,
        clock.unix_timestamp,
    );
    ballot.bump = ctx.bumps.ballot;

    // Increment candidate vote count
    let candidate = &mut ctx.accounts.candidate;
    candidate.vote_count = candidate
        .vote_count
        .checked_add(1)
        .ok_or(ErrorCode::Overflow)?;

    // Increment total votes cast
    let election_mut = &mut ctx.accounts.election;
    election_mut.total_votes_cast = election_mut
        .total_votes_cast
        .checked_add(1)
        .ok_or(ErrorCode::Overflow)?;

    Ok(())
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"election", election.election_name.as_bytes()],
        bump = election.bump
    )]
    pub election: Account<'info, Election>,

    #[account(
        mut,
        seeds = [b"voter_credential", election.key().as_ref(), voter.key().as_ref()],
        bump = voter_credential.bump,
        has_one = election
    )]
    pub voter_credential: Account<'info, VoterCredential>,

    #[account(
        mut,
        seeds = [b"candidate", election.key().as_ref(), &candidate.candidate_id.to_le_bytes()],
        bump = candidate.bump,
        has_one = election
    )]
    pub candidate: Account<'info, Candidate>,

    #[account(
        init,
        payer = voter,
        space = 8 + Ballot::INIT_SPACE,
        seeds = [
            b"ballot",
            election.key().as_ref(),
            &election.total_votes_cast.to_le_bytes()
        ],
        bump
    )]
    pub ballot: Account<'info, Ballot>,

    #[account(
        mut,
        seeds = [b"voting_token_mint", election.key().as_ref()],
        bump,
    )]
    pub voting_token_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = voting_token_mint,
        associated_token::authority = voter
    )]
    pub voter_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
