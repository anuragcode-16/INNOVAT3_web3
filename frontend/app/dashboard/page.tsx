'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { 
  useUserCreditInfo,
  useHasActiveLoan
} from '@/hooks/useContracts'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import TrustScoreCard from '@/components/TrustScoreCard'
import CreditScoreBreakdown from '@/components/CreditScoreBreakdown'
import ActiveLoanCard from '@/components/ActiveLoanCard'
import { 
  ShoppingBag, 
  ArrowRight,
  Wallet,
  CreditCard,
  Zap,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import MagicBorderButton from '@/components/ui/button'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const isAdmin = useIsAdmin()
  
  const { data: creditInfo, isLoading: creditLoading, refetch: refetchCredit, error: creditError } = useUserCreditInfo(address)
  const { data: hasActiveLoan = false, isLoading: loanLoading, refetch: refetchLoan, error: loanError } = useHasActiveLoan(address)

  // Debug logging
  useEffect(() => {
    if (mounted && address) {
      console.log('[Dashboard] Address:', address)
      console.log('[Dashboard] Credit Info:', creditInfo)
      console.log('[Dashboard] Credit Loading:', creditLoading)
      console.log('[Dashboard] Credit Error:', creditError)
      console.log('[Dashboard] Has Active Loan:', hasActiveLoan)
      console.log('[Dashboard] Loan Error:', loanError)
      
      // Show user-friendly error for contract issues
      if (creditError && creditError.message?.includes('out of bounds')) {
        console.error('❌ Contract initialization error detected. Contracts may not be properly linked on-chain.')
      }
    }
  }, [mounted, address, creditInfo, creditLoading, creditError, hasActiveLoan, loanError])

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Refetch data when page becomes visible (e.g., after returning from shop)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted && address) {
        refetchCredit()
        refetchLoan()
      }
    }
    
    // Also refetch when component mounts (page navigation)
    if (mounted && address) {
      refetchCredit()
      refetchLoan()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [mounted, address, refetchCredit, refetchLoan])

  // Parse credit info: [score, totalScore, walletBonus, zkBoost, creditLimit]
  const creditData = creditInfo as readonly [bigint, bigint, bigint, bigint, bigint] | undefined
  const totalScore = creditData ? Number(creditData[1]) : 0
  const creditLimit = creditData ? Number(creditData[4]) : 0
  const formattedCreditLimit = creditLimit / 1e6
  
  // Show error state if contracts aren't working
  const hasContractError = creditError && (creditError.message?.includes('out of bounds') || creditError.message?.includes('could not decode'))

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (mounted && isConnected && isAdmin) {
      router.push('/admin/dashboard')
    }
  }, [mounted, isConnected, isAdmin, router])

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br via-black to-gray-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-700 rounded-2xl"></div>
          <div className="h-4 bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center space-y-6 p-8 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Connect Your Wallet</h1>
          <p className="text-gray-300 max-w-sm">Please connect your wallet to view your dashboard and start building your Web3 credit score</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br  via-black to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Contract Error Alert */}
        {hasContractError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-300 font-semibold">Contract Initialization Error</p>
                <p className="text-red-200 text-sm mt-1">The smart contracts are not properly initialized. Please contact the administrator to link WalletAnalyzer and ZKVerifier contracts.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold iceberg-regular">
              Welcome Back! 👋
            </h1>
            <p className="text-gray-300 mt-2 flex items-center space-x-2">
              <span className="font-mono bg-gray-800 px-3 py-1.5 rounded-lg text-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop">
              <MagicBorderButton>
                <span className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shop Now</span>
                </span>
              </MagicBorderButton>
            </Link>
            <Link href="/zkproof">
              <MagicBorderButton>
                <span className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>ZK Boost</span>
                </span>
              </MagicBorderButton>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:shadow-2xl hover:shadow-blue-500/10 transition-all">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 p-3 rounded-xl border border-blue-500/30">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Trust Score</p>
                <p className="text-3xl font-bold text-white">{totalScore}</p>
                <p className="text-xs text-gray-500">/ 190 max</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:shadow-2xl hover:shadow-green-500/10 transition-all">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/30 p-3 rounded-xl border border-green-500/30">
                <Wallet className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Credit Limit</p>
                <p className="text-3xl font-bold text-green-400">${formattedCreditLimit.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:shadow-2xl hover:shadow-red-500/10 transition-all">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/30 p-3 rounded-xl border border-red-500/30">
                <Zap className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Loan Status</p>
                <p className={`text-lg font-bold ${hasActiveLoan ? 'text-orange-400' : 'text-gray-500'}`}>
                  {hasActiveLoan ? 'Active Loan' : 'No Active Loan'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credit Score Breakdown - Takes 2 columns */}
          <div className="lg:col-span-2">
            <CreditScoreBreakdown />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Active Loan or Shop CTA */}
            {hasActiveLoan ? (
              <ActiveLoanCard />
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Ready to Shop?</h3>
                  <p className="text-gray-400">
                    You have <span className="font-bold text-blue-400">${formattedCreditLimit.toFixed(2)} USDC</span> credit available!
                  </p>
                  <Link href="/shop" className="w-full inline-block">
                    <MagicBorderButton className="w-full">
                      <span className="flex items-center justify-center space-x-2">
                        <span>Browse Shop</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </MagicBorderButton>
                  </Link>
                </div>
              </div>
            )}

            {/* Trust Score Card */}
            <TrustScoreCard />
          </div>
        </div>

        {/* Credit Building Tips */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <Zap className="w-6 h-6" />
            <span>Tips to Build Credit Faster</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors">
              <p className="font-semibold mb-1">💰 Pay Early</p>
              <p className="text-sm opacity-90">Repay 7+ days before due date for +15 points instead of +10</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors">
              <p className="font-semibold mb-1">🔐 Submit ZK Proof</p>
              <p className="text-sm opacity-90">Verify your balance privately and earn up to +30 bonus points</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors">
              <p className="font-semibold mb-1">📈 Stay Consistent</p>
              <p className="text-sm opacity-90">Regular on-time payments build your score faster</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
