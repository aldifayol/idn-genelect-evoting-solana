'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useInitializeElectionMutation } from '@/features/evoting/data-access/use-initialize-election-mutation'
import { useRegisterCandidateMutation } from '@/features/evoting/data-access/use-register-candidate-mutation'
import { useActivateElectionMutation } from '@/features/evoting/data-access/use-activate-election-mutation'
import { deriveElectionPDA } from '@/lib/pda'
import type { Address } from 'gill'
import type { UiWalletAccount } from '@wallet-ui/react'
import type { ElectionAccount } from '@project/anchor'

interface AdminFormsProps {
  account: UiWalletAccount
  elections: ElectionAccount[] | undefined
}

export function AdminForms({ account, elections }: AdminFormsProps) {
  // Initialize Election Form State
  const [electionName, setElectionName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [requiredSignatures, setRequiredSignatures] = useState(1)

  // Register Candidate Form State
  const [selectedElection, setSelectedElection] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [candidateId, setCandidateId] = useState(1)

  // Activate Election State
  const [activateElectionName, setActivateElectionName] = useState('')

  // Mutations
  const initializeElectionMutation = useInitializeElectionMutation({ account })
  const registerCandidateMutation = useRegisterCandidateMutation({ account })
  const activateElectionMutation = useActivateElectionMutation({ account })

  const handleInitializeElection = async (e: React.FormEvent) => {
    e.preventDefault()

    const start = new Date(startDate)
    const end = new Date(endDate)

    await initializeElectionMutation.mutateAsync({
      electionName,
      startTime: start,
      endTime: end,
      commissioners: [account.address],
      requiredSignatures,
    })

    // Reset form
    setElectionName('')
    setStartDate('')
    setEndDate('')
  }

  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedElection) return

    const electionPda = await deriveElectionPDA(selectedElection)

    await registerCandidateMutation.mutateAsync({
      electionPda: electionPda as Address,
      candidateName,
      candidateId,
    })

    // Reset form
    setCandidateName('')
    setCandidateId((prev) => prev + 1)
  }

  const handleActivateElection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activateElectionName) return

    const electionPda = await deriveElectionPDA(activateElectionName)

    await activateElectionMutation.mutateAsync({
      electionPda: electionPda as Address,
    })
  }

  return (
    <>
      {/* Initialize Election */}
      <Card>
        <CardHeader>
          <CardTitle>Initialize New Election</CardTitle>
          <CardDescription>
            Create a new election. Your wallet will be set as the commissioner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInitializeElection} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="electionName">Election Name</Label>
              <Input
                id="electionName"
                value={electionName}
                onChange={(e) => setElectionName(e.target.value)}
                placeholder="e.g., Presidential Election 2024"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date & Time</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredSignatures">Required Signatures</Label>
              <Input
                id="requiredSignatures"
                type="number"
                min={1}
                max={1}
                value={requiredSignatures}
                onChange={(e) => setRequiredSignatures(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Number of commissioner signatures required (max = number of commissioners)
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={initializeElectionMutation.isPending}>
              {initializeElectionMutation.isPending ? (
                <>
                  <Spinner className="mr-2" /> Creating Election...
                </>
              ) : (
                'Create Election'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Register Candidate */}
      <Card>
        <CardHeader>
          <CardTitle>Register Candidate</CardTitle>
          <CardDescription>Add a candidate to an existing election</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegisterCandidate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="selectedElection">Select Election</Label>
              <select
                id="selectedElection"
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value)}
                className="w-full h-9 px-3 rounded-md border bg-background"
                required
              >
                <option value="">Select an election...</option>
                {elections?.map((election) => (
                  <option key={election.address} value={election.data.electionName}>
                    {election.data.electionName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidateName">Candidate Name</Label>
                <Input
                  id="candidateName"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g., John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidateId">Candidate ID</Label>
                <Input
                  id="candidateId"
                  type="number"
                  min={1}
                  value={candidateId}
                  onChange={(e) => setCandidateId(parseInt(e.target.value))}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerCandidateMutation.isPending || !selectedElection}
            >
              {registerCandidateMutation.isPending ? (
                <>
                  <Spinner className="mr-2" /> Registering Candidate...
                </>
              ) : (
                'Register Candidate'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Activate Election */}
      <Card>
        <CardHeader>
          <CardTitle>Activate Election</CardTitle>
          <CardDescription>
            Activate an election to allow voting. Only commissioners can do this.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivateElection} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activateElection">Select Election to Activate</Label>
              <select
                id="activateElection"
                value={activateElectionName}
                onChange={(e) => setActivateElectionName(e.target.value)}
                className="w-full h-9 px-3 rounded-md border bg-background"
                required
              >
                <option value="">Select an election...</option>
                {elections
                  ?.filter((e) => !e.data.isActive)
                  .map((election) => (
                    <option key={election.address} value={election.data.electionName}>
                      {election.data.electionName} (Not Active)
                    </option>
                  ))}
              </select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={activateElectionMutation.isPending || !activateElectionName}
            >
              {activateElectionMutation.isPending ? (
                <>
                  <Spinner className="mr-2" /> Activating Election...
                </>
              ) : (
                'Activate Election'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
