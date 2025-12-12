// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, getBase58Decoder, SolanaClient } from 'gill'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import {
  Idngenelectevotingsolana,
  IDNGENELECTEVOTINGSOLANA_DISCRIMINATOR,
  IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS,
  getIdngenelectevotingsolanaDecoder,
  // E-voting accounts
  Election,
  ELECTION_DISCRIMINATOR,
  getElectionDecoder,
  Candidate,
  CANDIDATE_DISCRIMINATOR,
  getCandidateDecoder,
  VoterCredential,
  VOTER_CREDENTIAL_DISCRIMINATOR,
  getVoterCredentialDecoder,
  Ballot,
  BALLOT_DISCRIMINATOR,
  getBallotDecoder,
} from './client/js'
import IdngenelectevotingsolanaIDL from '../target/idl/idngenelectevotingsolana.json'

export type IdngenelectevotingsolanaAccount = Account<Idngenelectevotingsolana, string>
export type ElectionAccount = Account<Election, string>
export type CandidateAccount = Account<Candidate, string>
export type VoterCredentialAccount = Account<VoterCredential, string>
export type BallotAccount = Account<Ballot, string>

// Re-export the generated IDL and type
export { IdngenelectevotingsolanaIDL }

export * from './client/js'

export function getIdngenelectevotingsolanaProgramAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getIdngenelectevotingsolanaDecoder(),
    filter: getBase58Decoder().decode(IDNGENELECTEVOTINGSOLANA_DISCRIMINATOR),
    programAddress: IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS,
  })
}

export function getElectionAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getElectionDecoder(),
    filter: getBase58Decoder().decode(ELECTION_DISCRIMINATOR),
    programAddress: IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS,
  })
}

export function getCandidateAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getCandidateDecoder(),
    filter: getBase58Decoder().decode(CANDIDATE_DISCRIMINATOR),
    programAddress: IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS,
  })
}

export function getVoterCredentialAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getVoterCredentialDecoder(),
    filter: getBase58Decoder().decode(VOTER_CREDENTIAL_DISCRIMINATOR),
    programAddress: IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS,
  })
}

export function getBallotAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getBallotDecoder(),
    filter: getBase58Decoder().decode(BALLOT_DISCRIMINATOR),
    programAddress: IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS,
  })
}
