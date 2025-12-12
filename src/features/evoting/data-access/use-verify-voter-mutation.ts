'use client'

import { useSolana } from '@/components/solana/use-solana'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { getVerifyVoterInstructionAsync } from '@project/anchor'
import { toastTx } from '@/components/toast-tx'
import { toast } from 'sonner'
import { sha256 } from '@/lib/crypto'
import { uploadToIPFSWithFallback } from '@/lib/ipfs'
import type { Address } from 'gill'

interface VerifyVoterInput {
  electionPda: Address
  voterNik: string
  biometricData: string
  photo: File | null
}

export function useVerifyVoterMutation({ account }: { account: UiWalletAccount }) {
  useSolana()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner({ account })
  const signAndSend = useWalletUiSignAndSend()

  return useMutation({
    mutationFn: async (input: VerifyVoterInput) => {
      const { electionPda, voterNik, biometricData, photo } = input

      // Validate NIK
      if (voterNik.length !== 16 || !/^\d+$/.test(voterNik)) {
        throw new Error('NIK must be exactly 16 digits')
      }

      // Hash biometric data
      const biometricHash = await sha256(biometricData || `biometric_${account.address}`)

      // Upload photo to IPFS
      const photoIpfsHash = photo
        ? await uploadToIPFSWithFallback(photo)
        : 'QmPlaceholderHash000000000000000000000000'

      // Current timestamp
      const verificationTimestamp = BigInt(Math.floor(Date.now() / 1000))

      // AI confidence score (in production, this would come from AI verification service)
      const aiConfidenceScore = 95

      // Build and send the instruction
      const instruction = await getVerifyVoterInstructionAsync({
        voter: signer,
        election: electionPda,
        voterNik,
        biometricHash,
        photoIpfsHash,
        verificationTimestamp,
        aiConfidenceScore,
      })

      return await signAndSend(instruction, signer)
    },
    onSuccess: async (tx, variables) => {
      toastTx(tx)
      toast.success('Voter registration successful!')
      // Invalidate relevant queries
      await queryClient.invalidateQueries({
        queryKey: ['evoting', 'voterCredential', variables.electionPda, account.address],
      })
      await queryClient.invalidateQueries({
        queryKey: ['evoting', 'election'],
      })
    },
    onError: (error: Error) => {
      console.error('Voter registration failed:', error)
      toast.error(`Registration failed: ${error.message}`)
    },
  })
}
