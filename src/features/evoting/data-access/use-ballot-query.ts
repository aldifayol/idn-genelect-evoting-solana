'use client'

import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'
import { getBallotAccounts, fetchMaybeBallot, type Ballot, type BallotAccount } from '@project/anchor'
import { deriveBallotPDA } from '@/lib/pda'
import type { Address, MaybeAccount } from 'gill'

/**
 * Query key for ballot accounts
 */
export function useBallotAccountsQueryKey() {
  const { cluster } = useSolana()
  return ['evoting', 'ballots', { cluster }]
}

/**
 * Fetch all ballots
 */
export function useBallotAccountsQuery() {
  const { client } = useSolana()

  return useQuery({
    queryKey: useBallotAccountsQueryKey(),
    queryFn: async () => await getBallotAccounts(client.rpc),
  })
}

/**
 * Fetch ballots for a specific election
 */
export function useElectionBallotsQuery(electionPda: string | null) {
  const { client, cluster } = useSolana()

  return useQuery({
    queryKey: ['evoting', 'ballots', electionPda, { cluster }],
    queryFn: async (): Promise<BallotAccount[]> => {
      const allBallots = await getBallotAccounts(client.rpc)
      return allBallots.filter((b) => b.data.election === electionPda)
    },
    enabled: !!electionPda,
  })
}

/**
 * Fetch a specific ballot by sequence number
 */
export function useBallotQuery(electionPda: string | null, ballotSequence: bigint) {
  const { client, cluster } = useSolana()

  return useQuery({
    queryKey: ['evoting', 'ballot', electionPda, ballotSequence.toString(), { cluster }],
    queryFn: async (): Promise<MaybeAccount<Ballot>> => {
      const ballotPda = await deriveBallotPDA(electionPda as Address, ballotSequence)
      return fetchMaybeBallot(client.rpc, ballotPda as Address)
    },
    enabled: !!electionPda,
  })
}

/**
 * Search for a ballot by receipt
 */
export function useBallotByReceiptQuery(electionPda: string | null, receipt: string) {
  const { client, cluster } = useSolana()

  return useQuery({
    queryKey: ['evoting', 'ballot', 'receipt', electionPda, receipt, { cluster }],
    queryFn: async (): Promise<BallotAccount | null> => {
      const allBallots = await getBallotAccounts(client.rpc)
      const matchingBallot = allBallots.find(
        (b) => b.data.election === electionPda && b.data.verificationReceipt === receipt
      )
      return matchingBallot || null
    },
    enabled: !!electionPda && !!receipt && receipt.length > 0,
  })
}
