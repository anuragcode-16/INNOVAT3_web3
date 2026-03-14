'use client'

import { useAccount, useReadContract } from 'wagmi'
import { useUserCreditInfo } from '@/hooks/useContracts'
import { Wallet, CheckCircle, RefreshCw, ArrowRight, Shield, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ZK_VERIFIER_ADDRESS } from '@/lib/constants'

// ZK Verifier ABI for reading proof status
const ZK_VERIFIER_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getCreditBoost",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "hasValidProof",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getProofDetails",
    "outputs": [
      { "internalType": "uint256", "name": "threshold", "type": "uint256" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "bool", "name": "verified", "type": "bool" },
      { "internalType": "uint256", "name": "boost", "type": "uint256" },
      { "internalType": "bool", "name": "isExpired", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export default function CreditScoreBreakdown() {
  const { address } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Fetch credit info from TrustScoreManager (on-chain)
  const { 
    data: creditInfo, 
    isLoading: creditLoading, 
    refetch: refetchCreditInfo 
  } = useUserCreditInfo(address)

  // Fetch ZK proof status from ZKCreditVerifier (on-chain)
  const { 
    data: hasValidProof, 
    refetch: refetchProof 
  } = useReadContract({
    address: ZK_VERIFIER_ADDRESS as `0x${string}`,
    abi: ZK_VERIFIER_ABI,
    functionName: 'hasValidProof',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!ZK_VERIFIER_ADDRESS && ZK_VERIFIER_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  })

  // Fetch ZK proof details (on-chain)
  const { 
    data: proofDetails, 
    refetch: refetchDetails 
  } = useReadContract({
    address: ZK_VERIFIER_ADDRESS as `0x${string}`,
    abi: ZK_VERIFIER_ABI,
    functionName: 'getProofDetails',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!ZK_VERIFIER_ADDRESS && ZK_VERIFIER_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  })

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Refetch data when component mounts (after navigation)
  useEffect(() => {
    if (mounted && address) {
      refetchCreditInfo()
    }
  }, [mounted, address, refetchCreditInfo])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      refetchCreditInfo(),
      refetchProof(),
      refetchDetails()
    ])
    setLastUpdated(new Date())
    setIsRefreshing(false)
  }

  const isLoading = !mounted || creditLoading || !creditInfo

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-700 rounded w-full"></div>
          ))}
        </div>
      </div>
    )
  }

  // creditInfo is a tuple: [score, totalScore, walletBonus, zkBoost, creditLimit]
  const creditData = creditInfo as readonly [bigint, bigint, bigint, bigint, bigint]
  const repayment = Number(creditData[0])
  const total = Number(creditData[1])
  const wallet = Number(creditData[2])
  const zk = Number(creditData[3])
  const limit = (Number(creditData[4]) / 1e6).toFixed(2)
  
  // Show message if wallet/zk bonuses are 0 (contracts may not be linked)
  const contractsNotLinked = wallet === 0 && zk === 0 && repayment === 0

  // Parse ZK proof details
  const zkProofInfo = proofDetails ? {
    threshold: Number((proofDetails as readonly [bigint, bigint, boolean, bigint, boolean])[0]) / 1e6,
    timestamp: new Date(Number((proofDetails as readonly [bigint, bigint, boolean, bigint, boolean])[1]) * 1000),
    verified: (proofDetails as readonly [bigint, bigint, boolean, bigint, boolean])[2],
    boost: Number((proofDetails as readonly [bigint, bigint, boolean, bigint, boolean])[3]),
    isExpired: (proofDetails as readonly [bigint, bigint, boolean, bigint, boolean])[4]
  } : null

  // Calculate credit formula
  const baseLimit = 10 // $10 USDC
  const bonusCredit = (total / 10) * 5
  const calculatedLimit = baseLimit + bonusCredit

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:border-red-500/50 transition-all duration-300">
      {/* Contracts not linked warning */}
      {contractsNotLinked && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-3">
          <p className="text-yellow-300 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Wallet & ZK bonuses unavailable - contracts may need linking
          </p>
        </div>
      )}
      
      {/* Header with refresh */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">On-Chain Credit Score</h3>
              <p className="text-sm text-blue-100">Live data from blockchain</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm text-white">Refresh</span>
          </button>
        </div>
        <p className="text-xs text-blue-200 mt-2">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Repayment Score */}
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-500 p-1.5 rounded-lg">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">Repayment Score</p>
                <p className="text-xs text-gray-400">From loan repayment behavior</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-400">{repayment}</p>
              <p className="text-xs text-gray-500">/ 100 max</p>
            </div>
          </div>
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((repayment / 100) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="mt-3 text-xs text-gray-300 bg-white/5 rounded-lg p-2">
            {repayment === 0 ? (
              <span>💡 <strong>How to earn:</strong> Complete BNPL loans on time (+10 pts) or early (+15 pts)</span>
            ) : (
              <span>✅ Great job! Keep repaying on time to increase this score.</span>
            )}
          </div>
        </div>

        {/* Wallet Bonus */}
        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-green-500 p-1.5 rounded-lg">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">Wallet History Bonus</p>
                <p className="text-xs text-gray-400">On-chain wallet analysis</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-400">+{wallet}</p>
              <p className="text-xs text-gray-500">/ 60 max</p>
            </div>
          </div>
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((wallet / 60) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="mt-3 text-xs text-gray-300 bg-white/5 rounded-lg p-2">
            <span>✅ <strong>Auto-calculated:</strong> Based on wallet age, transaction history, and balance</span>
          </div>
        </div>

        {/* ZK Proof Boost */}
        <div className={`rounded-xl p-4 border ${hasValidProof && zk > 0 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-lg ${hasValidProof && zk > 0 ? 'bg-purple-500' : 'bg-gray-500'}`}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">ZK Proof Boost</p>
                <p className="text-xs text-gray-400">Privacy-preserving verification</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${hasValidProof && zk > 0 ? 'text-purple-400' : 'text-gray-500'}`}>+{zk}</p>
              <p className="text-xs text-gray-500">/ 30 max</p>
            </div>
          </div>
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${hasValidProof && zk > 0 ? 'bg-gradient-to-r from-purple-400 to-pink-500' : 'bg-gray-600'}`}
              style={{ width: `${Math.min((zk / 30) * 100, 100)}%` }}
            ></div>
          </div>
          
          {/* ZK Proof Status & Action */}
          <div className="mt-3">
            {hasValidProof && zk > 0 ? (
              <div className="bg-white/5 rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Proof Verified!</span>
                </div>
                {zkProofInfo && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    <div>
                      <span className="font-medium">Threshold:</span> ≥{zkProofInfo.threshold} USDC
                    </div>
                    <div>
                      <span className="font-medium">Boost:</span> +{zkProofInfo.boost} points
                    </div>
                    <div className="col-span-2 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Submitted: {zkProofInfo.timestamp.toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-3 space-y-3">
                <div className="text-xs text-gray-300">
                  <p className="font-semibold mb-1">🔐 How to unlock +10 to +30 bonus points:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-400">
                    <li>Go to the ZK Proof page</li>
                    <li>Select a balance threshold (1, 11, or 101 USDC)</li>
                    <li>Generate a zero-knowledge proof</li>
                    <li>Submit proof to blockchain</li>
                    <li>Instant credit boost! 🚀</li>
                  </ol>
                </div>
                <Link
                  href="/zkproof"
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 px-4 rounded-lg font-semibold text-sm hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Shield className="w-4 h-4" />
                  <span>Submit ZK Proof Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Total Score Summary */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-300">Total Score</p>
              <p className="text-4xl font-bold">{total} <span className="text-lg font-normal text-gray-400">/ 190</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">Credit Limit</p>
              <p className="text-4xl font-bold text-green-400">${limit}</p>
            </div>
          </div>
          
          {/* Formula breakdown */}
          <div className="bg-white/10 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Base Limit:</span>
              <span className="font-semibold">$10.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Score Bonus:</span>
              <span className="font-semibold">${bonusCredit.toFixed(2)} ({total} ÷ 10 × $5)</span>
            </div>
            <div className="border-t border-white/20 pt-2 flex justify-between">
              <span className="text-gray-300">Formula:</span>
              <span className="font-mono text-xs">$10 + ($5 × {total}/10) = ${calculatedLimit.toFixed(2)}</span>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-400">
            <span className="bg-blue-500/30 px-2 py-1 rounded">{repayment} repay</span>
            <span>+</span>
            <span className="bg-green-500/30 px-2 py-1 rounded">{wallet} wallet</span>
            <span>+</span>
            <span className="bg-purple-500/30 px-2 py-1 rounded">{zk} ZK</span>
            <span>=</span>
            <span className="bg-white/20 px-2 py-1 rounded font-bold">{total}</span>
          </div>
        </div>

        {/* On-chain verification badge */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 pt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Data fetched from Polygon Amoy blockchain in real-time</span>
        </div>
      </div>
    </div>
  )
}
