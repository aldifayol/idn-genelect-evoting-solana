import { useSolana } from '@/components/solana/use-solana'

export function useIdngenelectevotingsolanaAccountsQueryKey() {
  const { cluster } = useSolana()

  return ['idngenelectevotingsolana', 'accounts', { cluster }]
}
