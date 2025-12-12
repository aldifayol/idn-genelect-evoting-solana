'use client'

import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useElectionAccountsQuery } from '@/features/evoting/data-access/use-election-query'
import { AdminForms } from './admin-forms'

export default function AdminPage() {
  const { account } = useSolana()
  const { data: elections, isLoading: loadingElections } = useElectionAccountsQuery()

  if (!account) {
    return (
      <div className="space-y-8">
        <AppHero title="Admin Panel" subtitle="Connect your wallet to manage elections" />
        <div className="max-w-md mx-auto text-center">
          <WalletDropdown />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <AppHero
        title="Admin Panel"
        subtitle="Initialize elections, register candidates, and manage the voting system"
      />

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Connected Wallet Info */}
        <Alert>
          <AlertTitle>Connected Wallet</AlertTitle>
          <AlertDescription className="font-mono text-sm break-all">
            {account.address}
          </AlertDescription>
        </Alert>

        {/* Admin Forms - Only render when account is available */}
        <AdminForms account={account} elections={elections} />

        {/* Existing Elections */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Elections</CardTitle>
            <CardDescription>Elections on this network</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingElections ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : elections && elections.length > 0 ? (
              <div className="space-y-2">
                {elections.map((election) => (
                  <div
                    key={election.address}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{election.data.electionName}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {election.data.isActive ? 'Active' : 'Not Active'}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{Number(election.data.totalRegisteredVoters)} voters</p>
                      <p>{Number(election.data.totalVotesCast)} votes</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No elections found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
