import { IdngenelectevotingsolanaAccount, getIncrementInstruction } from '@project/anchor'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { useMutation } from '@tanstack/react-query'
import { toastTx } from '@/components/toast-tx'
import { useIdngenelectevotingsolanaAccountsInvalidate } from './use-idngenelectevotingsolana-accounts-invalidate'

export function useIdngenelectevotingsolanaIncrementMutation({
  account,
  idngenelectevotingsolana,
}: {
  account: UiWalletAccount
  idngenelectevotingsolana: IdngenelectevotingsolanaAccount
}) {
  const invalidateAccounts = useIdngenelectevotingsolanaAccountsInvalidate()
  const signAndSend = useWalletUiSignAndSend()
  const signer = useWalletUiSigner({ account })

  return useMutation({
    mutationFn: async () => await signAndSend(getIncrementInstruction({ idngenelectevotingsolana: idngenelectevotingsolana.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
