import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'
import { getIdngenelectevotingsolanaProgramAccounts } from '@project/anchor'
import { useIdngenelectevotingsolanaAccountsQueryKey } from './use-idngenelectevotingsolana-accounts-query-key'

export function useIdngenelectevotingsolanaAccountsQuery() {
  const { client } = useSolana()

  return useQuery({
    queryKey: useIdngenelectevotingsolanaAccountsQueryKey(),
    queryFn: async () => await getIdngenelectevotingsolanaProgramAccounts(client.rpc),
  })
}
