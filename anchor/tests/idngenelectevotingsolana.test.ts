import {
  Blockhash,
  createSolanaClient,
  createTransaction,
  generateKeyPairSigner,
  Instruction,
  isSolanaError,
  KeyPairSigner,
  signTransactionMessageWithSigners,
} from 'gill'
import {
  fetchIdngenelectevotingsolana,
  getCloseInstruction,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
} from '../src'
// @ts-ignore error TS2307 suggest setting `moduleResolution` but this is already configured
import { loadKeypairSignerFromFile } from 'gill/node'

const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: process.env.ANCHOR_PROVIDER_URL! })

describe('idngenelectevotingsolana', () => {
  let payer: KeyPairSigner
  let idngenelectevotingsolana: KeyPairSigner

  beforeAll(async () => {
    idngenelectevotingsolana = await generateKeyPairSigner()
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!)
  })

  it('Initialize Idngenelectevotingsolana', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getInitializeInstruction({ payer: payer, idngenelectevotingsolana: idngenelectevotingsolana })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSER
    const currentIdngenelectevotingsolana = await fetchIdngenelectevotingsolana(rpc, idngenelectevotingsolana.address)
    expect(currentIdngenelectevotingsolana.data.count).toEqual(0)
  })

  it('Increment Idngenelectevotingsolana', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({
      idngenelectevotingsolana: idngenelectevotingsolana.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchIdngenelectevotingsolana(rpc, idngenelectevotingsolana.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Increment Idngenelectevotingsolana Again', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({ idngenelectevotingsolana: idngenelectevotingsolana.address })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchIdngenelectevotingsolana(rpc, idngenelectevotingsolana.address)
    expect(currentCount.data.count).toEqual(2)
  })

  it('Decrement Idngenelectevotingsolana', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getDecrementInstruction({
      idngenelectevotingsolana: idngenelectevotingsolana.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchIdngenelectevotingsolana(rpc, idngenelectevotingsolana.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Set idngenelectevotingsolana value', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getSetInstruction({ idngenelectevotingsolana: idngenelectevotingsolana.address, value: 42 })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchIdngenelectevotingsolana(rpc, idngenelectevotingsolana.address)
    expect(currentCount.data.count).toEqual(42)
  })

  it('Set close the idngenelectevotingsolana account', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getCloseInstruction({
      payer: payer,
      idngenelectevotingsolana: idngenelectevotingsolana.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    try {
      await fetchIdngenelectevotingsolana(rpc, idngenelectevotingsolana.address)
    } catch (e) {
      if (!isSolanaError(e)) {
        throw new Error(`Unexpected error: ${e}`)
      }
      expect(e.message).toEqual(`Account not found at address: ${idngenelectevotingsolana.address}`)
    }
  })
})

// Helper function to keep the tests DRY
let latestBlockhash: Awaited<ReturnType<typeof getLatestBlockhash>> | undefined
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
  if (latestBlockhash) {
    return latestBlockhash
  }
  return await rpc
    .getLatestBlockhash()
    .send()
    .then(({ value }) => value)
}
async function sendAndConfirm({ ix, payer }: { ix: Instruction; payer: KeyPairSigner }) {
  const tx = createTransaction({
    feePayer: payer,
    instructions: [ix],
    version: 'legacy',
    latestBlockhash: await getLatestBlockhash(),
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
  return await sendAndConfirmTransaction(signedTransaction)
}
