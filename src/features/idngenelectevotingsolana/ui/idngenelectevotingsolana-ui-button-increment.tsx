import { IdngenelectevotingsolanaAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'
import { useIdngenelectevotingsolanaIncrementMutation } from '../data-access/use-idngenelectevotingsolana-increment-mutation'

export function IdngenelectevotingsolanaUiButtonIncrement({ account, idngenelectevotingsolana }: { account: UiWalletAccount; idngenelectevotingsolana: IdngenelectevotingsolanaAccount }) {
  const incrementMutation = useIdngenelectevotingsolanaIncrementMutation({ account, idngenelectevotingsolana })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}
