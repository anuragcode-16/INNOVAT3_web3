// Skeleton loader components for loading states

export function CardSkeleton() {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-sm p-6 border border-white/20 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-gray-700 rounded w-2/3 mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/20 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
      </div>
      <div className="h-8 bg-gray-700 rounded w-3/4"></div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-700 rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-700 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-700 rounded w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-700 rounded w-28"></div>
      </td>
    </tr>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-sm border border-white/20 overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-700"></div>
      <div className="p-6">
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-4"></div>
        <div className="h-10 bg-gray-700 rounded"></div>
      </div>
    </div>
  )
}

export function TrustScoreCardSkeleton() {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-700 rounded w-32"></div>
        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
      </div>
      <div className="flex items-center justify-center mb-6">
        <div className="w-32 h-32 bg-gray-700 rounded-full"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  )
}

export function ActiveLoanCardSkeleton() {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-700 rounded w-32"></div>
        <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
        </div>
        <div className="h-10 bg-gray-700 rounded mt-4"></div>
      </div>
    </div>
  )
}
