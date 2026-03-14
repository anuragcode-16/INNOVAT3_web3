'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useCreditLimit, useHasActiveLoan } from '@/hooks/useContracts'
import ProductCard from '@/components/ProductCard'
import CheckoutModal from '@/components/CheckoutModal'
import { ShoppingBag, Search, AlertCircle, Wallet } from 'lucide-react'
import Link from 'next/link'

// Sample products - in real app would come from backend/IPFS
const products = [
  {
    id: '1',
    name: 'Digital Artwork NFT',
    description: 'Exclusive digital art piece by emerging Web3 artist',
    price: 0.99,
    image: '/shop_img/digital art.jpeg',
    category: 'Art',
  },
  {
    id: '2',
    name: 'Premium Domain Name',
    description: 'Short, memorable .eth domain for your identity',
    price: 1.49,
    image: '/shop_img/primium domain.jpeg',
    category: 'Domains',
  },
  {
    id: '3',
    name: 'Music Album Access',
    description: 'Lifetime access to exclusive album collection',
    price: 1.99,
    image: '/shop_img/music album.jpeg',
    category: 'Music',
  },
  {
    id: '4',
    name: 'Gaming Skin Bundle',
    description: 'Rare skins for popular blockchain games',
    price: 2.49,
    image: '/shop_img/game.jpeg',
    category: 'Gaming',
  },
  {
    id: '5',
    name: 'Course Access Pass',
    description: 'Full Web3 development bootcamp access',
    price: 2.99,
    image: '/shop_img/course access.jpeg',
    category: 'Education',
  },
  {
    id: '6',
    name: 'Coffee Subscription',
    description: 'One month of premium coffee delivery',
    price: 1.29,
    image: '/shop_img/coffee subs.jpeg',
    category: 'Lifestyle',
  },
  {
    id: '7',
    name: 'VIP Event Ticket',
    description: 'Access to exclusive Web3 conference',
    price: 2.79,
    image: '/shop_img/vip tickets.jpeg',
    category: 'Events',
  },
  {
    id: '8',
    name: 'E-Book Bundle',
    description: 'Collection of crypto and blockchain books',
    price: 0.79,
    image: '/shop_img/ebook.jpeg',
    category: 'Education',
  },
]

const categories = ['All', 'Art', 'Domains', 'Music', 'Gaming', 'Education', 'Lifestyle', 'Events']

export default function ShopPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { data: creditLimit = BigInt(0), isLoading: creditLoading, refetch: refetchCredit } = useCreditLimit(address)
  const { data: hasActiveLoan = false, isLoading: loanLoading, refetch: refetchLoan } = useHasActiveLoan(address)
  
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const handlePurchaseSuccess = () => {
    // Refetch data and redirect to dashboard
    refetchCredit()
    refetchLoan()
    router.push('/dashboard')
  }

  useEffect(() => {
    document.body.style.margin = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    return () => {
      document.body.style.margin = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
    };
  }, []);

  const formattedCreditLimit = Number(creditLimit) / 1e6

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleBuyNow = (product: typeof products[0]) => {
    console.log('Buy Now clicked for:', product.name)
    console.log('isConnected:', isConnected)
    console.log('hasActiveLoan:', hasActiveLoan)
    setSelectedProduct(product)
    setIsCheckoutOpen(true)
  }

  // Button is disabled if: not connected, or has active loan, or still loading data
  const isButtonDisabled = !isConnected || hasActiveLoan === true

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold flex items-center space-x-3 iceberg-regular">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span>Shop</span>
            </h1>
            <p className="text-gray-300 mt-2">Browse products and buy now, pay later with your Web3 credit</p>
          </div>

          {isConnected && (
            <div className="bg-black border  rounded-xl px-6 py-3">
              <p className="text-sm text-gray-400">Available Credit</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">
                ${formattedCreditLimit.toFixed(2)} USDC
              </p>
            </div>
          )}
        </div>

        {/* Active Loan Warning */}
        {hasActiveLoan && (
          <div className="bg-black border border-yellow-800/50 rounded-xl p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-300">You have an active loan</p>
              <p className="text-sm text-yellow-400">
                Please repay your current loan before making a new purchase.{' '}
                <Link href="/repay" className="font-medium text-yellow-300 hover:text-yellow-200 transition-colors">Go to Repay</Link>
              </p>
            </div>
          </div>
        )}

        {/* Not Connected Warning */}
        {!isConnected && (
          <div className="bg-black border border-blue-900/50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-blue-300 mb-2 text-lg">Connect your wallet to shop</h3>
            <p className="text-sm text-blue-400 mb-6">You need to connect your wallet to use Buy Now, Pay Later</p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-8 bg-black border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-800 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <div className="relative">
              <select
                className="block w-full sm:w-48 px-3 py-2.5 border border-gray-800 rounded-lg bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-black border border-gray-800 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-white text-xl mb-2">No products found</h3>
            <p className="text-sm text-gray-400 mb-6">Try adjusting your search or filters</p>
            <button 
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all border border-blue-500/30"
            >
              Clear all filters
            </button>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuyNow={handleBuyNow}
                disabled={isButtonDisabled}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-700">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">No products found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              We couldn't find any products matching your search. Try adjusting your filters.
            </p>
          </div>
        )}

        {/* Checkout Modal */}
        {selectedProduct && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => {
              setIsCheckoutOpen(false)
              setSelectedProduct(null)
            }}
            product={selectedProduct}
            onSuccess={handlePurchaseSuccess}
          />
        )}
      </div>
      </div>
    </div>
  )
}
