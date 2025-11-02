'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Receipt,
  Search,
  Download,
  Eye,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/lib/stores/userStore'

// Transaction interface matching API response
interface Transaction {
  id: string
  type: string
  subscriptionId: string
  accountNumber: string
  transactionId: string
  amount: number
  currency: string
  status: 'pending' | 'verifying' | 'completed' | 'failed'
  submittedAt: string
  verifiedAt: string | null
  notes: string | null
  subscription: {
    id: string
    plan: {
      id: string
      name: string
      price: number
      interval: string
    }
    startDate: string
    endDate: string
    isActive: boolean
  }
}

// API Response interface
interface TransactionsResponse {
  success: boolean
  data: {
    transactions: Transaction[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  message: string
  timestamp: string
}

const statusConfig = {
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  verifying: { color: 'bg-blue-100 text-blue-800', icon: Clock },
  failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
}

export default function TransactionsPage() {
  const { token } = useUserStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'submittedAt' | 'amount' | 'status'>('submittedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    pages: number
  } | null>(null)
  const itemsPerPage = 10

  // Fetch transactions from API
  const fetchTransactions = useCallback(async (page = 1, status?: string, sortByParam?: string, sortOrderParam?: string) => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      })

      if (status && status !== 'all') params.append('status', status)
      if (sortByParam) params.append('sortBy', sortByParam)
      if (sortOrderParam) params.append('sortOrder', sortOrderParam)

      const response = await fetch(`/api/user/transactions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data: TransactionsResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transactions')
      }

      if (data.success && data.data) {
        setTransactions(data.data.transactions)
        setPagination(data.data.pagination)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching transactions')
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  // Initial load
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Filter transactions locally (for search)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.subscription.plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.accountNumber.includes(searchTerm)

      return matchesSearch
    })
  }, [transactions, searchTerm])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSort = (field: 'submittedAt' | 'amount' | 'status') => {
    const newSortOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(field)
    setSortOrder(newSortOrder)
    fetchTransactions(currentPage, statusFilter, field, newSortOrder)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
    fetchTransactions(1, status, sortBy, sortOrder)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchTransactions(page, statusFilter, sortBy, sortOrder)
  }

  const totalAmount = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">View and manage all your payment transactions</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalAmount, 'USD')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.filter(t => t.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.filter(t => t.status === 'failed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verifying">Verifying</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading transactions...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-2">
                <p className="text-red-600 font-medium">Error loading transactions</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Receipt className="h-8 w-8 text-gray-400" />
              <div className="ml-2">
                <p className="text-gray-600 font-medium">No transactions found</p>
                <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('submittedAt')}
                        className="h-auto p-0 font-semibold hover:bg-transparent text-xs"
                      >
                        Date
                        {sortBy === 'submittedAt' && (
                          sortOrder === 'asc' ? <ArrowUp className="ml-1 h-3 w-3 inline" /> : <ArrowDown className="ml-1 h-3 w-3 inline" />
                        )}
                      </Button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan & Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('amount')}
                        className="h-auto p-0 font-semibold hover:bg-transparent text-xs"
                      >
                        Amount
                        {sortBy === 'amount' && (
                          sortOrder === 'asc' ? <ArrowUp className="ml-1 h-3 w-3 inline" /> : <ArrowDown className="ml-1 h-3 w-3 inline" />
                        )}
                      </Button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction: Transaction) => {
                    const statusInfo = statusConfig[transaction.status]
                    const StatusIcon = statusInfo.icon

                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{formatDate(transaction.submittedAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{transaction.subscription.plan.name}</p>
                            <p className="text-sm text-gray-500">TXN: {transaction.transactionId}</p>
                            <p className="text-xs text-gray-400">{transaction.subscription.plan.interval} plan</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">****{transaction.accountNumber.slice(-4)}</p>
                            <p className="text-xs text-gray-500">Bank Transfer</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={cn('flex items-center space-x-1 w-fit', statusInfo.color)}>
                            <StatusIcon className="h-3 w-3" />
                            <span className="capitalize text-xs">{transaction.status}</span>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={cn(
                            'text-sm font-semibold',
                            transaction.amount < 0 ? 'text-red-600' : 'text-gray-900'
                          )}>
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download Receipt
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && !loading && !error && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}