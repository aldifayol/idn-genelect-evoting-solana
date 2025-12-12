'use client'

import { useState } from 'react'
import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { ElectionCard } from './ui/election-card'
import { VoterRegistration } from './ui/voter-registration'
import { VotingBooth } from './ui/voting-booth'
import { VerifyReceipt } from './ui/verify-receipt'
import { Button } from '@/components/ui/button'

interface EvotingFeatureProps {
  electionName: string
}

type TabType = 'vote' | 'register' | 'verify'

export default function EvotingFeature({ electionName }: EvotingFeatureProps) {
  const { account } = useSolana()
  const [activeTab, setActiveTab] = useState<TabType>('vote')

  const tabs: { id: TabType; label: string }[] = [
    { id: 'vote', label: 'Vote' },
    { id: 'register', label: 'Register' },
    { id: 'verify', label: 'Verify' },
  ]

  return (
    <div className="space-y-8">
      <AppHero
        title="Indonesia E-Voting"
        subtitle={
          account
            ? `Participate in: ${electionName}`
            : 'Connect your wallet to participate in the election'
        }
      >
        {!account && (
          <div className="inline-block mt-4">
            <WalletDropdown />
          </div>
        )}
      </AppHero>

      {/* Election Info */}
      <div className="max-w-4xl mx-auto px-4">
        <ElectionCard electionName={electionName} />
      </div>

      {/* Tabs and Content - Only show when wallet is connected */}
      {account && (
        <div className="max-w-4xl mx-auto px-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-muted mb-6">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-none border-b-2 py-4 ${
                  activeTab === tab.id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'vote' && (
              <VotingBooth electionName={electionName} account={account} />
            )}
            {activeTab === 'register' && (
              <VoterRegistration
                electionName={electionName}
                account={account}
                onSuccess={() => setActiveTab('vote')}
              />
            )}
            {activeTab === 'verify' && <VerifyReceipt electionName={electionName} />}
          </div>
        </div>
      )}
    </div>
  )
}
