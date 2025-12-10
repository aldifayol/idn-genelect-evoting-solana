import { IdngenelectevotingsolanaAccount } from '@project/anchor'
import { ellipsify, UiWalletAccount } from '@wallet-ui/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { IdngenelectevotingsolanaUiButtonClose } from './idngenelectevotingsolana-ui-button-close'
import { IdngenelectevotingsolanaUiButtonDecrement } from './idngenelectevotingsolana-ui-button-decrement'
import { IdngenelectevotingsolanaUiButtonIncrement } from './idngenelectevotingsolana-ui-button-increment'
import { IdngenelectevotingsolanaUiButtonSet } from './idngenelectevotingsolana-ui-button-set'

export function IdngenelectevotingsolanaUiCard({ account, idngenelectevotingsolana }: { account: UiWalletAccount; idngenelectevotingsolana: IdngenelectevotingsolanaAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Idngenelectevotingsolana: {idngenelectevotingsolana.data.count}</CardTitle>
        <CardDescription>
          Account: <AppExplorerLink address={idngenelectevotingsolana.address} label={ellipsify(idngenelectevotingsolana.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-evenly">
          <IdngenelectevotingsolanaUiButtonIncrement account={account} idngenelectevotingsolana={idngenelectevotingsolana} />
          <IdngenelectevotingsolanaUiButtonSet account={account} idngenelectevotingsolana={idngenelectevotingsolana} />
          <IdngenelectevotingsolanaUiButtonDecrement account={account} idngenelectevotingsolana={idngenelectevotingsolana} />
          <IdngenelectevotingsolanaUiButtonClose account={account} idngenelectevotingsolana={idngenelectevotingsolana} />
        </div>
      </CardContent>
    </Card>
  )
}
