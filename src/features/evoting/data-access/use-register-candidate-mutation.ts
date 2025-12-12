'use client'

import { useSolana } from '@/components/solana/use-solana'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { getRegisterCandidateInstructionAsync } from '@project/anchor'
import { toastTx } from '@/components/toast-tx'
import { toast } from 'sonner'
import type { Address } from 'gill'

interface RegisterCandidateInput {
  electionPda: Address
  candidateName: string
  candidateId: number
}

export function useRegisterCandidateMutation({ account }: { account: UiWalletAccount }) {
  useSolana()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner({ account })
  const signAndSend = useWalletUiSignAndSend()

  return useMutation({
    mutationFn: async (input: RegisterCandidateInput) => {
      const { electionPda, candidateName, candidateId } = input

      if (!candidateName || candidateName.trim().length === 0) {
        throw new Error('Candidate name is required')
      }

      // Build and send the instruction
      const instruction = await getRegisterCandidateInstructionAsync({
        authority: signer,
        election: electionPda,
        candidateName: candidateName.trim(),
        candidateId,
      })

      return await signAndSend(instruction, signer)
    },
    onSuccess: async (tx, variables) => {
      toastTx(tx)
      toast.success('Candidate registered successfully!')
      // Invalidate candidate queries
      await queryClient.invalidateQueries({ queryKey: ['evoting', 'candidates'] })
      await queryClient.invalidateQueries({
        queryKey: ['evoting', 'candidates', variables.electionPda],
      })
    },
    onError: (error: Error) => {
      console.error('Candidate registration failed:', error)
      toast.error(`Failed to register candidate: ${error.message}`)
    },
  })
}
