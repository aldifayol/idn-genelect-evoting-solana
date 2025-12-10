import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { IdngenelectevotingsolanaUiButtonInitialize } from './ui/idngenelectevotingsolana-ui-button-initialize'
import { IdngenelectevotingsolanaUiList } from './ui/idngenelectevotingsolana-ui-list'
import { IdngenelectevotingsolanaUiProgramExplorerLink } from './ui/idngenelectevotingsolana-ui-program-explorer-link'
import { IdngenelectevotingsolanaUiProgramGuard } from './ui/idngenelectevotingsolana-ui-program-guard'

export default function IdngenelectevotingsolanaFeature() {
  const { account } = useSolana()

  return (
    <IdngenelectevotingsolanaUiProgramGuard>
      <AppHero
        title="Idngenelectevotingsolana"
        subtitle={
          account
            ? "Initialize a new idngenelectevotingsolana onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <IdngenelectevotingsolanaUiProgramExplorerLink />
        </p>
        {account ? (
          <IdngenelectevotingsolanaUiButtonInitialize account={account} />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletDropdown />
          </div>
        )}
      </AppHero>
      {account ? <IdngenelectevotingsolanaUiList account={account} /> : null}
    </IdngenelectevotingsolanaUiProgramGuard>
  )
}
