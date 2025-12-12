'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useVoterStatus } from '../data-access/use-voter-credential-query'
import { useVerifyVoterMutation } from '../data-access/use-verify-voter-mutation'
import { deriveElectionPDA } from '@/lib/pda'
import type { Address } from 'gill'
import type { UiWalletAccount } from '@wallet-ui/react'

interface VoterRegistrationProps {
  electionName: string
  account: UiWalletAccount
  onSuccess?: () => void
}

export function VoterRegistration({ electionName, account, onSuccess }: VoterRegistrationProps) {
  const [electionPda, setElectionPda] = useState<string | null>(null)
  const { isRegistered, isVerified, hasVoted, verificationCode, aiConfidenceScore, isLoading } =
    useVoterStatus(electionPda, account.address)
  const mutation = useVerifyVoterMutation({ account })

  // Form state
  const [nik, setNik] = useState('')
  const [biometricData, setBiometricData] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)

  useEffect(() => {
    deriveElectionPDA(electionName).then((pda) => setElectionPda(pda as string))
  }, [electionName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!electionPda) return

    try {
      await mutation.mutateAsync({
        electionPda: electionPda as Address,
        voterNik: nik,
        biometricData,
        photo,
      })
      onSuccess?.()
    } catch {
      // Error is handled in mutation
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  // Already registered
  if (isRegistered && isVerified) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <AlertTitle className="text-green-700 dark:text-green-300">You are registered!</AlertTitle>
        <AlertDescription className="text-green-600 dark:text-green-400 space-y-2">
          <p>
            Your verification code:{' '}
            <code className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded font-mono">
              {verificationCode}
            </code>
          </p>
          <p className="text-sm">AI Confidence Score: {aiConfidenceScore}%</p>
          {hasVoted && <p className="text-sm font-medium">You have already voted in this election.</p>}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voter Registration</CardTitle>
        <CardDescription>Register to vote in this election by verifying your identity</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* NIK Input */}
          <div className="space-y-2">
            <Label htmlFor="nik">NIK (National Identity Number)</Label>
            <Input
              id="nik"
              type="text"
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="Enter 16-digit NIK"
              maxLength={16}
              required
            />
            <p className="text-xs text-muted-foreground">{nik.length}/16 digits</p>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="photo">Photo with ID Card</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">Take a selfie holding your ID card</p>
          </div>

          {/* Biometric Data (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="biometric">Biometric Data (Optional)</Label>
            <Input
              id="biometric"
              type="text"
              value={biometricData}
              onChange={(e) => setBiometricData(e.target.value)}
              placeholder="Biometric verification data"
            />
            <p className="text-xs text-muted-foreground">In production, this comes from biometric scanner</p>
          </div>

          {/* Error Display */}
          {mutation.error && (
            <Alert variant="destructive">
              <AlertTitle>Registration Failed</AlertTitle>
              <AlertDescription>{mutation.error.message}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={mutation.isPending || nik.length !== 16}>
            {mutation.isPending ? (
              <>
                <Spinner className="mr-2" />
                Registering...
              </>
            ) : (
              'Register as Voter'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
