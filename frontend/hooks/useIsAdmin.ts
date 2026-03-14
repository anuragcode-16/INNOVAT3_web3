'use client'

import { useAccount } from 'wagmi'
import { ADMIN_ADDRESS } from '@/lib/constants'

/**
 * Hook to check if the connected wallet is the admin
 */
export function useIsAdmin(): boolean {
  const { address } = useAccount()
  
  if (!address) return false
  
  return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
}
