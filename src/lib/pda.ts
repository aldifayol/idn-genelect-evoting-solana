import {
  Address,
  getProgramDerivedAddress,
  getAddressEncoder,
  getBytesEncoder,
  getU32Encoder,
  getU64Encoder,
} from 'gill'
import { IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS } from '@project/anchor'

const addressEncoder = getAddressEncoder()
const bytesEncoder = getBytesEncoder()
const u32Encoder = getU32Encoder()
const u64Encoder = getU64Encoder()

// Seed constants as byte arrays
const ELECTION_SEED = new Uint8Array([101, 108, 101, 99, 116, 105, 111, 110]) // "election"
const CANDIDATE_SEED = new Uint8Array([99, 97, 110, 100, 105, 100, 97, 116, 101]) // "candidate"
const VOTER_CREDENTIAL_SEED = new Uint8Array([
  118, 111, 116, 101, 114, 95, 99, 114, 101, 100, 101, 110, 116, 105, 97, 108,
]) // "voter_credential"
const BALLOT_SEED = new Uint8Array([98, 97, 108, 108, 111, 116]) // "ballot"
const VOTING_TOKEN_MINT_SEED = new Uint8Array([
  118, 111, 116, 105, 110, 103, 95, 116, 111, 107, 101, 110, 95, 109, 105, 110, 116,
]) // "voting_token_mint"

/**
 * Derive Election PDA from election name
 */
export async function deriveElectionPDA(electionName: string): Promise<Address> {
  const textEncoder = new TextEncoder()
  const [address] = await getProgramDerivedAddress({
    programAddress: IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS,
    seeds: [bytesEncoder.encode(ELECTION_SEED), textEncoder.encode(electionName)],
  })
  return address
}

/**
 * Derive Candidate PDA from election PDA and candidate ID
 */
export async function deriveCandidatePDA(
  electionPda: Address,
  candidateId: number
): Promise<Address> {
  const [address] = await getProgramDerivedAddress({
    programAddress: IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS,
    seeds: [
      bytesEncoder.encode(CANDIDATE_SEED),
      addressEncoder.encode(electionPda),
      u32Encoder.encode(candidateId),
    ],
  })
  return address
}

/**
 * Derive VoterCredential PDA from election PDA and voter public key
 */
export async function deriveVoterCredentialPDA(
  electionPda: Address,
  voterPubkey: Address
): Promise<Address> {
  const [address] = await getProgramDerivedAddress({
    programAddress: IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS,
    seeds: [
      bytesEncoder.encode(VOTER_CREDENTIAL_SEED),
      addressEncoder.encode(electionPda),
      addressEncoder.encode(voterPubkey),
    ],
  })
  return address
}

/**
 * Derive Ballot PDA from election PDA and ballot sequence number
 */
export async function deriveBallotPDA(
  electionPda: Address,
  ballotSequence: bigint
): Promise<Address> {
  const [address] = await getProgramDerivedAddress({
    programAddress: IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS,
    seeds: [
      bytesEncoder.encode(BALLOT_SEED),
      addressEncoder.encode(electionPda),
      u64Encoder.encode(ballotSequence),
    ],
  })
  return address
}

/**
 * Derive Voting Token Mint PDA from election PDA
 */
export async function deriveVotingTokenMintPDA(electionPda: Address): Promise<Address> {
  const [address] = await getProgramDerivedAddress({
    programAddress: IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS,
    seeds: [bytesEncoder.encode(VOTING_TOKEN_MINT_SEED), addressEncoder.encode(electionPda)],
  })
  return address
}
