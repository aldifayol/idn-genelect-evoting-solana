import { IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS } from '@project/anchor'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { ellipsify } from '@wallet-ui/react'

export function IdngenelectevotingsolanaUiProgramExplorerLink() {
  return <AppExplorerLink address={IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS} label={ellipsify(IDNGENELECTEVOTINGSOLANA_PROGRAM_ADDRESS)} />
}
