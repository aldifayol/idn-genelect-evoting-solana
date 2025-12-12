'use client'

import { useSolana } from '@/components/solana/use-solana'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { getInitializeElectionInstructionAsync } from '@project/anchor'
import { toastTx } from '@/components/toast-tx'
import { toast } from 'sonner'
import type { Address } from 'gill'

interface InitializeElectionInput {
  electionName: string
  startTime: Date
  endTime: Date
  commissioners: string[] // Array of commissioner wallet addresses
  requiredSignatures: number
}

export function useInitializeElectionMutation({ account }: { account: UiWalletAccount }) {
  useSolana()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner({ account })
  const signAndSend = useWalletUiSignAndSend()

  return useMutation({
    mutationFn: async (input: InitializeElectionInput) => {
      const { electionName, startTime, endTime, commissioners, requiredSignatures } = input

      // Validate inputs
      if (!electionName || electionName.trim().length === 0) {
        throw new Error('Election name is required')
      }

      if (commissioners.length === 0) {
        throw new Error('At least one commissioner is required')
      }

      if (requiredSignatures > commissioners.length) {
        throw new Error('Required signatures cannot exceed number of commissioners')
      }

      if (startTime >= endTime) {
        throw new Error('End time must be after start time')
      }

      // Convert dates to Unix timestamps
      const startTimestamp = BigInt(Math.floor(startTime.getTime() / 1000))
      const endTimestamp = BigInt(Math.floor(endTime.getTime() / 1000))

      console.log('Creating election with params:', {
        electionName: electionName.trim(),
        startTime: startTimestamp.toString(),
        endTime: endTimestamp.toString(),
        commissioners,
        requiredSignatures,
        authority: account.address,
      })

      try {
        // Build the instruction
        console.log('Building instruction...')
        const instruction = await getInitializeElectionInstructionAsync({
          authority: signer,
          electionName: electionName.trim(),
          startTime: startTimestamp,
          endTime: endTimestamp,
          commissioners: commissioners as Address[],
          requiredSignatures,
        })

        console.log('Instruction created successfully')
        console.log('Instruction accounts:', instruction.accounts)
        console.log('Instruction program:', instruction.programAddress)

        // Send the transaction
        console.log('Sending transaction to wallet...')
        const result = await signAndSend(instruction, signer)
        console.log('Transaction result:', result)
        return result
      } catch (err: unknown) {
        console.error('=== ERROR DETAILS ===')
        console.error('Error object:', err)
        if (err instanceof Error) {
          console.error('Error message:', err.message)
          console.error('Error stack:', err.stack)
        }
        // Check if it's a Solana error with logs
        if (typeof err === 'object' && err !== null && 'logs' in err) {
          console.error('Transaction logs:', (err as { logs: string[] }).logs)
        }
        throw err
      }
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      toast.success('Election initialized successfully!')
      // Invalidate election queries
      await queryClient.invalidateQueries({ queryKey: ['evoting', 'elections'] })
    },
    onError: (error: Error) => {
      console.error('Election initialization failed:', error)
      toast.error(`Failed to initialize election: ${error.message}`)
    },
  })
}
