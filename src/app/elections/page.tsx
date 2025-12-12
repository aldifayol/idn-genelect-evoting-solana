'use client'

import Link from 'next/link'
import { AppHero } from '@/components/app-hero'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useElectionAccountsQuery } from '@/features/evoting/data-access/use-election-query'

export default function ElectionsPage() {
  const { data: elections, isLoading, error } = useElectionAccountsQuery()

  return (
    <div className="space-y-8">
      <AppHero
        title="Elections"
        subtitle="View and participate in available elections on the Solana blockchain"
      />

      <div className="max-w-4xl mx-auto px-4">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-8">
              <p className="text-destructive text-center">Error loading elections: {error.message}</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && elections && elections.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No elections found on this network</p>
              <p className="text-sm text-muted-foreground">
                Elections need to be initialized by commissioners first.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && elections && elections.length > 0 && (
          <div className="grid gap-4">
            {elections.map((election) => {
              const now = Date.now() / 1000
              const startTime = Number(election.data.startTime)
              const endTime = Number(election.data.endTime)

              const getStatus = () => {
                if (!election.data.isActive) return { label: 'Not Active', color: 'bg-gray-100 text-gray-600' }
                if (now < startTime) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-600' }
                if (now > endTime) return { label: 'Ended', color: 'bg-red-100 text-red-600' }
                return { label: 'Active', color: 'bg-green-100 text-green-600' }
              }

              const status = getStatus()

              return (
                <Card key={election.address}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{election.data.electionName}</CardTitle>
                        <CardDescription>
                          {Number(election.data.totalRegisteredVoters)} voters registered |{' '}
                          {Number(election.data.totalVotesCast)} votes cast
                        </CardDescription>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        <p>Start: {new Date(startTime * 1000).toLocaleDateString()}</p>
                        <p>End: {new Date(endTime * 1000).toLocaleDateString()}</p>
                      </div>
                      <Link href={`/vote/${encodeURIComponent(election.data.electionName)}`}>
                        <Button>View Election</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
