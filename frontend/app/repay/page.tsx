'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { parseUnits } from 'viem'
import { useRouter } from 'next/navigation'
import { 
  useActiveLoan, 
  useRepayLoan, 
  useApproveUSDC, 
  useUSDCAllowance, 
  useHasActiveLoan,
  useRemainingBalance,
  useMinInstallmentAmount,
  useMakeInstallmentPayment,
  useUSDCBalance
} from '@/hooks/useContracts'
import { BNPL_CORE_ADDRESS, USDC_ADDRESS } from '@/lib/constants'
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  Wallet,
  DollarSign,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import MagicBorderButton from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function RepayPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { data: activeLoan, isLoading: loanLoading, refetch: refetchLoan } = useActiveLoan(address)
  const { data: hasLoan = false, isLoading: hasLoanLoading } = useHasActiveLoan(address)
  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useUSDCAllowance(address, BNPL_CORE_ADDRESS as `0x${string}`)
  const { data: remainingBalance = BigInt(0), refetch: refetchRemaining } = useRemainingBalance(address)
  const { data: minInstallment = BigInt(0) } = useMinInstallmentAmount(address)
  const { data: usdcBalance = BigInt(0) } = useUSDCBalance(address)
  
  const { writeContractAsync: approveUSDC, isPending: isApproving } = useApproveUSDC()
  const { writeContractAsync: repayLoan, isPending: isRepaying } = useRepayLoan()
  const { writeContractAsync: makeInstallment, isPending: isPayingInstallment } = useMakeInstallmentPayment()
  
  const [step, setStep] = useState<'loading' | 'no-loan' | 'approve' | 'repay' | 'success'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [paymentMode, setPaymentMode] = useState<'full' | 'installment'>('full')
  const [installmentAmount, setInstallmentAmount] = useState('')

  const hasActiveLoan = hasLoan && activeLoan && !activeLoan.isRepaid
  const totalAmount = hasActiveLoan ? Number(activeLoan.amount) / 1e6 : 0
  const amountRepaid = hasActiveLoan ? Number(activeLoan.amountRepaid) / 1e6 : 0
  const remaining = Number(remainingBalance) / 1e6
  const minInstallmentAmount = Number(minInstallment) / 1e6
  const userBalance = Number(usdcBalance) / 1e6
  
  const dueDate = hasActiveLoan ? new Date(Number(activeLoan.dueDate) * 1000) : new Date()
  
  // Calculate if early payment (within first 4 days of 7-day loan)
  const now = new Date()
  const earlyThreshold = new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000)
  const isEarlyPayment = now < earlyThreshold
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysLeft < 0
  
  // Calculate installment number (1, 2, or 3)
  const installmentNumber = amountRepaid === 0 ? 1 : amountRepaid <= totalAmount / 3 ? 2 : 3

  // Determine step
  useEffect(() => {
    if (loanLoading || hasLoanLoading) {
      setStep('loading')
    } else if (!hasActiveLoan) {
      setStep('no-loan')
    } else {
      const neededAmount = paymentMode === 'full' 
        ? remainingBalance 
        : parseUnits(installmentAmount || '0', 6)
      
      if (allowance < neededAmount) {
        setStep('approve')
      } else {
        setStep('repay')
      }
    }
  }, [loanLoading, hasActiveLoan, allowance, remainingBalance, paymentMode, installmentAmount, hasLoanLoading])

  // Redirect to dashboard after successful repayment
  useEffect(() => {
    if (step === 'success') {
      const redirectTimer = setTimeout(() => {
        router.push('/dashboard')
      }, 3000) // 3 second delay to show success message

      return () => clearTimeout(redirectTimer)
    }
  }, [step, router])

  const handleApprove = async () => {
    setError(null)
    const amount = paymentMode === 'full' 
      ? remainingBalance 
      : parseUnits(installmentAmount || '0', 6)
    
    // Check if user has enough USDC
    if (usdcBalance < amount) {
      setError(`Insufficient USDC balance. You need ${Number(amount) / 1e6} USDC but only have ${userBalance} USDC.`)
      toast.error('Insufficient USDC balance!')
      return
    }
    
    const toastId = toast.loading('Approving USDC...')
    
    try {
      const tx = await approveUSDC({
        address: USDC_ADDRESS as `0x${string}`,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            outputs: [{ name: '', type: 'bool' }],
          },
        ],
        functionName: 'approve',
        args: [BNPL_CORE_ADDRESS as `0x${string}`, amount],
      })
      
      console.log('Approval transaction hash:', tx)
      toast.success('USDC approved! You can now make your payment.', { id: toastId })
      
      // Wait for allowance to update
      await new Promise(resolve => setTimeout(resolve, 3000))
      await refetchAllowance()
      setStep('repay')
    } catch (err) {
      console.error('Approval failed:', err)
      const errorMsg = 'Failed to approve USDC. Please try again.'
      toast.error(errorMsg, { id: toastId })
      setError(errorMsg)
    }
  }

  const handleFullRepay = async () => {
    setError(null)
    
    // Check if user has enough USDC
    if (usdcBalance < remainingBalance) {
      setError(`Insufficient USDC balance. You need ${remaining} USDC but only have ${userBalance} USDC.`)
      toast.error('Insufficient USDC balance!')
      return
    }
    
    // Check allowance
    if (allowance < remainingBalance) {
      setError('Please approve USDC first')
      toast.error('Please approve USDC first')
      setStep('approve')
      return
    }
    
    const toastId = toast.loading('Processing full repayment...')
    
    try {
      const tx = await repayLoan({
        address: BNPL_CORE_ADDRESS as `0x${string}`,
        abi: [
          {
            name: 'repayLoan',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [],
            outputs: [],
          },
        ],
        functionName: 'repayLoan',
        args: [],
      })
      
      console.log('Repayment transaction hash:', tx)
      const bonusMsg = isEarlyPayment ? ' +15 Trust Score! 🎉' : ' +10 Trust Score!'
      toast.success(`Loan fully repaid!${bonusMsg}`, { id: toastId })
      
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 2000))
      await refetchLoan()
      await refetchRemaining()
      setStep('success')
    } catch (err) {
      console.error('Repayment failed:', err)
      const errorMsg = 'Failed to repay loan. Please try again.'
      toast.error(errorMsg, { id: toastId })
      setError(errorMsg)
    }
  }

  const handleInstallmentPayment = async () => {
    setError(null)
    const amount = parseUnits(installmentAmount || '0', 6)
    
    if (amount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    // Check if user has enough USDC
    if (usdcBalance < amount) {
      setError(`Insufficient USDC balance. You need ${installmentAmount} USDC but only have ${userBalance} USDC.`)
      toast.error('Insufficient USDC balance!')
      return
    }
    
    // Check allowance
    if (allowance < amount) {
      setError('Please approve USDC first')
      toast.error('Please approve USDC first')
      setStep('approve')
      return
    }
    
    const toastId = toast.loading(`Processing payment of ${installmentAmount} USDC...`)
    
    try {
      const tx = await makeInstallment({
        address: BNPL_CORE_ADDRESS as `0x${string}`,
        abi: [
          {
            name: 'makeInstallmentPayment',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [{ name: '_amount', type: 'uint256' }],
            outputs: [],
          },
        ],
        functionName: 'makeInstallmentPayment',
        args: [amount],
      })
      
      console.log('Installment payment transaction hash:', tx)
      toast.success(`Payment of ${installmentAmount} USDC successful!`, { id: toastId })
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      await refetchLoan()
      await refetchRemaining()
      await refetchAllowance()
      
      // Check if fully paid
      const newRemaining = Number(remainingBalance) - Number(amount)
      if (newRemaining <= 0) {
        setStep('success')
      } else {
        setInstallmentAmount('')
      }
    } catch (err) {
      console.error('Payment failed:', err)
      const errorMsg = 'Payment failed. Please try again.'
      toast.error(errorMsg, { id: toastId })
      setError(errorMsg)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Connect Your Wallet</h1>
          <p className="text-gray-600">Please connect your wallet to repay your loan</p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back Link */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold iceberg-regular">Repay Loan</h1>
                <p className="text-blue-100">Complete your repayment</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Loading State */}
            {step === 'loading' && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
                <p className="mt-4 text-gray-600">Loading loan details...</p>
              </div>
            )}

            {/* No Active Loan */}
            {step === 'no-loan' && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Loan</h2>
                <p className="text-gray-600 mb-6">You don&apos;t have any outstanding loans to repay.</p>
                <Link
                  href="/shop"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold"
                >
                  <span>Go Shopping</span>
                </Link>
              </div>
            )}

            {/* Loan Details (shown for approve and repay steps) */}
            {(step === 'approve' || step === 'repay') && (
              <div className="space-y-6">
                {/* Loan Summary Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Total Loan</p>
                    <p className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Amount Paid</p>
                    <p className="text-xl font-bold text-green-600">${amountRepaid.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className="text-xl font-bold text-blue-600">${remaining.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Your Balance</p>
                    <p className="text-xl font-bold text-gray-900">${userBalance.toFixed(2)}</p>
                  </div>
                </div>

                {/* USDC Balance Warning */}
                {userBalance < remaining && (
                  <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-xl text-red-700">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Insufficient USDC Balance!</p>
                      <p className="text-sm mt-1">
                        You need {remaining.toFixed(2)} USDC to repay but only have {userBalance.toFixed(2)} USDC.
                        <br />
                        Get USDC from: <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="underline">Circle Faucet</a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {amountRepaid > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Repayment Progress</span>
                      <span className="font-medium">{((amountRepaid / totalAmount) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${(amountRepaid / totalAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Due Date */}
                <div className={`flex items-center space-x-3 p-4 rounded-xl ${
                  isOverdue ? 'bg-red-50 text-red-700' : 
                  daysLeft <= 2 ? 'bg-yellow-50 text-yellow-700' : 
                  'bg-green-50 text-green-700'
                }`}>
                  <Clock className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {isOverdue ? 'Overdue!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
                    </p>
                    <p className="text-sm opacity-75">Due: {dueDate.toLocaleDateString()}</p>
                  </div>
                  {isEarlyPayment && !isOverdue && (
                    <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                      Early Bonus +15
                    </span>
                  )}
                </div>

                {/* Payment Mode Toggle */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentMode('full')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      paymentMode === 'full' 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Zap className={`w-6 h-6 mx-auto mb-2 ${paymentMode === 'full' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className={`font-semibold text-sm ${paymentMode === 'full' ? 'text-blue-600' : 'text-gray-700'}`}>
                      Pay Full
                    </p>
                    <p className="text-xs text-gray-500">${remaining.toFixed(2)}</p>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMode('installment')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      paymentMode === 'installment' 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className={`w-6 h-6 mx-auto mb-2 ${paymentMode === 'installment' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className={`font-semibold text-sm ${paymentMode === 'installment' ? 'text-blue-600' : 'text-gray-700'}`}>
                      Installments
                    </p>
                    <p className="text-xs text-gray-500">Min: ${minInstallmentAmount.toFixed(2)}</p>
                  </button>
                </div>

                {/* Installment Amount Input */}
                {paymentMode === 'installment' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Amount (USDC)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={installmentAmount}
                        onChange={(e) => setInstallmentAmount(e.target.value)}
                        placeholder={`Min: ${minInstallmentAmount.toFixed(2)}`}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        step="0.01"
                        min={minInstallmentAmount}
                        max={remaining}
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setInstallmentAmount(minInstallmentAmount.toFixed(2))}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        1/3 (${minInstallmentAmount.toFixed(2)})
                      </button>
                      <button
                        onClick={() => setInstallmentAmount((remaining / 2).toFixed(2))}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        1/2 (${(remaining / 2).toFixed(2)})
                      </button>
                      <button
                        onClick={() => setInstallmentAmount(remaining.toFixed(2))}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        Full (${remaining.toFixed(2)})
                      </button>
                    </div>
                  </div>
                )}

                {/* Step Indicator */}
                <div className="flex items-center justify-center space-x-4">
                  <div className={`flex items-center space-x-2 ${step === 'approve' ? 'text-blue-600' : 'text-green-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step === 'approve' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {step === 'approve' ? '1' : <CheckCircle className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-medium">Approve</span>
                  </div>
                  <div className="w-8 h-0.5 bg-gray-200" />
                  <div className={`flex items-center space-x-2 ${step === 'repay' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step === 'repay' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      2
                    </div>
                    <span className="text-sm font-medium">Pay</span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Action Button */}
                {step === 'approve' ? (
                  <MagicBorderButton
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="w-full"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      {isApproving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4" />
                          <span>Approve USDC</span>
                        </>
                      )}
                    </span>
                  </MagicBorderButton>
                ) : paymentMode === 'full' ? (
                  <MagicBorderButton
                    onClick={handleFullRepay}
                    disabled={isRepaying}
                    className="w-full"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      {isRepaying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Pay ${remaining.toFixed(2)} USDC</span>
                        </>
                      )}
                    </span>
                  </MagicBorderButton>
                ) : (
                  <MagicBorderButton
                    onClick={handleInstallmentPayment}
                    disabled={isPayingInstallment || !installmentAmount || parseFloat(installmentAmount) <= 0}
                    className="w-full"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      {isPayingInstallment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          <span>Pay Installment #{installmentNumber}</span>
                        </>
                      )}
                    </span>
                  </MagicBorderButton>
                )}

                {/* Info Note */}
                <div className="text-center text-sm text-gray-500">
                  <p>💡 Pay early (within first 4 days) for +15 bonus!</p>
                </div>
              </div>
            )}

            {/* Success State */}
            {step === 'success' && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-2">Your loan has been repaid.</p>
                <p className="text-green-600 font-semibold mb-2">
                  {isEarlyPayment ? '+15 Trust Score points earned!' : '+10 Trust Score points earned!'}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Redirecting to dashboard in 3 seconds...
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    View Dashboard Now
                  </Link>
                  <Link
                    href="/shop"
                    className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-500 transition-all"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
