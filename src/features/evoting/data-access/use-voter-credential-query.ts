'use client'

import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'
import { fetchMaybeVoterCredential, type VoterCredential } from '@project/anchor'
import { deriveVoterCredentialPDA } from '@/lib/pda'
import type { Address, MaybeAccount } from 'gill'

/**
 * Query key for voter credential
 */
export function useVoterCredentialQueryKey(electionPda: string, voterPubkey: string) {
  const { cluster } = useSolana()
  return ['evoting', 'voterCredential', electionPda, voterPubkey, { cluster }]
}

/**
 * Fetch voter credential for a specific election and voter
 */
export function useVoterCredentialQuery(electionPda: string | null, voterPubkey: string | null) {
  const { client } = useSolana()

  return useQuery({
    queryKey: useVoterCredentialQueryKey(electionPda || '', voterPubkey || ''),
    queryFn: async (): Promise<MaybeAccount<VoterCredential>> => {
      const voterCredentialPda = await deriveVoterCredentialPDA(
        electionPda as Address,
        voterPubkey as Address
      )
      return fetchMaybeVoterCredential(client.rpc, voterCredentialPda as Address)
    },
    enabled: !!electionPda && !!voterPubkey,
  })
}

/**
 * Helper hook to get voter status
 */
export function useVoterStatus(electionPda: string | null, voterPubkey: string | null) {
  const query = useVoterCredentialQuery(electionPda, voterPubkey)

  const credential = query.data?.exists ? query.data.data : null

  return {
    ...query,
    credential,
    isRegistered: !!credential,
    isVerified: credential?.isVerified ?? false,
    hasVoted: credential?.hasVoted ?? false,
    canVote: credential?.isVerified && !credential?.hasVoted,
    verificationCode: credential?.verificationCode ?? null,
    aiConfidenceScore: credential?.aiConfidenceScore ?? null,
  }
}
