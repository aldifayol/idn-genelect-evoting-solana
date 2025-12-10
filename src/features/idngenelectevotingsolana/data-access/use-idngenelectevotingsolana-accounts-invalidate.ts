import { useQueryClient } from '@tanstack/react-query'
import { useIdngenelectevotingsolanaAccountsQueryKey } from './use-idngenelectevotingsolana-accounts-query-key'

export function useIdngenelectevotingsolanaAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useIdngenelectevotingsolanaAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}
