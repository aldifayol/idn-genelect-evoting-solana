import { IdngenelectevotingsolanaAccount, getDecrementInstruction } from '@project/anchor'
import { useMutation } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { toastTx } from '@/components/toast-tx'
import { useIdngenelectevotingsolanaAccountsInvalidate } from './use-idngenelectevotingsolana-accounts-invalidate'

export function useIdngenelectevotingsolanaDecrementMutation({
  account,
  idngenelectevotingsolana,
}: {
  account: UiWalletAccount
  idngenelectevotingsolana: IdngenelectevotingsolanaAccount
}) {
  const invalidateAccounts = useIdngenelectevotingsolanaAccountsInvalidate()
  const signer = useWalletUiSigner({ account })
  const signAndSend = useWalletUiSignAndSend()

  return useMutation({
    mutationFn: async () => await signAndSend(getDecrementInstruction({ idngenelectevotingsolana: idngenelectevotingsolana.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
