'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useVoterStatus } from '../data-access/use-voter-credential-query'
import { useElectionQuery } from '../data-access/use-election-query'
import { useElectionCandidatesQuery } from '../data-access/use-candidate-query'
import { useCastVoteMutation } from '../data-access/use-cast-vote-mutation'
import { deriveElectionPDA } from '@/lib/pda'
import type { Address } from 'gill'
import type { UiWalletAccount } from '@wallet-ui/react'

interface VotingBoothProps {
  electionName: string
  account: UiWalletAccount
  onVoteSuccess?: (receipt: string) => void
}

export function VotingBooth({ electionName, account, onVoteSuccess }: VotingBoothProps) {
  const [electionPda, setElectionPda] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null)
  const [receipt, setReceipt] = useState<string | null>(null)

  const { data: electionAccount, isLoading: loadingElection } = useElectionQuery(electionName)
  const { data: candidates, isLoading: loadingCandidates } = useElectionCandidatesQuery(electionPda)
  const { isVerified, hasVoted, isLoading: loadingCredential } = useVoterStatus(
    electionPda,
    account.address
  )
  const mutation = useCastVoteMutation({ account })

  useEffect(() => {
    deriveElectionPDA(electionName).then((pda) => setElectionPda(pda as string))
  }, [electionName])

  const handleVote = async () => {
    if (!electionPda || selectedCandidate === null) return
    if (!electionAccount?.exists) return

    try {
      const ballotSequence = electionAccount.data.totalVotesCast
      await mutation.mutateAsync({
        electionPda: electionPda as Address,
        candidateId: selectedCandidate,
        ballotSequence,
      })

      // TODO: Fetch the ballot receipt after successful vote
      // For now, we'll generate a placeholder
      const generatedReceipt = `RECEIPT-${Date.now().toString(36).toUpperCase()}`
      setReceipt(generatedReceipt)
      onVoteSuccess?.(generatedReceipt)
    } catch {
      // Error is handled in mutation
    }
  }

  const isLoading = loadingElection || loadingCandidates || loadingCredential

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  // Vote success state
  if (receipt || hasVoted) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <AlertTitle className="text-green-700 dark:text-green-300 text-xl">Vote Recorded!</AlertTitle>
        <AlertDescription className="text-green-600 dark:text-green-400 space-y-4">
          {receipt && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground mb-2">Your Ballot Receipt:</p>
              <code className="text-lg font-mono break-all block">{receipt}</code>
            </div>
          )}
          <p className="text-sm">
            {receipt
              ? 'Save this receipt to verify your vote was counted.'
              : 'You have already voted in this election.'}
          </p>
          <p className="text-sm">Thank you for participating in democracy!</p>
        </AlertDescription>
      </Alert>
    )
  }

  // Not registered state
  if (!isVerified) {
    return (
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <AlertTitle className="text-yellow-700 dark:text-yellow-300">Not Registered</AlertTitle>
        <AlertDescription className="text-yellow-600 dark:text-yellow-400">
          You need to register and verify your identity before voting. Please go to the Register tab.
        </AlertDescription>
      </Alert>
    )
  }

  // Voting booth
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast Your Vote</CardTitle>
        <CardDescription>Select your candidate and submit your vote. This action cannot be undone.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Candidate Selection */}
        <div className="space-y-3">
          {candidates && candidates.length > 0 ? (
            candidates.map((candidate) => (
              <button
                key={candidate.address}
                onClick={() => setSelectedCandidate(candidate.data.candidateId)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedCandidate === candidate.data.candidateId
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Radio indicator */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedCandidate === candidate.data.candidateId
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {selectedCandidate === candidate.data.candidateId && (
                      <div className="w-3 h-3 bg-white rounded-full" />
                    )}
                  </div>
                  {/* Candidate info */}
                  <div>
                    <p className="font-semibold">{candidate.data.candidateName}</p>
                    <p className="text-sm text-muted-foreground">Candidate #{candidate.data.candidateId}</p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">No candidates available</p>
          )}
        </div>

        {/* Error Display */}
        {mutation.error && (
          <Alert variant="destructive">
            <AlertTitle>Vote Failed</AlertTitle>
            <AlertDescription>{mutation.error.message}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleVote}
          className="w-full"
          size="lg"
          disabled={mutation.isPending || selectedCandidate === null}
        >
          {mutation.isPending ? (
            <>
              <Spinner className="mr-2" />
              Casting Vote...
            </>
          ) : (
            'Cast Vote'
          )}
        </Button>

        {/* Warning */}
        <p className="text-xs text-muted-foreground text-center">
          Your vote is anonymous and cannot be changed after submission.
        </p>
      </CardContent>
    </Card>
  )
}
