//@ts-nocheck

import { SmartRouter, SMART_ROUTER_ADDRESSES, SwapRouter } from '../lib/dist/evm.js'
// import { SMART_ROUTER_ADDRESSES, SwapRouter, SmartRouter as _smartRouter } from '@pancakeswap/smart-router'
import { CurrencyAmount, Percent, TradeType} from '@pancakeswap/sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  WagmiConfig,
  createConfig,
  useAccount,
  useConnect,
  useSwitchNetwork,
  useNetwork,
  useSendTransaction,
} from 'wagmi'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { holesky } from 'viem/chains'

import '../App.css'
import { holeskyTokens } from '../constants/holeskyTokens'
import { createPublicClient, hexToBigInt, http } from 'viem'
import { GraphQLClient } from 'graphql-request'
import { Token } from '@pancakeswap/sdk'

const chainId = holesky.id
const swapFrom = new Token(chainId, holeskyTokens.skate.address, holeskyTokens.skate.decimals, holeskyTokens.skate.symbol, holeskyTokens.skate.name)
const swapTo = new Token(chainId, holeskyTokens.weth.address, holeskyTokens.weth.decimals, holeskyTokens.weth.symbol, holeskyTokens.weth.name)

const publicClient = createPublicClient({
  chain: holesky,
  transport: http('https://holesky.drpc.org'),
  batch: {
    multicall: {
      batchSize: 1024 * 200,
    },
  },
})

const config = createConfig({
  autoConnect: true,
  connectors: [new MetaMaskConnector({ chains: [holesky] })],
  publicClient,
})

const v3SubgraphClient = new GraphQLClient('https://api.thegraph.com/subgraphs/name/iliaazhel/integral-core')
// const v2SubgraphClient = new GraphQLClient('https://proxy-worker-api.pancakeswap.com/bsc-exchange')



//@ts-ignore
const quoteProvider = SmartRouter.createQuoteProvider({
  onChainProvider: () => publicClient,
})

function calculateGasMargin(value: bigint, margin = 1000n): bigint {
  return (value * (10000n + margin)) / 10000n
}

export function HoleskyExample() {
  return (
    <WagmiConfig config={config}>
      <Main />
    </WagmiConfig>
  )
}

function Main() {
  const { chain } = useNetwork()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { switchNetwork } = useSwitchNetwork()
  const { sendTransactionAsync } = useSendTransaction()

  const [trade, setTrade] = useState(null)
  const amount = useMemo(() => CurrencyAmount.fromRawAmount(swapFrom, '100000000000000'), [])

  console.log('amount', amount.toSignificant())

  const getBestRoute = useCallback(async () => {

    const v2Pools = await  SmartRouter.getV2CandidatePools({
        onChainProvider: () => publicClient,
        v2SubgraphProvider: () => SmartRouter.v2SubgraphClient,
        v3SubgraphProvider: () => SmartRouter.v3SubgraphClient,
        currencyA: amount.currency,
        currencyB: swapTo 
      })

    const v3Pools = await SmartRouter.getV3CandidatePools({
      onChainProvider: () => publicClient,
      subgraphProvider: () => v3SubgraphClient,
      currencyA: amount.currency,
      currencyB: swapTo
    })

    const pools = [...v3Pools, ...v2Pools];

    console.log('v2 - ', v2Pools)
    console.log('v3 - ', v3Pools)


    // const trade = await SmartRouter.getBestTrade(amount, swapTo, TradeType.EXACT_INPUT, {
    //   gasPriceWei: () => publicClient.getGasPrice(),
    //   maxHops: 2,
    //   maxSplits: 2,
    //   poolProvider: SmartRouter.createStaticPoolProvider(pools),
    //   quoteProvider,
    //   quoterOptimization: true,

    const bestTrade = await SmartRouter.getBestTrade(amount, swapTo, TradeType.EXACT_INPUT, {
      gasPriceWei: () => publicClient.getGasPrice(),
      maxHops: 4,
      maxSplits: 3,
      poolProvider: SmartRouter.createStaticPoolProvider(pools),
      quoteProvider: SmartRouter.quoteProvider,
      quoterOptimization: true,
    })

    console.log('BEST TRADE', bestTrade)

    // })
    // setTrade(trade)
  }, [amount])

  // const swapCallParams = useMemo(() => {
  //   if (!trade) {
  //     return null
  //   }
  //   const { value, calldata } = SwapRouter.swapCallParameters(trade, {
  //     recipient: address,
  //     slippageTolerance: new Percent(1),
  //   })
  //   return {
  //     address: SMART_ROUTER_ADDRESSES[chainId],
  //     calldata,
  //     value,
  //   }
  // }, [trade, address])

  // const swap = useCallback(async () => {
  //   if (!swapCallParams || !address) {
  //     return
  //   }

  //   const { value, calldata, address: routerAddress } = swapCallParams

  //   const tx = {
  //     account: address,
  //     to: routerAddress,
  //     data: calldata,
  //     value: hexToBigInt(value),
  //   }
  //   const gasEstimate = await publicClient.estimateGas(tx as any)
  //   await sendTransactionAsync({
  //     account: address,
  //     chainId,
  //     to: routerAddress,
  //     data: calldata,
  //     value: hexToBigInt(value),
  //     gas: calculateGasMargin(gasEstimate),
  //   })
  // }, [swapCallParams, address, sendTransactionAsync])

  useEffect(() => {
    if (isConnected && chain?.id !== chainId) {
      switchNetwork?.(chainId)
    }
  }, [isConnected, switchNetwork, chain])

  return (
    <div className="App">
      <header className="App-header">
        <p>Smart Router Example.</p>
        <p>
          Get best quote swapping from {amount.toExact()} {amount.currency.symbol} to{' '}
          {trade?.outputAmount.toExact() || '?'} {swapTo.symbol}
        </p>
        <p>
          {isConnected ? (
            address
          ) : (
            <button onClick={() => connect({ connector: connectors[0] })}>Connect wallet</button>
          )}
        </p>
        <p>{!trade ? <button onClick={getBestRoute}>Get Quote</button> : <button onClick={() => setTrade(null)}>Swap</button>}</p>
      </header>
    </div>
  )
}
