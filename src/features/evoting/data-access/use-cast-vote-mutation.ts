'use client'

import { useSolana } from '@/components/solana/use-solana'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { getCastVoteInstructionAsync } from '@project/anchor'
import { toastTx } from '@/components/toast-tx'
import { toast } from 'sonner'
import { encryptVoteData } from '@/lib/crypto'
import { deriveCandidatePDA, deriveBallotPDA } from '@/lib/pda'
import type { Address } from 'gill'

interface CastVoteInput {
  electionPda: Address
  candidateId: number
  ballotSequence: bigint
}

export function useCastVoteMutation({ account }: { account: UiWalletAccount }) {
  useSolana()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner({ account })
  const signAndSend = useWalletUiSignAndSend()

  return useMutation({
    mutationFn: async (input: CastVoteInput) => {
      const { electionPda, candidateId, ballotSequence } = input

      // Derive PDAs
      const candidatePda = await deriveCandidatePDA(electionPda, candidateId)
      const ballotPda = await deriveBallotPDA(electionPda, ballotSequence)

      // Create encrypted vote data
      const encryptedVoteData = await encryptVoteData(
        candidateId,
        account.address,
        Date.now()
      )

      // Build and send the instruction
      const instruction = await getCastVoteInstructionAsync({
        voter: signer,
        election: electionPda,
        candidate: candidatePda as Address,
        ballot: ballotPda as Address,
        encryptedVoteData,
      })

      return await signAndSend(instruction, signer)
    },
    onSuccess: async (tx, variables) => {
      toastTx(tx)
      toast.success('Vote cast successfully! Save your receipt.')
      // Invalidate relevant queries
      await queryClient.invalidateQueries({
        queryKey: ['evoting', 'voterCredential', variables.electionPda, account.address],
      })
      await queryClient.invalidateQueries({
        queryKey: ['evoting', 'election'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['evoting', 'candidates'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['evoting', 'ballots'],
      })
    },
    onError: (error: Error) => {
      console.error('Vote casting failed:', error)
      toast.error(`Vote failed: ${error.message}`)
    },
  })
}
