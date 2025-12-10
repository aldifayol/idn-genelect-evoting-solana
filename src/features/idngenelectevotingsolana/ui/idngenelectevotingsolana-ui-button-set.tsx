import { IdngenelectevotingsolanaAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useIdngenelectevotingsolanaSetMutation } from '@/features/idngenelectevotingsolana/data-access/use-idngenelectevotingsolana-set-mutation'

export function IdngenelectevotingsolanaUiButtonSet({ account, idngenelectevotingsolana }: { account: UiWalletAccount; idngenelectevotingsolana: IdngenelectevotingsolanaAccount }) {
  const setMutation = useIdngenelectevotingsolanaSetMutation({ account, idngenelectevotingsolana })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', idngenelectevotingsolana.data.count.toString() ?? '0')
        if (!value || parseInt(value) === idngenelectevotingsolana.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}
