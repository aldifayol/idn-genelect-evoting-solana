'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useBallotByReceiptQuery } from '../data-access/use-ballot-query'
import { deriveElectionPDA } from '@/lib/pda'

interface VerifyReceiptProps {
  electionName: string
}

export function VerifyReceipt({ electionName }: VerifyReceiptProps) {
  const [electionPda, setElectionPda] = useState<string | null>(null)
  const [receipt, setReceipt] = useState('')
  const [searchReceipt, setSearchReceipt] = useState('')

  const { data: ballot, isLoading, error, isFetched } = useBallotByReceiptQuery(electionPda, searchReceipt)

  useEffect(() => {
    deriveElectionPDA(electionName).then((pda) => setElectionPda(pda as string))
  }, [electionName])

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (receipt.trim()) {
      setSearchReceipt(receipt.trim())
    }
  }

  const handleClear = () => {
    setReceipt('')
    setSearchReceipt('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Your Vote</CardTitle>
        <CardDescription>
          Enter your ballot receipt to verify that your vote was recorded correctly
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt">Ballot Receipt</Label>
            <Input
              id="receipt"
              type="text"
              value={receipt}
              onChange={(e) => setReceipt(e.target.value)}
              placeholder="Enter your ballot receipt code"
              className="font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={!receipt.trim() || isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify Receipt'
              )}
            </Button>
            {searchReceipt && (
              <Button type="button" variant="outline" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
        </form>

        {/* Results */}
        {searchReceipt && isFetched && !isLoading && (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            {ballot ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <AlertTitle className="text-green-700 dark:text-green-300">Vote Verified!</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400 space-y-2">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ballot Sequence:</span>
                      <span className="font-mono">#{Number(ballot.data.ballotSequence)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recorded At:</span>
                      <span>{new Date(Number(ballot.data.timestamp) * 1000).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-green-600 font-medium">Verified</span>
                    </div>
                  </div>
                  <p className="text-xs mt-2">
                    Note: The candidate you voted for is not revealed to protect ballot secrecy.
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Receipt Not Found</AlertTitle>
                <AlertDescription>
                  No ballot was found with this receipt code. Please check your receipt and try again.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Info */}
        <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
          <p className="font-medium">How Vote Verification Works:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Each ballot has a unique verification receipt</li>
            <li>You can verify your vote was recorded without revealing your choice</li>
            <li>This ensures election integrity while maintaining ballot secrecy</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
