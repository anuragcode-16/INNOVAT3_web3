'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { 
  TRUST_SCORE_MANAGER_ABI, 
  BNPL_CORE_ABI, 
  ERC20_ABI 
} from '@/lib/contracts'
import { 
  TRUST_SCORE_MANAGER_ADDRESS, 
  BNPL_CORE_ADDRESS, 
  USDC_ADDRESS,
  MERCHANT_ADDRESS 
} from '@/lib/constants'

// ============ Read Hooks ============

/**
 * Get user's trust score
 */
export function useTrustScore(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: TRUST_SCORE_MANAGER_ADDRESS as `0x${string}`,
    abi: TRUST_SCORE_MANAGER_ABI,
    functionName: 'getTrustScore',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!TRUST_SCORE_MANAGER_ADDRESS,
    },
  })
}

/**
 * Get user's credit limit
 */
export function useCreditLimit(userAddress: `0x${string}` | undefined) {
  const isValidAddress = !!userAddress && userAddress !== '0x0000000000000000000000000000000000000000'
  const isValidContract = !!TRUST_SCORE_MANAGER_ADDRESS && TRUST_SCORE_MANAGER_ADDRESS !== '0x0000000000000000000000000000000000000000'
  
  return useReadContract({
    address: TRUST_SCORE_MANAGER_ADDRESS as `0x${string}`,
    abi: TRUST_SCORE_MANAGER_ABI,
    functionName: 'getCreditLimit',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: isValidAddress && isValidContract,
      refetchInterval: 10000,
      staleTime: 5000,
    },
  })
}

/**
 * Get user's credit info (score + limit) - Alternative implementation
 * Uses separate calls to avoid ABI errors when WalletAnalyzer/ZKVerifier not linked
 */
export function useUserCreditInfo(userAddress: `0x${string}` | undefined) {
  const isValidAddress = !!userAddress && userAddress !== '0x0000000000000000000000000000000000000000'
  const isValidContract = !!TRUST_SCORE_MANAGER_ADDRESS && TRUST_SCORE_MANAGER_ADDRESS !== '0x0000000000000000000000000000000000000000'
  
  // Get trust score separately
  const { data: trustScore = BigInt(0) } = useReadContract({
    address: TRUST_SCORE_MANAGER_ADDRESS as `0x${string}`,
    abi: TRUST_SCORE_MANAGER_ABI,
    functionName: 'getTrustScore',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: isValidAddress && isValidContract,
      refetchInterval: 10000,
      staleTime: 5000,
    },
  })
  
  // Get credit limit separately
  const result = useReadContract({
    address: TRUST_SCORE_MANAGER_ADDRESS as `0x${string}`,
    abi: TRUST_SCORE_MANAGER_ABI,
    functionName: 'getCreditLimit',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: isValidAddress && isValidContract,
      refetchInterval: 10000,
      staleTime: 5000,
    },
  })
  
  // Return data in getUserCreditInfo format: [score, totalScore, walletBonus, zkBoost, creditLimit]
  // When contracts aren't linked, walletBonus and zkBoost will be 0
  const mockData: readonly [bigint, bigint, bigint, bigint, bigint] = [
    trustScore,
    trustScore, // totalScore = trustScore (no bonus)
    BigInt(0), // walletBonus
    BigInt(0), // zkBoost
    result.data || BigInt(10000000) // creditLimit (default 10 USDC)
  ]
  
  return {
    ...result,
    data: mockData
  }
}

/**
 * Get user's active loan
 */
export function useActiveLoan(userAddress: `0x${string}` | undefined) {
  const isValidAddress = !!userAddress && userAddress !== '0x0000000000000000000000000000000000000000'
  const isValidContract = !!BNPL_CORE_ADDRESS && BNPL_CORE_ADDRESS !== '0x0000000000000000000000000000000000000000'
  
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'getActiveLoan',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: isValidAddress && isValidContract,
      refetchInterval: 10000,
      staleTime: 5000,
    },
  })
}

/**
 * Check if user has active loan
 */
export function useHasActiveLoan(userAddress: `0x${string}` | undefined) {
  const isValidAddress = !!userAddress && userAddress !== '0x0000000000000000000000000000000000000000'
  const isValidContract = !!BNPL_CORE_ADDRESS && BNPL_CORE_ADDRESS !== '0x0000000000000000000000000000000000000000'
  
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'hasActiveLoan',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: isValidAddress && isValidContract,
      refetchInterval: 10000,
      staleTime: 5000,
    },
  })
}

/**
 * Get available credit for user
 */
export function useAvailableCredit(userAddress: `0x${string}` | undefined) {
  const isValidAddress = !!userAddress && userAddress !== '0x0000000000000000000000000000000000000000'
  const isValidContract = !!BNPL_CORE_ADDRESS && BNPL_CORE_ADDRESS !== '0x0000000000000000000000000000000000000000'
  
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'getAvailableCredit',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: isValidAddress && isValidContract,
      refetchInterval: 10000,
      staleTime: 5000,
    },
  })
}

/**
 * Get remaining balance on active loan
 */
