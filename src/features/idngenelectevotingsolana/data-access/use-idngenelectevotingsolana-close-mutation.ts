import { IdngenelectevotingsolanaAccount, getCloseInstruction } from '@project/anchor'
import { useMutation } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { toastTx } from '@/components/toast-tx'
import { useIdngenelectevotingsolanaAccountsInvalidate } from './use-idngenelectevotingsolana-accounts-invalidate'

export function useIdngenelectevotingsolanaCloseMutation({ account, idngenelectevotingsolana }: { account: UiWalletAccount; idngenelectevotingsolana: IdngenelectevotingsolanaAccount }) {
  const invalidateAccounts = useIdngenelectevotingsolanaAccountsInvalidate()
  const signAndSend = useWalletUiSignAndSend()
  const signer = useWalletUiSigner({ account })

  return useMutation({
    mutationFn: async () => {
      return await signAndSend(getCloseInstruction({ payer: signer, idngenelectevotingsolana: idngenelectevotingsolana.address }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
