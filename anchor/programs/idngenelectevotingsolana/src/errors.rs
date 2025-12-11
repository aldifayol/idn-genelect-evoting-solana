use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid number of commissioners")]
    InvalidCommissionerCount,
    #[msg("Election period is invalid")]
    InvalidElectionPeriod,
    #[msg("Name is too long")]
    NameTooLong,
    #[msg("Election is already active")]
    ElectionAlreadyActive,
    #[msg("Election is not active")]
    ElectionNotActive,
    #[msg("Election has not started yet")]
    ElectionNotStarted,
    #[msg("Election is still active")]
    ElectionStillActive,
    #[msg("Invalid NIK format (must be 16 digits)")]
    InvalidNIK,
    #[msg("Invalid IPFS hash")]
    InvalidIPFSHash,
    #[msg("Invalid confidence score (must be 0-100)")]
    InvalidConfidenceScore,
    #[msg("Voter registration is closed")]
    RegistrationClosed,
    #[msg("Voter has already voted")]
    AlreadyVoted,
    #[msg("Voter is not verified")]
    VoterNotVerified,
    #[msg("Voting period is invalid")]
    VotingPeriodInvalid,
    #[msg("Arithmetic overflow")]
    Overflow,
}
