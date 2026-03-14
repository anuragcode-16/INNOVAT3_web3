'use client'

import { useAccount } from 'wagmi'
import { useUserCreditInfo, useAvailableCredit } from '@/hooks/useContracts'
import { TrendingUp, Shield } from 'lucide-react'
import { TrustScoreCardSkeleton } from './SkeletonLoaders'
import { useState, useEffect } from 'react'

export default function TrustScoreCard() {
  const [mounted, setMounted] = useState(false)
  const { address } = useAccount()
  
  const { data: creditInfo, isLoading: infoLoading, refetch: refetchCreditInfo, error: creditError } = useUserCreditInfo(address)
  const { data: availableCredit = BigInt(0), isLoading: availLoading, refetch: refetchAvailable, error: availError } = useAvailableCredit(address)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug logging
  useEffect(() => {
    if (mounted && address) {
      console.log('[TrustScoreCard] Credit Info:', creditInfo)
      console.log('[TrustScoreCard] Available Credit:', availableCredit?.toString())
      if (creditError) {
        console.error('[TrustScoreCard] Credit Error:', creditError)
        // If ABI error, show helpful message
        if (creditError.message?.includes('out of bounds')) {
          console.warn('[TrustScoreCard] Contract may not be properly initialized. Please contact admin.')
        }
      }
      if (availError) console.error('[TrustScoreCard] Avail Error:', availError)
    }
  }, [mounted, address, creditInfo, availableCredit, creditError, availError])

  // Refetch data when component mounts
  useEffect(() => {
    if (mounted && address) {
      refetchCreditInfo()
      refetchAvailable()
    }
  }, [mounted, address, refetchCreditInfo, refetchAvailable])

  // Parse credit info: [score, totalScore, walletBonus, zkBoost, creditLimit]
  const creditData = creditInfo as readonly [bigint, bigint, bigint, bigint, bigint] | undefined
  const totalScore = creditData ? Number(creditData[1]) : 0
  const creditLimit = creditData ? Number(creditData[4]) : 0
  
  const formattedCreditLimit = (creditLimit / 1e6).toFixed(2)
  const formattedAvailableCredit = (Number(availableCredit) / 1e6).toFixed(2)
  
  const isLoading = !mounted || infoLoading || availLoading
  
  // Calculate progress (max score is 190 for total score)
  const maxScore = 190
  const progress = Math.min((totalScore / maxScore) * 100, 100)
  const circumference = 2 * Math.PI * 45 // radius = 45

  if (isLoading) {
    return <TrustScoreCardSkeleton />
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <span>Trust Score</span>
        </h3>
        <div className="flex items-center space-x-1 text-sm text-gray-400">
          <Shield className="w-4 h-4" />
          <span>On-chain</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Score Display */}
        <div className="space-y-3">
          <div>
            <p className="text-4xl font-bold text-white">{totalScore}</p>
            <p className="text-sm text-gray-400">/ 190 points</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm gap-4">
              <span className="text-gray-400">Credit Limit</span>
              <span className="font-semibold text-blue-400">${formattedCreditLimit}</span>
            </div>
            <div className="flex justify-between text-sm gap-4">
              <span className="text-gray-400">Available</span>
              <span className="font-semibold text-green-400">${formattedAvailableCredit}</span>
            </div>
          </div>
        </div>

        {/* Circular Progress */}
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke="#374151"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
