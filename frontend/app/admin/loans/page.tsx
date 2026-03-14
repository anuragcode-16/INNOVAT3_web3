'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useAllLoans } from '@/hooks/useContracts'
import { 
  Users, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Calendar,
  Download
} from 'lucide-react'
import Link from 'next/link'

type FilterStatus = 'all' | 'active' | 'repaid' | 'overdue'

export default function AdminLoansPage() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const isAdmin = useIsAdmin()
  
  const { data: allLoans = [], isLoading } = useAllLoans()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')

  // Redirect non-admin users
  useEffect(() => {
    if (isConnected && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isConnected, isAdmin, router])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="text-center space-y-6">
          <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">This wallet is not authorized for admin access</p>
        </div>
      </div>
    )
  }

  // Process and filter loans
  const processedLoans = allLoans.map(loan => {
    const dueDate = new Date(Number(loan.dueDate) * 1000)
    const isRepaid = loan.isRepaid
    const isActive = !isRepaid
    const isOverdue = isActive && dueDate < new Date()
    
    return {
      ...loan,
      isOverdue,
      isRepaid,
      isActive,
      status: isRepaid ? 'repaid' : isOverdue ? 'overdue' : isActive ? 'active' : 'unknown'
    }
  })

  // Apply filters
  const filteredLoans = processedLoans.filter(loan => {
    // Search filter
    const matchesSearch = loan.borrower.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && loan.isActive && !loan.isOverdue) ||
      (statusFilter === 'repaid' && loan.isRepaid) ||
      (statusFilter === 'overdue' && loan.isOverdue)
    
    return matchesSearch && matchesStatus
  })

  // Sort loans
  const sortedLoans = [...filteredLoans].sort((a, b) => {
    if (sortBy === 'date') {
      return Number(b.createdAt) - Number(a.createdAt)
    } else {
      return Number(b.amount) - Number(a.amount)
    }
  })

  // Stats
  const stats = {
    total: allLoans.length,
    active: processedLoans.filter(l => l.isActive && !l.isOverdue).length,
    repaid: processedLoans.filter(l => l.isRepaid).length,
    overdue: processedLoans.filter(l => l.isOverdue).length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back Link */}
        <Link 
          href="/admin/dashboard" 
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3 iceberg-regular">
              <Users className="w-8 h-8" />
              <span>All Loans</span>
            </h1>
            <p className="text-gray-600 mt-1">Manage and monitor all protocol loans</p>
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-xl border transition-all ${
              statusFilter === 'all' 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </button>
          
          <button
            onClick={() => setStatusFilter('active')}
            className={`p-4 rounded-xl border transition-all ${
              statusFilter === 'active' 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.active}</p>
          </button>
          
          <button
            onClick={() => setStatusFilter('repaid')}
            className={`p-4 rounded-xl border transition-all ${
              statusFilter === 'repaid' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className="text-sm text-gray-500">Repaid</p>
            <p className="text-2xl font-bold text-green-600">{stats.repaid}</p>
          </button>
          
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`p-4 rounded-xl border transition-all ${
              statusFilter === 'overdue' 
                ? 'bg-red-50 border-red-200' 
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by borrower address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-gray-500">Loading loans...</p>
            </div>
          ) : sortedLoans.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No loans match your filters' 
                  : 'No loans created yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500 text-sm">
                    <th className="px-6 py-4 font-medium">#</th>
                    <th className="px-6 py-4 font-medium">Borrower</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 font-medium">Due Date</th>
                    <th className="px-6 py-4 font-medium">Repaid</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLoans.map((loan, index) => {
                    const amount = Number(loan.amount) / 1e6
                    const createdAt = new Date(Number(loan.createdAt) * 1000)
                    const dueDate = new Date(Number(loan.dueDate) * 1000)
                    const repaidAt = loan.repaidAt > 0 ? new Date(Number(loan.repaidAt) * 1000) : null

                    return (
                      <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
                          </code>
                        </td>
                        <td className="px-6 py-4 font-semibold">${amount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{createdAt.toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{dueDate.toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {repaidAt ? repaidAt.toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                            loan.isRepaid 
                              ? 'bg-green-100 text-green-700' 
                              : loan.isOverdue 
                                ? 'bg-red-100 text-red-700'
                                : loan.isActive 
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                          }`}>
                            {loan.isRepaid ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Repaid</span>
                              </>
                            ) : loan.isOverdue ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Overdue</span>
                              </>
                            ) : loan.isActive ? (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>Active</span>
                              </>
                            ) : (
                              <span>Unknown</span>
                            )}
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

        {/* Summary */}
        {sortedLoans.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
            Showing {sortedLoans.length} of {allLoans.length} loans
            {statusFilter !== 'all' && ` • Filtered by: ${statusFilter}`}
          </div>
        )}
      </div>
    </div>
  )
}
