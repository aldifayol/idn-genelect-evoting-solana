// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, getBase58Decoder, SolanaClient } from 'gill'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import { Idngenelectevotingsolana, IDNGENELECTEVOTINGSOLANA_DISCRIMINATOR, IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS, getIdngenelectevotingsolanaDecoder } from './client/js'
import IdngenelectevotingsolanaIDL from '../target/idl/idngenelectevotingsolana.json'

export type IdngenelectevotingsolanaAccount = Account<Idngenelectevotingsolana, string>

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
