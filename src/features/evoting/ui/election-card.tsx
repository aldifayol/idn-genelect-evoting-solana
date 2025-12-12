'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useElectionQuery } from '../data-access/use-election-query'
import { useElectionCandidatesQuery } from '../data-access/use-candidate-query'
import { deriveElectionPDA } from '@/lib/pda'
import { useEffect, useState } from 'react'

interface ElectionCardProps {
  electionName: string
}

export function ElectionCard({ electionName }: ElectionCardProps) {
  const [electionPda, setElectionPda] = useState<string | null>(null)
  const { data: electionAccount, isLoading: loadingElection, error } = useElectionQuery(electionName)
  const { data: candidates, isLoading: loadingCandidates } = useElectionCandidatesQuery(electionPda)

  useEffect(() => {
    deriveElectionPDA(electionName).then((pda) => setElectionPda(pda as string))
  }, [electionName])

  if (loadingElection) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8">
          <p className="text-destructive text-center">Error loading election: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (!electionAccount?.exists) {
    return (
      <Card className="border-yellow-500">
        <CardContent className="py-8">
          <p className="text-yellow-600 text-center">Election not found: {electionName}</p>
        </CardContent>
      </Card>
    )
  }

  const election = electionAccount.data
  const now = Date.now() / 1000

  const getStatus = () => {
    if (!election.isActive) return { label: 'Not Active', color: 'bg-gray-100 text-gray-600' }
    if (now < Number(election.startTime)) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-600' }
    if (now > Number(election.endTime)) return { label: 'Ended', color: 'bg-red-100 text-red-600' }
    return { label: 'Active', color: 'bg-green-100 text-green-600' }
  }

  const status = getStatus()

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{election.electionName}</CardTitle>
            <CardDescription>
              {election.commissioners.length} commissioner(s) | {election.requiredSignatures} required signatures
            </CardDescription>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>{status.label}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-sm">Registered Voters</p>
            <p className="text-2xl font-bold">{Number(election.totalRegisteredVoters).toLocaleString()}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-sm">Votes Cast</p>
            <p className="text-2xl font-bold">{Number(election.totalVotesCast).toLocaleString()}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-sm">Start Time</p>
            <p className="text-sm font-medium">{new Date(Number(election.startTime) * 1000).toLocaleString()}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-sm">End Time</p>
            <p className="text-sm font-medium">{new Date(Number(election.endTime) * 1000).toLocaleString()}</p>
          </div>
        </div>

        {/* Turnout Bar */}
        {Number(election.totalRegisteredVoters) > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Voter Turnout</span>
              <span className="font-medium">
                {((Number(election.totalVotesCast) / Number(election.totalRegisteredVoters)) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((Number(election.totalVotesCast) / Number(election.totalRegisteredVoters)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Candidates */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Candidates</h3>
          {loadingCandidates ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : candidates && candidates.length > 0 ? (
            <div className="space-y-2">
              {candidates
                .sort((a, b) => Number(b.data.voteCount) - Number(a.data.voteCount))
                .map((candidate) => (
                  <div
                    key={candidate.address}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{candidate.data.candidateName}</span>
                      <span className="text-muted-foreground text-sm ml-2">#{candidate.data.candidateId}</span>
                    </div>
                    <span className="font-bold">{Number(candidate.data.voteCount).toLocaleString()} votes</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No candidates registered yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
