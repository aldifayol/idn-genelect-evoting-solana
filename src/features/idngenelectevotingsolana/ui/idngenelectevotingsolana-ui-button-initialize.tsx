import { Button } from '@/components/ui/button'
import { UiWalletAccount } from '@wallet-ui/react'

import { useIdngenelectevotingsolanaInitializeMutation } from '@/features/idngenelectevotingsolana/data-access/use-idngenelectevotingsolana-initialize-mutation'

export function IdngenelectevotingsolanaUiButtonInitialize({ account }: { account: UiWalletAccount }) {
  const mutationInitialize = useIdngenelectevotingsolanaInitializeMutation({ account })

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Idngenelectevotingsolana {mutationInitialize.isPending && '...'}
    </Button>
  )
}
