use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, TokenAccount, Transfer};

#[program]
pub mod dog_money {
    use super::*;
    pub fn initialize_user(ctx: Context<InitializeUser>, amount: u64) -> ProgramResult {
        let user_data = &mut ctx.accounts.user_data;
        user_data.first_deposit = ctx.accounts.clock.unix_timestamp;

        let cpi_accounts = Transfer {
            from: ctx.accounts.user_usdc.to_account_info(),
            to: ctx.accounts.program_vault.to_account_info(),
            authority: ctx.accounts.authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        msg!("time {}", user_data.first_deposit);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    program_signer: AccountInfo<'info>,
    #[account(mut, has_one = authority)]
    user_data: ProgramAccount<'info, UserData>,
    #[account(signer)]
    authority: AccountInfo<'info>,
    usdc_mint: CpiAccount<'info, Mint>,
    user_usdc: CpiAccount<'info, TokenAccount>,
    program_vault: CpiAccount<'info, TokenAccount>,
    dog_money_mint: CpiAccount<'info, Mint>,
    user_dog_money: CpiAccount<'info, TokenAccount>,
    token_program: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
    system_program: AccountInfo<'info>,
    clock: Sysvar<'info, Clock>,
}

#[account]
pub struct UserData {
    pub authority: Pubkey,
    pub first_deposit: i64,
}
