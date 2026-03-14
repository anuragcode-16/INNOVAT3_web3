'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import {
  useContractBalance,
  useAllLoans,
  useTotalLiquidityDeposited,
  useTotalLiquidityWithdrawn
} from '@/hooks/useContracts'
import {
  LayoutDashboard,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Shield
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const isAdmin = useIsAdmin()

  const { data: contractBalance = BigInt(0) } = useContractBalance()
  const { data: allLoans = [] } = useAllLoans()
  const { data: totalDeposited = BigInt(0) } = useTotalLiquidityDeposited()
  const { data: totalWithdrawn = BigInt(0) } = useTotalLiquidityWithdrawn()

  // Redirect non-admin users
  useEffect(() => {
    if (isConnected && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isConnected, isAdmin, router])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6">
          <Shield className="w-16 h-16 mx-auto text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Access Required</h1>
          <p className="text-gray-600">Please connect with the admin wallet</p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6">
          <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">This wallet is not authorized for admin access</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
          >
            <span>Go to User Dashboard</span>
          </Link>
        </div>
      </div>
    )
  }

  // Calculate stats
  const balance = Number(contractBalance) / 1e6
  const deposited = Number(totalDeposited) / 1e6
  const withdrawn = Number(totalWithdrawn) / 1e6

  const activeLoans = allLoans.filter(l => !l.isRepaid)
  const completedLoans = allLoans.filter(l => l.isRepaid)
  const overdueLoans = activeLoans.filter(l => {
    const dueDate = new Date(Number(l.dueDate) * 1000)
    return dueDate < new Date()
  })

  const totalLent = allLoans.reduce((sum, l) => sum + Number(l.amount), 0) / 1e6
  const totalRepaid = completedLoans.reduce((sum, l) => sum + Number(l.amount), 0) / 1e6

  return (
    <div className="min-h-screen  py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3 iceberg-regular">
              <LayoutDashboard className="w-8 h-8" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-1">Manage OnStream BNPL Protocol</p>
          </div>
          <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Contract Balance</p>
                <p className="text-2xl font-bold text-gray-900">${balance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Loans</p>
                <p className="text-2xl font-bold text-gray-900">{allLoans.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Lent</p>
                <p className="text-2xl font-bold text-gray-900">${totalLent.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Repaid</p>
                <p className="text-2xl font-bold text-gray-900">${totalRepaid.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Status Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Active Loans</h3>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-4xl font-bold text-yellow-600">{activeLoans.length}</p>
            <p className="text-sm text-gray-500 mt-1">
              ${(activeLoans.reduce((sum, l) => sum + Number(l.amount), 0) / 1e6).toFixed(2)} USDC outstanding
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Completed</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-4xl font-bold text-green-600">{completedLoans.length}</p>
            <p className="text-sm text-gray-500 mt-1">
              {allLoans.length > 0 ? ((completedLoans.length / allLoans.length) * 100).toFixed(1) : 0}% completion rate
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Overdue</h3>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-4xl font-bold text-red-600">{overdueLoans.length}</p>
            <p className="text-sm text-gray-500 mt-1">
              ${(overdueLoans.reduce((sum, l) => sum + Number(l.amount), 0) / 1e6).toFixed(2)} USDC at risk
            </p>
          </div>
        </div>

        {/* Liquidity Info */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">Liquidity Management</h3>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-sm opacity-80">Total Deposited</p>
                  <p className="text-2xl font-bold">${deposited.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Total Withdrawn</p>
                  <p className="text-2xl font-bold">${withdrawn.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Available Balance</p>
                  <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <Link
              href="/admin/liquidity"
              className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <span>Manage Liquidity</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Recent Loans */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Loans</h3>
            <Link
              href="/admin/loans"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {allLoans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No loans created yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-3 font-medium">Borrower</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allLoans.slice().reverse().slice(0, 5).map((loan, index) => {
                    const amount = Number(loan.amount) / 1e6
                    const createdAt = new Date(Number(loan.createdAt) * 1000)
                    const dueDate = new Date(Number(loan.dueDate) * 1000)
                    const isRepaid = loan.isRepaid
                    const isActive = !loan.isRepaid
                    const isOverdue = !isRepaid && dueDate < new Date()

                    return (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-4">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
                          </code>
                        </td>
                        <td className="py-4 font-medium">${amount.toFixed(2)}</td>
                        <td className="py-4 text-gray-600">{createdAt.toLocaleDateString()}</td>
                        <td className="py-4 text-gray-600">{dueDate.toLocaleDateString()}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isRepaid
                              ? 'bg-green-100 text-green-700'
                              : isOverdue
                                ? 'bg-red-100 text-red-700'
                                : isActive
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}>
                            {isRepaid ? 'Repaid' : isOverdue ? 'Overdue' : isActive ? 'Active' : 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/admin/loans"
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Loans</h3>
                <p className="text-sm text-gray-500">View all loans and their status</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link
            href="/admin/liquidity"
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Liquidity Pool</h3>
                <p className="text-sm text-gray-500">Deposit or withdraw USDC</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  )
}
