import { http, createConfig } from 'wagmi'
import { polygonAmoy } from 'wagmi/chains'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
} from '@rainbow-me/rainbowkit/wallets'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, rainbowWallet, walletConnectWallet, coinbaseWallet],
    },
  ],
  {
    appName: 'OnStream BNPL',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    appDescription: 'OnStream - Web3 BNPL Protocol',
    appUrl: 'http://localhost:3000', // Update to production URL when deploying
    appIcon: 'https://onstream.vercel.app/favicon.ico', // Update to your app's icon
  }
)

// Use Polygon's default RPC
const primaryRpc = process.env.NEXT_PUBLIC_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'

export const config = createConfig({
  chains: [polygonAmoy],
  connectors,
  transports: {
    [polygonAmoy.id]: http(primaryRpc, {
      timeout: 30_000,  // 30 seconds timeout
      retryCount: 5,    // Retry up to 5 times
      retryDelay: 1000, // 1 second between retries
    }),
  },
  // Optimize batch calls to reduce RPC requests
  batch: {
    multicall: {
      batchSize: 1024,
      wait: 16,
    },
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
