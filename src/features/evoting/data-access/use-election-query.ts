'use client'

import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'
import { getElectionAccounts, fetchMaybeElection, type Election } from '@project/anchor'
import { deriveElectionPDA } from '@/lib/pda'
import type { Address, MaybeAccount } from 'gill'

/**
 * Query key for election accounts
 */
export function useElectionAccountsQueryKey() {
  const { cluster } = useSolana()
  return ['evoting', 'elections', { cluster }]
}

/**
 * Query key for a specific election by name
 */
export function useElectionQueryKey(electionName: string) {
  const { cluster } = useSolana()
  return ['evoting', 'election', electionName, { cluster }]
}

/**
 * Fetch all elections
 */
export function useElectionAccountsQuery() {
  const { client } = useSolana()

  return useQuery({
    queryKey: useElectionAccountsQueryKey(),
    queryFn: async () => await getElectionAccounts(client.rpc),
  })
}

/**
 * Fetch a specific election by name
 */
export function useElectionQuery(electionName: string) {
  const { client } = useSolana()

  return useQuery({
    queryKey: useElectionQueryKey(electionName),
    queryFn: async (): Promise<MaybeAccount<Election>> => {
      const electionPda = await deriveElectionPDA(electionName)
      return fetchMaybeElection(client.rpc, electionPda as Address)
    },
    enabled: !!electionName,
  })
}