export function useRemainingBalance(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'getRemainingBalance',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Get minimum installment amount (1/3 of loan)
 */
export function useMinInstallmentAmount(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'getMinInstallmentAmount',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Get user's loan history
 */
export function useUserLoans(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'getUserLoans',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Get merchant info
 */
export function useMerchantInfo(merchantAddress: `0x${string}` = MERCHANT_ADDRESS as `0x${string}`) {
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'getMerchantInfo',
    args: [merchantAddress],
    query: {
      enabled: !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Get all loans (admin)
 */
export function useAllLoans() {
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'getAllLoans',
    query: {
      enabled: !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Get protocol liquidity
 */
export function useProtocolLiquidity() {
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'getProtocolLiquidity',
    query: {
      enabled: !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Get total loans count
 */
export function useTotalLoans() {
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'totalLoans',
    query: {
      enabled: !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Get active loans count
 */
export function useActiveLoansCount() {
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'getActiveLoansCount',
    query: {
      enabled: !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Get total volume
 */
export function useTotalVolume() {
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'totalVolume',
    query: {
      enabled: !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Get USDC balance
 */
export function useUSDCBalance(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

/**
 * Get USDC allowance for a spender
 */
export function useUSDCAllowance(userAddress: `0x${string}` | undefined, spender?: `0x${string}`) {
  const spenderAddress = spender || (BNPL_CORE_ADDRESS as `0x${string}`)
  return useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, spenderAddress] : undefined,
    query: {
      enabled: !!userAddress && !!spenderAddress,
    },
  })
}

/**
 * Get contract USDC balance (liquidity pool balance)
 */
export function useContractBalance() {
  return useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [BNPL_CORE_ADDRESS as `0x${string}`],
    query: {
      enabled: !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Get total liquidity deposited (use protocol liquidity as proxy)
 */
export function useTotalLiquidityDeposited() {
  // Use contract balance as a proxy since we don't have a separate tracking function
  return useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [BNPL_CORE_ADDRESS as `0x${string}`],
    query: {
      enabled: !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Get total liquidity withdrawn (returns 0 as placeholder)
 */
export function useTotalLiquidityWithdrawn() {
  // No tracking function available, return the contract balance query
  // In production, this would be tracked via events
  return useReadContract({
    address: BNPL_CORE_ADDRESS as `0x${string}`,
    abi: BNPL_CORE_ABI,
    functionName: 'totalVolume',
    query: {
      enabled: !!BNPL_CORE_ADDRESS,
    },
  })
}

/**
 * Alias for useUserLoans - get user's loan history
 */
export function useLoanHistory(userAddress: `0x${string}` | undefined) {
  return useUserLoans(userAddress)
}

// ============ Write Hooks ============

/**
 * Hook for creating a loan
 */
export function useCreateLoan() {
  const { writeContract, writeContractAsync, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const createLoan = (amount: bigint, merchant: `0x${string}`) => {
    writeContract({
      address: BNPL_CORE_ADDRESS as `0x${string}`,
      abi: BNPL_CORE_ABI,
      functionName: 'createLoan',
      args: [amount, merchant],
    })
  }

  return {
    createLoan,
    writeContractAsync,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook for repaying a loan
 */
export function useRepayLoan() {
  const { writeContract, writeContractAsync, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const repayLoan = () => {
    writeContract({
      address: BNPL_CORE_ADDRESS as `0x${string}`,
      abi: BNPL_CORE_ABI,
      functionName: 'repayLoan',
    })
  }

  return {
    repayLoan,
    writeContractAsync,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook for making an installment payment
 */
export function useMakeInstallmentPayment() {
  const { writeContract, writeContractAsync, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const makePayment = (amount: bigint) => {
    writeContract({
      address: BNPL_CORE_ADDRESS as `0x${string}`,
      abi: BNPL_CORE_ABI,
      functionName: 'makeInstallmentPayment',
      args: [amount],
    })
  }

  return {
    makePayment,
    writeContractAsync,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook for approving USDC
 */
export function useApproveUSDC() {
  const { writeContract, writeContractAsync, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = (amount: bigint) => {
    writeContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [BNPL_CORE_ADDRESS as `0x${string}`, amount],
    })
  }

  return {
    approve,
    writeContractAsync,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook for depositing liquidity (admin)
 */
export function useDepositLiquidity() {
  const { writeContract, writeContractAsync, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const deposit = (amount: bigint) => {
    writeContract({
      address: BNPL_CORE_ADDRESS as `0x${string}`,
      abi: BNPL_CORE_ABI,
      functionName: 'depositLiquidity',
      args: [amount],
    })
  }

  return {
    deposit,
    writeContractAsync,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook for withdrawing liquidity (admin)
 */
export function useWithdrawLiquidity() {
  const { writeContract, writeContractAsync, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const withdraw = (amount: bigint) => {
    writeContract({
      address: BNPL_CORE_ADDRESS as `0x${string}`,
      abi: BNPL_CORE_ABI,
      functionName: 'withdrawLiquidity',
      args: [amount],
    })
  }

  return {
    withdraw,
    writeContractAsync,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// ============ Utility Functions ============

/**
 * Format USDC amount (6 decimals) to readable string
 */
export function formatUSDC(amount: bigint | undefined): string {
  if (amount === undefined) return '0.00'
  return formatUnits(amount, 6)
}

/**
 * Parse USDC string to bigint (6 decimals)
 */
export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, 6)
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Calculate days remaining until due date
 */
export function getDaysRemaining(dueDate: bigint): number {
  const now = Math.floor(Date.now() / 1000)
  const remaining = Number(dueDate) - now
  return Math.ceil(remaining / (24 * 60 * 60))
}

/**
 * Get status color based on days remaining
 */
export function getStatusColor(daysRemaining: number): string {
  if (daysRemaining > 7) return 'text-green-600'
  if (daysRemaining > 3) return 'text-yellow-600'
  return 'text-red-600'
}
