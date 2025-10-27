
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiConfig } from 'wagmi'
import { hederaTestnet } from 'viem/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react';

const queryClient = new QueryClient()

// 1. Get projectId
const projectId = 'd8fae9ed380aec17a89431006c52aa53'

// 2. Create wagmiConfig
const metadata = {
  name: 'Zeta Logistics Marketplace',
  description: 'Onchain P2P fulfilment marketplace on Hedera',
  url: 'https://5173-cs-8e1de557-b920-40e7-8446-73ec9ed9d802.cs-europe-west1-haha.cloudshell.dev',
  icons: ['https://www.binance.com/resources/img/logo-crypto.png']
}

const chains = [hederaTestnet]
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

// 3. Create modal
createWeb3Modal({ wagmiConfig, projectId, chains })

export function WagmiProvider({ children }: PropsWithChildren) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiConfig>
  )
}
