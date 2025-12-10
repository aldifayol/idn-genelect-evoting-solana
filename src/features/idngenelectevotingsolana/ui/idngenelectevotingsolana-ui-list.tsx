import { IdngenelectevotingsolanaUiCard } from './idngenelectevotingsolana-ui-card'
import { useIdngenelectevotingsolanaAccountsQuery } from '@/features/idngenelectevotingsolana/data-access/use-idngenelectevotingsolana-accounts-query'
import { UiWalletAccount } from '@wallet-ui/react'

export function IdngenelectevotingsolanaUiList({ account }: { account: UiWalletAccount }) {
  const idngenelectevotingsolanaAccountsQuery = useIdngenelectevotingsolanaAccountsQuery()

  if (idngenelectevotingsolanaAccountsQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!idngenelectevotingsolanaAccountsQuery.data?.length) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No accounts</h2>
        No accounts found. Initialize one to get started.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {idngenelectevotingsolanaAccountsQuery.data?.map((idngenelectevotingsolana) => (
        <IdngenelectevotingsolanaUiCard account={account} key={idngenelectevotingsolana.address} idngenelectevotingsolana={idngenelectevotingsolana} />
      ))}
    </div>
  )
}
