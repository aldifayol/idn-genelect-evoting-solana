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

      console.log('Building verify voter instruction with params:', {
        voter: account.address,
        election: electionPda,
        voterNik,
        biometricHashLength: biometricHash.length,
        photoIpfsHash,
        verificationTimestamp: verificationTimestamp.toString(),
        aiConfidenceScore,
      })

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

      console.log('Instruction created successfully')
      console.log('Instruction accounts:', instruction.accounts)
      console.log('Instruction program:', instruction.programAddress)

      // Log the accounts in detail for debugging
      console.log('Account details:')
      instruction.accounts.forEach((acc, i) => {
        console.log(`  [${i}]:`, acc)
      })

      console.log('Sending transaction to wallet...')
      const result = await signAndSend(instruction, signer)
      console.log('Transaction result:', result)
      return result
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
