'use client'

import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'
import {
  getCandidateAccounts,
  fetchMaybeCandidate,
  type Candidate,
  type CandidateAccount,
} from '@project/anchor'
import { deriveCandidatePDA } from '@/lib/pda'
import type { Address, MaybeAccount } from 'gill'

/**
 * Query key for candidate accounts
 */
export function useCandidateAccountsQueryKey() {
  const { cluster } = useSolana()
  return ['evoting', 'candidates', { cluster }]
}

/**
 * Query key for candidates of a specific election
 */
export function useElectionCandidatesQueryKey(electionPda: string) {
  const { cluster } = useSolana()
  return ['evoting', 'candidates', electionPda, { cluster }]
}

/**
 * Fetch all candidates
 */
export function useCandidateAccountsQuery() {
  const { client } = useSolana()

  return useQuery({
    queryKey: useCandidateAccountsQueryKey(),
    queryFn: async () => await getCandidateAccounts(client.rpc),
  })
}

/**
 * Fetch candidates for a specific election
 */
export function useElectionCandidatesQuery(electionPda: string | null) {
  const { client } = useSolana()

  return useQuery({
    queryKey: useElectionCandidatesQueryKey(electionPda || ''),
    queryFn: async (): Promise<CandidateAccount[]> => {
      const allCandidates = await getCandidateAccounts(client.rpc)
      // Filter candidates by election
      return allCandidates.filter((c) => c.data.election === electionPda)
    },
    enabled: !!electionPda,
  })
}

/**
 * Fetch a specific candidate by election and ID
 */
export function useCandidateQuery(electionPda: string | null, candidateId: number) {
  const { client } = useSolana()

  return useQuery({
    queryKey: ['evoting', 'candidate', electionPda, candidateId],
    queryFn: async (): Promise<MaybeAccount<Candidate>> => {
      const candidatePda = await deriveCandidatePDA(electionPda as Address, candidateId)
      return fetchMaybeCandidate(client.rpc, candidatePda as Address)
    },
    enabled: !!electionPda,
  })
}
