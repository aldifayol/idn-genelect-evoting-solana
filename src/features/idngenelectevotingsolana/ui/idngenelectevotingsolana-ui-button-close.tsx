import { IdngenelectevotingsolanaAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useIdngenelectevotingsolanaCloseMutation } from '@/features/idngenelectevotingsolana/data-access/use-idngenelectevotingsolana-close-mutation'

export function IdngenelectevotingsolanaUiButtonClose({ account, idngenelectevotingsolana }: { account: UiWalletAccount; idngenelectevotingsolana: IdngenelectevotingsolanaAccount }) {
  const closeMutation = useIdngenelectevotingsolanaCloseMutation({ account, idngenelectevotingsolana })

  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
  )
}
