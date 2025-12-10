import { IdngenelectevotingsolanaAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useIdngenelectevotingsolanaDecrementMutation } from '../data-access/use-idngenelectevotingsolana-decrement-mutation'

export function IdngenelectevotingsolanaUiButtonDecrement({ account, idngenelectevotingsolana }: { account: UiWalletAccount; idngenelectevotingsolana: IdngenelectevotingsolanaAccount }) {
  const decrementMutation = useIdngenelectevotingsolanaDecrementMutation({ account, idngenelectevotingsolana })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}
