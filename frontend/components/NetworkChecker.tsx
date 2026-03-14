'use client'

import { useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { polygonAmoy } from 'wagmi/chains'
import { AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NetworkChecker() {
  const chainId = useChainId()
  const { isConnected } = useAccount()
  const { switchChain } = useSwitchChain()

  useEffect(() => {
    if (isConnected && chainId !== polygonAmoy.id) {
      // Show warning toast with action to switch
      toast.error(
        (t) => (
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="font-semibold">Wrong Network</p>
              <p className="text-sm text-gray-300">Please switch to Polygon Amoy Testnet</p>
              <button
                onClick={() => {
                  switchChain?.({ chainId: polygonAmoy.id })
                  toast.dismiss(t.id)
                }}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Switch Network
              </button>
            </div>
          </div>
        ),
        {
          duration: 10000,
          id: 'wrong-network',
        }
      )
    }
  }, [chainId, isConnected, switchChain])

  return null
}
