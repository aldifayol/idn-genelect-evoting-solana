'use client'

import { useSolana } from '@/components/solana/use-solana'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { getActivateElectionInstruction } from '@project/anchor'
import { toastTx } from '@/components/toast-tx'
import { toast } from 'sonner'
import type { Address } from 'gill'

interface ActivateElectionInput {
  electionPda: Address
}

export function useActivateElectionMutation({ account }: { account: UiWalletAccount }) {
  useSolana()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner({ account })
  const signAndSend = useWalletUiSignAndSend()

  return useMutation({
    mutationFn: async (input: ActivateElectionInput) => {
      const { electionPda } = input

      // Build and send the instruction (sync version)
      const instruction = getActivateElectionInstruction({
        commissioner: signer,
        election: electionPda,
      })

      return await signAndSend(instruction, signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      toast.success('Election activated successfully!')
      // Invalidate election queries
      await queryClient.invalidateQueries({ queryKey: ['evoting', 'elections'] })
      await queryClient.invalidateQueries({
        queryKey: ['evoting', 'election'],
      })
    },
    onError: (error: Error) => {
      console.error('Election activation failed:', error)
      toast.error(`Failed to activate election: ${error.message}`)
    },
  })
}
