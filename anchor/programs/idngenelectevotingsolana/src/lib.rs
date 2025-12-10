#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe");

#[program]
pub mod idngenelectevotingsolana {
    use super::*;

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
}

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
  close = payer, // close account and return lamports to payer
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
