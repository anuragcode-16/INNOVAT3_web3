'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { parseUnits } from 'viem'
import { X, Store, Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useCreateLoan, useAvailableCredit } from '@/hooks/useContracts'
import MagicBorderButton from './ui/button'
import { MERCHANT_ADDRESS, BNPL_CORE_ADDRESS } from '@/lib/constants'
import { BNPL_CORE_ABI } from '@/lib/contracts'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  category: string
}

interface CheckoutModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CheckoutModal({ product, isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { address } = useAccount()
  const { data: availableCredit = BigInt(0) } = useAvailableCredit(address)
  const { writeContractAsync, isPending } = useCreateLoan()
  
  const [step, setStep] = useState<'confirm' | 'pending' | 'success' | 'error'>('confirm')
  const [error, setError] = useState<string | null>(null)

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('confirm')
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const availableCreditNum = Number(availableCredit) / 1e6
  const hasEnoughCredit = availableCreditNum >= product.price
  const remainingCredit = availableCreditNum - product.price

  const handleConfirmPurchase = async () => {
    if (!hasEnoughCredit || !writeContractAsync) return
    
    setStep('pending')
    setError(null)
    
    const toastId = toast.loading('Processing your BNPL purchase...')
    
    try {
      const amountBigInt = parseUnits(product.price.toString(), 6)
      
      // Create loan - this will transfer USDC from lending pool to merchant
      await writeContractAsync({
        address: BNPL_CORE_ADDRESS as `0x${string}`,
        abi: BNPL_CORE_ABI,
        functionName: 'createLoan',
        args: [amountBigInt, MERCHANT_ADDRESS as `0x${string}`],
      })
      
      toast.success(`Purchase successful! ${product.name} is yours! Repay within 7 days.`, { id: toastId, duration: 5000 })
      setStep('success')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (err: any) {
      console.error('Purchase failed:', err)
      
      let errorMsg = 'Transaction failed'
      
      if (err?.message?.includes('rejected') || err?.message?.includes('denied')) {
        errorMsg = 'Transaction rejected by user'
      } else if (err?.message?.includes('ActiveLoanExists')) {
        errorMsg = 'You already have an active loan. Please repay it first.'
      } else if (err?.message?.includes('ExceedsCreditLimit')) {
        errorMsg = 'This purchase exceeds your credit limit'
      } else if (err?.message?.includes('InsufficientLiquidity')) {
        errorMsg = 'Insufficient liquidity in the lending pool. Please try again later.'
      } else if (err?.message?.includes('BlacklistedUser')) {
        errorMsg = 'Your account has been restricted due to previous defaults'
      } else if (err?.shortMessage) {
        errorMsg = err.shortMessage
      } else if (err?.message) {
        errorMsg = err.message.substring(0, 100)
      }
      
      toast.error(`Purchase failed: ${errorMsg}`, { id: toastId, duration: 6000 })
      setError(errorMsg)
      setStep('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">BNPL Checkout</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'confirm' && (
            <div className="space-y-6">
              {/* Product Info */}
                <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl border border-blue-500/30">
                  {product.image}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{product.name}</h3>
                  <p className="text-2xl font-bold text-blue-400">${product.price.toFixed(2)} USDC</p>
                </div>
              </div>

              {/* Merchant Info */}
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Store className="w-4 h-4" />
                <span>Merchant: {MERCHANT_ADDRESS.slice(0, 6)}...{MERCHANT_ADDRESS.slice(-4)}</span>
              </div>

              {/* Credit Check */}
              <div className="p-4 rounded-xl border-2 border-dashed border-gray-600 bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Your Credit Limit</span>
                  <span className={`font-semibold ${hasEnoughCredit ? 'text-green-400' : 'text-red-400'}`}>
                    {availableCreditNum.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">After Purchase</span>
                  <span className="font-semibold text-gray-300">
                    {remainingCredit.toFixed(2)} USDC
                  </span>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                <p className="text-sm text-blue-300">
                  Repay within 7 days to build credit. Early repayment earns +15 bonus points!
                </p>
              </div>

              {/* Error message */}
              {!hasEnoughCredit && (
                <div className="flex items-center space-x-2 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-sm text-red-300">
                    Insufficient credit limit for this purchase.
                  </p>
                </div>
              )}

              {/* Confirm Button */}
              <MagicBorderButton
                onClick={handleConfirmPurchase}
                disabled={!hasEnoughCredit || isPending}
                className="w-full"
              >
                <span className="text-base">Confirm BNPL Purchase</span>
              </MagicBorderButton>
            </div>
          )}

          {step === 'pending' && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {isPending ? 'Confirm in Wallet' : 'Processing...'}
              </h3>
              <p className="text-gray-400">
                {isPending 
                  ? 'Please confirm the transaction in your wallet'
                  : 'Your purchase is being processed on-chain'
                }
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Purchase Complete!</h3>
              <p className="text-gray-300 mb-2">
                <span className="font-semibold text-green-400">${product.price.toFixed(2)} USDC</span> was transferred to the merchant from the lending pool
              </p>
              <p className="text-sm text-gray-500">
                Repay by {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} to earn +10 trust score
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Transaction Failed</h3>
              <p className="text-gray-400 mb-4">
                {error || 'Something went wrong. Please try again.'}
              </p>
              <button
                onClick={() => setStep('confirm')}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
