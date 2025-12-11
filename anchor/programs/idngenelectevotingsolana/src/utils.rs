use anchor_lang::prelude::*;

/// Generate unique verification code for voter
pub fn generate_verification_code(
    voter_pubkey: Pubkey,
    voter_nik: &str,
    timestamp: i64,
) -> String {
    let data = format!("{}{}{}", voter_pubkey, voter_nik, timestamp);
    let hash = solana_program::hash::hash(data.as_bytes());
    bs58::encode(hash.to_bytes()).into_string()[..16].to_string()
}

/// Generate ballot receipt for voter verification
pub fn generate_ballot_receipt(
    voter_pubkey: Pubkey,
    verification_code: &str,
    timestamp: i64,
) -> String {
    let data = format!("{}{}{}", voter_pubkey, verification_code, timestamp);
    let hash = solana_program::hash::hash(data.as_bytes());
    bs58::encode(hash.to_bytes()).into_string()[..32].to_string()
}
