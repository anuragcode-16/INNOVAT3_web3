'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useActiveLoan, useHasActiveLoan, getDaysRemaining, getStatusColor, formatAddress } from '@/hooks/useContracts'
import { Clock, DollarSign, Store, AlertCircle, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { ActiveLoanCardSkeleton } from './SkeletonLoaders'

export default function ActiveLoanCard() {
  const [mounted, setMounted] = useState(false)
  const { address } = useAccount()
  const { data: loan, isLoading: loanLoading, refetch: refetchLoan } = useActiveLoan(address)
  const { data: hasLoan, isLoading: hasLoanLoading, refetch: refetchHasLoan } = useHasActiveLoan(address)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Refetch loan data when component mounts
  useEffect(() => {
    if (mounted && address) {
      refetchLoan()
      refetchHasLoan()
    }
  }, [mounted, address, refetchLoan, refetchHasLoan])

  const isLoading = !mounted || loanLoading || hasLoanLoading

  if (isLoading) {
    return <ActiveLoanCardSkeleton />
  }

  // If no active loan
  if (!hasLoan || !loan || loan.isRepaid) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-white/20 hover:border-red-500/50 transition-all duration-300">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <ShoppingBag className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Active Loan</h3>
          <p className="text-sm text-gray-400 mb-4">
            Start shopping to use your credit!
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Shop
          </Link>
        </div>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(loan.dueDate)
  const statusColor = getStatusColor(daysRemaining)
  const amountUSDC = Number(loan.amount) / 1e6
  const amountRepaid = Number(loan.amountRepaid) / 1e6
  const remainingAmount = amountUSDC - amountRepaid
  const progressPercent = (amountRepaid / amountUSDC) * 100
  const dueDate = new Date(Number(loan.dueDate) * 1000)

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-white/20 hover:border-red-500/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Active Loan</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          daysRemaining > 7 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          daysRemaining > 3 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
          'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
        </span>
      </div>

      <div className="space-y-4">
        {/* Amount */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-400">
            <DollarSign className="w-4 h-4" />
            <span>Total Amount</span>
          </div>
          <span className="text-xl font-bold text-white">{amountUSDC.toFixed(2)} USDC</span>
        </div>

        {/* Payment Progress */}
        {amountRepaid > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Payment Progress</span>
              <span className="font-medium text-green-400">{progressPercent.toFixed(0)}% paid</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Paid: ${amountRepaid.toFixed(2)}</span>
              <span>Remaining: ${remainingAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Merchant */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-400">
            <Store className="w-4 h-4" />
            <span>Merchant</span>
          </div>
          <span className="text-sm font-medium text-gray-300">
            {formatAddress(loan.merchant)}
          </span>
        </div>

        {/* Due Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Due Date</span>
          </div>
          <span className={`text-sm font-medium ${statusColor}`}>
            {dueDate.toLocaleDateString()}
          </span>
        </div>

        {/* Warning for near due */}
        {daysRemaining <= 3 && daysRemaining > 0 && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-yellow-300">
              Repay soon to avoid late status!
            </span>
          </div>
        )}

        {/* Early repayment bonus - first 4 days of 7-day loan */}
        {daysRemaining > 3 && (
          <div className="flex items-center space-x-2 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <AlertCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-300">
              Repay now for +15 points (early bonus)!
            </span>
          </div>
        )}

        {/* Repay Button */}
        <Link
          href="/repay"
          className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-2xl hover:scale-105 border border-blue-500/50 group"
        >
          <DollarSign className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
          Repay Now
          <span className="ml-2 opacity-75">→</span>
        </Link>
      </div>
    </div>
  )
}
