'use client'
import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import toast from 'react-hot-toast'
import { ZK_VERIFIER_ADDRESS } from '@/lib/constants'
import { Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const ZK_VERIFIER_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "threshold", "type": "uint256" },
      { "internalType": "uint256[2]", "name": "a", "type": "uint256[2]" },
      { "internalType": "uint256[2][2]", "name": "b", "type": "uint256[2][2]" },
      { "internalType": "uint256[2]", "name": "c", "type": "uint256[2]" },
      { "internalType": "uint256[1]", "name": "input", "type": "uint256[1]" }
    ],
    "name": "submitBalanceProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
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

export default function ZKProofPage() {
  const { address, isConnected } = useAccount()
  const [threshold, setThreshold] = useState('1')
  const { writeContract, data: hash, isPending } = useWriteContract()

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Read current credit boost
  const { data: creditBoost, refetch: refetchBoost } = useReadContract({
    address: ZK_VERIFIER_ADDRESS as `0x${string}`,
    abi: ZK_VERIFIER_ABI,
    functionName: 'getCreditBoost',
    args: address ? [address] : undefined,
  })

  // Read proof details
  const { data: proofDetails, refetch: refetchDetails } = useReadContract({
    address: ZK_VERIFIER_ADDRESS as `0x${string}`,
    abi: ZK_VERIFIER_ABI,
    functionName: 'getProofDetails',
    args: address ? [address] : undefined,
  })

  // Check if user has valid proof
  const { data: hasValidProof } = useReadContract({
    address: ZK_VERIFIER_ADDRESS as `0x${string}`,
    abi: ZK_VERIFIER_ABI,
    functionName: 'hasValidProof',
    args: address ? [address] : undefined,
  })

  const generateProof = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      // Generate mock ZK proof
      // In production, this would use snarkjs to generate actual ZK proofs
      const mockProof = {
        a: [BigInt(1), BigInt(2)],
        b: [[BigInt(3), BigInt(4)], [BigInt(5), BigInt(6)]],
        c: [BigInt(7), BigInt(8)],
        input: [BigInt(1)]
      }

      const thresholdAmount = BigInt(threshold) * BigInt(10 ** 6) // Convert to 6 decimals

      writeContract({
        address: ZK_VERIFIER_ADDRESS as `0x${string}`,
        abi: ZK_VERIFIER_ABI,
        functionName: 'submitBalanceProof',
        args: [
          thresholdAmount,
          mockProof.a as [bigint, bigint],
          mockProof.b as [[bigint, bigint], [bigint, bigint]],
          mockProof.c as [bigint, bigint],
          mockProof.input as [bigint]
        ]
      })
    } catch (error) {
      console.error('Error submitting proof:', error)
      toast.error('Failed to submit proof')
    }
  }

  // Handle transaction confirmation
  if (isConfirmed && hash) {
    toast.success('✅ ZK Proof verified! Credit boost applied')
    refetchBoost()
    refetchDetails()
  }

  const thresholds = [
    { value: '1', label: '≥ 1 USDC', boost: '+10 points', color: 'from-green-400 to-emerald-500' },
    { value: '11', label: '≥ 11 USDC', boost: '+20 points', color: 'from-blue-400 to-indigo-500' },
    { value: '101', label: '≥ 101 USDC', boost: '+30 points', color: 'from-purple-400 to-pink-500' }
  ]

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
            <Shield className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2 iceberg-regular">
            Privacy-Preserving Credit Boost
          </h1>
          <p className="text-gray-600 text-lg">
            Prove your balance without revealing the exact amount using Zero-Knowledge Proofs
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Wallet Not Connected</h2>
            <p className="text-gray-600">Please connect your wallet to access ZK Proof features</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Status Card */}
            {hasValidProof && proofDetails && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-900 mb-2">Active ZK Proof</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-green-700 font-medium">Threshold Proved</p>
                        <p className="text-green-900 font-bold text-lg">
                          {Number(proofDetails[0]) / 10**6} USDC
                        </p>
                      </div>
                      <div>
                        <p className="text-green-700 font-medium">Credit Boost</p>
                        <p className="text-green-900 font-bold text-lg">
                          +{Number(proofDetails[3])} points
                        </p>
                      </div>
                      <div>
                        <p className="text-green-700 font-medium">Submitted</p>
                        <p className="text-green-900">
                          {new Date(Number(proofDetails[1]) * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-700 font-medium">Status</p>
                        <p className="text-green-900 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Valid for 30 days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Proof Card */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-600" />
                Submit New Proof
              </h2>

              <p className="text-gray-600 mb-6">
                Select the minimum balance threshold you want to prove. Higher thresholds grant more credit boost.
              </p>

              <div className="space-y-4 mb-8">
                {thresholds.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setThreshold(option.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      threshold === option.value
                        ? 'border-purple-500 bg-purple-50 shadow-md scale-105'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${option.color} flex items-center justify-center text-white font-bold`}>
                          {option.value}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg">{option.label}</p>
                          <p className="text-sm text-gray-600">{option.boost}</p>
                        </div>
                      </div>
                      {threshold === option.value && (
                        <CheckCircle className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={generateProof}
                disabled={isPending || isConfirming}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isPending || isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isPending ? 'Generating Proof...' : 'Confirming...'}
                  </span>
                ) : (
                  'Submit ZK Proof'
                )}
              </button>
            </div>

            {/* How It Works Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                How Zero-Knowledge Proofs Work
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Generate Proof Locally</p>
                      <p className="text-sm text-blue-700">Create cryptographic proof of your balance on your device</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Submit On-Chain</p>
                      <p className="text-sm text-blue-700">Send proof to smart contract without revealing balance</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Instant Verification</p>
                      <p className="text-sm text-blue-700">Smart contract verifies proof mathematically</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Get Credit Boost</p>
                      <p className="text-sm text-blue-700">Receive up to +30 points to your trust score</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Privacy Guaranteed:</strong> Your exact balance is never revealed. The blockchain only knows you passed the threshold test. ✨
                </p>
              </div>
            </div>

            {/* Benefits Card */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold mb-4">🎯 Benefits</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-bold text-green-900 mb-1">🔒 Private</p>
                  <p className="text-sm text-green-700">Balance stays confidential</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-bold text-blue-900 mb-1">⚡ Instant</p>
                  <p className="text-sm text-blue-700">Immediate credit boost</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-bold text-purple-900 mb-1">🎁 Rewarding</p>
                  <p className="text-sm text-purple-700">Up to +30 score points</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
